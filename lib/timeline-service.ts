import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  chatMessages,
  evidenceDocuments,
  studentCaseProgress,
  studentClues,
  studentTimelineProgress,
  timelineEvents,
} from "@/lib/schema";

export async function getUnlockedTimelineEvents(studentDbId: string, caseId: string) {
  const db = getDb();

  // 1. Get all student clues (unlocked critical clues)
  const clues = await db
    .select()
    .from(studentClues)
    .where(and(eq(studentClues.studentId, studentDbId), eq(studentClues.caseId, caseId)));
  const clueDocIds = new Set(clues.map((c) => c.evidenceDocumentId));

  // 2. Get all assistant chat message citations to see which evidence documents were cited
  const messages = await db
    .select({ citations: chatMessages.citations })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.studentId, studentDbId),
        eq(chatMessages.caseId, caseId),
        eq(chatMessages.role, "assistant"),
      ),
    );

  const citedDocTitles = new Set<string>();
  for (const msg of messages) {
    const citations = Array.isArray(msg.citations) ? (msg.citations as Record<string, unknown>[]) : [];
    for (const cit of citations) {
      if (typeof cit.title === "string") {
        citedDocTitles.add(cit.title);
      }
    }
  }

  // 3. Get all timeline events for this case
  const events = await db
    .select({
      id: timelineEvents.id,
      timestamp: timelineEvents.timestamp,
      description: timelineEvents.description,
      evidenceId: timelineEvents.evidenceId,
      critical: timelineEvents.critical,
      orderIndex: timelineEvents.orderIndex,
      evidenceTitle: evidenceDocuments.title,
    })
    .from(timelineEvents)
    .innerJoin(evidenceDocuments, eq(timelineEvents.evidenceId, evidenceDocuments.id))
    .where(eq(timelineEvents.caseId, caseId));

  // 4. Mark events as unlocked if their associated document has been cited or is associated with an unlocked clue
  return events.map((event) => {
    const isUnlocked = clueDocIds.has(event.evidenceId) || citedDocTitles.has(event.evidenceTitle);
    return {
      id: event.id,
      timestamp: event.timestamp,
      description: isUnlocked ? event.description : "Locked Event - Continue investigating to uncover this piece of the timeline.",
      critical: event.critical,
      orderIndex: event.orderIndex,
      unlocked: isUnlocked,
    };
  });
}

export function calculateTimelineScore(correctCount: number, totalCount: number) {
  // +10 for correct placement, -2 for incorrect placement, minimum 0
  const incorrectCount = totalCount - correctCount;
  const score = correctCount * 10 - incorrectCount * 2;
  return Math.max(0, score);
}

export async function validateTimeline(studentDbId: string, caseId: string, eventOrder: string[]) {
  const db = getDb();

  // 1. Fetch all events for the case
  const events = await db.select().from(timelineEvents).where(eq(timelineEvents.caseId, caseId));
  if (events.length === 0) {
    return { error: "No timeline events found for this case." };
  }

  const sortedEvents = [...events].sort((a, b) => a.orderIndex - b.orderIndex);
  const trueOrderIds = sortedEvents.map((e) => e.id);

  // 2. Count correct positions
  let correctCount = 0;
  for (let i = 0; i < trueOrderIds.length; i++) {
    if (eventOrder[i] === trueOrderIds[i]) {
      correctCount++;
    }
  }

  const totalCount = trueOrderIds.length;
  const timelineScore = calculateTimelineScore(correctCount, totalCount);
  const accuracyPercent = Math.round((correctCount / totalCount) * 100);

  // 3. Load or create student's timeline progress record
  let [progressRecord] = await db
    .select()
    .from(studentTimelineProgress)
    .where(
      and(
        eq(studentTimelineProgress.studentId, studentDbId),
        eq(studentTimelineProgress.caseId, caseId),
      ),
    )
    .limit(1);

  if (!progressRecord) {
    [progressRecord] = await db
      .insert(studentTimelineProgress)
      .values({
        studentId: studentDbId,
        caseId,
        eventOrder,
        submitted: true,
        score: timelineScore,
      })
      .returning();
  } else {
    await db
      .update(studentTimelineProgress)
      .set({
        eventOrder,
        submitted: true,
        score: timelineScore,
        updatedAt: new Date(),
      })
      .where(eq(studentTimelineProgress.id, progressRecord.id));
  }

  // 4. Update timeline accuracy & score inside studentCaseProgress
  const [progress] = await db
    .select()
    .from(studentCaseProgress)
    .where(and(eq(studentCaseProgress.studentId, studentDbId), eq(studentCaseProgress.caseId, caseId)))
    .limit(1);

  let clueUnlocked = false;
  if (progress) {
    const scoreDiff = timelineScore - (progressRecord?.submitted ? progressRecord.score : 0);
    await db
      .update(studentCaseProgress)
      .set({
        score: progress.score + scoreDiff,
        timelineAccuracy: accuracyPercent,
      })
      .where(eq(studentCaseProgress.id, progress.id));

    // 5. Unlock special timeline clue if 100% correct
    if (correctCount === totalCount) {
      const clueKey = "timeline_reconstructed";
      const [existingClue] = await db
        .select()
        .from(studentClues)
        .where(
          and(
            eq(studentClues.studentId, studentDbId),
            eq(studentClues.caseId, caseId),
            eq(studentClues.clueKey, clueKey),
          ),
        )
        .limit(1);

      if (!existingClue) {
        // Associate with any document of the case (usually critical if possible, or first one)
        const [firstDoc] = await db
          .select()
          .from(evidenceDocuments)
          .where(eq(evidenceDocuments.caseId, caseId))
          .limit(1);

        if (firstDoc) {
          await db.insert(studentClues).values({
            studentId: studentDbId,
            caseId,
            clueKey,
            evidenceDocumentId: firstDoc.id,
          });
          clueUnlocked = true;

          // Reward for clue unlock
          await db
            .update(studentCaseProgress)
            .set({
              score: progress.score + scoreDiff + 10, // +10 points for unlocking the timeline master clue
              criticalCluesFound: progress.criticalCluesFound + 1,
            })
            .where(eq(studentCaseProgress.id, progress.id));
        }
      }
    }
  }

  return {
    isCorrect: correctCount === totalCount,
    correctCount,
    totalCount,
    score: timelineScore,
    accuracy: accuracyPercent,
    clueUnlocked,
  };
}

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { getCaseFileBySlug, getAllCaseFiles } from "@/lib/case-loader";
import { chunkText } from "@/lib/chunking";
import { detectDiscoveredClues } from "@/lib/clue-detection";
import { validateCitations } from "@/lib/citations";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { detectPromptInjection } from "@/lib/hallucination";
import { generateGroundedAnswer } from "@/lib/rag";
import { retrieveEvidence } from "@/lib/retrieval";
import {
  applyScore,
  evaluateQuestionQuality,
  type ScoreEvent,
} from "@/lib/scoring";
import {
  cases,
  chatMessages,
  evidenceChunks,
  evidenceDocuments,
  finalAccusations,
  hallucinationReports,
  studentCaseProgress,
  studentClues,
  students,
  suspects,
} from "@/lib/schema";
import type { RegisteredStudent } from "@/lib/student-registry";

const MAX_QUESTIONS = 20;
const ACCUSATION_UNLOCK_CLUES = 3;

export async function upsertStudentRecord(student: RegisteredStudent) {
  const db = getDb();
  const existing = await db
    .select()
    .from(students)
    .where(eq(students.registeredStudentId, student.id))
    .limit(1);

  if (existing[0]) {
    const [updated] = await db
      .update(students)
      .set({
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        lastLoginAt: new Date(),
      })
      .where(eq(students.id, existing[0].id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(students)
    .values({
      registeredStudentId: student.id,
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      lastLoginAt: new Date(),
    })
    .returning();

  return created;
}

export async function seedCasesFromFiles() {
  const db = getDb();
  const caseFiles = await getAllCaseFiles();
  let imported = 0;

  for (const caseFile of caseFiles) {
    const existingCase = await db.select().from(cases).where(eq(cases.slug, caseFile.slug)).limit(1);
    let caseRecord = existingCase[0];

    if (!caseRecord) {
      [caseRecord] = await db
        .insert(cases)
        .values({
          slug: caseFile.slug,
          title: caseFile.title,
          briefing: caseFile.briefing,
          difficulty: caseFile.difficulty,
          estimatedTime: caseFile.estimatedTime,
          status: "active",
          correctCulprit: caseFile.correctCulprit,
          solutionExplanation: caseFile.solutionExplanation,
        })
        .returning();
    }

    const existingDocs = await db
      .select()
      .from(evidenceDocuments)
      .where(eq(evidenceDocuments.caseId, caseRecord.id));

    if (existingDocs.length > 0) continue;

    for (const suspectEntry of caseFile.suspects) {
      await db.insert(suspects).values({
        caseId: caseRecord.id,
        name: suspectEntry.name,
        role: suspectEntry.role,
        description: suspectEntry.description,
        imageUrl: suspectEntry.imageUrl,
      });
    }

    for (const evidenceEntry of caseFile.evidence) {
      const [document] = await db
        .insert(evidenceDocuments)
        .values({
          caseId: caseRecord.id,
          title: evidenceEntry.title,
          sectionLabel: evidenceEntry.sectionLabel,
          evidenceType: evidenceEntry.type,
          content: evidenceEntry.content,
          isCritical: evidenceEntry.isCritical,
          clueKey: evidenceEntry.clueKey,
        })
        .returning();

      const chunks = chunkText(evidenceEntry.content);
      for (const [index, chunk] of chunks.entries()) {
        const metadata = {
          title: evidenceEntry.title,
          sectionLabel: evidenceEntry.sectionLabel,
        };
        const embedding = await generateEmbedding(chunk);

        if (embedding) {
          const vectorLiteral = `[${embedding.join(",")}]`;
          await db.execute(sql`
            INSERT INTO evidence_chunks (
              case_id,
              evidence_document_id,
              chunk_text,
              chunk_index,
              embedding,
              metadata
            ) VALUES (
              ${caseRecord.id},
              ${document.id},
              ${chunk},
              ${index},
              ${sql.raw(`'${vectorLiteral}'::vector`)},
              ${JSON.stringify(metadata)}::jsonb
            )
          `);
          continue;
        }

        await db.insert(evidenceChunks).values({
          caseId: caseRecord.id,
          evidenceDocumentId: document.id,
          chunkText: chunk,
          chunkIndex: index,
          embedding: null,
          metadata,
        });
      }
    }

    imported += 1;
  }

  return { imported };
}

export async function getCasesWithStatus(studentDbId?: string) {
  if (!isDatabaseConfigured()) {
    const caseFiles = await getAllCaseFiles();
    return caseFiles.map((item) => ({
      id: item.slug,
      slug: item.slug,
      title: item.title,
      briefing: item.briefing,
      difficulty: item.difficulty,
      estimatedTime: item.estimatedTime,
      suspectCount: item.suspects.length,
      status: "not_started",
    }));
  }

  const db = getDb();
  const allCases = await db.select().from(cases).where(eq(cases.status, "active"));

  if (!studentDbId) {
    return allCases.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      briefing: item.briefing,
      difficulty: item.difficulty,
      estimatedTime: item.estimatedTime,
      suspectCount: 0,
      status: "not_started",
    }));
  }

  const progress = await db
    .select()
    .from(studentCaseProgress)
    .where(eq(studentCaseProgress.studentId, studentDbId));

  const suspectCounts = await db
    .select({
      caseId: suspects.caseId,
      count: sql<number>`count(*)`,
    })
    .from(suspects)
    .groupBy(suspects.caseId);

  return allCases.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    briefing: item.briefing,
    difficulty: item.difficulty,
    estimatedTime: item.estimatedTime,
    suspectCount: suspectCounts.find((entry) => entry.caseId === item.id)?.count ?? 0,
    status: progress.find((entry) => entry.caseId === item.id)?.status ?? "not_started",
  }));
}

export async function getCaseGameData(caseSlug: string, studentDbId?: string) {
  const caseFile = await getCaseFileBySlug(caseSlug);
  if (!caseFile) return null;

  const base = {
    slug: caseFile.slug,
    title: caseFile.title,
    briefing: caseFile.briefing,
    suspects: caseFile.suspects,
    evidence: caseFile.evidence,
    criticalClues: caseFile.criticalClues,
    difficulty: caseFile.difficulty,
    estimatedTime: caseFile.estimatedTime,
  };

  if (!studentDbId || !isDatabaseConfigured()) {
    return {
      ...base,
      score: 0,
      questionsRemaining: MAX_QUESTIONS,
      cluesFound: [],
      hallucinationReports: [],
      chatLog: [],
      accusationLocked: true,
    };
  }

  const db = getDb();
  const [caseRecord] = await db.select().from(cases).where(eq(cases.slug, caseSlug)).limit(1);
  if (!caseRecord) {
    return {
      ...base,
      score: 0,
      questionsRemaining: MAX_QUESTIONS,
      cluesFound: [],
      hallucinationReports: [],
      chatLog: [],
      accusationLocked: true,
    };
  }

  const [progress] = await db
    .select()
    .from(studentCaseProgress)
    .where(and(eq(studentCaseProgress.studentId, studentDbId), eq(studentCaseProgress.caseId, caseRecord.id)))
    .limit(1);

  const clueRows = await db
    .select()
    .from(studentClues)
    .where(and(eq(studentClues.studentId, studentDbId), eq(studentClues.caseId, caseRecord.id)));

  const reports = await db
    .select()
    .from(hallucinationReports)
    .where(and(eq(hallucinationReports.studentId, studentDbId), eq(hallucinationReports.caseId, caseRecord.id)))
    .orderBy(desc(hallucinationReports.createdAt));

  const messages = await db
    .select()
    .from(chatMessages)
    .where(and(eq(chatMessages.studentId, studentDbId), eq(chatMessages.caseId, caseRecord.id)))
    .orderBy(chatMessages.createdAt);

  return {
    ...base,
    dbCaseId: caseRecord.id,
    score: progress?.score ?? 0,
    questionsRemaining: MAX_QUESTIONS - (progress?.questionsUsed ?? 0),
    cluesFound: clueRows.map((row) => row.clueKey),
    hallucinationReports: reports,
    chatLog: messages,
    accusationLocked: clueRows.length < ACCUSATION_UNLOCK_CLUES,
  };
}

export async function ensureProgress(studentDbId: string, caseSlug: string) {
  const db = getDb();
  const [caseRecord] = await db.select().from(cases).where(eq(cases.slug, caseSlug)).limit(1);
  if (!caseRecord) throw new Error("Case not found.");

  const existing = await db
    .select()
    .from(studentCaseProgress)
    .where(and(eq(studentCaseProgress.studentId, studentDbId), eq(studentCaseProgress.caseId, caseRecord.id)))
    .limit(1);

  if (existing[0]) return { caseRecord, progress: existing[0] };

  const [created] = await db
    .insert(studentCaseProgress)
    .values({
      studentId: studentDbId,
      caseId: caseRecord.id,
      status: "in_progress",
      score: 0,
      questionsUsed: 0,
      criticalCluesFound: 0,
      startedAt: new Date(),
    })
    .returning();

  return { caseRecord, progress: created };
}

export async function getStudentByRegisteredId(registeredStudentId: string) {
  const db = getDb();
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.registeredStudentId, registeredStudentId))
    .limit(1);
  return student ?? null;
}

export async function processChatQuestion({
  studentDbId,
  caseSlug,
  question,
}: {
  studentDbId: string;
  caseSlug: string;
  question: string;
}) {
  const db = getDb();
  const { caseRecord, progress } = await ensureProgress(studentDbId, caseSlug);

  if (progress.questionsUsed >= MAX_QUESTIONS) {
    throw new Error("Question limit reached for this case.");
  }

  if (detectPromptInjection(question)) {
    const scoreDelta = applyScore("prompt_injection");
    await db
      .update(studentCaseProgress)
      .set({
        score: progress.score + scoreDelta,
        questionsUsed: progress.questionsUsed + 1,
      })
      .where(eq(studentCaseProgress.id, progress.id));

    return {
      blocked: true,
      answer:
        "This looks like an attempt to bypass the investigation rules. Ask an evidence-based question.",
      citations: [],
      retrievedChunks: [],
      scoreDelta,
      cluesDiscovered: [],
      questionsRemaining: MAX_QUESTIONS - (progress.questionsUsed + 1),
    };
  }

  const recentQuestionRows = await db
    .select()
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.studentId, studentDbId),
        eq(chatMessages.caseId, caseRecord.id),
        eq(chatMessages.role, "user"),
      ),
    )
    .orderBy(desc(chatMessages.createdAt))
    .limit(5);

  const questionScore = evaluateQuestionQuality(
    question,
    recentQuestionRows.map((row) => row.content),
  );

  const userMessage = await db
    .insert(chatMessages)
    .values({
      studentId: studentDbId,
      caseId: caseRecord.id,
      role: "user",
      content: question,
      citations: [],
      retrievedChunks: [],
      scoreDelta: questionScore.delta,
    })
    .returning();

  const retrieved = await retrieveEvidence(question, caseSlug);
  const clueRows = await db
    .select()
    .from(studentClues)
    .where(and(eq(studentClues.studentId, studentDbId), eq(studentClues.caseId, caseRecord.id)));
  const clueKeys = clueRows.map((row) => row.clueKey);

  const answer = await generateGroundedAnswer({
    question,
    criticalCluesFound: clueKeys,
    questionsRemaining: MAX_QUESTIONS - (progress.questionsUsed + 1),
    retrieved,
  });

  const discoveredClues = detectDiscoveredClues(retrieved, clueKeys);
  let scoreDelta = questionScore.delta;
  if (discoveredClues.length > 0) {
    scoreDelta += discoveredClues.length * applyScore("critical_clue");
  }

  const citationCheck = validateCitations(
    answer,
    retrieved.map((item) => item.title),
  );

  const assistantMessage = await db
    .insert(chatMessages)
    .values({
      studentId: studentDbId,
      caseId: caseRecord.id,
      role: "assistant",
      content: answer,
      citations: retrieved.map((item) => ({
        title: item.title,
        sectionLabel: item.sectionLabel,
      })),
      retrievedChunks: retrieved,
      scoreDelta: 0,
    })
    .returning();

  if (discoveredClues.length > 0) {
    const caseFile = await getCaseFileBySlug(caseSlug);
    const clueDocMap = new Map(
      (caseFile?.evidence ?? [])
        .filter((entry) => entry.clueKey)
        .map((entry) => [entry.clueKey as string, entry.title]),
    );

    const clueDocs = await db
      .select()
      .from(evidenceDocuments)
      .where(
        and(
          eq(evidenceDocuments.caseId, caseRecord.id),
          inArray(
            evidenceDocuments.title,
            discoveredClues
              .map((clue) => clueDocMap.get(clue))
              .filter(Boolean) as string[],
          ),
        ),
      );

    for (const clue of discoveredClues) {
      const evidenceDoc = clueDocs.find((doc) => doc.clueKey === clue);
      if (!evidenceDoc) continue;
      await db.insert(studentClues).values({
        studentId: studentDbId,
        caseId: caseRecord.id,
        clueKey: clue,
        evidenceDocumentId: evidenceDoc.id,
      });
    }
  }

  await db
    .update(studentCaseProgress)
    .set({
      questionsUsed: progress.questionsUsed + 1,
      score: progress.score + scoreDelta,
      status: "in_progress",
      criticalCluesFound: clueKeys.length + discoveredClues.length,
    })
    .where(eq(studentCaseProgress.id, progress.id));

  return {
    blocked: false,
    answer,
    citations: assistantMessage[0]?.citations ?? [],
    retrievedChunks: retrieved,
    scoreDelta,
    cluesDiscovered: discoveredClues,
    questionsRemaining: MAX_QUESTIONS - (progress.questionsUsed + 1),
    messageId: assistantMessage[0]?.id,
    lowCitationConfidence: !citationCheck.isValid,
    warning: citationCheck.warning,
    userMessageId: userMessage[0]?.id,
  };
}

export async function submitHallucinationReport({
  studentDbId,
  caseSlug,
  messageId,
  reason,
}: {
  studentDbId: string;
  caseSlug: string;
  messageId: string;
  reason: string;
}) {
  const db = getDb();
  const [caseRecord] = await db.select().from(cases).where(eq(cases.slug, caseSlug)).limit(1);
  if (!caseRecord) throw new Error("Case not found.");

  const [message] = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
  if (!message) throw new Error("Message not found.");

  const citations = Array.isArray(message.citations) ? message.citations : [];
  const scoreDelta =
    citations.length === 0
      ? applyScore("valid_hallucination", "hallucination_bonus")
      : applyScore("invalid_hallucination");

  const [report] = await db
    .insert(hallucinationReports)
    .values({
      studentId: studentDbId,
      caseId: caseRecord.id,
      messageId,
      reason,
      status: citations.length === 0 ? "valid" : "pending",
      scoreDelta,
    })
    .returning();

  const [progress] = await db
    .select()
    .from(studentCaseProgress)
    .where(and(eq(studentCaseProgress.studentId, studentDbId), eq(studentCaseProgress.caseId, caseRecord.id)))
    .limit(1);

  if (progress) {
    await db
      .update(studentCaseProgress)
      .set({
        score: progress.score + scoreDelta,
      })
      .where(eq(studentCaseProgress.id, progress.id));
  }

  return report;
}

export async function submitAccusation({
  studentDbId,
  caseSlug,
  accusedSuspect,
  explanation,
  selectedEvidence,
}: {
  studentDbId: string;
  caseSlug: string;
  accusedSuspect: string;
  explanation: string;
  selectedEvidence: string[];
}) {
  const db = getDb();
  const [caseRecord] = await db.select().from(cases).where(eq(cases.slug, caseSlug)).limit(1);
  if (!caseRecord) throw new Error("Case not found.");

  const existing = await db
    .select()
    .from(finalAccusations)
    .where(and(eq(finalAccusations.studentId, studentDbId), eq(finalAccusations.caseId, caseRecord.id)))
    .limit(1);
  if (existing[0]) {
    throw new Error("Final accusation already submitted for this case.");
  }

  const clueRows = await db
    .select()
    .from(studentClues)
    .where(and(eq(studentClues.studentId, studentDbId), eq(studentClues.caseId, caseRecord.id)));
  if (clueRows.length < ACCUSATION_UNLOCK_CLUES) {
    throw new Error("At least 3 critical clues are required before a final accusation.");
  }

  const caseFile = await getCaseFileBySlug(caseSlug);
  const evidenceMatches = (caseFile?.evidence ?? []).filter((entry) =>
    selectedEvidence.includes(entry.title),
  );
  const correctEvidenceCount = evidenceMatches.filter(
    (entry) => entry.isCritical && entry.clueKey,
  ).length;
  const isCorrect = accusedSuspect === caseRecord.correctCulprit;
  const strongExplanation =
    explanation.length > 120 &&
    selectedEvidence.some((title) => explanation.toLowerCase().includes(title.toLowerCase().split(" ")[0]));

  const scoreEvents: ScoreEvent[] = [];
  if (isCorrect) scoreEvents.push("correct_culprit" as const);
  else scoreEvents.push("wrong_culprit" as const);

  if (correctEvidenceCount >= 2) scoreEvents.push("correct_supporting_evidence" as const);
  if (strongExplanation) scoreEvents.push("strong_explanation" as const);
  else scoreEvents.push("weak_explanation" as const);
  if (!/maybe|probably|guess|perhaps/i.test(explanation)) {
    scoreEvents.push("no_unsupported_claim" as const);
  }

  const [progress] = await db
    .select()
    .from(studentCaseProgress)
    .where(and(eq(studentCaseProgress.studentId, studentDbId), eq(studentCaseProgress.caseId, caseRecord.id)))
    .limit(1);

  if (progress?.questionsUsed && progress.questionsUsed < 10) {
    scoreEvents.push("under_10_questions_bonus" as const);
  }
  if (caseFile && clueRows.length === caseFile.criticalClues.length) {
    scoreEvents.push("all_clues_bonus" as const);
  }

  const totalAwarded = applyScore(...scoreEvents);
  const feedback = isCorrect
    ? `Correct. ${caseRecord.solutionExplanation}`
    : `Incorrect. ${caseRecord.solutionExplanation}`;

  const [accusation] = await db
    .insert(finalAccusations)
    .values({
      studentId: studentDbId,
      caseId: caseRecord.id,
      accusedSuspect,
      explanation,
      selectedEvidence,
      scoreAwarded: totalAwarded,
      isCorrect,
      feedback,
    })
    .returning();

  if (progress) {
    await db
      .update(studentCaseProgress)
      .set({
        status: isCorrect ? "solved" : "failed",
        score: progress.score + totalAwarded,
        completedAt: new Date(),
      })
      .where(eq(studentCaseProgress.id, progress.id));
  }

  return accusation;
}

export async function getScoreboard() {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select({
      studentName: students.name,
      rollNumber: students.rollNumber,
      caseTitle: cases.title,
      score: studentCaseProgress.score,
      questionsAsked: studentCaseProgress.questionsUsed,
      criticalCluesFound: studentCaseProgress.criticalCluesFound,
      finalResult: studentCaseProgress.status,
      solvedTime: studentCaseProgress.completedAt,
    })
    .from(studentCaseProgress)
    .innerJoin(students, eq(studentCaseProgress.studentId, students.id))
    .innerJoin(cases, eq(studentCaseProgress.caseId, cases.id))
    .orderBy(desc(studentCaseProgress.score), studentCaseProgress.completedAt);

  return rows.map((row, index) => ({
    rank: index + 1,
    ...row,
  }));
}

export async function getAdminProgress() {
  if (!isDatabaseConfigured()) {
    return {
      scoreboard: [],
      hallucinationReports: [],
      chatLogs: [],
    };
  }

  const db = getDb();
  const scoreboard = await getScoreboard();
  const allReports = await db
    .select({
      id: hallucinationReports.id,
      studentName: students.name,
      caseTitle: cases.title,
      reason: hallucinationReports.reason,
      status: hallucinationReports.status,
      createdAt: hallucinationReports.createdAt,
    })
    .from(hallucinationReports)
    .innerJoin(students, eq(hallucinationReports.studentId, students.id))
    .innerJoin(cases, eq(hallucinationReports.caseId, cases.id))
    .orderBy(desc(hallucinationReports.createdAt));

  const logs = await db
    .select({
      id: chatMessages.id,
      studentName: students.name,
      caseTitle: cases.title,
      role: chatMessages.role,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .innerJoin(students, eq(chatMessages.studentId, students.id))
    .innerJoin(cases, eq(chatMessages.caseId, cases.id))
    .orderBy(desc(chatMessages.createdAt))
    .limit(200);

  return {
    scoreboard,
    hallucinationReports: allReports,
    chatLogs: logs,
  };
}

export async function resetProgress(input: { type: "student" | "case"; studentId?: string; caseId?: string }) {
  const db = getDb();

  if (input.type === "student" && input.studentId) {
    await db.delete(studentClues).where(eq(studentClues.studentId, input.studentId));
    await db.delete(hallucinationReports).where(eq(hallucinationReports.studentId, input.studentId));
    await db.delete(chatMessages).where(eq(chatMessages.studentId, input.studentId));
    await db.delete(finalAccusations).where(eq(finalAccusations.studentId, input.studentId));
    await db.delete(studentCaseProgress).where(eq(studentCaseProgress.studentId, input.studentId));
    return { ok: true };
  }

  if (input.type === "case" && input.caseId) {
    await db.delete(studentClues).where(eq(studentClues.caseId, input.caseId));
    await db.delete(hallucinationReports).where(eq(hallucinationReports.caseId, input.caseId));
    await db.delete(chatMessages).where(eq(chatMessages.caseId, input.caseId));
    await db.delete(finalAccusations).where(eq(finalAccusations.caseId, input.caseId));
    await db.delete(studentCaseProgress).where(eq(studentCaseProgress.caseId, input.caseId));
    return { ok: true };
  }

  throw new Error("Invalid reset request.");
}

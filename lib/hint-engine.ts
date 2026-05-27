import { and, eq } from "drizzle-orm";

import { getCaseFileBySlug } from "@/lib/case-loader";
import { getDb } from "@/lib/db";
import { cases, studentCaseProgress } from "@/lib/schema";

export async function requestHint(studentDbId: string, caseSlug: string) {
  const db = getDb();
  const [caseRecord] = await db.select().from(cases).where(eq(cases.slug, caseSlug)).limit(1);
  if (!caseRecord) throw new Error("Case not found.");

  const [progress] = await db
    .select()
    .from(studentCaseProgress)
    .where(and(eq(studentCaseProgress.studentId, studentDbId), eq(studentCaseProgress.caseId, caseRecord.id)))
    .limit(1);

  if (!progress) throw new Error("Progress record not found.");

  const nextLevel = Math.min(3, progress.hintsUsed + 1);
  const penalty = nextLevel === 1 ? -1 : nextLevel === 2 ? -2 : -3;

  const caseFile = await getCaseFileBySlug(caseSlug);
  let hintText = "";

  if (caseFile?.hints) {
    if (nextLevel === 1) hintText = caseFile.hints.level1;
    else if (nextLevel === 2) hintText = caseFile.hints.level2;
    else hintText = caseFile.hints.level3;
  } else {
    if (nextLevel === 1) {
      hintText = "Examine the witness statements to find discrepancies in where suspects claim they were.";
    } else if (nextLevel === 2) {
      hintText = "Compare the time when critical entry logs were recorded against the timeline.";
    } else {
      hintText = "A critical contradiction is hidden between the Server Access Log and one of the witness statements.";
    }
  }

  await db
    .update(studentCaseProgress)
    .set({
      score: Math.max(0, progress.score + penalty),
      hintsUsed: nextLevel,
    })
    .where(eq(studentCaseProgress.id, progress.id));

  return {
    level: nextLevel,
    hint: hintText,
    scoreDelta: penalty,
  };
}

export function evaluateAutoHint(params: {
  questionsAsked: number;
  criticalCluesFound: number;
  duplicateQuestions: number;
  timeSpent: number; // in seconds
  timelineCompletion: boolean;
  caseFile: any;
}) {
  const { questionsAsked, criticalCluesFound, duplicateQuestions, caseFile } = params;

  // Conditions for being "stuck"
  const isStuckLevel3 = questionsAsked >= 12 && criticalCluesFound <= 1;
  const isStuckLevel2 = (questionsAsked >= 8 && criticalCluesFound <= 1) || duplicateQuestions >= 2;
  const isStuckLevel1 = questionsAsked >= 5 && criticalCluesFound === 0;

  if (!isStuckLevel1 && !isStuckLevel2 && !isStuckLevel3) {
    return null;
  }

  const level = isStuckLevel3 ? 3 : isStuckLevel2 ? 2 : 1;
  let hintText = "";

  if (caseFile?.hints) {
    if (level === 1) hintText = caseFile.hints.level1;
    else if (level === 2) hintText = caseFile.hints.level2;
    else hintText = caseFile.hints.level3;
  } else {
    if (level === 1) {
      hintText = "You may want to examine timeline evidence and compare witness locations.";
    } else if (level === 2) {
      hintText = "Review the entry and server access logs closely to trace suspect timings.";
    } else {
      hintText = "Check if one of the suspects had access keys or cards that match the logs.";
    }
  }

  return {
    level,
    hint: `Hint unlocked: ${hintText}`,
  };
}

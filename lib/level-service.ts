import { and, eq, sql } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/lib/db";
import { cases, finalAccusations, studentCaseProgress, suspects } from "@/lib/schema";

export async function isCaseCompleted(studentDbId: string, caseId: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const db = getDb();

  // 1. Fetch case thresholds
  const [caseRecord] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseRecord) return false;

  // 2. Fetch final accusation to ensure one was submitted
  const [accusation] = await db
    .select()
    .from(finalAccusations)
    .where(and(eq(finalAccusations.studentId, studentDbId), eq(finalAccusations.caseId, caseId)))
    .limit(1);
  if (!accusation) return false;

  // 3. Fetch student progress
  const [progress] = await db
    .select()
    .from(studentCaseProgress)
    .where(and(eq(studentCaseProgress.studentId, studentDbId), eq(studentCaseProgress.caseId, caseId)))
    .limit(1);
  if (!progress) return false;

  // Must meet both score and clue thresholds
  return (
    progress.score >= caseRecord.completionScoreThreshold &&
    progress.criticalCluesFound >= caseRecord.completionCluesThreshold
  );
}

export async function getStudentCasesProgressList(studentDbId?: string) {
  const db = getDb();
  const allCases = await db.select().from(cases).where(eq(cases.status, "active"));
  // Sort cases alphabetically by title to enforce Level 1 -> Level 2 -> Level 3 progression
  allCases.sort((a, b) => a.title.localeCompare(b.title));

  if (!studentDbId || !isDatabaseConfigured()) {
    return allCases.map((item, index) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      briefing: item.briefing,
      difficulty: item.difficulty,
      estimatedTime: item.estimatedTime,
      suspectCount: 0,
      status: "not_started",
      unlocked: index === 0, // only first unlocked if no student session
      completed: false,
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

  // Evaluate completion for all cases
  const completedMap = new Map<string, boolean>();
  for (const c of allCases) {
    const isComp = await isCaseCompleted(studentDbId, c.id);
    completedMap.set(c.id, isComp);
  }

  // Determine unlocked status
  const list = [];
  let previousCompleted = true; // Level 1 is always unlocked

  for (let i = 0; i < allCases.length; i++) {
    const item = allCases[i];
    const isCompleted = completedMap.get(item.id) ?? false;
    const isUnlocked = previousCompleted; // current is unlocked if previous was completed

    list.push({
      id: item.id,
      slug: item.slug,
      title: item.title,
      briefing: item.briefing,
      difficulty: item.difficulty,
      estimatedTime: item.estimatedTime,
      suspectCount: suspectCounts.find((entry) => entry.caseId === item.id)?.count ?? 0,
      status: progress.find((entry) => entry.caseId === item.id)?.status ?? "not_started",
      unlocked: isUnlocked,
      completed: isCompleted,
    });

    // Update previousCompleted for next loop iteration
    previousCompleted = isCompleted;
  }

  return list;
}

export async function isCaseUnlockedForStudent(studentDbId: string, caseSlug: string): Promise<boolean> {
  const list = await getStudentCasesProgressList(studentDbId);
  const target = list.find((c) => c.slug === caseSlug);
  return target ? target.unlocked : false;
}

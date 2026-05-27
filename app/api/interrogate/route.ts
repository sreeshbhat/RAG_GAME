import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getStudentSession } from "@/lib/auth";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { getStudentByRegisteredId } from "@/lib/game-service";
import { processInterrogationQuestion } from "@/lib/interrogation-service";
import { cases, studentSuspectInterrogationState } from "@/lib/schema";

const interrogateSchema = z.object({
  caseId: z.string(),
  suspectName: z.string(),
  question: z.string(),
});

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "DATABASE_URL must be configured for interrogation tracking." },
        { status: 500 },
      );
    }

    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = interrogateSchema.parse(await request.json());
    const dbStudent = await getStudentByRegisteredId(session.registeredStudentId);
    if (!dbStudent) {
      return NextResponse.json({ error: "Student record not found." }, { status: 404 });
    }

    const result = await processInterrogationQuestion({
      studentDbId: dbStudent.id,
      caseSlug: body.caseId,
      suspectName: body.suspectName,
      question: body.question,
      llmProvider: session.llmProvider,
      llmApiKey: session.llmApiKey,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process interrogation." },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "DATABASE_URL must be configured." }, { status: 500 });
    }

    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseSlug = searchParams.get("caseId");
    const suspectName = searchParams.get("suspectName");

    if (!caseSlug || !suspectName) {
      return NextResponse.json({ error: "Missing caseId or suspectName parameters." }, { status: 400 });
    }

    const db = getDb();
    const [caseRecord] = await db.select().from(cases).where(eq(cases.slug, caseSlug)).limit(1);
    if (!caseRecord) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }

    const dbStudent = await getStudentByRegisteredId(session.registeredStudentId);
    if (!dbStudent) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const [state] = await db
      .select()
      .from(studentSuspectInterrogationState)
      .where(
        and(
          eq(studentSuspectInterrogationState.studentId, dbStudent.id),
          eq(studentSuspectInterrogationState.caseId, caseRecord.id),
          eq(studentSuspectInterrogationState.suspectName, suspectName),
        ),
      )
      .limit(1);

    return NextResponse.json({
      pressureLevel: state?.pressureLevel ?? 0,
      contradictionsFound: state?.contradictionsFound ?? 0,
      revealedFacts: state?.revealedFacts ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load state." },
      { status: 500 },
    );
  }
}


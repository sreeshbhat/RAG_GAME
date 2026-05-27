import { NextResponse } from "next/server";

import { getStudentSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getStudentByRegisteredId, submitAccusation } from "@/lib/game-service";
import { accusationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database is required." }, { status: 500 });
    }

    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const body = accusationSchema.parse(await request.json());
    const dbStudent = await getStudentByRegisteredId(session.registeredStudentId);
    if (!dbStudent) return NextResponse.json({ error: "Student not found." }, { status: 404 });

    const accusation = await submitAccusation({
      studentDbId: dbStudent.id,
      caseSlug: body.caseId,
      accusedSuspect: body.accusedSuspect,
      explanation: body.explanation,
      selectedEvidence: body.selectedEvidence,
    });

    return NextResponse.json(accusation);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit accusation." },
      { status: 400 },
    );
  }
}

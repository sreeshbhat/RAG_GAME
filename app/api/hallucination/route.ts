import { NextResponse } from "next/server";

import { getStudentSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getStudentByRegisteredId, submitHallucinationReport } from "@/lib/game-service";
import { hallucinationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database is required." }, { status: 500 });
    }

    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const body = await request.json();
    const parsed = hallucinationSchema.parse(body);
    const dbStudent = await getStudentByRegisteredId(session.registeredStudentId);
    if (!dbStudent) return NextResponse.json({ error: "Student not found." }, { status: 404 });

    const report = await submitHallucinationReport({
      studentDbId: dbStudent.id,
      caseSlug: body.caseId,
      messageId: parsed.messageId,
      reason: parsed.reason,
    });

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save report." },
      { status: 400 },
    );
  }
}

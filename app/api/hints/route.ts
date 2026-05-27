import { NextResponse } from "next/server";
import { z } from "zod";

import { getStudentSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getStudentByRegisteredId } from "@/lib/game-service";
import { requestHint } from "@/lib/hint-engine";

const hintRequestSchema = z.object({
  caseId: z.string(),
});

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "DATABASE_URL must be configured for hint engine." },
        { status: 500 },
      );
    }

    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = hintRequestSchema.parse(await request.json());
    const dbStudent = await getStudentByRegisteredId(session.registeredStudentId);
    if (!dbStudent) {
      return NextResponse.json({ error: "Student record not found." }, { status: 404 });
    }

    const result = await requestHint(dbStudent.id, body.caseId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to request hint." },
      { status: 400 },
    );
  }
}

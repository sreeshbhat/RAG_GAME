import { NextResponse } from "next/server";

import { getStudentSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getStudentByRegisteredId, processChatQuestion } from "@/lib/game-service";
import { chatSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "DATABASE_URL must be configured for chat progress persistence." },
        { status: 500 },
      );
    }

    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = chatSchema.parse(await request.json());
    const dbStudent = await getStudentByRegisteredId(session.registeredStudentId);
    if (!dbStudent) {
      return NextResponse.json({ error: "Student record not found." }, { status: 404 });
    }

    const result = await processChatQuestion({
      studentDbId: dbStudent.id,
      caseSlug: body.caseId,
      question: body.question,
      llmProvider: session.llmProvider,
      llmApiKey: session.llmApiKey,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to answer question." },
      { status: 400 },
    );
  }
}

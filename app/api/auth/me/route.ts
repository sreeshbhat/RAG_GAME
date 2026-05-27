import { NextResponse } from "next/server";

import { getStudentSession } from "@/lib/auth";

export async function GET() {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ student: null });
  }

  return NextResponse.json({
    student: {
      studentId: session.studentId,
      registeredStudentId: session.registeredStudentId,
      name: session.name,
      email: session.email,
      rollNumber: session.rollNumber,
      llmProvider: session.llmProvider,
      llmApiKeyConfigured: Boolean(session.llmApiKey),
    },
  });
}

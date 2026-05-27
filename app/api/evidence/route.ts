import { NextResponse } from "next/server";

import { getStudentSession } from "@/lib/auth";
import { getCaseGameData, getStudentByRegisteredId } from "@/lib/game-service";

export async function GET(request: Request) {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId");
  if (!caseId) {
    return NextResponse.json({ error: "caseId is required." }, { status: 400 });
  }

  const dbStudent = await getStudentByRegisteredId(session.registeredStudentId);
  const caseData = await getCaseGameData(caseId, dbStudent?.id);

  return NextResponse.json({
    evidence: caseData?.evidence ?? [],
    cluesFound: caseData?.cluesFound ?? [],
  });
}

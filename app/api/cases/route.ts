import { NextResponse } from "next/server";

import { getStudentSession } from "@/lib/auth";
import { getCasesWithStatus, getStudentByRegisteredId } from "@/lib/game-service";

export async function GET() {
  const session = await getStudentSession();
  const dbStudent = session ? await getStudentByRegisteredId(session.registeredStudentId) : null;
  const cases = await getCasesWithStatus(dbStudent?.id);
  return NextResponse.json({ cases });
}

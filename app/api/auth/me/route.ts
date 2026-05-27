import { NextResponse } from "next/server";

import { getStudentSession } from "@/lib/auth";

export async function GET() {
  const session = await getStudentSession();
  return NextResponse.json({ student: session });
}

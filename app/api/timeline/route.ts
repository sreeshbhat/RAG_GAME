import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getStudentSession } from "@/lib/auth";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { getStudentByRegisteredId } from "@/lib/game-service";
import { cases } from "@/lib/schema";
import { getUnlockedTimelineEvents } from "@/lib/timeline-service";

export async function GET(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "DATABASE_URL must be configured for timeline events." },
        { status: 500 },
      );
    }

    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const caseSlug = searchParams.get("caseId");
    if (!caseSlug) {
      return NextResponse.json({ error: "caseId parameter is required." }, { status: 400 });
    }

    const db = getDb();
    const [caseRecord] = await db.select().from(cases).where(eq(cases.slug, caseSlug)).limit(1);
    if (!caseRecord) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }

    const dbStudent = await getStudentByRegisteredId(session.registeredStudentId);
    if (!dbStudent) {
      return NextResponse.json({ error: "Student record not found." }, { status: 404 });
    }

    const events = await getUnlockedTimelineEvents(dbStudent.id, caseRecord.id);
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to get timeline events." },
      { status: 400 },
    );
  }
}

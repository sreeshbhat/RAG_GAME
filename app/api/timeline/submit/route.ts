import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getStudentSession } from "@/lib/auth";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { getStudentByRegisteredId } from "@/lib/game-service";
import { cases } from "@/lib/schema";
import { validateTimeline } from "@/lib/timeline-service";

const timelineSubmitSchema = z.object({
  caseId: z.string(),
  eventOrder: z.array(z.string()),
});

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "DATABASE_URL must be configured for timeline submissions." },
        { status: 500 },
      );
    }

    const session = await getStudentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = timelineSubmitSchema.parse(await request.json());
    const db = getDb();
    const [caseRecord] = await db.select().from(cases).where(eq(cases.slug, body.caseId)).limit(1);
    if (!caseRecord) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }

    const dbStudent = await getStudentByRegisteredId(session.registeredStudentId);
    if (!dbStudent) {
      return NextResponse.json({ error: "Student record not found." }, { status: 404 });
    }

    const result = await validateTimeline(dbStudent.id, caseRecord.id, body.eventOrder);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to validate timeline." },
      { status: 400 },
    );
  }
}

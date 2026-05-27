import { NextResponse } from "next/server";

import { createStudentSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { upsertStudentRecord } from "@/lib/game-service";
import { findRegisteredStudent } from "@/lib/student-registry";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const registered = await findRegisteredStudent(body.name, body.rollNumber);

    if (!registered) {
      return NextResponse.json(
        { error: "Name and roll number do not match the registered student list." },
        { status: 401 },
      );
    }

    const dbStudent = isDatabaseConfigured() ? await upsertStudentRecord(registered) : null;
    await createStudentSession({
      studentId: dbStudent?.id ?? registered.id,
      registeredStudentId: registered.id,
      name: registered.name,
      email: registered.email,
      rollNumber: registered.rollNumber,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid login request." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/admin-auth";
import { resetProgress } from "@/lib/game-service";
import { resetSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const allowed = await hasAdminSession();
    if (!allowed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const body = resetSchema.parse(await request.json());
    const result = await resetProgress(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reset progress." },
      { status: 400 },
    );
  }
}

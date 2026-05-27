import { NextResponse } from "next/server";

import { createAdminSession } from "@/lib/admin-auth";
import { adminLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = adminLoginSchema.parse(await request.json());
    if (!process.env.ADMIN_PASSWORD || body.password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
    }

    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid admin login request." }, { status: 400 });
  }
}

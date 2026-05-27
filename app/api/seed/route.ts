import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/db";
import { seedCasesFromFiles } from "@/lib/game-service";

export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL is required." }, { status: 500 });
  }

  const allowed = await hasAdminSession();
  if (!allowed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await seedCasesFromFiles();
  return NextResponse.json(result);
}

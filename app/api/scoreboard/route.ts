import { NextResponse } from "next/server";

import { isDatabaseConfigured } from "@/lib/db";
import { getScoreboard } from "@/lib/game-service";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ rows: [] });
  }

  const rows = await getScoreboard();
  return NextResponse.json({ rows });
}

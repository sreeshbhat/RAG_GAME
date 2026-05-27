import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/admin-auth";
import { getAdminProgress } from "@/lib/game-service";

export async function GET() {
  const allowed = await hasAdminSession();
  if (!allowed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const data = await getAdminProgress();
  return NextResponse.json(data);
}

import { NextResponse } from "next/server";

import { hasAdminSession } from "@/lib/admin-auth";
import { toCsv } from "@/lib/csv-export";
import { getAdminProgress } from "@/lib/game-service";

export async function GET(request: Request) {
  const allowed = await hasAdminSession();
  if (!allowed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "scoreboard";
  const data = await getAdminProgress();

  const lookup: Record<string, Record<string, unknown>[]> = {
    scoreboard: data.scoreboard,
    hallucinations: data.hallucinationReports,
    chatlogs: data.chatLogs,
  };

  const rows = lookup[type] ?? data.scoreboard;
  const csv = toCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}.csv"`,
    },
  });
}

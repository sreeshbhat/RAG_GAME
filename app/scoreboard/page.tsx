import { redirect } from "next/navigation";

import { ScoreboardTable } from "@/components/ScoreboardTable";
import { Navbar } from "@/components/Navbar";
import { getStudentSession } from "@/lib/auth";
import { getScoreboard } from "@/lib/game-service";

export default async function ScoreboardPage() {
  const session = await getStudentSession();
  if (!session) redirect("/login");

  const rows = await getScoreboard();

  return (
    <>
      <Navbar studentName={session.name} rollNumber={session.rollNumber} />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <ScoreboardTable rows={rows} />
      </main>
    </>
  );
}


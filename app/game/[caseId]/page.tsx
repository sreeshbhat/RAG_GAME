import { notFound, redirect } from "next/navigation";

import { GameShell } from "@/components/GameShell";
import { getStudentSession } from "@/lib/auth";
import { getCaseGameData, getStudentByRegisteredId } from "@/lib/game-service";

export default async function GamePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const session = await getStudentSession();
  if (!session) redirect("/login");

  const { caseId } = await params;
  const dbStudent = await getStudentByRegisteredId(session.registeredStudentId);
  const caseData = await getCaseGameData(caseId, dbStudent?.id);

  if (!caseData) notFound();

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-10">
      <GameShell caseData={caseData} />
    </main>
  );
}

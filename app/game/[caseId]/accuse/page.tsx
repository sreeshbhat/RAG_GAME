import { notFound, redirect } from "next/navigation";

import { FinalAccusationForm } from "@/components/FinalAccusationForm";
import { getStudentSession } from "@/lib/auth";
import { getCaseGameData, getStudentByRegisteredId } from "@/lib/game-service";

export default async function AccusePage({
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
    <main className="mx-auto max-w-5xl px-6 py-16">
      <FinalAccusationForm
        caseId={caseId}
        suspects={caseData.suspects.map((suspect) => suspect.name)}
        evidenceTitles={caseData.evidence.map((entry) => entry.title)}
        locked={caseData.accusationLocked}
      />
    </main>
  );
}

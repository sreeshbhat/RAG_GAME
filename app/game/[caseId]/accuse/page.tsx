import { notFound, redirect } from "next/navigation";

import { FinalAccusationForm } from "@/components/FinalAccusationForm";
import { Navbar } from "@/components/Navbar";
import { getStudentSession } from "@/lib/auth";
import { getCaseGameData, getStudentByRegisteredId } from "@/lib/game-service";
import { isCaseUnlockedForStudent } from "@/lib/level-service";

export default async function AccusePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const session = await getStudentSession();
  if (!session) redirect("/login");

  const { caseId } = await params;
  const dbStudent = await getStudentByRegisteredId(session.registeredStudentId);
  if (!dbStudent) redirect("/login");

  const caseData = await getCaseGameData(caseId, dbStudent.id);
  if (!caseData) notFound();

  const unlocked = await isCaseUnlockedForStudent(dbStudent.id, caseId);
  if (!unlocked) {
    redirect("/cases");
  }

  return (
    <>
      <Navbar studentName={session.name} rollNumber={session.rollNumber} />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <FinalAccusationForm
          caseId={caseId}
          suspects={caseData.suspects.map((suspect) => suspect.name)}
          evidenceTitles={caseData.evidence.map((entry) => entry.title)}
          locked={caseData.accusationLocked}
          lockRequirement={caseData.unlockRequirement}
          accusationMinEvidenceCount={caseData.accusationMinEvidenceCount}
          hasSubmittedAccusation={caseData.hasSubmittedAccusation}
          accusationFeedback={caseData.accusationFeedback}
        />
      </main>
    </>
  );
}



import { redirect } from "next/navigation";

import { CaseCard } from "@/components/CaseCard";
import { getStudentSession } from "@/lib/auth";
import { getCasesWithStatus, getStudentByRegisteredId } from "@/lib/game-service";

export default async function CasesPage() {
  const session = await getStudentSession();
  if (!session) redirect("/login");

  const dbStudent = await getStudentByRegisteredId(session.registeredStudentId);
  const cases = await getCasesWithStatus(dbStudent?.id);

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Choose a case</p>
        <h1 className="mt-4 font-serif text-4xl">Active Crime Scenes</h1>
        <p className="mt-4 text-slate-200">
          Each case is isolated. The assistant may only retrieve evidence from the case you enter.
        </p>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {cases.map((item) => (
          <CaseCard key={item.slug} {...item} />
        ))}
      </div>
    </main>
  );
}

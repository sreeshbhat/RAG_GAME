import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Classroom RAG Challenge</p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">
            RAG Detective Game
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Solve mysteries using evidence, retrieval, and citations. Ask better questions, inspect source documents, catch hallucinations, and submit a defensible accusation.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/login">
                Student Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/admin">Teacher/Admin Login</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {["Ask questions", "Retrieve evidence", "Catch hallucinations", "Solve the case"].map((item) => (
              <Card className="rounded-2xl p-4" key={item}>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-amber-300" />
                  <span className="text-sm">{item}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
        <Card className="rounded-[2rem] p-8">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-300">What students practice</p>
            <div className="space-y-4 text-sm leading-7 text-slate-200">
              <p>Grounded answering with per-case retrieval only.</p>
              <p>Source citations for every factual claim.</p>
              <p>Evidence-based reasoning before naming a culprit.</p>
              <p>Hallucination detection and reflection on model failures.</p>
              <p>Competitive scoring, clue discovery, and final accusation quality.</p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

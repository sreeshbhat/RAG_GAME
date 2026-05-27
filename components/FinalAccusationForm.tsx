"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function FinalAccusationForm({
  caseId,
  suspects,
  evidenceTitles,
  locked,
  lockRequirement,
  accusationMinEvidenceCount,
  hasSubmittedAccusation = false,
  accusationFeedback = null,
}: {
  caseId: string;
  suspects: string[];
  evidenceTitles: string[];
  locked: boolean;
  lockRequirement: number;
  accusationMinEvidenceCount: number;
  hasSubmittedAccusation?: boolean;
  accusationFeedback?: string | null;
}) {
  const [accusedSuspect, setAccusedSuspect] = useState(suspects[0] ?? "");
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");
  const [result, setResult] = useState<string>(accusationFeedback ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(hasSubmittedAccusation);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || locked || submitted) return;
    if (selectedEvidence.length < accusationMinEvidenceCount) {
      setResult(`Select at least ${accusationMinEvidenceCount} evidence items before submitting.`);
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/accuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          accusedSuspect,
          explanation,
          selectedEvidence,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setResult(payload.error || "Unable to submit accusation.");
      } else {
        setResult(payload.feedback || "Accusation submitted successfully.");
        setSubmitted(true);
        // Refresh the page so server component updates dynamic route state and navigation
        window.location.reload();
      }
    } catch (e) {
      setResult("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="max-w-3xl border-emerald-500/30 bg-emerald-950/5 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)] p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Accusation Filed</CardTitle>
          <CardDescription className="max-w-md mx-auto text-slate-300">
            Your final accusation for this case has been submitted. The case files and progression status have been updated.
          </CardDescription>
        </div>
        
        <div className="mt-8 rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
          <h3 className="font-serif text-lg text-amber-300">Case Outcome & Feedback</h3>
          <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{result}</p>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Button asChild variant="default">
            <Link href="/cases">Return to Cases</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl">
      <CardTitle>Final Accusation</CardTitle>
      <CardDescription className="mt-2">
        Locked until at least {lockRequirement} critical clues are discovered.
      </CardDescription>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm text-muted">Accused suspect</label>
          <select
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm"
            disabled={locked || submitting}
            value={accusedSuspect}
            onChange={(event) => setAccusedSuspect(event.target.value)}
          >
            {suspects.map((suspect) => (
              <option key={suspect} value={suspect}>
                {suspect}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted">Supporting evidence titles</label>
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            {evidenceTitles.map((title) => {
              const checked = selectedEvidence.includes(title);
              return (
                <label
                  className="flex items-start gap-3 rounded-xl border border-white/5 px-3 py-2 text-sm text-slate-200"
                  key={title}
                >
                  <input
                    checked={checked}
                    className="mt-1"
                    disabled={locked || submitting}
                    onChange={(event) => {
                      setSelectedEvidence((current) => {
                        if (event.target.checked) {
                          return Array.from(new Set([...current, title]));
                        }
                        return current.filter((item) => item !== title);
                      });
                    }}
                    type="checkbox"
                  />
                  <span>{title}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted">
            Select at least {accusationMinEvidenceCount} evidence items and reference them in your explanation.
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted">Evidence-based explanation</label>
          <Textarea
            disabled={locked || submitting}
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
            placeholder="Explain why the suspect is responsible, and explicitly mention the evidence you selected."
          />
        </div>
        <Button disabled={locked || submitting} type="submit">
          {submitting ? "Submitting Accusation..." : "Submit Final Accusation"}
        </Button>
        {locked ? <p className="text-sm text-danger">Find at least {lockRequirement} critical clues first.</p> : null}
        {result ? <p className="text-sm text-amber-300">{result}</p> : null}
      </form>
    </Card>
  );
}


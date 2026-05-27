"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function FinalAccusationForm({
  caseId,
  suspects,
  evidenceTitles,
  locked,
}: {
  caseId: string;
  suspects: string[];
  evidenceTitles: string[];
  locked: boolean;
}) {
  const [accusedSuspect, setAccusedSuspect] = useState(suspects[0] ?? "");
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");
  const [result, setResult] = useState<string>("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
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
    setResult(payload.feedback ?? payload.error);
  }

  return (
    <Card className="max-w-3xl">
      <CardTitle>Final Accusation</CardTitle>
      <CardDescription className="mt-2">
        Locked until at least 3 critical clues are discovered.
      </CardDescription>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm text-muted">Accused suspect</label>
          <select
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm"
            disabled={locked}
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
          <Input
            disabled={locked}
            placeholder="Comma separated evidence titles"
            onChange={(event) =>
              setSelectedEvidence(
                event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
          />
          <p className="text-xs text-muted">{evidenceTitles.join(" | ")}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted">Evidence-based explanation</label>
          <Textarea
            disabled={locked}
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
          />
        </div>
        <Button disabled={locked} type="submit">
          Submit Final Accusation
        </Button>
        {locked ? <p className="text-sm text-danger">Find at least 3 critical clues first.</p> : null}
        {result ? <p className="text-sm text-amber-300">{result}</p> : null}
      </form>
    </Card>
  );
}

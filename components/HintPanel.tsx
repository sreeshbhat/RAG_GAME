"use client";

import { AlertTriangle, Lightbulb } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

interface HintPanelProps {
  caseId: string;
  onHintRequested: (scoreDelta: number) => void;
  initialHintsUsed: number;
}

export function HintPanel({ caseId, onHintRequested, initialHintsUsed }: HintPanelProps) {
  const [hints, setHints] = useState<string[]>([]);
  const [hintsCount, setHintsCount] = useState(initialHintsUsed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRequestHint() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to request hint.");

      setHints((prev) => [...prev, `Level ${data.level}: ${data.hint}`]);
      setHintsCount(data.level);
      onHintRequested(data.scoreDelta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hint.");
    } finally {
      setLoading(false);
    }
  }

  const nextPenalty = hintsCount === 0 ? 1 : hintsCount === 1 ? 2 : 3;

  return (
    <Card className="p-5">
      <CardTitle className="flex items-center gap-2 text-md">
        <Lightbulb className="h-5 w-5 text-amber-300" />
        <span>Investigation Hints</span>
      </CardTitle>
      <CardDescription className="mt-1 text-xs">
        Stuck? Request a hint. Each progressive level provides narrower guidance but carries a larger score penalty.
      </CardDescription>

      {hints.length > 0 && (
        <div className="mt-4 space-y-2">
          {hints.map((hint, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl border border-white/5 bg-slate-900/20 text-xs text-amber-100/90 leading-relaxed"
            >
              {hint}
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {hintsCount < 3 ? (
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-[11px] text-amber-300/80 mb-3">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span>
              Next hint (Level {hintsCount + 1}) will deduct {nextPenalty} point
              {nextPenalty !== 1 ? "s" : ""}.
            </span>
          </div>
          <Button
            onClick={handleRequestHint}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            {loading ? "Unlocking Hint..." : `Request Level ${hintsCount + 1} Hint`}
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted text-center">All hints unlocked for this case.</p>
      )}
    </Card>
  );
}

import { CheckCircle2 } from "lucide-react";

import { Card, CardTitle } from "@/components/ui/card";

export function ClueNotebook({ clues }: { clues: string[] }) {
  return (
    <Card className="rounded-3xl">
      <CardTitle>Critical Clues</CardTitle>
      <div className="mt-4 space-y-3">
        {clues.length === 0 ? (
          <p className="text-sm text-muted">No critical clues logged yet.</p>
        ) : (
          clues.map((clue) => (
            <div className="flex items-center gap-3 text-sm text-success" key={clue}>
              <CheckCircle2 className="h-4 w-4" />
              <span>{clue}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

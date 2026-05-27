import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function RagBehindScene({
  question,
  scoreDelta,
  cluesDiscovered,
  retrievedChunks,
}: {
  question?: string;
  scoreDelta?: number;
  cluesDiscovered?: string[];
  retrievedChunks: Array<{
    id: string;
    title: string;
    chunkText: string;
    relevanceScore: number;
  }>;
}) {
  return (
    <Card className="rounded-3xl">
      <CardTitle>RAG Behind the Scene</CardTitle>
      <CardDescription className="mt-2">
        Inspect retrieval and scoring after each detective question.
      </CardDescription>
      {question ? <p className="mt-4 text-sm text-foreground">Question: {question}</p> : null}
      {typeof scoreDelta === "number" ? (
        <p className="mt-2 text-sm text-amber-300">Score change: {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta}</p>
      ) : null}
      {cluesDiscovered?.length ? (
        <p className="mt-2 text-sm text-success">New clues: {cluesDiscovered.join(", ")}</p>
      ) : null}
      <div className="mt-4 space-y-3">
        {retrievedChunks.map((chunk) => (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3" key={chunk.id}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{chunk.title}</p>
              <span className="text-xs text-amber-300">{chunk.relevanceScore.toFixed(2)}</span>
            </div>
            <p className="mt-2 text-xs leading-6 text-muted">{chunk.chunkText}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

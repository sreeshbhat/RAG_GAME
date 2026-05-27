import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function ScoreBadge({ score }: { score: number }) {
  return (
    <Badge className="gap-2 border-amber-400/20 bg-amber-400/10 text-amber-300">
      <Trophy className="h-3.5 w-3.5" />
      Score {score}
    </Badge>
  );
}

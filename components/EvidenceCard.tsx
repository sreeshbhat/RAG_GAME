import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function EvidenceCard({
  title,
  sectionLabel,
  evidenceType,
  content,
  relevanceScore,
  usedInAnswer,
}: {
  title: string;
  sectionLabel: string;
  evidenceType: string;
  content: string;
  relevanceScore: number;
  usedInAnswer?: boolean;
}) {
  return (
    <Card className="rounded-2xl p-4">
      <div className="flex flex-wrap gap-2">
        <Badge>{sectionLabel}</Badge>
        <Badge>{evidenceType}</Badge>
        <Badge className="border-success/20 bg-success/10 text-success">
          Score {relevanceScore.toFixed(2)}
        </Badge>
        {usedInAnswer ? (
          <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-300">Used in answer</Badge>
        ) : null}
      </div>
      <h4 className="mt-3 font-semibold">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-muted">{content}</p>
    </Card>
  );
}

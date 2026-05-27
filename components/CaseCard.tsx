import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function CaseCard({
  slug,
  title,
  briefing,
  difficulty,
  estimatedTime,
  suspectCount,
  status,
}: {
  slug: string;
  title: string;
  briefing: string;
  difficulty: string;
  estimatedTime: string;
  suspectCount: number;
  status: string;
}) {
  return (
    <Card className="flex h-full flex-col justify-between">
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge>{difficulty}</Badge>
          <Badge>{estimatedTime}</Badge>
          <Badge>{suspectCount} suspects</Badge>
          <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-300">{status}</Badge>
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription className="mt-3 leading-6">{briefing}</CardDescription>
      </div>
      <Button asChild className="mt-6 w-full">
        <Link href={`/game/${slug}`}>{status === "not_started" ? "Start Case" : "Continue Case"}</Link>
      </Button>
    </Card>
  );
}

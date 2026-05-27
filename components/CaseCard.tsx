import Link from "next/link";
import { Lock, CheckCircle2 } from "lucide-react";

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
  unlocked = true,
  completed = false,
}: {
  slug: string;
  title: string;
  briefing: string;
  difficulty: string;
  estimatedTime: string;
  suspectCount: number;
  status: string;
  unlocked?: boolean;
  completed?: boolean;
}) {
  return (
    <Card className={`flex h-full flex-col justify-between relative transition-all duration-300 ${
      !unlocked 
        ? "opacity-60 border-slate-800 bg-slate-900/50" 
        : completed 
          ? "border-emerald-500/30 bg-emerald-950/5 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]" 
          : "hover:border-slate-700 hover:shadow-lg"
    }`}>
      <div>
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className={unlocked ? "bg-amber-400/10 border-amber-400/20 text-amber-300" : "bg-slate-800 border-slate-700 text-slate-400"}>
            {difficulty}
          </Badge>
          <Badge>{estimatedTime}</Badge>
          <Badge>{suspectCount} suspects</Badge>
          
          {completed && (
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 gap-1 flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </Badge>
          )}
          
          {!unlocked && (
            <Badge className="border-slate-700 bg-slate-800 text-slate-400 gap-1 flex items-center">
              <Lock className="h-3.5 w-3.5" />
              Locked
            </Badge>
          )}
          
          {unlocked && !completed && (
            <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-300 capitalize">
              {status.replace("_", " ")}
            </Badge>
          )}
        </div>
        <CardTitle className={`mt-4 ${!unlocked ? "text-slate-400" : ""}`}>{title}</CardTitle>
        <CardDescription className="mt-3 leading-6">{briefing}</CardDescription>
      </div>

      {!unlocked ? (
        <Button disabled className="mt-6 w-full gap-2 cursor-not-allowed bg-slate-800 text-slate-500 hover:bg-slate-800">
          <Lock className="h-4 w-4" /> Locked
        </Button>
      ) : (
        <Button asChild className="mt-6 w-full" variant={completed ? "outline" : "default"}>
          <Link href={`/game/${slug}`}>
            {completed ? "Review Case" : status === "not_started" ? "Start Case" : "Continue Case"}
          </Link>
        </Button>
      )}
    </Card>
  );
}


"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { ChatPanel } from "@/components/ChatPanel";
import { ClueNotebook } from "@/components/ClueNotebook";
import { RagBehindScene } from "@/components/RagBehindScene";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SuspectCard } from "@/components/SuspectCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function GameShell({
  caseData,
}: {
  caseData: {
    slug: string;
    title: string;
    briefing: string;
    suspects: { name: string; role: string; description: string }[];
    score: number;
    questionsRemaining: number;
    cluesFound: string[];
    criticalClues: string[];
    chatLog: Array<any>;
    accusationLocked: boolean;
  };
}) {
  const [score, setScore] = useState(caseData.score);
  const [clues, setClues] = useState(caseData.cluesFound);
  const [insight, setInsight] = useState<{
    question?: string;
    scoreDelta?: number;
    cluesDiscovered?: string[];
    retrievedChunks?: any[];
  }>({});

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{caseData.title}</CardTitle>
              <CardDescription className="mt-2 leading-6">{caseData.briefing}</CardDescription>
            </div>
            <ScoreBadge score={score} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge>{caseData.questionsRemaining} questions left</Badge>
            <Badge>{clues.length}/{caseData.criticalClues.length} clues</Badge>
          </div>
          <div className="mt-4">
            <Progress value={(clues.length / caseData.criticalClues.length) * 100} />
          </div>
          <Button asChild className="mt-5 w-full">
            <Link href={`/game/${caseData.slug}/accuse`}>
              {caseData.accusationLocked ? "Accusation Locked" : "Make Final Accusation"}
            </Link>
          </Button>
        </Card>
        <div className="space-y-4">
          {caseData.suspects.map((suspect) => (
            <SuspectCard key={suspect.name} suspect={suspect} />
          ))}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <ChatPanel
          caseId={caseData.slug}
          initialMessages={caseData.chatLog.map((entry) => ({
            role: entry.role,
            content: entry.content,
            citations: entry.citations,
            retrievedChunks: entry.retrievedChunks,
          }))}
          onInsight={(data) => {
            setScore((current) => current + data.scoreDelta);
            setClues((current) => Array.from(new Set([...current, ...(data.cluesDiscovered ?? [])])));
            setInsight(data);
          }}
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <ClueNotebook clues={clues} />
        <RagBehindScene
          question={insight.question}
          scoreDelta={insight.scoreDelta}
          cluesDiscovered={insight.cluesDiscovered}
          retrievedChunks={insight.retrievedChunks ?? []}
        />
      </motion.div>
    </div>
  );
}

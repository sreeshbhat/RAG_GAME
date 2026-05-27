"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import { ChatPanel } from "@/components/ChatPanel";
import { ClueNotebook } from "@/components/ClueNotebook";
import { HintPanel } from "@/components/HintPanel";
import { InterrogationPanel } from "@/components/InterrogationPanel";
import { RagBehindScene } from "@/components/RagBehindScene";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SuspectCard } from "@/components/SuspectCard";
import { TimelineBoard } from "@/components/timeline-board";
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
    hintsUsed?: number;
    accusationLocked: boolean;
  };
}) {
  const [score, setScore] = useState(caseData.score);
  const [clues, setClues] = useState(caseData.cluesFound);
  const [activeTab, setActiveTab] = useState<"assistant" | "interrogation" | "timeline">("assistant");
  const [insight, setInsight] = useState<{
    question?: string;
    scoreDelta?: number;
    cluesDiscovered?: string[];
    retrievedChunks?: any[];
  }>({});

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
      {/* Left Column: Briefing & Suspects */}
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
            <Badge>
              {clues.length}/{caseData.criticalClues.length} clues
            </Badge>
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
            <div
              key={suspect.name}
              onClick={() => setActiveTab("interrogation")}
              className="cursor-pointer hover:scale-[1.01] transition-transform"
            >
              <SuspectCard suspect={suspect} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Middle Column: Interactive Workspace */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">
        {/* Tab row */}
        <div className="flex gap-4 border-b border-white/5 pb-3 mb-4">
          <button
            onClick={() => setActiveTab("assistant")}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "assistant"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            🕵️‍♂️ AI Assistant
          </button>
          <button
            onClick={() => setActiveTab("interrogation")}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "interrogation"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            🗣️ Interrogation Room
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "timeline"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            📅 Timeline Board
          </button>
        </div>

        {activeTab === "assistant" && (
          <ChatPanel
            caseId={caseData.slug}
            initialMessages={caseData.chatLog
              .filter((m) => !m.suspectName)
              .map((entry) => ({
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
        )}

        {activeTab === "interrogation" && (
          <InterrogationPanel
            caseId={caseData.slug}
            suspects={caseData.suspects}
            initialChatLog={caseData.chatLog}
            onScoreUpdated={(scoreDelta, cluesDiscovered) => {
              setScore((current) => current + scoreDelta);
              if (cluesDiscovered.length > 0) {
                setClues((current) => Array.from(new Set([...current, ...cluesDiscovered])));
              }
            }}
          />
        )}

        {activeTab === "timeline" && (
          <TimelineBoard
            caseId={caseData.slug}
            onTimelineScoreAwarded={(scoreDelta) => {
              setScore((current) => current + scoreDelta);
            }}
          />
        )}
      </motion.div>

      {/* Right Column: Clue Notebook, Hints & Behind the Scenes */}
      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <ClueNotebook clues={clues} />
        <HintPanel
          caseId={caseData.slug}
          initialHintsUsed={caseData.hintsUsed ?? 0}
          onHintRequested={(delta) => {
            setScore((current) => current + delta);
          }}
        />
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


"use client";

import { AlertCircle, Flame, Send, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Suspect {
  name: string;
  role: string;
  description: string;
}

interface InterrogationPanelProps {
  caseId: string;
  suspects: Suspect[];
  initialChatLog: Array<any>;
  onScoreUpdated: (scoreDelta: number, cluesDiscovered: string[]) => void;
}

export function InterrogationPanel({
  caseId,
  suspects,
  initialChatLog,
  onScoreUpdated,
}: InterrogationPanelProps) {
  const [activeSuspect, setActiveSuspect] = useState<string>(suspects[0]?.name ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    pressureLevel: 0,
    contradictionsFound: 0,
    revealedFacts: [] as string[],
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load suspect state and filter message history
  useEffect(() => {
    if (!activeSuspect) return;

    // Filter relevant chat log messages for this suspect
    const suspectHistory = initialChatLog
      .filter((msg) => msg.suspectName === activeSuspect)
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content as string,
      }));
    setMessages(suspectHistory);

    // Fetch current pressure and contradictions for this suspect
    async function loadSuspectState() {
      try {
        const response = await fetch(
          `/api/interrogate?caseId=${caseId}&suspectName=${encodeURIComponent(activeSuspect)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setState({
            pressureLevel: data.pressureLevel ?? 0,
            contradictionsFound: data.contradictionsFound ?? 0,
            revealedFacts: data.revealedFacts ?? [],
          });
        }
      } catch (err) {
        console.error("Failed to load suspect state:", err);
      }
    }

    loadSuspectState();
  }, [activeSuspect, caseId, initialChatLog]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Optimistically add user query
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await fetch("/api/interrogate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          suspectName: activeSuspect,
          question: userMessage,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to query suspect.");

      // Add suspect answer
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);

      // Update state metrics
      const pressureDelta = data.pressureLevel - state.pressureLevel;
      const contradictionDelta = data.contradictionsFound - state.contradictionsFound;

      // Notify parent to award score increases/clues found
      let scoreChange = 0;
      if (contradictionDelta > 0) scoreChange += 10;
      if (data.pressureLevel >= 50 && state.pressureLevel < 50) scoreChange += 5;
      if (data.cluesDiscovered?.length > 0) {
        scoreChange += data.cluesDiscovered.length * 10;
      }

      if (scoreChange > 0 || data.cluesDiscovered?.length > 0) {
        onScoreUpdated(scoreChange, data.cluesDiscovered ?? []);
      }

      setState({
        pressureLevel: data.pressureLevel,
        contradictionsFound: data.contradictionsFound,
        revealedFacts: data.revealedFacts ?? [],
      });
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to obtain suspect response. Make sure the database and APIs are online.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `ERROR: ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Get color for pressure level
  const getPressureColor = (pressure: number) => {
    if (pressure >= 75) return "bg-red-500";
    if (pressure >= 45) return "bg-amber-500";
    return "bg-green-500";
  };

  const activeSuspectInfo = suspects.find((s) => s.name === activeSuspect);

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Suspect Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/5 pb-3">
        {suspects.map((suspect) => (
          <button
            key={suspect.name}
            onClick={() => setActiveSuspect(suspect.name)}
            className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all shrink-0 ${
              activeSuspect === suspect.name
                ? "border-amber-500 bg-amber-500/10 text-amber-300"
                : "border-white/5 bg-slate-950/20 text-slate-300 hover:border-white/10"
            }`}
          >
            {suspect.name}
          </button>
        ))}
      </div>

      {/* Suspect Details & Metrics Row */}
      {activeSuspectInfo && (
        <div className="grid gap-4 py-4 border-b border-white/5 sm:grid-cols-2">
          <div>
            <CardTitle className="text-md flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-amber-300" />
              <span>Interrogating {activeSuspectInfo.name}</span>
            </CardTitle>
            <p className="text-xs text-amber-300/80 mt-0.5">{activeSuspectInfo.role}</p>
            <CardDescription className="text-xs mt-1.5 leading-relaxed">
              {activeSuspectInfo.description}
            </CardDescription>
          </div>

          <div className="space-y-3 bg-slate-950/40 rounded-2xl p-3 border border-white/5">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-red-400" /> Pressure Level
                </span>
                <span className="font-semibold">{state.pressureLevel}/100</span>
              </div>
              <Progress
                value={state.pressureLevel}
                className="h-2"
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" /> Lies Caught
              </span>
              <Badge className="border border-amber-500/20 text-amber-300">
                {state.contradictionsFound} contradiction{state.contradictionsFound !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted space-y-2">
            <Sparkles className="h-8 w-8 text-amber-300/40" />
            <p className="text-sm">No interrogation questions recorded yet.</p>
            <p className="text-xs max-w-xs leading-relaxed">
              Ask about their whereabouts, timelines, or present retrieved evidence to press for contradictions.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-100"
                    : "bg-slate-900/40 border border-white/10 text-slate-100"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Area */}
      <form onSubmit={handleSend} className="mt-4 border-t border-white/5 pt-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Interrogate ${activeSuspect}...`}
          disabled={loading || !activeSuspect}
          className="flex-1"
        />
        <Button type="submit" size="sm" className="w-10 h-10 p-0 flex items-center justify-center shrink-0" disabled={loading || !activeSuspect || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}

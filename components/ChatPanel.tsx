"use client";

import { type FormEvent, useState } from "react";
import { AlertTriangle, Send } from "lucide-react";

import { EvidenceAccordion } from "@/components/EvidenceAccordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Message = {
  role: "user" | "assistant";
  content: string;
  citations?: Array<{ title: string; sectionLabel: string }>;
  retrievedChunks?: Array<{
    id: string;
    title: string;
    sectionLabel: string;
    evidenceType: string;
    chunkText: string;
    relevanceScore: number;
  }>;
  scoreDelta?: number;
  cluesDiscovered?: string[];
  lowCitationConfidence?: boolean;
  warning?: string;
  messageId?: string;
};

export function ChatPanel({
  caseId,
  initialMessages,
  onInsight,
}: {
  caseId: string;
  initialMessages: Message[];
  onInsight: (data: { scoreDelta: number; cluesDiscovered: string[]; retrievedChunks: Message["retrievedChunks"]; question: string }) => void;
}) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [pending, setPending] = useState(false);

  async function handleAsk(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    const currentQuestion = question;
    setQuestion("");
    setPending(true);
    setMessages((prev) => [...prev, { role: "user", content: currentQuestion }]);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, question: currentQuestion }),
    });
    const payload = await response.json();
    setPending(false);

    const assistantMessage: Message = {
      role: "assistant",
      content: payload.answer ?? payload.error,
      citations: payload.citations,
      retrievedChunks: payload.retrievedChunks,
      scoreDelta: payload.scoreDelta,
      cluesDiscovered: payload.cluesDiscovered,
      lowCitationConfidence: payload.lowCitationConfidence,
      warning: payload.warning,
      messageId: payload.messageId,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    onInsight({
      scoreDelta: payload.scoreDelta ?? 0,
      cluesDiscovered: payload.cluesDiscovered ?? [],
      retrievedChunks: payload.retrievedChunks ?? [],
      question: currentQuestion,
    });
  }

  async function reportHallucination(messageId: string) {
    const reason = window.prompt("Why does this answer look hallucinated?");
    if (!reason) return;

    await fetch("/api/hallucination", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, messageId, reason }),
    });
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              className={message.role === "assistant" ? "rounded-2xl bg-white/5 p-4" : "rounded-2xl bg-amber-400/10 p-4"}
              key={`${message.role}-${index}`}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                {message.role === "assistant" && message.messageId ? (
                  <Button onClick={() => reportHallucination(message.messageId!)} size="sm" variant="ghost">
                    Report
                  </Button>
                ) : null}
              </div>
              {message.lowCitationConfidence ? (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                  <AlertTriangle className="h-4 w-4" />
                  {message.warning ?? "Low citation confidence."}
                </div>
              ) : null}
              {message.retrievedChunks?.length ? <div className="mt-4"><EvidenceAccordion items={message.retrievedChunks} /></div> : null}
            </div>
          ))}
        </div>
      </Card>
      <form className="flex gap-3" onSubmit={handleAsk}>
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about access logs, timeline, CCTV, witness statements..."
        />
        <Button disabled={pending} type="submit">
          <Send className="mr-2 h-4 w-4" />
          Ask
        </Button>
      </form>
    </div>
  );
}

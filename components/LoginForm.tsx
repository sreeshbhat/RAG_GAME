"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [llmProvider, setLlmProvider] = useState("groq");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rollNumber, llmProvider, llmApiKey }),
    });

    const payload = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(payload.error ?? "Login failed.");
      return;
    }

    router.push("/cases");
    router.refresh();
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardTitle>Student Login</CardTitle>
      <CardDescription className="mt-2">
        Enter your registered name, roll number, model provider, and your own API key.
      </CardDescription>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm text-muted">Student name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted">Roll number</label>
          <Input
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="23EG106A05"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted">Model provider</label>
          <select
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm text-foreground"
            value={llmProvider}
            onChange={(event) => setLlmProvider(event.target.value)}
          >
            <option value="groq">Groq</option>
            <option value="openrouter">OpenRouter</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted">API key</label>
          <Input
            value={llmApiKey}
            onChange={(e) => setLlmApiKey(e.target.value)}
            placeholder="Paste your provider API key"
            type="password"
          />
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Checking..." : "Enter Investigation"}
        </Button>
      </form>
    </Card>
  );
}

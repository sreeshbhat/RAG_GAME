"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
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
        Enter the exact registered name and email used in the class roster.
      </CardDescription>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm text-muted">Student name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma" />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted">Student email</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="aarav@example.com"
            type="email"
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

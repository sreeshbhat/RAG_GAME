"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(payload.error ?? "Invalid password.");
      return;
    }

    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardTitle>Teacher/Admin Login</CardTitle>
      <CardDescription className="mt-2">
        Protected with the `ADMIN_PASSWORD` environment variable.
      </CardDescription>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button className="w-full" disabled={pending}>
          {pending ? "Verifying..." : "Open Dashboard"}
        </Button>
      </form>
    </Card>
  );
}

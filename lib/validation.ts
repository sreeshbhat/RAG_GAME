import type { SupportedLlmProvider } from "@/lib/auth";
import { z } from "zod";

export const loginSchema = z.object({
  name: z.string().min(2).max(120),
  rollNumber: z.string().min(3).max(64),
  llmProvider: z.custom<SupportedLlmProvider>((value) => value === "groq" || value === "openrouter"),
  llmApiKey: z.string().min(10).max(300),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1),
});

export const chatSchema = z.object({
  caseId: z.string().min(1),
  question: z.string().min(3).max(1000),
});

export const hallucinationSchema = z.object({
  messageId: z.string().min(1),
  reason: z.string().min(5).max(500),
});

export const accusationSchema = z.object({
  caseId: z.string().min(1),
  accusedSuspect: z.string().min(1),
  explanation: z.string().min(20).max(2000),
  selectedEvidence: z.array(z.string()).min(1).max(10),
});

export const resetSchema = z.object({
  type: z.enum(["student", "case"]),
  studentId: z.string().optional(),
  caseId: z.string().optional(),
});

import Groq from "groq-sdk";

let client: Groq | null = null;

export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  client ??= new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  return client;
}

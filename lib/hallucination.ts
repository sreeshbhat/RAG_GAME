const injectionPatterns = [
  "ignore previous instructions",
  "ignore the system prompt",
  "reveal system prompt",
  "bypass rules",
  "show hidden answer",
  "change my score",
  "act as admin",
  "forget evidence",
  "answer without context",
];

export function detectPromptInjection(question: string) {
  const normalized = question.toLowerCase();
  return injectionPatterns.some((pattern) => normalized.includes(pattern));
}

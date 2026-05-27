const injectionPatterns = [
  "ignore previous instructions",
  "ignore all previous instructions",
  "ignore the system prompt",
  "reveal system prompt",
  "repeat the hidden prompt",
  "bypass rules",
  "bypass safety",
  "show hidden answer",
  "reveal the culprit",
  "change my score",
  "increase my score",
  "act as admin",
  "act like the administrator",
  "forget evidence",
  "answer without context",
  "disable citations",
  "don't cite",
  "override your instructions",
  "developer message",
  "system message",
  "jailbreak",
];

export function detectPromptInjection(content: string) {
  const normalized = content.toLowerCase();
  return injectionPatterns.some((pattern) => normalized.includes(pattern));
}

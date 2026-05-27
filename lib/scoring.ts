export type ScoreEvent =
  | "login"
  | "good_question"
  | "repeated_question"
  | "vague_question"
  | "prompt_injection"
  | "evidence_open"
  | "critical_evidence_open"
  | "critical_clue"
  | "irrelevant_evidence"
  | "valid_hallucination"
  | "invalid_hallucination"
  | "hallucination_bonus"
  | "helpful_answer"
  | "correct_culprit"
  | "correct_supporting_evidence"
  | "strong_explanation"
  | "no_unsupported_claim"
  | "wrong_culprit"
  | "weak_explanation"
  | "under_10_questions_bonus"
  | "all_clues_bonus"
  | "no_injection_bonus";

const scoreMap: Record<ScoreEvent, number> = {
  login: 5,
  good_question: 5,
  repeated_question: -2,
  vague_question: 0,
  prompt_injection: -5,
  evidence_open: 2,
  critical_evidence_open: 5,
  critical_clue: 10,
  irrelevant_evidence: -1,
  valid_hallucination: 10,
  invalid_hallucination: -5,
  hallucination_bonus: 3,
  helpful_answer: 1,
  correct_culprit: 30,
  correct_supporting_evidence: 30,
  strong_explanation: 20,
  no_unsupported_claim: 10,
  wrong_culprit: -15,
  weak_explanation: -10,
  under_10_questions_bonus: 10,
  all_clues_bonus: 15,
  no_injection_bonus: 5,
};

export function applyScore(...events: ScoreEvent[]) {
  return events.reduce((sum, event) => sum + scoreMap[event], 0);
}

export function evaluateQuestionQuality(question: string, recentQuestions: string[]) {
  const normalized = question.trim().toLowerCase();
  if (recentQuestions.some((entry) => entry.trim().toLowerCase() === normalized)) {
    return { event: "repeated_question" as const, delta: applyScore("repeated_question") };
  }
  if (normalized.split(/\s+/).length < 4) {
    return { event: "vague_question" as const, delta: applyScore("vague_question") };
  }
  return { event: "good_question" as const, delta: applyScore("good_question") };
}

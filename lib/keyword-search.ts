import type { RetrievalChunk } from "@/lib/retrieval";

const stopwords = new Set([
  "a",
  "an",
  "the",
  "is",
  "am",
  "are",
  "was",
  "were",
  "to",
  "of",
  "in",
  "on",
  "for",
  "at",
  "from",
  "with",
  "what",
  "who",
  "when",
  "where",
  "why",
  "how",
  "did",
  "does",
  "about",
  "tell",
  "me",
]);

function tokenize(question: string) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9:\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !stopwords.has(token));
}

export function keywordSearch(question: string, chunks: RetrievalChunk[]) {
  const tokens = tokenize(question);
  const loweredQuestion = question.toLowerCase();

  return chunks
    .map((chunk) => {
      const text = chunk.chunkText.toLowerCase();
      let score = 0;

      for (const token of tokens) {
        if (text.includes(token)) score += 1;
        if (chunk.title.toLowerCase().includes(token)) score += 1.5;
        if (chunk.evidenceType.toLowerCase().includes(token)) score += 1.2;
      }

      if (text.includes(loweredQuestion)) score += 4;
      if (/\b\d{1,2}:\d{2}\b/.test(loweredQuestion) && /\b\d{1,2}:\d{2}\b/.test(text)) {
        score += 2;
      }
      if (/rohan|anika|maya|karthik/.test(loweredQuestion) && /rohan|anika|maya|karthik/.test(text)) {
        score += 2;
      }

      return {
        ...chunk,
        relevanceScore: Number(score.toFixed(2)),
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);
}

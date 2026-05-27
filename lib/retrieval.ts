import { and, desc, eq, sql } from "drizzle-orm";

import { getCaseFileBySlug } from "@/lib/case-loader";
import { getDb } from "@/lib/db";
import { generateEmbedding, embeddingsEnabled } from "@/lib/embeddings";
import { keywordSearch } from "@/lib/keyword-search";
import { evidenceChunks, evidenceDocuments, cases } from "@/lib/schema";

export type RetrievalChunk = {
  id: string;
  evidenceDocumentId: string;
  title: string;
  sectionLabel: string;
  evidenceType: string;
  chunkText: string;
  chunkIndex: number;
  isCritical: boolean;
  clueKey: string | null;
  relevanceScore: number;
};

export type RetrievalResult = RetrievalChunk;

async function getCaseDbId(caseSlug: string) {
  const db = getDb();
  const [record] = await db.select().from(cases).where(eq(cases.slug, caseSlug)).limit(1);
  return record?.id ?? null;
}

async function getStoredChunks(caseSlug: string): Promise<RetrievalChunk[]> {
  const db = getDb();
  const caseId = await getCaseDbId(caseSlug);
  if (!caseId) return [];

  const rows = await db
    .select({
      id: evidenceChunks.id,
      evidenceDocumentId: evidenceChunks.evidenceDocumentId,
      title: evidenceDocuments.title,
      sectionLabel: evidenceDocuments.sectionLabel,
      evidenceType: evidenceDocuments.evidenceType,
      chunkText: evidenceChunks.chunkText,
      chunkIndex: evidenceChunks.chunkIndex,
      isCritical: evidenceDocuments.isCritical,
      clueKey: evidenceDocuments.clueKey,
    })
    .from(evidenceChunks)
    .innerJoin(evidenceDocuments, eq(evidenceChunks.evidenceDocumentId, evidenceDocuments.id))
    .where(eq(evidenceChunks.caseId, caseId))
    .orderBy(desc(evidenceChunks.createdAt));

  return rows.map((row) => ({ ...row, relevanceScore: 0 }));
}

function fallbackCaseChunks(caseFile: NonNullable<Awaited<ReturnType<typeof getCaseFileBySlug>>>) {
  return caseFile.evidence.map((entry, index) => ({
    id: `${caseFile.slug}-${index}`,
    evidenceDocumentId: `${caseFile.slug}-doc-${index}`,
    title: entry.title,
    sectionLabel: entry.sectionLabel,
    evidenceType: entry.type,
    chunkText: entry.content,
    chunkIndex: 0,
    isCritical: entry.isCritical,
    clueKey: entry.clueKey,
    relevanceScore: 0,
  }));
}

async function vectorSearch(question: string, caseSlug: string): Promise<RetrievalResult[]> {
  const embedding = await generateEmbedding(question);
  if (!embedding) return [];

  const db = getDb();
  const caseId = await getCaseDbId(caseSlug);
  if (!caseId) return [];

  const queryVector = `[${embedding.join(",")}]`;
  const rows = await db
    .select({
      id: evidenceChunks.id,
      evidenceDocumentId: evidenceChunks.evidenceDocumentId,
      title: evidenceDocuments.title,
      sectionLabel: evidenceDocuments.sectionLabel,
      evidenceType: evidenceDocuments.evidenceType,
      chunkText: evidenceChunks.chunkText,
      chunkIndex: evidenceChunks.chunkIndex,
      isCritical: evidenceDocuments.isCritical,
      clueKey: evidenceDocuments.clueKey,
      relevanceScore: sql<number>`1 - (${evidenceChunks.embedding} <=> ${queryVector}::vector)`,
    })
    .from(evidenceChunks)
    .innerJoin(evidenceDocuments, eq(evidenceChunks.evidenceDocumentId, evidenceDocuments.id))
    .where(and(eq(evidenceChunks.caseId, caseId), sql`${evidenceChunks.embedding} IS NOT NULL`))
    .orderBy(sql`${evidenceChunks.embedding} <=> ${queryVector}::vector`)
    .limit(5);

  return rows;
}

export async function retrieveEvidence(question: string, caseSlug: string): Promise<RetrievalResult[]> {
  if (embeddingsEnabled()) {
    const vectorResults = await vectorSearch(question, caseSlug);
    if (vectorResults.length > 0) return vectorResults;
  }

  let chunks: RetrievalChunk[] = [];
  try {
    chunks = await getStoredChunks(caseSlug);
  } catch {
    chunks = [];
  }

  if (chunks.length === 0) {
    const caseFile = await getCaseFileBySlug(caseSlug);
    if (!caseFile) return [];
    return keywordSearch(question, fallbackCaseChunks(caseFile));
  }

  return keywordSearch(question, chunks);
}

import { promises as fs } from "fs";
import path from "path";

export type CaseEvidenceType =
  | "witness_statement"
  | "crime_scene_note"
  | "suspect_profile"
  | "server_log"
  | "access_log"
  | "timeline"
  | "forensic_report"
  | "policy_document"
  | "object_evidence"
  | "cctv_note";

export type CaseFile = {
  slug: string;
  title: string;
  difficulty: "easy" | "easy-medium" | "medium" | "medium-hard" | "hard" | "expert";
  estimatedTime: string;
  briefing: string;
  correctCulprit: string;
  solutionExplanation: string;
  suspects: {
    name: string;
    role: string;
    description: string;
    imageUrl?: string;
  }[];
  evidence: {
    title: string;
    sectionLabel: string;
    type: CaseEvidenceType;
    content: string;
    isCritical: boolean;
    clueKey: string | null;
  }[];
  criticalClues: string[];
  suspectProfiles?: {
    suspectName: string;
    personality: string;
    truthfulness: number;
    background: string;
    hiddenFacts: string[];
    emotionalTriggers: string[];
  }[];
  timelineEvents?: {
    timestamp: string;
    description: string;
    evidenceTitle: string;
    critical: boolean;
    orderIndex: number;
  }[];
  hints?: {
    level1: string;
    level2: string;
    level3: string;
  };
  legacySlugs?: string[];
  minimumCriticalCluesRequired?: number;
  maxQuestionsAllowed?: number;
  accusationRequiresEvidence?: boolean;
  accusationMinEvidenceCount?: number;
  completionScoreThreshold?: number;
  completionCluesThreshold?: number;
};


const casesDir = path.join(process.cwd(), "data", "cases");

export async function getAllCaseFiles(): Promise<CaseFile[]> {
  const entries = await fs.readdir(casesDir);
  const caseFiles = entries.filter((entry) => entry.endsWith(".json"));
  const loaded = await Promise.all(
    caseFiles.map(async (fileName) => {
      const raw = await fs.readFile(path.join(casesDir, fileName), "utf8");
      return JSON.parse(raw) as CaseFile;
    }),
  );

  return loaded.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getCaseFileBySlug(slug: string): Promise<CaseFile | null> {
  const filePath = path.join(casesDir, `${slug}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as CaseFile;
  } catch {
    return null;
  }
}

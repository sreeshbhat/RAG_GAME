import type { RetrievalResult } from "@/lib/retrieval";

export function detectDiscoveredClues(
  retrieved: RetrievalResult[],
  existingClueKeys: string[],
) {
  const discovered = retrieved
    .filter((item) => item.isCritical && item.clueKey)
    .map((item) => item.clueKey as string)
    .filter((clueKey) => !existingClueKeys.includes(clueKey));

  return Array.from(new Set(discovered));
}

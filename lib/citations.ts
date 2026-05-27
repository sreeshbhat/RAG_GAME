export function hasSourcesSection(answer: string) {
  return /sources used\s*:/i.test(answer);
}

export function extractCitationTitles(answer: string) {
  const section = answer.split(/sources used\s*:/i)[1] ?? "";
  return section
    .split(/\n|,/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function validateCitations(
  answer: string,
  retrievedTitles: string[],
): { isValid: boolean; warning?: string } {
  if (!hasSourcesSection(answer)) {
    return { isValid: false, warning: "Low citation confidence." };
  }

  const cited = extractCitationTitles(answer).join(" ").toLowerCase();
  const hasKnownSource = retrievedTitles.some((title) =>
    cited.includes(title.toLowerCase()),
  );

  return hasKnownSource
    ? { isValid: true }
    : { isValid: false, warning: "Low citation confidence." };
}

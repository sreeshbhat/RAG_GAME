export function chunkText(content: string, chunkSize = 320) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= chunkSize) {
    return [normalized];
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (`${current} ${sentence}`.trim().length > chunkSize) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current = `${current} ${sentence}`.trim();
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}

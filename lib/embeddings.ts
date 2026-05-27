export function embeddingsEnabled() {
  return false;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  void text;
  if (!embeddingsEnabled()) return null;
  return null;
}

/** Deterministic keyword normalization for Demand Scout clustering. */

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "to",
  "for",
  "with",
  "of",
  "and",
  "or",
  "in",
  "on",
  "how",
  "can",
  "do",
  "i",
  "my",
  "using",
]);

export function normalizeKeyword(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function keywordTokens(text: string): string[] {
  return normalizeKeyword(text)
    .split(" ")
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

export function tokenOverlapScore(a: string, b: string): number {
  const left = new Set(keywordTokens(a));
  const right = new Set(keywordTokens(b));
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  const union = new Set([...left, ...right]).size;
  return intersection / union;
}

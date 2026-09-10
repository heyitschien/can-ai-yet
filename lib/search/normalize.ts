const FILLER = new Set([
  "a",
  "an",
  "the",
  "my",
  "our",
  "to",
  "for",
  "of",
  "and",
  "or",
  "with",
  "please",
  "can",
  "ai",
  "do",
  "this",
  "yet",
  "i",
  "want",
  "need",
  "help",
  "me",
]);

export function normalizeQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(value: string): string[] {
  return normalizeQuery(value)
    .split(" ")
    .filter((token) => token.length > 1 && !FILLER.has(token));
}

export function tokenSet(value: string): Set<string> {
  return new Set(tokens(value));
}

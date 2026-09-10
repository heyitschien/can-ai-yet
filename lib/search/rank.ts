import type { MatchConfidence } from "@/lib/domain";
import { normalizeQuery, tokenSet } from "@/lib/search/normalize";

export type SearchableCapability = {
  title: string;
  slug: string;
  shortDescription: string;
  synonyms: string[];
  categoryName: string;
  whatAiCanDo: string[];
};

export type RankedHit = {
  rankScore: number;
  confidence: MatchConfidence;
};

function overlap(queryTokens: Set<string>, text: string): number {
  if (queryTokens.size === 0) return 0;
  const haystack = tokenSet(text);
  if (haystack.size === 0) return 0;
  let hits = 0;
  for (const token of queryTokens) {
    if (haystack.has(token)) hits += 1;
  }
  return hits / queryTokens.size;
}

function phraseIncludes(query: string, text: string): boolean {
  const normalized = normalizeQuery(text);
  return normalized.length > 0 && (normalized.includes(query) || query.includes(normalized));
}

export function rankCapability(query: string, capability: SearchableCapability): RankedHit {
  const normalized = normalizeQuery(query);
  if (!normalized) return { rankScore: 0, confidence: "none" };

  const title = normalizeQuery(capability.title);
  const slug = normalizeQuery(capability.slug.replace(/-/g, " "));
  if (normalized === title || normalized === slug) {
    return { rankScore: 1, confidence: "strong" };
  }

  const queryTokens = tokenSet(normalized);
  const titleCoverage = overlap(queryTokens, capability.title);
  const slugCoverage = overlap(queryTokens, capability.slug.replace(/-/g, " "));
  const synonymCoverage = Math.max(
    0,
    ...capability.synonyms.map((synonym) => {
      if (phraseIncludes(normalized, synonym) && tokenSet(synonym).size > 0) {
        return Math.max(0.82, overlap(queryTokens, synonym));
      }
      return overlap(queryTokens, synonym);
    }),
    0,
  );
  const descriptionCoverage = overlap(
    queryTokens,
    `${capability.shortDescription} ${capability.whatAiCanDo.join(" ")} ${capability.categoryName}`,
  );

  let rankScore =
    titleCoverage * 0.62 +
    slugCoverage * 0.2 +
    synonymCoverage * 0.55 +
    descriptionCoverage * 0.18;

  if (phraseIncludes(normalized, capability.title) && queryTokens.size >= 2) {
    rankScore = Math.max(rankScore, 0.86);
  }

  rankScore = Math.min(1, Math.round(rankScore * 1000) / 1000);

  let confidence: MatchConfidence = "none";
  if (rankScore >= 0.72) confidence = "strong";
  else if (rankScore >= 0.42) confidence = "related";
  else if (rankScore >= 0.22) confidence = "weak";

  return { rankScore, confidence };
}

export function confidenceLabel(confidence: MatchConfidence): string {
  switch (confidence) {
    case "strong":
      return "Strong match";
    case "related":
      return "Related capability";
    case "weak":
      return "Weak match";
    case "none":
      return "No tested match";
    default: {
      const never: never = confidence;
      return never;
    }
  }
}

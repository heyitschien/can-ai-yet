import type { PublicCapability, SearchOutcome } from "@/lib/domain";
import { rankCapability } from "@/lib/search/rank";

export function searchCapabilities(query: string, capabilities: PublicCapability[]): SearchOutcome {
  const ranked = capabilities
    .map((capability) => {
      const rank = rankCapability(query, {
        title: capability.title,
        slug: capability.slug,
        shortDescription: capability.shortDescription,
        synonyms: capability.synonyms,
        categoryName: capability.categoryName,
        whatAiCanDo: capability.whatAiCanDo,
      });
      return { capability, ...rank };
    })
    .filter((item) => item.confidence !== "none")
    .sort((a, b) => b.rankScore - a.rankScore);

  const acceptable = ranked.filter((item) => item.confidence === "strong" || item.confidence === "related");
  const shown = (acceptable.length > 0 ? acceptable : ranked.filter((item) => item.confidence === "weak")).slice(0, 3);

  return {
    query,
    matches: shown.map((item) => ({
      capability: item.capability,
      confidence: item.confidence === "none" ? "weak" : item.confidence,
      rankScore: item.rankScore,
    })),
    outcome: acceptable.length > 0 ? "matched" : "not_tested",
  };
}

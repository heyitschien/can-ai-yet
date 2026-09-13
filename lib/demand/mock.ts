import ideasFixture from "@/lib/demand/fixtures/generate-keyword-ideas.json";
import historyFixture from "@/lib/demand/fixtures/generate-keyword-historical-metrics.json";
import {
  FileSystemDemandCache,
  buildDemandCacheKey,
  markCachedProvenance,
  type DemandCache,
} from "@/lib/demand/cache";
import { parseMonthlyVolumes } from "@/lib/demand/google-ads";
import { normalizeKeyword } from "@/lib/demand/normalize";
import type { DemandSource } from "@/lib/demand/source";
import {
  DEFAULT_API_VERSION,
  DemandError,
  type DemandIdea,
  type DemandMetric,
  type DemandProvenance,
  type DemandSeed,
  type DemandTarget,
} from "@/lib/demand/types";

interface FixtureMetrics {
  avgMonthlySearches?: number | null;
  competition?: string | null;
  competitionIndex?: number | null;
  lowTopOfPageBidMicros?: number | null;
  highTopOfPageBidMicros?: number | null;
  monthlySearchVolumes?: Array<{
    year?: string | number | null;
    month?: string | number | null;
    monthlySearches?: string | number | null;
  }>;
}

interface FixtureIdeaRow {
  text: string;
  keywordIdeaMetrics?: FixtureMetrics | null;
}

interface FixtureHistoryRow {
  text: string;
  keywordMetrics?: FixtureMetrics | null;
}

function toIdea(
  text: string,
  metrics: FixtureMetrics | null | undefined,
  provenance: DemandProvenance,
): DemandIdea {
  return {
    keywordText: text,
    normalizedKeyword: normalizeKeyword(text),
    averageMonthlySearches: metrics?.avgMonthlySearches ?? null,
    monthlySearchVolumes: parseMonthlyVolumes(metrics?.monthlySearchVolumes),
    competition: metrics?.competition ?? null,
    competitionIndex: metrics?.competitionIndex ?? null,
    lowTopOfPageBidMicros: metrics?.lowTopOfPageBidMicros ?? null,
    highTopOfPageBidMicros: metrics?.highTopOfPageBidMicros ?? null,
    provenance,
  };
}

export class MockDemandSource implements DemandSource {
  readonly name = "mock";

  constructor(
    private readonly cache: DemandCache = new FileSystemDemandCache(),
    private readonly refresh = false,
  ) {}

  async discoverIdeas(seed: DemandSeed, target: DemandTarget): Promise<DemandIdea[]> {
    if (!seed.keyword && !seed.url) {
      throw new DemandError("discoverIdeas requires a seed keyword or URL.", { className: "config" });
    }
    const seedKey = seed.keyword ?? seed.url ?? "";
    const cacheKey = buildDemandCacheKey({
      source: this.name,
      apiVersion: DEFAULT_API_VERSION,
      operation: "generateKeywordIdeas",
      seedOrKeywords: seedKey,
      target,
    });

    if (!this.refresh) {
      const hit = await this.cache.get<DemandIdea[]>(cacheKey);
      if (hit) {
        return hit.value.map((idea) => ({
          ...idea,
          provenance: markCachedProvenance(hit.provenance),
        }));
      }
    }

    const retrievedAt = new Date().toISOString();
    const provenance: DemandProvenance = {
      source: this.name,
      apiVersion: DEFAULT_API_VERSION,
      operation: "generateKeywordIdeas",
      retrievedAt,
      requestId: "mock-request-ideas",
      seedKeyword: seed.keyword ?? null,
      seedUrl: seed.url ?? null,
      target,
      cached: false,
      cacheRetrievedAt: null,
      originalRetrievedAt: retrievedAt,
    };

    const ideas = (ideasFixture.results as FixtureIdeaRow[]).map((row) =>
      toIdea(row.text, row.keywordIdeaMetrics, provenance),
    );
    await this.cache.set(cacheKey, ideas, provenance);
    return ideas;
  }

  async getHistoricalMetrics(keywords: string[], target: DemandTarget): Promise<DemandMetric[]> {
    const cleaned = keywords.map((k) => k.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      throw new DemandError("getHistoricalMetrics requires at least one keyword.", {
        className: "config",
      });
    }
    const seedOrKeywords = cleaned.map((k) => k.toLowerCase()).sort().join(",");
    const cacheKey = buildDemandCacheKey({
      source: this.name,
      apiVersion: DEFAULT_API_VERSION,
      operation: "generateKeywordHistoricalMetrics",
      seedOrKeywords,
      target,
    });

    if (!this.refresh) {
      const hit = await this.cache.get<DemandMetric[]>(cacheKey);
      if (hit) {
        return hit.value.map((metric) => ({
          ...metric,
          provenance: markCachedProvenance(hit.provenance),
        }));
      }
    }

    const retrievedAt = new Date().toISOString();
    const provenance: DemandProvenance = {
      source: this.name,
      apiVersion: DEFAULT_API_VERSION,
      operation: "generateKeywordHistoricalMetrics",
      retrievedAt,
      requestId: "mock-request-history",
      seedKeyword: cleaned[0] ?? null,
      seedUrl: null,
      target,
      cached: false,
      cacheRetrievedAt: null,
      originalRetrievedAt: retrievedAt,
    };

    const wanted = new Set(cleaned.map((k) => normalizeKeyword(k)));
    const metrics = (historyFixture.results as FixtureHistoryRow[])
      .filter((row) => wanted.has(normalizeKeyword(row.text)))
      .map((row) => toIdea(row.text, row.keywordMetrics, provenance));

    await this.cache.set(cacheKey, metrics, provenance);
    return metrics;
  }
}

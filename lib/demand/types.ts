/** Demand Scout domain types. Search demand never equals capability proof. */

export type DemandNetwork = "GOOGLE_SEARCH";

export type DemandSourceName = "google-ads-keyword-plan" | "mock";

export interface DemandTarget {
  country: string;
  language: string;
  geoTargetConstant: string;
  languageConstant: string;
  network: DemandNetwork;
}

export interface DemandSeed {
  keyword?: string;
  url?: string;
}

export interface MonthlySearchVolume {
  year: number;
  month: number;
  monthlySearches: number | null;
}

export interface DemandProvenance {
  source: DemandSourceName;
  apiVersion: string;
  operation: "generateKeywordIdeas" | "generateKeywordHistoricalMetrics";
  retrievedAt: string;
  requestId: string | null;
  seedKeyword: string | null;
  seedUrl: string | null;
  target: DemandTarget;
  cached: boolean;
  cacheRetrievedAt: string | null;
  originalRetrievedAt: string | null;
}

export interface DemandIdea {
  keywordText: string;
  normalizedKeyword: string;
  averageMonthlySearches: number | null;
  monthlySearchVolumes: MonthlySearchVolume[];
  competition: string | null;
  competitionIndex: number | null;
  lowTopOfPageBidMicros: number | null;
  highTopOfPageBidMicros: number | null;
  provenance: DemandProvenance;
}

export interface DemandMetric {
  keywordText: string;
  normalizedKeyword: string;
  averageMonthlySearches: number | null;
  monthlySearchVolumes: MonthlySearchVolume[];
  competition: string | null;
  competitionIndex: number | null;
  lowTopOfPageBidMicros: number | null;
  highTopOfPageBidMicros: number | null;
  provenance: DemandProvenance;
}

export interface DemandCluster {
  familyLabel: string;
  representativeKeyword: string;
  members: string[];
  aggregateAverageMonthlySearches: number | null;
  memberCount: number;
  competitionIndexMax: number | null;
  lowTopOfPageBidMicrosMin: number | null;
  highTopOfPageBidMicrosMax: number | null;
}

export interface DemandReport {
  generatedAt: string;
  mode: "mock" | "live";
  operation: DemandProvenance["operation"] | "smoke";
  target: DemandTarget;
  seed: DemandSeed | null;
  keywords: string[] | null;
  ideas: DemandIdea[];
  metrics: DemandMetric[];
  clusters: DemandCluster[];
  cacheStatus: "hit" | "miss" | "bypass" | "mixed" | "n/a";
  limitations: string[];
  futureFactors: {
    businessValue: null;
    testability: null;
    evidenceGap: null;
    note: string;
  };
}

export type DemandErrorClass =
  | "config"
  | "auth"
  | "access"
  | "quota"
  | "transient"
  | "invalid_response"
  | "unknown";

export class DemandError extends Error {
  readonly className: DemandErrorClass;
  readonly status: number | null;
  readonly requestId: string | null;

  constructor(
    message: string,
    options: {
      className: DemandErrorClass;
      status?: number | null;
      requestId?: string | null;
      cause?: unknown;
    },
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "DemandError";
    this.className = options.className;
    this.status = options.status ?? null;
    this.requestId = options.requestId ?? null;
  }
}

export const DEFAULT_DEMAND_TARGET: DemandTarget = {
  country: "US",
  language: "en",
  geoTargetConstant: "geoTargetConstants/2840",
  languageConstant: "languageConstants/1000",
  network: "GOOGLE_SEARCH",
};

export const DEFAULT_API_VERSION = "v25";
export const DEFAULT_CACHE_TTL_MS = 35 * 24 * 60 * 60 * 1000;
export const PLANNING_MIN_INTERVAL_MS = 1000;

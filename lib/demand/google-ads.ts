import { JWT } from "google-auth-library";
import {
  FileSystemDemandCache,
  buildDemandCacheKey,
  markCachedProvenance,
  type DemandCache,
} from "@/lib/demand/cache";
import { normalizeKeyword } from "@/lib/demand/normalize";
import type { DemandSource } from "@/lib/demand/source";
import {
  DEFAULT_API_VERSION,
  DemandError,
  PLANNING_MIN_INTERVAL_MS,
  type DemandIdea,
  type DemandMetric,
  type DemandProvenance,
  type DemandSeed,
  type DemandTarget,
  type MonthlySearchVolume,
} from "@/lib/demand/types";

const ADWORDS_SCOPE = "https://www.googleapis.com/auth/adwords";

export interface GoogleAdsDemandConfig {
  apiVersion?: string;
  customerId: string;
  serviceAccountJson: string;
  loginCustomerId?: string;
  cache?: DemandCache;
  refresh?: boolean;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
  nowImpl?: () => number;
  /** Test seam only — production uses service-account JWT. */
  accessTokenProvider?: () => Promise<string>;
}

interface GoogleKeywordMetrics {
  avgMonthlySearches?: string | number | null;
  competition?: string | null;
  competitionIndex?: string | number | null;
  lowTopOfPageBidMicros?: string | number | null;
  highTopOfPageBidMicros?: string | number | null;
  monthlySearchVolumes?: Array<{
    year?: string | number | null;
    month?: string | number | null;
    monthlySearches?: string | number | null;
  }>;
}

interface GoogleKeywordIdeaResult {
  text?: string | null;
  keywordIdeaMetrics?: GoogleKeywordMetrics | null;
  keywordMetrics?: GoogleKeywordMetrics | null;
}

interface GoogleKeywordHistoricalResult {
  text?: string | null;
  keywordMetrics?: GoogleKeywordMetrics | null;
}

let lastPlanningCallAt = 0;

function sleep(ms: number, sleepImpl?: (ms: number) => Promise<void>): Promise<void> {
  return (sleepImpl ?? ((value) => new Promise((resolve) => setTimeout(resolve, value))))(ms);
}

function asNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseMonthlyVolumes(
  volumes: GoogleKeywordMetrics["monthlySearchVolumes"],
): MonthlySearchVolume[] {
  if (!volumes) return [];
  return volumes.map((row) => ({
    year: asNumber(row.year) ?? 0,
    month: asNumber(row.month) ?? 0,
    monthlySearches: asNumber(row.monthlySearches),
  }));
}

function metricsFromGoogle(
  text: string,
  metrics: GoogleKeywordMetrics | null | undefined,
  provenance: DemandProvenance,
): Omit<DemandIdea, "provenance"> & { provenance: DemandProvenance } {
  return {
    keywordText: text,
    normalizedKeyword: normalizeKeyword(text),
    averageMonthlySearches: asNumber(metrics?.avgMonthlySearches),
    monthlySearchVolumes: parseMonthlyVolumes(metrics?.monthlySearchVolumes),
    competition: metrics?.competition ?? null,
    competitionIndex: asNumber(metrics?.competitionIndex),
    lowTopOfPageBidMicros: asNumber(metrics?.lowTopOfPageBidMicros),
    highTopOfPageBidMicros: asNumber(metrics?.highTopOfPageBidMicros),
    provenance,
  };
}

export function redactSecrets(text: string): string {
  return text
    .replace(/"private_key"\s*:\s*"[^"]+"/g, '"private_key":"[REDACTED]"')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/g, "Bearer [REDACTED]")
    .replace(/ya29\.[A-Za-z0-9._\-]+/g, "[REDACTED_TOKEN]");
}

export function parseServiceAccountJson(raw: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new DemandError("GOOGLE_ADS_SERVICE_ACCOUNT_JSON is not valid JSON.", {
      className: "config",
      cause: error,
    });
  }
  if (!parsed || typeof parsed !== "object") {
    throw new DemandError("GOOGLE_ADS_SERVICE_ACCOUNT_JSON must be a JSON object.", {
      className: "config",
    });
  }
  const record = parsed as Record<string, unknown>;
  if (typeof record.client_email !== "string" || typeof record.private_key !== "string") {
    throw new DemandError(
      "GOOGLE_ADS_SERVICE_ACCOUNT_JSON must include client_email and private_key.",
      { className: "config" },
    );
  }
  return record;
}

export function classifyGoogleAdsHttpError(status: number, body: string): DemandError {
  const requestIdMatch = body.match(/"requestId"\s*:\s*"([^"]+)"/);
  const requestId = requestIdMatch?.[1] ?? null;
  const safeBody = redactSecrets(body).slice(0, 500);

  if (status === 401 || status === 403) {
    return new DemandError(
      `Google Ads auth/access error (${status}). Check service-account access and Ads API Basic Access. ${safeBody}`,
      { className: status === 401 ? "auth" : "access", status, requestId },
    );
  }
  if (status === 429 || /RESOURCE_EXHAUSTED/i.test(body)) {
    return new DemandError(`Google Ads quota/rate limit (${status}). ${safeBody}`, {
      className: "quota",
      status,
      requestId,
    });
  }
  if (status >= 500 || status === 408) {
    return new DemandError(`Google Ads transient error (${status}). ${safeBody}`, {
      className: "transient",
      status,
      requestId,
    });
  }
  return new DemandError(`Google Ads request failed (${status}). ${safeBody}`, {
    className: "unknown",
    status,
    requestId,
  });
}

export class GoogleAdsDemandSource implements DemandSource {
  readonly name = "google-ads-keyword-plan";
  private readonly apiVersion: string;
  private readonly customerId: string;
  private readonly loginCustomerId: string | undefined;
  private readonly credentials: Record<string, unknown>;
  private readonly cache: DemandCache;
  private readonly refresh: boolean;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly sleepImpl: (ms: number) => Promise<void>;
  private readonly nowImpl: () => number;
  private readonly accessTokenProvider: (() => Promise<string>) | undefined;

  constructor(config: GoogleAdsDemandConfig) {
    if (!config.customerId?.trim()) {
      throw new DemandError("GOOGLE_ADS_CUSTOMER_ID is required for live Demand Scout.", {
        className: "config",
      });
    }
    this.apiVersion = config.apiVersion?.trim() || DEFAULT_API_VERSION;
    this.customerId = config.customerId.replace(/-/g, "").trim();
    this.loginCustomerId = config.loginCustomerId?.replace(/-/g, "").trim() || undefined;
    this.credentials = parseServiceAccountJson(config.serviceAccountJson);
    this.cache = config.cache ?? new FileSystemDemandCache();
    this.refresh = Boolean(config.refresh);
    this.timeoutMs = config.timeoutMs ?? 20_000;
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.sleepImpl = config.sleepImpl ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.nowImpl = config.nowImpl ?? Date.now;
    this.accessTokenProvider = config.accessTokenProvider;
  }

  async discoverIdeas(seed: DemandSeed, target: DemandTarget): Promise<DemandIdea[]> {
    if (!seed.keyword && !seed.url) {
      throw new DemandError("discoverIdeas requires a seed keyword or URL.", { className: "config" });
    }
    const seedKey = seed.keyword ?? seed.url ?? "";
    const cacheKey = buildDemandCacheKey({
      source: this.name,
      apiVersion: this.apiVersion,
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

    const body: Record<string, unknown> = {
      language: target.languageConstant,
      geoTargetConstants: [target.geoTargetConstant],
      keywordPlanNetwork: target.network,
      includeAdultKeywords: false,
    };
    if (seed.keyword) {
      body.keywordSeed = { keywords: [seed.keyword] };
    }
    if (seed.url) {
      body.urlSeed = { url: seed.url };
    }

    const { json, requestId, retrievedAt } = await this.postJson<{
      results?: GoogleKeywordIdeaResult[];
    }>("generateKeywordIdeas", body);

    const provenance: DemandProvenance = {
      source: this.name,
      apiVersion: this.apiVersion,
      operation: "generateKeywordIdeas",
      retrievedAt,
      requestId,
      seedKeyword: seed.keyword ?? null,
      seedUrl: seed.url ?? null,
      target,
      cached: false,
      cacheRetrievedAt: null,
      originalRetrievedAt: retrievedAt,
    };

    const ideas = (json.results ?? [])
      .map((row) => {
        const text = row.text?.trim();
        if (!text) return null;
        return metricsFromGoogle(text, row.keywordIdeaMetrics ?? row.keywordMetrics, provenance);
      })
      .filter((row): row is DemandIdea => Boolean(row));

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
      apiVersion: this.apiVersion,
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

    const body = {
      language: target.languageConstant,
      geoTargetConstants: [target.geoTargetConstant],
      keywordPlanNetwork: target.network,
      keywords: cleaned,
    };

    const { json, requestId, retrievedAt } = await this.postJson<{
      results?: GoogleKeywordHistoricalResult[];
    }>("generateKeywordHistoricalMetrics", body);

    const provenance: DemandProvenance = {
      source: this.name,
      apiVersion: this.apiVersion,
      operation: "generateKeywordHistoricalMetrics",
      retrievedAt,
      requestId,
      seedKeyword: cleaned[0] ?? null,
      seedUrl: null,
      target,
      cached: false,
      cacheRetrievedAt: null,
      originalRetrievedAt: retrievedAt,
    };

    const metrics = (json.results ?? [])
      .map((row) => {
        const text = row.text?.trim();
        if (!text) return null;
        return metricsFromGoogle(text, row.keywordMetrics, provenance);
      })
      .filter((row): row is DemandMetric => Boolean(row));

    await this.cache.set(cacheKey, metrics, provenance);
    return metrics;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessTokenProvider) return this.accessTokenProvider();
    const client = new JWT({
      email: String(this.credentials.client_email),
      key: String(this.credentials.private_key),
      scopes: [ADWORDS_SCOPE],
    });
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;
    if (!token) {
      throw new DemandError("Failed to obtain Google Ads access token from service account.", {
        className: "auth",
      });
    }
    return token;
  }

  private async throttlePlanning(): Promise<void> {
    const now = this.nowImpl();
    const wait = PLANNING_MIN_INTERVAL_MS - (now - lastPlanningCallAt);
    if (wait > 0) await sleep(wait, this.sleepImpl);
    lastPlanningCallAt = this.nowImpl();
  }

  private async postJson<T>(
    operation: "generateKeywordIdeas" | "generateKeywordHistoricalMetrics",
    body: Record<string, unknown>,
  ): Promise<{ json: T; requestId: string | null; retrievedAt: string }> {
    const url = `https://googleads.googleapis.com/${this.apiVersion}/customers/${this.customerId}:${operation}`;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      await this.throttlePlanning();
      const token = await this.getAccessToken();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        // No developer-token header — sunset 2026-09-09.
        if (this.loginCustomerId) {
          headers["login-customer-id"] = this.loginCustomerId;
        }

        const response = await this.fetchImpl(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const text = await response.text();
        const requestId =
          response.headers.get("request-id") ??
          text.match(/"requestId"\s*:\s*"([^"]+)"/)?.[1] ??
          null;

        if (!response.ok) {
          const error = classifyGoogleAdsHttpError(response.status, text);
          const retryable = error.className === "transient" || error.className === "quota";
          if (retryable && attempt < maxAttempts) {
            const backoff = Math.min(8_000, 500 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 200);
            await sleep(backoff, this.sleepImpl);
            continue;
          }
          throw error;
        }

        let json: T;
        try {
          json = JSON.parse(text) as T;
        } catch (error) {
          throw new DemandError("Google Ads returned non-JSON success body.", {
            className: "invalid_response",
            requestId,
            cause: error,
          });
        }

        return { json, requestId, retrievedAt: new Date(this.nowImpl()).toISOString() };
      } catch (error) {
        if (error instanceof DemandError) throw error;
        if (attempt < maxAttempts) {
          const backoff = Math.min(8_000, 500 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 200);
          await sleep(backoff, this.sleepImpl);
          continue;
        }
        throw new DemandError(redactSecrets(error instanceof Error ? error.message : String(error)), {
          className: "transient",
          cause: error,
        });
      } finally {
        clearTimeout(timer);
      }
    }

    throw new DemandError("Google Ads request failed after retries.", { className: "transient" });
  }
}

/** Test helper: reset the module-level 1 QPS gate. */
export function resetPlanningThrottleForTests(): void {
  lastPlanningCallAt = 0;
}

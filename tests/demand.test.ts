import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FileSystemDemandCache,
  buildDemandCacheKey,
} from "@/lib/demand/cache";
import { clusterDemandRows } from "@/lib/demand/cluster";
import {
  GoogleAdsDemandSource,
  classifyGoogleAdsHttpError,
  parseMonthOfYear,
  parseMonthlyVolumes,
  parseServiceAccountJson,
  redactSecrets,
  resetPlanningThrottleForTests,
} from "@/lib/demand/google-ads";
import { createDemandSource, resolveDemandMode } from "@/lib/demand";
import { resolveTarget } from "@/lib/demand/cli";
import { MockDemandSource } from "@/lib/demand/mock";
import { normalizeKeyword } from "@/lib/demand/normalize";
import { buildDemandReport, formatDemandReportText } from "@/lib/demand/report";
import {
  DEFAULT_DEMAND_TARGET,
  DemandError,
  type DemandProvenance,
} from "@/lib/demand/types";

const tempDirs: string[] = [];

afterEach(async () => {
  resetPlanningThrottleForTests();
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) await rm(dir, { recursive: true, force: true });
  }
});

async function tempCache(): Promise<FileSystemDemandCache> {
  const dir = await mkdtemp(path.join(tmpdir(), "demand-cache-"));
  tempDirs.push(dir);
  return new FileSystemDemandCache(dir);
}

function fakeServiceAccountJson(): string {
  return JSON.stringify({
    type: "service_account",
    project_id: "canaiyet-test",
    private_key_id: "abc",
    private_key:
      "-----BEGIN PRIVATE KEY-----\\nMIIE\\n-----END PRIVATE KEY-----\\n",
    client_email: "demand-scout@canaiyet-test.iam.gserviceaccount.com",
    client_id: "123",
    token_uri: "https://oauth2.googleapis.com/token",
  });
}

describe("DemandSource contract + mock path", () => {
  it("defaults discover/history to mock and smoke to live", () => {
    expect(resolveDemandMode({ command: "discover", liveFlag: false, forceMock: false })).toBe(
      "mock",
    );
    expect(resolveDemandMode({ command: "history", liveFlag: false, forceMock: false })).toBe(
      "mock",
    );
    expect(resolveDemandMode({ command: "smoke", liveFlag: false, forceMock: false })).toBe("live");
    expect(resolveDemandMode({ command: "smoke", liveFlag: false, forceMock: true })).toBe("mock");
  });

  it("mock discover preserves provenance and null metrics", async () => {
    const cache = await tempCache();
    const source = new MockDemandSource(cache, true);
    const ideas = await source.discoverIdeas({ keyword: "AI lead follow up" }, DEFAULT_DEMAND_TARGET);
    expect(ideas.length).toBeGreaterThan(3);
    const missing = ideas.find((idea) => idea.keywordText === "missing metric keyword");
    expect(missing?.averageMonthlySearches).toBeNull();
    expect(missing?.competitionIndex).toBeNull();
    expect(ideas[0]?.provenance.source).toBe("mock");
    expect(ideas[0]?.provenance.apiVersion).toBe("v25");
    expect(ideas[0]?.provenance.requestId).toBeTruthy();
  });

  it("mock history filters requested keywords", async () => {
    const cache = await tempCache();
    const source = new MockDemandSource(cache, true);
    const metrics = await source.getHistoricalMetrics(
      ["ai lead follow up", "ai crm automation"],
      DEFAULT_DEMAND_TARGET,
    );
    expect(metrics.map((row) => row.keywordText).sort()).toEqual([
      "ai crm automation",
      "ai lead follow up",
    ]);
  });
});

describe("normalization + clustering", () => {
  it("normalizes keywords deterministically", () => {
    expect(normalizeKeyword("  AI Lead Follow-Up!! ")).toBe("ai lead follow up");
  });

  it("clusters related lead-follow-up intentions and preserves raw members", async () => {
    const cache = await tempCache();
    const source = new MockDemandSource(cache, true);
    const ideas = await source.discoverIdeas({ keyword: "AI lead follow up" }, DEFAULT_DEMAND_TARGET);
    const clusters = clusterDemandRows(ideas);
    const lead = clusters.find((cluster) =>
      cluster.familyLabel.includes("Follow up with an inbound sales lead"),
    );
    expect(lead).toBeTruthy();
    expect(lead!.members).toEqual(
      expect.arrayContaining([
        "ai lead follow up",
        "automate sales follow up with ai",
        "ai crm automation",
        "can chatgpt update crm",
      ]),
    );
    // Representative volume is not a naive sum of near-duplicates.
    expect(lead!.aggregateAverageMonthlySearches).toBe(5400);
  });
});

describe("cache", () => {
  it("includes source/version/operation/target in the key and supports hit/expiry/refresh", async () => {
    const keyA = buildDemandCacheKey({
      source: "mock",
      apiVersion: "v25",
      operation: "generateKeywordIdeas",
      seedOrKeywords: "AI lead follow up",
      target: DEFAULT_DEMAND_TARGET,
    });
    const keyB = buildDemandCacheKey({
      source: "mock",
      apiVersion: "v24",
      operation: "generateKeywordIdeas",
      seedOrKeywords: "AI lead follow up",
      target: DEFAULT_DEMAND_TARGET,
    });
    expect(keyA).not.toBe(keyB);

    const cache = await tempCache();
    const provenance: DemandProvenance = {
      source: "mock",
      apiVersion: "v25",
      operation: "generateKeywordIdeas",
      retrievedAt: "2026-09-01T00:00:00.000Z",
      requestId: "r1",
      seedKeyword: "AI lead follow up",
      seedUrl: null,
      target: DEFAULT_DEMAND_TARGET,
      cached: false,
      cacheRetrievedAt: null,
      originalRetrievedAt: "2026-09-01T00:00:00.000Z",
    };
    await cache.set(keyA, [{ ok: true }], provenance, 50);
    const hit = await cache.get<{ ok: boolean }[]>(keyA);
    expect(hit?.value[0]?.ok).toBe(true);
    expect(hit?.provenance.originalRetrievedAt).toBe("2026-09-01T00:00:00.000Z");

    await new Promise((resolve) => setTimeout(resolve, 60));
    const expired = await cache.get(keyA);
    expect(expired).toBeNull();

    const source = new MockDemandSource(cache, false);
    const first = await source.discoverIdeas({ keyword: "AI lead follow up" }, DEFAULT_DEMAND_TARGET);
    const second = await source.discoverIdeas({ keyword: "AI lead follow up" }, DEFAULT_DEMAND_TARGET);
    expect(first[0]?.provenance.cached).toBe(false);
    expect(second[0]?.provenance.cached).toBe(true);
    expect(second[0]?.provenance.originalRetrievedAt).toBe(first[0]?.provenance.retrievedAt);

    const refreshed = new MockDemandSource(cache, true);
    const third = await refreshed.discoverIdeas({ keyword: "AI lead follow up" }, DEFAULT_DEMAND_TARGET);
    expect(third[0]?.provenance.cached).toBe(false);
  });
});

describe("Google Ads adapter safety", () => {
  it("does not require a developer token and validates service-account JSON without printing secrets", () => {
    const parsed = parseServiceAccountJson(fakeServiceAccountJson());
    expect(parsed.client_email).toContain("demand-scout@");
    expect(() => parseServiceAccountJson("{not-json")).toThrow(DemandError);

    const redacted = redactSecrets(
      `Bearer ya29.secret-token "private_key":"-----BEGIN PRIVATE KEY-----\\nSECRET\\n-----END PRIVATE KEY-----\\n"`,
    );
    expect(redacted).not.toContain("ya29.secret-token");
    expect(redacted).not.toContain("SECRET");
    expect(redacted).toContain("[REDACTED]");
  });

  it("classifies auth, access, and quota errors distinctly", () => {
    expect(classifyGoogleAdsHttpError(401, '{"requestId":"r-auth"}').className).toBe("auth");
    expect(classifyGoogleAdsHttpError(403, '{"requestId":"r-access"}').className).toBe("access");
    expect(
      classifyGoogleAdsHttpError(429, '{"error":{"status":"RESOURCE_EXHAUSTED"},"requestId":"r-q"}')
        .className,
    ).toBe("quota");
    expect(classifyGoogleAdsHttpError(503, "boom").className).toBe("transient");
  });

  it("rejects live factory when developer token env is present", () => {
    const previous = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = "legacy";
    process.env.GOOGLE_ADS_CUSTOMER_ID = "1234567890";
    process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON = fakeServiceAccountJson();
    try {
      expect(() => createDemandSource({ mode: "live" })).toThrow(/DEVELOPER_TOKEN|developer-token|obsolete/i);
    } finally {
      if (previous === undefined) delete process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
      else process.env.GOOGLE_ADS_DEVELOPER_TOKEN = previous;
      delete process.env.GOOGLE_ADS_CUSTOMER_ID;
      delete process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON;
    }
  });

  it("throttles planning calls to about 1 QPS and retries transient failures", async () => {
    const cache = await tempCache();
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        return new Response("temporary", { status: 503 });
      }
      return new Response(
        JSON.stringify({
          results: [
            {
              text: "ai lead follow up",
              keywordIdeaMetrics: { avgMonthlySearches: 10 },
            },
          ],
        }),
        { status: 200, headers: { "request-id": "req-1" } },
      );
    });

    const sleeps: number[] = [];
    let now = 1_000_000;
    const source = new GoogleAdsDemandSource({
      customerId: "123-456-7890",
      serviceAccountJson: fakeServiceAccountJson(),
      cache,
      refresh: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleepImpl: async (ms) => {
        sleeps.push(ms);
        now += ms;
      },
      nowImpl: () => now,
      accessTokenProvider: async () => "test-token",
    });

    const ideas = await source.discoverIdeas({ keyword: "AI lead follow up" }, DEFAULT_DEMAND_TARGET);
    expect(ideas[0]?.keywordText).toBe("ai lead follow up");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleeps.some((ms) => ms >= 500)).toBe(true);

    // Second call should wait for 1 QPS gate.
    now += 100;
    await source.discoverIdeas({ keyword: "AI lead follow up" }, DEFAULT_DEMAND_TARGET);
    expect(sleeps.some((ms) => ms >= 900)).toBe(true);

    const fetchCalls = fetchImpl.mock.calls as unknown as Array<[string, RequestInit?]>;
    const firstCall = fetchCalls[0];
    expect(firstCall).toBeTruthy();
    const authHeader = firstCall?.[1]?.headers as Record<string, string>;
    expect(authHeader.Authorization).toBe("Bearer test-token");
    expect(authHeader).not.toHaveProperty("developer-token");
    expect(JSON.stringify(authHeader).toLowerCase()).not.toContain("developer-token");
  });
});

describe("report", () => {
  it("emits stable JSON fields and readable text without inventing future factors", async () => {
    const cache = await tempCache();
    const source = new MockDemandSource(cache, true);
    const ideas = await source.discoverIdeas({ keyword: "AI lead follow up" }, DEFAULT_DEMAND_TARGET);
    const report = buildDemandReport({
      mode: "mock",
      operation: "generateKeywordIdeas",
      target: DEFAULT_DEMAND_TARGET,
      seed: { keyword: "AI lead follow up" },
      ideas,
    });
    expect(report.futureFactors.businessValue).toBeNull();
    expect(report.clusters.length).toBeGreaterThan(0);
    const text = formatDemandReportText(report);
    expect(text).toContain("Candidate capability families");
    expect(text).toContain("Follow up with an inbound sales lead");
    expect(text).toContain("Demand Scout does not trigger benchmarks");
    expect(JSON.stringify(report)).toContain('"apiVersion":"v25"');
  });
});

describe("CAY-07 blockers", () => {
  it("rejects unsupported country/language instead of mislabeling US/en constants", () => {
    const usEn = resolveTarget({ country: "US", language: "en" });
    expect(usEn).toEqual({
      country: "US",
      language: "en",
      geoTargetConstant: "geoTargetConstants/2840",
      languageConstant: "languageConstants/1000",
      network: "GOOGLE_SEARCH",
    });

    expect(() => resolveTarget({ country: "CA", language: "fr" })).toThrow(DemandError);
    expect(() => resolveTarget({ country: "CA", language: "fr" })).toThrow(/Unsupported Demand Scout target/i);
    expect(() => resolveTarget({ country: "GB", language: "en" })).toThrow(/Unsupported Demand Scout target/i);
    expect(() => resolveTarget({ country: "US", language: "es" })).toThrow(/Unsupported Demand Scout target/i);
  });

  it("parses Google MonthOfYear enums and never invents month 0", () => {
    expect(parseMonthOfYear("SEPTEMBER")).toBe(9);
    expect(parseMonthOfYear("september")).toBe(9);
    expect(parseMonthOfYear(9)).toBe(9);
    expect(parseMonthOfYear("9")).toBe(9);
    expect(parseMonthOfYear("NOT_A_MONTH")).toBeNull();
    expect(parseMonthOfYear(0)).toBeNull();
    expect(parseMonthOfYear(13)).toBeNull();

    const volumes = parseMonthlyVolumes([
      { year: 2026, month: "SEPTEMBER", monthlySearches: 2600 },
      { year: "2026", month: "JUNE", monthlySearches: "2200" },
      { year: 2026, month: "WEIRD", monthlySearches: 1 },
      { year: null, month: null, monthlySearches: null },
    ]);
    expect(volumes[0]).toEqual({ year: 2026, month: 9, monthlySearches: 2600 });
    expect(volumes[1]).toEqual({ year: 2026, month: 6, monthlySearches: 2200 });
    expect(volumes[2]).toEqual({ year: 2026, month: null, monthlySearches: 1 });
    expect(volumes[3]).toEqual({ year: null, month: null, monthlySearches: null });
    expect(JSON.stringify(volumes)).not.toContain('"month":0');
  });

  it("mock fixtures with enum months produce numeric 1–12 months", async () => {
    const cache = await tempCache();
    const source = new MockDemandSource(cache, true);
    const ideas = await source.discoverIdeas({ keyword: "AI lead follow up" }, DEFAULT_DEMAND_TARGET);
    const lead = ideas.find((idea) => idea.keywordText === "ai lead follow up");
    expect(lead?.monthlySearchVolumes.map((row) => row.month)).toEqual([6, 7, 8]);
    const history = await source.getHistoricalMetrics(["ai lead follow up"], DEFAULT_DEMAND_TARGET);
    expect(history[0]?.monthlySearchVolumes.map((row) => row.month)).toEqual([6, 7, 9]);
  });
});

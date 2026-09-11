import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { leadScenarios } from "@/evals/capabilities/lead-followup/scenarios";
import { World } from "@/evals/environments/world";
import { chatBody, fetchOpenRouterChat, openRouterHeaders, OpenRouterProvider, parseOpenRouterResponse } from "@/evals/providers/openrouter";
import { GuardError, SpendLedger, assertPaidExecutionAllowed, configFromEnv, type OpenRouterRunConfig } from "@/evals/providers/openrouter-config";
import { gitSha } from "@/evals/provenance/git";
import { runScenario } from "@/evals/runners/run-suite";

const MODEL = "review/exact-model";
const cleanGit = { sha: "a".repeat(40), dirty: false };
const cfg = (overrides: Partial<OpenRouterRunConfig> = {}): OpenRouterRunConfig => ({
  model: MODEL,
  apiKey: "synthetic-key",
  maxTokens: 200,
  maxTurns: 4,
  timeoutMs: 10,
  maxRetries: 0,
  maxSpendUsd: 1,
  requestReserveUsd: 0.01,
  providerSlug: "review",
  routeMode: "pinned",
  maxScenarios: 1,
  appUrl: "https://review.invalid",
  appTitle: "Review",
  ...overrides,
});

function paidEnv(extra: Record<string, string> = {}) {
  return {
    NODE_ENV: "development",
    CI: "false",
    GITHUB_ACTIONS: "false",
    VERCEL: "0",
    CANAIYET_PAID_RUN: "1",
    OPENROUTER_API_KEY: "synthetic-key",
    OPENROUTER_MODEL: MODEL,
    OPENROUTER_PROVIDER: "review",
    OPENROUTER_MAX_SPEND_USD: "0.01",
    OPENROUTER_REQUEST_RESERVE_USD: "0.01",
    OPENROUTER_MAX_SCENARIOS: "1",
    ...extra,
  };
}

function reply(metadata?: Record<string, unknown>) {
  return {
    id: "gen-review",
    model: MODEL,
    provider: "not-the-route",
    usage: { cost: 0.001, prompt_tokens: 4, completion_tokens: 1 },
    choices: [{ finish_reason: "stop", message: { role: "assistant", content: "Done" } }],
    ...(metadata ? { openrouter_metadata: metadata } : {}),
  };
}

const selected = (provider: string, attempt = 1) => ({
  requested: MODEL,
  strategy: "direct",
  attempt,
  endpoints: { total: 1, available: [{ provider, model: MODEL, selected: true }] },
  attempts: [{ provider, model: MODEL, status: 200 }],
  pipeline: [{ type: "plugin", name: "none" }],
});

describe("CAY-20260910-09 review corrections", () => {
  it("N1: pins one provider and asks for router metadata", () => {
    const body = chatBody(cfg(), [{ role: "user", content: "hi" }], []);
    expect(body.provider).toEqual({ allow_fallbacks: false, require_parameters: true, only: ["review"], order: ["review"] });
    expect(openRouterHeaders("synthetic-key")["X-OpenRouter-Metadata"]).toBe("enabled");
  });

  it("N1: does not treat a top-level provider field as the route", () => {
    const parsed = parseOpenRouterResponse(reply());
    expect(parsed.servedProvider).toBeNull();
    expect(parsed.routeError).toMatch(/metadata/i);
  });

  it("N1: keeps the selected provider, attempts, and pipeline from router metadata", async () => {
    const provider = new OpenRouterProvider(cfg(), new SpendLedger(1, 0.01), async () => reply(selected("Review")));
    const result = await runScenario(leadScenarios[0]!, provider);
    const attempt = result.provenance?.attempts[0];
    expect(result.provenance?.servedProvider).toBe("Review");
    expect(attempt?.router?.selectedProvider).toBe("Review");
    expect(attempt?.router?.attempts).toHaveLength(1);
    expect(attempt?.router?.pipeline).toHaveLength(1);
    expect(JSON.stringify(result.provenance)).not.toContain("not-the-route");
  });

  it("N1: invalidates a selected provider that does not match the pin", async () => {
    const provider = new OpenRouterProvider(cfg(), new SpendLedger(1, 0.01), async () => reply(selected("other")));
    const result = await provider.run({ capabilityCode: "CAP-001", instruction: "x", allowedTools: [], payload: {} }, World.fresh());
    expect(result.benchmarkInvalid).toBe(true);
    expect(result.error).toMatch(/did not match pinned/);
  });

  it("N2: refuses a paid run from a dirty or short commit", () => {
    expect(() => assertPaidExecutionAllowed(paidEnv(), cfg(), { sha: "a".repeat(40), dirty: true })).toThrow(/clean worktree|dirty/i);
    expect(() => assertPaidExecutionAllowed(paidEnv(), cfg(), { sha: "abc1234", dirty: false })).toThrow(/full commit|clean worktree/i);
    expect(() => assertPaidExecutionAllowed(paidEnv(), cfg(), cleanGit)).not.toThrow();
  });

  it("N2: the recorded commit is a full SHA", () => {
    expect(gitSha()).toMatch(/^[0-9a-f]{40}$/);
  });

  it("N2: the real transport refuses before fetch when the provider is not pinned", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CI", "false");
    vi.stubEnv("GITHUB_ACTIONS", "false");
    vi.stubEnv("VERCEL", "0");
    vi.stubEnv("CANAIYET_PAID_RUN", "1");
    vi.stubEnv("OPENROUTER_MAX_SPEND_USD", "0.01");
    vi.stubEnv("OPENROUTER_REQUEST_RESERVE_USD", "0.01");
    vi.stubEnv("OPENROUTER_MODEL", MODEL);
    vi.stubEnv("OPENROUTER_API_KEY", "synthetic-key");
    const network = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", network);
    const unpinned = chatBody(cfg({ providerSlug: null, routeMode: null }), [], []);
    await expect(fetchOpenRouterChat(unpinned, { apiKey: "synthetic-key", timeoutMs: 10 })).rejects.toThrow(GuardError);
    expect(network).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("N4: the env template names the reserve and reviewer", () => {
    const example = readFileSync(".env.example", "utf8");
    expect(example).toContain("OPENROUTER_REQUEST_RESERVE_USD=");
    expect(example).toContain("CANAIYET_REVIEWED_BY=");
    expect(example).toContain("OPENROUTER_PROVIDER=");
  });

  it("records an explicit unpinned route instead of inventing a pin", () => {
    const selectedConfig = configFromEnv({ NODE_ENV: "test", OPENROUTER_ROUTE: "unpinned" });
    expect(selectedConfig.routeMode).toBe("unpinned");
    expect(selectedConfig.providerSlug).toBeNull();
    expect(() => assertPaidExecutionAllowed(paidEnv(), cfg({ providerSlug: null, routeMode: "unpinned" }), cleanGit)).toThrow(/pin/i);
  });
});

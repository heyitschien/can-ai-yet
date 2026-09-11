import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenRouterProvider, fetchOpenRouterChat, chatBody } from "@/evals/providers/openrouter";
import { GuardError, SpendLedger, configFromEnv, type OpenRouterRunConfig } from "@/evals/providers/openrouter-config";
import { runScenario, runCapability } from "@/evals/runners/run-suite";
import { leadScenarios } from "@/evals/capabilities/lead-followup/scenarios";
import { World } from "@/evals/environments/world";
import { buildPersistPayload, persistIntentionalRun } from "@/evals/persistence/persist-run";
import { scenarioContentHash, resolveScenarioWrite } from "@/evals/persistence/scenario-identity";
import { getPublishedPage } from "@/lib/data/public-data";
import type { SuiteResult } from "@/evals/types";

const MODEL = "review/exact-model";
const cfg: OpenRouterRunConfig = {
  model: MODEL,
  apiKey: "synthetic-key",
  maxTokens: 200,
  maxTurns: 4,
  timeoutMs: 10,
  maxRetries: 0,
  maxSpendUsd: 1,
  requestReserveUsd: 0.01,
  maxScenarios: 1,
  appUrl: "https://review.invalid",
  appTitle: "Review",
};
const input = { capabilityCode: "CAP-001", instruction: "Review", payload: {}, allowedTools: [] as string[] };

function reply(calls?: unknown[]) {
  return {
    id: "gen-review",
    model: MODEL,
    provider: "route-review",
    usage: { cost: 0.01, prompt_tokens: 12, completion_tokens: 6 },
    choices: [{
      finish_reason: calls ? "tool_calls" : "stop",
      message: { role: "assistant", content: calls ? null : "Done", ...(calls ? { tool_calls: calls } : {}) },
    }],
  };
}

function validTool() {
  return { id: "call-1", type: "function", function: { name: "send_reply", arguments: JSON.stringify({ to: "devon.park@example.com", body: "$180" }) } };
}

beforeEach(() => {
  vi.stubEnv("CI", "true");
  vi.stubEnv("CANAIYET_PAID_RUN", "");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("network blocked"); }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("CAY-20260910-08 remaining corrections", () => {
  it("R1: refuses the first request unless a finite reserve exists", () => {
    expect(new SpendLedger(0.01).beginAttempt().ok).toBe(false);
    expect(new SpendLedger(0.01, 0.01).beginAttempt().ok).toBe(true);
  });

  it("R1: does not dispatch a retry when the previous attempt charge is unknown", async () => {
    const client = vi.fn(async () => { throw new GuardError("TIMEOUT", "synthetic timeout"); });
    const result = await new OpenRouterProvider({ ...cfg, maxRetries: 1 }, new SpendLedger(1, 0.01), client).run(input, World.fresh());
    expect(client).toHaveBeenCalledTimes(1);
    expect(result.usage?.costUsd).toBeNull();
    expect(result.usage?.attempts).toHaveLength(1);
    expect(result.usage?.attempts[0]?.generationId).toBeNull();
    expect(result.usage?.attempts[0]?.uncertain).toBe(true);
  });

  it("R2: blocks real transport in NODE_ENV=test even with a leftover paid flag", async () => {
    vi.stubEnv("CI", "false");
    vi.stubEnv("GITHUB_ACTIONS", "false");
    vi.stubEnv("VERCEL", "0");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("CANAIYET_PAID_RUN", "1");
    vi.stubEnv("OPENROUTER_MAX_SPEND_USD", "1");
    vi.stubEnv("OPENROUTER_REQUEST_RESERVE_USD", "0.01");
    const network = vi.fn(async () => new Response(JSON.stringify(reply())));
    vi.stubGlobal("fetch", network);
    await expect(fetchOpenRouterChat(chatBody(cfg, [], []), { apiKey: "synthetic-key", timeoutMs: 10 })).rejects.toThrow(/test|paid/i);
    expect(network).not.toHaveBeenCalled();
  });

  it("R2: rejects an infinite cap at the default transport boundary", async () => {
    vi.stubEnv("CI", "false");
    vi.stubEnv("GITHUB_ACTIONS", "false");
    vi.stubEnv("VERCEL", "0");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CANAIYET_PAID_RUN", "1");
    vi.stubEnv("OPENROUTER_MAX_SPEND_USD", "Infinity");
    vi.stubEnv("OPENROUTER_REQUEST_RESERVE_USD", "0.01");
    const network = vi.fn(async () => new Response(JSON.stringify(reply())));
    vi.stubGlobal("fetch", network);
    await expect(fetchOpenRouterChat(chatBody(cfg, [], []), { apiKey: "synthetic-key", timeoutMs: 10 })).rejects.toThrow(/finite|cap|spend/i);
    expect(network).not.toHaveBeenCalled();
  });

  it.each(["missing-id", "wrong-type", "nameless-sibling", "bad-json"])("R3: rejects malformed tool calls (%s) before changing the world", async (kind) => {
    const call: Record<string, unknown> = validTool();
    if (kind === "missing-id") delete call.id;
    if (kind === "wrong-type") call.type = "unsupported";
    if (kind === "bad-json") call.function = { name: "send_reply", arguments: "{bad" };
    const calls = kind === "nameless-sibling" ? [call, {}] : [call];
    const provider = new OpenRouterProvider(cfg, new SpendLedger(1, 0.01), async () => reply(calls));
    const result = await runScenario(leadScenarios[11]!, provider);
    expect(result.benchmarkInvalid).toBe(true);
    expect(result.actualState.sent).toEqual([]);
    expect(result.actualState.contacts).toBeDefined();
  });

  it("R4: a failed dispatch stays in attempt history and is not retried with an unknown charge", async () => {
    const client = vi.fn(async () => { throw new GuardError("TIMEOUT", "synthetic timeout"); });
    const result = await runScenario(
      leadScenarios[0]!,
      new OpenRouterProvider({ ...cfg, maxRetries: 1 }, new SpendLedger(1, 0.01), client),
    );
    expect(client).toHaveBeenCalledTimes(1);
    expect(result.provenance?.attempts).toHaveLength(1);
    expect(result.provenance?.attempts[0]?.generationId).toBeNull();
  });

  it("R4: a successful response completes the attempt that was opened before dispatch", async () => {
    const provider = new OpenRouterProvider(cfg, new SpendLedger(1, 0.01), async () => reply());
    const result = await runScenario(leadScenarios[0]!, provider);
    expect(result.provenance?.generationIds).toEqual(["gen-review"]);
    expect(result.provenance?.attempts).toHaveLength(1);
    expect(result.provenance?.attempts[0]?.generationId).toBe("gen-review");
  });

  it("R5: duplicate result membership cannot settle a run", async () => {
    const suite = await runCapability("CAP-001");
    suite.results = suite.results.map(() => suite.results[0]!);
    const settle = vi.fn(async () => {});
    await persistIntentionalRun({
      async upsertScenarios(rows) { return new Map(rows.map((row) => [row.slug, row.slug])); },
      async insertRun() { return "run-review"; },
      async insertResults() {},
      markRunSettled: settle,
    }, suite, leadScenarios);
    expect(settle).not.toHaveBeenCalled();
  });

  it.each(["failed-run", "invalid-run", "wrong-capability"])("R6: public loader falls back when the accepted chain is %s", async (kind) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://review.invalid");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "synthetic-key");
    const slug = leadScenarios[0]!.slug;
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request) => {
      const path = new URL(String(url)).pathname;
      const data = path.endsWith("/capabilities")
        ? [{
            id: "cap-001",
            code: "CAP-001",
            slug: "follow-up-with-sales-leads",
            title: "Review",
            short_description: "Review",
            categories: { slug: "sales", name: "Sales" },
            accepted_test_run_id: "run-review",
            evidence_level: "simulation",
            status: "green",
            published: true,
          }]
        : path.endsWith("/test_runs")
          ? [{
              id: "run-review",
              capability_id: kind === "wrong-capability" ? "cap-other" : "cap-001",
              model_provider: "openrouter",
              model_name: MODEL,
              fixture_version: "acme-v1",
              git_sha: "104ca989",
              completed_at: "2026-09-11T00:00:00Z",
              success_count: 1,
              failure_count: 0,
              total_count: 1,
              critical_failure_count: 0,
              score: 1,
              published: true,
              status: kind === "failed-run" ? "failed" : "completed",
              tool_configuration: { benchmarkValid: kind !== "invalid-run" },
            }]
          : [{
              test_run_id: "run-review",
              success: true,
              critical: false,
              failure_explanation: null,
              test_scenarios: { slug, title: "Review" },
            }];
      return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
    }));
    const page = await getPublishedPage("follow-up-with-sales-leads");
    expect(page?.source).toBe("repository-artifact");
  });

  it("R7: reuses a definition after its stored versioned slug is read back", async () => {
    const suite = await runCapability("CAP-001");
    const base = buildPersistPayload(suite, leadScenarios).scenarios[0]!;
    const old = { id: "old", slug: base.slug, contentHash: scenarioContentHash(base), definition: base };
    const changed = { ...base, title: "Changed title" };
    const first = resolveScenarioWrite([old], changed);
    if (first.action !== "insert") throw new Error("setup failed");
    const storedDefinition = { ...changed, slug: first.slug };
    const stored = { id: "new", slug: first.slug, contentHash: scenarioContentHash(storedDefinition), definition: storedDefinition };
    expect(resolveScenarioWrite([old, stored], changed)).toMatchObject({ action: "reuse", id: "new" });
  });

  it("R7: scenario identity is stable across object-key ordering", async () => {
    const suite = await runCapability("CAP-001");
    const row = buildPersistPayload(suite, leadScenarios).scenarios[0]!;
    const reordered = { ...row, inputPayload: Object.fromEntries(Object.entries(row.inputPayload).reverse()) };
    expect(scenarioContentHash(reordered)).toBe(scenarioContentHash(row));
  });

  it("reads the per-request reserve and can bound a one-scenario plan", () => {
    const selected = configFromEnv({
      NODE_ENV: "test",
      OPENROUTER_MODEL: MODEL,
      OPENROUTER_MAX_SCENARIOS: "1",
      OPENROUTER_MAX_RETRIES: "0",
      OPENROUTER_MAX_SPEND_USD: "0.01",
      OPENROUTER_REQUEST_RESERVE_USD: "0.01",
    });
    expect(selected.maxScenarios).toBe(1);
    expect(selected.maxRetries).toBe(0);
    expect(selected.requestReserveUsd).toBe(0.01);
  });
});

it("R4: paid CLI carries scenario provenance into run-level persistence", async () => {
  vi.resetModules();
  for (const [key, value] of Object.entries({
    CI: "false",
    GITHUB_ACTIONS: "false",
    VERCEL: "0",
    NODE_ENV: "development",
    CANAIYET_PAID_RUN: "1",
    OPENROUTER_API_KEY: "synthetic-key",
    OPENROUTER_MODEL: "review/exact-model",
    OPENROUTER_MAX_SPEND_USD: "0.01",
    OPENROUTER_REQUEST_RESERVE_USD: "0.01",
    OPENROUTER_MAX_SCENARIOS: "1",
    OPENROUTER_MAX_RETRIES: "0",
  })) vi.stubEnv(key, value);
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    id: "gen-cli-review",
    model: "review/exact-model",
    provider: "route-review",
    choices: [{ finish_reason: "stop", message: { role: "assistant", content: "Done" } }],
    usage: { cost: 0.001, prompt_tokens: 10, completion_tokens: 1 },
  }))));
  const write = vi.fn<(suite: SuiteResult) => string>(() => "mock-artifact-no-file-written");
  vi.doMock("@/evals/persistence/persist-run", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/evals/persistence/persist-run")>()),
    writeLocalRunArtifact: write,
  }));
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
  process.argv = ["node", "scripts/run-openrouter-cap001.ts", "--execute"];
  await import("@/scripts/run-openrouter-cap001");
  await vi.waitFor(() => expect(write).toHaveBeenCalledOnce());
  const suite = write.mock.calls[0]![0];
  expect(suite.results[0]?.provenance?.generationIds).toEqual(["gen-cli-review"]);
  const { buildPersistPayload: build } = await import("@/evals/persistence/persist-run");
  const { leadScenarios: scenarios } = await import("@/evals/capabilities/lead-followup/scenarios");
  expect(build(suite, scenarios.slice(0, 1)).run.toolConfiguration.generationIds).toEqual(["gen-cli-review"]);
});

/** CAY-20260910-05: independent, offline reproductions against PR #2 d289b42.
 * it.fails asserts the desired contract: passing means the defect reproduced.
 * Remove .fails when the builder implements the corresponding correction.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { leadScenarios } from "@/evals/capabilities/lead-followup/scenarios";
import { World } from "@/evals/environments/world";
import { OpenRouterProvider, fetchOpenRouterChat, chatBody, type OpenRouterChatBody } from "@/evals/providers/openrouter";
import { GuardError, SpendLedger, configFromEnv } from "@/evals/providers/openrouter-config";
import { buildCap001DryRunPlan } from "@/evals/providers/openrouter-plan";
import { runCapability, runScenario } from "@/evals/runners/run-suite";
import { buildPersistPayload, decideAccept, persistIntentionalRun, type RunPersistRow } from "@/evals/persistence/persist-run";
import { pairEvidence, type RemoteCapability, type RemoteRun } from "@/evals/evidence/pair";
import { publishedRecords } from "@/lib/evidence/load";

const MODEL = "review/exact-model";
const KEY = "synthetic-review-key-never-a-real-secret";
const config = (overrides: Partial<ReturnType<typeof configFromEnv>> = {}) => ({
  model: MODEL, apiKey: KEY, maxTokens: 200, maxTurns: 4, timeoutMs: 10,
  maxRetries: 0, maxSpendUsd: 1, maxScenarios: 12,
  appUrl: "https://review.invalid", appTitle: "Review", ...overrides,
});
const input = { capabilityCode: "CAP-001", instruction: "Read the record", allowedTools: ["get_contact"], payload: {} };
const tool = (name: string, args: unknown, id = "call-1") => ({
  id, type: "function", function: { name, arguments: JSON.stringify(args) },
});
const completion = (message: Record<string, unknown> = { content: "Done" }, cost = 0.01, finishReason = "stop") => ({
  id: "gen-review", model: MODEL, provider: "route-review",
  choices: [{ message: { role: "assistant", ...message }, finish_reason: finishReason }],
  usage: { prompt_tokens: 12, completion_tokens: 6, cost },
});
const local = publishedRecords().find((record) => record.catalog.code === "CAP-001")!;
const remote: RemoteCapability = {
  code: "CAP-001", slug: local.catalog.slug, title: local.catalog.title,
  shortDescription: "Review", categorySlug: "sales", categoryName: "Sales",
  evidenceLevel: "simulation", humanRequiredWhen: [], implementationBlueprint: [], synonyms: [],
  acceptedRunId: "run-review", status: "gray", supervisionLevel: "high",
  currentScore: null, currentSuccesses: null, currentTotal: null, currentCostUsd: null,
  currentRuntimeSeconds: null, currentCriticalFailures: 0, whatAiCanDo: [], commonFailureModes: [],
  lastTestedAt: null, modelProvider: null, modelName: null, configurationLabel: null,
};
const remoteRun: RemoteRun = {
  id: "run-review", provider: "openrouter", model: MODEL, fixtureVersion: "acme-v1",
  gitSha: "d289b42", completedAt: "2026-09-11T00:00:00Z", successCount: 12,
  failureCount: 0, totalCount: 12, criticalFailureCount: 0, score: 1,
  totalCostUsd: 0.12, medianRuntimeSeconds: 1, published: true,
};

beforeEach(() => {
  vi.stubEnv("CI", "true");
  vi.stubEnv("CANAIYET_PAID_RUN", "");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("REVIEW: unexpected network attempt blocked"); }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("CAY review: controls that hold", () => {
  it("dry-run performs no fetch and excludes the API key", () => {
    const plan = buildCap001DryRunPlan(config());
    expect(plan.paidRequests).toBe(0);
    expect(plan.scenarioCount).toBe(12);
    expect(plan.maxHttpRequests).toBe(48);
    expect(JSON.stringify(plan)).not.toContain(KEY);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("does not send expected or forbidden assertions to the model", async () => {
    const client = vi.fn(async () => completion());
    await runScenario(leadScenarios[0]!, new OpenRouterProvider(config(), new SpendLedger(1), client));
    const body = (client.mock.calls as unknown as [OpenRouterChatBody][])[0]![0];
    expect(JSON.stringify(body.messages)).not.toContain("deal_stage");
    expect(JSON.stringify(body.messages)).not.toContain("criticalOnFail");
    expect(body.model).toBe(MODEL);
    expect(body.provider).toEqual({ allow_fallbacks: false, require_parameters: true });
  });
  it("blocks an unsupported mutation through World.call", async () => {
    let turn = 0;
    const provider = new OpenRouterProvider(config(), new SpendLedger(1), async () => ++turn === 1
      ? completion({ tool_calls: [tool("send_reply", { to: "x@example.com", body: "Hi" })] }, 0.01, "tool_calls")
      : completion());
    const world = World.fresh();
    await provider.run(input, world);
    expect(world.sent).toHaveLength(0);
  });
  it.each(["missing-cost", "model-mismatch", "non-object"])("halts subsequent requests on %s", async (kind) => {
    const client = vi.fn(async () => kind === "non-object" ? null : kind === "model-mismatch"
      ? { ...completion(), model: "other/model" } : { ...completion(), usage: {} });
    const provider = new OpenRouterProvider(config(), new SpendLedger(1), client);
    expect((await provider.run(input, World.fresh())).benchmarkInvalid).toBe(true);
    expect((await provider.run(input, World.fresh())).benchmarkInvalid).toBe(true);
    expect(client).toHaveBeenCalledTimes(1);
  });
  it("bounds retries and invalidates a repeated timeout", async () => {
    const client = vi.fn(async () => { throw new GuardError("TIMEOUT", "synthetic timeout"); });
    const provider = new OpenRouterProvider(config({ maxRetries: 1 }), new SpendLedger(1), client);
    expect((await provider.run(input, World.fresh())).benchmarkInvalid).toBe(true);
    expect(client).toHaveBeenCalledTimes(2);
  });
  it("the HTTP transport aborts on its configured deadline", async () => {
    vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    })));
    await expect(fetchOpenRouterChat(chatBody(config(), [], []), { apiKey: KEY, timeoutMs: 5 }))
      .rejects.toMatchObject({ code: "TIMEOUT" });
  });
  it("does not echo a secret-bearing HTTP error body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(KEY, { status: 401 })));
    const provider = new OpenRouterProvider(config(), new SpendLedger(1));
    const result = await provider.run(input, World.fresh());
    expect(result.benchmarkInvalid).toBe(true);
    expect(result.error).toBe("OpenRouter HTTP 401");
    expect(JSON.stringify(result)).not.toContain(KEY);
  });
  it("malformed JSON arguments do not mutate World", async () => {
    let turn = 0;
    const call = tool("send_reply", {});
    call.function.arguments = "{";
    const provider = new OpenRouterProvider(config(), new SpendLedger(1), async () => ++turn === 1
      ? completion({ tool_calls: [call] }, 0.01, "tool_calls") : completion());
    const world = World.fresh();
    await provider.run({ ...input, allowedTools: ["send_reply"] }, world);
    expect(world.sent).toHaveLength(0);
  });
});

describe("CAY review: unmet contracts (expected failures, not fixes)", () => {
  it.fails("F1: refuses a request once the spend cap is exhausted", async () => {
    const ledger = new SpendLedger(0.01);
    const client = vi.fn(async () => completion());
    const provider = new OpenRouterProvider(config({ maxSpendUsd: 0.01 }), ledger, client);
    await provider.run(input, World.fresh());
    await provider.run(input, World.fresh());
    expect(client).toHaveBeenCalledTimes(1); // Actual: 2; $0.02 spent against $0.01 cap.
  });
  it.fails("F1: preserves uncertain billed attempts instead of treating a retry as fully accounted", async () => {
    let calls = 0;
    const provider = new OpenRouterProvider(config({ maxRetries: 1 }), new SpendLedger(1), async () => {
      if (++calls === 1) throw new GuardError("TIMEOUT", "May already have been billed");
      return completion();
    });
    const result = await provider.run(input, World.fresh());
    expect(result.usage?.costUsd).toBeNull(); // Actual: 0.01; first request disappeared.
  });
  it.fails("F2: default HTTP transport enforces the paid gate even outside the CLI", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(completion())));
    vi.stubGlobal("fetch", fetchMock);
    await new OpenRouterProvider(config(), new SpendLedger(1)).run(input, World.fresh());
    expect(fetchMock).not.toHaveBeenCalled(); // Actual: sends in CI with no human flag.
  });
  it.fails.each(["length", "error", "content_filter"])("F3: rejects %s after a successful tool mutation", async (finish) => {
    let calls = 0;
    const provider = new OpenRouterProvider(config(), new SpendLedger(1), async () => ++calls === 1
      ? completion({ tool_calls: [tool("send_reply", { to: "devon.park@example.com", body: "$180" })] }, 0.01, "tool_calls")
      : completion({ content: null }, 0.01, finish));
    const result = await runScenario(leadScenarios[11]!, provider);
    expect(result.benchmarkInvalid).toBe(true); // Actual: false, success: true.
  });
  it.fails("F3: rejects a malformed assistant envelope instead of finishing successfully", async () => {
    const provider = new OpenRouterProvider(config(), new SpendLedger(1), async () => ({
      ...completion(), choices: [{ message: {}, error: { code: 500, message: "failed" } }],
    }));
    expect((await provider.run(input, World.fresh())).benchmarkInvalid).toBe(true);
  });
  it.fails("F4: retains served route/model and generation ID in the run artifact", async () => {
    const suite = await runCapability("CAP-001", new OpenRouterProvider(config(), new SpendLedger(1), async () => completion()));
    const serialized = JSON.stringify({ suite, payload: buildPersistPayload(suite, leadScenarios) });
    expect(serialized).toContain("gen-review"); // Actual: all ProviderUsage provenance discarded.
    expect(serialized).toContain("route-review");
  });
  it.fails("F5: result-write failure cannot leave an acceptable completed run", async () => {
    const suite = await runCapability("CAP-001");
    let saved: RunPersistRow | undefined;
    await expect(persistIntentionalRun({
      async upsertScenarios(rows) { return new Map(rows.map((row) => [row.slug, row.slug])); },
      async insertRun(row) { saved = row; return "orphan"; },
      async insertResults() { throw new Error("synthetic result insert failure"); },
    }, suite, leadScenarios)).rejects.toThrow("synthetic result insert failure");
    const decision = decideAccept({ runId: "orphan", runStatus: saved!.status, currentAcceptedRunId: null, replaceAccepted: false });
    expect(decision.allowed).toBe(false); // Actual: true for a run with no persisted results.
  });
  it.fails.each([0, 1])("F6: refuses a 12/12 public headline when only %i results exist", (count) => {
    const paired = pairEvidence({ local, remote, acceptedRun: remoteRun,
      acceptedResults: Array.from({ length: count }, () => ({ slug: "one", title: "One", success: true, critical: false, failureExplanation: null })),
    });
    expect(paired?.source).toBe("repository-artifact"); // Actual: accepted-run, score 100%.
  });
  it.fails("F6: rejects summary counts that disagree with the underlying scenario outcomes", () => {
    const paired = pairEvidence({ local, remote, acceptedRun: remoteRun,
      acceptedResults: leadScenarios.map((s) => ({ slug: s.slug, title: s.title, success: false, critical: false, failureExplanation: "failed" })),
    });
    expect(paired?.capability.currentScore).not.toBe(1); // Actual: 100% with twelve failures.
  });
});

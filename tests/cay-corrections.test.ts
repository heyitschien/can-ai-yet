import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { leadScenarios } from "@/evals/capabilities/lead-followup/scenarios";
import { World } from "@/evals/environments/world";
import { OpenRouterProvider } from "@/evals/providers/openrouter";
import { GuardError, SpendLedger, configFromEnv } from "@/evals/providers/openrouter-config";
import { runCapability, runScenario } from "@/evals/runners/run-suite";
import { buildPersistPayload, decideAccept, persistIntentionalRun, type RunPersistRow } from "@/evals/persistence/persist-run";
import { resolveScenarioWrite, type StoredScenario } from "@/evals/persistence/scenario-identity";
import { acceptRunAtomic } from "@/evals/persistence/accept-run";
import { pairEvidence, type RemoteCapability, type RemoteRun } from "@/evals/evidence/pair";
import { publishedRecords } from "@/lib/evidence/load";

const MODEL = "review/exact-model";
const KEY = "synthetic-review-key-never-a-real-secret";
const config = (overrides: Partial<ReturnType<typeof configFromEnv>> = {}) => ({
  model: MODEL,
  apiKey: KEY,
  maxTokens: 200,
  maxTurns: 4,
  timeoutMs: 10,
  maxRetries: 0,
  maxSpendUsd: 1,
  requestReserveUsd: 0.01,
  providerSlug: null,
  routeMode: null,
  maxScenarios: 12,
  appUrl: "https://review.invalid",
  appTitle: "Review",
  ...overrides,
});
const input = { capabilityCode: "CAP-001", instruction: "Read the record", allowedTools: ["get_contact"], payload: {} };
const tool = (name: string, args: unknown, id = "call-1") => ({
  id,
  type: "function",
  function: { name, arguments: JSON.stringify(args) },
});
const completion = (message: Record<string, unknown> = { content: "Done" }, cost = 0.01, finishReason = "stop") => ({
  id: "gen-review",
  model: MODEL,
  provider: "route-review",
  choices: [{ message: { role: "assistant", ...message }, finish_reason: finishReason }],
  usage: { prompt_tokens: 12, completion_tokens: 6, cost },
  openrouter_metadata: {
    requested: MODEL,
    strategy: "direct",
    attempt: 1,
    endpoints: { total: 1, available: [{ provider: "route-review", model: MODEL, selected: true }] },
    attempts: [{ provider: "route-review", model: MODEL, status: 200 }],
    pipeline: [],
  },
});
const local = publishedRecords().find((record) => record.catalog.code === "CAP-001");
if (!local) throw new Error("missing local evidence");
const remote: RemoteCapability = {
  code: "CAP-001",
  slug: local.catalog.slug,
  title: local.catalog.title,
  shortDescription: "Review",
  categorySlug: "sales",
  categoryName: "Sales",
  evidenceLevel: "simulation",
  humanRequiredWhen: [],
  implementationBlueprint: [],
  synonyms: [],
  acceptedRunId: "run-review",
  status: "gray",
  supervisionLevel: "high",
  currentScore: null,
  currentSuccesses: null,
  currentTotal: null,
  currentCostUsd: null,
  currentRuntimeSeconds: null,
  currentCriticalFailures: 0,
  whatAiCanDo: [],
  commonFailureModes: [],
  lastTestedAt: null,
  modelProvider: null,
  modelName: null,
  configurationLabel: null,
};
const remoteRun: RemoteRun = {
  id: "run-review",
  provider: "openrouter",
  model: MODEL,
  fixtureVersion: "acme-v1",
  gitSha: "d289b42",
  completedAt: "2026-09-11T00:00:00Z",
  successCount: 12,
  failureCount: 0,
  totalCount: 12,
  criticalFailureCount: 0,
  score: 1,
  totalCostUsd: 0.12,
  medianRuntimeSeconds: 1,
  published: true,
  status: "completed",
  benchmarkValid: true,
  capabilityCode: "CAP-001",
};

beforeEach(() => {
  vi.stubEnv("CI", "true");
  vi.stubEnv("CANAIYET_PAID_RUN", "");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("unexpected network attempt blocked"); }));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("CAY-20260910-06 corrections", () => {
  it("F1: refuses a request once the spend cap is exhausted", async () => {
    const client = vi.fn(async () => completion());
    const provider = new OpenRouterProvider(config({ maxSpendUsd: 0.01 }), new SpendLedger(0.01, 0.01), client);
    await provider.run(input, World.fresh());
    await provider.run(input, World.fresh());
    expect(client).toHaveBeenCalledTimes(1);
  });

  it("F1: preserves uncertain billed attempts instead of treating a retry as fully accounted", async () => {
    let calls = 0;
    const provider = new OpenRouterProvider(config({ maxRetries: 1 }), new SpendLedger(1, 0.01), async () => {
      if (++calls === 1) throw new GuardError("TIMEOUT", "May already have been billed");
      return completion();
    });
    const result = await provider.run(input, World.fresh());
    expect(calls).toBe(1);
    expect(result.usage?.costUsd).toBeNull();
  });

  it("F2: default HTTP transport enforces the paid gate even outside the CLI", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(completion())));
    vi.stubGlobal("fetch", fetchMock);
    await new OpenRouterProvider(config(), new SpendLedger(1, 0.01)).run(input, World.fresh());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(JSON.stringify(await new OpenRouterProvider(config(), new SpendLedger(1, 0.01)).run(input, World.fresh()))).not.toContain(KEY);
  });

  it.each(["length", "error", "content_filter"])("F3: rejects %s after a successful tool mutation", async (finish) => {
    let calls = 0;
    const provider = new OpenRouterProvider(config(), new SpendLedger(1, 0.01), async () =>
      ++calls === 1
        ? completion({ tool_calls: [tool("send_reply", { to: "devon.park@example.com", body: "$180" })] }, 0.01, "tool_calls")
        : completion({ content: null }, 0.01, finish),
    );
    const result = await runScenario(leadScenarios[11]!, provider);
    expect(result.benchmarkInvalid).toBe(true);
  });

  it("F3: rejects a malformed assistant envelope instead of finishing successfully", async () => {
    const provider = new OpenRouterProvider(config(), new SpendLedger(1, 0.01), async () => ({
      ...completion(),
      choices: [{ message: {}, error: { code: 500, message: "failed" } }],
    }));
    expect((await provider.run(input, World.fresh())).benchmarkInvalid).toBe(true);
  });

  it("F4: retains served route/model and generation ID in the run artifact", async () => {
    const suite = await runCapability("CAP-001", new OpenRouterProvider(config(), new SpendLedger(1, 0.01), async () => completion()));
    const serialized = JSON.stringify({ suite, payload: buildPersistPayload(suite, leadScenarios) });
    expect(serialized).toContain("gen-review");
    expect(serialized).toContain("route-review");
  });

  it("F5: result-write failure cannot leave an acceptable completed run", async () => {
    const suite = await runCapability("CAP-001");
    let saved: RunPersistRow | undefined;
    await expect(
      persistIntentionalRun(
        {
          async upsertScenarios(rows) {
            return new Map(rows.map((row) => [row.slug, row.slug]));
          },
          async insertRun(row) {
            saved = row;
            return "orphan";
          },
          async insertResults() {
            throw new Error("synthetic result insert failure");
          },
        },
        suite,
        leadScenarios,
      ),
    ).rejects.toThrow("synthetic result insert failure");
    const decision = decideAccept({ runId: "orphan", runStatus: saved?.status ?? "completed", currentAcceptedRunId: null, replaceAccepted: false });
    expect(decision.allowed).toBe(false);
  });

  it.each([0, 1])("F6: refuses a 12/12 public headline when only %i results exist", (count) => {
    const paired = pairEvidence({
      local,
      remote,
      acceptedRun: remoteRun,
      acceptedResults: Array.from({ length: count }, () => ({ slug: "one", title: "One", success: true, critical: false, failureExplanation: null })),
    });
    expect(paired?.source).toBe("repository-artifact");
  });

  it("F6: rejects summary counts that disagree with the underlying scenario outcomes", () => {
    const paired = pairEvidence({
      local,
      remote,
      acceptedRun: remoteRun,
      acceptedResults: leadScenarios.map((scenario) => ({ slug: scenario.slug, title: scenario.title, success: false, critical: false, failureExplanation: "failed" })),
    });
    expect(paired?.source).toBe("repository-artifact");
    expect(paired?.capability.currentScore).not.toBe(1);
  });

  it("F7: pointer-write failure does not publish, and a second accept cannot replace the first", async () => {
    const published = new Set<string>();
    let accepted: string | null = null;
    const store = {
      async readRun(runId: string) {
        return {
          id: runId,
          status: "completed",
          capabilityId: "cap-1",
          published: false,
          benchmarkValid: true,
          expectedResultCount: 1,
          resultScenarioIds: ["lead"],
        };
      },
      async lockCapability() {
        return { acceptedRunId: accepted };
      },
      async commitAccept(input: { runId: string; expectedPriorAcceptedRunId: string | null }) {
        if (input.expectedPriorAcceptedRunId !== accepted) return { ok: false as const, reason: "accepted_run_conflict" };
        if (input.runId === "fail") return { ok: false as const, reason: "synthetic pointer-write failure" };
        published.add(input.runId);
        accepted = input.runId;
        return { ok: true as const };
      },
    };
    const failed = await acceptRunAtomic(store, { runId: "fail", replaceAccepted: false, reviewedBy: "reviewer" });
    expect(failed.ok).toBe(false);
    expect(published.has("fail")).toBe(false);
    expect(await acceptRunAtomic(store, { runId: "run-a", replaceAccepted: false, reviewedBy: "reviewer" })).toMatchObject({ ok: true });
    const replaced = await acceptRunAtomic(store, { runId: "run-b", replaceAccepted: false, reviewedBy: "reviewer" });
    expect(replaced.ok).toBe(false);
    expect(accepted).toBe("run-a");
  });

  it("F8: a later definition cannot overwrite an accepted scenario identity", () => {
    const original: StoredScenario = {
      id: "old",
      slug: "ordinary-qualified-lead",
      contentHash: "abc",
      definition: {
        capabilityCode: "CAP-001",
        slug: "ordinary-qualified-lead",
        title: "Ordinary qualified lead",
        description: "Frozen",
        fixtureVersion: "acme-v1",
        inputPayload: { from: "alex.rivera@example.com" },
        expectedState: [],
        forbiddenState: [],
        critical: false,
      },
    };
    const frozen = structuredClone(original);
    const changed = {
      ...original.definition,
      title: "Changed title",
      expectedState: [{ kind: "no_sends" }],
    };
    const decision = resolveScenarioWrite([original], changed);
    expect(decision.action).toBe("insert");
    if (decision.action === "insert") expect(decision.slug).not.toBe(original.slug);
    expect(original).toEqual(frozen);
  });
});

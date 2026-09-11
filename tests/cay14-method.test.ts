import { describe, expect, it } from "vitest";
import { leadScenarios } from "@/evals/capabilities/lead-followup/scenarios";
import { detectNoProgress } from "@/evals/providers/no-progress";
import { estimateSonnet46FromObserved, SONNET_46_OBSERVED } from "@/evals/providers/observed-cost";
import { OpenRouterProvider, chatBody, parseOpenRouterResponse, type OpenRouterChatBody } from "@/evals/providers/openrouter";
import { SpendLedger, configFromEnv } from "@/evals/providers/openrouter-config";
import { buildCap001DryRunPlan } from "@/evals/providers/openrouter-plan";
import { selectCap001Scenarios } from "@/evals/providers/scenario-selection";
import { World } from "@/evals/environments/world";
import type { ToolTraceEntry } from "@/evals/types";

const MODEL = "openai/gpt-4.1-mini";

function config(overrides: Partial<ReturnType<typeof configFromEnv>> = {}) {
  return {
    model: MODEL,
    apiKey: "test-key",
    maxTokens: 200,
    maxTurns: 6,
    timeoutMs: 1000,
    maxRetries: 0,
    maxSpendUsd: 1,
    requestReserveUsd: 0.01,
    providerSlug: null,
    routeMode: null,
    maxScenarios: 12,
    appUrl: "https://can-ai-yet.local",
    appTitle: "CanAIYet",
    ...overrides,
  };
}

function completion(message: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const finishReason = message.tool_calls ? "tool_calls" : "stop";
  return {
    id: "gen-test",
    model: MODEL,
    choices: [{ message, finish_reason: finishReason }],
    usage: { prompt_tokens: 12, completion_tokens: 6, cost: 0.0002 },
    openrouter_metadata: {
      requested: MODEL,
      strategy: "direct",
      attempt: 1,
      endpoints: { total: 1, available: [{ provider: "OpenAI", model: MODEL, selected: true }] },
      attempts: [],
      pipeline: [],
    },
    ...extra,
  };
}

function policyCall(id: string, topic: string) {
  return {
    content: null,
    tool_calls: [{ id, type: "function", function: { name: "get_policy", arguments: JSON.stringify({ topic }) } }],
  };
}

function trace(name: string, args: Record<string, unknown>, result: unknown): ToolTraceEntry {
  return { name, arguments: args, ok: true, result };
}

describe("CAY-14 no-progress stop", () => {
  it("stops a repeated identical lookup as a scored TOOL_LOOP and does not send another request", async () => {
    let calls = 0;
    const client = async () => {
      calls += 1;
      return completion(policyCall(`call-${calls}`, "pricing"));
    };
    const provider = new OpenRouterProvider(config(), new SpendLedger(1, 0.01), client);
    const scenario = leadScenarios[0];
    if (!scenario) throw new Error("missing scenario");
    const result = await provider.run(
      { capabilityCode: "CAP-001", instruction: "x", allowedTools: scenario.allowedTools, payload: {} },
      World.fresh(),
    );
    expect(result.benchmarkInvalid).not.toBe(true);
    expect(result.failureMode).toBe("TOOL_LOOP");
    expect(result.error).toMatch(/TOOL_LOOP/);
    expect(result.toolTrace).toHaveLength(3);
    expect(calls).toBe(3);
    const later = await provider.run(
      { capabilityCode: "CAP-001", instruction: "x", allowedTools: scenario.allowedTools, payload: {} },
      World.fresh(),
    );
    expect(later.failureMode).toBe("TOOL_LOOP");
    expect(calls).toBe(6);
  });

  it("does not stop after two identical calls", () => {
    const rows = [trace("get_policy", { topic: "pricing" }, { text: "Standard visit is $180." }), trace("get_policy", { topic: "pricing" }, { text: "Standard visit is $180." })];
    expect(detectNoProgress(rows)).toBeNull();
  });

  it("does not stop when the result changes", () => {
    const rows = [
      trace("get_policy", { topic: "pricing" }, null),
      trace("get_policy", { topic: "pricing" }, null),
      trace("get_policy", { topic: "pricing" }, { text: "Standard visit is $180." }),
    ];
    expect(detectNoProgress(rows)).toBeNull();
  });

  it("treats trimmed arguments as the same call", () => {
    const rows = [
      trace("get_policy", { topic: "pricing" }, null),
      trace("get_policy", { topic: " pricing " }, null),
      trace("get_policy", { topic: "pricing" }, null),
    ];
    expect(detectNoProgress(rows)?.mode).toBe("TOOL_LOOP");
  });

  it("labels different arguments with the same useless result as NO_PROGRESS", () => {
    const rows = [
      trace("get_policy", { topic: "pricing" }, null),
      trace("get_policy", { topic: "support" }, null),
      trace("get_policy", { topic: "crm" }, null),
    ];
    expect(detectNoProgress(rows)?.mode).toBe("NO_PROGRESS");
  });
});

describe("CAY-14 scenario segments", () => {
  it("keeps a prefix of one as a labeled segment, not a full score", () => {
    const selected = selectCap001Scenarios(leadScenarios, null, 1);
    expect(selected.scenarios.map((scenario) => scenario.id)).toEqual(["LEAD-001"]);
    expect(selected.segment.kind).toBe("prefix-segment");
    expect(selected.segment.combinable).toBe(false);
    expect(selected.segment.acceptedEvidence).toBe("requires-one-clean-full-run");
    expect(selected.segment.note).toMatch(/not a 12-scenario score/);
  });

  it("selects an explicit list and a forward range in frozen order", () => {
    const list = selectCap001Scenarios(leadScenarios, "LEAD-012,LEAD-006", 12);
    expect(list.scenarios.map((scenario) => scenario.id)).toEqual(["LEAD-006", "LEAD-012"]);
    expect(list.segment.kind).toBe("explicit-segment");
    const range = selectCap001Scenarios(leadScenarios, "LEAD-006:LEAD-008", 12);
    expect(range.scenarios.map((scenario) => scenario.id)).toEqual(["LEAD-006", "LEAD-007", "LEAD-008"]);
  });

  it("refuses an unknown id and a backward range", () => {
    expect(() => selectCap001Scenarios(leadScenarios, "LEAD-099", 12)).toThrow(/Unknown scenario/);
    expect(() => selectCap001Scenarios(leadScenarios, "LEAD-008:LEAD-006", 12)).toThrow(/forward/);
  });
});

describe("CAY-14 cost plan and cache safety", () => {
  it("estimates from scored Sonnet trials and says it is not a bill", () => {
    const plan = estimateSonnet46FromObserved(12, 8);
    expect(plan.notABill).toBe(true);
    expect(plan.observedScoredScenarioCount).toBe(5);
    expect(plan.basis).toMatch(/LEAD-006/);
    expect(SONNET_46_OBSERVED.excludedFromRate).toContain("LEAD-006");
    expect(plan.typicalUsd).toBeGreaterThan(0.35);
    expect(plan.typicalUsd).toBeLessThan(0.45);
    expect(plan.highUsd).toBeCloseTo(12 * 0.04122, 5);
    expect(plan.doNotStartIfRemainingKeyCreditBelowUsd).toBe(1.5);
    expect(plan.note).toMatch(/\$0\.25/);
  });

  it("does not send cache control or response caching", () => {
    const body = chatBody(config(), [{ role: "user", content: "hi" }], []);
    const encoded = JSON.stringify(body);
    expect(encoded).not.toContain("cache_control");
    expect(encoded).not.toContain("\"cache\"");
    expect(body.provider.allow_fallbacks).toBe(false);
  });

  it("records cache token fields when the gateway returns them and leaves them empty otherwise", () => {
    const missing = parseOpenRouterResponse(completion({ content: "Done" }));
    expect(missing.cacheReadTokens).toBeNull();
    expect(missing.cacheWriteTokens).toBeNull();
    const cached = parseOpenRouterResponse(
      completion(
        { content: "Done" },
        { usage: { prompt_tokens: 12, completion_tokens: 6, cost: 0.0002, prompt_tokens_details: { cached_tokens: 40, cache_write_tokens: 8 } } },
      ),
    );
    expect(cached.cacheReadTokens).toBe(40);
    expect(cached.cacheWriteTokens).toBe(8);
  });

  it("keeps the dry-run price unquoted and disables response caching", () => {
    const plan = buildCap001DryRunPlan(config({ model: "anthropic/claude-sonnet-4.6" }), {});
    expect(plan.paidRequests).toBe(0);
    expect(plan.estimatedMaxCostUsd).toBeNull();
    expect(plan.responseCache).toBe("disabled");
    expect(plan.promptCache.cacheControlSent).toBe(false);
    expect(plan.observedCostPlan?.notABill).toBe(true);
    expect(plan.qualificationGate.status).toBe("proposal-not-adopted");
    expect(plan.selection.kind).toBe("full");
  });
});

describe("CAY-14 request body type", () => {
  it("still builds a pinned body without a cache field", () => {
    const body: OpenRouterChatBody = chatBody(config({ providerSlug: "anthropic", routeMode: "pinned" }), [{ role: "user", content: "hi" }], []);
    expect(body.provider.only).toEqual(["anthropic"]);
    expect("cache_control" in body).toBe(false);
  });
});

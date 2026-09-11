import { describe, expect, it } from "vitest";
import { leadScenarios } from "@/evals/capabilities/lead-followup/scenarios";
import { judgeScenario } from "@/evals/judges/judge";
import { prepareWorld } from "@/evals/capabilities";
import { World } from "@/evals/environments/world";
import { OpenRouterProvider, chatBody, type OpenRouterChatBody } from "@/evals/providers/openrouter";
import { GuardError, SpendLedger, assertExactModelId, assertPaidExecutionAllowed, paidRunBlockedReason } from "@/evals/providers/openrouter-config";
import { buildCap001DryRunPlan } from "@/evals/providers/openrouter-plan";
import { configFromEnv, OPENROUTER_DEFAULTS } from "@/evals/providers/openrouter-config";
import { runScenario } from "@/evals/runners/run-suite";

const MODEL = "openai/gpt-4.1-mini";

function config(overrides: Partial<ReturnType<typeof configFromEnv>> = {}) {
  return {
    model: MODEL,
    apiKey: "test-key",
    maxTokens: 200,
    maxTurns: 4,
    timeoutMs: 1000,
    maxRetries: 0,
    maxSpendUsd: 1,
    maxScenarios: 12,
    appUrl: "https://can-ai-yet.local",
    appTitle: "CanAIYet",
    ...overrides,
  };
}

function completion(message: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return {
    id: "gen-test",
    model: MODEL,
    provider: "OpenAI",
    choices: [{ message }],
    usage: { prompt_tokens: 12, completion_tokens: 6, cost: 0.0002 },
    ...extra,
  };
}

describe("OpenRouter guards", () => {
  it("rejects auto-router and routing suffixes", () => {
    expect(() => assertExactModelId("openrouter/auto")).toThrow(GuardError);
    expect(() => assertExactModelId("openai/gpt-4.1-mini:nitro")).toThrow(GuardError);
    expect(assertExactModelId(MODEL)).toBe(MODEL);
  });

  it("blocks paid execution in CI and without the human flag", () => {
    expect(paidRunBlockedReason({ CI: "true", CANAIYET_PAID_RUN: "1" })).toMatch(/CI/);
    expect(paidRunBlockedReason({ CANAIYET_PAID_RUN: "0" })).toMatch(/CANAIYET_PAID_RUN/);
    expect(() => assertPaidExecutionAllowed({ NODE_ENV: "test" }, config())).toThrow(/tests must use mocks/);
  });

  it("dry-run plan makes zero paid requests and does not quote a price", () => {
    const plan = buildCap001DryRunPlan(config({ apiKey: "secret-key", model: MODEL }), {});
    expect(plan.paidRequests).toBe(0);
    expect(plan.scenarioCount).toBe(12);
    expect(plan.estimatedMaxCostUsd).toBeNull();
    expect(plan.allowFallbacks).toBe(false);
    expect(JSON.stringify(plan)).not.toContain("secret-key");
    expect(plan.maxHttpRequests).toBe(12 * OPENROUTER_DEFAULTS.maxTurns * (0 + 1) === 12 * 4 ? 48 : plan.maxHttpRequests);
    expect(plan.maxHttpRequests).toBe(48);
  });
});

describe("OpenRouter tool loop", () => {
  it("applies tool calls only through World.call and refuses fallback", async () => {
    const bodies: OpenRouterChatBody[] = [];
    const client = async (body: OpenRouterChatBody) => {
      bodies.push(body);
      if (bodies.length === 1) {
        return completion({
          content: null,
          tool_calls: [{ id: "call-1", type: "function", function: { name: "send_reply", arguments: JSON.stringify({ to: "alex.rivera@example.com", body: "Thanks" }) } }],
        });
      }
      return completion({ content: "Done" });
    };
    const provider = new OpenRouterProvider(config(), new SpendLedger(1), client);
    const scenario = leadScenarios[0];
    if (!scenario) throw new Error("missing scenario");
    const result = await runScenario(scenario, provider);
    expect(bodies[0]?.provider.allow_fallbacks).toBe(false);
    expect(bodies[0]?.model).toBe(MODEL);
    expect(bodies.every((body) => body.model === MODEL)).toBe(true);
    expect(result.actualState.toolsCalled).toEqual(["send_reply"]);
    expect(result.success).toBe(false);
  });

  it("does not let chat text bypass the judge", async () => {
    const client = async () => completion({ content: "I emailed Alex and updated the CRM." });
    const provider = new OpenRouterProvider(config(), new SpendLedger(1), client);
    const scenario = leadScenarios[0];
    if (!scenario) throw new Error("missing scenario");
    const world = World.fresh();
    prepareWorld(scenario, world);
    const agent = await provider.run(
      { capabilityCode: scenario.capabilityCode, instruction: scenario.instruction, allowedTools: scenario.allowedTools, payload: scenario.payload },
      world,
    );
    const judged = judgeScenario(world, scenario.expected, scenario.forbidden);
    expect(agent.finished).toBe(true);
    expect(world.sent).toEqual([]);
    expect(judged.success).toBe(false);
  });

  it("stops when the served model does not match and does not continue", async () => {
    let calls = 0;
    const client = async () => {
      calls += 1;
      return completion({ content: "Done" }, { model: "openai/gpt-4.1" });
    };
    const provider = new OpenRouterProvider(config(), new SpendLedger(1), client);
    const scenario = leadScenarios[0];
    if (!scenario) throw new Error("missing scenario");
    const first = await provider.run(
      { capabilityCode: "CAP-001", instruction: "x", allowedTools: scenario.allowedTools, payload: {} },
      World.fresh(),
    );
    const second = await provider.run(
      { capabilityCode: "CAP-001", instruction: "x", allowedTools: scenario.allowedTools, payload: {} },
      World.fresh(),
    );
    expect(first.benchmarkInvalid).toBe(true);
    expect(first.error).toMatch(/did not match/);
    expect(second.benchmarkInvalid).toBe(true);
    expect(calls).toBe(1);
  });

  it("stops at max turns without applying the unanswered calls", async () => {
    const client = async () =>
      completion({
        content: null,
        tool_calls: [{ id: "call-1", type: "function", function: { name: "send_reply", arguments: JSON.stringify({ to: "alex.rivera@example.com", body: "Hi" }) } }],
      });
    const provider = new OpenRouterProvider(config({ maxTurns: 1 }), new SpendLedger(1), client);
    const scenario = leadScenarios[0];
    if (!scenario) throw new Error("missing scenario");
    const world = World.fresh();
    const result = await provider.run(
      { capabilityCode: "CAP-001", instruction: "x", allowedTools: scenario.allowedTools, payload: {} },
      world,
    );
    expect(result.benchmarkInvalid).toBe(true);
    expect(result.error).toMatch(/max turns/);
    expect(world.sent).toEqual([]);
  });

  it("stops when spend is unverified or over the cap", async () => {
    const client = async () => completion({ content: "Done" }, { usage: { prompt_tokens: 1, completion_tokens: 1, cost: 2 } });
    const provider = new OpenRouterProvider(config({ maxSpendUsd: 0.5 }), new SpendLedger(0.5), client);
    const scenario = leadScenarios[0];
    if (!scenario) throw new Error("missing scenario");
    const result = await provider.run(
      { capabilityCode: "CAP-001", instruction: "x", allowedTools: scenario.allowedTools, payload: {} },
      World.fresh(),
    );
    expect(result.benchmarkInvalid).toBe(true);
    expect(result.error).toMatch(/exceeded the cap/);
  });

  it("never sends a fallback-enabled body", () => {
    const body = chatBody(config(), [{ role: "user", content: "hi" }], []);
    expect(body.provider).toEqual({ allow_fallbacks: false, require_parameters: true });
    expect(body.model).toBe(MODEL);
  });
});

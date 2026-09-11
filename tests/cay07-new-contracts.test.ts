/** Review-only tests against 104ca989. it.fails marks reproduced defects.
 * Remove the wrapper after correcting the production path. No live requests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenRouterProvider, fetchOpenRouterChat, chatBody } from "@/evals/providers/openrouter";
import { GuardError, SpendLedger, configFromEnv } from "@/evals/providers/openrouter-config";
import { runScenario, runCapability } from "@/evals/runners/run-suite";
import { leadScenarios } from "@/evals/capabilities/lead-followup/scenarios";
import { World } from "@/evals/environments/world";
import { buildPersistPayload, persistIntentionalRun } from "@/evals/persistence/persist-run";
import { scenarioContentHash, resolveScenarioWrite } from "@/evals/persistence/scenario-identity";
import { getPublishedPage } from "@/lib/data/public-data";

const MODEL = "review/exact-model";
const cfg = { model: MODEL, apiKey: "synthetic-key", maxTokens: 200, maxTurns: 4,
  timeoutMs: 10, maxRetries: 0, maxSpendUsd: 1, maxScenarios: 1,
  appUrl: "https://review.invalid", appTitle: "Review" };
const input = { capabilityCode: "CAP-001", instruction: "Review", payload: {}, allowedTools: [] };
const reply = (calls?: unknown[]) => ({ id: "gen-review", model: MODEL, provider: "route-review",
  usage: { cost: 0.01, prompt_tokens: 12, completion_tokens: 6 },
  choices: [{ finish_reason: calls ? "tool_calls" : "stop", message: { role: "assistant", content: calls ? null : "Done", ...(calls ? { tool_calls: calls } : {}) } }],
});
const validTool = () => ({ id: "call-1", type: "function", function: { name: "send_reply", arguments: JSON.stringify({ to: "devon.park@example.com", body: "$180" }) } });
beforeEach(() => {
  vi.stubEnv("CI", "true"); vi.stubEnv("CANAIYET_PAID_RUN", "");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("REVIEW network blocked"); }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("CAY07 remaining production contracts", () => {
  it.fails("R1: reserves an enforceable upper cost bound before the first request", () => {
    const ledger = new SpendLedger(0.01);
    expect(ledger.beginAttempt().ok).toBe(false); // No verified cost bound exists, but dispatch is allowed.
  });
  it.fails("R1: does not dispatch a retry when the previous attempt's charge is unknown", async () => {
    const client = vi.fn(async () => { throw new GuardError("TIMEOUT", "synthetic timeout"); });
    await new OpenRouterProvider({ ...cfg, maxRetries: 1 }, new SpendLedger(1), client).run(input, World.fresh());
    expect(client).toHaveBeenCalledTimes(1);
  });
  it.fails("R2: blocks real transport in NODE_ENV=test even with a leftover paid flag", async () => {
    vi.stubEnv("CI", "false"); vi.stubEnv("GITHUB_ACTIONS", "false"); vi.stubEnv("VERCEL", "0");
    vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("CANAIYET_PAID_RUN", "1"); vi.stubEnv("OPENROUTER_MAX_SPEND_USD", "1");
    const network = vi.fn(async () => new Response(JSON.stringify(reply())));
    vi.stubGlobal("fetch", network);
    await fetchOpenRouterChat(chatBody(cfg, [], []), { apiKey: cfg.apiKey, timeoutMs: 10 });
    expect(network).not.toHaveBeenCalled();
  });
  it.fails("R2: rejects an infinite cap at the default transport boundary", async () => {
    vi.stubEnv("CI", "false"); vi.stubEnv("GITHUB_ACTIONS", "false"); vi.stubEnv("VERCEL", "0");
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("CANAIYET_PAID_RUN", "1"); vi.stubEnv("OPENROUTER_MAX_SPEND_USD", "Infinity");
    const network = vi.fn(async () => new Response(JSON.stringify(reply()))); vi.stubGlobal("fetch", network);
    await fetchOpenRouterChat(chatBody(cfg, [], []), { apiKey: cfg.apiKey, timeoutMs: 10 });
    expect(network).not.toHaveBeenCalled();
  });
  it.fails.each(["missing-id", "wrong-type", "nameless-sibling"])("R3: rejects malformed tool calls (%s) before a valid pass", async (kind) => {
    const call: Record<string, unknown> = validTool();
    if (kind === "missing-id") delete call.id;
    if (kind === "wrong-type") call.type = "unsupported";
    const calls = kind === "nameless-sibling" ? [call, {}] : [call];
    let turn = 0;
    const provider = new OpenRouterProvider(cfg, new SpendLedger(1), async () => ++turn === 1 ? reply(calls) : reply());
    const result = await runScenario(leadScenarios[11]!, provider);
    expect(result.benchmarkInvalid).toBe(true); // Actual: false and success=true.
  });
  it.fails("R4: failed HTTP attempts remain in the durable attempt history", async () => {
    let calls=0;
    const provider = new OpenRouterProvider({ ...cfg, maxRetries: 1 }, new SpendLedger(1), async () => {
      if (++calls===1) throw new GuardError("TIMEOUT", "synthetic timeout");
      return reply();
    });
    const result=await runScenario(leadScenarios[0]!,provider);
    expect(result.provenance?.attempts).toHaveLength(2); // Only the successful response survives.
  });
  it.fails("R5: duplicate result membership cannot settle a run", async () => {
    const suite = await runCapability("CAP-001");
    suite.results = suite.results.map(() => suite.results[0]!);
    const settle=vi.fn(async () => {});
    await persistIntentionalRun({
      async upsertScenarios(rows) { return new Map(rows.map(r=>[r.slug,r.slug])); },
      async insertRun() { return "run-review"; }, async insertResults() {}, markRunSettled:settle,
    },suite,leadScenarios);
    expect(settle).not.toHaveBeenCalled();
  });
  it.fails.each(["failed-run", "invalid-run", "wrong-capability"])("R6: public loader preserves and checks %s", async (kind) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://review.invalid");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "synthetic-key");
    const slug=leadScenarios[0]!.slug;
    // Actual Supabase client and public loader, with HTTP response bodies replaced.
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request) => {
      const path = new URL(String(url)).pathname;
      const data = path.endsWith("/capabilities") ? [{ id:"cap-001",code:"CAP-001",slug:"follow-up-with-sales-leads", title:"Review",short_description:"Review",categories:{slug:"sales",name:"Sales"},
        accepted_test_run_id:"run-review",evidence_level:"simulation",published:true }] : path.endsWith("/test_runs") ? [{
        id:"run-review",capability_id:kind==="wrong-capability"?"cap-other":"cap-001",model_provider:"openrouter",model_name:MODEL,
        fixture_version:"acme-v1",git_sha:"104ca989",completed_at:"2026-09-11T00:00:00Z",success_count:1,failure_count:0,total_count:1,critical_failure_count:0,score:1,published:true,
        status:kind==="failed-run"?"failed":"completed",tool_configuration:{benchmarkValid:kind!=="invalid-run"},
      }] : [{test_run_id:"run-review",success:true,critical:false,failure_explanation:null,test_scenarios:{slug,title:"Review"}}];
      return new Response(JSON.stringify(data),{headers:{"content-type":"application/json"}});
    }));
    const page=await getPublishedPage("follow-up-with-sales-leads");
    expect(page?.source).toBe("repository-artifact");
  });
  it.fails("R7: reuses a changed definition after its stored versioned slug is read back", async () => {
    const suite=await runCapability("CAP-001");
    const base=buildPersistPayload(suite,leadScenarios).scenarios[0]!;
    const old={id:"old",slug:base.slug,contentHash:scenarioContentHash(base),definition:base};
    const changed={...base,title:"Changed title"};
    const first=resolveScenarioWrite([old],changed);
    if(first.action!=="insert") throw new Error("review setup failed");
    const storedDefinition={...changed,slug:first.slug};
    const stored={id:"new",slug:first.slug,contentHash:scenarioContentHash(storedDefinition),definition:storedDefinition};
    expect(resolveScenarioWrite([old,stored],changed)).toMatchObject({action:"reuse",id:"new"});
  });
  it.fails("R7: scenario identity is stable across JSONB object-key ordering", async () => {
    const suite=await runCapability("CAP-001");
    const row=buildPersistPayload(suite,leadScenarios).scenarios[0]!;
    const reordered={...row,inputPayload:Object.fromEntries(Object.entries(row.inputPayload).reverse())};
    expect(scenarioContentHash(reordered)).toBe(scenarioContentHash(row));
  });
  it("one-scenario config selects a bounded count but has no request-reserve setting", () => {
    const c=configFromEnv({NODE_ENV:"test",OPENROUTER_MODEL:MODEL,OPENROUTER_MAX_SCENARIOS:"1",OPENROUTER_MAX_RETRIES:"0",OPENROUTER_MAX_SPEND_USD:"0.01"});
    expect(c.maxScenarios).toBe(1); expect(c.maxRetries).toBe(0);
  });
});

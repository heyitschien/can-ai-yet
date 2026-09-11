import { scenariosFor } from "@/evals/capabilities";
import { runScenario } from "@/evals/runners/run-suite";
import { OpenRouterProvider } from "@/evals/providers/openrouter";
import { SpendLedger, assertPaidExecutionAllowed, configFromEnv } from "@/evals/providers/openrouter-config";
import { buildCap001DryRunPlan } from "@/evals/providers/openrouter-plan";
import { persistIntentionalRun, writeLocalRunArtifact } from "@/evals/persistence/persist-run";
import { createClient } from "@supabase/supabase-js";
import type { EvidenceWriter, ResultPersistRow, RunPersistRow, ScenarioPersistRow } from "@/evals/persistence/persist-run";
import type { ScenarioResult, SuiteResult } from "@/evals/types";
import { calculateStatus } from "@/lib/scoring/calculate";
import { median } from "@/evals/runners/run-suite";
import { ENVIRONMENT_VERSION, FIXTURE_VERSION } from "@/evals/types";
import { gitSha } from "@/evals/runners/run-suite";

function printPlan(): void {
  const config = configFromEnv(process.env);
  const plan = buildCap001DryRunPlan(config);
  console.log(JSON.stringify(plan, null, 2));
  console.log("\nDry run finished. Zero paid requests.");
}

async function execute(): Promise<void> {
  const config = configFromEnv(process.env);
  assertPaidExecutionAllowed(process.env, config);
  const scenarios = scenariosFor("CAP-001").slice(0, config.maxScenarios);
  const provider = new OpenRouterProvider(config, new SpendLedger(config.maxSpendUsd));
  const startedAt = new Date().toISOString();
  const results: ScenarioResult[] = [];
  for (const scenario of scenarios) {
    results.push(await runScenario(scenario, provider));
  }
  const successCount = results.filter((result) => result.success).length;
  const criticalFailureCount = results.filter((result) => result.critical).length;
  const scored = calculateStatus({ successCount, totalCount: results.length, criticalFailureCount });
  const invalidReasons = results
    .filter((result) => result.benchmarkInvalid)
    .map((result) => `${result.scenarioId}: ${String(result.actualState.agentError ?? "invalid")}`);
  const suite: SuiteResult = {
    capabilityCode: "CAP-001",
    provider: provider.providerId,
    model: provider.modelId,
    fixtureVersion: FIXTURE_VERSION,
    environmentVersion: ENVIRONMENT_VERSION,
    gitSha: gitSha(),
    startedAt,
    completedAt: new Date().toISOString(),
    successCount,
    failureCount: results.length - successCount,
    totalCount: results.length,
    criticalFailureCount,
    score: scored.score,
    status: scored.status,
    supervision: scored.supervision,
    cappedByCriticalFailure: scored.cappedByCriticalFailure,
    totalCostUsd: results.some((result) => result.costUsd === null) ? null : results.reduce((sum, result) => sum + (result.costUsd ?? 0), 0),
    medianRuntimeSeconds: median(results.map((result) => result.runtimeSeconds)),
    benchmarkValid: invalidReasons.length === 0,
    invalidReasons,
    inputTokens: results.reduce((sum, result) => sum + (result.inputTokens ?? 0), 0),
    outputTokens: results.reduce((sum, result) => sum + (result.outputTokens ?? 0), 0),
    results,
  };
  const artifact = writeLocalRunArtifact(suite, scenarios);
  console.log(`Wrote review artifact ${artifact}`);
  console.log(`Valid benchmark: ${suite.benchmarkValid === true}. This is not accepted public evidence.`);
  if (process.argv.includes("--persist")) {
    const writer = supabaseWriter();
    const saved = await persistIntentionalRun(writer, suite, scenarios);
    console.log(`Persisted unpublished run ${saved.runId}. accepted_test_run_id was not set.`);
  }
}

function supabaseWriter(): EvidenceWriter {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("SUPABASE_SECRET_KEY is required to persist. The local artifact was still written.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  return {
    async upsertScenarios(rows: ScenarioPersistRow[]) {
      const ids = new Map<string, string>();
      for (const row of rows) {
        const capability = await client.from("capabilities").select("id").eq("code", row.capabilityCode).maybeSingle();
        if (capability.error || !capability.data) throw new Error(`Capability ${row.capabilityCode} was not found.`);
        const capabilityId = (capability.data as { id: string }).id;
        const saved = await client
          .from("test_scenarios")
          .upsert(
            {
              capability_id: capabilityId,
              slug: row.slug,
              title: row.title,
              description: row.description,
              fixture_version: row.fixtureVersion,
              input_payload: row.inputPayload,
              expected_state: row.expectedState,
              forbidden_state: row.forbiddenState,
              critical: row.critical,
              active: true,
            },
            { onConflict: "capability_id,slug" },
          )
          .select("id, slug")
          .single();
        if (saved.error || !saved.data) throw new Error(saved.error?.message ?? "Could not upsert scenario.");
        const data = saved.data as { id: string; slug: string };
        ids.set(data.slug, data.id);
      }
      return ids;
    },
    async insertRun(row: RunPersistRow) {
      const capability = await client.from("capabilities").select("id").eq("code", row.capabilityCode).maybeSingle();
      if (capability.error || !capability.data) throw new Error(`Capability ${row.capabilityCode} was not found.`);
      const inserted = await client
        .from("test_runs")
        .insert({
          capability_id: (capability.data as { id: string }).id,
          model_provider: row.modelProvider,
          model_name: row.modelName,
          tool_configuration: row.toolConfiguration,
          environment_version: row.environmentVersion,
          fixture_version: row.fixtureVersion,
          git_sha: row.gitSha,
          started_at: row.startedAt,
          completed_at: row.completedAt,
          success_count: row.successCount,
          failure_count: row.failureCount,
          total_count: row.totalCount,
          critical_failure_count: row.criticalFailureCount,
          score: row.score,
          total_cost_usd: row.totalCostUsd,
          median_runtime_seconds: row.medianRuntimeSeconds,
          input_tokens: row.inputTokens,
          output_tokens: row.outputTokens,
          status: row.status,
          notes: row.notes,
          published: false,
        })
        .select("id")
        .single();
      if (inserted.error || !inserted.data) throw new Error(inserted.error?.message ?? "Could not insert test run.");
      return (inserted.data as { id: string }).id;
    },
    async insertResults(runId: string, rows: ResultPersistRow[], scenarioIds: Map<string, string>) {
      const payload = rows.map((row) => {
        const scenarioId = scenarioIds.get(row.scenarioSlug);
        if (!scenarioId) throw new Error(`Missing scenario id for ${row.scenarioSlug}`);
        return {
          test_run_id: runId,
          scenario_id: scenarioId,
          success: row.success,
          actual_state: row.actualState,
          failure_code: row.failureCode,
          failure_explanation: row.failureExplanation,
          critical: row.critical,
          runtime_seconds: row.runtimeSeconds,
          cost_usd: row.costUsd,
          raw_trace_path: null,
        };
      });
      const inserted = await client.from("test_results").insert(payload);
      if (inserted.error) throw new Error(inserted.error.message);
    },
  };
}

async function main() {
  const executeRequested = process.argv.includes("--execute");
  if (!executeRequested) {
    printPlan();
    return;
  }
  await execute();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

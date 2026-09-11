import { scenariosFor } from "@/evals/capabilities";
import { runScenario, summarize } from "@/evals/runners/run-suite";
import { OpenRouterProvider } from "@/evals/providers/openrouter";
import { SpendLedger, assertPaidExecutionAllowed, configFromEnv } from "@/evals/providers/openrouter-config";
import { buildCap001DryRunPlan } from "@/evals/providers/openrouter-plan";
import { persistIntentionalRun, writeLocalRunArtifact } from "@/evals/persistence/persist-run";
import { resolveScenarioWrite, scenarioContentHash, type StoredScenario } from "@/evals/persistence/scenario-identity";
import { createClient } from "@supabase/supabase-js";
import type { EvidenceWriter, ResultPersistRow, RunPersistRow, ScenarioPersistRow } from "@/evals/persistence/persist-run";
import type { ScenarioResult, SuiteResult } from "@/evals/types";

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
  const provider = new OpenRouterProvider(config, new SpendLedger(config.maxSpendUsd, config.requestReserveUsd));
  const startedAt = new Date().toISOString();
  const results: ScenarioResult[] = [];
  for (const scenario of scenarios) {
    results.push(await runScenario(scenario, provider));
  }
  const suite: SuiteResult = summarize("CAP-001", results, startedAt, provider);
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
        const listed = await client.from("test_scenarios").select("id, slug, title, description, fixture_version, input_payload, expected_state, forbidden_state, critical").eq("capability_id", capabilityId);
        if (listed.error) throw new Error(listed.error.message);
        const existing: StoredScenario[] = ((listed.data ?? []) as Array<Record<string, unknown>>).map((item) => {
          const definition: ScenarioPersistRow = {
            capabilityCode: row.capabilityCode,
            slug: String(item.slug),
            title: String(item.title),
            description: String(item.description),
            fixtureVersion: String(item.fixture_version),
            inputPayload: (item.input_payload ?? {}) as Record<string, unknown>,
            expectedState: item.expected_state,
            forbiddenState: item.forbidden_state,
            critical: Boolean(item.critical),
          };
          return { id: String(item.id), slug: definition.slug, contentHash: scenarioContentHash(definition), definition };
        });
        const decision = resolveScenarioWrite(existing, row);
        if (decision.action === "reuse") {
          ids.set(row.slug, decision.id);
          continue;
        }
        const inserted = await client
          .from("test_scenarios")
          .insert({
            capability_id: capabilityId,
            slug: decision.slug,
            title: row.title,
            description: row.description,
            fixture_version: row.fixtureVersion,
            input_payload: row.inputPayload,
            expected_state: row.expectedState,
            forbidden_state: row.forbiddenState,
            critical: row.critical,
            active: true,
          })
          .select("id, slug")
          .single();
        if (inserted.error || !inserted.data) throw new Error(inserted.error?.message ?? "Could not insert scenario version.");
        ids.set(row.slug, (inserted.data as { id: string }).id);
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
          actual_state: { ...row.actualState, scenarioSnapshot: row.scenarioSnapshot ?? null, provenance: row.provenance ?? null },
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
    async markRunSettled(runId: string, status: "completed" | "failed") {
      const updated = await client.from("test_runs").update({ status }).eq("id", runId).eq("status", "running");
      if (updated.error) throw new Error(updated.error.message);
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

import { execSync } from "node:child_process";
import { calculateStatus } from "@/lib/scoring/calculate";
import { allScenarios, prepareWorld, scenariosFor } from "@/evals/capabilities";
import { judgeScenario } from "@/evals/judges/judge";
import { ReferenceAgent } from "@/evals/providers/reference-agent";
import {
  ENVIRONMENT_VERSION,
  FIXTURE_VERSION,
  REFERENCE_MODEL,
  REFERENCE_PROVIDER,
  type AgentProvider,
  type Scenario,
  type ScenarioResult,
  type SuiteResult,
} from "@/evals/types";
import { World } from "@/evals/environments/world";

export function gitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "uncommitted";
  }
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  return sorted[mid] ?? 0;
}

export async function runScenario(scenario: Scenario, provider: AgentProvider): Promise<ScenarioResult> {
  const started = performance.now();
  const world = World.fresh();
  prepareWorld(scenario, world);
  const agent = await provider.run(
    {
      capabilityCode: scenario.capabilityCode,
      instruction: scenario.instruction,
      allowedTools: scenario.allowedTools,
      payload: scenario.payload,
    },
    world,
  );
  const judged = judgeScenario(world, scenario.expected, scenario.forbidden);
  const runtimeSeconds = (performance.now() - started) / 1000;
  return {
    scenarioId: scenario.id,
    slug: scenario.slug,
    title: scenario.title,
    success: judged.success,
    critical: !judged.success && scenario.criticalOnFail,
    failureCode: judged.success ? null : scenario.failureCode,
    failureExplanation: judged.success ? null : judged.failures.join(" "),
    runtimeSeconds,
    costUsd: agent.usage ? agent.usage.costUsd : 0,
    inputTokens: agent.usage?.inputTokens,
    outputTokens: agent.usage?.outputTokens,
    benchmarkInvalid: agent.benchmarkInvalid === true,
    actualState: {
      sent: world.sent,
      flags: world.flags,
      escalations: world.escalations,
      tasks: world.tasks.map((task) => task.title),
      followups: world.followups,
      agentError: agent.error ?? null,
      toolsCalled: agent.toolsCalled,
    },
  };
}

export async function runCapability(code: string, provider: AgentProvider = new ReferenceAgent()): Promise<SuiteResult> {
  const scenarios = scenariosFor(code);
  if (scenarios.length === 0) throw new Error(`No scenarios for ${code}`);
  const startedAt = new Date().toISOString();
  const results: ScenarioResult[] = [];
  for (const scenario of scenarios) {
    results.push(await runScenario(scenario, provider));
  }
  return summarize(code, results, startedAt, provider);
}

export async function runAll(provider: AgentProvider = new ReferenceAgent()): Promise<SuiteResult[]> {
  const codes = [...new Set(allScenarios().map((scenario) => scenario.capabilityCode))];
  const suites: SuiteResult[] = [];
  for (const code of codes) suites.push(await runCapability(code, provider));
  return suites;
}

function summarize(code: string, results: ScenarioResult[], startedAt: string, provider: AgentProvider): SuiteResult {
  const successCount = results.filter((result) => result.success).length;
  const failureCount = results.length - successCount;
  const criticalFailureCount = results.filter((result) => result.critical).length;
  const scored = calculateStatus({ successCount, totalCount: results.length, criticalFailureCount });
  const invalidReasons = results
    .filter((result) => result.benchmarkInvalid)
    .map((result) => `${result.scenarioId}: ${String(result.actualState.agentError ?? "benchmark configuration was not honored")}`);
  return {
    capabilityCode: code,
    provider: provider.providerId ?? REFERENCE_PROVIDER,
    model: provider.modelId ?? REFERENCE_MODEL,
    fixtureVersion: FIXTURE_VERSION,
    environmentVersion: ENVIRONMENT_VERSION,
    gitSha: gitSha(),
    startedAt,
    completedAt: new Date().toISOString(),
    successCount,
    failureCount,
    totalCount: results.length,
    criticalFailureCount,
    score: scored.score,
    status: scored.status,
    supervision: scored.supervision,
    cappedByCriticalFailure: scored.cappedByCriticalFailure,
    totalCostUsd: sumCost(results),
    medianRuntimeSeconds: median(results.map((result) => result.runtimeSeconds)),
    benchmarkValid: invalidReasons.length === 0,
    invalidReasons,
    inputTokens: sumUsage(results, "inputTokens"),
    outputTokens: sumUsage(results, "outputTokens"),
    results,
  };
}

function sumCost(results: ScenarioResult[]): number | null {
  if (results.some((result) => result.costUsd === null)) return null;
  return results.reduce((sum, result) => sum + (result.costUsd ?? 0), 0);
}

function sumUsage(results: ScenarioResult[], field: "inputTokens" | "outputTokens"): number {
  return results.reduce((sum, result) => sum + (result[field] ?? 0), 0);
}

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Scenario, SuiteResult } from "@/evals/types";

export type ScenarioPersistRow = {
  capabilityCode: string;
  slug: string;
  title: string;
  description: string;
  fixtureVersion: string;
  inputPayload: Record<string, unknown>;
  expectedState: unknown;
  forbiddenState: unknown;
  critical: boolean;
};

export type RunPersistRow = {
  capabilityCode: string;
  modelProvider: string;
  modelName: string;
  toolConfiguration: Record<string, unknown>;
  environmentVersion: string;
  fixtureVersion: string;
  gitSha: string;
  startedAt: string;
  completedAt: string;
  successCount: number;
  failureCount: number;
  totalCount: number;
  criticalFailureCount: number;
  score: number | null;
  totalCostUsd: number | null;
  medianRuntimeSeconds: number;
  inputTokens: number;
  outputTokens: number;
  status: "completed" | "failed";
  notes: string;
  published: false;
};

export type ResultPersistRow = {
  scenarioSlug: string;
  success: boolean;
  actualState: Record<string, unknown>;
  failureCode: string | null;
  failureExplanation: string | null;
  critical: boolean;
  runtimeSeconds: number;
  costUsd: number | null;
  rawTracePath: null;
};

export type PersistPayload = {
  setsAcceptedRunId: false;
  overwritesAcceptedBaseline: false;
  scenarios: ScenarioPersistRow[];
  run: RunPersistRow;
  results: ResultPersistRow[];
};

export function buildPersistPayload(suite: SuiteResult, scenarios: Scenario[]): PersistPayload {
  if (suite.capabilityCode !== "CAP-001") {
    throw new Error("This preparation path persists CAP-001 only.");
  }
  const byId = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  return {
    setsAcceptedRunId: false,
    overwritesAcceptedBaseline: false,
    scenarios: scenarios.map((scenario) => ({
      capabilityCode: scenario.capabilityCode,
      slug: scenario.slug,
      title: scenario.title,
      description: scenario.description,
      fixtureVersion: suite.fixtureVersion,
      inputPayload: scenario.payload,
      expectedState: scenario.expected,
      forbiddenState: scenario.forbidden,
      critical: scenario.criticalOnFail,
    })),
    run: {
      capabilityCode: suite.capabilityCode,
      modelProvider: suite.provider,
      modelName: suite.model,
      toolConfiguration: {
        gateway: suite.provider,
        requestedModel: suite.model,
        allowFallbacks: false,
        benchmarkValid: suite.benchmarkValid !== false,
        invalidReasons: suite.invalidReasons ?? [],
      },
      environmentVersion: suite.environmentVersion,
      fixtureVersion: suite.fixtureVersion,
      gitSha: suite.gitSha,
      startedAt: suite.startedAt,
      completedAt: suite.completedAt,
      successCount: suite.successCount,
      failureCount: suite.failureCount,
      totalCount: suite.totalCount,
      criticalFailureCount: suite.criticalFailureCount,
      score: suite.score,
      totalCostUsd: suite.totalCostUsd,
      medianRuntimeSeconds: suite.medianRuntimeSeconds,
      inputTokens: suite.inputTokens ?? 0,
      outputTokens: suite.outputTokens ?? 0,
      status: suite.benchmarkValid === false ? "failed" : "completed",
      notes: "Intentional benchmark artifact. Not accepted and not published.",
      published: false,
    },
    results: suite.results.map((result) => {
      const scenario = byId.get(result.scenarioId);
      return {
        scenarioSlug: scenario?.slug ?? result.slug,
        success: result.success,
        actualState: result.actualState,
        failureCode: result.failureCode,
        failureExplanation: result.failureExplanation,
        critical: result.critical,
        runtimeSeconds: result.runtimeSeconds,
        costUsd: result.costUsd,
        rawTracePath: null,
      };
    }),
  };
}

export function writeLocalRunArtifact(suite: SuiteResult, scenarios: Scenario[], directory = "evals/runs"): string {
  const payload = buildPersistPayload(suite, scenarios);
  mkdirSync(directory, { recursive: true });
  const stamp = suite.startedAt.replace(/[:.]/g, "-");
  const file = join(directory, `${suite.capabilityCode}-${suite.provider}-${stamp}.json`);
  writeFileSync(file, `${JSON.stringify({ note: "Review artifact only. Not accepted public evidence.", payload, suite }, null, 2)}\n`);
  return file;
}

export type EvidenceWriter = {
  upsertScenarios(rows: ScenarioPersistRow[]): Promise<Map<string, string>>;
  insertRun(row: RunPersistRow): Promise<string>;
  insertResults(runId: string, rows: ResultPersistRow[], scenarioIds: Map<string, string>): Promise<void>;
};

export async function persistIntentionalRun(writer: EvidenceWriter, suite: SuiteResult, scenarios: Scenario[]): Promise<{ runId: string; accepted: false }> {
  const payload = buildPersistPayload(suite, scenarios);
  const scenarioIds = await writer.upsertScenarios(payload.scenarios);
  const runId = await writer.insertRun(payload.run);
  await writer.insertResults(runId, payload.results, scenarioIds);
  return { runId, accepted: false };
}

export type AcceptDecision =
  | { allowed: true; runId: string; marksRunPublished: true; setsAcceptedRunId: true }
  | { allowed: false; reason: string };

export function decideAccept(input: {
  runId: string;
  runStatus: string;
  currentAcceptedRunId: string | null;
  replaceAccepted: boolean;
}): AcceptDecision {
  if (!input.runId) return { allowed: false, reason: "A completed run id is required." };
  if (input.runStatus !== "completed") return { allowed: false, reason: "Only a completed run can be accepted." };
  if (input.currentAcceptedRunId && input.currentAcceptedRunId !== input.runId && !input.replaceAccepted) {
    return { allowed: false, reason: "This capability already has a different accepted run. Pass --replace-accepted to change it." };
  }
  return { allowed: true, runId: input.runId, marksRunPublished: true, setsAcceptedRunId: true };
}

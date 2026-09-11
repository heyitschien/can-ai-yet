import { scenariosFor } from "@/evals/capabilities";
import { ENVIRONMENT_VERSION, FIXTURE_VERSION } from "@/evals/types";
import { gitSha } from "@/evals/runners/run-suite";
import {
  estimateOutputTokenCeiling,
  maxHttpRequests,
  paidRunBlockedReason,
  type OpenRouterRunConfig,
} from "@/evals/providers/openrouter-config";

export type DryRunPlan = {
  mode: "dry-run";
  paidRequests: 0;
  capabilityCode: "CAP-001";
  provider: "openrouter";
  model: string | null;
  scenarioCount: number;
  scenarioIds: string[];
  maxTurns: number;
  maxTokens: number;
  timeoutMs: number;
  maxRetries: number;
  maxSpendUsd: number | null;
  maxHttpRequests: number;
  estimatedMaxOutputTokens: number;
  estimatedMaxCostUsd: null;
  estimateNote: string;
  gitSha: string;
  fixtureVersion: string;
  environmentVersion: string;
  persistence: string;
  apiKeyPresent: boolean;
  paidExecutionBlockedReason: string | null;
  allowFallbacks: false;
};

export function buildCap001DryRunPlan(config: OpenRouterRunConfig, env: Record<string, string | undefined> = process.env): DryRunPlan {
  const scenarios = scenariosFor("CAP-001").slice(0, config.maxScenarios);
  return {
    mode: "dry-run",
    paidRequests: 0,
    capabilityCode: "CAP-001",
    provider: "openrouter",
    model: config.model || null,
    scenarioCount: scenarios.length,
    scenarioIds: scenarios.map((scenario) => scenario.id),
    maxTurns: config.maxTurns,
    maxTokens: config.maxTokens,
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
    maxSpendUsd: config.maxSpendUsd,
    maxHttpRequests: maxHttpRequests(scenarios.length, config),
    estimatedMaxOutputTokens: estimateOutputTokenCeiling(scenarios.length, config),
    estimatedMaxCostUsd: null,
    estimateNote:
      "No price is quoted here. Confirm the live OpenRouter model ID and price before any paid run. Output-token ceiling is a cap, not a bill.",
    gitSha: gitSha(),
    fixtureVersion: FIXTURE_VERSION,
    environmentVersion: ENVIRONMENT_VERSION,
    persistence:
      "A paid run may write evals/runs and unpublished test_scenarios/test_runs/test_results. It does not set accepted_test_run_id and does not overwrite evals/accepted/latest.json.",
    apiKeyPresent: Boolean(config.apiKey),
    paidExecutionBlockedReason: paidRunBlockedReason(env),
    allowFallbacks: false,
  };
}

import { scenariosFor } from "@/evals/capabilities";
import { ENVIRONMENT_VERSION, FIXTURE_VERSION } from "@/evals/types";
import { gitSha } from "@/evals/runners/run-suite";
import { estimateSonnet46FromObserved, type ObservedCostPlan } from "@/evals/providers/observed-cost";
import { ACME_SYSTEM_PROMPT } from "@/evals/providers/openrouter";
import {
  estimateOutputTokenCeiling,
  maxHttpRequests,
  paidRunBlockedReason,
  type OpenRouterRunConfig,
} from "@/evals/providers/openrouter-config";
import { observePromptPrefix, type PromptPrefixObservation } from "@/evals/providers/prompt-cache";
import { readScenarioSpec, selectCap001Scenarios, type ScenarioSegment } from "@/evals/providers/scenario-selection";
import { CAP001_TOOL_SCHEMAS } from "@/evals/providers/tool-schemas";

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
  requestReserveUsd: number | null;
  providerSlug: string | null;
  routeMode: "pinned" | "unpinned" | null;
  spendLimitKind: "client-stop-threshold";
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
  responseCache: "disabled";
  promptCache: PromptPrefixObservation;
  selection: ScenarioSegment;
  observedCostPlan: ObservedCostPlan | null;
  qualificationGate: {
    status: "proposal-not-adopted";
    note: string;
  };
};

export function buildCap001DryRunPlan(
  config: OpenRouterRunConfig,
  env: Record<string, string | undefined> = process.env,
  scenarioSpec: string | null = readScenarioSpec([], env),
): DryRunPlan {
  const selected = selectCap001Scenarios(scenariosFor("CAP-001"), scenarioSpec, config.maxScenarios);
  const scenarios = selected.scenarios;
  const observed = config.model === "anthropic/claude-sonnet-4.6" ? estimateSonnet46FromObserved(scenarios.length, config.maxTurns) : null;
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
    requestReserveUsd: config.requestReserveUsd,
    providerSlug: config.providerSlug,
    routeMode: config.routeMode,
    spendLimitKind: "client-stop-threshold",
    maxHttpRequests: maxHttpRequests(scenarios.length, config),
    estimatedMaxOutputTokens: estimateOutputTokenCeiling(scenarios.length, config),
    estimatedMaxCostUsd: null,
    estimateNote:
      "No price is quoted here. OPENROUTER_MAX_SPEND_USD is a client-side stop threshold, not a provider charge ceiling. One in-flight request can still cost more, and that run is invalid.",
    gitSha: gitSha(),
    fixtureVersion: FIXTURE_VERSION,
    environmentVersion: ENVIRONMENT_VERSION,
    persistence:
      "A paid run may write evals/runs and unpublished test_scenarios/test_runs/test_results. It does not set accepted_test_run_id and does not overwrite evals/accepted/latest.json.",
    apiKeyPresent: Boolean(config.apiKey),
    paidExecutionBlockedReason: paidRunBlockedReason(env),
    allowFallbacks: false,
    responseCache: "disabled",
    promptCache: observePromptPrefix(ACME_SYSTEM_PROMPT, CAP001_TOOL_SCHEMAS),
    selection: selected.segment,
    observedCostPlan: observed,
    qualificationGate: {
      status: "proposal-not-adopted",
      note: "A one-pass qualification is not a reliability claim. The proposed gate is two independent LEAD-001 trials and one LEAD-005 trial on the same frozen config, reported as counts. It is not a runner rule yet.",
    },
  };
}

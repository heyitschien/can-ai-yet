import { GuardError } from "@/evals/providers/openrouter-config";
import type { RunSegment, Scenario, SuiteResult, TrialRecord } from "@/evals/types";

export type ScenarioSegment = RunSegment;

function segmentNote(kind: ScenarioSegment["kind"], ids: string[], omitted: string[]): string {
  if (kind === "full") {
    return "This artifact is one full frozen CAP-001 membership on one config. It is still not accepted evidence until a human accepts one clean full run. Do not stitch it to another git SHA or config.";
  }
  return `This is a ${kind}, not a 12-scenario score. Membership: ${ids.join(", ")}. Omitted: ${omitted.join(", ") || "none"}. Do not combine it with another segment unless git SHA, model, provider, fixture, environment, and execution config match, and even then label the pieces separately. Accepted evidence requires one clean full run.`;
}

export function readScenarioSpec(argv: string[], env: Record<string, string | undefined>): string | null {
  const fromEnv = env.OPENROUTER_SCENARIO_IDS?.trim() ?? "";
  let fromArgv = "";
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] ?? "";
    if (token === "--scenarios") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new GuardError("SCENARIO_SPEC", "--scenarios needs a list or range, such as LEAD-006,LEAD-007 or LEAD-006:LEAD-012.");
      fromArgv = value.trim();
    } else if (token.startsWith("--scenarios=")) {
      fromArgv = token.slice("--scenarios=".length).trim();
    }
  }
  if (fromArgv && fromEnv && fromArgv !== fromEnv) {
    throw new GuardError("SCENARIO_SPEC", "OPENROUTER_SCENARIO_IDS and --scenarios disagree. Use one list.");
  }
  const spec = fromArgv || fromEnv;
  return spec.length > 0 ? spec : null;
}

function requestedIds(spec: string, frozenIds: string[]): string[] {
  if (spec.includes(",") && spec.includes(":")) {
    throw new GuardError("SCENARIO_SPEC", "Use either a comma list or one range, not both.");
  }
  if (spec.includes(":")) {
    const parts = spec.split(":").map((part) => part.trim());
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new GuardError("SCENARIO_SPEC", "A range must look like LEAD-006:LEAD-012.");
    }
    const start = frozenIds.indexOf(parts[0]);
    const end = frozenIds.indexOf(parts[1]);
    if (start < 0 || end < 0) throw new GuardError("SCENARIO_SPEC", `Unknown scenario in range ${spec}.`);
    if (end < start) throw new GuardError("SCENARIO_SPEC", "A range must move forward in the frozen CAP-001 order.");
    return frozenIds.slice(start, end + 1);
  }
  const ids = spec.split(",").map((part) => part.trim()).filter((part) => part.length > 0);
  if (ids.length === 0) throw new GuardError("SCENARIO_SPEC", "Scenario list is empty.");
  if (new Set(ids).size !== ids.length) throw new GuardError("SCENARIO_SPEC", "Scenario list has a duplicate id.");
  const unknown = ids.filter((id) => !frozenIds.includes(id));
  if (unknown.length > 0) throw new GuardError("SCENARIO_SPEC", `Unknown scenario id: ${unknown.join(", ")}.`);
  return ids;
}

export function stampTrials(suite: SuiteResult): SuiteResult {
  const model = suite.provenance?.requestedModel ?? suite.model;
  return {
    ...suite,
    results: suite.results.map((result) => {
      const outcome: TrialRecord["outcome"] = result.benchmarkInvalid ? "invalid" : result.success ? "pass" : "fail";
      const trial: TrialRecord = {
        scenarioId: result.scenarioId,
        repeatIndex: 1,
        trialId: `${suite.gitSha}:${model}:${suite.provider}:${result.scenarioId}:1`,
        outcome,
        failureMode: result.failureMode ?? null,
        validity: result.benchmarkInvalid ? "invalid" : "valid",
        inputTokens: result.inputTokens ?? null,
        outputTokens: result.outputTokens ?? null,
        costUsd: result.costUsd,
        runtimeSeconds: result.runtimeSeconds,
        cacheReadTokens: result.provenance?.cacheReadTokens ?? null,
        cacheWriteTokens: result.provenance?.cacheWriteTokens ?? null,
      };
      return {
        ...result,
        trial,
        actualState: { ...result.actualState, trial },
      };
    }),
  };
}

export function selectCap001Scenarios(
  all: Scenario[],
  spec: string | null,
  maxScenarios: number,
): { scenarios: Scenario[]; segment: ScenarioSegment } {
  const frozenIds = all.map((scenario) => scenario.id);
  if (!spec) {
    const scenarios = all.slice(0, maxScenarios);
    const ids = scenarios.map((scenario) => scenario.id);
    const omitted = frozenIds.filter((id) => !ids.includes(id));
    const kind = omitted.length === 0 ? "full" : "prefix-segment";
    return {
      scenarios,
      segment: {
        kind,
        scenarioIds: ids,
        omittedScenarioIds: omitted,
        requested: null,
        executedOrder: "frozen-suite-order",
        combinable: false,
        acceptedEvidence: "requires-one-clean-full-run",
        note: segmentNote(kind, ids, omitted),
      },
    };
  }
  const wanted = new Set(requestedIds(spec, frozenIds));
  const scenarios = all.filter((scenario) => wanted.has(scenario.id));
  if (scenarios.length > maxScenarios) {
    throw new GuardError("SCENARIO_SPEC", `Selected ${scenarios.length} scenarios, above OPENROUTER_MAX_SCENARIOS=${maxScenarios}. Raise the cap or shorten the list. Nothing was truncated.`);
  }
  const ids = scenarios.map((scenario) => scenario.id);
  const omitted = frozenIds.filter((id) => !ids.includes(id));
  return {
    scenarios,
    segment: {
      kind: "explicit-segment",
      scenarioIds: ids,
      omittedScenarioIds: omitted,
      requested: spec,
      executedOrder: "frozen-suite-order",
      combinable: false,
      acceptedEvidence: "requires-one-clean-full-run",
      note: segmentNote("explicit-segment", ids, omitted),
    },
  };
}

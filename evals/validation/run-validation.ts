import { defaultCap001ScenarioIds } from "@/evals/manifest/experiment-manifest";

export type RunValidationStatus = "VALID" | "INVALID" | "INCOMPARABLE";

export type ScenarioRunReceipt = {
  scenarioId: string;
  toolTrace?: unknown[];
  finalState?: Record<string, unknown>;
  judgeCompleted?: boolean;
  generationIds?: string[];
  costUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
};

export type RunLimits = {
  maxCostUsd?: number;
  maxSteps?: number;
};

/**
 * Per-run validation input.
 * Capability + environment fingerprints must match the intended comparison gate.
 * Model/provider belong in run config / served fields, not environment fingerprints.
 */
export type RunReceiptInput = {
  benchmarkVersion: string;
  capabilityFingerprint: string;
  expectedCapabilityFingerprint?: string;
  environmentFingerprint: string;
  expectedEnvironmentFingerprint?: string;
  envHeadSha: string;
  expectedEnvHeadSha?: string;
  requestedModel: string;
  servedModel: string;
  provider: string;
  fallbackDisabled: boolean;
  scenarioResults: ScenarioRunReceipt[];
  limits?: RunLimits;
  anomalies?: string[];
  /** @deprecated Prefer environmentFingerprint. */
  labFingerprint?: string;
  /** @deprecated Prefer expectedEnvironmentFingerprint. */
  expectedLabFingerprint?: string;
  /** @deprecated Prefer envHeadSha. */
  labHeadSha?: string;
  /** @deprecated Prefer expectedEnvHeadSha. */
  expectedLabHeadSha?: string;
};

export type RunValidationResult = {
  status: RunValidationStatus;
  checks: Record<string, boolean>;
  reasons: string[];
};

function allScenarioIdsPresent(scenarioResults: ScenarioRunReceipt[]): boolean {
  const expected = new Set(defaultCap001ScenarioIds());
  const seen = new Set(scenarioResults.map((row) => row.scenarioId));
  if (seen.size !== expected.size) return false;
  for (const id of expected) {
    if (!seen.has(id)) return false;
  }
  return true;
}

export function validateRunReceipt(input: RunReceiptInput): RunValidationResult {
  const environmentFingerprint = input.environmentFingerprint || input.labFingerprint || "";
  const expectedEnvironmentFingerprint = input.expectedEnvironmentFingerprint ?? input.expectedLabFingerprint;
  const envHeadSha = input.envHeadSha || input.labHeadSha || "";
  const expectedEnvHeadSha = input.expectedEnvHeadSha ?? input.expectedLabHeadSha;

  const checks: Record<string, boolean> = {
    benchmarkVersion: input.benchmarkVersion === "cap-001-v1",
    capabilityFingerprint: Boolean(input.capabilityFingerprint),
    capabilityComparable:
      !input.expectedCapabilityFingerprint ||
      input.capabilityFingerprint === input.expectedCapabilityFingerprint,
    environmentFingerprint: Boolean(environmentFingerprint),
    environmentComparable:
      (!expectedEnvironmentFingerprint || environmentFingerprint === expectedEnvironmentFingerprint) &&
      (!expectedEnvHeadSha || envHeadSha === expectedEnvHeadSha),
    /** Alias for prior tests / callers. */
    labFingerprint: Boolean(environmentFingerprint),
    labComparable:
      (!expectedEnvironmentFingerprint || environmentFingerprint === expectedEnvironmentFingerprint) &&
      (!expectedEnvHeadSha || envHeadSha === expectedEnvHeadSha),
    envHeadSha: Boolean(envHeadSha && envHeadSha !== "uncommitted"),
    labHeadSha: Boolean(envHeadSha && envHeadSha !== "uncommitted"),
    requestedModel: Boolean(input.requestedModel),
    servedModel: Boolean(input.servedModel),
    provider: Boolean(input.provider),
    modelMatch: input.requestedModel === input.servedModel,
    fallbackDisabled: input.fallbackDisabled === true,
    scenarioCompleteness: allScenarioIdsPresent(input.scenarioResults),
    toolTracePresent: input.scenarioResults.every((row) => Array.isArray(row.toolTrace) && row.toolTrace.length > 0),
    finalStatePresent: input.scenarioResults.every((row) => row.finalState && Object.keys(row.finalState).length > 0),
    judgeCompleted: input.scenarioResults.every((row) => row.judgeCompleted === true),
    generationIdsOptional: input.scenarioResults.every(
      (row) => row.generationIds === undefined || row.generationIds.length > 0,
    ),
    costTokensPresent: input.scenarioResults.every(
      (row) =>
        typeof row.costUsd === "number" && typeof row.inputTokens === "number" && typeof row.outputTokens === "number",
    ),
    limitsPresent: Boolean(input.limits && (input.limits.maxCostUsd !== undefined || input.limits.maxSteps !== undefined)),
    anomaliesAbsent: !input.anomalies || input.anomalies.length === 0,
  };

  const reasons: string[] = [];
  if (!checks.benchmarkVersion) reasons.push("benchmarkVersion must be cap-001-v1");
  if (!checks.capabilityFingerprint) reasons.push("capabilityFingerprint missing");
  if (!checks.capabilityComparable) reasons.push("capabilityFingerprint does not match expected CapabilityContract");
  if (!checks.environmentFingerprint) reasons.push("environmentFingerprint missing");
  if (!checks.environmentComparable) {
    reasons.push("environmentFingerprint/envHeadSha do not match expected EnvironmentManifest");
  }
  if (!checks.envHeadSha) reasons.push("envHeadSha missing or uncommitted");
  if (!checks.requestedModel) reasons.push("requestedModel missing");
  if (!checks.servedModel) reasons.push("servedModel missing");
  if (!checks.provider) reasons.push("provider missing");
  if (!checks.modelMatch) reasons.push("requestedModel and servedModel differ");
  if (!checks.fallbackDisabled) reasons.push("fallbackDisabled must be true for comparable runs");
  if (!checks.scenarioCompleteness) reasons.push("scenarioCompleteness requires all 12 LEAD scenarios");
  if (!checks.toolTracePresent) reasons.push("toolTrace missing for one or more scenarios");
  if (!checks.finalStatePresent) reasons.push("finalState missing for one or more scenarios");
  if (!checks.judgeCompleted) reasons.push("judge did not complete for one or more scenarios");
  if (!checks.generationIdsOptional) reasons.push("generationIds present but empty");
  if (!checks.costTokensPresent) reasons.push("cost or token accounting missing");
  if (!checks.limitsPresent) reasons.push("run limits not recorded");
  if (!checks.anomaliesAbsent) reasons.push(`anomalies recorded: ${(input.anomalies ?? []).join(", ")}`);

  let status: RunValidationStatus = "VALID";
  if (!checks.capabilityComparable || !checks.environmentComparable) {
    status = "INCOMPARABLE";
  } else if (reasons.length > 0) {
    status = "INVALID";
  }

  return { status, checks, reasons };
}

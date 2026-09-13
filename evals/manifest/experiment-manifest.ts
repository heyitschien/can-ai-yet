import { createHash } from "node:crypto";
import { ENVIRONMENT_VERSION, FIXTURE_VERSION } from "@/evals/types";

export const CAP_001_BENCHMARK_VERSION = "cap-001-v1";

/**
 * LabManifest — the immutable measuring instrument (the racetrack).
 * Intentionally excludes model/provider: those are RunConfig variables.
 */
export type LabManifestInput = {
  labHeadSha: string;
  fixtureVersion: string;
  environmentVersion: string;
  scenarioIds: string[];
  /** Optional content hashes for executable inputs when available. */
  scenarioDefinitionHash?: string;
  policyFixtureHash?: string;
  judgeVersion?: string;
  systemToolContractVersion?: string;
  runnerVersion?: string;
  limitsScoringVersion?: string;
};

export type LabManifest = LabManifestInput & {
  capabilityCode: "CAP-001";
  benchmarkVersion: typeof CAP_001_BENCHMARK_VERSION;
  labFingerprint: string;
};

/** RunConfig — intentional experimental variables (the car). */
export type RunConfig = {
  model: string;
  provider: string;
  route?: string;
  permissionEnvelope?: string;
  maxSpendUsd?: number;
  maxTurns?: number;
  maxTokens?: number;
  maxRetries?: number;
  allowFallbacks: boolean;
};

/** RunReceipt — observed execution evidence for one run. */
export type RunReceipt = {
  labFingerprint: string;
  labHeadSha: string;
  runConfig: RunConfig;
  requestedModel: string;
  servedModel: string;
  servedProvider?: string;
  generationIds?: string[];
  totalCostUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
  anomalies?: string[];
};

export type ManifestComparison = "COMPARABLE" | "INCOMPARABLE";

function canonicalizeScenarioIds(scenarioIds: string[]): string[] {
  return [...scenarioIds].sort();
}

export function computeLabFingerprint(
  input: Omit<LabManifestInput, "labHeadSha"> & { benchmarkVersion: string },
): string {
  const canonical = {
    benchmarkVersion: input.benchmarkVersion,
    capabilityCode: "CAP-001",
    environmentVersion: input.environmentVersion,
    fixtureVersion: input.fixtureVersion,
    judgeVersion: input.judgeVersion ?? "judge-v1",
    limitsScoringVersion: input.limitsScoringVersion ?? "limits-v1",
    policyFixtureHash: input.policyFixtureHash ?? "policy-acme-v1",
    runnerVersion: input.runnerVersion ?? "runner-v1",
    scenarioDefinitionHash: input.scenarioDefinitionHash ?? "scenarios-cap001-v1",
    scenarioIds: canonicalizeScenarioIds(input.scenarioIds),
    systemToolContractVersion: input.systemToolContractVersion ?? "cap001-tools-v1",
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function buildLabManifest(input: LabManifestInput): LabManifest {
  const scenarioIds = canonicalizeScenarioIds(input.scenarioIds);
  const labFingerprint = computeLabFingerprint({
    benchmarkVersion: CAP_001_BENCHMARK_VERSION,
    fixtureVersion: input.fixtureVersion,
    environmentVersion: input.environmentVersion,
    scenarioIds,
    scenarioDefinitionHash: input.scenarioDefinitionHash,
    policyFixtureHash: input.policyFixtureHash,
    judgeVersion: input.judgeVersion,
    systemToolContractVersion: input.systemToolContractVersion,
    runnerVersion: input.runnerVersion,
    limitsScoringVersion: input.limitsScoringVersion,
  });
  return {
    capabilityCode: "CAP-001",
    benchmarkVersion: CAP_001_BENCHMARK_VERSION,
    labHeadSha: input.labHeadSha,
    fixtureVersion: input.fixtureVersion,
    environmentVersion: input.environmentVersion,
    scenarioIds,
    scenarioDefinitionHash: input.scenarioDefinitionHash,
    policyFixtureHash: input.policyFixtureHash,
    judgeVersion: input.judgeVersion,
    systemToolContractVersion: input.systemToolContractVersion,
    runnerVersion: input.runnerVersion,
    limitsScoringVersion: input.limitsScoringVersion,
    labFingerprint,
  };
}

/**
 * Same LabManifest (racetrack) is COMPARABLE across different models.
 * Different lab fingerprints or different accepted lab heads are INCOMPARABLE
 * unless an independently reviewed docs/evidence-only exception is recorded elsewhere.
 */
export function compareLabManifests(a: LabManifest, b: LabManifest): ManifestComparison {
  if (a.labFingerprint !== b.labFingerprint) return "INCOMPARABLE";
  if (a.labHeadSha !== b.labHeadSha) return "INCOMPARABLE";
  return "COMPARABLE";
}

export function defaultCap001ScenarioIds(): string[] {
  return Array.from({ length: 12 }, (_, index) => `LEAD-${String(index + 1).padStart(3, "0")}`);
}

export function defaultLabManifest(overrides: Partial<LabManifestInput> = {}): LabManifest {
  return buildLabManifest({
    labHeadSha: overrides.labHeadSha ?? "test-lab-head-placeholder",
    fixtureVersion: overrides.fixtureVersion ?? FIXTURE_VERSION,
    environmentVersion: overrides.environmentVersion ?? ENVIRONMENT_VERSION,
    scenarioIds: overrides.scenarioIds ?? defaultCap001ScenarioIds(),
    scenarioDefinitionHash: overrides.scenarioDefinitionHash,
    policyFixtureHash: overrides.policyFixtureHash,
    judgeVersion: overrides.judgeVersion,
    systemToolContractVersion: overrides.systemToolContractVersion,
    runnerVersion: overrides.runnerVersion,
    limitsScoringVersion: overrides.limitsScoringVersion,
  });
}

export function defaultRunConfig(overrides: Partial<RunConfig> = {}): RunConfig {
  return {
    model: overrides.model ?? "anthropic/claude-sonnet-4.6",
    provider: overrides.provider ?? "openrouter",
    route: overrides.route,
    permissionEnvelope: overrides.permissionEnvelope ?? "envelope-a",
    maxSpendUsd: overrides.maxSpendUsd ?? 1,
    maxTurns: overrides.maxTurns ?? 8,
    maxTokens: overrides.maxTokens ?? 800,
    maxRetries: overrides.maxRetries ?? 0,
    allowFallbacks: overrides.allowFallbacks ?? false,
  };
}

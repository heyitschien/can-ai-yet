import { createHash } from "node:crypto";
import { ENVIRONMENT_VERSION, FIXTURE_VERSION } from "@/evals/types";

export const CAP_001_BENCHMARK_VERSION = "cap-001-v1";

export type Cap001V1ManifestInput = {
  gitSha: string;
  model: string;
  provider: string;
  fixtureVersion: string;
  environmentVersion: string;
  scenarioIds: string[];
};

export type Cap001V1Manifest = Cap001V1ManifestInput & {
  capabilityCode: "CAP-001";
  benchmarkVersion: typeof CAP_001_BENCHMARK_VERSION;
  fingerprint: string;
};

export type ManifestComparison = "COMPARABLE" | "INCOMPARABLE";

function canonicalizeScenarioIds(scenarioIds: string[]): string[] {
  return [...scenarioIds].sort();
}

export function computeManifestFingerprint(input: Omit<Cap001V1ManifestInput, "gitSha"> & { benchmarkVersion: string }): string {
  const canonical = {
    benchmarkVersion: input.benchmarkVersion,
    capabilityCode: "CAP-001",
    environmentVersion: input.environmentVersion,
    fixtureVersion: input.fixtureVersion,
    model: input.model,
    provider: input.provider,
    scenarioIds: canonicalizeScenarioIds(input.scenarioIds),
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function buildCap001V1Manifest(input: Cap001V1ManifestInput): Cap001V1Manifest {
  const scenarioIds = canonicalizeScenarioIds(input.scenarioIds);
  const fingerprint = computeManifestFingerprint({
    benchmarkVersion: CAP_001_BENCHMARK_VERSION,
    model: input.model,
    provider: input.provider,
    fixtureVersion: input.fixtureVersion,
    environmentVersion: input.environmentVersion,
    scenarioIds,
  });
  return {
    capabilityCode: "CAP-001",
    benchmarkVersion: CAP_001_BENCHMARK_VERSION,
    gitSha: input.gitSha,
    model: input.model,
    provider: input.provider,
    fixtureVersion: input.fixtureVersion,
    environmentVersion: input.environmentVersion,
    scenarioIds,
    fingerprint,
  };
}

export function compareManifests(a: Cap001V1Manifest, b: Cap001V1Manifest): ManifestComparison {
  const sameComparableFields =
    a.benchmarkVersion === b.benchmarkVersion &&
    a.fixtureVersion === b.fixtureVersion &&
    a.environmentVersion === b.environmentVersion &&
    a.model === b.model &&
    a.provider === b.provider &&
    a.scenarioIds.join("|") === b.scenarioIds.join("|");
  return sameComparableFields ? "COMPARABLE" : "INCOMPARABLE";
}

export function defaultCap001ScenarioIds(): string[] {
  return Array.from({ length: 12 }, (_, index) => `LEAD-${String(index + 1).padStart(3, "0")}`);
}

export function defaultCap001V1Manifest(overrides: Partial<Cap001V1ManifestInput> = {}): Cap001V1Manifest {
  return buildCap001V1Manifest({
    gitSha: overrides.gitSha ?? "533ac5f",
    model: overrides.model ?? "anthropic/claude-sonnet-4.6",
    provider: overrides.provider ?? "openrouter",
    fixtureVersion: overrides.fixtureVersion ?? FIXTURE_VERSION,
    environmentVersion: overrides.environmentVersion ?? ENVIRONMENT_VERSION,
    scenarioIds: overrides.scenarioIds ?? defaultCap001ScenarioIds(),
  });
}

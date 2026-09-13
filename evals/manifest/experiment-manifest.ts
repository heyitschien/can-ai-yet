import { createHash } from "node:crypto";
import { ENVIRONMENT_VERSION, FIXTURE_VERSION } from "@/evals/types";

export const CAP_001_BENCHMARK_VERSION = "cap-001-v1";
export const CAP_001_PORTABLE_CONTRACT_VERSION = "cap-001-portable-v2";

/**
 * CapabilityContractManifest — the invariant business exam across environments.
 * Same contract for synthetic and HubSpot transfer. Excludes environment mechanics
 * and model/provider (those are EnvironmentManifest / RunConfig).
 */
export type CapabilityContractInput = {
  capabilityCode?: "CAP-001";
  portableContractVersion?: string;
  scenarioIds: string[];
  /** Portable business questions / scenario semantics hash. */
  businessSemanticsVersion?: string;
  /** Agent-facing tool semantics (names/meanings), not HubSpot adapter impl. */
  agentToolSemanticsVersion?: string;
  /** Visible business policy contract version. */
  policyContractVersion?: string;
  /** Deterministic business predicates / scoring semantics. */
  judgePredicateSemanticsVersion?: string;
  /** Authority/safety invariants that must survive environment translation. */
  authoritySafetyInvariantsVersion?: string;
};

export type CapabilityContractManifest = Required<
  Pick<
    CapabilityContractInput,
    | "capabilityCode"
    | "portableContractVersion"
    | "scenarioIds"
    | "businessSemanticsVersion"
    | "agentToolSemanticsVersion"
    | "policyContractVersion"
    | "judgePredicateSemanticsVersion"
    | "authoritySafetyInvariantsVersion"
  >
> & {
  capabilityFingerprint: string;
};

/**
 * EnvironmentManifest (also called LabManifest) — environment-specific racetrack mechanics.
 * Synthetic vs HubSpot intentionally differ here. Model/provider stay in RunConfig.
 */
export type EnvironmentManifestInput = {
  environmentId: string;
  environmentVersion: string;
  fixtureVersion: string;
  /** Exact accepted implementation head for this environment pack. */
  envHeadSha: string;
  adapterImplementationVersion?: string;
  seedResetVersion?: string;
  apiVersion?: string;
  snapshotProjectionVersion?: string;
  runnerVersion?: string;
  /** Environment-specific permission mechanics when distinct from portable contract. */
  environmentPermissionMechanicsVersion?: string;
};

export type EnvironmentManifest = EnvironmentManifestInput & {
  environmentFingerprint: string;
};

/** @deprecated Prefer EnvironmentManifest — kept as the within-environment lab name. */
export type LabManifest = EnvironmentManifest & {
  /** Alias of environmentFingerprint for prior call sites. */
  labFingerprint: string;
  /** Alias of envHeadSha. */
  labHeadSha: string;
  capabilityCode: "CAP-001";
  benchmarkVersion: typeof CAP_001_BENCHMARK_VERSION;
  scenarioIds: string[];
};

/** RunConfig — intentional run variables (the car). */
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
  capabilityFingerprint: string;
  environmentFingerprint: string;
  envHeadSha: string;
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

export type ModelComparison = "COMPARABLE_MODEL_RUNS" | "INCOMPARABLE";
export type TransferComparison = "COMPARABLE_TRANSFER_PAIR" | "INCOMPARABLE";
/** @deprecated Use ModelComparison / TransferComparison. */
export type ManifestComparison = "COMPARABLE" | "INCOMPARABLE";

function canonicalizeScenarioIds(scenarioIds: string[]): string[] {
  return [...scenarioIds].sort();
}

function sha(canonical: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function computeCapabilityFingerprint(input: CapabilityContractInput): string {
  return sha({
    capabilityCode: input.capabilityCode ?? "CAP-001",
    portableContractVersion: input.portableContractVersion ?? CAP_001_PORTABLE_CONTRACT_VERSION,
    scenarioIds: canonicalizeScenarioIds(input.scenarioIds),
    businessSemanticsVersion: input.businessSemanticsVersion ?? "cap001-business-v2",
    agentToolSemanticsVersion: input.agentToolSemanticsVersion ?? "cap001-tools-v1",
    policyContractVersion: input.policyContractVersion ?? "policy-acme-v1",
    judgePredicateSemanticsVersion: input.judgePredicateSemanticsVersion ?? "judge-predicates-v1",
    authoritySafetyInvariantsVersion: input.authoritySafetyInvariantsVersion ?? "authority-safety-v1",
  });
}

export function buildCapabilityContract(input: CapabilityContractInput): CapabilityContractManifest {
  const scenarioIds = canonicalizeScenarioIds(input.scenarioIds);
  const portableContractVersion = input.portableContractVersion ?? CAP_001_PORTABLE_CONTRACT_VERSION;
  const businessSemanticsVersion = input.businessSemanticsVersion ?? "cap001-business-v2";
  const agentToolSemanticsVersion = input.agentToolSemanticsVersion ?? "cap001-tools-v1";
  const policyContractVersion = input.policyContractVersion ?? "policy-acme-v1";
  const judgePredicateSemanticsVersion = input.judgePredicateSemanticsVersion ?? "judge-predicates-v1";
  const authoritySafetyInvariantsVersion = input.authoritySafetyInvariantsVersion ?? "authority-safety-v1";
  return {
    capabilityCode: "CAP-001",
    portableContractVersion,
    scenarioIds,
    businessSemanticsVersion,
    agentToolSemanticsVersion,
    policyContractVersion,
    judgePredicateSemanticsVersion,
    authoritySafetyInvariantsVersion,
    capabilityFingerprint: computeCapabilityFingerprint({
      capabilityCode: "CAP-001",
      portableContractVersion,
      scenarioIds,
      businessSemanticsVersion,
      agentToolSemanticsVersion,
      policyContractVersion,
      judgePredicateSemanticsVersion,
      authoritySafetyInvariantsVersion,
    }),
  };
}

export function computeEnvironmentFingerprint(input: Omit<EnvironmentManifestInput, "envHeadSha">): string {
  return sha({
    environmentId: input.environmentId,
    environmentVersion: input.environmentVersion,
    fixtureVersion: input.fixtureVersion,
    adapterImplementationVersion: input.adapterImplementationVersion ?? "adapter-v1",
    seedResetVersion: input.seedResetVersion ?? "seed-reset-v1",
    apiVersion: input.apiVersion ?? "n/a",
    snapshotProjectionVersion: input.snapshotProjectionVersion ?? "snapshot-v1",
    runnerVersion: input.runnerVersion ?? "runner-v1",
    environmentPermissionMechanicsVersion: input.environmentPermissionMechanicsVersion ?? "env-perms-v1",
  });
}

export function buildEnvironmentManifest(input: EnvironmentManifestInput): EnvironmentManifest {
  const environmentFingerprint = computeEnvironmentFingerprint(input);
  return {
    ...input,
    adapterImplementationVersion: input.adapterImplementationVersion ?? "adapter-v1",
    seedResetVersion: input.seedResetVersion ?? "seed-reset-v1",
    apiVersion: input.apiVersion ?? "n/a",
    snapshotProjectionVersion: input.snapshotProjectionVersion ?? "snapshot-v1",
    runnerVersion: input.runnerVersion ?? "runner-v1",
    environmentPermissionMechanicsVersion: input.environmentPermissionMechanicsVersion ?? "env-perms-v1",
    environmentFingerprint,
  };
}

/**
 * Cross-model comparison inside one environment:
 * same CapabilityContract + same EnvironmentManifest (incl. accepted env head);
 * different model allowed.
 */
export function compareModelRuns(input: {
  capabilityA: CapabilityContractManifest;
  capabilityB: CapabilityContractManifest;
  environmentA: EnvironmentManifest;
  environmentB: EnvironmentManifest;
}): ModelComparison {
  if (input.capabilityA.capabilityFingerprint !== input.capabilityB.capabilityFingerprint) {
    return "INCOMPARABLE";
  }
  if (input.environmentA.environmentFingerprint !== input.environmentB.environmentFingerprint) {
    return "INCOMPARABLE";
  }
  if (input.environmentA.envHeadSha !== input.environmentB.envHeadSha) {
    return "INCOMPARABLE";
  }
  return "COMPARABLE_MODEL_RUNS";
}

/** Fixed-model transfer runs require full relevant RunConfig equality. */
export function runConfigsEqualForTransfer(a: RunConfig, b: RunConfig): boolean {
  return (
    a.model === b.model &&
    a.provider === b.provider &&
    (a.route ?? "") === (b.route ?? "") &&
    (a.permissionEnvelope ?? "") === (b.permissionEnvelope ?? "") &&
    (a.maxSpendUsd ?? null) === (b.maxSpendUsd ?? null) &&
    (a.maxTurns ?? null) === (b.maxTurns ?? null) &&
    (a.maxTokens ?? null) === (b.maxTokens ?? null) &&
    (a.maxRetries ?? null) === (b.maxRetries ?? null) &&
    a.allowFallbacks === b.allowFallbacks
  );
}

/**
 * Synthetic ↔ HubSpot (or other env) reality transfer:
 * same CapabilityContract + intentionally different EnvironmentManifest;
 * same chosen model/configuration held fixed (full RunConfig equality).
 */
export function compareTransferPair(input: {
  capabilityA: CapabilityContractManifest;
  capabilityB: CapabilityContractManifest;
  environmentA: EnvironmentManifest;
  environmentB: EnvironmentManifest;
  runConfigA: RunConfig;
  runConfigB: RunConfig;
}): TransferComparison {
  if (input.capabilityA.capabilityFingerprint !== input.capabilityB.capabilityFingerprint) {
    return "INCOMPARABLE";
  }
  if (input.environmentA.environmentFingerprint === input.environmentB.environmentFingerprint) {
    return "INCOMPARABLE";
  }
  if (input.environmentA.environmentId === input.environmentB.environmentId) {
    return "INCOMPARABLE";
  }
  if (!runConfigsEqualForTransfer(input.runConfigA, input.runConfigB)) {
    return "INCOMPARABLE";
  }
  return "COMPARABLE_TRANSFER_PAIR";
}

export function defaultCap001ScenarioIds(): string[] {
  return Array.from({ length: 12 }, (_, index) => `LEAD-${String(index + 1).padStart(3, "0")}`);
}

export function defaultCapabilityContract(
  overrides: Partial<CapabilityContractInput> = {},
): CapabilityContractManifest {
  return buildCapabilityContract({
    scenarioIds: overrides.scenarioIds ?? defaultCap001ScenarioIds(),
    portableContractVersion: overrides.portableContractVersion,
    businessSemanticsVersion: overrides.businessSemanticsVersion,
    agentToolSemanticsVersion: overrides.agentToolSemanticsVersion,
    policyContractVersion: overrides.policyContractVersion,
    judgePredicateSemanticsVersion: overrides.judgePredicateSemanticsVersion,
    authoritySafetyInvariantsVersion: overrides.authoritySafetyInvariantsVersion,
  });
}

export function defaultSyntheticEnvironment(
  overrides: Partial<EnvironmentManifestInput> = {},
): EnvironmentManifest {
  return buildEnvironmentManifest({
    environmentId: overrides.environmentId ?? "synthetic-acme-v1",
    environmentVersion: overrides.environmentVersion ?? ENVIRONMENT_VERSION,
    fixtureVersion: overrides.fixtureVersion ?? FIXTURE_VERSION,
    envHeadSha: overrides.envHeadSha ?? "test-lab-head-placeholder",
    adapterImplementationVersion: overrides.adapterImplementationVersion ?? "synthetic-world-v1",
    seedResetVersion: overrides.seedResetVersion ?? "synthetic-seed-reset-v1",
    apiVersion: overrides.apiVersion ?? "n/a",
    snapshotProjectionVersion: overrides.snapshotProjectionVersion ?? "synthetic-snapshot-v1",
    runnerVersion: overrides.runnerVersion,
    environmentPermissionMechanicsVersion: overrides.environmentPermissionMechanicsVersion,
  });
}

export function defaultHubSpotEnvironment(
  overrides: Partial<EnvironmentManifestInput> = {},
): EnvironmentManifest {
  return buildEnvironmentManifest({
    environmentId: overrides.environmentId ?? "hubspot-dev-test-v1",
    environmentVersion: overrides.environmentVersion ?? "hubspot-transfer-v1",
    fixtureVersion: overrides.fixtureVersion ?? FIXTURE_VERSION,
    envHeadSha: overrides.envHeadSha ?? "hubspot-env-head-placeholder",
    adapterImplementationVersion: overrides.adapterImplementationVersion ?? "hubspot-commissioning-live-v1",
    seedResetVersion: overrides.seedResetVersion ?? "hubspot-seed-reset-planned-v1",
    apiVersion: overrides.apiVersion ?? "2026-09",
    snapshotProjectionVersion: overrides.snapshotProjectionVersion ?? "hubspot-snapshot-planned-v1",
    runnerVersion: overrides.runnerVersion ?? "hubspot-commissioning-runner-v1",
    environmentPermissionMechanicsVersion:
      overrides.environmentPermissionMechanicsVersion ?? "hubspot-envelope-a-contacts-rw-v1",
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

/** @deprecated Prefer defaultSyntheticEnvironment + defaultCapabilityContract. */
export type LabManifestInput = {
  labHeadSha: string;
  fixtureVersion: string;
  environmentVersion: string;
  scenarioIds: string[];
  scenarioDefinitionHash?: string;
  policyFixtureHash?: string;
  judgeVersion?: string;
  systemToolContractVersion?: string;
  runnerVersion?: string;
  limitsScoringVersion?: string;
};

/** @deprecated Prefer buildEnvironmentManifest. */
export function buildLabManifest(input: LabManifestInput): LabManifest {
  const env = buildEnvironmentManifest({
    environmentId: "synthetic-acme-v1",
    environmentVersion: input.environmentVersion,
    fixtureVersion: input.fixtureVersion,
    envHeadSha: input.labHeadSha,
    runnerVersion: input.runnerVersion,
  });
  return {
    ...env,
    labFingerprint: env.environmentFingerprint,
    labHeadSha: env.envHeadSha,
    capabilityCode: "CAP-001",
    benchmarkVersion: CAP_001_BENCHMARK_VERSION,
    scenarioIds: canonicalizeScenarioIds(input.scenarioIds),
  };
}

/** @deprecated Prefer compareModelRuns. */
export function compareLabManifests(a: LabManifest, b: LabManifest): ManifestComparison {
  if (a.labFingerprint !== b.labFingerprint) return "INCOMPARABLE";
  if (a.labHeadSha !== b.labHeadSha) return "INCOMPARABLE";
  return "COMPARABLE";
}

/** @deprecated Prefer defaultSyntheticEnvironment. */
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

/** @deprecated Prefer computeEnvironmentFingerprint. */
export function computeLabFingerprint(
  input: Omit<LabManifestInput, "labHeadSha"> & { benchmarkVersion: string },
): string {
  return computeEnvironmentFingerprint({
    environmentId: "synthetic-acme-v1",
    environmentVersion: input.environmentVersion,
    fixtureVersion: input.fixtureVersion,
    runnerVersion: input.runnerVersion,
  });
}

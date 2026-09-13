import { scenariosFor } from "@/evals/capabilities";
import { HUBSPOT_CAP001_SNAPSHOT_VERSION } from "@/evals/hubspot/cap001/versions";
import { comparisonScenarioIds } from "@/evals/hubspot/cap001/mapping";
import { resetAndPreflight, seedAndPreflight } from "@/evals/hubspot/cap001/preflight";
import {
  projectHubSpotWorldSnapshot,
  snapshotWithBoundedRetry,
  type HubSpotWorldSnapshot,
} from "@/evals/hubspot/cap001/snapshot";
import type { HubSpotCap001Store } from "@/evals/hubspot/cap001/store";
import { judgeScenario } from "@/evals/judges/judge";
import type { Assertion } from "@/evals/types";

export type Cap001CalibrationResult = {
  scenarioId: string;
  mappingStatus: "MAPPED" | "UNMAPPED" | "EXCLUDED";
  success: boolean;
  failures: string[];
};

export function calibrateScenarioAgainstBaseline(input: {
  store: HubSpotCap001Store;
  runId: string;
  scenarioId: string;
  expectedOverride?: Assertion[];
  forbiddenOverride?: Assertion[];
}): Cap001CalibrationResult {
  const mapped = comparisonScenarioIds();
  if (!mapped.includes(input.scenarioId)) {
    return {
      scenarioId: input.scenarioId,
      mappingStatus: "UNMAPPED",
      success: false,
      failures: ["Scenario is UNMAPPED and excluded from comparison totals"],
    };
  }

  const preflight = seedAndPreflight(input.store, input.runId);
  if (!preflight.ok) {
    return {
      scenarioId: input.scenarioId,
      mappingStatus: "MAPPED",
      success: false,
      failures: preflight.failures,
    };
  }

  const snap = projectHubSpotWorldSnapshot({
    state: input.store.snapshotState(),
    projectionVersion: HUBSPOT_CAP001_SNAPSHOT_VERSION,
  });
  const scenario = scenariosFor("CAP-001").find((row) => row.id === input.scenarioId);
  if (!scenario) {
    return {
      scenarioId: input.scenarioId,
      mappingStatus: "EXCLUDED",
      success: false,
      failures: ["Unknown scenario id"],
    };
  }

  const judged = judgeScenario(
    snap.world,
    input.expectedOverride ?? scenario.expected,
    input.forbiddenOverride ?? scenario.forbidden,
  );
  return {
    scenarioId: input.scenarioId,
    mappingStatus: "MAPPED",
    success: judged.success,
    failures: judged.failures,
  };
}

export function calibrateForbiddenDetection(input: {
  store: HubSpotCap001Store;
  runId: string;
  mutate: (store: HubSpotCap001Store) => void;
  forbidden: Assertion[];
}): { caught: boolean; snapshot: HubSpotWorldSnapshot; failures: string[] } {
  seedAndPreflight(input.store, input.runId);
  input.mutate(input.store);
  const snapshot = projectHubSpotWorldSnapshot({
    state: input.store.snapshotState(),
    projectionVersion: HUBSPOT_CAP001_SNAPSHOT_VERSION,
  });
  const judged = judgeScenario(snapshot.world, [], input.forbidden);
  return {
    caught: !judged.success,
    snapshot,
    failures: judged.failures,
  };
}

export function runTripleDryReset(store: HubSpotCap001Store, baseRunId: string): {
  ok: boolean;
  attempts: Array<{ runId: string; ok: boolean; failures: string[] }>;
} {
  const attempts = [1, 2, 3].map((n) => {
    const runId = `${baseRunId}-reset-${n}`;
    const result = resetAndPreflight(store, runId);
    return { runId, ok: result.ok, failures: result.failures };
  });
  return { ok: attempts.every((row) => row.ok), attempts };
}

export function captureAuthoritativeSnapshot(
  store: HubSpotCap001Store,
): ReturnType<typeof snapshotWithBoundedRetry> {
  return snapshotWithBoundedRetry(store, {
    projectionVersion: HUBSPOT_CAP001_SNAPSHOT_VERSION,
    maxAttempts: 4,
  });
}

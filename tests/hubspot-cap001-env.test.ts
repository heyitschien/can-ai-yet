import { describe, expect, it } from "vitest";
import {
  CAP001_EXPECTED_BASELINE_COUNTS,
  CAP001_HUBSPOT_SCENARIO_MAPPING,
  HubSpotCap001Store,
  calibrateForbiddenDetection,
  calibrateScenarioAgainstBaseline,
  captureAuthoritativeSnapshot,
  comparisonScenarioIds,
  mappedScenarioIds,
  preflightCap001HubSpotEnv,
  projectHubSpotWorldSnapshot,
  resetAndPreflight,
  runTripleDryReset,
  seedAndPreflight,
  snapshotWithBoundedRetry,
  unmappedScenarioIds,
} from "@/evals/hubspot/cap001";
import {
  HUBSPOT_CAP001_ADAPTER_VERSION,
  HUBSPOT_CAP001_SEED_RESET_VERSION,
  HUBSPOT_CAP001_SNAPSHOT_VERSION,
} from "@/evals/hubspot/cap001/versions";
import { hubspotCap001EnvironmentManifest } from "@/evals/hubspot/environment";
import { HUBSPOT_CAP001_SNAPSHOT_VERSION as SNAP } from "@/evals/hubspot/cap001/versions";
import { judgeScenario } from "@/evals/judges/judge";

describe("HubSpot CAP-001 environment machinery (CAY-08)", () => {
  it("seeds baseline idempotently and passes preflight", () => {
    const store = new HubSpotCap001Store();
    const first = seedAndPreflight(store, "run-a");
    const second = seedAndPreflight(store, "run-a");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(store.activeCounts()).toMatchObject(CAP001_EXPECTED_BASELINE_COUNTS);
  });

  it("supports three consecutive dry resets", () => {
    const store = new HubSpotCap001Store();
    const result = runTripleDryReset(store, "dry");
    expect(result.ok).toBe(true);
    expect(result.attempts).toHaveLength(3);
  });

  it("projects snapshot into World and keeps baseline free of forbidden sends", () => {
    const store = new HubSpotCap001Store();
    seedAndPreflight(store, "snap-1");
    const snapshot = projectHubSpotWorldSnapshot({
      state: store.snapshotState(),
      projectionVersion: SNAP,
    });
    expect(snapshot.runId).toBe("snap-1");
    expect(snapshot.world.contactByEmail("jordan.lee@example.com")?.doNotContact).toBe(true);
    const judged = judgeScenario(snapshot.world, [{ kind: "no_sends" }], [{ kind: "escalated" }]);
    expect(judged.success).toBe(true);
  });

  it("detects forced forbidden outbound after projection (calibration)", () => {
    const store = new HubSpotCap001Store();
    const result = calibrateForbiddenDetection({
      store,
      runId: "bad-send",
      mutate: (s) => {
        s.addOutbound({
          cayFixtureId: "sent-wrong",
          cayRunId: "bad-send",
          cayScenarioId: "LEAD-005",
          to: "jordan.lee@example.com",
          body: "pitch",
        });
      },
      forbidden: [{ kind: "sent", to: "jordan.lee@example.com" }],
    });
    expect(result.caught).toBe(true);
  });

  it("detects invented phone as contact_field drift", () => {
    const store = new HubSpotCap001Store();
    const result = calibrateForbiddenDetection({
      store,
      runId: "phone-invent",
      mutate: (s) => s.setContactPhone("jamie.cruz@example.com", "555-9999"),
      forbidden: [{ kind: "contact_field", email: "jamie.cruz@example.com", field: "phone", equals: "555-9999" }],
    });
    // forbidden assertion succeeds when phone equals invented value → judgeScenario marks failure
    expect(result.caught).toBe(true);
  });

  it("baseline fails LEAD-001 expected (no model actions yet) — infrastructure not exam pass", () => {
    const store = new HubSpotCap001Store();
    const result = calibrateScenarioAgainstBaseline({
      store,
      runId: "baseline-lead001",
      scenarioId: "LEAD-001",
    });
    expect(result.mappingStatus).toBe("MAPPED");
    expect(result.success).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);
  });

  it("handles bounded eventual-consistency lag on snapshot", () => {
    const store = new HubSpotCap001Store();
    seedAndPreflight(store, "lag-run");
    store.setSnapshotLag(2);
    const result = snapshotWithBoundedRetry(store, {
      projectionVersion: SNAP,
      maxAttempts: 3,
      expectedMinContacts: 1,
    });
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(3);
  });

  it("classifies exhausted lag as RUNTIME/API_FAILURE", () => {
    const store = new HubSpotCap001Store();
    seedAndPreflight(store, "lag-fail");
    store.setSnapshotLag(5);
    const result = captureAuthoritativeSnapshot(store);
    expect(result.ok).toBe(false);
    expect(result.failureClass).toBe("RUNTIME/API_FAILURE");
  });

  it("maps all 12 scenarios for mock calibration and excludes UNMAPPED from comparison set", () => {
    expect(CAP001_HUBSPOT_SCENARIO_MAPPING).toHaveLength(12);
    expect(mappedScenarioIds()).toHaveLength(12);
    expect(unmappedScenarioIds()).toHaveLength(0);
    expect(comparisonScenarioIds()).toEqual(mappedScenarioIds());
    expect(CAP001_HUBSPOT_SCENARIO_MAPPING.every((row) => row.liveScopeGap)).toBe(true);
  });

  it("freezes EnvironmentManifest versions for CAP-001 HubSpot env", () => {
    const env = hubspotCap001EnvironmentManifest({ envHeadSha: "test-head" });
    expect(env.adapterImplementationVersion).toBe(HUBSPOT_CAP001_ADAPTER_VERSION);
    expect(env.seedResetVersion).toBe(HUBSPOT_CAP001_SEED_RESET_VERSION);
    expect(env.snapshotProjectionVersion).toBe(HUBSPOT_CAP001_SNAPSHOT_VERSION);
    expect(env.apiVersion).toBe("2026-03");
    expect(env.envHeadSha).toBe("test-head");
  });

  it("reset clears scenario activity and restores baseline counts", () => {
    const store = new HubSpotCap001Store();
    seedAndPreflight(store, "r1");
    store.addNote({
      cayFixtureId: "n1",
      cayRunId: "r1",
      cayScenarioId: "LEAD-001",
      contactEmail: "alex.rivera@example.com",
      body: "temp",
    });
    expect(store.activeCounts().notes).toBe(1);
    const reset = resetAndPreflight(store, "r2");
    expect(reset.ok).toBe(true);
    expect(store.activeCounts().notes).toBe(0);
    expect(preflightCap001HubSpotEnv(store).ok).toBe(true);
  });
});

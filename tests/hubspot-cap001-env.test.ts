import { describe, expect, it } from "vitest";
import {
  CAP001_EXPECTED_BASELINE_COUNTS,
  CAP001_HUBSPOT_SCENARIO_MAPPING,
  HubSpotCap001Store,
  LiveHubSpotCap001Adapter,
  calibrateForbiddenDetection,
  calibrateScenarioAgainstBaseline,
  captureAuthoritativeSnapshot,
  comparisonScenarioIds,
  liveReadyScenarioIds,
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

  it("does not resurrect missing HubSpot contacts from World.fresh()", () => {
    const store = new HubSpotCap001Store();
    seedAndPreflight(store, "neg-contact");
    store.removeContactByFixtureId("contact-jordan");
    const snapshot = projectHubSpotWorldSnapshot({
      state: store.snapshotState(),
      projectionVersion: HUBSPOT_CAP001_SNAPSHOT_VERSION,
    });
    expect(snapshot.world.contactByEmail("jordan.lee@example.com")).toBeUndefined();
    expect(snapshot.raw.contacts.some((row) => row.email === "jordan.lee@example.com")).toBe(false);
  });

  it("does not resurrect missing HubSpot conflict appointment from World.fresh()", () => {
    const store = new HubSpotCap001Store();
    seedAndPreflight(store, "neg-appt");
    store.removeAppointmentByFixtureId("appt-busy-lead007");
    const snapshot = projectHubSpotWorldSnapshot({
      state: store.snapshotState(),
      projectionVersion: HUBSPOT_CAP001_SNAPSHOT_VERSION,
    });
    expect(
      snapshot.world.appointments.some((row) => row.start === "2026-09-12T14:00:00.000Z"),
    ).toBe(false);
  });

  it("projects snapshot CRM collections only from HubSpot state", () => {
    const store = new HubSpotCap001Store();
    seedAndPreflight(store, "snap-1");
    const snapshot = projectHubSpotWorldSnapshot({
      state: store.snapshotState(),
      projectionVersion: HUBSPOT_CAP001_SNAPSHOT_VERSION,
    });
    expect(snapshot.world.contacts).toHaveLength(CAP001_EXPECTED_BASELINE_COUNTS.contacts);
    expect(snapshot.world.deals).toHaveLength(CAP001_EXPECTED_BASELINE_COUNTS.deals);
    expect(snapshot.world.appointments).toHaveLength(CAP001_EXPECTED_BASELINE_COUNTS.appointments);
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

  it("baseline fails LEAD-001 expected (no model actions yet)", () => {
    const store = new HubSpotCap001Store();
    const result = calibrateScenarioAgainstBaseline({
      store,
      runId: "baseline-lead001",
      scenarioId: "LEAD-001",
    });
    expect(result.mappingStatus).toBe("MAPPED");
    expect(result.success).toBe(false);
  });

  it("requires complete fixture graph + stable reads for authoritative snapshot", () => {
    const store = new HubSpotCap001Store();
    seedAndPreflight(store, "lag-run");
    store.setSnapshotLag(1);
    const result = snapshotWithBoundedRetry(store, {
      projectionVersion: HUBSPOT_CAP001_SNAPSHOT_VERSION,
      maxAttempts: 4,
    });
    expect(result.ok).toBe(true);
    expect(result.attempts).toBeGreaterThanOrEqual(3);
  });

  it("fails closed when deals are only partially visible", () => {
    const store = new HubSpotCap001Store();
    seedAndPreflight(store, "partial-deals");
    store.setOmitFamiliesOnRead(["deals"]);
    const result = captureAuthoritativeSnapshot(store);
    expect(result.ok).toBe(false);
    expect(result.failureClass).toBe("RUNTIME/API_FAILURE");
  });

  it("fails closed when appointments are only partially visible", () => {
    const store = new HubSpotCap001Store();
    seedAndPreflight(store, "partial-appts");
    store.setOmitFamiliesOnRead(["appointments"]);
    const result = captureAuthoritativeSnapshot(store);
    expect(result.ok).toBe(false);
    expect(result.failureClass).toBe("RUNTIME/API_FAILURE");
  });

  it("resets the SAME runId and removes scenario appointments/activity", () => {
    const store = new HubSpotCap001Store();
    seedAndPreflight(store, "same-run");
    store.addNote({
      cayFixtureId: "n-scenario",
      cayRunId: "same-run",
      cayScenarioId: "LEAD-001",
      contactEmail: "alex.rivera@example.com",
      body: "temp",
    });
    store.addAppointment({
      cayFixtureId: "appt-scenario",
      cayRunId: "same-run",
      cayScenarioId: "LEAD-011",
      contactEmail: "quinn.adams@example.com",
      title: "Scenario booking",
      start: "2026-09-18T10:00:00.000Z",
      end: "2026-09-18T11:00:00.000Z",
      status: "booked",
    });
    expect(store.activeCounts().notes).toBe(1);
    expect(store.activeCounts().appointments).toBe(CAP001_EXPECTED_BASELINE_COUNTS.appointments + 1);

    const reset = resetAndPreflight(store, "same-run");
    expect(reset.ok).toBe(true);
    expect(store.activeCounts()).toMatchObject(CAP001_EXPECTED_BASELINE_COUNTS);
    expect(store.snapshotState().appointments.some((row) => row.cayFixtureId === "appt-scenario")).toBe(
      false,
    );
    expect(preflightCap001HubSpotEnv(store).ok).toBe(true);
  });

  it("separates semantic MAPPED from live READY (none live-ready yet)", () => {
    expect(CAP001_HUBSPOT_SCENARIO_MAPPING).toHaveLength(12);
    expect(mappedScenarioIds()).toHaveLength(12);
    expect(unmappedScenarioIds()).toHaveLength(0);
    expect(comparisonScenarioIds()).toEqual(mappedScenarioIds());
    expect(liveReadyScenarioIds()).toHaveLength(0);
    expect(CAP001_HUBSPOT_SCENARIO_MAPPING.every((row) => row.liveStatus !== "READY")).toBe(true);
  });

  it("live adapter fails closed for seed/snapshot without inventing state", () => {
    const live = new LiveHubSpotCap001Adapter();
    expect(live.kind).toBe("live");
    expect(live.supportedFamilies().size).toBe(0);
    const seeded = live.seedBaseline("x");
    expect(seeded.ok).toBe(false);
    if (!seeded.ok) expect(seeded.failureClass).toBe("ADAPTER_GAP");
    const read = live.readAuthoritativeState();
    expect(read.ok).toBe(false);
    if (!read.ok) expect(["SCOPE_GAP", "ADAPTER_GAP"]).toContain(read.failureClass);
    const required = live.requireFamily("deals");
    expect(required.ok).toBe(false);
  });

  it("freezes EnvironmentManifest versions for CAP-001 HubSpot env", () => {
    const env = hubspotCap001EnvironmentManifest({ envHeadSha: "test-head" });
    expect(env.adapterImplementationVersion).toBe(HUBSPOT_CAP001_ADAPTER_VERSION);
    expect(env.seedResetVersion).toBe(HUBSPOT_CAP001_SEED_RESET_VERSION);
    expect(env.snapshotProjectionVersion).toBe(HUBSPOT_CAP001_SNAPSHOT_VERSION);
    expect(env.apiVersion).toBe("2026-03");
  });
});

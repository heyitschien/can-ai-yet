import { describe, expect, it } from "vitest";
import {
  CAP001_EXPECTED_BASELINE_COUNTS,
  CAP001_HUBSPOT_DEAL_ENV_LIFECYCLE,
  CAP001_HUBSPOT_METADATA_PROVISIONING,
  CAP001_HUBSPOT_SCENARIO_MAPPING,
  CAP001_HUBSPOT_SCOPE_MATRIX,
  CAP001_LIVE_ENVIRONMENT_SCOPE_BLOCKER,
  HubSpotCap001Store,
  LiveHubSpotCap001Adapter,
  calibrateForbiddenDetection,
  calibrateScenarioAgainstBaseline,
  captureAuthoritativeSnapshot,
  comparisonScenarioIds,
  contactScopedReadyFamilies,
  genuinelyNewScopesFromMatrix,
  liveReadyScenarioIds,
  mappedScenarioIds,
  preflightCap001HubSpotEnv,
  projectHubSpotWorldSnapshot,
  resetAndPreflight,
  runTripleDryReset,
  seedAndPreflight,
  snapshotWithBoundedRetry,
  toolRowsBlockedAdapter,
  toolRowsBlockedScope,
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
  it("seeds baseline idempotently and passes preflight", async () => {
    const store = new HubSpotCap001Store();
    const first = await seedAndPreflight(store, "run-a");
    const second = await seedAndPreflight(store, "run-a");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(store.activeCounts()).toMatchObject(CAP001_EXPECTED_BASELINE_COUNTS);
  });

  it("supports three consecutive dry resets", async () => {
    const store = new HubSpotCap001Store();
    const result = await runTripleDryReset(store, "dry");
    expect(result.ok).toBe(true);
    expect(result.attempts).toHaveLength(3);
  });

  it("does not resurrect missing HubSpot contacts from World.fresh()", async () => {
    const store = new HubSpotCap001Store();
    await seedAndPreflight(store, "neg-contact");
    store.removeContactByFixtureId("contact-jordan");
    const snapshot = projectHubSpotWorldSnapshot({
      state: store.snapshotState(),
      projectionVersion: HUBSPOT_CAP001_SNAPSHOT_VERSION,
    });
    expect(snapshot.world.contactByEmail("jordan.lee@example.com")).toBeUndefined();
    expect(snapshot.raw.contacts.some((row) => row.email === "jordan.lee@example.com")).toBe(false);
  });

  it("does not resurrect missing HubSpot conflict appointment from World.fresh()", async () => {
    const store = new HubSpotCap001Store();
    await seedAndPreflight(store, "neg-appt");
    store.removeAppointmentByFixtureId("appt-busy-lead007");
    const snapshot = projectHubSpotWorldSnapshot({
      state: store.snapshotState(),
      projectionVersion: HUBSPOT_CAP001_SNAPSHOT_VERSION,
    });
    expect(
      snapshot.world.appointments.some((row) => row.start === "2026-09-12T14:00:00.000Z"),
    ).toBe(false);
  });

  it("projects snapshot CRM collections only from HubSpot state", async () => {
    const store = new HubSpotCap001Store();
    await seedAndPreflight(store, "snap-1");
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

  it("detects forced forbidden outbound after projection (calibration)", async () => {
    const store = new HubSpotCap001Store();
    const result = await calibrateForbiddenDetection({
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

  it("baseline fails LEAD-001 expected (no model actions yet)", async () => {
    const store = new HubSpotCap001Store();
    const result = await calibrateScenarioAgainstBaseline({
      store,
      runId: "baseline-lead001",
      scenarioId: "LEAD-001",
    });
    expect(result.mappingStatus).toBe("MAPPED");
    expect(result.success).toBe(false);
  });

  it("requires complete fixture graph + stable reads for authoritative snapshot", async () => {
    const store = new HubSpotCap001Store();
    await seedAndPreflight(store, "lag-run");
    store.setSnapshotLag(1);
    const result = await snapshotWithBoundedRetry(store, {
      projectionVersion: HUBSPOT_CAP001_SNAPSHOT_VERSION,
      maxAttempts: 4,
    });
    expect(result.ok).toBe(true);
    expect(result.attempts).toBeGreaterThanOrEqual(3);
  });

  it("fails closed when deals are only partially visible", async () => {
    const store = new HubSpotCap001Store();
    await seedAndPreflight(store, "partial-deals");
    store.setOmitFamiliesOnRead(["deals"]);
    const result = await captureAuthoritativeSnapshot(store);
    expect(result.ok).toBe(false);
    expect(result.failureClass).toBe("RUNTIME/API_FAILURE");
  });

  it("fails closed when appointments are only partially visible", async () => {
    const store = new HubSpotCap001Store();
    await seedAndPreflight(store, "partial-appts");
    store.setOmitFamiliesOnRead(["appointments"]);
    const result = await captureAuthoritativeSnapshot(store);
    expect(result.ok).toBe(false);
    expect(result.failureClass).toBe("RUNTIME/API_FAILURE");
  });

  it("resets the SAME runId and removes scenario appointments/activity", async () => {
    const store = new HubSpotCap001Store();
    await seedAndPreflight(store, "same-run");
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

    const reset = await resetAndPreflight(store, "same-run");
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
    expect(contactScopedReadyFamilies().has("contacts")).toBe(true);
    expect(contactScopedReadyFamilies().has("notes")).toBe(true);
    expect(contactScopedReadyFamilies().has("tasks")).toBe(true);
    expect(contactScopedReadyFamilies().has("escalations")).toBe(true);
    expect(contactScopedReadyFamilies().has("flags")).toBe(true);
    expect(contactScopedReadyFamilies().has("outbounds")).toBe(true);
    expect(contactScopedReadyFamilies().has("appointments")).toBe(true);
    expect(contactScopedReadyFamilies().has("deals")).toBe(false);
  });

  it("live adapter without client fails closed; with defaults seed is SCOPE_GAP for deals", async () => {
    const live = new LiveHubSpotCap001Adapter();
    expect(live.kind).toBe("live");
    expect(live.supportedFamilies().size).toBe(0);
    const seeded = await live.seedBaseline("x");
    expect(seeded.ok).toBe(false);
    if (!seeded.ok) {
      expect(seeded.failureClass).toBe("ADAPTER_GAP");
    }
    const read = await live.readAuthoritativeState();
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.failureClass).toBe("ADAPTER_GAP");
    const deals = live.requireFamily("deals");
    expect(deals.ok).toBe(false);
    if (!deals.ok) expect(deals.failureClass).toBe("SCOPE_GAP");
    const notes = live.requireFamily("notes");
    expect(notes.ok).toBe(false);
    if (!notes.ok) expect(notes.failureClass).toBe("ADAPTER_GAP");
  });

  it("freezes EnvironmentManifest versions for CAP-001 HubSpot env", () => {
    const env = hubspotCap001EnvironmentManifest({ envHeadSha: "test-head" });
    expect(env.adapterImplementationVersion).toBe(HUBSPOT_CAP001_ADAPTER_VERSION);
    expect(env.seedResetVersion).toBe(HUBSPOT_CAP001_SEED_RESET_VERSION);
    expect(env.snapshotProjectionVersion).toBe(HUBSPOT_CAP001_SNAPSHOT_VERSION);
    expect(env.apiVersion).toBe("2026-03");
    expect(env.apiVersionsByObjectFamily).toMatchObject({
      contacts: "2026-03",
      deals: "mixed-operation-level",
      notes: "2026-09",
      tasks: "2026-09",
      meetings: "2026-09",
      emails: "2026-09",
    });
    expect(env.apiVersionsByOperation).toMatchObject({
      "notes.create": "2026-09",
      "notes.list": "2026-09",
      "notes.archive": "2026-09",
      "tasks.create": "2026-09",
      "tasks.list": "2026-09",
      "tasks.archive": "2026-09",
      "meetings.create": "2026-09",
      "meetings.list": "2026-09",
      "meetings.archive": "2026-09",
      "emails.create": "2026-09",
      "emails.list": "2026-09",
      "emails.archive": "2026-09",
      "deals.create": "2026-09",
      "deals.read": "2026-09",
      "deals.update": "2026-09",
      "deals.archive": "2026-03",
      "deals.batch_archive": "2026-03",
      "properties.create": "2026-09",
    });
    expect(env.apiVersionsByObjectFamily).toMatchObject({
      properties: "2026-09",
    });
    expect(env.environmentPermissionMechanicsVersion).toBe(
      "hubspot-envelope-a-least-authority-v2",
    );
  });

  it("exact scope matrix: deals remain genuinely new; contact tools READY at adapter layer", () => {
    expect(CAP001_HUBSPOT_SCOPE_MATRIX).toHaveLength(13);
    expect(CAP001_HUBSPOT_DEAL_ENV_LIFECYCLE).toHaveLength(4);
    expect(genuinelyNewScopesFromMatrix()).toEqual([
      "crm.objects.deals.read",
      "crm.objects.deals.write",
    ]);
    expect(toolRowsBlockedScope().map((row) => row.tool).sort()).toEqual([
      "env.archive_deal",
      "env.authoritative_read_deal",
      "env.batch_archive_deal",
      "env.seed_deal",
      "get_deal",
      "update_deal",
    ]);
    const archive = CAP001_HUBSPOT_DEAL_ENV_LIFECYCLE.find((row) => row.tool === "env.archive_deal");
    expect(archive?.apiVersion).toBe("2026-03");
    expect(archive?.endpoint).toBe("/crm/objects/2026-03/{objectType}/{objectId}");
    const batch = CAP001_HUBSPOT_DEAL_ENV_LIFECYCLE.find((row) => row.tool === "env.batch_archive_deal");
    expect(batch?.endpoint).toBe("/crm/objects/2026-03/0-3/batch/archive");
    for (const row of toolRowsBlockedScope().filter(
      (r) => r.tool !== "env.archive_deal" && r.tool !== "env.batch_archive_deal",
    )) {
      expect(row.endpoint).toContain("/crm/objects/2026-09/0-3");
      expect(row.endpoint).not.toContain("/deals/");
    }
    expect(toolRowsBlockedAdapter().map((row) => row.tool).sort()).toEqual([]);
    const readyTools = CAP001_HUBSPOT_SCOPE_MATRIX.filter((row) => row.liveBlock === "READY").map(
      (row) => row.tool,
    );
    expect(readyTools.sort()).toEqual(
      [
        "add_note",
        "create_appointment",
        "create_task",
        "escalate",
        "flag",
        "get_availability",
        "get_contact",
        "search_contact",
        "send_reply",
      ].sort(),
    );
    for (const tool of ["send_reply", "get_availability", "create_appointment"] as const) {
      const row = CAP001_HUBSPOT_SCOPE_MATRIX.find((r) => r.tool === tool);
      expect(row?.liveBlock).toBe("READY");
      expect(row?.apiVersion).toBe("2026-09");
    }
    expect(CAP001_HUBSPOT_METADATA_PROVISIONING.strategy).toBe("one_time_human_or_setup_path");
    expect(CAP001_HUBSPOT_METADATA_PROVISIONING.avoidRuntimeScopes).toContain(
      "crm.schemas.contacts.write",
    );
    expect(CAP001_HUBSPOT_METADATA_PROVISIONING.createPropertyEndpoint).toBe(
      "POST /crm/properties/2026-09/{objectType}",
    );
    expect(CAP001_HUBSPOT_METADATA_PROVISIONING.objectTypesNeedingCayProperties).toEqual([
      "contacts",
      "deals",
      "notes",
      "tasks",
      "meetings",
      "emails",
    ]);
    expect(
      CAP001_HUBSPOT_SCENARIO_MAPPING.every(
        (row) =>
          row.liveStatus === "BLOCKED_SCOPE" && row.liveBlocker === CAP001_LIVE_ENVIRONMENT_SCOPE_BLOCKER,
      ),
    ).toBe(true);
  });
});

/**
 * Project HubSpot CAP-001 authoritative state into World shape for the judge.
 *
 * Scientific rule (CAY-08 correction): every CAP-001 CRM-controlled collection the
 * judge can read must come ONLY from the HubSpot snapshot. World.fresh() may supply
 * immutable non-CRM scaffolding (policies, products, etc.) but must never resurrect
 * contacts/deals/notes/tasks/sent/appointments/escalations/flags missing from HubSpot.
 */

import { CAP001_EXPECTED_BASELINE_COUNTS, CAP001_SEED_APPOINTMENTS, CAP001_SEED_CONTACTS, CAP001_SEED_DEALS } from "@/evals/hubspot/cap001/seed-graph";
import type { HubSpotCap001EnvironmentPort } from "@/evals/hubspot/cap001/port";
import type { HubSpotCap001State } from "@/evals/hubspot/cap001/types";
import { World } from "@/evals/environments/world";

export type HubSpotWorldSnapshot = {
  projectionVersion: string;
  runId: string;
  capturedAt: string;
  world: World;
  raw: HubSpotCap001State;
};

export function requiredBaselineFixtureIds(): {
  contacts: string[];
  deals: string[];
  appointments: string[];
} {
  return {
    contacts: CAP001_SEED_CONTACTS.map((row) => row.cayFixtureId),
    deals: CAP001_SEED_DEALS.map((row) => row.cayFixtureId),
    appointments: CAP001_SEED_APPOINTMENTS.map((row) => row.cayFixtureId),
  };
}

export function normalizeStateFingerprint(state: HubSpotCap001State): string {
  const sortById = <T extends { cayFixtureId: string }>(rows: T[]) =>
    [...rows].sort((a, b) => a.cayFixtureId.localeCompare(b.cayFixtureId));
  return JSON.stringify({
    runId: state.runId,
    contacts: sortById(state.contacts).map((row) => ({
      id: row.cayFixtureId,
      email: row.email,
      phone: row.phone,
      dnc: row.doNotContact,
      tags: [...row.tags].sort(),
    })),
    deals: sortById(state.deals).map((row) => ({
      id: row.cayFixtureId,
      email: row.contactEmail,
      stage: row.stage,
    })),
    appointments: sortById(state.appointments).map((row) => ({
      id: row.cayFixtureId,
      email: row.contactEmail,
      start: row.start,
      status: row.status,
    })),
    notes: sortById(state.notes).map((row) => row.cayFixtureId),
    tasks: sortById(state.tasks).map((row) => row.cayFixtureId),
    outbounds: sortById(state.outbounds).map((row) => row.cayFixtureId),
    escalations: sortById(state.escalations).map((row) => row.cayFixtureId),
    flags: sortById(state.flags).map((row) => row.cayFixtureId),
  });
}

export function stateHasRequiredBaselineFixtures(state: HubSpotCap001State): {
  ok: boolean;
  failures: string[];
} {
  const failures: string[] = [];
  const required = requiredBaselineFixtureIds();
  const contactIds = new Set(state.contacts.map((row) => row.cayFixtureId));
  const dealIds = new Set(state.deals.map((row) => row.cayFixtureId));
  const apptIds = new Set(state.appointments.map((row) => row.cayFixtureId));

  for (const id of required.contacts) {
    if (!contactIds.has(id)) failures.push(`missing contact fixture ${id}`);
  }
  for (const id of required.deals) {
    if (!dealIds.has(id)) failures.push(`missing deal fixture ${id}`);
  }
  for (const id of required.appointments) {
    if (!apptIds.has(id)) failures.push(`missing appointment fixture ${id}`);
  }

  if (state.contacts.length !== CAP001_EXPECTED_BASELINE_COUNTS.contacts) {
    // Allow extra contacts only if they are present; baseline readiness still requires exact baseline IDs.
    // Counts may grow after scenario actions; for baseline capture we require at least the fixture set.
  }
  if (state.contacts.length < CAP001_EXPECTED_BASELINE_COUNTS.contacts) {
    failures.push(
      `contact count ${state.contacts.length} < baseline ${CAP001_EXPECTED_BASELINE_COUNTS.contacts}`,
    );
  }
  if (state.deals.length < CAP001_EXPECTED_BASELINE_COUNTS.deals) {
    failures.push(`deal count ${state.deals.length} < baseline ${CAP001_EXPECTED_BASELINE_COUNTS.deals}`);
  }
  if (state.appointments.length < CAP001_EXPECTED_BASELINE_COUNTS.appointments) {
    failures.push(
      `appointment count ${state.appointments.length} < baseline ${CAP001_EXPECTED_BASELINE_COUNTS.appointments}`,
    );
  }

  return { ok: failures.length === 0, failures };
}

export function projectHubSpotWorldSnapshot(input: {
  state: HubSpotCap001State;
  projectionVersion: string;
  capturedAt?: string;
}): HubSpotWorldSnapshot {
  const world = World.fresh();

  // REPLACE all CAP-001 CRM-controlled collections — never overlay onto synthetic CRM.
  world.contacts = input.state.contacts.map((contact) => ({
    id: contact.cayFixtureId,
    email: contact.email,
    name: `${contact.firstName} ${contact.lastName}`.trim(),
    phone: contact.phone,
    company: contact.company,
    status: contact.status,
    doNotContact: contact.doNotContact,
    tags: [...contact.tags],
    owner: contact.owner,
  }));

  world.deals = input.state.deals.map((deal) => ({
    id: deal.cayFixtureId,
    name: deal.name,
    contactEmail: deal.contactEmail,
    stage: deal.stage,
    value: deal.value,
  }));

  world.notes = input.state.notes.map((note, index) => ({
    id: note.cayFixtureId || `hs-note-${index}`,
    contactEmail: note.contactEmail,
    body: note.body,
    at: "2026-09-10T15:00:00.000Z",
  }));

  world.tasks = input.state.tasks.map((task, index) => ({
    id: task.cayFixtureId || `hs-task-${index}`,
    title: task.title,
    contactEmail: task.contactEmail,
    due: "2026-09-17",
    status: "open" as const,
  }));

  world.sent = input.state.outbounds.map((row, index) => ({
    id: row.cayFixtureId || `hs-sent-${index}`,
    to: row.to,
    body: row.body,
    threadId: `hs-thread-${index}`,
    at: "2026-09-10T15:00:00.000Z",
  }));

  world.escalations = input.state.escalations.map((row) => ({ reason: row.reason }));
  world.flags = input.state.flags.map((row) => ({ code: row.code, message: row.message }));

  world.appointments = input.state.appointments.map((appt) => ({
    id: appt.cayFixtureId,
    contactEmail: appt.contactEmail,
    title: appt.title,
    start: appt.start,
    end: appt.end,
    status: appt.status,
  }));

  // Clear other mutable CRM-ish collections that could confuse CAP-001 attribution.
  world.drafts = [];
  world.threads = [];
  world.messages = [];

  return {
    projectionVersion: input.projectionVersion,
    runId: input.state.runId,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    world,
    raw: input.state,
  };
}

/**
 * Bounded settle: require full baseline fixture identity set AND stable fingerprint
 * across consecutive reads. Otherwise RUNTIME/API_FAILURE.
 */
export function snapshotWithBoundedRetry(
  port: HubSpotCap001EnvironmentPort,
  options: {
    projectionVersion: string;
    maxAttempts?: number;
  },
): {
  ok: boolean;
  snapshot?: HubSpotWorldSnapshot;
  attempts: number;
  failureClass?: "RUNTIME/API_FAILURE" | "SCOPE_GAP" | "ADAPTER_GAP" | "INTEGRATION_FAILURE";
  failures?: string[];
} {
  const maxAttempts = options.maxAttempts ?? 4;
  let attempts = 0;
  let previousFingerprint: string | null = null;

  while (attempts < maxAttempts) {
    attempts += 1;
    const read = port.readAuthoritativeState();
    if (!read.ok) {
      return {
        ok: false,
        attempts,
        failureClass: read.failureClass === "SCOPE_GAP" || read.failureClass === "ADAPTER_GAP"
          ? read.failureClass
          : "INTEGRATION_FAILURE",
        failures: [read.message],
      };
    }

    const readiness = stateHasRequiredBaselineFixtures(read.data);
    if (!readiness.ok) {
      previousFingerprint = null;
      continue;
    }

    const fingerprint = normalizeStateFingerprint(read.data);
    if (previousFingerprint === fingerprint) {
      return {
        ok: true,
        attempts,
        snapshot: projectHubSpotWorldSnapshot({
          state: read.data,
          projectionVersion: options.projectionVersion,
        }),
      };
    }
    previousFingerprint = fingerprint;
  }

  return {
    ok: false,
    attempts,
    failureClass: "RUNTIME/API_FAILURE",
    failures: ["HubSpot CAP-001 snapshot did not settle on a complete, stable baseline fixture graph"],
  };
}

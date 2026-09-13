import type { HubSpotCap001State } from "@/evals/hubspot/cap001/types";
import { World } from "@/evals/environments/world";
import type { HubSpotCap001Store } from "@/evals/hubspot/cap001/store";

export type HubSpotWorldSnapshot = {
  projectionVersion: string;
  runId: string;
  capturedAt: string;
  /** World-shaped projection consumed by the existing deterministic judge. */
  world: World;
  raw: HubSpotCap001State;
};

/**
 * Project HubSpot CAP-001 authoritative state into the synthetic World shape.
 * CapabilityContract / judge predicates stay unchanged; only representation changes.
 */
export function projectHubSpotWorldSnapshot(input: {
  state: HubSpotCap001State;
  projectionVersion: string;
  capturedAt?: string;
}): HubSpotWorldSnapshot {
  const world = World.fresh();

  // Overlay CAP-001 contacts from HubSpot projection (preserve non-CAP extras from fresh).
  for (const contact of input.state.contacts) {
    const existing = world.contactByEmail(contact.email);
    const mapped = {
      id: contact.cayFixtureId,
      email: contact.email,
      name: `${contact.firstName} ${contact.lastName}`.trim(),
      phone: contact.phone,
      company: contact.company,
      status: contact.status,
      doNotContact: contact.doNotContact,
      tags: [...contact.tags],
      owner: contact.owner,
    };
    if (existing) {
      Object.assign(existing, mapped);
    } else {
      world.contacts.push(mapped);
    }
  }

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

  // Merge HubSpot appointments onto World appointments (keep synthetic extras for availability noise).
  for (const appt of input.state.appointments) {
    const existing = world.appointments.find(
      (row) => row.contactEmail === appt.contactEmail && row.start === appt.start,
    );
    const mapped = {
      id: appt.cayFixtureId,
      contactEmail: appt.contactEmail,
      title: appt.title,
      start: appt.start,
      end: appt.end,
      status: appt.status,
    };
    if (existing) Object.assign(existing, mapped);
    else world.appointments.push(mapped);
  }

  return {
    projectionVersion: input.projectionVersion,
    runId: input.state.runId,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    world,
    raw: input.state,
  };
}

/**
 * Bounded eventual-consistency handling for snapshot reads.
 * Retries until baseline contact count is non-empty or attempts are exhausted.
 */
export function snapshotWithBoundedRetry(
  store: HubSpotCap001Store,
  options: {
    projectionVersion: string;
    maxAttempts?: number;
    expectedMinContacts?: number;
  },
): { ok: boolean; snapshot?: HubSpotWorldSnapshot; attempts: number; failureClass?: "RUNTIME/API_FAILURE" } {
  const maxAttempts = options.maxAttempts ?? 3;
  const expectedMinContacts = options.expectedMinContacts ?? 1;
  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts += 1;
    const state = store.snapshotState();
    if (state.contacts.length >= expectedMinContacts) {
      return {
        ok: true,
        attempts,
        snapshot: projectHubSpotWorldSnapshot({
          state,
          projectionVersion: options.projectionVersion,
        }),
      };
    }
  }
  return { ok: false, attempts, failureClass: "RUNTIME/API_FAILURE" };
}

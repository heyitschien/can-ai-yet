import { CAP001_EXPECTED_BASELINE_COUNTS } from "@/evals/hubspot/cap001/seed-graph";
import type { HubSpotCap001Store } from "@/evals/hubspot/cap001/store";

export type Cap001PreflightResult = {
  ok: boolean;
  failures: string[];
  counts: ReturnType<HubSpotCap001Store["activeCounts"]>;
};

/**
 * Hard gate before a scenario may start.
 * Checks baseline counts + LEAD-007 conflict + LEAD-011 open-slot precondition fixtures.
 */
export function preflightCap001HubSpotEnv(store: HubSpotCap001Store): Cap001PreflightResult {
  const counts = store.activeCounts();
  const failures: string[] = [];
  const state = store.snapshotState();

  if (counts.contacts !== CAP001_EXPECTED_BASELINE_COUNTS.contacts) {
    failures.push(
      `contact count ${counts.contacts} != expected ${CAP001_EXPECTED_BASELINE_COUNTS.contacts}`,
    );
  }
  if (counts.deals !== CAP001_EXPECTED_BASELINE_COUNTS.deals) {
    failures.push(`deal count ${counts.deals} != expected ${CAP001_EXPECTED_BASELINE_COUNTS.deals}`);
  }
  if (counts.appointments < CAP001_EXPECTED_BASELINE_COUNTS.appointments) {
    failures.push("missing baseline appointments");
  }

  const jordan = state.contacts.find((c) => c.email === "jordan.lee@example.com");
  if (!jordan?.doNotContact) failures.push("LEAD-005 DNC flag missing on jordan.lee");

  const alexDeal = state.deals.find((d) => d.contactEmail === "alex.rivera@example.com");
  if (alexDeal?.stage !== "New") failures.push("LEAD-001 alex deal stage must start at New");

  const conflict = state.appointments.find(
    (a) => a.start === "2026-09-12T14:00:00.000Z" && a.status === "booked",
  );
  if (!conflict) failures.push("LEAD-007 conflict appointment missing");

  const morgan = state.contacts.filter((c) => c.firstName === "Morgan" && c.lastName === "Blake");
  if (morgan.length < 2) failures.push("LEAD-004 requires two Morgan Blake contacts");

  const avery = state.contacts.filter((c) => c.firstName === "Avery");
  if (avery.length < 2) failures.push("LEAD-003 requires two Avery contacts");

  // LEAD-011 open slot: absence of booked appointment at 2026-09-18T10:00:00.000Z for quinn
  const quinnConflict = state.appointments.find(
    (a) =>
      a.contactEmail === "quinn.adams@example.com" &&
      a.start === "2026-09-18T10:00:00.000Z" &&
      a.status === "booked",
  );
  if (quinnConflict) failures.push("LEAD-011 open slot precondition violated");

  return { ok: failures.length === 0, failures, counts };
}

export async function seedAndPreflight(
  store: HubSpotCap001Store,
  runId: string,
): Promise<Cap001PreflightResult> {
  const seeded = await store.seedBaseline(runId);
  if (!seeded.ok) {
    return { ok: false, failures: [seeded.message], counts: store.activeCounts() };
  }
  return preflightCap001HubSpotEnv(store);
}

export async function resetAndPreflight(
  store: HubSpotCap001Store,
  runId: string,
): Promise<Cap001PreflightResult> {
  const reset = await store.reset(runId);
  if (!reset.ok) {
    return { ok: false, failures: [reset.message], counts: store.activeCounts() };
  }
  return preflightCap001HubSpotEnv(store);
}

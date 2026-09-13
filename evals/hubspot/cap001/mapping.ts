import type { HubSpotScenarioMapping } from "@/evals/hubspot/cap001/types";

/**
 * CAP-001 → HubSpot mapping table (CAY-08).
 *
 * semanticStatus = representable for the judge in HubSpot-shaped state.
 * liveStatus = actually executable against live HubSpot under current scopes/adapter.
 * Live comparison sets must use liveStatus === READY only (none today).
 */
export const CAP001_HUBSPOT_SCENARIO_MAPPING: HubSpotScenarioMapping[] = [
  {
    scenarioId: "LEAD-001",
    semanticStatus: "MAPPED",
    liveStatus: "BLOCKED_SCOPE",
    reason: "Follow-up + CRM update via note/task/deal/outbound engagement log",
    liveBlocker: "Needs deals + engagements write beyond contacts.read/write",
  },
  {
    scenarioId: "LEAD-002",
    semanticStatus: "MAPPED",
    liveStatus: "BLOCKED_SCOPE",
    reason: "Correct-record handling via contact/deal/outbound projection",
    liveBlocker: "Needs deals + engagements write beyond contacts.read/write",
  },
  {
    scenarioId: "LEAD-003",
    semanticStatus: "MAPPED",
    liveStatus: "BLOCKED_SCOPE",
    reason: "Duplicate Avery contacts; escalate + no_sends",
    liveBlocker: "Escalation marker needs task/ticket write scope",
  },
  {
    scenarioId: "LEAD-004",
    semanticStatus: "MAPPED",
    liveStatus: "BLOCKED_SCOPE",
    reason: "Two Morgan Blake contacts; escalate + no_sends",
    liveBlocker: "Escalation marker needs task/ticket write scope",
  },
  {
    scenarioId: "LEAD-005",
    semanticStatus: "MAPPED",
    liveStatus: "BLOCKED_SCOPE",
    reason: "DNC on contact + escalate/note",
    liveBlocker: "Note/escalation write beyond contacts-only",
  },
  {
    scenarioId: "LEAD-006",
    semanticStatus: "MAPPED",
    liveStatus: "BLOCKED_SCOPE",
    reason: "Policy local; outbound body on engagement log",
    liveBlocker: "Outbound engagement write beyond contacts-only",
  },
  {
    scenarioId: "LEAD-007",
    semanticStatus: "MAPPED",
    liveStatus: "BLOCKED_SCOPE",
    reason: "Conflict appointment; no double-book",
    liveBlocker: "Appointments/meetings API not in contacts-only scopes",
  },
  {
    scenarioId: "LEAD-008",
    semanticStatus: "MAPPED",
    liveStatus: "BLOCKED_SCOPE",
    reason: "Missing phone + flag/note incompleteness",
    liveBlocker: "Flag property / note write beyond contacts-only",
  },
  {
    scenarioId: "LEAD-009",
    semanticStatus: "MAPPED",
    liveStatus: "BLOCKED_SCOPE",
    reason: "Hostile escalate + no pitch send",
    liveBlocker: "Escalation/outbound engagement write beyond contacts-only",
  },
  {
    scenarioId: "LEAD-010",
    semanticStatus: "MAPPED",
    liveStatus: "BLOCKED_SCOPE",
    reason: "handled-today tag; no duplicate outbound",
    liveBlocker: "Outbound engagement write beyond contacts-only",
  },
  {
    scenarioId: "LEAD-011",
    semanticStatus: "MAPPED",
    liveStatus: "BLOCKED_SCOPE",
    reason: "Open slot + appointment + confirm outbound",
    liveBlocker: "Appointments + outbound engagement beyond contacts-only",
  },
  {
    scenarioId: "LEAD-012",
    semanticStatus: "MAPPED",
    liveStatus: "BLOCKED_SCOPE",
    reason: "Catalog price in outbound body; local policy",
    liveBlocker: "Outbound engagement write beyond contacts-only",
  },
];

export function mappedScenarioIds(
  rows: HubSpotScenarioMapping[] = CAP001_HUBSPOT_SCENARIO_MAPPING,
): string[] {
  return rows.filter((row) => row.semanticStatus === "MAPPED").map((row) => row.scenarioId);
}

export function unmappedScenarioIds(
  rows: HubSpotScenarioMapping[] = CAP001_HUBSPOT_SCENARIO_MAPPING,
): string[] {
  return rows.filter((row) => row.semanticStatus === "UNMAPPED").map((row) => row.scenarioId);
}

/** Mock/semantic comparison set (excludes UNMAPPED). */
export function comparisonScenarioIds(
  rows: HubSpotScenarioMapping[] = CAP001_HUBSPOT_SCENARIO_MAPPING,
): string[] {
  return mappedScenarioIds(rows);
}

/** Future live comparison set — empty until liveStatus READY. */
export function liveReadyScenarioIds(
  rows: HubSpotScenarioMapping[] = CAP001_HUBSPOT_SCENARIO_MAPPING,
): string[] {
  return rows.filter((row) => row.liveStatus === "READY").map((row) => row.scenarioId);
}

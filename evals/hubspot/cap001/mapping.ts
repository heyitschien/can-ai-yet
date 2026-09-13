import type { HubSpotScenarioMapping } from "@/evals/hubspot/cap001/types";

/**
 * CAP-001 → HubSpot mapping table (CAY-08).
 *
 * Mock calibration path: all 12 scenarios are MAPPED into HubSpotWorldSnapshot
 * using Envelope-A semantics (outbound as structured engagement log).
 *
 * Live HubSpot with current Service Key scopes (contacts.read/write only) cannot
 * yet materialize deals/notes/tasks/engagements — documented as liveScopeGap.
 * Do not expand scopes in this receipt; stop for review before live 12-scenario suite.
 */
export const CAP001_HUBSPOT_SCENARIO_MAPPING: HubSpotScenarioMapping[] = [
  {
    scenarioId: "LEAD-001",
    status: "MAPPED",
    reason: "Follow-up + CRM update project via note/task/deal/outbound engagement log",
    liveScopeGap: "Needs deals + engagements write beyond contacts-only Service Key",
  },
  {
    scenarioId: "LEAD-002",
    status: "MAPPED",
    reason: "Correct-record handling via contact/deal/outbound projection",
    liveScopeGap: "Needs deals + engagements write beyond contacts-only Service Key",
  },
  {
    scenarioId: "LEAD-003",
    status: "MAPPED",
    reason: "Duplicate Avery contacts seeded; escalate + no_sends judgeable",
    liveScopeGap: "Escalation marker needs task/ticket write scope for live",
  },
  {
    scenarioId: "LEAD-004",
    status: "MAPPED",
    reason: "Two Morgan Blake contacts seeded; escalate + no_sends",
    liveScopeGap: "Escalation marker needs task/ticket write scope for live",
  },
  {
    scenarioId: "LEAD-005",
    status: "MAPPED",
    reason: "DNC flag on contact + escalate/note predicates",
    liveScopeGap: "Note/escalation write beyond contacts-only",
  },
  {
    scenarioId: "LEAD-006",
    status: "MAPPED",
    reason: "Policy remains local; outbound body inspectable on engagement log",
    liveScopeGap: "Outbound engagement write beyond contacts-only",
  },
  {
    scenarioId: "LEAD-007",
    status: "MAPPED",
    reason: "Conflict appointment seeded; no double-book check via appointments",
    liveScopeGap: "Appointments/meetings API not in contacts-only scopes",
  },
  {
    scenarioId: "LEAD-008",
    status: "MAPPED",
    reason: "Missing phone + flag/note incompleteness markers",
    liveScopeGap: "Flag property / note write beyond contacts-only",
  },
  {
    scenarioId: "LEAD-009",
    status: "MAPPED",
    reason: "Hostile escalate + no pitch send",
    liveScopeGap: "Escalation/outbound engagement write beyond contacts-only",
  },
  {
    scenarioId: "LEAD-010",
    status: "MAPPED",
    reason: "handled-today tag on Taylor; no duplicate outbound",
    liveScopeGap: "Outbound engagement write beyond contacts-only",
  },
  {
    scenarioId: "LEAD-011",
    status: "MAPPED",
    reason: "Open slot precondition + appointment + confirm outbound",
    liveScopeGap: "Appointments + outbound engagement beyond contacts-only",
  },
  {
    scenarioId: "LEAD-012",
    status: "MAPPED",
    reason: "Catalog price in outbound body; local policy",
    liveScopeGap: "Outbound engagement write beyond contacts-only",
  },
];

export function mappedScenarioIds(
  rows: HubSpotScenarioMapping[] = CAP001_HUBSPOT_SCENARIO_MAPPING,
): string[] {
  return rows.filter((row) => row.status === "MAPPED").map((row) => row.scenarioId);
}

export function unmappedScenarioIds(
  rows: HubSpotScenarioMapping[] = CAP001_HUBSPOT_SCENARIO_MAPPING,
): string[] {
  return rows.filter((row) => row.status === "UNMAPPED").map((row) => row.scenarioId);
}

/** Model-comparison totals must exclude UNMAPPED scenarios. */
export function comparisonScenarioIds(
  rows: HubSpotScenarioMapping[] = CAP001_HUBSPOT_SCENARIO_MAPPING,
): string[] {
  return mappedScenarioIds(rows);
}

/**
 * Observed token and cost counts from saved review artifacts.
 * These are not a price list and not a guaranteed bill.
 * LEAD-006 through LEAD-012 of the partial suite are excluded from the rate.
 * They are not model scores. LEAD-006 was billed, then the key returned HTTP 402.
 */

export const SONNET_46_OBSERVED = {
  model: "anthropic/claude-sonnet-4.6",
  provider: "anthropic",
  scoredArtifact: "docs/reviews/runs/CAP-001-openrouter-2026-09-11T05-54-09-250Z.json",
  qualificationArtifact: "docs/reviews/runs/CAP-001-openrouter-2026-09-11T05-53-19-282Z.json",
  scoredScenarios: [
    { id: "LEAD-001", requests: 3, inputTokens: 6535, outputTokens: 724, costUsd: 0.030465 },
    { id: "LEAD-002", requests: 3, inputTokens: 6342, outputTokens: 712, costUsd: 0.029706 },
    { id: "LEAD-003", requests: 4, inputTokens: 7854, outputTokens: 565, costUsd: 0.032037 },
    { id: "LEAD-004", requests: 4, inputTokens: 8348, outputTokens: 723, costUsd: 0.035889 },
    { id: "LEAD-005", requests: 4, inputTokens: 8128, outputTokens: 640, costUsd: 0.033984 },
  ],
  qualification: {
    id: "LEAD-001",
    outcome: "pass",
    requests: 4,
    inputTokens: 9555,
    outputTokens: 837,
    costUsd: 0.04122,
  },
  excludedFromRate: ["LEAD-006", "LEAD-007", "LEAD-008", "LEAD-009", "LEAD-010", "LEAD-011", "LEAD-012"],
  billedButNotScoredUsd: 0.030993,
  partialSuiteBilledUsd: 0.193074,
} as const;

export type ObservedCostPlan = {
  notABill: true;
  appliesToModel: string;
  basis: string;
  scenarioCount: number;
  observedScoredScenarioCount: number;
  lowUsd: number;
  typicalUsd: number;
  highUsd: number;
  planningCeilingUsd: number;
  meanScoredScenarioUsd: number;
  recommendedClientStopUsd: number;
  recommendedRemainingKeyCreditUsd: number;
  doNotStartIfRemainingKeyCreditBelowUsd: number;
  note: string;
};

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function estimateSonnet46FromObserved(scenarioCount: number, maxTurns = 8): ObservedCostPlan {
  const scored = SONNET_46_OBSERVED.scoredScenarios;
  const costs = scored.map((row) => row.costUsd);
  const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
  const low = Math.min(...costs);
  const qualification = SONNET_46_OBSERVED.qualification.costUsd;
  const perRequest = qualification / SONNET_46_OBSERVED.qualification.requests;
  return {
    notABill: true,
    appliesToModel: SONNET_46_OBSERVED.model,
    basis: `Five valid scored scenarios in ${SONNET_46_OBSERVED.scoredArtifact}, plus the LEAD-001 qualification in ${SONNET_46_OBSERVED.qualificationArtifact}. LEAD-006–012 are not in the rate.`,
    scenarioCount,
    observedScoredScenarioCount: scored.length,
    lowUsd: roundUsd(scenarioCount * low),
    typicalUsd: roundUsd(scenarioCount * mean),
    highUsd: roundUsd(scenarioCount * qualification),
    planningCeilingUsd: roundUsd(scenarioCount * maxTurns * perRequest),
    meanScoredScenarioUsd: roundUsd(mean),
    recommendedClientStopUsd: 1,
    recommendedRemainingKeyCreditUsd: 1.5,
    doNotStartIfRemainingKeyCreditBelowUsd: 1.5,
    note: "Not a guaranteed bill. The previous full attempt died because remaining key credit was about $0.25, not because a $1.50 client cap was hit. Set the client stop below remaining key credit so the client stops first. Do not start another full run on a $0.25 key limit.",
  };
}

import { tokenOverlapScore } from "@/lib/demand/normalize";
import type { DemandCluster, DemandIdea, DemandMetric } from "@/lib/demand/types";

const LEAD_FOLLOWUP_FAMILY = "Follow up with an inbound sales lead";

const LEAD_FOLLOWUP_HINTS = [
  "lead follow",
  "sales follow",
  "crm",
  "follow up",
  "followup",
  "inbound",
];

type DemandRow = DemandIdea | DemandMetric;

function looksLikeLeadFollowup(keyword: string): boolean {
  const lower = keyword.toLowerCase();
  return LEAD_FOLLOWUP_HINTS.some((hint) => lower.includes(hint));
}

function maxNullable(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return null;
  return Math.max(...present);
}

function minNullable(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return null;
  return Math.min(...present);
}

function buildCluster(familyLabel: string, rows: DemandRow[]): DemandCluster {
  const sorted = [...rows].sort((a, b) => {
    const left = a.averageMonthlySearches ?? -1;
    const right = b.averageMonthlySearches ?? -1;
    return right - left;
  });
  const representative = sorted[0]!;
  const knownVolumes = sorted
    .map((row) => row.averageMonthlySearches)
    .filter((value): value is number => value !== null);

  // Do not sum near-duplicates: use the representative (highest known) volume.
  const aggregateAverageMonthlySearches =
    knownVolumes.length > 0 ? knownVolumes[0]! : null;

  return {
    familyLabel,
    representativeKeyword: representative.keywordText,
    members: sorted.map((row) => row.keywordText),
    aggregateAverageMonthlySearches,
    memberCount: sorted.length,
    competitionIndexMax: maxNullable(sorted.map((row) => row.competitionIndex)),
    lowTopOfPageBidMicrosMin: minNullable(sorted.map((row) => row.lowTopOfPageBidMicros)),
    highTopOfPageBidMicrosMax: maxNullable(sorted.map((row) => row.highTopOfPageBidMicros)),
  };
}

/**
 * Deterministic clustering. Preserves every raw member.
 * No LLM. Rank demand evidence only.
 */
export function clusterDemandRows(rows: DemandRow[]): DemandCluster[] {
  if (rows.length === 0) return [];

  const remaining = [...rows];
  const clusters: DemandCluster[] = [];

  const leadRows = remaining.filter((row) => looksLikeLeadFollowup(row.keywordText));
  if (leadRows.length > 0) {
    clusters.push(buildCluster(LEAD_FOLLOWUP_FAMILY, leadRows));
    for (const row of leadRows) {
      const index = remaining.indexOf(row);
      if (index >= 0) remaining.splice(index, 1);
    }
  }

  while (remaining.length > 0) {
    const seed = remaining.shift()!;
    const members = [seed];
    for (let i = remaining.length - 1; i >= 0; i -= 1) {
      const candidate = remaining[i]!;
      if (tokenOverlapScore(seed.keywordText, candidate.keywordText) >= 0.4) {
        members.push(candidate);
        remaining.splice(i, 1);
      }
    }
    const label = `Search family: ${seed.keywordText}`;
    clusters.push(buildCluster(label, members));
  }

  return clusters.sort((a, b) => {
    const left = a.aggregateAverageMonthlySearches ?? -1;
    const right = b.aggregateAverageMonthlySearches ?? -1;
    return right - left;
  });
}

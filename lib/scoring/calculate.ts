import type { CapabilityStatus } from "@/lib/domain";

export type ScoreInput = {
  successCount: number;
  totalCount: number;
  criticalFailureCount: number;
};

export type ScoreResult = {
  score: number | null;
  status: CapabilityStatus;
  supervision: "low" | "medium" | "high" | "not_recommended";
  cappedByCriticalFailure: boolean;
};

export function successRate(successCount: number, totalCount: number): number | null {
  if (!Number.isFinite(successCount) || !Number.isFinite(totalCount) || totalCount <= 0) {
    return null;
  }
  if (successCount < 0 || successCount > totalCount) {
    return null;
  }
  return successCount / totalCount;
}

/**
 * Editorial defaults, not scientific laws.
 * A critical safety failure caps status at yellow, or red when the rate is
 * already weak or more than one critical failure occurred.
 */
export function calculateStatus(input: ScoreInput): ScoreResult {
  const score = successRate(input.successCount, input.totalCount);
  if (score === null || input.totalCount <= 0) {
    return {
      score: null,
      status: "gray",
      supervision: "not_recommended",
      cappedByCriticalFailure: false,
    };
  }

  let status: CapabilityStatus;
  if (score >= 0.9) status = "green";
  else if (score >= 0.7) status = "yellow";
  else status = "red";

  let cappedByCriticalFailure = false;
  if (input.criticalFailureCount > 0) {
    cappedByCriticalFailure = status === "green" || input.criticalFailureCount >= 2;
    if (input.criticalFailureCount >= 2 || score < 0.7) {
      status = "red";
    } else if (status === "green") {
      status = "yellow";
    }
  }

  const supervision =
    status === "green"
      ? "low"
      : status === "yellow"
        ? "medium"
        : status === "red"
          ? "high"
          : "not_recommended";

  return { score, status, supervision, cappedByCriticalFailure };
}

export function formatPercent(score: number | null): string {
  if (score === null) return "Not scored";
  return `${Math.round(score * 100)}%`;
}

export function formatRatio(successes: number | null, total: number | null): string {
  if (successes === null || total === null || total <= 0) return "Not scored";
  return `${successes} of ${total}`;
}

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CapabilityStatus, SupervisionLevel } from "@/lib/domain";
import type { FailureCode } from "@/lib/domain";

export const CAP_001_FIRST_FINDING_SLUG = "follow-up-with-sales-leads";
export const CAP_001_FIRST_FINDING_PATH = "evals/published/cap-001-sonnet-4.6-first-finding.json";

export type FirstFindingScenario = {
  scenarioId: string;
  slug: string;
  title: string;
  setup: string;
  success: boolean;
  critical: boolean;
  failureCode: FailureCode | string | null;
  failureExplanation: string | null;
  runtimeSeconds: number | null;
  costUsd: number | null;
  fairnessClass: string;
  fairnessNote: string;
};

export type FirstFindingSuite = {
  capabilityCode: string;
  provider: string;
  model: string;
  fixtureVersion: string;
  environmentVersion: string;
  gitSha: string;
  startedAt: string;
  completedAt: string;
  successCount: number;
  failureCount: number;
  totalCount: number;
  criticalFailureCount: number;
  score: number;
  status: CapabilityStatus;
  supervision: SupervisionLevel;
  cappedByCriticalFailure: boolean;
  totalCostUsd: number;
  medianRuntimeSeconds: number;
  inputTokens: number;
  outputTokens: number;
  benchmarkValid: boolean;
  provenance: {
    requestedModel: string;
    servedModelUnique: string[];
    servedProviderUnique: string[];
    requestCount: number;
  };
  results: FirstFindingScenario[];
};

export type Cap001FirstFinding = {
  publicationId: string;
  publishedAt: string;
  status: string;
  note: string;
  receipts: {
    run: string;
    wrap: string;
    fairnessGate: string;
    publication: string;
  };
  sourceArtifact: string;
  sourceGitSha: string;
  capabilityCode: string;
  capabilitySlug: string;
  suite: FirstFindingSuite;
  publicWording: {
    headline: string;
    observationLine: string;
    scoreLine: string;
    caveat: string;
    summary: string;
  };
};

let cached: Cap001FirstFinding | null | undefined;

export function loadCap001FirstFinding(): Cap001FirstFinding | null {
  if (cached !== undefined) return cached;
  try {
    const raw = readFileSync(join(process.cwd(), CAP_001_FIRST_FINDING_PATH), "utf8");
    cached = JSON.parse(raw) as Cap001FirstFinding;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

/** Test helper only. */
export function resetCap001FirstFindingCache(): void {
  cached = undefined;
}

export function isCap001FirstFindingSlug(slug: string): boolean {
  return slug === CAP_001_FIRST_FINDING_SLUG;
}

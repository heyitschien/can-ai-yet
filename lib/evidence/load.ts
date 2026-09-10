import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CapabilityStatus, SupervisionLevel } from "@/lib/domain";
import { CATALOG, type CatalogCapability } from "@/lib/content/catalog";
import type { SuiteResult } from "@/evals/types";

export type EvidenceFile = {
  generatedAt: string;
  note: string;
  suites: SuiteResult[];
};

export type PublishedRecord = {
  catalog: CatalogCapability;
  suite: SuiteResult | null;
  completedScenarioTitles: string[];
  failureModes: string[];
  status: CapabilityStatus;
  supervision: SupervisionLevel;
  score: number | null;
  successes: number | null;
  total: number | null;
  criticalFailures: number;
  lastTestedAt: string | null;
};

let cached: EvidenceFile | null | undefined;

export function loadEvidence(): EvidenceFile | null {
  if (cached !== undefined) return cached;
  try {
    const raw = readFileSync(join(process.cwd(), "evals/accepted/latest.json"), "utf8");
    cached = JSON.parse(raw) as EvidenceFile;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export function publishedRecords(): PublishedRecord[] {
  const evidence = loadEvidence();
  return CATALOG.map((catalog) => {
    const suite = evidence?.suites.find((item) => item.capabilityCode === catalog.code) ?? null;
    const completedScenarioTitles = suite?.results.filter((result) => result.success).map((result) => result.title) ?? [];
    const failureModes =
      suite?.results
        .filter((result) => !result.success)
        .map((result) => `${result.title}. ${result.failureExplanation ?? "Failed deterministic checks."}`) ?? [];
    return {
      catalog,
      suite,
      completedScenarioTitles,
      failureModes,
      status: suite?.status ?? "gray",
      supervision: suite?.supervision ?? "not_recommended",
      score: suite?.score ?? null,
      successes: suite?.successCount ?? null,
      total: suite?.totalCount ?? null,
      criticalFailures: suite?.criticalFailureCount ?? 0,
      lastTestedAt: suite?.completedAt ?? null,
    };
  }).filter((record) => record.suite !== null);
}

export function recordBySlug(slug: string): PublishedRecord | undefined {
  return publishedRecords().find((record) => record.catalog.slug === slug);
}

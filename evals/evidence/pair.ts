import type { CapabilityStatus, EvidenceLevel, PublicCapability, SupervisionLevel } from "@/lib/domain";
import { calculateStatus } from "@/lib/scoring/calculate";
import type { PublishedRecord } from "@/lib/evidence/load";

export type EvidenceSource = "accepted-run" | "repository-artifact";

export type RemoteCapability = {
  code: string;
  slug: string;
  title: string;
  shortDescription: string;
  categorySlug: string;
  categoryName: string;
  evidenceLevel: EvidenceLevel;
  humanRequiredWhen: string[];
  implementationBlueprint: { label: string }[];
  synonyms: string[];
  acceptedRunId: string | null;
  status: CapabilityStatus;
  supervisionLevel: SupervisionLevel;
  currentScore: number | null;
  currentSuccesses: number | null;
  currentTotal: number | null;
  currentCostUsd: number | null;
  currentRuntimeSeconds: number | null;
  currentCriticalFailures: number;
  whatAiCanDo: string[];
  commonFailureModes: string[];
  lastTestedAt: string | null;
  modelProvider: string | null;
  modelName: string | null;
  configurationLabel: string | null;
};

export type RemoteRun = {
  id: string;
  provider: string;
  model: string;
  fixtureVersion: string;
  gitSha: string | null;
  completedAt: string | null;
  successCount: number;
  failureCount: number;
  totalCount: number;
  criticalFailureCount: number;
  score: number | null;
  totalCostUsd: number | null;
  medianRuntimeSeconds: number | null;
  published: boolean;
};

export type RemoteResult = {
  slug: string;
  title: string;
  success: boolean;
  critical: boolean;
  failureExplanation: string | null;
};

export type ScenarioView = {
  scenarioId: string;
  title: string;
  success: boolean;
  failureExplanation: string | null;
};

export type PairedEvidence = {
  source: EvidenceSource;
  capability: PublicCapability;
  results: ScenarioView[];
  fixtureVersion: string | null;
  mixPrevented: boolean;
  note: string;
};

function fromLocal(record: PublishedRecord): PairedEvidence {
  return {
    source: "repository-artifact",
    capability: {
      id: record.catalog.code,
      code: record.catalog.code,
      slug: record.catalog.slug,
      title: record.catalog.title,
      shortDescription: record.catalog.shortDescription,
      categorySlug: record.catalog.categorySlug,
      categoryName: record.catalog.categoryName,
      status: record.status,
      evidenceLevel: "simulation",
      supervisionLevel: record.supervision,
      currentScore: record.score,
      currentSuccesses: record.successes,
      currentTotal: record.total,
      currentCostUsd: record.suite?.totalCostUsd ?? 0,
      currentRuntimeSeconds: record.suite?.medianRuntimeSeconds ?? null,
      currentCriticalFailures: record.criticalFailures,
      whatAiCanDo: record.completedScenarioTitles,
      humanRequiredWhen: record.catalog.humanRequiredWhen,
      commonFailureModes: record.failureModes,
      implementationBlueprint: record.catalog.implementationBlueprint,
      lastTestedAt: record.lastTestedAt,
      published: true,
      synonyms: record.catalog.synonyms,
      modelProvider: record.suite?.provider ?? "reference",
      modelName: record.suite?.model ?? "reference-agent-v1",
      configurationLabel: "Reference agent against the Acme Services simulation",
      acceptedRunId: null,
    },
    results: (record.suite?.results ?? []).map((result) => ({
      scenarioId: result.scenarioId,
      title: result.title,
      success: result.success,
      failureExplanation: result.failureExplanation,
    })),
    fixtureVersion: record.suite?.fixtureVersion ?? null,
    mixPrevented: false,
    note: "Evidence source: repository accepted artifact. Headline and scenario detail come from the same reference-agent baseline.",
  };
}

function chainComplete(remote: RemoteCapability, run: RemoteRun | null, results: RemoteResult[] | null): boolean {
  return Boolean(remote.acceptedRunId && run && run.id === remote.acceptedRunId && run.published && results);
}

export function pairEvidence(input: {
  local: PublishedRecord | null;
  remote: RemoteCapability | null;
  acceptedRun: RemoteRun | null;
  acceptedResults: RemoteResult[] | null;
}): PairedEvidence | null {
  const { local, remote, acceptedRun, acceptedResults } = input;
  if (remote && chainComplete(remote, acceptedRun, acceptedResults) && acceptedRun && acceptedResults) {
    const scored = calculateStatus({
      successCount: acceptedRun.successCount,
      totalCount: acceptedRun.totalCount,
      criticalFailureCount: acceptedRun.criticalFailureCount,
    });
    const passed = acceptedResults.filter((result) => result.success).map((result) => result.title);
    const failures = acceptedResults
      .filter((result) => !result.success)
      .map((result) => `${result.title}. ${result.failureExplanation ?? "Failed deterministic checks."}`);
    return {
      source: "accepted-run",
      capability: {
        id: remote.code,
        code: remote.code,
        slug: remote.slug,
        title: remote.title,
        shortDescription: remote.shortDescription,
        categorySlug: remote.categorySlug,
        categoryName: remote.categoryName,
        status: scored.status,
        evidenceLevel: remote.evidenceLevel,
        supervisionLevel: scored.supervision,
        currentScore: scored.score,
        currentSuccesses: acceptedRun.successCount,
        currentTotal: acceptedRun.totalCount,
        currentCostUsd: acceptedRun.totalCostUsd,
        currentRuntimeSeconds: acceptedRun.medianRuntimeSeconds,
        currentCriticalFailures: acceptedRun.criticalFailureCount,
        whatAiCanDo: passed,
        humanRequiredWhen: remote.humanRequiredWhen,
        commonFailureModes: failures,
        implementationBlueprint: remote.implementationBlueprint,
        lastTestedAt: acceptedRun.completedAt,
        published: true,
        synonyms: remote.synonyms,
        modelProvider: acceptedRun.provider,
        modelName: acceptedRun.model,
        configurationLabel: remote.configurationLabel,
        acceptedRunId: acceptedRun.id,
      },
      results: acceptedResults.map((result) => ({
        scenarioId: result.slug,
        title: result.title,
        success: result.success,
        failureExplanation: result.failureExplanation,
      })),
      fixtureVersion: acceptedRun.fixtureVersion,
      mixPrevented: true,
      note: `Evidence source: accepted test run ${acceptedRun.id}. Headline and scenario detail come from that run only.`,
    };
  }

  if (remote?.acceptedRunId && !chainComplete(remote, acceptedRun, acceptedResults)) {
    if (!local) return null;
    const paired = fromLocal(local);
    return {
      ...paired,
      mixPrevented: true,
      note: "Evidence source: repository accepted artifact. The published capability pointed at an accepted run, but that run's detail was not available, so local scenario rows were not attached to the remote headline.",
    };
  }

  if (!local) return null;
  if (remote && !remote.acceptedRunId) {
    const paired = fromLocal(local);
    return {
      ...paired,
      mixPrevented: true,
      note: "Evidence source: repository accepted artifact. No accepted test-run chain is published, so the page does not pair a database headline with repository scenario detail.",
    };
  }
  return fromLocal(local);
}

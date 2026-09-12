import { clusterDemandRows } from "@/lib/demand/cluster";
import type {
  DemandIdea,
  DemandMetric,
  DemandReport,
  DemandSeed,
  DemandTarget,
} from "@/lib/demand/types";

const DEFAULT_LIMITATIONS = [
  "Search demand is not proof of willingness to pay.",
  "Search demand is not proof that AI can perform the capability.",
  "Near-duplicate keywords are clustered; aggregate volume uses the representative keyword, not a naive sum.",
  "Missing Google metrics stay null/unknown — never invented zeroes.",
  "Demand Scout does not trigger benchmarks and does not publish scores.",
];

export function buildDemandReport(input: {
  mode: "mock" | "live";
  operation: DemandReport["operation"];
  target: DemandTarget;
  seed?: DemandSeed | null;
  keywords?: string[] | null;
  ideas?: DemandIdea[];
  metrics?: DemandMetric[];
}): DemandReport {
  const ideas = input.ideas ?? [];
  const metrics = input.metrics ?? [];
  const rows = ideas.length > 0 ? ideas : metrics;
  const provenanceFlags = rows.map((row) => row.provenance.cached);
  let cacheStatus: DemandReport["cacheStatus"] = "n/a";
  if (provenanceFlags.length > 0) {
    const allCached = provenanceFlags.every(Boolean);
    const noneCached = provenanceFlags.every((flag) => !flag);
    cacheStatus = allCached ? "hit" : noneCached ? "miss" : "mixed";
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: input.mode,
    operation: input.operation,
    target: input.target,
    seed: input.seed ?? null,
    keywords: input.keywords ?? null,
    ideas,
    metrics,
    clusters: clusterDemandRows(rows),
    cacheStatus,
    limitations: DEFAULT_LIMITATIONS,
    futureFactors: {
      businessValue: null,
      testability: null,
      evidenceGap: null,
      note: "These factors are intentionally null in v1. Google demand does not measure them.",
    },
  };
}

export function formatDemandReportText(report: DemandReport): string {
  const lines: string[] = [];
  lines.push("CanAIYet Demand Scout report");
  lines.push(`Mode: ${report.mode}`);
  lines.push(`Operation: ${report.operation}`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(
    `Target: ${report.target.country}/${report.target.language} · ${report.target.network} · ${report.target.geoTargetConstant} · ${report.target.languageConstant}`,
  );
  if (report.seed?.keyword) lines.push(`Seed keyword: ${report.seed.keyword}`);
  if (report.seed?.url) lines.push(`Seed URL: ${report.seed.url}`);
  if (report.keywords?.length) lines.push(`Keywords: ${report.keywords.join(", ")}`);
  lines.push(`Cache: ${report.cacheStatus}`);
  lines.push("");
  lines.push("Candidate capability families (demand evidence only)");
  if (report.clusters.length === 0) {
    lines.push("- (none)");
  } else {
    for (const cluster of report.clusters) {
      lines.push(`- ${cluster.familyLabel}`);
      lines.push(`  representative: ${cluster.representativeKeyword}`);
      lines.push(`  members: ${cluster.members.join(" | ")}`);
      lines.push(
        `  demand: avgMonthly=${cluster.aggregateAverageMonthlySearches ?? "unknown"} · members=${cluster.memberCount}`,
      );
      lines.push(
        `  proxies: competitionIndexMax=${cluster.competitionIndexMax ?? "unknown"} · bidMicros=${cluster.lowTopOfPageBidMicrosMin ?? "unknown"}-${cluster.highTopOfPageBidMicrosMax ?? "unknown"}`,
      );
    }
  }

  const sample = report.ideas[0] ?? report.metrics[0];
  if (sample) {
    lines.push("");
    lines.push("Provenance sample");
    lines.push(`- source: ${sample.provenance.source}`);
    lines.push(`- apiVersion: ${sample.provenance.apiVersion}`);
    lines.push(`- requestId: ${sample.provenance.requestId ?? "none"}`);
    lines.push(`- retrievedAt: ${sample.provenance.retrievedAt}`);
    lines.push(`- cached: ${sample.provenance.cached}`);
    lines.push(`- originalRetrievedAt: ${sample.provenance.originalRetrievedAt ?? sample.provenance.retrievedAt}`);
  }

  lines.push("");
  lines.push("Limitations");
  for (const limitation of report.limitations) {
    lines.push(`- ${limitation}`);
  }
  lines.push(`- futureFactors: ${report.futureFactors.note}`);
  return `${lines.join("\n")}\n`;
}

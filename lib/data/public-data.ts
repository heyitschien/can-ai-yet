import { createClient } from "@supabase/supabase-js";
import type { CapabilityStatus, EvidenceLevel, PublicCapability, SupervisionLevel } from "@/lib/domain";
import { pairEvidence, type PairedEvidence, type RemoteCapability, type RemoteResult, type RemoteRun } from "@/evals/evidence/pair";
import { publishedRecords, recordBySlug, type PublishedRecord } from "@/lib/evidence/load";

const EVIDENCE: EvidenceLevel = "simulation";

export function toPublic(record: PublishedRecord): PublicCapability {
  return {
    id: record.catalog.code,
    code: record.catalog.code,
    slug: record.catalog.slug,
    title: record.catalog.title,
    shortDescription: record.catalog.shortDescription,
    categorySlug: record.catalog.categorySlug,
    categoryName: record.catalog.categoryName,
    status: record.status,
    evidenceLevel: EVIDENCE,
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
    modelProvider: record.suite?.provider ?? null,
    modelName: record.suite?.model ?? null,
    configurationLabel: "Reference agent against the Acme Services simulation",
    acceptedRunId: record.suite?.startedAt ?? null,
  };
}

function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

type Row = {
  id: string;
  code: string;
  slug: string;
  title: string;
  short_description: string;
  status: CapabilityStatus;
  evidence_level: EvidenceLevel;
  supervision_level: SupervisionLevel;
  current_score: number | null;
  current_successes: number | null;
  current_total: number | null;
  current_cost_usd: number | null;
  current_runtime_seconds: number | null;
  current_critical_failures: number;
  what_ai_can_do: string[];
  human_required_when: string[];
  common_failure_modes: string[];
  implementation_blueprint: { label: string }[];
  last_tested_at: string | null;
  synonyms: string[];
  model_provider: string | null;
  model_name: string | null;
  configuration_label: string | null;
  accepted_test_run_id: string | null;
  categories: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toRemote(row: Row): RemoteCapability {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    categorySlug: category?.slug ?? "",
    categoryName: category?.name ?? "",
    evidenceLevel: row.evidence_level,
    humanRequiredWhen: row.human_required_when ?? [],
    implementationBlueprint: row.implementation_blueprint ?? [],
    synonyms: row.synonyms ?? [],
    acceptedRunId: row.accepted_test_run_id,
    status: row.status,
    supervisionLevel: row.supervision_level,
    currentScore: num(row.current_score),
    currentSuccesses: num(row.current_successes),
    currentTotal: num(row.current_total),
    currentCostUsd: num(row.current_cost_usd),
    currentRuntimeSeconds: num(row.current_runtime_seconds),
    currentCriticalFailures: row.current_critical_failures,
    whatAiCanDo: row.what_ai_can_do ?? [],
    commonFailureModes: row.common_failure_modes ?? [],
    lastTestedAt: row.last_tested_at,
    modelProvider: row.model_provider,
    modelName: row.model_name,
    configurationLabel: row.configuration_label,
  };
}

type RunRow = {
  id: string;
  capability_id: string;
  status: string;
  tool_configuration: { benchmarkValid?: boolean } | null;
  model_provider: string;
  model_name: string;
  fixture_version: string;
  git_sha: string | null;
  completed_at: string | null;
  success_count: number;
  failure_count: number;
  total_count: number;
  critical_failure_count: number;
  score: number | string | null;
  total_cost_usd: number | string | null;
  median_runtime_seconds: number | string | null;
  published: boolean;
};

type ResultRow = {
  test_run_id: string;
  success: boolean;
  critical: boolean;
  failure_explanation: string | null;
  test_scenarios: { slug: string; title: string } | { slug: string; title: string }[] | null;
};

function toRun(row: RunRow): RemoteRun {
  return {
    id: row.id,
    provider: row.model_provider,
    model: row.model_name,
    fixtureVersion: row.fixture_version,
    gitSha: row.git_sha,
    completedAt: row.completed_at,
    successCount: Number(row.success_count),
    failureCount: Number(row.failure_count),
    totalCount: Number(row.total_count),
    criticalFailureCount: Number(row.critical_failure_count),
    score: num(row.score),
    totalCostUsd: num(row.total_cost_usd),
    medianRuntimeSeconds: num(row.median_runtime_seconds),
    published: row.published,
    status: row.status,
    benchmarkValid: row.tool_configuration?.benchmarkValid === true,
    capabilityId: row.capability_id,
  };
}

function toResult(row: ResultRow): RemoteResult | null {
  const scenario = Array.isArray(row.test_scenarios) ? row.test_scenarios[0] : row.test_scenarios;
  if (!scenario) return null;
  return {
    slug: scenario.slug,
    title: scenario.title,
    success: row.success,
    critical: row.critical,
    failureExplanation: row.failure_explanation,
  };
}

async function loadRemoteChains(): Promise<Map<string, { remote: RemoteCapability; run: RemoteRun | null; results: RemoteResult[] | null }> | null> {
  const client = supabasePublic();
  if (!client) return null;
  const listed = await client.from("capabilities").select("*, categories(slug, name)").eq("published", true).order("code");
  if (listed.error || !listed.data) return null;
  const remotes = (listed.data as Row[]).map(toRemote);
  const ids = remotes.map((item) => item.acceptedRunId).filter((id): id is string => Boolean(id));
  const runs = new Map<string, RemoteRun>();
  const results = new Map<string, RemoteResult[]>();
  if (ids.length > 0) {
    const runRows = await client.from("test_runs").select("*").in("id", ids);
    if (runRows.error) return null;
    for (const row of (runRows.data ?? []) as RunRow[]) runs.set(row.id, toRun(row));
    const resultRows = await client.from("test_results").select("test_run_id, success, critical, failure_explanation, test_scenarios(slug, title)").in("test_run_id", ids);
    if (resultRows.error) return null;
    for (const row of (resultRows.data ?? []) as ResultRow[]) {
      const parsed = toResult(row);
      if (!parsed) continue;
      const bucket = results.get(row.test_run_id) ?? [];
      bucket.push(parsed);
      results.set(row.test_run_id, bucket);
    }
  }
  const bySlug = new Map<string, { remote: RemoteCapability; run: RemoteRun | null; results: RemoteResult[] | null }>();
  for (const remote of remotes) {
    const run = remote.acceptedRunId ? (runs.get(remote.acceptedRunId) ?? null) : null;
    const runResults = remote.acceptedRunId ? (results.get(remote.acceptedRunId) ?? []) : null;
    bySlug.set(remote.slug, { remote, run, results: runResults });
  }
  return bySlug;
}

function pairRecord(record: PublishedRecord, remote: { remote: RemoteCapability; run: RemoteRun | null; results: RemoteResult[] | null } | undefined): PairedEvidence | null {
  return pairEvidence({
    local: record,
    remote: remote?.remote ?? null,
    acceptedRun: remote?.run ?? null,
    acceptedResults: remote?.results ?? null,
  });
}

export async function listPublishedPages(): Promise<PairedEvidence[]> {
  const local = publishedRecords();
  const remote = await loadRemoteChains();
  if (!remote) return local.map((record) => pairEvidence({ local: record, remote: null, acceptedRun: null, acceptedResults: null })).filter((page): page is PairedEvidence => page !== null);
  const pages: PairedEvidence[] = [];
  const seen = new Set<string>();
  for (const record of local) {
    const page = pairRecord(record, remote.get(record.catalog.slug));
    if (page) pages.push(page);
    seen.add(record.catalog.slug);
  }
  for (const [slug, chain] of remote) {
    if (seen.has(slug)) continue;
    const page = pairEvidence({ local: null, remote: chain.remote, acceptedRun: chain.run, acceptedResults: chain.results });
    if (page) pages.push(page);
  }
  return pages;
}

export async function getPublishedPage(slug: string): Promise<PairedEvidence | null> {
  const pages = await listPublishedPages();
  return pages.find((page) => page.capability.slug === slug) ?? null;
}

export async function listPublished(): Promise<PublicCapability[]> {
  const pages = await listPublishedPages();
  return pages.map((page) => page.capability);
}

export async function getPublishedBySlug(slug: string): Promise<PublicCapability | null> {
  const page = await getPublishedPage(slug);
  return page?.capability ?? null;
}

export function localRecord(slug: string) {
  return recordBySlug(slug);
}

import { createClient } from "@supabase/supabase-js";
import type { CapabilityStatus, EvidenceLevel, PublicCapability, SupervisionLevel } from "@/lib/domain";
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

function fromRow(row: Row): PublicCapability {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  return {
    id: row.code,
    code: row.code,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    categorySlug: category?.slug ?? "",
    categoryName: category?.name ?? "",
    status: row.status,
    evidenceLevel: row.evidence_level,
    supervisionLevel: row.supervision_level,
    currentScore: row.current_score,
    currentSuccesses: row.current_successes,
    currentTotal: row.current_total,
    currentCostUsd: row.current_cost_usd,
    currentRuntimeSeconds: row.current_runtime_seconds,
    currentCriticalFailures: row.current_critical_failures,
    whatAiCanDo: row.what_ai_can_do ?? [],
    humanRequiredWhen: row.human_required_when ?? [],
    commonFailureModes: row.common_failure_modes ?? [],
    implementationBlueprint: row.implementation_blueprint ?? [],
    lastTestedAt: row.last_tested_at,
    published: true,
    synonyms: row.synonyms ?? [],
    modelProvider: row.model_provider,
    modelName: row.model_name,
    configurationLabel: row.configuration_label,
    acceptedRunId: row.accepted_test_run_id,
  };
}

export async function listPublished(): Promise<PublicCapability[]> {
  const client = supabasePublic();
  if (client) {
    const { data, error } = await client
      .from("capabilities")
      .select("*, categories(slug, name)")
      .eq("published", true)
      .order("code");
    if (!error && data && data.length > 0) return (data as Row[]).map(fromRow);
  }
  return publishedRecords().map(toPublic);
}

export async function getPublishedBySlug(slug: string): Promise<PublicCapability | null> {
  const client = supabasePublic();
  if (client) {
    const { data, error } = await client
      .from("capabilities")
      .select("*, categories(slug, name)")
      .eq("published", true)
      .eq("slug", slug)
      .maybeSingle();
    if (!error && data) return fromRow(data as Row);
  }
  const record = recordBySlug(slug);
  return record ? toPublic(record) : null;
}

export function localRecord(slug: string) {
  return recordBySlug(slug);
}

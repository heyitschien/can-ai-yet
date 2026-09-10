import { writeFileSync } from "node:fs";
import { CATALOG } from "@/lib/content/catalog";
import { loadEvidence } from "@/lib/evidence/load";

function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function json(value: unknown): string {
  return `${quote(JSON.stringify(value))}::jsonb`;
}

function textArray(values: string[]): string {
  if (values.length === 0) return "array[]::text[]";
  return `array[${values.map((value) => quote(value)).join(", ")}]`;
}

const evidence = loadEvidence();
if (!evidence) throw new Error("Missing accepted evidence");

const statements: string[] = ["begin;"];
for (const catalog of CATALOG) {
  const suite = evidence.suites.find((item) => item.capabilityCode === catalog.code);
  if (!suite) continue;
  const failures = suite.results.filter((result) => !result.success).map((result) => `${result.title}. ${result.failureExplanation ?? "Failed."}`);
  const passes = suite.results.filter((result) => result.success).map((result) => result.title);
  statements.push(`
insert into public.capabilities (
  code, slug, title, short_description, category_id, status, evidence_level, supervision_level,
  current_score, current_successes, current_total, current_cost_usd, current_runtime_seconds,
  current_critical_failures, what_ai_can_do, human_required_when, common_failure_modes,
  implementation_blueprint, synonyms, model_provider, model_name, configuration_label,
  last_tested_at, published
) values (
  ${quote(catalog.code)},
  ${quote(catalog.slug)},
  ${quote(catalog.title)},
  ${quote(catalog.shortDescription)},
  (select id from public.categories where slug = ${quote(catalog.categorySlug)}),
  ${quote(suite.status)}::public.capability_status,
  'simulation'::public.evidence_level,
  ${quote(suite.supervision)}::public.supervision_level,
  ${suite.score},
  ${suite.successCount},
  ${suite.totalCount},
  ${suite.totalCostUsd},
  ${suite.medianRuntimeSeconds},
  ${suite.criticalFailureCount},
  ${json(passes)},
  ${json(catalog.humanRequiredWhen)},
  ${json(failures)},
  ${json(catalog.implementationBlueprint)},
  ${textArray(catalog.synonyms)},
  ${quote(suite.provider)},
  ${quote(suite.model)},
  'Reference agent against the Acme Services simulation',
  ${quote(suite.completedAt)}::timestamptz,
  true
)
on conflict (code) do update set
  status = excluded.status,
  current_score = excluded.current_score,
  current_successes = excluded.current_successes,
  current_total = excluded.current_total,
  current_critical_failures = excluded.current_critical_failures,
  what_ai_can_do = excluded.what_ai_can_do,
  common_failure_modes = excluded.common_failure_modes,
  last_tested_at = excluded.last_tested_at,
  published = true;
`);
}
statements.push("commit;");
const sql = statements.join("\n");
writeFileSync("supabase/seed.sql", sql);
console.log(`Wrote supabase/seed.sql (${sql.length} chars)`);

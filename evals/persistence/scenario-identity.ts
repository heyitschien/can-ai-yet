import { createHash } from "node:crypto";
import type { ScenarioPersistRow } from "@/evals/persistence/persist-run";

export type StoredScenario = {
  id: string;
  slug: string;
  contentHash: string;
  definition: ScenarioPersistRow;
};

export function scenarioContentHash(row: ScenarioPersistRow): string {
  const canonical = JSON.stringify({
    capabilityCode: row.capabilityCode,
    slug: row.slug,
    title: row.title,
    description: row.description,
    fixtureVersion: row.fixtureVersion,
    inputPayload: row.inputPayload,
    expectedState: row.expectedState,
    forbiddenState: row.forbiddenState,
    critical: row.critical,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function versionedSlug(slug: string, hash: string): string {
  return `${slug}__${hash.slice(0, 12)}`;
}

/**
 * Never updates an existing definition. Identical content is reused.
 * Different content gets a new identity so accepted history keeps the old row.
 */
export function resolveScenarioWrite(
  existing: StoredScenario[],
  incoming: ScenarioPersistRow,
): { action: "reuse"; id: string; slug: string } | { action: "insert"; slug: string; contentHash: string } {
  const hash = scenarioContentHash(incoming);
  const same = existing.find((row) => row.contentHash === hash);
  if (same) return { action: "reuse", id: same.id, slug: same.slug };
  const slugTaken = existing.some((row) => row.slug === incoming.slug);
  return { action: "insert", slug: slugTaken ? versionedSlug(incoming.slug, hash) : incoming.slug, contentHash: hash };
}

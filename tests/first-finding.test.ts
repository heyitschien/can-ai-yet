import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getPublishedBySlug, listPublished } from "@/lib/data/public-data";
import {
  CAP_001_FIRST_FINDING_PATH,
  loadCap001FirstFinding,
  resetCap001FirstFindingCache,
} from "@/lib/evidence/first-finding";
import { loadEvidence } from "@/lib/evidence/load";

describe("CAP-001 first Sonnet finding publication", () => {
  it("loads the published record with exact artifact counts and economics", () => {
    resetCap001FirstFindingCache();
    const finding = loadCap001FirstFinding();
    expect(finding).toBeTruthy();
    const suite = finding!.suite;
    expect(suite.successCount).toBe(4);
    expect(suite.failureCount).toBe(8);
    expect(suite.criticalFailureCount).toBe(4);
    expect(suite.totalCount).toBe(12);
    expect(suite.results).toHaveLength(12);
    expect(suite.model).toBe("anthropic/claude-sonnet-4.6");
    expect(suite.totalCostUsd).toBeCloseTo(0.396747, 6);
    expect(suite.inputTokens).toBe(85919);
    expect(suite.outputTokens).toBe(9266);
    expect(suite.provenance.requestCount).toBe(40);
    expect(finding!.publicWording.caveat.toLowerCase()).toContain("not a reliability");
    expect(finding!.publicWording.summary).not.toMatch(/\b33%\b/);
    expect(finding!.publicWording.summary).not.toMatch(/failure rate/i);
  });

  it("keeps headline and detail on the same Sonnet run and blocks reference-agent leak", async () => {
    resetCap001FirstFindingCache();
    const finding = loadCap001FirstFinding()!;
    const capability = await getPublishedBySlug("follow-up-with-sales-leads");
    expect(capability).toBeTruthy();
    expect(capability!.modelName).toBe("anthropic/claude-sonnet-4.6");
    expect(capability!.currentSuccesses).toBe(4);
    expect(capability!.currentTotal).toBe(12);
    expect(capability!.currentCriticalFailures).toBe(4);
    expect(capability!.currentCostUsd).toBeCloseTo(0.396747, 6);
    expect(capability!.acceptedRunId).toBe(finding.publicationId);
    expect(capability!.configurationLabel ?? "").not.toMatch(/reference agent/i);
    expect(capability!.modelName).not.toMatch(/reference/i);

    const listed = await listPublished();
    const card = listed.find((item) => item.slug === "follow-up-with-sales-leads");
    expect(card?.modelName).toBe("anthropic/claude-sonnet-4.6");
    expect(card?.currentSuccesses).toBe(4);
    expect(card?.currentCriticalFailures).toBe(4);

    // Harness baseline remains reference and must not become the CAP-001 public headline source.
    const accepted = loadEvidence();
    const referenceCap001 = accepted?.suites.find((suite) => suite.capabilityCode === "CAP-001");
    expect(referenceCap001?.model).toBe("reference-agent-v1");
    expect(referenceCap001?.successCount).toBe(9);
  });

  it("matches the raw review artifact counts and does not invent reliability percentages", () => {
    const published = JSON.parse(
      readFileSync(join(process.cwd(), CAP_001_FIRST_FINDING_PATH), "utf8"),
    ) as ReturnType<typeof loadCap001FirstFinding>;
    const raw = JSON.parse(
      readFileSync(
        join(process.cwd(), "docs/reviews/runs/CAP-001-openrouter-2026-09-11T06-51-59-982Z.json"),
        "utf8",
      ),
    ) as { suite: { successCount: number; failureCount: number; criticalFailureCount: number; totalCostUsd: number; results: unknown[] } };

    expect(published?.suite.successCount).toBe(raw.suite.successCount);
    expect(published?.suite.failureCount).toBe(raw.suite.failureCount);
    expect(published?.suite.criticalFailureCount).toBe(raw.suite.criticalFailureCount);
    expect(published?.suite.results).toHaveLength(raw.suite.results.length);
    expect(published?.suite.totalCostUsd).toBeCloseTo(raw.suite.totalCostUsd, 6);

    const blob = JSON.stringify(published);
    expect(blob).not.toMatch(/\bis 33% reliable\b/i);
    expect(blob).not.toMatch(/\b67% failure rate\b/i);
    expect(blob).toContain("Single frozen run — not a reliability estimate");
    expect(published?.publicWording.summary).toMatch(/not a claim that Sonnet is/i);
  });
});

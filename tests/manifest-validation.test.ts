import { describe, expect, it } from "vitest";
import {
  buildCap001V1Manifest,
  compareManifests,
  defaultCap001ScenarioIds,
  defaultCap001V1Manifest,
} from "@/evals/manifest/experiment-manifest";
import { validateRunReceipt, type RunReceiptInput } from "@/evals/validation/run-validation";

function validReceipt(overrides: Partial<RunReceiptInput> = {}): RunReceiptInput {
  const manifest = defaultCap001V1Manifest();
  const scenarioResults = defaultCap001ScenarioIds().map((scenarioId) => ({
    scenarioId,
    toolTrace: [{ tool: "get_contact", args: { email: "test@example.com" } }],
    finalState: { sent: [] },
    judgeCompleted: true,
    generationIds: ["gen-1"],
    costUsd: 0.01,
    inputTokens: 100,
    outputTokens: 50,
  }));
  return {
    benchmarkVersion: "cap-001-v1",
    manifestFingerprint: manifest.fingerprint,
    expectedManifestFingerprint: manifest.fingerprint,
    labHeadSha: "533ac5f",
    requestedModel: "anthropic/claude-sonnet-4.6",
    servedModel: "anthropic/claude-sonnet-4.6",
    provider: "openrouter",
    fallbackDisabled: true,
    scenarioResults,
    limits: { maxCostUsd: 1, maxSteps: 96 },
    anomalies: [],
    ...overrides,
  };
}

describe("experiment manifest", () => {
  it("builds a stable fingerprint for sorted canonical fields", () => {
    const ids = ["LEAD-012", "LEAD-001", "LEAD-003"];
    const a = buildCap001V1Manifest({
      gitSha: "533ac5f",
      model: "anthropic/claude-sonnet-4.6",
      provider: "openrouter",
      fixtureVersion: "acme-v1",
      environmentVersion: "mini-business-v1",
      scenarioIds: ids,
    });
    const b = buildCap001V1Manifest({
      gitSha: "deadbeef",
      model: "anthropic/claude-sonnet-4.6",
      provider: "openrouter",
      fixtureVersion: "acme-v1",
      environmentVersion: "mini-business-v1",
      scenarioIds: [...ids].reverse(),
    });
    expect(a.scenarioIds).toEqual(["LEAD-001", "LEAD-003", "LEAD-012"]);
    expect(a.fingerprint).toBe(b.fingerprint);
  });

  it("marks differing model or fixture manifests INCOMPARABLE", () => {
    const baseline = defaultCap001V1Manifest();
    const otherModel = buildCap001V1Manifest({
      gitSha: baseline.gitSha,
      model: "openai/gpt-5.5",
      provider: baseline.provider,
      fixtureVersion: baseline.fixtureVersion,
      environmentVersion: baseline.environmentVersion,
      scenarioIds: baseline.scenarioIds,
    });
    expect(compareManifests(baseline, otherModel)).toBe("INCOMPARABLE");
  });

  it("marks identical comparable manifests COMPARABLE", () => {
    const a = defaultCap001V1Manifest({ gitSha: "aaa" });
    const b = defaultCap001V1Manifest({ gitSha: "bbb" });
    expect(compareManifests(a, b)).toBe("COMPARABLE");
  });
});

describe("run receipt validation", () => {
  it("accepts a complete comparable receipt", () => {
    const result = validateRunReceipt(validReceipt());
    expect(result.status).toBe("VALID");
    expect(result.reasons).toHaveLength(0);
    expect(result.checks.scenarioCompleteness).toBe(true);
  });

  it("returns INCOMPARABLE when manifest fingerprint mismatches", () => {
    const result = validateRunReceipt(
      validReceipt({ manifestFingerprint: "wrong", expectedManifestFingerprint: "expected" }),
    );
    expect(result.status).toBe("INCOMPARABLE");
    expect(result.checks.manifestComparable).toBe(false);
  });

  it("returns INVALID when required provenance fields are missing", () => {
    const receipt = validReceipt({ fallbackDisabled: false, labHeadSha: "uncommitted" });
    const result = validateRunReceipt(receipt);
    expect(result.status).toBe("INVALID");
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

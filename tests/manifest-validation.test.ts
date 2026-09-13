import { describe, expect, it } from "vitest";
import {
  buildLabManifest,
  compareLabManifests,
  defaultCap001ScenarioIds,
  defaultLabManifest,
  defaultRunConfig,
} from "@/evals/manifest/experiment-manifest";
import { validateRunReceipt, type RunReceiptInput } from "@/evals/validation/run-validation";

function validReceipt(overrides: Partial<RunReceiptInput> = {}): RunReceiptInput {
  const lab = defaultLabManifest();
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
    labFingerprint: lab.labFingerprint,
    expectedLabFingerprint: lab.labFingerprint,
    labHeadSha: lab.labHeadSha,
    expectedLabHeadSha: lab.labHeadSha,
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

describe("LabManifest (racetrack)", () => {
  it("builds a stable labFingerprint independent of model and sorted scenario ids", () => {
    const ids = ["LEAD-012", "LEAD-001", "LEAD-003"];
    const a = buildLabManifest({
      labHeadSha: "aaa",
      fixtureVersion: "acme-v1",
      environmentVersion: "mini-business-v1",
      scenarioIds: ids,
    });
    const b = buildLabManifest({
      labHeadSha: "bbb",
      fixtureVersion: "acme-v1",
      environmentVersion: "mini-business-v1",
      scenarioIds: [...ids].reverse(),
    });
    expect(a.scenarioIds).toEqual(["LEAD-001", "LEAD-003", "LEAD-012"]);
    expect(a.labFingerprint).toBe(b.labFingerprint);
  });

  it("same lab + different RunConfig models is COMPARABLE", () => {
    const lab = defaultLabManifest({ labHeadSha: "same-lab-head" });
    const claude = defaultRunConfig({ model: "anthropic/claude-sonnet-4.6" });
    const gpt = defaultRunConfig({ model: "openai/gpt-5.5" });
    expect(claude.model).not.toBe(gpt.model);
    expect(compareLabManifests(lab, lab)).toBe("COMPARABLE");
  });

  it("different accepted lab heads are INCOMPARABLE", () => {
    const a = defaultLabManifest({ labHeadSha: "aaa" });
    const b = defaultLabManifest({ labHeadSha: "bbb" });
    expect(a.labFingerprint).toBe(b.labFingerprint);
    expect(compareLabManifests(a, b)).toBe("INCOMPARABLE");
  });

  it("different fixture versions change the lab fingerprint", () => {
    const a = defaultLabManifest({ fixtureVersion: "acme-v1" });
    const b = defaultLabManifest({ fixtureVersion: "acme-v2" });
    expect(a.labFingerprint).not.toBe(b.labFingerprint);
    expect(compareLabManifests(a, b)).toBe("INCOMPARABLE");
  });
});

describe("run receipt validation", () => {
  it("accepts a complete comparable receipt", () => {
    const result = validateRunReceipt(validReceipt());
    expect(result.status).toBe("VALID");
    expect(result.reasons).toHaveLength(0);
    expect(result.checks.scenarioCompleteness).toBe(true);
  });

  it("returns INCOMPARABLE when lab fingerprint mismatches", () => {
    const result = validateRunReceipt(
      validReceipt({ labFingerprint: "wrong", expectedLabFingerprint: "expected" }),
    );
    expect(result.status).toBe("INCOMPARABLE");
    expect(result.checks.labComparable).toBe(false);
  });

  it("returns INVALID when required provenance fields are missing", () => {
    const receipt = validReceipt({
      fallbackDisabled: false,
      labHeadSha: "uncommitted",
      expectedLabHeadSha: undefined,
    });
    const result = validateRunReceipt(receipt);
    expect(result.status).toBe("INVALID");
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

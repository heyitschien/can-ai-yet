import { describe, expect, it } from "vitest";
import {
  buildCapabilityContract,
  compareModelRuns,
  compareTransferPair,
  defaultCapabilityContract,
  defaultCap001ScenarioIds,
  defaultHubSpotEnvironment,
  defaultRunConfig,
  defaultSyntheticEnvironment,
} from "@/evals/manifest/experiment-manifest";
import { validateRunReceipt, type RunReceiptInput } from "@/evals/validation/run-validation";

function validReceipt(overrides: Partial<RunReceiptInput> = {}): RunReceiptInput {
  const capability = defaultCapabilityContract();
  const environment = defaultSyntheticEnvironment();
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
    capabilityFingerprint: capability.capabilityFingerprint,
    expectedCapabilityFingerprint: capability.capabilityFingerprint,
    environmentFingerprint: environment.environmentFingerprint,
    expectedEnvironmentFingerprint: environment.environmentFingerprint,
    envHeadSha: environment.envHeadSha,
    expectedEnvHeadSha: environment.envHeadSha,
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

describe("CapabilityContractManifest", () => {
  it("builds a stable capability fingerprint independent of environment and model", () => {
    const a = buildCapabilityContract({ scenarioIds: ["LEAD-012", "LEAD-001", "LEAD-003"] });
    const b = buildCapabilityContract({ scenarioIds: ["LEAD-003", "LEAD-001", "LEAD-012"] });
    expect(a.scenarioIds).toEqual(["LEAD-001", "LEAD-003", "LEAD-012"]);
    expect(a.capabilityFingerprint).toBe(b.capabilityFingerprint);
  });

  it("changes capability fingerprint when portable policy/tool/predicate semantics change", () => {
    const baseline = defaultCapabilityContract();
    const policyChange = defaultCapabilityContract({ policyContractVersion: "policy-acme-v2" });
    const toolChange = defaultCapabilityContract({ agentToolSemanticsVersion: "cap001-tools-v2" });
    const predicateChange = defaultCapabilityContract({
      judgePredicateSemanticsVersion: "judge-predicates-v2",
    });
    expect(policyChange.capabilityFingerprint).not.toBe(baseline.capabilityFingerprint);
    expect(toolChange.capabilityFingerprint).not.toBe(baseline.capabilityFingerprint);
    expect(predicateChange.capabilityFingerprint).not.toBe(baseline.capabilityFingerprint);
  });
});

describe("model-comparison gate", () => {
  it("same capability + same environment + Claude/GPT ⇒ COMPARABLE_MODEL_RUNS", () => {
    const capability = defaultCapabilityContract();
    const environment = defaultSyntheticEnvironment({ envHeadSha: "same-env-head" });
    const claude = defaultRunConfig({ model: "anthropic/claude-sonnet-4.6" });
    const gpt = defaultRunConfig({ model: "openai/gpt-5.5" });
    expect(claude.model).not.toBe(gpt.model);
    expect(
      compareModelRuns({
        capabilityA: capability,
        capabilityB: capability,
        environmentA: environment,
        environmentB: environment,
      }),
    ).toBe("COMPARABLE_MODEL_RUNS");
  });

  it("same capability + different accepted environment head ⇒ not model-comparable", () => {
    const capability = defaultCapabilityContract();
    const a = defaultSyntheticEnvironment({ envHeadSha: "aaa" });
    const b = defaultSyntheticEnvironment({ envHeadSha: "bbb" });
    expect(a.environmentFingerprint).toBe(b.environmentFingerprint);
    expect(
      compareModelRuns({
        capabilityA: capability,
        capabilityB: capability,
        environmentA: a,
        environmentB: b,
      }),
    ).toBe("INCOMPARABLE");
  });
});

describe("transfer-comparison gate", () => {
  it("same capability + synthetic vs HubSpot + fixed model ⇒ COMPARABLE_TRANSFER_PAIR", () => {
    const capability = defaultCapabilityContract();
    const synthetic = defaultSyntheticEnvironment();
    const hubspot = defaultHubSpotEnvironment();
    const run = defaultRunConfig({ model: "anthropic/claude-sonnet-4.6" });
    expect(synthetic.environmentFingerprint).not.toBe(hubspot.environmentFingerprint);
    expect(
      compareTransferPair({
        capabilityA: capability,
        capabilityB: capability,
        environmentA: synthetic,
        environmentB: hubspot,
        runConfigA: run,
        runConfigB: run,
      }),
    ).toBe("COMPARABLE_TRANSFER_PAIR");
  });

  it("different capability-contract fingerprint ⇒ transfer-incomparable", () => {
    const a = defaultCapabilityContract();
    const b = defaultCapabilityContract({ policyContractVersion: "policy-other" });
    const synthetic = defaultSyntheticEnvironment();
    const hubspot = defaultHubSpotEnvironment();
    const run = defaultRunConfig();
    expect(
      compareTransferPair({
        capabilityA: a,
        capabilityB: b,
        environmentA: synthetic,
        environmentB: hubspot,
        runConfigA: run,
        runConfigB: run,
      }),
    ).toBe("INCOMPARABLE");
  });

  it("transfer pair requires model/config held fixed", () => {
    const capability = defaultCapabilityContract();
    expect(
      compareTransferPair({
        capabilityA: capability,
        capabilityB: capability,
        environmentA: defaultSyntheticEnvironment(),
        environmentB: defaultHubSpotEnvironment(),
        runConfigA: defaultRunConfig({ model: "anthropic/claude-sonnet-4.6" }),
        runConfigB: defaultRunConfig({ model: "openai/gpt-5.5" }),
      }),
    ).toBe("INCOMPARABLE");
  });

  it("any relevant RunConfig control difference makes transfer INCOMPARABLE", () => {
    const capability = defaultCapabilityContract();
    const synthetic = defaultSyntheticEnvironment();
    const hubspot = defaultHubSpotEnvironment();
    const base = defaultRunConfig({
      model: "anthropic/claude-sonnet-4.6",
      provider: "openrouter",
      route: "default",
      permissionEnvelope: "envelope-a",
      maxSpendUsd: 1,
      maxTurns: 8,
      maxTokens: 800,
      maxRetries: 0,
      allowFallbacks: false,
    });
    const diffs: Array<Partial<typeof base>> = [
      { route: "other-route" },
      { permissionEnvelope: "envelope-b" },
      { maxSpendUsd: 2 },
      { maxTurns: 9 },
      { maxTokens: 900 },
      { maxRetries: 1 },
      { allowFallbacks: true },
      { provider: "direct" },
    ];
    for (const diff of diffs) {
      expect(
        compareTransferPair({
          capabilityA: capability,
          capabilityB: capability,
          environmentA: synthetic,
          environmentB: hubspot,
          runConfigA: base,
          runConfigB: { ...base, ...diff },
        }),
      ).toBe("INCOMPARABLE");
    }
    expect(
      compareTransferPair({
        capabilityA: capability,
        capabilityB: capability,
        environmentA: synthetic,
        environmentB: hubspot,
        runConfigA: base,
        runConfigB: { ...base },
      }),
    ).toBe("COMPARABLE_TRANSFER_PAIR");
  });
});

describe("run receipt validation", () => {
  it("accepts a complete comparable receipt", () => {
    const result = validateRunReceipt(validReceipt());
    expect(result.status).toBe("VALID");
    expect(result.reasons).toHaveLength(0);
    expect(result.checks.scenarioCompleteness).toBe(true);
  });

  it("returns INCOMPARABLE when environment fingerprint mismatches", () => {
    const result = validateRunReceipt(
      validReceipt({ environmentFingerprint: "wrong", expectedEnvironmentFingerprint: "expected" }),
    );
    expect(result.status).toBe("INCOMPARABLE");
    expect(result.checks.environmentComparable).toBe(false);
  });

  it("returns INCOMPARABLE when capability fingerprint mismatches", () => {
    const result = validateRunReceipt(
      validReceipt({ capabilityFingerprint: "wrong", expectedCapabilityFingerprint: "expected" }),
    );
    expect(result.status).toBe("INCOMPARABLE");
    expect(result.checks.capabilityComparable).toBe(false);
  });

  it("returns INVALID when required provenance fields are missing", () => {
    const receipt = validReceipt({
      fallbackDisabled: false,
      envHeadSha: "uncommitted",
      expectedEnvHeadSha: undefined,
    });
    const result = validateRunReceipt(receipt);
    expect(result.status).toBe("INVALID");
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

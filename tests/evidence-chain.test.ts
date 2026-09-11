import { describe, expect, it } from "vitest";
import { leadScenarios } from "@/evals/capabilities/lead-followup/scenarios";
import { pairEvidence, type RemoteCapability, type RemoteRun } from "@/evals/evidence/pair";
import { decideAccept, persistIntentionalRun, buildPersistPayload } from "@/evals/persistence/persist-run";
import { recordBySlug } from "@/lib/evidence/load";
import type { SuiteResult } from "@/evals/types";

const local = recordBySlug("follow-up-with-sales-leads");

function remote(overrides: Partial<RemoteCapability> = {}): RemoteCapability {
  return {
    code: "CAP-001",
    slug: "follow-up-with-sales-leads",
    title: "Follow up with an inbound sales lead",
    shortDescription: "Read an inbound lead.",
    categorySlug: "sales",
    categoryName: "Sales",
    evidenceLevel: "simulation",
    humanRequiredWhen: ["A person should review pricing exceptions."],
    implementationBlueprint: [{ label: "Connect the CRM" }],
    synonyms: ["lead follow-up"],
    acceptedRunId: null,
    status: "green",
    supervisionLevel: "low",
    currentScore: 0.99,
    currentSuccesses: 99,
    currentTotal: 100,
    currentCostUsd: 4,
    currentRuntimeSeconds: 1,
    currentCriticalFailures: 0,
    whatAiCanDo: ["Stale headline item"],
    commonFailureModes: ["Stale failure"],
    lastTestedAt: "2026-01-01T00:00:00.000Z",
    modelProvider: "stale-provider",
    modelName: "stale-model",
    configurationLabel: "old",
    ...overrides,
  };
}

function run(overrides: Partial<RemoteRun> = {}): RemoteRun {
  return {
    id: "run-1",
    provider: "openrouter",
    model: "openai/gpt-4.1-mini",
    fixtureVersion: "acme-v1",
    gitSha: "abc123",
    completedAt: "2026-09-11T00:00:00.000Z",
    successCount: 1,
    failureCount: 1,
    totalCount: 2,
    criticalFailureCount: 0,
    score: 0.5,
    totalCostUsd: 0.02,
    medianRuntimeSeconds: 1.2,
    published: true,
    ...overrides,
  };
}

describe("accepted evidence pairing", () => {
  it("does not attach repository scenario detail to a database headline without an accepted run", () => {
    if (!local) throw new Error("missing local evidence");
    const paired = pairEvidence({ local, remote: remote(), acceptedRun: null, acceptedResults: null });
    expect(paired?.source).toBe("repository-artifact");
    expect(paired?.mixPrevented).toBe(true);
    expect(paired?.capability.currentSuccesses).toBe(local.successes);
    expect(paired?.capability.modelName).not.toBe("stale-model");
    expect(paired?.results.length).toBe(local.suite?.results.length);
  });

  it("uses the accepted run for both headline and detail", () => {
    if (!local) throw new Error("missing local evidence");
    const paired = pairEvidence({
      local,
      remote: remote({ acceptedRunId: "run-1", currentSuccesses: 99 }),
      acceptedRun: run(),
      acceptedResults: [
        { slug: "ordinary-qualified-lead", title: "Ordinary qualified lead", success: true, critical: false, failureExplanation: null },
        { slug: "angry-lead", title: "Angry lead", success: false, critical: false, failureExplanation: "No escalation." },
      ],
    });
    expect(paired?.source).toBe("accepted-run");
    expect(paired?.capability.currentSuccesses).toBe(1);
    expect(paired?.capability.currentTotal).toBe(2);
    expect(paired?.capability.modelName).toBe("openai/gpt-4.1-mini");
    expect(paired?.capability.whatAiCanDo).toEqual(["Ordinary qualified lead"]);
    expect(paired?.results.map((result) => result.scenarioId)).toEqual(["ordinary-qualified-lead", "angry-lead"]);
    expect(paired?.capability.currentSuccesses).not.toBe(99);
  });
});

describe("intentional run persistence", () => {
  it("writes unpublished results and never sets the accepted run", async () => {
    const suite: SuiteResult = {
      capabilityCode: "CAP-001",
      provider: "openrouter",
      model: "openai/gpt-4.1-mini",
      fixtureVersion: "acme-v1",
      environmentVersion: "mini-business-v1",
      gitSha: "abc",
      startedAt: "2026-09-11T00:00:00.000Z",
      completedAt: "2026-09-11T00:01:00.000Z",
      successCount: 0,
      failureCount: 1,
      totalCount: 1,
      criticalFailureCount: 0,
      score: 0,
      status: "red",
      supervision: "not_recommended",
      cappedByCriticalFailure: false,
      totalCostUsd: 0.01,
      medianRuntimeSeconds: 1,
      benchmarkValid: true,
      invalidReasons: [],
      results: [
        {
          scenarioId: "LEAD-001",
          slug: "ordinary-qualified-lead",
          title: "Ordinary qualified lead",
          success: false,
          critical: false,
          failureCode: "INCOMPLETE_TASK",
          failureExplanation: "No send.",
          runtimeSeconds: 1,
          costUsd: 0.01,
          actualState: { sent: [] },
        },
      ],
    };
    const scenarios = leadScenarios.slice(0, 1);
    const payload = buildPersistPayload(suite, scenarios);
    expect(payload.setsAcceptedRunId).toBe(false);
    expect(payload.run.published).toBe(false);
    expect(payload.results[0]?.rawTracePath).toBeNull();
    const saved = await persistIntentionalRun(
      {
        async upsertScenarios(rows) {
          return new Map(rows.map((row) => [row.slug, `id-${row.slug}`]));
        },
        async insertRun(row) {
          expect(row.published).toBe(false);
          return "run-new";
        },
        async insertResults(_runId, rows) {
          expect(rows[0]?.rawTracePath).toBeNull();
        },
      },
      suite,
      scenarios,
    );
    expect(saved).toEqual({ runId: "run-new", accepted: false });
  });

  it("refuses to replace an existing accepted run unless asked", () => {
    expect(decideAccept({ runId: "run-2", runStatus: "completed", currentAcceptedRunId: "run-1", replaceAccepted: false }).allowed).toBe(false);
    expect(decideAccept({ runId: "run-2", runStatus: "running", currentAcceptedRunId: null, replaceAccepted: false }).allowed).toBe(false);
    expect(decideAccept({ runId: "run-2", runStatus: "completed", currentAcceptedRunId: "run-1", replaceAccepted: true }).allowed).toBe(true);
  });
});

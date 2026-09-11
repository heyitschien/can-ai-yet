export type AcceptProof = {
  runId: string;
  runStatus: string;
  benchmarkValid: boolean;
  published: boolean;
  capabilityId: string;
  currentAcceptedRunId: string | null;
  replaceAccepted: boolean;
  expectedResultCount: number;
  resultScenarioIds: string[];
  reviewedBy: string;
};

export type AcceptOutcome =
  | { ok: true; runId: string; idempotent: boolean }
  | { ok: false; reason: string };

export function validateAccept(input: AcceptProof): AcceptOutcome {
  if (!input.runId) return { ok: false, reason: "A run id is required." };
  if (!input.reviewedBy.trim()) return { ok: false, reason: "Acceptance requires a reviewer name." };
  if (input.runStatus !== "completed") return { ok: false, reason: "Only a completed run can be accepted." };
  if (!input.benchmarkValid) return { ok: false, reason: "An invalid benchmark cannot be accepted." };
  if (input.expectedResultCount < 1) return { ok: false, reason: "Acceptance requires the expected scenario count." };
  const unique = new Set(input.resultScenarioIds);
  if (unique.size !== input.resultScenarioIds.length || unique.size !== input.expectedResultCount) {
    return { ok: false, reason: "Acceptance requires every expected scenario result, once." };
  }
  if (input.currentAcceptedRunId === input.runId) return { ok: true, runId: input.runId, idempotent: true };
  if (input.currentAcceptedRunId && input.currentAcceptedRunId !== input.runId && !input.replaceAccepted) {
    return { ok: false, reason: "This capability already has a different accepted run. Pass --replace-accepted to change it." };
  }
  return { ok: true, runId: input.runId, idempotent: false };
}

export type AcceptStore = {
  lockCapability(capabilityId: string): Promise<{ acceptedRunId: string | null } | null>;
  readRun(runId: string): Promise<{
    id: string;
    status: string;
    capabilityId: string;
    published: boolean;
    benchmarkValid: boolean;
    expectedResultCount: number;
    resultScenarioIds: string[];
  } | null>;
  commitAccept(input: { capabilityId: string; runId: string; expectedPriorAcceptedRunId: string | null; reviewedBy: string }): Promise<{ ok: true } | { ok: false; reason: string }>;
};

/** One compare-and-set. Publish and pointer move together, or neither does. */
export async function acceptRunAtomic(store: AcceptStore, input: Omit<AcceptProof, "currentAcceptedRunId" | "runStatus" | "benchmarkValid" | "published" | "capabilityId" | "expectedResultCount" | "resultScenarioIds"> & { replaceAccepted: boolean; reviewedBy: string }): Promise<AcceptOutcome> {
  const run = await store.readRun(input.runId);
  if (!run) return { ok: false, reason: "Run was not found." };
  const locked = await store.lockCapability(run.capabilityId);
  if (!locked) return { ok: false, reason: "Capability was not found." };
  const decision = validateAccept({
    runId: run.id,
    runStatus: run.status,
    benchmarkValid: run.benchmarkValid,
    published: run.published,
    capabilityId: run.capabilityId,
    currentAcceptedRunId: locked.acceptedRunId,
    replaceAccepted: input.replaceAccepted,
    expectedResultCount: run.expectedResultCount,
    resultScenarioIds: run.resultScenarioIds,
    reviewedBy: input.reviewedBy,
  });
  if (!decision.ok || decision.idempotent) return decision;
  const committed = await store.commitAccept({
    capabilityId: run.capabilityId,
    runId: run.id,
    expectedPriorAcceptedRunId: locked.acceptedRunId,
    reviewedBy: input.reviewedBy,
  });
  if (!committed.ok) return committed;
  return { ok: true, runId: run.id, idempotent: false };
}

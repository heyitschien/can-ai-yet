import type { FailureCode } from "@/lib/domain";

export const FIXTURE_VERSION = "acme-v1";
export const ENVIRONMENT_VERSION = "mini-business-v1";
export const REFERENCE_MODEL = "reference-agent-v1";
export const REFERENCE_PROVIDER = "reference";

export type Assertion =
  | { kind: "sent"; to: string; bodyIncludes?: string[]; bodyExcludes?: string[] }
  | { kind: "not_sent_to"; to: string }
  | { kind: "no_sends" }
  | { kind: "task_includes"; titleIncludes: string; contactEmail?: string }
  | { kind: "note_includes"; contactEmail: string; bodyIncludes: string }
  | { kind: "contact_unchanged"; email: string }
  | { kind: "deal_stage"; contactEmail: string; stage: string }
  | { kind: "escalated"; reasonIncludes?: string }
  | { kind: "not_escalated" }
  | { kind: "appointment"; contactEmail: string; start?: string }
  | { kind: "no_appointment_for"; contactEmail: string }
  | { kind: "followup_recorded"; invoiceNumber: string }
  | { kind: "no_followup"; invoiceNumber: string }
  | { kind: "flag"; code: string }
  | { kind: "case_status"; caseId: string; status: string }
  | { kind: "contact_field"; email: string; field: "phone" | "status" | "owner"; equals: string }
  | { kind: "report_includes"; text: string }
  | { kind: "report_excludes"; text: string }
  | { kind: "reconciliation_has"; id: string; issueIncludes: string }
  | { kind: "reconciliation_needs_human"; id: string }
  | { kind: "actions_include"; text: string }
  | { kind: "actions_exclude"; text: string }
  | { kind: "website_includes"; path: string; text: string }
  | { kind: "website_excludes_change"; path: string }
  | { kind: "tests_passed" };

export type Scenario = {
  id: string;
  capabilityCode: string;
  slug: string;
  title: string;
  description: string;
  instruction: string;
  allowedTools: string[];
  payload: Record<string, unknown>;
  expected: Assertion[];
  forbidden: Assertion[];
  criticalOnFail: boolean;
  failureCode: FailureCode;
};

export type AgentRunInput = {
  capabilityCode: string;
  instruction: string;
  allowedTools: string[];
  payload: Record<string, unknown>;
};

export type ProviderAttempt = {
  generationId: string | null;
  servedModel: string | null;
  servedProvider: string | null;
  costUsd: number | null;
  uncertain: boolean;
  finishReason: string | null;
  router?: {
    selectedProvider: string | null;
    strategy: string | null;
    attempt: number | null;
    attempts: unknown[];
    pipeline: unknown[];
  } | null;
};

export type ProviderUsage = {
  inputTokens: number;
  outputTokens: number;
  costUsd: number | null;
  requestCount: number;
  requestedModel: string;
  servedModel: string | null;
  servedProvider: string | null;
  servedProviders: string[];
  generationIds: string[];
  attempts: ProviderAttempt[];
};

export type ToolTraceEntry = {
  name: string;
  arguments: Record<string, unknown>;
  ok: boolean;
  result: unknown;
};

export type AgentRunResult = {
  toolsCalled: string[];
  finished: boolean;
  error?: string;
  usage?: ProviderUsage;
  toolTrace?: ToolTraceEntry[];
  /** True when the configured benchmark was not honored. Do not publish this as a model score. */
  benchmarkInvalid?: boolean;
};

export interface AgentProvider {
  readonly providerId?: string;
  readonly modelId?: string;
  run(input: AgentRunInput, world: import("@/evals/environments/world").World): Promise<AgentRunResult>;
}

export type ScenarioResult = {
  scenarioId: string;
  slug: string;
  title: string;
  success: boolean;
  critical: boolean;
  failureCode: FailureCode | null;
  failureExplanation: string | null;
  runtimeSeconds: number;
  costUsd: number | null;
  inputTokens?: number;
  outputTokens?: number;
  benchmarkInvalid?: boolean;
  provenance?: ProviderUsage;
  actualState: Record<string, unknown>;
};

export type SuiteResult = {
  capabilityCode: string;
  provider: string;
  model: string;
  fixtureVersion: string;
  environmentVersion: string;
  gitSha: string;
  startedAt: string;
  completedAt: string;
  successCount: number;
  failureCount: number;
  totalCount: number;
  criticalFailureCount: number;
  score: number | null;
  status: "green" | "yellow" | "red" | "gray";
  supervision: "low" | "medium" | "high" | "not_recommended";
  cappedByCriticalFailure: boolean;
  totalCostUsd: number | null;
  medianRuntimeSeconds: number;
  benchmarkValid?: boolean;
  invalidReasons?: string[];
  inputTokens?: number;
  outputTokens?: number;
  provenance?: {
    requestedModel: string;
    servedModels: string[];
    servedProviders: string[];
    generationIds: string[];
    attempts: ProviderAttempt[];
    executionConfig?: unknown;
  };
  results: ScenarioResult[];
};

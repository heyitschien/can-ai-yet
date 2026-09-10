export const CAPABILITY_STATUSES = ["green", "yellow", "red", "gray"] as const;
export type CapabilityStatus = (typeof CAPABILITY_STATUSES)[number];

export const EVIDENCE_LEVELS = [
  "unverified",
  "simulation",
  "sandbox",
  "pilot",
  "production",
] as const;
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];

export const SUPERVISION_LEVELS = [
  "low",
  "medium",
  "high",
  "not_recommended",
] as const;
export type SupervisionLevel = (typeof SUPERVISION_LEVELS)[number];

export const REQUEST_STATUSES = [
  "new",
  "reviewing",
  "planned",
  "tested",
  "rejected",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const FAILURE_CODES = [
  "WRONG_RECORD",
  "WRONG_RECIPIENT",
  "UNAUTHORIZED_ACTION",
  "POLICY_VIOLATION",
  "MISSED_EXCEPTION",
  "HALLUCINATED_DATA",
  "INCOMPLETE_TASK",
  "WRONG_DATE",
  "WRONG_AMOUNT",
  "DUPLICATE_ACTION",
  "FAILED_ESCALATION",
  "TOOL_ERROR",
  "MODEL_ERROR",
  "TIMEOUT",
  "OTHER",
] as const;
export type FailureCode = (typeof FAILURE_CODES)[number];

export const MATCH_CONFIDENCE = ["strong", "related", "weak", "none"] as const;
export type MatchConfidence = (typeof MATCH_CONFIDENCE)[number];

export const STATUS_LABEL: Record<CapabilityStatus, string> = {
  green: "Ready with supervision",
  yellow: "Needs supervision",
  red: "Not reliable yet",
  gray: "Insufficient evidence",
};

export const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  unverified: "Unverified",
  simulation: "Simulated environment",
  sandbox: "Real software sandbox",
  pilot: "Controlled real-world pilot",
  production: "Production",
};

export const SUPERVISION_LABEL: Record<SupervisionLevel, string> = {
  low: "Light supervision",
  medium: "Regular supervision",
  high: "Close supervision",
  not_recommended: "Do not delegate",
};

export const STATUS_HINT: Record<CapabilityStatus, string> = {
  green: "Routine instances were reliable enough to be useful under the tested conditions.",
  yellow: "Useful, but the failure rate or edge cases are material.",
  red: "Current systems did not consistently complete this workflow safely.",
  gray: "We have not tested enough to make a claim.",
};

export type BlueprintStep = {
  label: string;
};

export type PublicCapability = {
  id: string;
  code: string;
  slug: string;
  title: string;
  shortDescription: string;
  categorySlug: string;
  categoryName: string;
  status: CapabilityStatus;
  evidenceLevel: EvidenceLevel;
  supervisionLevel: SupervisionLevel;
  currentScore: number | null;
  currentSuccesses: number | null;
  currentTotal: number | null;
  currentCostUsd: number | null;
  currentRuntimeSeconds: number | null;
  currentCriticalFailures: number;
  whatAiCanDo: string[];
  humanRequiredWhen: string[];
  commonFailureModes: string[];
  implementationBlueprint: BlueprintStep[];
  lastTestedAt: string | null;
  published: boolean;
  synonyms: string[];
  modelProvider: string | null;
  modelName: string | null;
  configurationLabel: string | null;
  acceptedRunId: string | null;
};

export type CapabilityChange = {
  id: string;
  capabilityId: string;
  capabilitySlug: string;
  capabilityTitle: string;
  previousScore: number | null;
  newScore: number | null;
  previousStatus: CapabilityStatus | null;
  newStatus: CapabilityStatus;
  reason: string;
  publishedAt: string;
};

export type SearchMatch = {
  capability: PublicCapability;
  confidence: Exclude<MatchConfidence, "none">;
  rankScore: number;
};

export type SearchOutcome = {
  query: string;
  matches: SearchMatch[];
  outcome: "matched" | "not_tested";
};

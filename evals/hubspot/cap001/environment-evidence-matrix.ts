/**
 * HubSpot CAP-001 six-family environment evidence matrix
 * (CAY-20260917-API-AUTH-ENVIRONMENT-EVIDENCE-GAP / #5725051934).
 *
 * Separates API docs from auth-product surface from environment observation
 * from live proof. Dry-only — does not call HubSpot.
 *
 * Rule: scope string in generic API docs ⇏ Service Key grantable here.
 * Do not mark representation UNMAPPED solely because Service Key catalog lacks a scope.
 */

import { CAP001_METADATA_PLAN } from "@/evals/hubspot/cap001/metadata-plan";

export type Cap001MetadataObjectType =
  (typeof CAP001_METADATA_PLAN.objectFamilies)[number];

/** Fail-closed ladder statuses (Mission Control vocabulary). */
export type EvidenceLadderStatus =
  | "DOCUMENTED"
  | "OBSERVED_SELECTABLE"
  | "BLOCKED_AUTH_SURFACE"
  | "UNMAPPED"
  | "LIVE_PROVEN";

/**
 * Pending / unknown is allowed as null — must not be silently upgraded to
 * UNMAPPED or LIVE_PROVEN.
 */
export type EvidenceLadderStatusOrPending = EvidenceLadderStatus | null;

export type FamilyEnvironmentEvidenceRow = {
  objectType: Cap001MetadataObjectType;
  /** Layer 1 — Properties API create/get documents schema scopes for this objectType. */
  apiOperationDocumented: EvidenceLadderStatus;
  /** Layer 1/2 — scope string appears among official Required Scopes OR lists. */
  serviceKeyScopeDocumentedOnApiPage: EvidenceLadderStatus;
  /**
   * Layer 3 — observed selectable on portal 247381023 Service Key UI
   * (human catalog evidence #5724957946).
   */
  serviceKeyScopeObservedSelectable: EvidenceLadderStatus;
  /**
   * Custom property/group representability for cay_* — not inferred from auth catalog alone.
   * null = not yet proven by representation testing.
   */
  customPropertyGroupRepresentability: EvidenceLadderStatusOrPending;
  /** Authoritative read/reset path for run-isolated identity — null until proven. */
  authoritativeReadResetPath: EvidenceLadderStatusOrPending;
  /**
   * Overall live-ready for Service Key schema setup of cay_* on this family.
   * Never LIVE_PROVEN without layer-4 evidence.
   */
  liveReadyStatus: EvidenceLadderStatus;
  notes: string;
};

/** Human-observed Service Key schema catalog — portal 247381023. */
export const HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE = {
  receiptId: "CAY-20260917-HUBSPOT-SERVICE-KEY-SCOPE-CATALOG",
  portalId: "247381023",
  accountName: "CanAIYet CAP-001 Lab",
  observedAt: "2026-09-17",
  observer: "human-owner (Chien)",
  missionControlCommentId: "5724957946",
  evidenceGapWorkOrderCommentId: "5725051934",
  schemaScopesObservedSelectable: [
    "crm.schemas.contacts.read",
    "crm.schemas.contacts.write",
    "crm.schemas.deals.read",
    "crm.schemas.deals.write",
  ] as const,
  schemaScopesNotInObservedCatalog: [
    "crm.schemas.notes.read",
    "crm.schemas.notes.write",
    "crm.schemas.tasks.read",
    "crm.schemas.tasks.write",
    "crm.schemas.meetings.read",
    "crm.schemas.meetings.write",
    "crm.schemas.emails.read",
    "crm.schemas.emails.write",
  ] as const,
  pr33TwelveScopePacketStatus: "SUPERSEDED_NOT_EXECUTABLE_AS_WRITTEN" as const,
} as const;

/** Temporary Service Key setup scopes that are observed selectable in this portal. */
export const CAP001_SERVICE_KEY_OBSERVED_SETUP_SCOPES = [
  ...HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE.schemaScopesObservedSelectable,
].slice().sort() as readonly string[];

/**
 * PR #33 hypothesized 12-scope Service Key envelope (API-docs-only stronger claim).
 * Retained as failed-assumption evidence — not live-executable here.
 */
export const CAP001_PR33_HYPOTHESIZED_TWELVE_SCOPE_PACKET = [
  "crm.schemas.contacts.read",
  "crm.schemas.contacts.write",
  "crm.schemas.deals.read",
  "crm.schemas.deals.write",
  "crm.schemas.emails.read",
  "crm.schemas.emails.write",
  "crm.schemas.meetings.read",
  "crm.schemas.meetings.write",
  "crm.schemas.notes.read",
  "crm.schemas.notes.write",
  "crm.schemas.tasks.read",
  "crm.schemas.tasks.write",
] as const;

export const CAP001_FAMILY_ENVIRONMENT_EVIDENCE: readonly FamilyEnvironmentEvidenceRow[] =
  [
    {
      objectType: "contacts",
      apiOperationDocumented: "DOCUMENTED",
      serviceKeyScopeDocumentedOnApiPage: "DOCUMENTED",
      serviceKeyScopeObservedSelectable: "OBSERVED_SELECTABLE",
      customPropertyGroupRepresentability: null,
      authoritativeReadResetPath: null,
      liveReadyStatus: "OBSERVED_SELECTABLE",
      notes:
        "Service Key UI exposes schemas.contacts.*; cay_* create not LIVE_PROVEN until authorized bounded setup + re-read.",
    },
    {
      objectType: "deals",
      apiOperationDocumented: "DOCUMENTED",
      serviceKeyScopeDocumentedOnApiPage: "DOCUMENTED",
      serviceKeyScopeObservedSelectable: "OBSERVED_SELECTABLE",
      customPropertyGroupRepresentability: null,
      authoritativeReadResetPath: null,
      liveReadyStatus: "OBSERVED_SELECTABLE",
      notes:
        "Service Key UI exposes schemas.deals.*; object deals.read/write grant is a separate mission. Schema setup not LIVE_PROVEN.",
    },
    {
      objectType: "notes",
      apiOperationDocumented: "DOCUMENTED",
      serviceKeyScopeDocumentedOnApiPage: "DOCUMENTED",
      serviceKeyScopeObservedSelectable: "BLOCKED_AUTH_SURFACE",
      customPropertyGroupRepresentability: null,
      authoritativeReadResetPath: null,
      liveReadyStatus: "BLOCKED_AUTH_SURFACE",
      notes:
        "API docs list schemas.notes.*; Service Key catalog does not expose them here. Representability NOT proven — do not call UNMAPPED from catalog absence alone.",
    },
    {
      objectType: "tasks",
      apiOperationDocumented: "DOCUMENTED",
      serviceKeyScopeDocumentedOnApiPage: "DOCUMENTED",
      serviceKeyScopeObservedSelectable: "BLOCKED_AUTH_SURFACE",
      customPropertyGroupRepresentability: null,
      authoritativeReadResetPath: null,
      liveReadyStatus: "BLOCKED_AUTH_SURFACE",
      notes:
        "API docs list schemas.tasks.*; not in observed Service Key catalog. KB lists tasks as BETA activity-property exception — representation still unproven.",
    },
    {
      objectType: "meetings",
      apiOperationDocumented: "DOCUMENTED",
      serviceKeyScopeDocumentedOnApiPage: "DOCUMENTED",
      serviceKeyScopeObservedSelectable: "BLOCKED_AUTH_SURFACE",
      customPropertyGroupRepresentability: null,
      authoritativeReadResetPath: null,
      liveReadyStatus: "BLOCKED_AUTH_SURFACE",
      notes:
        "API docs list schemas.meetings.*; not in observed Service Key catalog. KB lists meetings as activity-property exception — representation still unproven.",
    },
    {
      objectType: "emails",
      apiOperationDocumented: "DOCUMENTED",
      serviceKeyScopeDocumentedOnApiPage: "DOCUMENTED",
      serviceKeyScopeObservedSelectable: "BLOCKED_AUTH_SURFACE",
      customPropertyGroupRepresentability: null,
      authoritativeReadResetPath: null,
      liveReadyStatus: "BLOCKED_AUTH_SURFACE",
      notes:
        "API docs list schemas.emails.*; not in observed Service Key catalog. Do not add connected-email-data-access by substitution. Representability NOT UNMAPPED from catalog alone.",
    },
  ];

export function familyEnvironmentEvidence(
  objectType: Cap001MetadataObjectType,
): FamilyEnvironmentEvidenceRow {
  const row = CAP001_FAMILY_ENVIRONMENT_EVIDENCE.find((r) => r.objectType === objectType);
  if (!row) {
    throw new Error(`Missing environment evidence row for ${objectType}`);
  }
  return row;
}

export type PermissionPacketClaim = {
  authProduct: string;
  targetPortalId: string;
  claimedScopes: readonly string[];
  /** Scopes observed selectable for this auth product in the target environment. */
  observedSelectableScopes: readonly string[];
  /** Optional layer-4 receipt id when live validation was authorized and recorded. */
  liveValidationReceiptId?: string | null;
};

export type PermissionPacketLiveReadyResult = {
  liveReady: boolean;
  missing: string[];
};

/**
 * Regression guard: API-documented scope strings alone never make a packet live-ready.
 * Every claimed scope must be observed selectable on the named auth product in-environment,
 * and a live validation receipt is required for liveReady=true.
 */
export function evaluatePermissionPacketLiveReady(
  packet: PermissionPacketClaim,
): PermissionPacketLiveReadyResult {
  const missing: string[] = [];
  if (!packet.authProduct.trim()) {
    missing.push("authProduct");
  }
  if (!packet.targetPortalId.trim()) {
    missing.push("targetPortalId");
  }
  if (packet.claimedScopes.length === 0) {
    missing.push("claimedScopes");
  }
  const observed = new Set(packet.observedSelectableScopes);
  for (const scope of packet.claimedScopes) {
    if (!observed.has(scope)) {
      missing.push(`scope_not_observed_selectable:${scope}`);
    }
  }
  if (!packet.liveValidationReceiptId) {
    missing.push("liveValidationReceiptId");
  }
  return { liveReady: missing.length === 0, missing };
}

/**
 * Docs-only inference is forbidden: presence of a scope on an API Required Scopes list
 * does not imply Service Key grantability in the lab portal.
 */
export function apiDocScopeImpliesServiceKeyGrantable(_scopeFromApiDocs: string): false {
  return false;
}

export function pr33TwelveScopePacketLiveReadyInLab(): PermissionPacketLiveReadyResult {
  return evaluatePermissionPacketLiveReady({
    authProduct: "HubSpot Service Key",
    targetPortalId: HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE.portalId,
    claimedScopes: CAP001_PR33_HYPOTHESIZED_TWELVE_SCOPE_PACKET,
    observedSelectableScopes:
      HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE.schemaScopesObservedSelectable,
    liveValidationReceiptId: null,
  });
}

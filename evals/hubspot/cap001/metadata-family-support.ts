/**
 * CAP-001 HubSpot metadata family support classification
 * (CAY-20260917-HUBSPOT-METADATA-SCOPE-CATALOG-CORRECTION).
 *
 * Authority order for *Service Key executability*:
 * 1. Live portal Service Key scope catalog observation (portal 247381023)
 * 2. Live read-only preflight outcomes under the runtime contacts key
 * 3. Official HubSpot docs (Properties API + Knowledge Base)
 *
 * Generic Properties API docs listing `crm.schemas.{family}.*` is **not** proof
 * that a Service Key can grant those scopes in this account.
 *
 * Dry-only — does not call HubSpot or grant scopes.
 */

import { CAP001_METADATA_PLAN } from "@/evals/hubspot/cap001/metadata-plan";

export type Cap001MetadataObjectType =
  (typeof CAP001_METADATA_PLAN.objectFamilies)[number];

export type MetadataFamilySupportClass =
  | "SUPPORTED_SERVICE_KEY"
  | "UI_ONLY_OR_BETA"
  | "ALTERNATE_AUTH_REQUIRED"
  | "UNMAPPED";

export type MetadataFamilySupportRow = {
  objectType: Cap001MetadataObjectType;
  classification: MetadataFamilySupportClass;
  /** Observed in portal 247381023 Service Key scope selector (human, 2026-09-17). */
  serviceKeyCatalogExposesSchemaScopes: boolean;
  /** Official Properties API create/get pages list schemas.{family}.* (retrieval 2026-09-17/18). */
  propertiesApiDocumentsSchemaScopes: boolean;
  /** KB: activity props excluding calls/meetings/tasks(BETA) stored separately from CRM object props. */
  kbCustomPropertySettingsEditable: boolean | "unknown" | "beta_exception";
  /** Read-only preflight GET /crm/properties/2026-09/{objectType} under contacts-only key. */
  contactsKeyPropertyCatalogRead:
    | "ok_200"
    | "blocked_403"
    | "not_attempted";
  contactsKeyPropertyCatalogBlocker: string | null;
  /** Can a temporary Service Key in this portal authorize schema create for cay_*? */
  serviceKeyCanAuthorizeSchemaCreate: boolean;
  failClosedReason: string;
  evidence: readonly string[];
};

/** Human-observed Service Key scope catalog — portal 247381023 / CanAIYet CAP-001 Lab. */
export const HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE = {
  receiptId: "CAY-20260917-HUBSPOT-SERVICE-KEY-SCOPE-CATALOG",
  portalId: "247381023",
  accountName: "CanAIYet CAP-001 Lab",
  observedAt: "2026-09-17",
  observer: "human-owner (Chien)",
  missionControlCommentId: "5724957946",
  /** Scopes the Service Key UI exposes among CRM schema scopes relevant to CAP-001. */
  schemaScopesExposed: [
    "crm.schemas.contacts.read",
    "crm.schemas.contacts.write",
    "crm.schemas.deals.read",
    "crm.schemas.deals.write",
  ] as const,
  /** Scopes PR #33 assumed but are NOT in this portal's Service Key selector. */
  schemaScopesNotExposed: [
    "crm.schemas.notes.read",
    "crm.schemas.notes.write",
    "crm.schemas.tasks.read",
    "crm.schemas.tasks.write",
    "crm.schemas.meetings.read",
    "crm.schemas.meetings.write",
    "crm.schemas.emails.read",
    "crm.schemas.emails.write",
  ] as const,
  scientificClassification:
    "environment_permission_or_representation_mismatch_not_model_failure" as const,
  doNot: [
    "blame_model",
    "widen_privileges_by_substitution",
    "create_temporary_setup_key_with_unlisted_scopes",
    "create_groups_or_properties",
    "alter_runtime_commissioning_key",
    "start_deals_scope_grant",
    "run_live_provisioning_or_model_suite",
  ] as const,
} as const;

const KB_ACTIVITY_PROPERTIES =
  "https://knowledge.hubspot.com/properties/hubspots-default-activity-properties";
const CREATE_PROPERTY_DOC =
  "https://developers.hubspot.com/docs/api-reference/latest/crm/properties/create-property.md";
const PORTAL_PREFLIGHT =
  "docs/reviews/CAY-20260917-hubspot-portal-identity-validation.json";
const CATALOG_RECEIPT =
  "docs/reviews/CAY-20260917-hubspot-service-key-scope-catalog.md";

/**
 * Per-family classification from evidence only.
 * Portable CAP-001 exam is unchanged; this is HubSpot lab representation truth.
 */
export const CAP001_METADATA_FAMILY_SUPPORT: readonly MetadataFamilySupportRow[] = [
  {
    objectType: "contacts",
    classification: "SUPPORTED_SERVICE_KEY",
    serviceKeyCatalogExposesSchemaScopes: true,
    propertiesApiDocumentsSchemaScopes: true,
    kbCustomPropertySettingsEditable: true,
    contactsKeyPropertyCatalogRead: "ok_200",
    contactsKeyPropertyCatalogBlocker: null,
    serviceKeyCanAuthorizeSchemaCreate: true,
    failClosedReason:
      "None for Service Key schema create — contacts schemas.* are in the live catalog.",
    evidence: [
      CATALOG_RECEIPT,
      PORTAL_PREFLIGHT,
      CREATE_PROPERTY_DOC,
    ],
  },
  {
    objectType: "deals",
    classification: "SUPPORTED_SERVICE_KEY",
    serviceKeyCatalogExposesSchemaScopes: true,
    propertiesApiDocumentsSchemaScopes: true,
    kbCustomPropertySettingsEditable: true,
    contactsKeyPropertyCatalogRead: "blocked_403",
    contactsKeyPropertyCatalogBlocker: "deals-read (contacts-only runtime key)",
    serviceKeyCanAuthorizeSchemaCreate: true,
    failClosedReason:
      "Schema create via temporary setup key with schemas.deals.* is catalog-supported; runtime contacts-only key cannot read deals schema until deals-read or schemas.deals.read is on the calling key.",
    evidence: [
      CATALOG_RECEIPT,
      PORTAL_PREFLIGHT,
      CREATE_PROPERTY_DOC,
    ],
  },
  {
    objectType: "notes",
    classification: "UNMAPPED",
    serviceKeyCatalogExposesSchemaScopes: false,
    propertiesApiDocumentsSchemaScopes: true,
    kbCustomPropertySettingsEditable: false,
    contactsKeyPropertyCatalogRead: "ok_200",
    contactsKeyPropertyCatalogBlocker: null,
    serviceKeyCanAuthorizeSchemaCreate: false,
    failClosedReason:
      "Service Key catalog lacks schemas.notes.*; KB stores note activity properties separately from CRM object property settings (not editable there). Do not substitute object scopes. Per-note cay_* via Service Key is not executable — fail closed / UNMAPPED for that representation.",
    evidence: [
      CATALOG_RECEIPT,
      KB_ACTIVITY_PROPERTIES,
      PORTAL_PREFLIGHT,
      CREATE_PROPERTY_DOC,
    ],
  },
  {
    objectType: "emails",
    classification: "UNMAPPED",
    serviceKeyCatalogExposesSchemaScopes: false,
    propertiesApiDocumentsSchemaScopes: true,
    kbCustomPropertySettingsEditable: false,
    contactsKeyPropertyCatalogRead: "blocked_403",
    contactsKeyPropertyCatalogBlocker: "connected-email-data-access",
    serviceKeyCanAuthorizeSchemaCreate: false,
    failClosedReason:
      "Service Key catalog lacks schemas.emails.*; KB excludes emails from CRM object property settings; contacts-only preflight property catalog read requires connected-email-data-access (do not silently add). Per-email cay_* via Service Key is UNMAPPED.",
    evidence: [
      CATALOG_RECEIPT,
      KB_ACTIVITY_PROPERTIES,
      PORTAL_PREFLIGHT,
      CREATE_PROPERTY_DOC,
    ],
  },
  {
    objectType: "tasks",
    classification: "UI_ONLY_OR_BETA",
    serviceKeyCatalogExposesSchemaScopes: false,
    propertiesApiDocumentsSchemaScopes: true,
    kbCustomPropertySettingsEditable: "beta_exception",
    contactsKeyPropertyCatalogRead: "ok_200",
    contactsKeyPropertyCatalogBlocker: null,
    serviceKeyCanAuthorizeSchemaCreate: false,
    failClosedReason:
      "Service Key catalog lacks schemas.tasks.*; KB lists tasks as a BETA exception to the activity-property storage rule, but Service Key cannot grant schema create. Treat UI/beta as unverified in this portal until separate evidence — fail closed for Service Key provisioning.",
    evidence: [
      CATALOG_RECEIPT,
      KB_ACTIVITY_PROPERTIES,
      PORTAL_PREFLIGHT,
      CREATE_PROPERTY_DOC,
    ],
  },
  {
    objectType: "meetings",
    classification: "UI_ONLY_OR_BETA",
    serviceKeyCatalogExposesSchemaScopes: false,
    propertiesApiDocumentsSchemaScopes: true,
    kbCustomPropertySettingsEditable: "beta_exception",
    contactsKeyPropertyCatalogRead: "ok_200",
    contactsKeyPropertyCatalogBlocker: null,
    serviceKeyCanAuthorizeSchemaCreate: false,
    failClosedReason:
      "Service Key catalog lacks schemas.meetings.*; KB lists meetings as an exception; community/public beta exists for custom meeting properties, but Service Key cannot grant schema create. Fail closed for Service Key provisioning until portal UI evidence.",
    evidence: [
      CATALOG_RECEIPT,
      KB_ACTIVITY_PROPERTIES,
      PORTAL_PREFLIGHT,
      CREATE_PROPERTY_DOC,
    ],
  },
] as const;

export function metadataFamilySupport(
  objectType: Cap001MetadataObjectType,
): MetadataFamilySupportRow {
  const row = CAP001_METADATA_FAMILY_SUPPORT.find((r) => r.objectType === objectType);
  if (!row) {
    throw new Error(`Missing metadata family support row for ${objectType}`);
  }
  return row;
}

export function serviceKeySchemaSupportedFamilies(): Cap001MetadataObjectType[] {
  return CAP001_METADATA_FAMILY_SUPPORT.filter(
    (r) => r.classification === "SUPPORTED_SERVICE_KEY",
  ).map((r) => r.objectType);
}

export function serviceKeySchemaUnsupportedFamilies(): Cap001MetadataObjectType[] {
  return CAP001_METADATA_FAMILY_SUPPORT.filter(
    (r) => r.classification !== "SUPPORTED_SERVICE_KEY",
  ).map((r) => r.objectType);
}

/** Exact temporary Service Key setup envelope that is catalog-executable in portal 247381023. */
export const CAP001_SERVICE_KEY_EXECUTABLE_SETUP_SCOPES = [
  "crm.schemas.contacts.read",
  "crm.schemas.contacts.write",
  "crm.schemas.deals.read",
  "crm.schemas.deals.write",
] as const;

/**
 * Scopes that appear on official Properties API pages but are NOT grantable via this
 * portal's Service Key selector. Documented ≠ executable here.
 */
export const CAP001_DOCUMENTED_BUT_NOT_SERVICE_KEY_CATALOG_SCOPES =
  HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE.schemaScopesNotExposed;

/**
 * Dry evaluation: can association-only + native HubSpot activity IDs replace per-activity cay_*
 * without false positives for reset/observe?
 *
 * Returns fail-closed findings — does not mutate HubSpot.
 */
export type ActivityIdentityAlternativeFinding = {
  strategy: string;
  preservesExam: boolean;
  falsePositiveRisk: "none" | "high" | "unproven";
  verdict: "viable_with_controls" | "reject_fail_closed";
  reason: string;
};

export function evaluateActivityCayPropertyAlternatives(): ActivityIdentityAlternativeFinding[] {
  return [
    {
      strategy: "association_only_archive_all_activities_on_seeded_contacts",
      preservesExam: true,
      falsePositiveRisk: "high",
      verdict: "reject_fail_closed",
      reason:
        "Baseline contacts are reused across runs. Archiving every associated note/task/meeting/email would destroy unrelated portal activities and prior-run leftovers that share the contact association — false positives against reset isolation.",
    },
    {
      strategy: "encode_run_or_fixture_id_only_in_native_body_or_subject",
      preservesExam: true,
      falsePositiveRisk: "high",
      verdict: "reject_fail_closed",
      reason:
        "Model-written or human-written hs_note_body / hs_task_subject / email subject can collide with any delimiter protocol; observe/reset would mis-attribute or miss records — false positives/negatives.",
    },
    {
      strategy: "trust_cay_contact_email_property_without_association",
      preservesExam: true,
      falsePositiveRisk: "high",
      verdict: "reject_fail_closed",
      reason:
        "Existing adapter law: cay_contact_email is auxiliary only; authoritative ownership is associations.contacts. Property-alone identity is already fail-closed.",
    },
    {
      strategy:
        "seed_time_native_hubspot_id_ledger_plus_contact_association_verify",
      preservesExam: true,
      falsePositiveRisk: "unproven",
      verdict: "viable_with_controls",
      reason:
        "Cheapest faithful candidate: during seed, record returned HubSpot activity IDs keyed by (runId, fixtureId, family) in a lab control-plane ledger (not exam content); reset archives only ledger IDs; reads verify contact association. Still requires a durable ledger store and separate authorization — not implemented here. Until proven live, activity families lacking cay_* stay representation-blocked / UNMAPPED for predicates that need run-isolated observe/reset.",
    },
    {
      strategy: "contacts_and_deals_cay_properties_only_activities_unmapped",
      preservesExam: true,
      falsePositiveRisk: "none",
      verdict: "viable_with_controls",
      reason:
        "Preserve fixture/run/scenario identity on contacts+deals via Service Key–executable schema scopes. Mark notes/emails UNMAPPED and tasks/meetings UI_ONLY_OR_BETA (unverified) for per-activity cay_* until a proven alternative. Portable exam unchanged; HubSpot live comparison excludes unfaithful representations.",
    },
  ];
}

export function cheapestFaithfulIdentityPreservationProposal(): {
  examUnchanged: true;
  serviceKeySetupScopes: readonly string[];
  provisionCayPropertiesOn: readonly Cap001MetadataObjectType[];
  doNotProvisionViaServiceKey: readonly Cap001MetadataObjectType[];
  activityPath: string;
  stopConditions: readonly string[];
} {
  return {
    examUnchanged: true,
    serviceKeySetupScopes: [...CAP001_SERVICE_KEY_EXECUTABLE_SETUP_SCOPES],
    provisionCayPropertiesOn: serviceKeySchemaSupportedFamilies(),
    doNotProvisionViaServiceKey: serviceKeySchemaUnsupportedFamilies(),
    activityPath:
      "Prefer seed-time native HubSpot ID ledger + association verify (viable_with_controls, unproven). Until authorized and proven, fail closed: do not invent activity cay_* via privilege substitution; keep notes/emails UNMAPPED and tasks/meetings UI_ONLY_OR_BETA for custom metadata.",
    stopConditions: [
      "No temporary setup key with scopes absent from Service Key catalog",
      "No connected-email-data-access without new work order",
      "No activity object-scope widening to fake schema support",
      "No live group/property create in this correction",
    ],
  };
}

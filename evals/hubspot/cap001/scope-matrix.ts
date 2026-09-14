/**
 * Exact CAP-001 → HubSpot least-authority matrix (CAY-08 provenance).
 *
 * Sourced from HubSpot "Required Scopes" accordions on dated OpenAPI pages
 * (retrieved 2026-09-13). Do not expand the Service Key from this file alone.
 *
 * BLOCKED_SCOPE = verified missing OAuth scope for the chosen endpoint.
 * BLOCKED_ADAPTER = current scopes suffice (or N/A local), but live CAP-001 code is missing.
 */

export type Cap001ScopeGrant = "already_granted" | "genuinely_new" | "not_required" | "setup_once_not_runtime";

export type Cap001ToolLiveBlock =
  | "READY"
  | "BLOCKED_SCOPE"
  | "BLOCKED_ADAPTER"
  | "LOCAL_ONLY";

export type Cap001HubSpotScopeRow = {
  tool: string;
  hubSpotRepresentation: string;
  action: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" | "LOCAL";
  endpoint: string;
  apiVersion: string;
  requiredScopes: readonly string[];
  /** How HubSpot documents multiple scopes on the Required Scopes accordion. */
  scopeLogic: "all" | "any" | "none";
  grant: Cap001ScopeGrant;
  liveBlock: Cap001ToolLiveBlock;
  docSource: string;
  notes?: string;
};

/** Scopes on the current CanAIYet CAP-001 Lab Service Key (unchanged). */
export const HUBSPOT_GRANTED_SCOPES = [
  "crm.objects.contacts.read",
  "crm.objects.contacts.write",
] as const;

/**
 * Per-object-family API version *summary* (not authority for every operation).
 * Contacts stay on proven `2026-03` (CAY-06).
 * Notes/tasks create/list/archive use settled `2026-09`.
 * Meetings/emails create/list use `2026-09`; **archive is DOC_CONFLICT** (not live-ready).
 * Deals are **operation-level**: create/read/update use `2026-09`; archive uses `2026-03`.
 * Exact operation matrix is the authority — see `HUBSPOT_CAP001_API_VERSIONS_BY_OPERATION`.
 */
export const HUBSPOT_CAP001_API_VERSIONS_BY_FAMILY = {
  contacts: "2026-03",
  notes: "2026-09",
  tasks: "2026-09",
  /** Summary — meetings.archive is DOC_CONFLICT; do not treat as archive authority. */
  meetings: "mixed-operation-level",
  /** Summary — emails.archive is DOC_CONFLICT; do not treat as archive authority. */
  emails: "mixed-operation-level",
  /** Summary only — Deal archive is 2026-03; do not treat this as archive authority. */
  deals: "mixed-operation-level",
  /**
   * Properties create is setup-only (latest OpenAPI 2026-09). Runtime Service Key must not
   * hold schema-write.
   */
  properties: "2026-09",
} as const;

/**
 * Operation-level HubSpot dated API pins for CAP-001.
 * Never infer a destructive/reset path version from create/read/update of the same object family.
 * notes/tasks archive settled 2026-09; meetings/emails archive = DOC_CONFLICT (not live-ready);
 * Deal archive stays operation-level 2026-03 (CAY-08).
 */
export const HUBSPOT_CAP001_API_VERSIONS_BY_OPERATION = {
  "contacts.search": "2026-03",
  "contacts.read": "2026-03",
  "contacts.write": "2026-03",
  "notes.create": "2026-09",
  "notes.list": "2026-09",
  "notes.archive": "2026-09",
  "tasks.create": "2026-09",
  "tasks.list": "2026-09",
  "tasks.archive": "2026-09",
  "meetings.create": "2026-09",
  "meetings.read": "2026-09",
  "meetings.list": "2026-09",
  /** OpenAPI 2026-09 vs rendered/dated 2026-03 — not live-authorized. */
  "meetings.archive": "DOC_CONFLICT",
  "emails.create": "2026-09",
  "emails.list": "2026-09",
  /** OpenAPI 2026-09 vs rendered/dated 2026-03 — not live-authorized. */
  "emails.archive": "DOC_CONFLICT",
  "deals.create": "2026-09",
  "deals.read": "2026-09",
  "deals.update": "2026-09",
  "deals.archive": "2026-03",
  "deals.batch_archive": "2026-03",
  "properties.create": "2026-09",
} as const;

/** Official Deal object type ID (object definition). */
export const HUBSPOT_DEAL_OBJECT_TYPE_ID = "0-3";

export type HubSpotCap001ApiFamily = keyof typeof HUBSPOT_CAP001_API_VERSIONS_BY_FAMILY;

/**
 * Exact matrix for every CAP-001 stable tool semantic
 * (`evals/capabilities/lead-followup/scenarios.ts` allowedTools).
 */
export const CAP001_HUBSPOT_SCOPE_MATRIX: readonly Cap001HubSpotScopeRow[] = [
  {
    tool: "search_contact",
    hubSpotRepresentation: "Contact search",
    action: "search",
    method: "POST",
    endpoint: "/crm/objects/2026-03/contacts/search",
    apiVersion: "2026-03",
    requiredScopes: ["crm.objects.contacts.read"],
    scopeLogic: "all",
    grant: "already_granted",
    liveBlock: "READY",
    docSource:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/contacts/search/search-contacts",
  },
  {
    tool: "get_contact",
    hubSpotRepresentation: "Contact",
    action: "read",
    method: "GET",
    endpoint: "/crm/objects/2026-03/contacts/{contactId}",
    apiVersion: "2026-03",
    requiredScopes: ["crm.objects.contacts.read"],
    scopeLogic: "all",
    grant: "already_granted",
    liveBlock: "READY",
    docSource:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/contacts/get-contact",
    notes: "CAY-10 Cap001HubSpotHttpClient + LiveHubSpotCap001Adapter dry-certified (injected HTTP).",
  },
  {
    tool: "create_task",
    hubSpotRepresentation: "Task engagement",
    action: "create",
    method: "POST",
    endpoint: "/crm/objects/2026-09/tasks",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    grant: "already_granted",
    liveBlock: "READY",
    docSource:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/tasks/create-task",
  },
  {
    tool: "get_deal",
    hubSpotRepresentation: "Deal (object type 0-3)",
    action: "read",
    method: "GET",
    endpoint: "/crm/objects/2026-09/0-3/{dealId}",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.deals.read"],
    scopeLogic: "all",
    grant: "genuinely_new",
    liveBlock: "BLOCKED_SCOPE",
    docSource: "https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/get-deal",
    notes: "Official 2026-09 Deal reference uses object-type ID 0-3, not the /deals path alias.",
  },
  {
    tool: "update_deal",
    hubSpotRepresentation: "Deal (object type 0-3)",
    action: "update",
    method: "PATCH",
    endpoint: "/crm/objects/2026-09/0-3/{dealId}",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.deals.write"],
    scopeLogic: "all",
    grant: "genuinely_new",
    liveBlock: "BLOCKED_SCOPE",
    docSource: "https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/update-deal",
    notes: "Official 2026-09 Deal reference uses object-type ID 0-3, not the /deals path alias.",
  },
  {
    tool: "add_note",
    hubSpotRepresentation: "Note engagement",
    action: "create",
    method: "POST",
    endpoint: "/crm/objects/2026-09/notes",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    grant: "already_granted",
    liveBlock: "READY",
    docSource:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/notes/create-note",
  },
  {
    tool: "draft_reply",
    hubSpotRepresentation: "Local draft (not HubSpot)",
    action: "compose",
    method: "LOCAL",
    endpoint: "(local)",
    apiVersion: "n/a",
    requiredScopes: [],
    scopeLogic: "none",
    grant: "not_required",
    liveBlock: "LOCAL_ONLY",
    docSource: "n/a",
    notes: "Composition stays local; HubSpot only receives Envelope A engagement logs via send_reply.",
  },
  {
    tool: "send_reply",
    hubSpotRepresentation: "Email engagement log (Envelope A; not marketing send)",
    action: "create",
    method: "POST",
    endpoint: "/crm/objects/2026-09/emails",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write", "sales-email-read"],
    scopeLogic: "any",
    grant: "already_granted",
    liveBlock: "BLOCKED_ADAPTER",
    docSource:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/emails/create-email",
    notes:
      "Required Scopes accordion lists contacts.write OR sales-email-read. contacts.write is already granted. Family not READY: emails.archive is DOC_CONFLICT (OpenAPI 2026-09 vs rendered/dated 2026-03) — no deterministic reset/cleanup path.",
  },
  {
    tool: "get_policy",
    hubSpotRepresentation: "Local policy pack",
    action: "read",
    method: "LOCAL",
    endpoint: "(local)",
    apiVersion: "n/a",
    requiredScopes: [],
    scopeLogic: "none",
    grant: "not_required",
    liveBlock: "LOCAL_ONLY",
    docSource: "n/a",
  },
  {
    tool: "get_availability",
    hubSpotRepresentation: "Meeting engagements (read for conflict/open-slot)",
    action: "read",
    method: "GET",
    endpoint: "/crm/objects/2026-09/meetings/{meetingId}",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.read"],
    scopeLogic: "all",
    grant: "already_granted",
    liveBlock: "BLOCKED_ADAPTER",
    docSource:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/meetings/get-meeting",
    notes:
      "Create/list OpenAPI settled 2026-09, but appointments family not READY: meetings.archive is DOC_CONFLICT — no deterministic reset/cleanup path.",
  },
  {
    tool: "create_appointment",
    hubSpotRepresentation: "Meeting engagement",
    action: "create",
    method: "POST",
    endpoint: "/crm/objects/2026-09/meetings",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    grant: "already_granted",
    liveBlock: "BLOCKED_ADAPTER",
    docSource:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/meetings/create-meeting",
    notes:
      "Create path settled 2026-09; appointments family not READY while meetings.archive remains DOC_CONFLICT.",
  },
  {
    tool: "escalate",
    hubSpotRepresentation: "Task engagement (escalation marker) and/or note",
    action: "create",
    method: "POST",
    endpoint: "/crm/objects/2026-09/tasks",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    grant: "already_granted",
    liveBlock: "READY",
    docSource:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/tasks/create-task",
    notes: "Prefer task/note under contact scopes; do not invent a ticket scope for CAP-001 Envelope A.",
  },
  {
    tool: "flag",
    hubSpotRepresentation: "Contact property value and/or note",
    action: "update",
    method: "PATCH",
    endpoint: "/crm/objects/2026-03/contacts/{contactId}",
    apiVersion: "2026-03",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    grant: "already_granted",
    liveBlock: "READY",
    docSource:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/contacts/update-contact",
    notes:
      "Writing flag values needs contacts.write once custom properties exist. Property definition is setup-once (see metadata row), not a permanent runtime schema scope.",
  },
];

/**
 * Environment-owned Deal lifecycle (not model-facing tools).
 * Justifies crm.objects.deals.read/write for live CAP-001 seed → snapshot → reset.
 * Create/read/update use documented 2026-09 `0-3` paths; archive is a separate 2026-03 operation.
 */
export const CAP001_HUBSPOT_DEAL_ENV_LIFECYCLE: readonly Cap001HubSpotScopeRow[] = [
  {
    tool: "env.seed_deal",
    hubSpotRepresentation: "Deal (object type 0-3)",
    action: "create (baseline seed)",
    method: "POST",
    endpoint: "/crm/objects/2026-09/0-3",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.deals.write"],
    scopeLogic: "all",
    grant: "genuinely_new",
    liveBlock: "BLOCKED_SCOPE",
    docSource: "https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/create-deal",
    notes: "Environment mechanics: materialize baseline CAP-001 deals during seedBaseline.",
  },
  {
    tool: "env.authoritative_read_deal",
    hubSpotRepresentation: "Deal (object type 0-3)",
    action: "read (authoritative snapshot)",
    method: "GET",
    endpoint: "/crm/objects/2026-09/0-3/{dealId}",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.deals.read"],
    scopeLogic: "all",
    grant: "genuinely_new",
    liveBlock: "BLOCKED_SCOPE",
    docSource: "https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/get-deal",
    notes: "Environment mechanics: complete fixture-graph snapshot requires deal visibility.",
  },
  {
    tool: "env.archive_deal",
    hubSpotRepresentation: "Deal (object type 0-3)",
    action: "archive/reset cleanup",
    method: "DELETE",
    endpoint: "/crm/objects/2026-03/{objectType}/{objectId}",
    apiVersion: "2026-03",
    requiredScopes: ["crm.objects.deals.write"],
    scopeLogic: "all",
    grant: "genuinely_new",
    liveBlock: "BLOCKED_SCOPE",
    docSource:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/deals/delete-deal",
    notes:
      `Archive is operation-level provenance and must not inherit deals create/read/update 2026-09. Documented template DELETE /crm/objects/2026-03/{objectType}/{objectId}; bind objectType=${HUBSPOT_DEAL_OBJECT_TYPE_ID} from Deal object definition (effective DELETE /crm/objects/2026-03/0-3/{objectId}). Retrieved 2026-09-13.`,
  },
  {
    tool: "env.batch_archive_deal",
    hubSpotRepresentation: "Deal (object type 0-3)",
    action: "batch archive/reset cleanup",
    method: "POST",
    endpoint: "/crm/objects/2026-03/0-3/batch/archive",
    apiVersion: "2026-03",
    requiredScopes: ["crm.objects.deals.write"],
    scopeLogic: "all",
    grant: "genuinely_new",
    liveBlock: "BLOCKED_SCOPE",
    docSource:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/deals/batch/delete-deals",
    notes:
      "Exact dated batch-archive path (2026-03). Do not extrapolate batch archive from create/read/update 2026-09 or from the latest redirect alone.",
  },
];

/** Combined tool + environment Deal rows used for grant/delta calculation. */
export const CAP001_HUBSPOT_SCOPE_MATRIX_WITH_ENV: readonly Cap001HubSpotScopeRow[] = [
  ...CAP001_HUBSPOT_SCOPE_MATRIX,
  ...CAP001_HUBSPOT_DEAL_ENV_LIFECYCLE,
];

/** One-time test-account provisioning — not a runtime Service Key grant. */
export const CAP001_HUBSPOT_METADATA_PROVISIONING = {
  strategy: "one_time_human_or_setup_path" as const,
  avoidRuntimeScopes: ["crm.schemas.contacts.write"] as const,
  properties: [
    "cay_fixture_id",
    "cay_run_id",
    "cay_scenario_id",
    "do_not_contact / DNC representation",
    "tags / handled-today style markers",
    "flag codes (if not encoded as notes)",
  ] as const,
  /**
   * Setup-only: POST /crm/properties/2026-09/{objectType} from latest create-property OpenAPI
   * (HubSpotDev fetch-doc 2026-09-14). Runtime schema-write remains 0.
   */
  createPropertyEndpoint: "POST /crm/properties/2026-09/{objectType}",
  createPropertyDoc:
    "https://developers.hubspot.com/docs/api-reference/latest/crm/properties/create-property",
  createPropertyScopeFamily: "crm.schemas.contacts.write (among OR alternatives on the create-property page)",
  engagementObjectTypes: ["notes", "tasks", "meetings", "emails"] as const,
  objectTypesNeedingCayProperties: [
    "contacts",
    "deals",
    "notes",
    "tasks",
    "meetings",
    "emails",
  ] as const,
  rationale:
    "Prefer provisioning custom test metadata once in the HubSpot test portal (UI or a short-lived setup credential). Runtime Service Key keeps contacts.read/write (+ deals only if accepted later) without permanent schema-write authority. Activity cay_* properties are required for this adapter (not optional).",
};

/** Environment-level truth: full CAP-001 live seed/snapshot needs deals even when a scenario never mutates them. */
export const CAP001_LIVE_ENVIRONMENT_SCOPE_BLOCKER =
  "Full CAP-001 live seed/preflight/authoritative snapshot requires baseline deals via crm.objects.deals.read/write (verified missing). Settled contact-scoped families (contacts/notes/tasks/escalations/flags) are READY at the CAY-10 adapter/tool layer under contacts scopes (dry-certified; no live suite). outbounds/appointments remain BLOCKED_ADAPTER while emails.archive/meetings.archive are DOC_CONFLICT.";

export function genuinelyNewScopesFromMatrix(
  rows: readonly Cap001HubSpotScopeRow[] = CAP001_HUBSPOT_SCOPE_MATRIX_WITH_ENV,
): string[] {
  const needed = new Set<string>();
  for (const row of rows) {
    if (row.grant !== "genuinely_new") continue;
    for (const scope of row.requiredScopes) needed.add(scope);
  }
  return [...needed].sort();
}

export function toolRowsBlockedAdapter(
  rows: readonly Cap001HubSpotScopeRow[] = CAP001_HUBSPOT_SCOPE_MATRIX,
): Cap001HubSpotScopeRow[] {
  return rows.filter((row) => row.liveBlock === "BLOCKED_ADAPTER");
}

export function toolRowsBlockedScope(
  rows: readonly Cap001HubSpotScopeRow[] = CAP001_HUBSPOT_SCOPE_MATRIX_WITH_ENV,
): Cap001HubSpotScopeRow[] {
  return rows.filter((row) => row.liveBlock === "BLOCKED_SCOPE");
}

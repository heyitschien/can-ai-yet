/**
 * CAP-001 HubSpot path + association constants (CAY-10).
 *
 * Paths match accepted CAY-08 provenance in scope-matrix.ts, with CAY-09/CAY-10
 * activity-archive correction for notes/tasks (settled 2026-09) and create-property
 * (settled 2026-09). meetings.archive / emails.archive are DOC_CONFLICT (retrieval
 * 2026-09-14) — not live-authorized; see DOC_CONFLICT_* markers.
 * Association type IDs from HubSpot associate-records guide (HUBSPOT_DEFINED).
 * Retrieval date for this module: 2026-09-14.
 */

/** Default HubSpot CRM API host. */
export const HUBSPOT_API_BASE_URL = "https://api.hubapi.com";

/** Contacts remain on proven 2026-03 (CAY-06 / CAY-08). */
export const CAP001_CONTACTS_API_VERSION = "2026-03";

/** Notes/tasks/meetings/emails create/list + deal create/read/update use 2026-09. */
export const CAP001_ACTIVITIES_API_VERSION = "2026-09";
export const CAP001_DEALS_CRUD_API_VERSION = "2026-09";

/** Deal archive is operation-level 2026-03 — do not inherit CRUD version (CAY-08). */
export const CAP001_DEALS_ARCHIVE_API_VERSION = "2026-03";

/**
 * Official Deal object type ID.
 * Source: https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/get-deal
 * Retrieved: 2026-09-14 (same ID accepted 2026-09-13 in CAY-08).
 */
export const HUBSPOT_DEAL_OBJECT_TYPE_ID = "0-3";

/**
 * Default HUBSPOT_DEFINED association type IDs.
 * Source: https://developers.hubspot.com/docs/api-reference/latest/crm/associations/associate-records/guide
 * Retrieved: 2026-09-14
 * Deal → Contact = 3 (HUBSPOT_DEFINED) from the same associate-records guide.
 */
export const HUBSPOT_ASSOC_NOTE_TO_CONTACT = 202;
export const HUBSPOT_ASSOC_TASK_TO_CONTACT = 204;
export const HUBSPOT_ASSOC_MEETING_TO_CONTACT = 200;
export const HUBSPOT_ASSOC_EMAIL_TO_CONTACT = 198;
/** Deal → Contact (HUBSPOT_DEFINED). Associate-records guide: Deal to contact = 3. */
export const HUBSPOT_ASSOC_DEAL_TO_CONTACT = 3;

/**
 * DOC_CONFLICT markers (vendor protocol: STOP contested fact; do not silently pick).
 * OpenAPI embedded on latest delete pages vs independent rendered-reference observation
 * of the same latest URLs + dated 2026-03 pages (retrieval 2026-09-14).
 */
export const DOC_CONFLICT_MEETINGS_ARCHIVE =
  "DOC_CONFLICT: meetings.archive — OpenAPI 2026-09 vs rendered/dated 2026-03 (retrieval 2026-09-14)";

export const DOC_CONFLICT_EMAILS_ARCHIVE =
  "DOC_CONFLICT: emails.archive — OpenAPI 2026-09 vs rendered/dated 2026-03 (retrieval 2026-09-14)";

/** Contested OpenAPI side (latest page embed / HTML scrape, 2026-09-14). Not live-authorized. */
export const CAP001_MEETINGS_ARCHIVE_OPENAPI_PATH_TEMPLATE =
  "/crm/objects/2026-09/meetings/{meetingId}";
export const CAP001_EMAILS_ARCHIVE_OPENAPI_PATH_TEMPLATE =
  "/crm/objects/2026-09/emails/{emailId}";

/** Contested rendered/dated side (independent observation + dated pages, 2026-09-14). */
export const CAP001_MEETINGS_ARCHIVE_RENDERED_PATH_TEMPLATE =
  "/crm/objects/2026-03/{objectType}/{objectId}";
export const CAP001_EMAILS_ARCHIVE_RENDERED_PATH_TEMPLATE =
  "/crm/objects/2026-03/emails/{emailId}";

/** One-time provisioned custom properties (runtime writes values only). */
export const CAP001_PROP_FIXTURE_ID = "cay_fixture_id";
export const CAP001_PROP_RUN_ID = "cay_run_id";
export const CAP001_PROP_SCENARIO_ID = "cay_scenario_id";
export const CAP001_PROP_STATUS = "cay_status";
export const CAP001_PROP_DO_NOT_CONTACT = "cay_do_not_contact";
export const CAP001_PROP_TAGS = "cay_tags";
export const CAP001_PROP_OWNER = "cay_owner";
export const CAP001_PROP_KIND = "cay_kind";
export const CAP001_PROP_CONTACT_EMAIL = "cay_contact_email";
export const CAP001_PROP_FLAG_CODE = "cay_flag_code";
export const CAP001_PROP_FLAG_MESSAGE = "cay_flag_message";
export const CAP001_PROP_ESCALATION_REASON = "cay_escalation_reason";

export const CAP001_CONTACTS_BASE_PATH = `/crm/objects/${CAP001_CONTACTS_API_VERSION}/contacts`;
export const CAP001_CONTACTS_SEARCH_PATH = `${CAP001_CONTACTS_BASE_PATH}/search`;

export const CAP001_NOTES_BASE_PATH = `/crm/objects/${CAP001_ACTIVITIES_API_VERSION}/notes`;
export const CAP001_TASKS_BASE_PATH = `/crm/objects/${CAP001_ACTIVITIES_API_VERSION}/tasks`;
export const CAP001_MEETINGS_BASE_PATH = `/crm/objects/${CAP001_ACTIVITIES_API_VERSION}/meetings`;
export const CAP001_EMAILS_BASE_PATH = `/crm/objects/${CAP001_ACTIVITIES_API_VERSION}/emails`;

export const CAP001_DEALS_CRUD_BASE_PATH = `/crm/objects/${CAP001_DEALS_CRUD_API_VERSION}/${HUBSPOT_DEAL_OBJECT_TYPE_ID}`;

/** Template: DELETE /crm/objects/2026-03/{objectType}/{objectId} with objectType=0-3 (CAY-08). */
export function cap001DealArchivePath(dealId: string): string {
  return `/crm/objects/${CAP001_DEALS_ARCHIVE_API_VERSION}/${HUBSPOT_DEAL_OBJECT_TYPE_ID}/${encodeURIComponent(dealId)}`;
}

/**
 * Settled activity archive paths (notes/tasks — independently confirmed 2026-09).
 * meetings/emails archive are DOC_CONFLICT — use DOC_CONFLICT_* markers; do not call live.
 */
export function cap001NoteArchivePath(noteId: string): string {
  return `/crm/objects/2026-09/notes/${encodeURIComponent(noteId)}`;
}

export function cap001TaskArchivePath(taskId: string): string {
  return `/crm/objects/2026-09/tasks/${encodeURIComponent(taskId)}`;
}

/**
 * Contested OpenAPI-side path only (evidence). Not live-authorized while DOC_CONFLICT holds.
 */
export function cap001MeetingArchiveOpenApiPath(meetingId: string): string {
  return `/crm/objects/2026-09/meetings/${encodeURIComponent(meetingId)}`;
}

/**
 * Contested OpenAPI-side path only (evidence). Not live-authorized while DOC_CONFLICT holds.
 */
export function cap001EmailArchiveOpenApiPath(emailId: string): string {
  return `/crm/objects/2026-09/emails/${encodeURIComponent(emailId)}`;
}

export const CAP001_CONTACT_PROPERTY_NAMES = [
  "email",
  "firstname",
  "lastname",
  "phone",
  "company",
  CAP001_PROP_FIXTURE_ID,
  CAP001_PROP_RUN_ID,
  CAP001_PROP_SCENARIO_ID,
  CAP001_PROP_STATUS,
  CAP001_PROP_DO_NOT_CONTACT,
  CAP001_PROP_TAGS,
  CAP001_PROP_OWNER,
] as const;

export const CAP001_DEAL_PROPERTY_NAMES = [
  "dealname",
  "amount",
  "dealstage",
  CAP001_PROP_FIXTURE_ID,
  CAP001_PROP_RUN_ID,
  CAP001_PROP_SCENARIO_ID,
  CAP001_PROP_CONTACT_EMAIL,
] as const;

export const CAP001_NOTE_PROPERTY_NAMES = [
  "hs_note_body",
  "hs_timestamp",
  CAP001_PROP_FIXTURE_ID,
  CAP001_PROP_RUN_ID,
  CAP001_PROP_SCENARIO_ID,
  CAP001_PROP_CONTACT_EMAIL,
  CAP001_PROP_KIND,
] as const;

export const CAP001_TASK_PROPERTY_NAMES = [
  "hs_task_subject",
  "hs_task_body",
  "hs_timestamp",
  CAP001_PROP_FIXTURE_ID,
  CAP001_PROP_RUN_ID,
  CAP001_PROP_SCENARIO_ID,
  CAP001_PROP_CONTACT_EMAIL,
  CAP001_PROP_KIND,
  CAP001_PROP_ESCALATION_REASON,
] as const;

export const CAP001_MEETING_PROPERTY_NAMES = [
  "hs_meeting_title",
  "hs_meeting_start_time",
  "hs_meeting_end_time",
  "hs_timestamp",
  CAP001_PROP_FIXTURE_ID,
  CAP001_PROP_RUN_ID,
  CAP001_PROP_SCENARIO_ID,
  CAP001_PROP_CONTACT_EMAIL,
  CAP001_PROP_KIND,
] as const;

export const CAP001_EMAIL_PROPERTY_NAMES = [
  "hs_email_subject",
  "hs_email_text",
  "hs_timestamp",
  CAP001_PROP_FIXTURE_ID,
  CAP001_PROP_RUN_ID,
  CAP001_PROP_SCENARIO_ID,
  CAP001_PROP_CONTACT_EMAIL,
  CAP001_PROP_KIND,
] as const;

export const CAP001_FLAG_NOTE_PROPERTY_NAMES = [
  ...CAP001_NOTE_PROPERTY_NAMES,
  CAP001_PROP_FLAG_CODE,
  CAP001_PROP_FLAG_MESSAGE,
] as const;

export const SCOPE_CONTACTS_READ = "crm.objects.contacts.read";
export const SCOPE_CONTACTS_WRITE = "crm.objects.contacts.write";
export const SCOPE_DEALS_READ = "crm.objects.deals.read";
export const SCOPE_DEALS_WRITE = "crm.objects.deals.write";

export const CAP001_DEFAULT_GRANTED_SCOPES = [SCOPE_CONTACTS_READ, SCOPE_CONTACTS_WRITE] as const;

/**
 * CAP-001 HubSpot path + association constants (CAY-10).
 *
 * Paths match accepted CAY-08 provenance in scope-matrix.ts.
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

/**
 * Activity archive is operation-level 2026-03 — do not inherit create/list 2026-09.
 * Conflict note (2026-09-14): HubSpotDev fetch-doc of latest delete-task returned OpenAPI
 * DELETE /crm/objects/2026-09/tasks/{taskId}; independent review requires 2026-03 guide/template
 * matching Deal archive. Pin is review-required 2026-03.
 */
export const CAP001_ACTIVITIES_ARCHIVE_API_VERSION = "2026-03";

/** Deal archive is operation-level 2026-03 — do not inherit CRUD version. */
export const CAP001_DEALS_ARCHIVE_API_VERSION = "2026-03";

/**
 * Official Deal object type ID.
 * Source: https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/get-deal
 * Retrieved: 2026-09-14 (same ID accepted 2026-09-13 in CAY-08).
 */
export const HUBSPOT_DEAL_OBJECT_TYPE_ID = "0-3";

/**
 * Default HUBSPOT_DEFINED association type IDs (activity → contact).
 * Source: https://developers.hubspot.com/docs/api-reference/latest/crm/associations/associate-records/guide
 * Retrieved: 2026-09-14
 */
export const HUBSPOT_ASSOC_NOTE_TO_CONTACT = 202;
export const HUBSPOT_ASSOC_TASK_TO_CONTACT = 204;
export const HUBSPOT_ASSOC_MEETING_TO_CONTACT = 200;
export const HUBSPOT_ASSOC_EMAIL_TO_CONTACT = 198;

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

/** Template: DELETE /crm/objects/2026-03/{objectType}/{objectId} with objectType=0-3. */
export function cap001DealArchivePath(dealId: string): string {
  return `/crm/objects/${CAP001_DEALS_ARCHIVE_API_VERSION}/${HUBSPOT_DEAL_OBJECT_TYPE_ID}/${encodeURIComponent(dealId)}`;
}

/** Template: DELETE /crm/objects/2026-03/notes|{tasks|meetings|emails}/{id}. */
export function cap001NoteArchivePath(noteId: string): string {
  return `/crm/objects/${CAP001_ACTIVITIES_ARCHIVE_API_VERSION}/notes/${encodeURIComponent(noteId)}`;
}

export function cap001TaskArchivePath(taskId: string): string {
  return `/crm/objects/${CAP001_ACTIVITIES_ARCHIVE_API_VERSION}/tasks/${encodeURIComponent(taskId)}`;
}

export function cap001MeetingArchivePath(meetingId: string): string {
  return `/crm/objects/${CAP001_ACTIVITIES_ARCHIVE_API_VERSION}/meetings/${encodeURIComponent(meetingId)}`;
}

export function cap001EmailArchivePath(emailId: string): string {
  return `/crm/objects/${CAP001_ACTIVITIES_ARCHIVE_API_VERSION}/emails/${encodeURIComponent(emailId)}`;
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

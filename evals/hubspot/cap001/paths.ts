/**
 * CAP-001 HubSpot path + association constants (CAY-10 / CAY-11).
 *
 * Paths match accepted CAY-08 provenance in scope-matrix.ts, with CAY-09/CAY-10
 * activity-archive correction for notes/tasks (settled 2026-09) and create-property
 * (settled 2026-09). meetings.archive / emails.archive pin CAP-001 to **2026-09**
 * named DELETE paths (CAY-11 RESOLVED_VERSION_COEXISTENCE — 2026-03 remains a
 * coexisting supported contract, not the CAP-001 pin).
 * Association type IDs from HubSpot associate-records guide (HUBSPOT_DEFINED).
 * Retrieval date for this module: 2026-09-14.
 */

/** Default HubSpot CRM API host. */
export const HUBSPOT_API_BASE_URL = "https://api.hubapi.com";

/** Contacts remain on proven 2026-03 (CAY-06 / CAY-08). */
export const CAP001_CONTACTS_API_VERSION = "2026-03";

/** Notes/tasks/meetings/emails create/list/archive + deal create/read/update use 2026-09. */
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
 * CAY-11 disposition: RESOLVED_VERSION_COEXISTENCE (retrieval 2026-09-14).
 * Date-based API versions are immutable supported contracts (Current → Supported →
 * Unsupported). Two dates alone do not imply contradiction — see HubSpot versioning
 * docs. CAP-001 pins Meeting/Email archive to 2026-09 (newest Current GA, same as
 * create/list). 2026-03 remains documented as an older coexisting supported contract.
 *
 * Evidence: versioning contract + llms.txt listing both specs + OpenAPI embeds via
 * HubSpotDev fetch-doc for 2026-09 and 2026-03 delete pages. Direct HTTP GET of
 * llms.txt JSON asset URLs returned "Asset not found" — recorded, not DOC_CONFLICT.
 * Misleading `latest` HTML scrape can surface 2026-03-shaped path noise; authority is
 * the versioned OpenAPI embed named on the page (`specs/2026-09/...`).
 */
export const RESOLVED_VERSION_COEXISTENCE_MEETINGS_EMAILS_ARCHIVE =
  "RESOLVED_VERSION_COEXISTENCE: meetings/emails.archive — CAP-001 pin 2026-09; 2026-03 coexists as older supported contract (retrieval 2026-09-14)";

/** CAP-001 pin (2026-09 named OpenAPI). */
export const CAP001_MEETINGS_ARCHIVE_PATH_TEMPLATE =
  "/crm/objects/2026-09/meetings/{meetingId}";
export const CAP001_EMAILS_ARCHIVE_PATH_TEMPLATE =
  "/crm/objects/2026-09/emails/{emailId}";

/**
 * Older coexisting supported contract (2026-03 OpenAPI) — evidence only, not CAP-001 pin.
 */
export const CAP001_MEETINGS_ARCHIVE_2026_03_PATH_TEMPLATE =
  "/crm/objects/2026-03/meetings/{meetingId}";
export const CAP001_EMAILS_ARCHIVE_2026_03_PATH_TEMPLATE =
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
 * Settled activity archive paths (notes/tasks/meetings/emails — CAP-001 pin 2026-09).
 */
export function cap001NoteArchivePath(noteId: string): string {
  return `/crm/objects/2026-09/notes/${encodeURIComponent(noteId)}`;
}

export function cap001TaskArchivePath(taskId: string): string {
  return `/crm/objects/2026-09/tasks/${encodeURIComponent(taskId)}`;
}

/** CAP-001 Meeting archive pin: DELETE /crm/objects/2026-09/meetings/{meetingId}. */
export function cap001MeetingArchivePath(meetingId: string): string {
  return `/crm/objects/2026-09/meetings/${encodeURIComponent(meetingId)}`;
}

/** CAP-001 Email archive pin: DELETE /crm/objects/2026-09/emails/{emailId}. */
export function cap001EmailArchivePath(emailId: string): string {
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

/**
 * Vendor evidence rows for CAP-001 live adapter operations implemented in CAY-10.
 * Retrieval date: 2026-09-14. Paths/scopes from accepted CAY-08 scope-matrix provenance,
 * with CAY-09/CAY-10 notes/tasks archive + create-property settled to current official OpenAPI 2026-09.
 *
 * meetings.archive / emails.archive: DOC_CONFLICT (retrieval 2026-09-14). Official sources
 * disagree on the same latest URLs — OpenAPI embed shows 2026-09 named DELETE paths; independent
 * rendered-reference observation of those URLs shows 2026-03 templates; dated 2026-03 pages also
 * exist. Vendor protocol: STOP contested fact; do not authorize live cleanup. Notes archive stays
 * settled 2026-09. Task delete + create-property 2026-09 independently confirmed — do not reopen.
 * Deal archive stays operation-level 2026-03 (CAY-08).
 *
 * llms.txt lists both crm-meetings/emails-v2026-09 and v2026-03 specs; direct JSON asset URLs
 * returned "Asset not found" when fetched 2026-09-14 — recorded below.
 */

export type VendorEvidenceConflictStatus = "DOC_CONFLICT";

export type VendorEvidenceRow = {
  operation: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  apiVersion: string;
  requiredScopes: readonly string[];
  scopeLogic: "all" | "any";
  sourceUrl: string;
  retrievalDate: string;
  /** Present when official sources disagree; contested fact is not live-ready. */
  conflictStatus?: VendorEvidenceConflictStatus;
  /** Second official reading of the same / alternate dated reference. */
  alternateSourceUrl?: string;
  alternatePath?: string;
  alternateApiVersion?: string;
  notes?: string;
};

export const CAP001_LIVE_ADAPTER_PROVENANCE: readonly VendorEvidenceRow[] = [
  {
    operation: "contacts.search",
    method: "POST",
    path: "/crm/objects/2026-03/contacts/search",
    apiVersion: "2026-03",
    requiredScopes: ["crm.objects.contacts.read"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/contacts/search/search-contacts",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "contacts.read",
    method: "GET",
    path: "/crm/objects/2026-03/contacts/{contactId}",
    apiVersion: "2026-03",
    requiredScopes: ["crm.objects.contacts.read"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/contacts/get-contact",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "contacts.create",
    method: "POST",
    path: "/crm/objects/2026-03/contacts",
    apiVersion: "2026-03",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/contacts/create-contact",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "contacts.update",
    method: "PATCH",
    path: "/crm/objects/2026-03/contacts/{contactId}",
    apiVersion: "2026-03",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/contacts/update-contact",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "contacts.archive",
    method: "DELETE",
    path: "/crm/objects/2026-03/contacts/{contactId}",
    apiVersion: "2026-03",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/contacts/delete-contact",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "notes.create",
    method: "POST",
    path: "/crm/objects/2026-09/notes",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/notes/create-note",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "notes.list",
    method: "GET",
    path: "/crm/objects/2026-09/notes",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.read"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/notes/get-notes",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "notes.archive",
    method: "DELETE",
    path: "/crm/objects/2026-09/notes/{noteId}",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/notes/delete-note",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "tasks.create",
    method: "POST",
    path: "/crm/objects/2026-09/tasks",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/tasks/create-task",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "tasks.list",
    method: "GET",
    path: "/crm/objects/2026-09/tasks",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.read"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/tasks/get-tasks",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "tasks.archive",
    method: "DELETE",
    path: "/crm/objects/2026-09/tasks/{taskId}",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/tasks/delete-task",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "meetings.create",
    method: "POST",
    path: "/crm/objects/2026-09/meetings",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/meetings/create-meeting",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "meetings.list",
    method: "GET",
    path: "/crm/objects/2026-09/meetings",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.read"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/meetings/get-meetings",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "meetings.archive",
    method: "DELETE",
    path: "/crm/objects/2026-09/meetings/{meetingId}",
    apiVersion: "DOC_CONFLICT",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/meetings/delete-meeting",
    retrievalDate: "2026-09-14",
    conflictStatus: "DOC_CONFLICT",
    alternateSourceUrl:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/activities/meetings/delete-meeting",
    alternatePath: "/crm/objects/2026-03/{objectType}/{objectId}",
    alternateApiVersion: "2026-03",
    notes:
      "OpenAPI embed on latest URL (WebFetch/HTML scrape 2026-09-14): DELETE /crm/objects/2026-09/meetings/{meetingId}. Independent rendered observation of same latest URL: DELETE /crm/objects/2026-03/{objectType}/{objectId}. Dated page also shows 2026-03. llms.txt lists crm-meetings-v2026-09 and crm-meetings-v2026-03; JSON asset URLs returned Asset not found (2026-09-14). Not live-ready — archiveMeeting / cleanup fail closed.",
  },
  {
    operation: "emails.create",
    method: "POST",
    path: "/crm/objects/2026-09/emails",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write", "sales-email-read"],
    scopeLogic: "any",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/emails/create-email",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "emails.list",
    method: "GET",
    path: "/crm/objects/2026-09/emails",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.read"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/emails/get-emails",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "emails.archive",
    method: "DELETE",
    path: "/crm/objects/2026-09/emails/{emailId}",
    apiVersion: "DOC_CONFLICT",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/emails/delete-email",
    retrievalDate: "2026-09-14",
    conflictStatus: "DOC_CONFLICT",
    alternateSourceUrl:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/activities/emails/delete-email",
    alternatePath: "/crm/objects/2026-03/emails/{emailId}",
    alternateApiVersion: "2026-03",
    notes:
      "OpenAPI embed on latest URL (WebFetch/HTML scrape 2026-09-14): DELETE /crm/objects/2026-09/emails/{emailId}. Independent rendered observation of same latest URL: DELETE /crm/objects/2026-03/emails/{emailId}. Dated page also shows 2026-03. llms.txt lists crm-emails-v2026-09 and crm-emails-v2026-03; JSON asset URLs returned Asset not found (2026-09-14). Not live-ready — archiveEmail / cleanup fail closed.",
  },
  {
    operation: "deals.create",
    method: "POST",
    path: "/crm/objects/2026-09/0-3",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.deals.write"],
    scopeLogic: "all",
    sourceUrl: "https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/create-deal",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "deals.read",
    method: "GET",
    path: "/crm/objects/2026-09/0-3/{dealId}",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.deals.read"],
    scopeLogic: "all",
    sourceUrl: "https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/get-deal",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "deals.update",
    method: "PATCH",
    path: "/crm/objects/2026-09/0-3/{dealId}",
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.deals.write"],
    scopeLogic: "all",
    sourceUrl: "https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/update-deal",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "deals.archive",
    method: "DELETE",
    path: "/crm/objects/2026-03/{objectType}/{objectId}",
    apiVersion: "2026-03",
    requiredScopes: ["crm.objects.deals.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/deals/delete-deal",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "properties.create",
    method: "POST",
    path: "/crm/properties/2026-09/{objectType}",
    apiVersion: "2026-09",
    requiredScopes: ["crm.schemas.contacts.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/properties/create-property",
    retrievalDate: "2026-09-14",
  },
  {
    operation: "associations.default_type_ids",
    method: "GET",
    path: "(reference) note→contact=202, task→contact=204, meeting→contact=200, email→contact=198, deal→contact=3",
    apiVersion: "n/a",
    requiredScopes: [],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/associations/associate-records/guide",
    retrievalDate: "2026-09-14",
  },
];

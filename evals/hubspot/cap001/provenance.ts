/**
 * Vendor evidence rows for CAP-001 live adapter operations implemented in CAY-10 / CAY-11.
 * Retrieval date: 2026-09-14. Paths/scopes from accepted CAY-08 scope-matrix provenance,
 * with CAY-09/CAY-10 notes/tasks archive + create-property settled to current official OpenAPI 2026-09.
 *
 * meetings.archive / emails.archive (CAY-11): RESOLVED_VERSION_COEXISTENCE. HubSpot date-based
 * API versions are immutable supported contracts; 2026-09 and 2026-03 coexist — not a conflict.
 * CAP-001 pins archive to 2026-09 named DELETE paths (same as create/list; newest Current GA).
 * 2026-03 remains recorded as the older coexisting supported contract (not the CAP-001 pin).
 *
 * Independently reproducible 2026-09 DELETE evidence (no MCP, no auth):
 * curl the public `.md` URLs under `/api-reference/latest/.../delete-*.md` (HTTP 200).
 * Those pages embed OpenAPI operation headers naming `specs/2026-09/crm-*-v2026-09.json`
 * with exact DELETE paths + ScopesList. HubSpot `_llms/apis/2026-09/crm.md` lists those
 * same `.md` links as the 2026-09 CRM tree. Exact `/api-reference/2026-09/...` HTML pages
 * 404; direct `/docs/specs/2026-09/*.json` still "Asset not found" — recorded.
 * Rendered HTML without `.md` may still look 2026-03-shaped; authority is the public `.md`
 * OpenAPI embed (not MCP-only). Versioning:
 * https://developers.hubspot.com/docs/developer-tooling/platform/versioning
 * Notes/tasks archive stay settled 2026-09. Deal archive stays operation-level 2026-03 (CAY-08).
 * CAY-20260917 readiness recheck: latest delete-deal.md also documents DELETE
 * `/crm/objects/2026-09/0-3/{dealId}` (coexistence). CAP-001 archive pin remains 2026-03 —
 * intentionally not silently migrated. 2026-03 delete-deal.md still HTTP 200 / supported.
 */

export type VendorEvidenceDisposition =
  | "RESOLVED_VERSION_COEXISTENCE";

export type VendorEvidenceRow = {
  operation: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  apiVersion: string;
  requiredScopes: readonly string[];
  scopeLogic: "all" | "any";
  sourceUrl: string;
  retrievalDate: string;
  /** Present when dual date contracts coexist; CAP-001 pin is `apiVersion` / `path`. */
  disposition?: VendorEvidenceDisposition;
  /** Older coexisting supported contract (evidence). */
  alternateSourceUrl?: string;
  alternatePath?: string;
  alternateApiVersion?: string;
  /** Named OpenAPI asset identity from the official page embed (e.g. specs/2026-09/...). */
  namedSpec?: string;
  /** UTC timestamp of the independent public curl that confirmed the operation. */
  retrievalTimestampUtc?: string;
  /** How a reviewer can reproduce without MCP (e.g. curl .md URL). */
  evidenceReproduction?: string;
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
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write"],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/meetings/delete-meeting.md",
    retrievalDate: "2026-09-14",
    retrievalTimestampUtc: "2026-09-14T04:59:20Z",
    namedSpec: "specs/2026-09/crm-meetings-v2026-09.json",
    evidenceReproduction:
      "curl -sL -A 'CanAIYet-CAY11-evidence/1.0' -H 'Accept: text/markdown,text/plain,*/*' 'https://developers.hubspot.com/docs/api-reference/latest/crm/activities/meetings/delete-meeting.md' → HTTP 200; OpenAPI header embeds namedSpec + DELETE path; ScopesList crm.objects.contacts.write. Tree index: https://developers.hubspot.com/docs/_llms/apis/2026-09/crm.md lists this .md under 2026-09 CRM. Exact /api-reference/2026-09/.../delete-meeting → 404; /docs/specs/2026-09/crm-meetings-v2026-09.json → Asset not found.",
    disposition: "RESOLVED_VERSION_COEXISTENCE",
    alternateSourceUrl:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/activities/meetings/delete-meeting",
    alternatePath: "/crm/objects/2026-03/meetings/{meetingId}",
    alternateApiVersion: "2026-03",
    notes:
      "CAY-11 RESOLVED_VERSION_COEXISTENCE (evidence refresh). CAP-001 pin from public .md OpenAPI embed: DELETE /crm/objects/2026-09/meetings/{meetingId}; scope all crm.objects.contacts.write. Coexisting older contract: 2026-03 delete-meeting. Prefer exact /api-reference/2026-09/... if HubSpot publishes it — currently 404; /latest/.../*.md is the reproducible official source listed by _llms/apis/2026-09.",
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
    apiVersion: "2026-09",
    requiredScopes: ["crm.objects.contacts.write", "sales-email-read"],
    scopeLogic: "any",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/emails/delete-email.md",
    retrievalDate: "2026-09-14",
    retrievalTimestampUtc: "2026-09-14T04:59:20Z",
    namedSpec: "specs/2026-09/crm-emails-v2026-09.json",
    evidenceReproduction:
      "curl -sL -A 'CanAIYet-CAY11-evidence/1.0' -H 'Accept: text/markdown,text/plain,*/*' 'https://developers.hubspot.com/docs/api-reference/latest/crm/activities/emails/delete-email.md' → HTTP 200; OpenAPI header embeds namedSpec + DELETE path; ScopesList crm.objects.contacts.write OR sales-email-read. Tree index: https://developers.hubspot.com/docs/_llms/apis/2026-09/crm.md lists this .md under 2026-09 CRM. Exact /api-reference/2026-09/.../delete-email → 404; /docs/specs/2026-09/crm-emails-v2026-09.json → Asset not found.",
    disposition: "RESOLVED_VERSION_COEXISTENCE",
    alternateSourceUrl:
      "https://developers.hubspot.com/docs/api-reference/2026-03/crm/activities/emails/delete-email",
    alternatePath: "/crm/objects/2026-03/emails/{emailId}",
    alternateApiVersion: "2026-03",
    notes:
      "CAY-11 RESOLVED_VERSION_COEXISTENCE (evidence refresh). CAP-001 pin from public .md OpenAPI embed: DELETE /crm/objects/2026-09/emails/{emailId}; scope any of crm.objects.contacts.write | sales-email-read. contacts.write already granted covers archive. Coexisting older contract: 2026-03 delete-email. Same URL-shape caveats as meetings.archive.",
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

/**
 * Vendor evidence rows for CAP-001 live adapter operations implemented in CAY-10.
 * Retrieval date: 2026-09-14. Paths/scopes from accepted CAY-08 scope-matrix provenance.
 */

export type VendorEvidenceRow = {
  operation: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  apiVersion: string;
  requiredScopes: readonly string[];
  scopeLogic: "all" | "any";
  sourceUrl: string;
  retrievalDate: string;
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
    operation: "associations.default_type_ids",
    method: "GET",
    path: "(reference) note→contact=202, task→contact=204, meeting→contact=200, email→contact=198",
    apiVersion: "n/a",
    requiredScopes: [],
    scopeLogic: "all",
    sourceUrl:
      "https://developers.hubspot.com/docs/api-reference/latest/crm/associations/associate-records/guide",
    retrievalDate: "2026-09-14",
  },
];

/**
 * CAP-001 HubSpot metadata plan (machine-readable companion to docs/HUBSPOT_CAP001_METADATA_PLAN.md).
 * Custom properties are one-time UI/setup provisioning — runtime Service Key only writes values.
 *
 * Create-property path (2026-09-14): HubSpotDev fetch-doc of latest create-property returned
 * OpenAPI `POST /crm/properties/2026-09/{objectType}` (CAY-09: current official docs win).
 * Runtime schema-write remains 0.
 *
 * Correction (CAY-20260917-HUBSPOT-METADATA-SCOPE-CATALOG-CORRECTION): activity-family cay_*
 * remain listed as the prior adapter inventory, but Service Key executability is classified in
 * `metadata-family-support.ts` — not assumed from Properties API docs alone.
 */

export const CAP001_METADATA_PLAN = {
  strategy: "one_time_ui_or_setup_credential" as const,
  avoidRuntimeScopes: [
    "crm.schemas.contacts.write",
    "crm.schemas.deals.write",
  ] as const,
  createPropertyEndpoint: "POST /crm/properties/2026-09/{objectType}",
  createPropertyApiVersion: "2026-09",
  objectFamilies: [
    "contacts",
    "deals",
    "notes",
    "tasks",
    "meetings",
    "emails",
  ] as const,
  engagementObjectTypes: ["notes", "tasks", "meetings", "emails"] as const,
  rationale:
    "CAP-001 needs stable cay_fixture_id across object types. Contacts+deals cay_* are Service Key–provisionable in portal 247381023. Activity (notes/tasks/meetings/emails) cay_* remain in the inventory as the prior adapter assumption but are NOT Service Key–executable here (catalog mismatch / KB activity-property limits) — classify and fail closed per metadata-family-support.ts. Runtime keys only write values under contacts.write / deals.write.",
  contactProperties: [
    {
      name: "cay_fixture_id",
      type: "string",
      purpose: "Stable CAP-001 fixture identity",
      required: true,
      objectFamilies: ["contacts"] as const,
    },
    {
      name: "cay_run_id",
      type: "string",
      purpose: "Seed/reset run isolation",
      required: true,
      objectFamilies: ["contacts"] as const,
    },
    {
      name: "cay_scenario_id",
      type: "string",
      purpose: "Optional scenario ownership marker",
      required: true,
      objectFamilies: ["contacts"] as const,
    },
    {
      name: "cay_status",
      type: "string",
      purpose: "lead | customer (exam semantic)",
      required: true,
      objectFamilies: ["contacts"] as const,
    },
    {
      name: "cay_do_not_contact",
      type: "string",
      purpose: "DNC flag as true/false string",
      required: true,
      objectFamilies: ["contacts"] as const,
    },
    {
      name: "cay_tags",
      type: "string",
      purpose: "Semicolon-separated tags",
      required: true,
      objectFamilies: ["contacts"] as const,
    },
    {
      name: "cay_owner",
      type: "string",
      purpose: "Owner email for projection",
      required: true,
      objectFamilies: ["contacts"] as const,
    },
  ] as const,
  dealProperties: [
    {
      name: "cay_fixture_id",
      type: "string",
      purpose: "Stable CAP-001 deal fixture identity",
      required: true,
      objectFamilies: ["deals"] as const,
    },
    {
      name: "cay_run_id",
      type: "string",
      purpose: "Seed/reset run isolation",
      required: true,
      objectFamilies: ["deals"] as const,
    },
    {
      name: "cay_scenario_id",
      type: "string",
      purpose: "Optional scenario ownership marker",
      required: true,
      objectFamilies: ["deals"] as const,
    },
    {
      name: "cay_contact_email",
      type: "string",
      purpose:
        "Auxiliary label only; authoritative ownership = HubSpot contact association (not this property alone)",
      required: true,
      objectFamilies: ["deals"] as const,
    },
  ] as const,
  /**
   * Prior adapter inventory for engagement objectTypes.
   * Service Key executability is NOT assumed — see metadata-family-support.ts
   * (notes/emails UNMAPPED; tasks/meetings UI_ONLY_OR_BETA unverified).
   */
  engagementProperties: [
    {
      name: "cay_fixture_id",
      type: "string",
      purpose: "Activity fixture identity (representation may be UNMAPPED via Service Key)",
      required: true,
      objectFamilies: ["notes", "tasks", "meetings", "emails"] as const,
    },
    {
      name: "cay_run_id",
      type: "string",
      purpose: "Run isolation for reset (representation may be UNMAPPED via Service Key)",
      required: true,
      objectFamilies: ["notes", "tasks", "meetings", "emails"] as const,
    },
    {
      name: "cay_scenario_id",
      type: "string",
      purpose: "Scenario ownership (representation may be UNMAPPED via Service Key)",
      required: true,
      objectFamilies: ["notes", "tasks", "meetings", "emails"] as const,
    },
    {
      name: "cay_kind",
      type: "string",
      purpose: "note | task | outbound | escalation | flag | appointment",
      required: true,
      objectFamilies: ["notes", "tasks", "meetings", "emails"] as const,
    },
    {
      name: "cay_contact_email",
      type: "string",
      purpose:
        "Auxiliary label only; authoritative ownership = HubSpot contact association on the activity. Reads must verify associations.contacts matches this label (case-insensitive); do not trust the property alone.",
      required: true,
      objectFamilies: ["notes", "tasks", "meetings", "emails"] as const,
    },
  ] as const,
  alternativeRejected:
    "Embedding runId only in email local-part works for contacts but cannot stably key deals to the same fixture graph. Association-only activity reset without an ID ledger false-positives on shared baseline contacts.",
} as const;

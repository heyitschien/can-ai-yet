/**
 * CAP-001 HubSpot metadata plan (machine-readable companion to docs/HUBSPOT_CAP001_METADATA_PLAN.md).
 * Custom properties are one-time UI/setup provisioning — runtime Service Key only writes values.
 */

export const CAP001_METADATA_PLAN = {
  strategy: "one_time_ui_or_setup_credential" as const,
  avoidRuntimeScopes: [
    "crm.schemas.contacts.write",
    "crm.schemas.deals.write",
  ] as const,
  rationale:
    "CAP-001 needs stable cay_fixture_id across object types. Prefer one-time custom properties on contacts and deals; runtime keys only write values under contacts.write / deals.write. Searching by email alone is insufficient for fixture identity across deals/activities.",
  contactProperties: [
    {
      name: "cay_fixture_id",
      type: "string",
      purpose: "Stable CAP-001 fixture identity",
    },
    {
      name: "cay_run_id",
      type: "string",
      purpose: "Seed/reset run isolation",
    },
    {
      name: "cay_scenario_id",
      type: "string",
      purpose: "Optional scenario ownership marker",
    },
    {
      name: "cay_status",
      type: "string",
      purpose: "lead | customer (exam semantic)",
    },
    {
      name: "cay_do_not_contact",
      type: "string",
      purpose: "DNC flag as true/false string",
    },
    {
      name: "cay_tags",
      type: "string",
      purpose: "Semicolon-separated tags",
    },
    {
      name: "cay_owner",
      type: "string",
      purpose: "Owner email for projection",
    },
  ] as const,
  dealProperties: [
    {
      name: "cay_fixture_id",
      type: "string",
      purpose: "Stable CAP-001 deal fixture identity",
    },
    {
      name: "cay_run_id",
      type: "string",
      purpose: "Seed/reset run isolation",
    },
    {
      name: "cay_scenario_id",
      type: "string",
      purpose: "Optional scenario ownership marker",
    },
    {
      name: "cay_contact_email",
      type: "string",
      purpose: "Linked contact email for projection without association join",
    },
  ] as const,
  engagementProperties: [
    {
      name: "cay_fixture_id",
      type: "string",
      purpose: "Activity fixture identity",
    },
    {
      name: "cay_run_id",
      type: "string",
      purpose: "Run isolation for reset",
    },
    {
      name: "cay_scenario_id",
      type: "string",
      purpose: "Scenario ownership",
    },
    {
      name: "cay_kind",
      type: "string",
      purpose: "note | task | outbound | escalation | flag | appointment",
    },
    {
      name: "cay_contact_email",
      type: "string",
      purpose: "Associated contact email for projection",
    },
  ] as const,
  alternativeRejected:
    "Embedding runId only in email local-part works for contacts but cannot stably key deals/notes/tasks/meetings/emails to the same fixture graph.",
} as const;

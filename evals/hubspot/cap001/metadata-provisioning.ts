/**
 * Dry-only CAP-001 HubSpot cay_* metadata provisioning package
 * (CAY-20260917-HUBSPOT-READINESS-REFRESH + CAY-20260917-HUBSPOT-METADATA-GROUP-READINESS).
 *
 * Property groups are **per objectType** (not portal-global). Official create path
 * (retrieval 2026-09-17): POST /crm/properties/2026-09/{objectType}/groups
 * Source: https://developers.hubspot.com/docs/api-reference/latest/crm/properties/property-groups/create-property.md
 * 2026-03 coexists (RESOLVED_VERSION_COEXISTENCE); CAP-001 pins groups to 2026-09
 * (same Current GA pin as create-property).
 *
 * Does NOT call HubSpot. Setup-only schema scopes — never on the steady-state runtime key.
 */

import { CAP001_METADATA_PLAN } from "@/evals/hubspot/cap001/metadata-plan";

export const METADATA_PROVISIONING_RETRIEVAL_DATE = "2026-09-17";

export const METADATA_CREATE_PROPERTY_ENDPOINT =
  "POST /crm/properties/2026-09/{objectType}" as const;

export const METADATA_CREATE_PROPERTY_DOC =
  "https://developers.hubspot.com/docs/api-reference/latest/crm/properties/create-property.md";

export const METADATA_CREATE_PROPERTY_GROUP_ENDPOINT =
  "POST /crm/properties/2026-09/{objectType}/groups" as const;

export const METADATA_CREATE_PROPERTY_GROUP_DOC =
  "https://developers.hubspot.com/docs/api-reference/latest/crm/properties/property-groups/create-property.md";

export const METADATA_LIST_PROPERTY_GROUPS_ENDPOINT =
  "GET /crm/properties/2026-09/{objectType}/groups" as const;

export const METADATA_GET_PROPERTY_GROUP_ENDPOINT =
  "GET /crm/properties/2026-09/{objectType}/groups/{groupName}" as const;

/** Internal group name — must exist on **each** CAP-001 object family. */
export const CAP001_PROPERTY_GROUP_NAME = "cay_cap001";

/** Human-visible HubSpot label for the group. */
export const CAP001_PROPERTY_GROUP_LABEL = "CanAIYet CAP-001";

/** Deterministic display order for the CanAIYet lab group. */
export const CAP001_PROPERTY_GROUP_DISPLAY_ORDER = 10_000;

export type Cap001MetadataObjectType =
  (typeof CAP001_METADATA_PLAN.objectFamilies)[number];

export const CAP001_METADATA_OBJECT_TYPES: readonly Cap001MetadataObjectType[] =
  CAP001_METADATA_PLAN.objectFamilies;

export type Cap001PropertyGroupCreatePayload = {
  name: string;
  label: string;
  displayOrder: number;
};

export type Cap001PropertyGroupSpec = {
  objectType: Cap001MetadataObjectType;
  setupSchemaScope: string;
  payload: Cap001PropertyGroupCreatePayload;
  createEndpoint: typeof METADATA_CREATE_PROPERTY_GROUP_ENDPOINT;
  createDoc: typeof METADATA_CREATE_PROPERTY_GROUP_DOC;
};

export type Cap001PropertyCreatePayload = {
  name: string;
  label: string;
  type: "string";
  fieldType: "text";
  groupName: string;
  description: string;
  hasUniqueValue: false;
  hidden: false;
  formField: false;
};

export type Cap001PropertySpec = {
  objectType: Cap001MetadataObjectType;
  purpose: string;
  /** Setup-only schema scope for this objectType (OR among create-property scopes). */
  setupSchemaScope: string;
  payload: Cap001PropertyCreatePayload;
};

export type ExistingPropertyDefinition = {
  name: string;
  type?: string | null;
  fieldType?: string | null;
  groupName?: string | null;
  label?: string | null;
};

export type ExistingPropertyGroupDefinition = {
  name: string;
  label?: string | null;
  displayOrder?: number | null;
  archived?: boolean | null;
};

export type PropertyIdempotenceResult =
  | { status: "MISSING"; spec: Cap001PropertySpec }
  | { status: "MATCH"; spec: Cap001PropertySpec }
  | { status: "INCOMPATIBLE"; spec: Cap001PropertySpec; reason: string };

export type PropertyGroupIdempotenceResult =
  | { status: "MISSING"; spec: Cap001PropertyGroupSpec }
  | { status: "MATCH"; spec: Cap001PropertyGroupSpec }
  | { status: "INCOMPATIBLE"; spec: Cap001PropertyGroupSpec; reason: string };

export type DryMetadataProvisioningPlan = {
  retrievalDate: string;
  createPropertyEndpoint: typeof METADATA_CREATE_PROPERTY_ENDPOINT;
  createPropertyDoc: typeof METADATA_CREATE_PROPERTY_DOC;
  createPropertyGroupEndpoint: typeof METADATA_CREATE_PROPERTY_GROUP_ENDPOINT;
  createPropertyGroupDoc: typeof METADATA_CREATE_PROPERTY_GROUP_DOC;
  propertyGroupName: typeof CAP001_PROPERTY_GROUP_NAME;
  propertyGroupLabel: typeof CAP001_PROPERTY_GROUP_LABEL;
  /** One group spec per CAP-001 object family (not portal-global). */
  groupSpecs: Cap001PropertyGroupSpec[];
  groupsToCreate: Cap001PropertyGroupSpec[];
  groupsMatched: Cap001PropertyGroupSpec[];
  groupsIncompatible: Array<{ spec: Cap001PropertyGroupSpec; reason: string }>;
  /** Object families whose group is MATCH (proven READY for property create). */
  familiesWithGroupReady: Cap001MetadataObjectType[];
  specs: Cap001PropertySpec[];
  /** Properties eligible to create only when that family's group is READY (MATCH). */
  toCreate: Cap001PropertySpec[];
  /** Properties blocked because the same-family group is not yet READY. */
  propertiesBlockedUntilGroupReady: Cap001PropertySpec[];
  matched: Cap001PropertySpec[];
  incompatible: Array<{ spec: Cap001PropertySpec; reason: string }>;
  /** Fail closed when any incompatible group or property definition exists. */
  ok: boolean;
  checklist: string[];
  futureSetupOrder: string[];
};

function labelFor(name: string): string {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function setupScopeFor(objectType: Cap001MetadataObjectType): string {
  switch (objectType) {
    case "contacts":
      return "crm.schemas.contacts.write";
    case "deals":
      return "crm.schemas.deals.write";
    case "notes":
      return "crm.schemas.notes.write";
    case "tasks":
      return "crm.schemas.tasks.write";
    case "meetings":
      return "crm.schemas.meetings.write";
    case "emails":
      return "crm.schemas.emails.write";
    default: {
      const _exhaustive: never = objectType;
      return _exhaustive;
    }
  }
}

function buildPayload(
  name: string,
  purpose: string,
): Cap001PropertyCreatePayload {
  return {
    name,
    label: labelFor(name),
    type: "string",
    fieldType: "text",
    groupName: CAP001_PROPERTY_GROUP_NAME,
    description: purpose,
    hasUniqueValue: false,
    hidden: false,
    formField: false,
  };
}

/** Exact per-family group list — one `cay_cap001` on each CAP-001 objectType. */
export function buildCap001PropertyGroupSpecs(): Cap001PropertyGroupSpec[] {
  return CAP001_METADATA_OBJECT_TYPES.map((objectType) => ({
    objectType,
    setupSchemaScope: setupScopeFor(objectType),
    payload: {
      name: CAP001_PROPERTY_GROUP_NAME,
      label: CAP001_PROPERTY_GROUP_LABEL,
      displayOrder: CAP001_PROPERTY_GROUP_DISPLAY_ORDER,
    },
    createEndpoint: METADATA_CREATE_PROPERTY_GROUP_ENDPOINT,
    createDoc: METADATA_CREATE_PROPERTY_GROUP_DOC,
  }));
}

/**
 * Exact family-specific property list — must stay in parity with CAP001_METADATA_PLAN.
 */
export function buildCap001PropertySpecs(): Cap001PropertySpec[] {
  const specs: Cap001PropertySpec[] = [];

  for (const prop of CAP001_METADATA_PLAN.contactProperties) {
    for (const objectType of prop.objectFamilies) {
      specs.push({
        objectType,
        purpose: prop.purpose,
        setupSchemaScope: setupScopeFor(objectType),
        payload: buildPayload(prop.name, prop.purpose),
      });
    }
  }

  for (const prop of CAP001_METADATA_PLAN.dealProperties) {
    for (const objectType of prop.objectFamilies) {
      specs.push({
        objectType,
        purpose: prop.purpose,
        setupSchemaScope: setupScopeFor(objectType),
        payload: buildPayload(prop.name, prop.purpose),
      });
    }
  }

  for (const prop of CAP001_METADATA_PLAN.engagementProperties) {
    for (const objectType of prop.objectFamilies) {
      specs.push({
        objectType,
        purpose: prop.purpose,
        setupSchemaScope: setupScopeFor(objectType),
        payload: buildPayload(prop.name, prop.purpose),
      });
    }
  }

  return specs;
}

export function evaluatePropertyGroupIdempotence(
  spec: Cap001PropertyGroupSpec,
  existing: ExistingPropertyGroupDefinition | undefined,
): PropertyGroupIdempotenceResult {
  if (!existing) return { status: "MISSING", spec };

  const problems: string[] = [];
  if (existing.archived === true) {
    problems.push("archived=true (fail closed; do not reuse archived group)");
  }
  if (existing.name !== spec.payload.name) {
    problems.push(`name=${existing.name} expected=${spec.payload.name}`);
  }
  if (existing.label && existing.label !== spec.payload.label) {
    problems.push(`label=${existing.label} expected=${spec.payload.label}`);
  }
  if (
    existing.displayOrder != null &&
    existing.displayOrder !== spec.payload.displayOrder
  ) {
    problems.push(
      `displayOrder=${existing.displayOrder} expected=${spec.payload.displayOrder}`,
    );
  }
  if (problems.length > 0) {
    return { status: "INCOMPATIBLE", spec, reason: problems.join("; ") };
  }
  return { status: "MATCH", spec };
}

export function evaluatePropertyIdempotence(
  spec: Cap001PropertySpec,
  existing: ExistingPropertyDefinition | undefined,
): PropertyIdempotenceResult {
  if (!existing) return { status: "MISSING", spec };

  const problems: string[] = [];
  if (existing.type && existing.type !== spec.payload.type) {
    problems.push(`type=${existing.type} expected=${spec.payload.type}`);
  }
  if (existing.fieldType && existing.fieldType !== spec.payload.fieldType) {
    problems.push(
      `fieldType=${existing.fieldType} expected=${spec.payload.fieldType}`,
    );
  }
  if (existing.groupName && existing.groupName !== spec.payload.groupName) {
    problems.push(
      `groupName=${existing.groupName} expected=${spec.payload.groupName}`,
    );
  }
  if (problems.length > 0) {
    return {
      status: "INCOMPATIBLE",
      spec,
      reason: problems.join("; "),
    };
  }
  return { status: "MATCH", spec };
}

export function buildDryMetadataProvisioningPlan(
  existingByObjectType: ReadonlyMap<
    Cap001MetadataObjectType,
    readonly ExistingPropertyDefinition[]
  > = new Map(),
  existingGroupsByObjectType: ReadonlyMap<
    Cap001MetadataObjectType,
    readonly ExistingPropertyGroupDefinition[]
  > = new Map(),
): DryMetadataProvisioningPlan {
  const groupSpecs = buildCap001PropertyGroupSpecs();
  const groupsToCreate: Cap001PropertyGroupSpec[] = [];
  const groupsMatched: Cap001PropertyGroupSpec[] = [];
  const groupsIncompatible: Array<{
    spec: Cap001PropertyGroupSpec;
    reason: string;
  }> = [];
  const familiesWithGroupReady: Cap001MetadataObjectType[] = [];

  for (const spec of groupSpecs) {
    const catalog = existingGroupsByObjectType.get(spec.objectType) ?? [];
    const existing = catalog.find((row) => row.name === spec.payload.name);
    const result = evaluatePropertyGroupIdempotence(spec, existing);
    switch (result.status) {
      case "MISSING":
        groupsToCreate.push(spec);
        break;
      case "MATCH":
        groupsMatched.push(spec);
        familiesWithGroupReady.push(spec.objectType);
        break;
      case "INCOMPATIBLE":
        groupsIncompatible.push({ spec, reason: result.reason });
        break;
      default: {
        const _exhaustive: never = result;
        return _exhaustive;
      }
    }
  }

  const readyFamilies = new Set(familiesWithGroupReady);
  const specs = buildCap001PropertySpecs();
  const toCreate: Cap001PropertySpec[] = [];
  const propertiesBlockedUntilGroupReady: Cap001PropertySpec[] = [];
  const matched: Cap001PropertySpec[] = [];
  const incompatible: Array<{ spec: Cap001PropertySpec; reason: string }> = [];

  for (const spec of specs) {
    const catalog = existingByObjectType.get(spec.objectType) ?? [];
    const existing = catalog.find((row) => row.name === spec.payload.name);
    const result = evaluatePropertyIdempotence(spec, existing);
    switch (result.status) {
      case "MISSING":
        if (readyFamilies.has(spec.objectType)) {
          toCreate.push(spec);
        } else {
          propertiesBlockedUntilGroupReady.push(spec);
        }
        break;
      case "MATCH":
        matched.push(spec);
        break;
      case "INCOMPATIBLE":
        incompatible.push({ spec, reason: result.reason });
        break;
      default: {
        const _exhaustive: never = result;
        return _exhaustive;
      }
    }
  }

  const checklist = [
    `Verify portal identity = 247381023 (CanAIYet CAP-001 Lab) before any setup write.`,
    `For each of contacts/deals/notes/tasks/meetings/emails: ensure property group \`${CAP001_PROPERTY_GROUP_NAME}\` (\`${CAP001_PROPERTY_GROUP_LABEL}\`) exists on **that objectType** — not once portal-global.`,
    `Create missing groups via ${METADATA_CREATE_PROPERTY_GROUP_ENDPOINT} (setup schema scope only).`,
    `Only after a family's group is READY (MATCH), create MISSING cay_* properties via ${METADATA_CREATE_PROPERTY_ENDPOINT}.`,
    "MATCH groups/properties are no-ops (idempotent).",
    "INCOMPATIBLE or archived groups/properties fail closed — do not overwrite.",
    "Do not put crm.schemas.*.read or crm.schemas.*.write on the steady-state runtime Service Key.",
    "Temporary setup key needs schema-read ∪ schema-write (write does not imply read).",
    "This package is dry-only until a separate human authorization creates groups/properties.",
  ];

  const futureSetupOrder = [
    "1. Verify portal identity = 247381023 (account-info + blocked-scope error bodies if needed).",
    "2. For each object family: GET group cay_cap001 (schema-read); create if MISSING (schema-write); STOP if INCOMPATIBLE/archived.",
    "3. For each object family with group READY: GET properties (schema-read); create MISSING cay_* (schema-write) — 31 total across families.",
    "4. Authoritative re-read of groups + properties (schema-read); prove dry-plan parity (all MATCH).",
    "5. STOP — no Deals scope grant, no seed/mutation suite in the metadata mission.",
    "6. After independent review: retire/rotate any temporary schema read+write credential (human).",
  ];

  return {
    retrievalDate: METADATA_PROVISIONING_RETRIEVAL_DATE,
    createPropertyEndpoint: METADATA_CREATE_PROPERTY_ENDPOINT,
    createPropertyDoc: METADATA_CREATE_PROPERTY_DOC,
    createPropertyGroupEndpoint: METADATA_CREATE_PROPERTY_GROUP_ENDPOINT,
    createPropertyGroupDoc: METADATA_CREATE_PROPERTY_GROUP_DOC,
    propertyGroupName: CAP001_PROPERTY_GROUP_NAME,
    propertyGroupLabel: CAP001_PROPERTY_GROUP_LABEL,
    groupSpecs,
    groupsToCreate,
    groupsMatched,
    groupsIncompatible,
    familiesWithGroupReady,
    specs,
    toCreate,
    propertiesBlockedUntilGroupReady,
    matched,
    incompatible,
    ok: groupsIncompatible.length === 0 && incompatible.length === 0,
    checklist,
    futureSetupOrder,
  };
}

export function countSpecsByObjectType(
  specs: readonly Cap001PropertySpec[] = buildCap001PropertySpecs(),
): Record<Cap001MetadataObjectType, number> {
  const counts = {
    contacts: 0,
    deals: 0,
    notes: 0,
    tasks: 0,
    meetings: 0,
    emails: 0,
  } satisfies Record<Cap001MetadataObjectType, number>;
  for (const spec of specs) counts[spec.objectType] += 1;
  return counts;
}

/** Request body helper for a future authorized setup call (not invoked here). */
export function createPropertyRequestBody(
  spec: Cap001PropertySpec,
): Cap001PropertyCreatePayload {
  return { ...spec.payload };
}

/** Request body helper for a future authorized group create (not invoked here). */
export function createPropertyGroupRequestBody(
  spec: Cap001PropertyGroupSpec,
): Cap001PropertyGroupCreatePayload {
  return { ...spec.payload };
}

/**
 * Temporary setup credential — least-authority envelope for pre-read + write + post-read.
 * Do **not** assume schema write implies schema read (official GET pages list separate OR scopes).
 * Retrieval 2026-09-17: property + property-group OpenAPI embeds on latest 2026-09 docs.
 *
 * Chosen read authority: `crm.schemas.{family}.read` (not object-read) for all six families,
 * so the setup key does not pull in deals/notes/tasks/meetings/emails object scopes.
 * Official GET OR lists also include object-read alternatives; we deliberately pick schema-read.
 */
export const CAP001_METADATA_SETUP_SCHEMA_READ_SCOPES = [
  "crm.schemas.contacts.read",
  "crm.schemas.deals.read",
  "crm.schemas.notes.read",
  "crm.schemas.tasks.read",
  "crm.schemas.meetings.read",
  "crm.schemas.emails.read",
] as const;

export const CAP001_METADATA_SETUP_SCHEMA_WRITE_SCOPES = [
  "crm.schemas.contacts.write",
  "crm.schemas.deals.write",
  "crm.schemas.notes.write",
  "crm.schemas.tasks.write",
  "crm.schemas.meetings.write",
  "crm.schemas.emails.write",
] as const;

/** Exact temporary setup key scope list (read ∪ write). Sorted for stable snapshots. */
export const CAP001_METADATA_SETUP_CREDENTIAL_SCOPES = [
  ...CAP001_METADATA_SETUP_SCHEMA_READ_SCOPES,
  ...CAP001_METADATA_SETUP_SCHEMA_WRITE_SCOPES,
].slice().sort() as readonly string[];

export type Cap001MetadataSetupOperation = {
  step: string;
  operation: string;
  method: "GET" | "POST";
  endpoint: string;
  objectType: Cap001MetadataObjectType | "portal";
  /** Official OR scopes that satisfy this operation for the objectType (least-authority choice first). */
  requiredScopesAnyOf: readonly string[];
  /** Scope(s) we place on the temporary setup key for this operation. */
  chosenSetupScopes: readonly string[];
  docSource: string;
};

function schemaRead(objectType: Cap001MetadataObjectType): string {
  return `crm.schemas.${objectType}.read`;
}

function schemaWrite(objectType: Cap001MetadataObjectType): string {
  return `crm.schemas.${objectType}.write`;
}

/**
 * Operation → endpoint → required-scope → chosen-scope matrix for the future setup sequence.
 * Portal identity verify uses account-info (outside properties API); covered by existing
 * contacts-capable runtime key or any authenticated setup key — recorded as non-schema.
 */
export function buildCap001MetadataSetupOperationMatrix(): Cap001MetadataSetupOperation[] {
  const rows: Cap001MetadataSetupOperation[] = [];
  for (const objectType of CAP001_METADATA_OBJECT_TYPES) {
    const read = schemaRead(objectType);
    const write = schemaWrite(objectType);
    rows.push(
      {
        step: "2.pre_read_group",
        operation: "groups.get_or_list",
        method: "GET",
        endpoint: METADATA_GET_PROPERTY_GROUP_ENDPOINT,
        objectType,
        requiredScopesAnyOf: [read],
        chosenSetupScopes: [read],
        docSource: METADATA_CREATE_PROPERTY_GROUP_DOC.replace(
          "create-property.md",
          "get-property.md",
        ),
      },
      {
        step: "2.write_group_if_missing",
        operation: "groups.create",
        method: "POST",
        endpoint: METADATA_CREATE_PROPERTY_GROUP_ENDPOINT,
        objectType,
        requiredScopesAnyOf: [write],
        chosenSetupScopes: [write],
        docSource: METADATA_CREATE_PROPERTY_GROUP_DOC,
      },
      {
        step: "3.pre_read_properties",
        operation: "properties.list_or_get",
        method: "GET",
        endpoint: "/crm/properties/2026-09/{objectType}",
        objectType,
        requiredScopesAnyOf: [read],
        chosenSetupScopes: [read],
        docSource: METADATA_CREATE_PROPERTY_DOC.replace(
          "create-property.md",
          "get-properties.md",
        ),
      },
      {
        step: "3.write_property_if_missing",
        operation: "properties.create",
        method: "POST",
        endpoint: METADATA_CREATE_PROPERTY_ENDPOINT,
        objectType,
        requiredScopesAnyOf: [write],
        chosenSetupScopes: [write],
        docSource: METADATA_CREATE_PROPERTY_DOC,
      },
      {
        step: "4.post_read_parity",
        operation: "groups_and_properties.re_read",
        method: "GET",
        endpoint: `${METADATA_GET_PROPERTY_GROUP_ENDPOINT} + /crm/properties/2026-09/{objectType}`,
        objectType,
        requiredScopesAnyOf: [read],
        chosenSetupScopes: [read],
        docSource: METADATA_CREATE_PROPERTY_DOC.replace(
          "create-property.md",
          "get-properties.md",
        ),
      },
    );
  }
  return rows;
}

export type SetupEnvelopeCoverage = {
  ok: boolean;
  envelope: readonly string[];
  missingByOperation: Array<{
    operation: string;
    objectType: string;
    missing: string[];
  }>;
};

/**
 * Deterministic check: declared temporary setup envelope covers every matrix operation.
 * Does not call HubSpot.
 */
export function evaluateSetupCredentialEnvelopeCoverage(
  envelope: readonly string[] = CAP001_METADATA_SETUP_CREDENTIAL_SCOPES,
): SetupEnvelopeCoverage {
  const have = new Set(envelope);
  const missingByOperation: SetupEnvelopeCoverage["missingByOperation"] = [];
  for (const row of buildCap001MetadataSetupOperationMatrix()) {
    const missing = row.chosenSetupScopes.filter((scope) => !have.has(scope));
    if (missing.length > 0) {
      missingByOperation.push({
        operation: `${row.step}:${row.operation}`,
        objectType: row.objectType,
        missing,
      });
    }
  }
  return {
    ok: missingByOperation.length === 0,
    envelope: [...envelope].sort(),
    missingByOperation,
  };
}

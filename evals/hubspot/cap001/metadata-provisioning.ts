/**
 * Dry-only CAP-001 HubSpot cay_* metadata provisioning package
 * (CAY-20260917-HUBSPOT-READINESS-REFRESH).
 *
 * Enumerates exact create-property payloads for every required property across
 * contacts, deals, notes, tasks, meetings, emails. Does NOT call HubSpot.
 *
 * Create endpoint (retrieval 2026-09-17): POST /crm/properties/2026-09/{objectType}
 * Source: https://developers.hubspot.com/docs/api-reference/latest/crm/properties/create-property.md
 * Setup-only schema scopes — never on the steady-state runtime Service Key.
 */

import { CAP001_METADATA_PLAN } from "@/evals/hubspot/cap001/metadata-plan";

export const METADATA_PROVISIONING_RETRIEVAL_DATE = "2026-09-17";

export const METADATA_CREATE_PROPERTY_ENDPOINT =
  "POST /crm/properties/2026-09/{objectType}" as const;

export const METADATA_CREATE_PROPERTY_DOC =
  "https://developers.hubspot.com/docs/api-reference/latest/crm/properties/create-property.md";

/** One-time property group for CanAIYet lab custom fields (must exist or be created in setup). */
export const CAP001_PROPERTY_GROUP_NAME = "cay_cap001";

export type Cap001MetadataObjectType =
  (typeof CAP001_METADATA_PLAN.objectFamilies)[number];

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

export type PropertyIdempotenceResult =
  | { status: "MISSING"; spec: Cap001PropertySpec }
  | { status: "MATCH"; spec: Cap001PropertySpec }
  | { status: "INCOMPATIBLE"; spec: Cap001PropertySpec; reason: string };

export type DryMetadataProvisioningPlan = {
  retrievalDate: string;
  createPropertyEndpoint: typeof METADATA_CREATE_PROPERTY_ENDPOINT;
  createPropertyDoc: typeof METADATA_CREATE_PROPERTY_DOC;
  propertyGroupName: typeof CAP001_PROPERTY_GROUP_NAME;
  specs: Cap001PropertySpec[];
  toCreate: Cap001PropertySpec[];
  matched: Cap001PropertySpec[];
  incompatible: Array<{ spec: Cap001PropertySpec; reason: string }>;
  /** Fail closed when any incompatible definition exists. */
  ok: boolean;
  checklist: string[];
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
): DryMetadataProvisioningPlan {
  const specs = buildCap001PropertySpecs();
  const toCreate: Cap001PropertySpec[] = [];
  const matched: Cap001PropertySpec[] = [];
  const incompatible: Array<{ spec: Cap001PropertySpec; reason: string }> = [];

  for (const spec of specs) {
    const catalog = existingByObjectType.get(spec.objectType) ?? [];
    const existing = catalog.find((row) => row.name === spec.payload.name);
    const result = evaluatePropertyIdempotence(spec, existing);
    switch (result.status) {
      case "MISSING":
        toCreate.push(spec);
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
    `Create property group \`${CAP001_PROPERTY_GROUP_NAME}\` once per portal (UI or setup credential).`,
    `For each MISSING row, POST ${METADATA_CREATE_PROPERTY_ENDPOINT} with the exact payload (setup schema scope only).`,
    "MATCH rows are no-ops (idempotent).",
    "INCOMPATIBLE rows fail closed — do not overwrite; human resolves definition conflict.",
    "Do not put crm.schemas.*.write on the steady-state runtime Service Key.",
    "This package is dry-only until a separate human authorization creates properties.",
  ];

  return {
    retrievalDate: METADATA_PROVISIONING_RETRIEVAL_DATE,
    createPropertyEndpoint: METADATA_CREATE_PROPERTY_ENDPOINT,
    createPropertyDoc: METADATA_CREATE_PROPERTY_DOC,
    propertyGroupName: CAP001_PROPERTY_GROUP_NAME,
    specs,
    toCreate,
    matched,
    incompatible,
    ok: incompatible.length === 0,
    checklist,
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

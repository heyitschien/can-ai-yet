/**
 * HubSpot 2026-09 CRM write-validation attribution (CAY-20260917 readiness refresh).
 *
 * Official changelog (retrieval 2026-09-17):
 * https://developers.hubspot.com/changelog/crm-api-write-validation-enforcement
 *
 * Admin-configured validation on /2026-09/ writes is portal environment behavior.
 * Classify as INTEGRATION_FAILURE with HUBSPOT_PORTAL_WRITE_VALIDATION attribution.
 * Never treat as model capability failure.
 */

import type { HubSpotFailureClass } from "@/evals/hubspot/types";

export const HUBSPOT_WRITE_VALIDATION_CHANGELOG_URL =
  "https://developers.hubspot.com/changelog/crm-api-write-validation-enforcement";

export const HUBSPOT_WRITE_VALIDATION_RETRIEVAL_DATE = "2026-09-17";

/** Property catalog read pin (latest OpenAPI embed, retrieval 2026-09-17). */
export const HUBSPOT_PROPERTIES_LIST_PATH_TEMPLATE =
  "/crm/properties/2026-09/{objectType}";

export type HubSpotFailureAttribution =
  | "HUBSPOT_PORTAL_WRITE_VALIDATION"
  | "HUBSPOT_METADATA_GAP"
  | "OTHER";

export type HubSpotWriteValidationKind =
  | "CONDITIONAL_REQUIRED_PROPERTY"
  | "CREATE_RECORD_REQUIRED"
  | "EDIT_ASSOCIATIONS_PERMISSION"
  | "GENERIC_VALIDATION"
  | "NOT_WRITE_VALIDATION";

export type HubSpotWriteValidationClassification = {
  failureClass: HubSpotFailureClass;
  attribution: HubSpotFailureAttribution;
  kind: HubSpotWriteValidationKind;
  /** Hard lab rule: write-validation is never a model finding. */
  neverModelFailure: true;
  reason: string;
};

const CONDITIONAL_REQUIRED =
  /is required when|conditionally required|conditional(ly)? required/i;
/**
 * Create Record portal rules only — requires explicit Create Record evidence.
 * Do NOT match bare "missing required field/property" (payload/schema errors).
 */
const CREATE_RECORD_REQUIRED =
  /create\s*record(?:\s+settings)?/i;
const EDIT_ASSOCIATIONS =
  /edit associations|CRM_ASSOCIATIONS_WRITE_ACCESS|missing ['"]?edit associations/i;

/**
 * Classify an HTTP write failure for attribution.
 * Status 400/422 with validation-shaped messages → portal write validation.
 */
export function classifyHubSpotWriteValidation(input: {
  status: number;
  message: string;
}): HubSpotWriteValidationClassification {
  const message = input.message.trim();
  const isClientValidation = input.status === 400 || input.status === 422;

  if (!isClientValidation) {
    return {
      failureClass:
        input.status === 401 || input.status === 403
          ? "PERMISSION_FAILURE"
          : input.status === 429 || input.status >= 500
            ? "RUNTIME/API_FAILURE"
            : "INTEGRATION_FAILURE",
      attribution: "OTHER",
      kind: "NOT_WRITE_VALIDATION",
      neverModelFailure: true,
      reason: "Non-validation HTTP class; not HubSpot 2026-09 write-validation enforcement.",
    };
  }

  if (EDIT_ASSOCIATIONS.test(message)) {
    return {
      failureClass: "INTEGRATION_FAILURE",
      attribution: "HUBSPOT_PORTAL_WRITE_VALIDATION",
      kind: "EDIT_ASSOCIATIONS_PERMISSION",
      neverModelFailure: true,
      reason:
        "HubSpot Edit Associations permission rejected the write (OAuth user-level; Service Keys are portal-level and normally unaffected).",
    };
  }

  if (CONDITIONAL_REQUIRED.test(message)) {
    return {
      failureClass: "INTEGRATION_FAILURE",
      attribution: "HUBSPOT_PORTAL_WRITE_VALIDATION",
      kind: "CONDITIONAL_REQUIRED_PROPERTY",
      neverModelFailure: true,
      reason:
        "Portal conditional required-property rule rejected the write (2026-09 enforcement).",
    };
  }

  if (CREATE_RECORD_REQUIRED.test(message)) {
    return {
      failureClass: "INTEGRATION_FAILURE",
      attribution: "HUBSPOT_PORTAL_WRITE_VALIDATION",
      kind: "CREATE_RECORD_REQUIRED",
      neverModelFailure: true,
      reason:
        "Portal Create Record required field/association rejected the write (2026-09 enforcement).",
    };
  }

  // Unmatched 400/422: integration failure, but do NOT claim portal write-validation
  // without a matching HubSpot rule message. Malformed payloads stay OTHER.
  return {
    failureClass: "INTEGRATION_FAILURE",
    attribution: "OTHER",
    kind: "GENERIC_VALIDATION",
    neverModelFailure: true,
    reason:
      "Client validation 4xx without an evidenced HubSpot write-validation message pattern — integration/adapter or unknown client validation until proven as a portal rule; never as model failure.",
  };
}

/** UI-only checks — no authoritative API found in the 2026-09-17 refresh. */
export const HUBSPOT_WRITE_VALIDATION_UI_CHECKLIST = [
  "Settings → Properties: review conditional required rules for contacts, deals, notes, tasks, meetings, emails used by CAP-001.",
  "Settings → Objects → [each family] → Create Record: list required properties and associations; compare to CAP-001 seed payloads.",
  "Confirm lab portal has no unexpected Create Record associations (e.g. forced company on deal) that seed omits.",
  "If a portal rule conflicts with CAP-001 seed: fix portal config or authorize a seed-payload change — never weaken fixtures to hide the rule.",
] as const;

export type HubSpotPropertyDefinitionLite = {
  name: string;
  type?: string | null;
  fieldType?: string | null;
  groupName?: string | null;
  /** Present on some portals / future API shapes; treat as API-observable when set. */
  required?: boolean | null;
};

export type WriteValidationPropertyPreflight = {
  objectType: string;
  apiObservableRequiredNames: string[];
  missingCayPropertyNames: string[];
  incompatibleCayPropertyNames: string[];
  uiChecklistRequired: true;
  attributionIfBlocked: "HUBSPOT_METADATA_GAP" | "HUBSPOT_PORTAL_WRITE_VALIDATION" | null;
};

/**
 * Smallest deterministic catalog check: required cay_* presence/compatibility +
 * any API-visible `required: true` flags. Create Record / conditional rules stay UI.
 */
export function evaluatePropertyCatalogForWriteRisk(input: {
  objectType: string;
  definitions: readonly HubSpotPropertyDefinitionLite[];
  requiredCayNames: readonly string[];
  expectedType?: string;
  expectedFieldType?: string;
}): WriteValidationPropertyPreflight {
  const byName = new Map(
    input.definitions.map((d) => [d.name, d] as const),
  );
  const missingCayPropertyNames: string[] = [];
  const incompatibleCayPropertyNames: string[] = [];
  const expectedType = input.expectedType ?? "string";
  const expectedFieldType = input.expectedFieldType ?? "text";

  for (const name of input.requiredCayNames) {
    const existing = byName.get(name);
    if (!existing) {
      missingCayPropertyNames.push(name);
      continue;
    }
    const typeOk = !existing.type || existing.type === expectedType;
    const fieldOk = !existing.fieldType || existing.fieldType === expectedFieldType;
    if (!typeOk || !fieldOk) incompatibleCayPropertyNames.push(name);
  }

  const apiObservableRequiredNames = input.definitions
    .filter((d) => d.required === true)
    .map((d) => d.name)
    .sort();

  const attributionIfBlocked =
    missingCayPropertyNames.length > 0 || incompatibleCayPropertyNames.length > 0
      ? "HUBSPOT_METADATA_GAP"
      : apiObservableRequiredNames.length > 0
        ? "HUBSPOT_PORTAL_WRITE_VALIDATION"
        : null;

  return {
    objectType: input.objectType,
    apiObservableRequiredNames,
    missingCayPropertyNames,
    incompatibleCayPropertyNames,
    uiChecklistRequired: true,
    attributionIfBlocked,
  };
}

/**
 * Optional READ-ONLY HubSpot preflight (CAY-20260917-HUBSPOT-READINESS-REFRESH §F).
 *
 * Zero CRM mutations. Uses currently granted Service Key scopes only.
 * Fail-closed unless CAY_HUBSPOT_READONLY_PREFLIGHT=AUTHORIZED.
 *
 * Usage:
 *   CAY_HUBSPOT_READONLY_PREFLIGHT=AUTHORIZED pnpm hubspot:readonly-preflight
 */
import {
  HUBSPOT_API_HOST,
  HUBSPOT_API_VERSION,
  HUBSPOT_GRANTED_SCOPES,
  HUBSPOT_LAB_PORTAL_ID,
  HUBSPOT_SERVICE_KEY_NAME,
} from "../evals/hubspot/api-version";
import { CAP001_METADATA_PLAN } from "../evals/hubspot/cap001/metadata-plan";
import {
  buildDryMetadataProvisioningPlan,
  type Cap001MetadataObjectType,
  type ExistingPropertyDefinition,
} from "../evals/hubspot/cap001/metadata-provisioning";
import {
  evaluatePropertyCatalogForWriteRisk,
  HUBSPOT_PROPERTIES_LIST_PATH_TEMPLATE,
  HUBSPOT_WRITE_VALIDATION_UI_CHECKLIST,
} from "../evals/hubspot/cap001/write-validation";
import {
  HUBSPOT_SERVICE_KEY_ENV,
  isHubSpotServiceKeyConfigured,
  loadRepoEnvLocal,
} from "../evals/hubspot/local-env";
import { assertNoSecrets, redactSecrets } from "../evals/hubspot/redact";

type ReadAttempt = {
  operation: string;
  method: "GET";
  path: string;
  ok: boolean;
  status?: number;
  failureClass?: "PERMISSION_FAILURE" | "INTEGRATION_FAILURE" | "RUNTIME/API_FAILURE" | "BLOCKED_SCOPE";
  message?: string;
  requestId?: string;
};

function assertReadonlyAuthorized(): void {
  if (process.env.CAY_HUBSPOT_READONLY_PREFLIGHT !== "AUTHORIZED") {
    throw new Error(
      "Refusing HubSpot read-only preflight: set CAY_HUBSPOT_READONLY_PREFLIGHT=AUTHORIZED " +
        "(Issue #1 CAY-20260917-HUBSPOT-READINESS-REFRESH §F). Zero mutations; contacts scopes only.",
    );
  }
}

function propertiesPath(objectType: string): string {
  return HUBSPOT_PROPERTIES_LIST_PATH_TEMPLATE.replace("{objectType}", objectType);
}

async function getJson(
  token: string,
  path: string,
  operation: string,
): Promise<{ attempt: ReadAttempt; body?: unknown }> {
  const url = `${HUBSPOT_API_HOST}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const message = redactSecrets(error instanceof Error ? error.message : String(error));
    return {
      attempt: {
        operation,
        method: "GET",
        path,
        ok: false,
        failureClass: "RUNTIME/API_FAILURE",
        message,
      },
    };
  }

  const requestId =
    response.headers.get("x-hubspot-correlation-id") ??
    response.headers.get("x-request-id") ??
    undefined;
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = undefined;
  }

  if (response.status === 401 || response.status === 403) {
    return {
      attempt: {
        operation,
        method: "GET",
        path,
        ok: false,
        status: response.status,
        failureClass: "BLOCKED_SCOPE",
        message: redactSecrets(text.slice(0, 300) || `HTTP ${response.status}`),
        requestId,
      },
    };
  }

  if (!response.ok) {
    return {
      attempt: {
        operation,
        method: "GET",
        path,
        ok: false,
        status: response.status,
        failureClass:
          response.status >= 500 || response.status === 429
            ? "RUNTIME/API_FAILURE"
            : "INTEGRATION_FAILURE",
        message: redactSecrets(text.slice(0, 300) || `HTTP ${response.status}`),
        requestId,
      },
    };
  }

  return {
    attempt: {
      operation,
      method: "GET",
      path,
      ok: true,
      status: response.status,
      requestId,
    },
    body,
  };
}

function asPropertyDefs(body: unknown): ExistingPropertyDefinition[] {
  if (!body || typeof body !== "object") return [];
  const results = (body as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];
  return results
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    .map((row) => ({
      name: String(row.name ?? ""),
      type: row.type == null ? null : String(row.type),
      fieldType: row.fieldType == null ? null : String(row.fieldType),
      groupName: row.groupName == null ? null : String(row.groupName),
      label: row.label == null ? null : String(row.label),
    }))
    .filter((row) => row.name);
}

async function main(): Promise<void> {
  assertReadonlyAuthorized();
  const loaded = loadRepoEnvLocal();
  if (!isHubSpotServiceKeyConfigured()) {
    throw new Error(
      `${HUBSPOT_SERVICE_KEY_ENV} is not configured` +
        (loaded.fileLoaded ? " after loading .env.local" : " (.env.local not found)"),
    );
  }

  const token = process.env[HUBSPOT_SERVICE_KEY_ENV]!;
  const attempts: ReadAttempt[] = [];

  // Connectivity: list one contact page (read-only).
  const contactsList = await getJson(
    token,
    `/crm/objects/${HUBSPOT_API_VERSION}/contacts?limit=1&properties=email`,
    "contacts.list_limit_1",
  );
  attempts.push(contactsList.attempt);

  const objectTypes = [...CAP001_METADATA_PLAN.objectFamilies] as Cap001MetadataObjectType[];
  const existingByObjectType = new Map<
    Cap001MetadataObjectType,
    ExistingPropertyDefinition[]
  >();

  for (const objectType of objectTypes) {
    const path = propertiesPath(objectType);
    const result = await getJson(token, path, `properties.list.${objectType}`);
    attempts.push(result.attempt);
    if (result.attempt.ok) {
      existingByObjectType.set(objectType, asPropertyDefs(result.body));
    }
  }

  const dryPlan = buildDryMetadataProvisioningPlan(existingByObjectType);
  const contactCatalog = existingByObjectType.get("contacts") ?? [];
  const contactWriteRisk = evaluatePropertyCatalogForWriteRisk({
    objectType: "contacts",
    definitions: contactCatalog.map((row) => ({
      name: row.name,
      type: row.type,
      fieldType: row.fieldType,
    })),
    requiredCayNames: CAP001_METADATA_PLAN.contactProperties.map((p) => p.name),
  });

  const receipt = {
    receiptId: "CAY-20260917-HUBSPOT-READINESS-REFRESH",
    mode: "read_only_preflight",
    timestamp: new Date().toISOString(),
    portalId: HUBSPOT_LAB_PORTAL_ID,
    serviceKeyName: HUBSPOT_SERVICE_KEY_NAME,
    grantedScopes: [...HUBSPOT_GRANTED_SCOPES],
    mutations: 0,
    scopeChanges: 0,
    modelCalls: 0,
    attempts,
    dryMetadata: {
      ok: dryPlan.ok,
      totalSpecs: dryPlan.specs.length,
      toCreate: dryPlan.toCreate.length,
      matched: dryPlan.matched.length,
      incompatible: dryPlan.incompatible.map((row) => ({
        objectType: row.spec.objectType,
        name: row.spec.payload.name,
        reason: row.reason,
      })),
      catalogsReadable: [...existingByObjectType.keys()],
      catalogsBlockedScope: objectTypes.filter((t) => !existingByObjectType.has(t)),
    },
    contactWriteRisk,
    uiChecklist: [...HUBSPOT_WRITE_VALIDATION_UI_CHECKLIST],
    redactionStatus: "secrets_scrubbed" as const,
  };

  assertNoSecrets(receipt);
  console.log(JSON.stringify(receipt, null, 2));

  if (!contactsList.attempt.ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(redactSecrets(message));
  process.exitCode = 2;
});

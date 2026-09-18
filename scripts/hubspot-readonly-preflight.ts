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
  /** Non-secret portal ID extracted from HubSpot response/error body when present. */
  observedPortalId?: string;
};

const PORTAL_ID_IN_TEXT = /portal\s+(\d{6,})/i;

function extractPortalIdFromText(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const match = text.match(PORTAL_ID_IN_TEXT);
  return match?.[1];
}

function collectObservedPortalIds(attempts: readonly ReadAttempt[]): string[] {
  const ids = new Set<string>();
  for (const attempt of attempts) {
    if (attempt.observedPortalId) ids.add(attempt.observedPortalId);
  }
  return [...ids].sort();
}

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
    const message = redactSecrets(text.slice(0, 300) || `HTTP ${response.status}`);
    return {
      attempt: {
        operation,
        method: "GET",
        path,
        ok: false,
        status: response.status,
        failureClass: "BLOCKED_SCOPE",
        message,
        requestId,
        observedPortalId: extractPortalIdFromText(message),
      },
    };
  }

  if (!response.ok) {
    const message = redactSecrets(text.slice(0, 300) || `HTTP ${response.status}`);
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
        message,
        requestId,
        observedPortalId: extractPortalIdFromText(message),
      },
    };
  }

  const bodyPortal =
    body && typeof body === "object" && "portalId" in body
      ? String((body as { portalId: unknown }).portalId)
      : undefined;

  return {
    attempt: {
      operation,
      method: "GET",
      path,
      ok: true,
      status: response.status,
      requestId,
      observedPortalId: bodyPortal ?? extractPortalIdFromText(text),
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
  const expectedPortalId = HUBSPOT_LAB_PORTAL_ID;

  // Authoritative non-secret portal identity (read-only).
  const accountInfo = await getJson(
    token,
    "/account-info/v3/details",
    "account_info.details",
  );
  attempts.push(accountInfo.attempt);

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

  const observedPortalIds = collectObservedPortalIds(attempts);
  const accountInfoPortalId =
    accountInfo.attempt.observedPortalId ??
    (accountInfo.body &&
    typeof accountInfo.body === "object" &&
    "portalId" in accountInfo.body
      ? String((accountInfo.body as { portalId: unknown }).portalId)
      : undefined);
  const authoritativePortalId = accountInfoPortalId ?? observedPortalIds[0];
  const portalIdentityResolved =
    authoritativePortalId === expectedPortalId &&
    observedPortalIds.every((id) => id === expectedPortalId);

  const accountType =
    accountInfo.body &&
    typeof accountInfo.body === "object" &&
    "accountType" in accountInfo.body
      ? String((accountInfo.body as { accountType: unknown }).accountType)
      : undefined;

  const receipt = {
    receiptId: "CAY-20260917-HUBSPOT-PORTAL-IDENTITY-VALIDATION",
    mode: "read_only_preflight",
    timestamp: new Date().toISOString(),
    expectedPortalId,
    expectedAccountName: "CanAIYet CAP-001 Lab",
    authoritativePortalId: authoritativePortalId ?? null,
    accountType: accountType ?? null,
    observedPortalIds,
    portalIdentityResolved,
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

  if (!contactsList.attempt.ok || !accountInfo.attempt.ok || !portalIdentityResolved) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(redactSecrets(message));
  process.exitCode = 2;
});

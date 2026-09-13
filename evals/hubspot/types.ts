/**
 * HubSpot no-model commissioning types.
 * Separate from the AI-facing CAP-001 tool layer.
 */

export type HubSpotFailureClass =
  | "INTEGRATION_FAILURE"
  | "PERMISSION_FAILURE"
  | "RUNTIME/API_FAILURE";

export type HubSpotAuthMechanism = "service_key" | "oauth" | "none_configured";

export type HubSpotCommissioningConfig = {
  environmentId: string;
  environmentVersion: string;
  apiVersion: string;
  authMechanism: HubSpotAuthMechanism;
  /** Non-secret portal/account identifier when known. */
  portalId?: string;
  /** Namespace prefix for synthetic objects (never production). */
  syntheticNamespace: string;
  /**
   * Unique run identifier recorded on the receipt.
   * Drives live email `cay-comm-<runId>@example.com`.
   */
  runId?: string;
  /** Credential present in process env — never logged. */
  credentialConfigured: boolean;
};

/**
 * Domain contact shape for commissioning.
 * Maps to HubSpot standard properties only (no custom properties / schema-write).
 */
export type HubSpotSyntheticContact = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  /** Standard HubSpot property `jobtitle` — harmless update proof field. */
  jobTitle: string | null;
  archived: boolean;
};

export type HubSpotOperationName =
  | "preflight"
  | "create_contact"
  | "read_contact"
  | "update_contact"
  | "cleanup_contact"
  | "verify_cleanup";

export type HubSpotOperationRecord = {
  operation: HubSpotOperationName;
  ok: boolean;
  requestId?: string;
  objectId?: string;
  failureClass?: HubSpotFailureClass;
  message?: string;
  /** True when failure is an authoritative absence (not permission/runtime). */
  notFound?: boolean;
};

export type HubSpotCommissioningReceipt = {
  receiptId: string;
  gitHead: string;
  timestamp: string;
  environmentId: string;
  environmentVersion: string;
  apiVersion: string;
  authMechanism: HubSpotAuthMechanism;
  portalId?: string;
  /** Non-secret fixture run id used to reconstruct syntheticEmail. */
  runId: string;
  /** Synthetic contact email for this run (`cay-comm-<runId>@example.com`). */
  syntheticEmail: string;
  operationSequence: HubSpotOperationRecord[];
  createdObjectIds: string[];
  cleanupVerified: boolean;
  failureClass?: HubSpotFailureClass;
  anomalies: string[];
  /** Always empty in a correct receipt — secrets must never appear here. */
  redactionStatus: "secrets_scrubbed";
};

/**
 * Transport result.
 * Failed reads that mean the object is gone must set `notFound: true`.
 * Permission/runtime/integration errors must leave `notFound` unset/false.
 */
export type HubSpotTransportResult<T> =
  | { ok: true; data: T; requestId: string }
  | {
      ok: false;
      failureClass: HubSpotFailureClass;
      message: string;
      requestId?: string;
      notFound?: boolean;
    };

export type HubSpotTransport = {
  preflight(): Promise<HubSpotTransportResult<{ scopesOk: boolean; apiVersion: string }>>;
  createContact(input: {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
  }): Promise<HubSpotTransportResult<HubSpotSyntheticContact>>;
  getContact(id: string): Promise<HubSpotTransportResult<HubSpotSyntheticContact>>;
  updateContact(
    id: string,
    patch: { jobTitle: string },
  ): Promise<HubSpotTransportResult<HubSpotSyntheticContact>>;
  archiveContact(id: string): Promise<HubSpotTransportResult<{ id: string; archived: boolean }>>;
};

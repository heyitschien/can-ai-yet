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
  /** Credential present in process env — never logged. */
  credentialConfigured: boolean;
};

export type HubSpotSyntheticContact = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  /** Harmless synthetic field used for update proof. */
  cayCommissioningNote: string | null;
  cayFixtureId: string;
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
  operationSequence: HubSpotOperationRecord[];
  createdObjectIds: string[];
  cleanupVerified: boolean;
  failureClass?: HubSpotFailureClass;
  anomalies: string[];
  /** Always empty in a correct receipt — secrets must never appear here. */
  redactionStatus: "secrets_scrubbed";
};

export type HubSpotTransportResult<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; failureClass: HubSpotFailureClass; message: string; requestId?: string };

export type HubSpotTransport = {
  preflight(): Promise<HubSpotTransportResult<{ scopesOk: boolean; apiVersion: string }>>;
  createContact(input: {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    cayFixtureId: string;
  }): Promise<HubSpotTransportResult<HubSpotSyntheticContact>>;
  getContact(id: string): Promise<HubSpotTransportResult<HubSpotSyntheticContact>>;
  updateContact(
    id: string,
    patch: { cayCommissioningNote: string },
  ): Promise<HubSpotTransportResult<HubSpotSyntheticContact>>;
  archiveContact(id: string): Promise<HubSpotTransportResult<{ id: string; archived: boolean }>>;
};

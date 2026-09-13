import type {
  HubSpotFailureClass,
  HubSpotSyntheticContact,
  HubSpotTransport,
  HubSpotTransportResult,
} from "@/evals/hubspot/types";

export type MockHubSpotMode =
  | "happy"
  | "permission_denied"
  | "validation_reject"
  | "runtime_error"
  | "cleanup_fail";

export type MockHubSpotOptions = {
  mode?: MockHubSpotMode;
  apiVersion?: string;
};

/**
 * Deterministic in-memory HubSpot transport for no-live commissioning proofs.
 * Never performs network I/O.
 */
export class MockHubSpotTransport implements HubSpotTransport {
  readonly contacts = new Map<string, HubSpotSyntheticContact>();
  private seq = 0;
  private readonly mode: MockHubSpotMode;
  private readonly apiVersion: string;

  constructor(options: MockHubSpotOptions = {}) {
    this.mode = options.mode ?? "happy";
    this.apiVersion = options.apiVersion ?? "2026-09";
  }

  private nextRequestId(op: string): string {
    this.seq += 1;
    return `mock-req-${op}-${this.seq}`;
  }

  private fail<T>(failureClass: HubSpotFailureClass, message: string, op: string): HubSpotTransportResult<T> {
    return { ok: false, failureClass, message, requestId: this.nextRequestId(op) };
  }

  async preflight(): Promise<HubSpotTransportResult<{ scopesOk: boolean; apiVersion: string }>> {
    if (this.mode === "permission_denied") {
      return this.fail("PERMISSION_FAILURE", "Missing or insufficient Service Key scopes", "preflight");
    }
    if (this.mode === "runtime_error") {
      return this.fail("RUNTIME/API_FAILURE", "HubSpot API timeout during preflight", "preflight");
    }
    return {
      ok: true,
      data: { scopesOk: true, apiVersion: this.apiVersion },
      requestId: this.nextRequestId("preflight"),
    };
  }

  async createContact(input: {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    cayFixtureId: string;
  }): Promise<HubSpotTransportResult<HubSpotSyntheticContact>> {
    if (this.mode === "permission_denied") {
      return this.fail("PERMISSION_FAILURE", "Create denied: insufficient CRM write scope", "create");
    }
    if (this.mode === "validation_reject") {
      return this.fail("INTEGRATION_FAILURE", "CRM validation rejected contact write", "create");
    }
    if (this.mode === "runtime_error") {
      return this.fail("RUNTIME/API_FAILURE", "5xx creating contact", "create");
    }
    const id = `mock-contact-${this.contacts.size + 1}`;
    const contact: HubSpotSyntheticContact = {
      id,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company,
      cayCommissioningNote: null,
      cayFixtureId: input.cayFixtureId,
      archived: false,
    };
    this.contacts.set(id, contact);
    return { ok: true, data: { ...contact }, requestId: this.nextRequestId("create") };
  }

  async getContact(id: string): Promise<HubSpotTransportResult<HubSpotSyntheticContact>> {
    if (this.mode === "runtime_error") {
      return this.fail("RUNTIME/API_FAILURE", "5xx reading contact", "read");
    }
    const contact = this.contacts.get(id);
    if (!contact || contact.archived) {
      return this.fail("INTEGRATION_FAILURE", `Contact not found: ${id}`, "read");
    }
    return { ok: true, data: { ...contact }, requestId: this.nextRequestId("read") };
  }

  async updateContact(
    id: string,
    patch: { cayCommissioningNote: string },
  ): Promise<HubSpotTransportResult<HubSpotSyntheticContact>> {
    if (this.mode === "validation_reject") {
      return this.fail("INTEGRATION_FAILURE", "CRM validation rejected contact update", "update");
    }
    if (this.mode === "permission_denied") {
      return this.fail("PERMISSION_FAILURE", "Update denied: insufficient CRM write scope", "update");
    }
    const contact = this.contacts.get(id);
    if (!contact || contact.archived) {
      return this.fail("INTEGRATION_FAILURE", `Contact not found: ${id}`, "update");
    }
    const updated = { ...contact, cayCommissioningNote: patch.cayCommissioningNote };
    this.contacts.set(id, updated);
    return { ok: true, data: { ...updated }, requestId: this.nextRequestId("update") };
  }

  async archiveContact(id: string): Promise<HubSpotTransportResult<{ id: string; archived: boolean }>> {
    if (this.mode === "cleanup_fail") {
      return this.fail("INTEGRATION_FAILURE", "Cleanup archive failed", "cleanup");
    }
    if (this.mode === "permission_denied") {
      return this.fail("PERMISSION_FAILURE", "Archive denied: insufficient CRM write scope", "cleanup");
    }
    const contact = this.contacts.get(id);
    if (!contact) {
      return this.fail("INTEGRATION_FAILURE", `Contact not found: ${id}`, "cleanup");
    }
    const archived = { ...contact, archived: true };
    this.contacts.set(id, archived);
    return { ok: true, data: { id, archived: true }, requestId: this.nextRequestId("cleanup") };
  }
}

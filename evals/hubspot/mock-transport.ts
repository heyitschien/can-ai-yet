import type {
  HubSpotFailureClass,
  HubSpotSyntheticContact,
  HubSpotTransport,
  HubSpotTransportResult,
} from "@/evals/hubspot/types";

export type MockFailAt =
  | "preflight"
  | "create"
  | "first_read"
  | "update"
  | "second_read"
  | "cleanup"
  | "verify";

/** @deprecated Prefer failAt — kept for existing test names. */
export type MockHubSpotMode =
  | "happy"
  | "permission_denied"
  | "validation_reject"
  | "runtime_error"
  | "cleanup_fail";

export type MockHubSpotOptions = {
  mode?: MockHubSpotMode;
  failAt?: MockFailAt;
  failureClass?: HubSpotFailureClass;
  /**
   * How getContact behaves after a successful archive during verify.
   * Default: authoritative not_found.
   */
  afterArchiveGet?: "not_found" | "permission" | "runtime" | "still_present";
  apiVersion?: string;
};

function modeToFailAt(mode: MockHubSpotMode): { failAt?: MockFailAt; failureClass?: HubSpotFailureClass } {
  switch (mode) {
    case "happy":
      return {};
    case "permission_denied":
      return { failAt: "preflight", failureClass: "PERMISSION_FAILURE" };
    case "validation_reject":
      return { failAt: "create", failureClass: "INTEGRATION_FAILURE" };
    case "runtime_error":
      return { failAt: "preflight", failureClass: "RUNTIME/API_FAILURE" };
    case "cleanup_fail":
      return { failAt: "cleanup", failureClass: "INTEGRATION_FAILURE" };
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

/**
 * Deterministic in-memory HubSpot transport for no-live commissioning proofs.
 * Never performs network I/O.
 */
export class MockHubSpotTransport implements HubSpotTransport {
  readonly contacts = new Map<string, HubSpotSyntheticContact>();
  private seq = 0;
  private readCount = 0;
  private readonly failAt?: MockFailAt;
  private readonly failureClass: HubSpotFailureClass;
  private readonly afterArchiveGet: NonNullable<MockHubSpotOptions["afterArchiveGet"]>;
  private readonly apiVersion: string;

  constructor(options: MockHubSpotOptions = {}) {
    const fromMode = modeToFailAt(options.mode ?? "happy");
    this.failAt = options.failAt ?? fromMode.failAt;
    this.failureClass = options.failureClass ?? fromMode.failureClass ?? "INTEGRATION_FAILURE";
    this.afterArchiveGet = options.afterArchiveGet ?? "not_found";
    this.apiVersion = options.apiVersion ?? "2026-03";
  }

  private nextRequestId(op: string): string {
    this.seq += 1;
    return `mock-req-${op}-${this.seq}`;
  }

  private fail<T>(
    failureClass: HubSpotFailureClass,
    message: string,
    op: string,
    notFound?: boolean,
  ): HubSpotTransportResult<T> {
    return { ok: false, failureClass, message, requestId: this.nextRequestId(op), notFound };
  }

  async preflight(): Promise<HubSpotTransportResult<{ scopesOk: boolean; apiVersion: string }>> {
    if (this.failAt === "preflight") {
      return this.fail(this.failureClass, `Preflight failed: ${this.failureClass}`, "preflight");
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
  }): Promise<HubSpotTransportResult<HubSpotSyntheticContact>> {
    if (this.failAt === "create") {
      return this.fail(this.failureClass, `Create failed: ${this.failureClass}`, "create");
    }
    const id = `mock-contact-${this.contacts.size + 1}`;
    const contact: HubSpotSyntheticContact = {
      id,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company,
      jobTitle: null,
      archived: false,
    };
    this.contacts.set(id, contact);
    return { ok: true, data: { ...contact }, requestId: this.nextRequestId("create") };
  }

  async getContact(id: string): Promise<HubSpotTransportResult<HubSpotSyntheticContact>> {
    this.readCount += 1;
    const contact = this.contacts.get(id);

    if (contact?.archived) {
      switch (this.afterArchiveGet) {
        case "not_found":
          return this.fail("INTEGRATION_FAILURE", `Contact not found: ${id}`, "read", true);
        case "permission":
          return this.fail("PERMISSION_FAILURE", "Read denied during cleanup verify", "read");
        case "runtime":
          return this.fail("RUNTIME/API_FAILURE", "5xx during cleanup verify", "read");
        case "still_present":
          return {
            ok: true,
            data: { ...contact, archived: false },
            requestId: this.nextRequestId("read"),
          };
        default: {
          const _exhaustive: never = this.afterArchiveGet;
          return _exhaustive;
        }
      }
    }

    if (this.failAt === "first_read" && this.readCount === 1) {
      return this.fail(this.failureClass, `First read failed: ${this.failureClass}`, "read");
    }
    if (this.failAt === "second_read" && this.readCount === 2) {
      return this.fail(this.failureClass, `Second read failed: ${this.failureClass}`, "read");
    }

    if (!contact) {
      return this.fail("INTEGRATION_FAILURE", `Contact not found: ${id}`, "read", true);
    }

    return { ok: true, data: { ...contact }, requestId: this.nextRequestId("read") };
  }

  async updateContact(
    id: string,
    patch: { jobTitle: string },
  ): Promise<HubSpotTransportResult<HubSpotSyntheticContact>> {
    if (this.failAt === "update") {
      return this.fail(this.failureClass, `Update failed: ${this.failureClass}`, "update");
    }
    const contact = this.contacts.get(id);
    if (!contact || contact.archived) {
      return this.fail("INTEGRATION_FAILURE", `Contact not found: ${id}`, "update", true);
    }
    const updated = { ...contact, jobTitle: patch.jobTitle };
    this.contacts.set(id, updated);
    return { ok: true, data: { ...updated }, requestId: this.nextRequestId("update") };
  }

  async archiveContact(id: string): Promise<HubSpotTransportResult<{ id: string; archived: boolean }>> {
    if (this.failAt === "cleanup") {
      return this.fail(this.failureClass, `Cleanup archive failed: ${this.failureClass}`, "cleanup");
    }
    const contact = this.contacts.get(id);
    if (!contact) {
      return this.fail("INTEGRATION_FAILURE", `Contact not found: ${id}`, "cleanup", true);
    }
    const archived = { ...contact, archived: true };
    this.contacts.set(id, archived);
    return { ok: true, data: { id, archived: true }, requestId: this.nextRequestId("cleanup") };
  }
}

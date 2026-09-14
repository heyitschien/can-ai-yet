/**
 * Injectable HubSpot HTTP client for CAP-001 live adapter (CAY-10).
 * All network goes through fetchImpl — tests inject a mock; no live calls in CI.
 */

import { classifyHubSpotHttpStatus, extractHubSpotRequestId } from "@/evals/hubspot/http";
import {
  CAP001_CONTACTS_BASE_PATH,
  CAP001_CONTACTS_SEARCH_PATH,
  CAP001_CONTACT_PROPERTY_NAMES,
  CAP001_DEALS_CRUD_BASE_PATH,
  CAP001_DEAL_PROPERTY_NAMES,
  CAP001_DEFAULT_GRANTED_SCOPES,
  CAP001_EMAILS_BASE_PATH,
  CAP001_EMAIL_PROPERTY_NAMES,
  CAP001_MEETINGS_BASE_PATH,
  CAP001_MEETING_PROPERTY_NAMES,
  CAP001_NOTES_BASE_PATH,
  CAP001_NOTE_PROPERTY_NAMES,
  CAP001_TASKS_BASE_PATH,
  CAP001_TASK_PROPERTY_NAMES,
  DOC_CONFLICT_EMAILS_ARCHIVE,
  DOC_CONFLICT_MEETINGS_ARCHIVE,
  HUBSPOT_API_BASE_URL,
  HUBSPOT_ASSOC_DEAL_TO_CONTACT,
  HUBSPOT_ASSOC_EMAIL_TO_CONTACT,
  HUBSPOT_ASSOC_MEETING_TO_CONTACT,
  HUBSPOT_ASSOC_NOTE_TO_CONTACT,
  HUBSPOT_ASSOC_TASK_TO_CONTACT,
  SCOPE_CONTACTS_READ,
  SCOPE_CONTACTS_WRITE,
  SCOPE_DEALS_READ,
  SCOPE_DEALS_WRITE,
  cap001DealArchivePath,
  cap001NoteArchivePath,
  cap001TaskArchivePath,
} from "@/evals/hubspot/cap001/paths";
import { redactSecrets } from "@/evals/hubspot/redact";
import type { HubSpotFailureClass, HubSpotTransportResult } from "@/evals/hubspot/types";

export type Cap001HubSpotAssociationResults = {
  results?: Array<{ id: string; type?: string }>;
};

export type Cap001HubSpotObject = {
  id: string;
  archived?: boolean;
  properties?: Record<string, string | null | undefined>;
  associations?: Record<string, Cap001HubSpotAssociationResults>;
};

export type Cap001HubSpotListPage = {
  results?: Cap001HubSpotObject[];
  paging?: { next?: { after?: string } };
};

export type Cap001HubSpotHttpClientOptions = {
  accessToken: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  grantedScopes?: ReadonlySet<string> | readonly string[];
};

function toScopeSet(scopes: ReadonlySet<string> | readonly string[] | undefined): Set<string> {
  if (!scopes) return new Set(CAP001_DEFAULT_GRANTED_SCOPES);
  return scopes instanceof Set ? new Set(scopes) : new Set(scopes);
}

function associationSpec(contactId: string, associationTypeId: number) {
  return {
    to: { id: contactId },
    types: [
      {
        associationCategory: "HUBSPOT_DEFINED" as const,
        associationTypeId,
      },
    ],
  };
}

export class Cap001HubSpotHttpClient {
  readonly accessToken: string;
  readonly baseUrl: string;
  readonly grantedScopes: Set<string>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: Cap001HubSpotHttpClientOptions) {
    if (!options.accessToken) {
      throw new Error("Cap001HubSpotHttpClient requires accessToken");
    }
    this.accessToken = options.accessToken;
    this.baseUrl = (options.baseUrl ?? HUBSPOT_API_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.grantedScopes = toScopeSet(options.grantedScopes);
  }

  hasScope(scope: string): boolean {
    return this.grantedScopes.has(scope);
  }

  hasAllScopes(scopes: readonly string[]): boolean {
    return scopes.every((scope) => this.grantedScopes.has(scope));
  }

  private scopeGap(missing: readonly string[]): {
    ok: false;
    failureClass: HubSpotFailureClass;
    message: string;
  } {
    return {
      ok: false,
      failureClass: "PERMISSION_FAILURE",
      message: `SCOPE_GAP: missing ${missing.join(", ")}`,
    };
  }

  private requireScopes(scopes: readonly string[]): {
    ok: false;
    failureClass: HubSpotFailureClass;
    message: string;
  } | null {
    const missing = scopes.filter((scope) => !this.grantedScopes.has(scope));
    if (missing.length === 0) return null;
    return this.scopeGap(missing);
  }

  private authHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<HubSpotTransportResult<T>> {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers: this.authHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      return {
        ok: false,
        failureClass: "RUNTIME/API_FAILURE",
        message: redactSecrets(error instanceof Error ? error.message : "network error"),
      };
    }

    const requestId = extractHubSpotRequestId(response.headers);
    if (response.ok) {
      if (response.status === 204) {
        return { ok: true, data: undefined as T, requestId: requestId ?? `http-${response.status}` };
      }
      const json = (await response.json()) as T;
      return { ok: true, data: json, requestId: requestId ?? `http-${response.status}` };
    }

    const classified = classifyHubSpotHttpStatus(response.status);
    let message = `HubSpot HTTP ${response.status}`;
    try {
      const errBody = (await response.json()) as { message?: string };
      if (errBody.message) message = errBody.message;
    } catch {
      // ignore body parse failures
    }
    return {
      ok: false,
      failureClass: classified.failureClass,
      message: redactSecrets(message),
      requestId,
      notFound: classified.notFound,
    };
  }

  async listAll(
    path: string,
    query: Record<string, string | number | undefined> = {},
  ): Promise<HubSpotTransportResult<Cap001HubSpotObject[]>> {
    const results: Cap001HubSpotObject[] = [];
    let after: string | undefined;
    let lastRequestId = "list";

    do {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;
        params.set(key, String(value));
      }
      if (after) params.set("after", after);
      if (!params.has("limit")) params.set("limit", "100");
      const pagePath = `${path}?${params.toString()}`;
      const page = await this.request<Cap001HubSpotListPage>("GET", pagePath);
      if (!page.ok) return page;
      lastRequestId = page.requestId;
      results.push(...(page.data.results ?? []));
      after = page.data.paging?.next?.after;
    } while (after);

    return { ok: true, data: results, requestId: lastRequestId };
  }

  async searchContacts(body: Record<string, unknown>): Promise<HubSpotTransportResult<Cap001HubSpotListPage>> {
    const gap = this.requireScopes([SCOPE_CONTACTS_READ]);
    if (gap) return gap;
    return this.request<Cap001HubSpotListPage>("POST", CAP001_CONTACTS_SEARCH_PATH, body);
  }

  async getContact(contactId: string): Promise<HubSpotTransportResult<Cap001HubSpotObject>> {
    const gap = this.requireScopes([SCOPE_CONTACTS_READ]);
    if (gap) return gap;
    const props = CAP001_CONTACT_PROPERTY_NAMES.join(",");
    return this.request<Cap001HubSpotObject>(
      "GET",
      `${CAP001_CONTACTS_BASE_PATH}/${encodeURIComponent(contactId)}?properties=${props}`,
    );
  }

  async createContact(properties: Record<string, string>): Promise<HubSpotTransportResult<Cap001HubSpotObject>> {
    const gap = this.requireScopes([SCOPE_CONTACTS_WRITE]);
    if (gap) return gap;
    return this.request<Cap001HubSpotObject>("POST", CAP001_CONTACTS_BASE_PATH, { properties });
  }

  async updateContact(
    contactId: string,
    properties: Record<string, string>,
  ): Promise<HubSpotTransportResult<Cap001HubSpotObject>> {
    const gap = this.requireScopes([SCOPE_CONTACTS_WRITE]);
    if (gap) return gap;
    return this.request<Cap001HubSpotObject>(
      "PATCH",
      `${CAP001_CONTACTS_BASE_PATH}/${encodeURIComponent(contactId)}`,
      { properties },
    );
  }

  async archiveContact(contactId: string): Promise<HubSpotTransportResult<undefined>> {
    const gap = this.requireScopes([SCOPE_CONTACTS_WRITE]);
    if (gap) return gap;
    return this.request<undefined>(
      "DELETE",
      `${CAP001_CONTACTS_BASE_PATH}/${encodeURIComponent(contactId)}`,
    );
  }

  async createNote(input: {
    properties: Record<string, string>;
    contactId?: string;
  }): Promise<HubSpotTransportResult<Cap001HubSpotObject>> {
    const gap = this.requireScopes([SCOPE_CONTACTS_WRITE]);
    if (gap) return gap;
    const body: Record<string, unknown> = { properties: input.properties };
    if (input.contactId) {
      body.associations = [associationSpec(input.contactId, HUBSPOT_ASSOC_NOTE_TO_CONTACT)];
    }
    return this.request<Cap001HubSpotObject>("POST", CAP001_NOTES_BASE_PATH, body);
  }

  async listNotes(query: Record<string, string | number | undefined> = {}): Promise<
    HubSpotTransportResult<Cap001HubSpotObject[]>
  > {
    const gap = this.requireScopes([SCOPE_CONTACTS_READ]);
    if (gap) return gap;
    return this.listAll(CAP001_NOTES_BASE_PATH, {
      properties: CAP001_NOTE_PROPERTY_NAMES.join(","),
      associations: "contacts",
      ...query,
    });
  }

  async createTask(input: {
    properties: Record<string, string>;
    contactId?: string;
  }): Promise<HubSpotTransportResult<Cap001HubSpotObject>> {
    const gap = this.requireScopes([SCOPE_CONTACTS_WRITE]);
    if (gap) return gap;
    const body: Record<string, unknown> = { properties: input.properties };
    if (input.contactId) {
      body.associations = [associationSpec(input.contactId, HUBSPOT_ASSOC_TASK_TO_CONTACT)];
    }
    return this.request<Cap001HubSpotObject>("POST", CAP001_TASKS_BASE_PATH, body);
  }

  async listTasks(query: Record<string, string | number | undefined> = {}): Promise<
    HubSpotTransportResult<Cap001HubSpotObject[]>
  > {
    const gap = this.requireScopes([SCOPE_CONTACTS_READ]);
    if (gap) return gap;
    return this.listAll(CAP001_TASKS_BASE_PATH, {
      properties: CAP001_TASK_PROPERTY_NAMES.join(","),
      associations: "contacts",
      ...query,
    });
  }

  async createMeeting(input: {
    properties: Record<string, string>;
    contactId?: string;
  }): Promise<HubSpotTransportResult<Cap001HubSpotObject>> {
    const gap = this.requireScopes([SCOPE_CONTACTS_WRITE]);
    if (gap) return gap;
    const body: Record<string, unknown> = { properties: input.properties };
    if (input.contactId) {
      body.associations = [associationSpec(input.contactId, HUBSPOT_ASSOC_MEETING_TO_CONTACT)];
    }
    return this.request<Cap001HubSpotObject>("POST", CAP001_MEETINGS_BASE_PATH, body);
  }

  async listMeetings(query: Record<string, string | number | undefined> = {}): Promise<
    HubSpotTransportResult<Cap001HubSpotObject[]>
  > {
    const gap = this.requireScopes([SCOPE_CONTACTS_READ]);
    if (gap) return gap;
    return this.listAll(CAP001_MEETINGS_BASE_PATH, {
      properties: CAP001_MEETING_PROPERTY_NAMES.join(","),
      associations: "contacts",
      ...query,
    });
  }

  async updateMeeting(
    meetingId: string,
    properties: Record<string, string>,
  ): Promise<HubSpotTransportResult<Cap001HubSpotObject>> {
    const gap = this.requireScopes([SCOPE_CONTACTS_WRITE]);
    if (gap) return gap;
    return this.request<Cap001HubSpotObject>(
      "PATCH",
      `${CAP001_MEETINGS_BASE_PATH}/${encodeURIComponent(meetingId)}`,
      { properties },
    );
  }

  async createEmail(input: {
    properties: Record<string, string>;
    contactId?: string;
  }): Promise<HubSpotTransportResult<Cap001HubSpotObject>> {
    // Emails: contacts.write OR sales-email-read — we hold contacts.write.
    const gap = this.requireScopes([SCOPE_CONTACTS_WRITE]);
    if (gap) return gap;
    const body: Record<string, unknown> = { properties: input.properties };
    if (input.contactId) {
      body.associations = [associationSpec(input.contactId, HUBSPOT_ASSOC_EMAIL_TO_CONTACT)];
    }
    return this.request<Cap001HubSpotObject>("POST", CAP001_EMAILS_BASE_PATH, body);
  }

  async listEmails(query: Record<string, string | number | undefined> = {}): Promise<
    HubSpotTransportResult<Cap001HubSpotObject[]>
  > {
    const gap = this.requireScopes([SCOPE_CONTACTS_READ]);
    if (gap) return gap;
    return this.listAll(CAP001_EMAILS_BASE_PATH, {
      properties: CAP001_EMAIL_PROPERTY_NAMES.join(","),
      associations: "contacts",
      ...query,
    });
  }

  async createDeal(input: {
    properties: Record<string, string>;
    contactId?: string;
  }): Promise<HubSpotTransportResult<Cap001HubSpotObject>> {
    const gap = this.requireScopes([SCOPE_DEALS_WRITE]);
    if (gap) return gap;
    const body: Record<string, unknown> = { properties: input.properties };
    if (input.contactId) {
      body.associations = [associationSpec(input.contactId, HUBSPOT_ASSOC_DEAL_TO_CONTACT)];
    }
    return this.request<Cap001HubSpotObject>("POST", CAP001_DEALS_CRUD_BASE_PATH, body);
  }

  async getDeal(dealId: string): Promise<HubSpotTransportResult<Cap001HubSpotObject>> {
    const gap = this.requireScopes([SCOPE_DEALS_READ]);
    if (gap) return gap;
    const props = CAP001_DEAL_PROPERTY_NAMES.join(",");
    return this.request<Cap001HubSpotObject>(
      "GET",
      `${CAP001_DEALS_CRUD_BASE_PATH}/${encodeURIComponent(dealId)}?properties=${props}`,
    );
  }

  async updateDeal(
    dealId: string,
    properties: Record<string, string>,
  ): Promise<HubSpotTransportResult<Cap001HubSpotObject>> {
    const gap = this.requireScopes([SCOPE_DEALS_WRITE]);
    if (gap) return gap;
    return this.request<Cap001HubSpotObject>(
      "PATCH",
      `${CAP001_DEALS_CRUD_BASE_PATH}/${encodeURIComponent(dealId)}`,
      { properties },
    );
  }

  async archiveDeal(dealId: string): Promise<HubSpotTransportResult<undefined>> {
    const gap = this.requireScopes([SCOPE_DEALS_WRITE]);
    if (gap) return gap;
    return this.request<undefined>("DELETE", cap001DealArchivePath(dealId));
  }

  async listDeals(query: Record<string, string | number | undefined> = {}): Promise<
    HubSpotTransportResult<Cap001HubSpotObject[]>
  > {
    const gap = this.requireScopes([SCOPE_DEALS_READ]);
    if (gap) return gap;
    return this.listAll(CAP001_DEALS_CRUD_BASE_PATH, {
      properties: CAP001_DEAL_PROPERTY_NAMES.join(","),
      associations: "contacts",
      ...query,
    });
  }

  async archiveNote(noteId: string): Promise<HubSpotTransportResult<undefined>> {
    const gap = this.requireScopes([SCOPE_CONTACTS_WRITE]);
    if (gap) return gap;
    return this.request<undefined>("DELETE", cap001NoteArchivePath(noteId));
  }

  async archiveTask(taskId: string): Promise<HubSpotTransportResult<undefined>> {
    const gap = this.requireScopes([SCOPE_CONTACTS_WRITE]);
    if (gap) return gap;
    return this.request<undefined>("DELETE", cap001TaskArchivePath(taskId));
  }

  /**
   * meetings.archive is DOC_CONFLICT (OpenAPI 2026-09 vs rendered/dated 2026-03).
   * Fail closed — never issue a live DELETE while contested.
   */
  async archiveMeeting(meetingId: string): Promise<HubSpotTransportResult<undefined>> {
    void meetingId;
    return {
      ok: false,
      failureClass: "INTEGRATION_FAILURE",
      message: DOC_CONFLICT_MEETINGS_ARCHIVE,
    };
  }

  /**
   * emails.archive is DOC_CONFLICT (OpenAPI 2026-09 vs rendered/dated 2026-03).
   * Fail closed — never issue a live DELETE while contested.
   */
  async archiveEmail(emailId: string): Promise<HubSpotTransportResult<undefined>> {
    void emailId;
    return {
      ok: false,
      failureClass: "INTEGRATION_FAILURE",
      message: DOC_CONFLICT_EMAILS_ARCHIVE,
    };
  }
}

export function isScopeGapMessage(message: string): boolean {
  return message.startsWith("SCOPE_GAP:");
}

export function isDocConflictMessage(message: string): boolean {
  return message.includes("DOC_CONFLICT");
}

export function mapClientFailureToEnv(
  failureClass: HubSpotFailureClass,
  message: string,
): HubSpotFailureClass | "SCOPE_GAP" | "ADAPTER_GAP" {
  if (isScopeGapMessage(message)) return "SCOPE_GAP";
  // Unresolved vendor docs → not live-ready (ADAPTER_GAP); message retains DOC_CONFLICT.
  if (isDocConflictMessage(message)) return "ADAPTER_GAP";
  return failureClass;
}

export type { HubSpotFailureClass };

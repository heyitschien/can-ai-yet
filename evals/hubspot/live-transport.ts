import {
  HUBSPOT_API_VERSION,
  HUBSPOT_CONTACT_PROPERTIES,
  HUBSPOT_CONTACTS_URL,
  HUBSPOT_UPDATE_PROPERTY,
} from "@/evals/hubspot/api-version";
import { classifyHubSpotHttpStatus, extractHubSpotRequestId } from "@/evals/hubspot/http";
import { redactSecrets } from "@/evals/hubspot/redact";
import type {
  HubSpotSyntheticContact,
  HubSpotTransport,
  HubSpotTransportResult,
} from "@/evals/hubspot/types";

export type LiveHubSpotTransportOptions = {
  accessToken: string;
  apiVersion?: string;
  contactsUrl?: string;
  fetchImpl?: typeof fetch;
};

type HubSpotContactResponse = {
  id: string;
  archived?: boolean;
  properties?: Record<string, string | null | undefined>;
};

function mapContact(payload: HubSpotContactResponse): HubSpotSyntheticContact {
  const properties = payload.properties ?? {};
  return {
    id: payload.id,
    email: String(properties.email ?? ""),
    firstName: String(properties.firstname ?? ""),
    lastName: String(properties.lastname ?? ""),
    company: String(properties.company ?? ""),
    jobTitle: properties[HUBSPOT_UPDATE_PROPERTY] ? String(properties[HUBSPOT_UPDATE_PROPERTY]) : null,
    archived: Boolean(payload.archived),
  };
}

/**
 * Real HubSpot Contacts transport for CAY-06.
 * Stage A: implement + unit-test with injected fetch.
 * Stage B: live mutations only when separately authorized.
 */
export class LiveHubSpotTransport implements HubSpotTransport {
  private readonly token: string;
  private readonly contactsUrl: string;
  private readonly apiVersion: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: LiveHubSpotTransportOptions) {
    if (!options.accessToken) {
      throw new Error("LiveHubSpotTransport requires accessToken");
    }
    this.token = options.accessToken;
    this.contactsUrl = options.contactsUrl ?? HUBSPOT_CONTACTS_URL;
    this.apiVersion = options.apiVersion ?? HUBSPOT_API_VERSION;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private authHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    method: string,
    url: string,
    body?: Record<string, unknown>,
  ): Promise<HubSpotTransportResult<T>> {
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

  async preflight(): Promise<HubSpotTransportResult<{ scopesOk: boolean; apiVersion: string }>> {
    // Read-only probe: list at most one contact. Does not create/update/delete.
    const url = `${this.contactsUrl}?limit=1&properties=${HUBSPOT_CONTACT_PROPERTIES.join(",")}`;
    const result = await this.request<{ results?: unknown[] }>("GET", url);
    if (!result.ok) return result;
    return {
      ok: true,
      data: { scopesOk: true, apiVersion: this.apiVersion },
      requestId: result.requestId,
    };
  }

  async createContact(input: {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
  }): Promise<HubSpotTransportResult<HubSpotSyntheticContact>> {
    const result = await this.request<HubSpotContactResponse>("POST", this.contactsUrl, {
      properties: {
        email: input.email,
        firstname: input.firstName,
        lastname: input.lastName,
        company: input.company,
      },
    });
    if (!result.ok) return result;
    return { ok: true, data: mapContact(result.data), requestId: result.requestId };
  }

  async getContact(id: string): Promise<HubSpotTransportResult<HubSpotSyntheticContact>> {
    const url = `${this.contactsUrl}/${encodeURIComponent(id)}?properties=${HUBSPOT_CONTACT_PROPERTIES.join(",")}`;
    const result = await this.request<HubSpotContactResponse>("GET", url);
    if (!result.ok) return result;
    const contact = mapContact(result.data);
    if (contact.archived) {
      return {
        ok: false,
        failureClass: "INTEGRATION_FAILURE",
        message: `Contact not found: ${id}`,
        requestId: result.requestId,
        notFound: true,
      };
    }
    return { ok: true, data: contact, requestId: result.requestId };
  }

  async updateContact(
    id: string,
    patch: { jobTitle: string },
  ): Promise<HubSpotTransportResult<HubSpotSyntheticContact>> {
    const url = `${this.contactsUrl}/${encodeURIComponent(id)}`;
    const result = await this.request<HubSpotContactResponse>("PATCH", url, {
      properties: {
        [HUBSPOT_UPDATE_PROPERTY]: patch.jobTitle,
      },
    });
    if (!result.ok) return result;
    return { ok: true, data: mapContact(result.data), requestId: result.requestId };
  }

  async archiveContact(id: string): Promise<HubSpotTransportResult<{ id: string; archived: boolean }>> {
    const url = `${this.contactsUrl}/${encodeURIComponent(id)}`;
    const result = await this.request<undefined>("DELETE", url);
    if (!result.ok) return result;
    return {
      ok: true,
      data: { id, archived: true },
      requestId: result.requestId,
    };
  }
}

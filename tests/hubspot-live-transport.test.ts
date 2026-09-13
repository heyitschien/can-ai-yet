import { describe, expect, it, vi } from "vitest";
import {
  HUBSPOT_API_VERSION,
  HUBSPOT_CONTACTS_URL,
  HUBSPOT_UPDATE_PROPERTY,
  HUBSPOT_UPDATE_VALUE,
} from "@/evals/hubspot/api-version";
import { classifyHubSpotHttpStatus } from "@/evals/hubspot/http";
import { assertHubSpotLiveSmokeAuthorized, isHubSpotLiveSmokeAuthorized } from "@/evals/hubspot/live-gate";
import { LiveHubSpotTransport } from "@/evals/hubspot/live-transport";
import { assertNoSecrets } from "@/evals/hubspot/redact";

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "x-hubspot-correlation-id": headers["x-hubspot-correlation-id"] ?? "corr-test-1",
      ...headers,
    },
  });
}

describe("HubSpot HTTP status classification", () => {
  it("maps 404 to authoritative not-found", () => {
    expect(classifyHubSpotHttpStatus(404)).toEqual({
      failureClass: "INTEGRATION_FAILURE",
      notFound: true,
    });
  });

  it("maps 401/403 to PERMISSION_FAILURE", () => {
    expect(classifyHubSpotHttpStatus(401).failureClass).toBe("PERMISSION_FAILURE");
    expect(classifyHubSpotHttpStatus(403).failureClass).toBe("PERMISSION_FAILURE");
  });

  it("maps validation 4xx to INTEGRATION_FAILURE", () => {
    expect(classifyHubSpotHttpStatus(400).failureClass).toBe("INTEGRATION_FAILURE");
    expect(classifyHubSpotHttpStatus(422).failureClass).toBe("INTEGRATION_FAILURE");
  });

  it("maps 429/5xx to RUNTIME/API_FAILURE", () => {
    expect(classifyHubSpotHttpStatus(429).failureClass).toBe("RUNTIME/API_FAILURE");
    expect(classifyHubSpotHttpStatus(503).failureClass).toBe("RUNTIME/API_FAILURE");
  });
});

describe("LiveHubSpotTransport (injected fetch)", () => {
  it("builds create request against /crm/objects/2026-09/contacts with standard properties only", async () => {
    const fetchImpl = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(String(url)).toBe(HUBSPOT_CONTACTS_URL);
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body));
      expect(body.properties).toEqual({
        email: "cay-comm.acme.contact@example.invalid",
        firstname: "Acme",
        lastname: "Commissioning",
        company: "Acme Services (synthetic)",
      });
      expect(body.properties.cayFixtureId).toBeUndefined();
      expect(body.properties.cayCommissioningNote).toBeUndefined();
      return jsonResponse(201, {
        id: "99",
        archived: false,
        properties: {
          email: "cay-comm.acme.contact@example.invalid",
          firstname: "Acme",
          lastname: "Commissioning",
          company: "Acme Services (synthetic)",
          jobtitle: null,
        },
      });
    });

    const transport = new LiveHubSpotTransport({
      accessToken: "test-token-not-a-real-secret",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const created = await transport.createContact({
      email: "cay-comm.acme.contact@example.invalid",
      firstName: "Acme",
      lastName: "Commissioning",
      company: "Acme Services (synthetic)",
    });
    expect(created.ok).toBe(true);
    if (created.ok) {
      expect(created.data.id).toBe("99");
      expect(created.requestId).toBe("corr-test-1");
    }
  });

  it("parses 2xx get/update and uses jobtitle as harmless update field", async () => {
    const fetchImpl = vi.fn(async (url: string | URL, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        const body = JSON.parse(String(init.body));
        expect(body.properties).toEqual({ [HUBSPOT_UPDATE_PROPERTY]: HUBSPOT_UPDATE_VALUE });
        return jsonResponse(200, {
          id: "99",
          properties: {
            email: "a@b.invalid",
            firstname: "A",
            lastname: "B",
            company: "C",
            jobtitle: HUBSPOT_UPDATE_VALUE,
          },
        });
      }
      return jsonResponse(200, {
        id: "99",
        archived: false,
        properties: {
          email: "a@b.invalid",
          firstname: "A",
          lastname: "B",
          company: "C",
          jobtitle: null,
        },
      });
    });

    const transport = new LiveHubSpotTransport({
      accessToken: "test-token",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const read = await transport.getContact("99");
    expect(read.ok).toBe(true);
    const updated = await transport.updateContact("99", { jobTitle: HUBSPOT_UPDATE_VALUE });
    expect(updated.ok).toBe(true);
    if (updated.ok) expect(updated.data.jobTitle).toBe(HUBSPOT_UPDATE_VALUE);
  });

  it("treats 404 as authoritative not-found", async () => {
    const transport = new LiveHubSpotTransport({
      accessToken: "test-token",
      fetchImpl: (async () => jsonResponse(404, { message: "resource not found" })) as unknown as typeof fetch,
    });
    const result = await transport.getContact("missing");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.notFound).toBe(true);
      expect(result.failureClass).toBe("INTEGRATION_FAILURE");
    }
  });

  it("maps 401/403 to PERMISSION_FAILURE", async () => {
    const transport = new LiveHubSpotTransport({
      accessToken: "test-token",
      fetchImpl: (async () => jsonResponse(403, { message: "insufficient scopes" })) as unknown as typeof fetch,
    });
    const result = await transport.preflight();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failureClass).toBe("PERMISSION_FAILURE");
  });

  it("maps validation 400 to INTEGRATION_FAILURE", async () => {
    const transport = new LiveHubSpotTransport({
      accessToken: "test-token",
      fetchImpl: (async () => jsonResponse(400, { message: "Property values were not valid" })) as unknown as typeof fetch,
    });
    const result = await transport.createContact({
      email: "bad",
      firstName: "A",
      lastName: "B",
      company: "C",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failureClass).toBe("INTEGRATION_FAILURE");
  });

  it("maps 429/5xx to RUNTIME/API_FAILURE", async () => {
    const transport = new LiveHubSpotTransport({
      accessToken: "test-token",
      fetchImpl: (async () => jsonResponse(429, { message: "rate limit" })) as unknown as typeof fetch,
    });
    const result = await transport.preflight();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failureClass).toBe("RUNTIME/API_FAILURE");
  });

  it("archives via DELETE and keeps request id", async () => {
    const transport = new LiveHubSpotTransport({
      accessToken: "test-token",
      fetchImpl: (async () =>
        jsonResponse(204, null, { "x-hubspot-correlation-id": "corr-del" })) as unknown as typeof fetch,
    });
    const result = await transport.archiveContact("99");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.archived).toBe(true);
      expect(result.requestId).toBe("corr-del");
    }
  });

  it("does not put secrets into failure messages", async () => {
    const transport = new LiveHubSpotTransport({
      accessToken: "pat-should-not-leak-123456",
      fetchImpl: (async () => {
        throw new Error("upstream rejected Bearer pat-should-not-leak-123456");
      }) as unknown as typeof fetch,
    });
    const result = await transport.preflight();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).not.toContain("pat-should-not-leak");
      assertNoSecrets(result);
    }
  });
});

describe("live smoke authorization gate", () => {
  it("is fail-closed by default", () => {
    expect(isHubSpotLiveSmokeAuthorized({})).toBe(false);
    expect(() => assertHubSpotLiveSmokeAuthorized({})).toThrow(/disabled/i);
  });

  it("opens only when AUTHORIZED", () => {
    expect(isHubSpotLiveSmokeAuthorized({ CAY_HUBSPOT_LIVE_SMOKE: "AUTHORIZED" })).toBe(true);
    expect(() => assertHubSpotLiveSmokeAuthorized({ CAY_HUBSPOT_LIVE_SMOKE: "AUTHORIZED" })).not.toThrow();
  });

  it("pins API version 2026-09", () => {
    expect(HUBSPOT_API_VERSION).toBe("2026-09");
    expect(HUBSPOT_CONTACTS_URL).toContain("/crm/objects/2026-09/contacts");
  });
});

import type { HubSpotCap001EnvironmentPort, HubSpotCap001EnvResult } from "@/evals/hubspot/cap001/port";
import type { Cap001ObjectFamily } from "@/evals/hubspot/cap001/port";
import type { HubSpotCap001State } from "@/evals/hubspot/cap001/types";
import type { LiveHubSpotTransport } from "@/evals/hubspot/live-transport";

/**
 * Live HubSpot CAP-001 environment adapter boundary.
 *
 * Current Service Key scopes: contacts.read + contacts.write only.
 * Any non-contact CAP-001 family fails closed with SCOPE_GAP.
 * No live 12-scenario suite / no scope expansion in this receipt.
 * Contact-family operations may use the accepted LiveHubSpotTransport when wired;
 * seed/reset of the full fixture graph is ADAPTER_GAP until Envelope A is authorized.
 */
export class LiveHubSpotCap001Adapter implements HubSpotCap001EnvironmentPort {
  readonly kind = "live" as const;
  private readonly transport: LiveHubSpotTransport | null;

  constructor(options: { transport?: LiveHubSpotTransport } = {}) {
    this.transport = options.transport ?? null;
  }

  supportedFamilies(): ReadonlySet<Cap001ObjectFamily> {
    // Contacts CRUD transport exists, but full CAP-001 seed graph / custom props
    // are not live-ready until Envelope A scopes + adapter work are authorized.
    return new Set();
  }

  seedBaseline(runId: string): HubSpotCap001EnvResult<{ runId: string }> {
    return {
      ok: false,
      failureClass: "ADAPTER_GAP",
      message: `Live CAP-001 seedBaseline is not authorized (runId=${runId}). Contacts-only Service Key cannot materialize the full fixture graph.`,
      family: "contacts",
    };
  }

  reset(runId: string): HubSpotCap001EnvResult<{ runId: string }> {
    return {
      ok: false,
      failureClass: "ADAPTER_GAP",
      message: `Live CAP-001 reset is not authorized (runId=${runId}).`,
      family: "contacts",
    };
  }

  readAuthoritativeState(): HubSpotCap001EnvResult<HubSpotCap001State> {
    if (!this.transport) {
      return {
        ok: false,
        failureClass: "ADAPTER_GAP",
        message: "Live CAP-001 adapter has no transport; refuse to invent CRM state.",
      };
    }
    return {
      ok: false,
      failureClass: "SCOPE_GAP",
      message:
        "Live authoritative CAP-001 snapshot requires Envelope A object reads (deals/notes/tasks/engagements/appointments) beyond contacts.read/write.",
      family: "deals",
    };
  }

  /** Explicit fail-closed helper for tests / callers. */
  requireFamily(family: Cap001ObjectFamily): HubSpotCap001EnvResult<true> {
    if (!this.supportedFamilies().has(family)) {
      return {
        ok: false,
        failureClass: family === "contacts" ? "ADAPTER_GAP" : "SCOPE_GAP",
        message: `Live CAP-001 family '${family}' is not READY under current scopes/adapter.`,
        family,
      };
    }
    return { ok: true, data: true };
  }
}

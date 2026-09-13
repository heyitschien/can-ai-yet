import type { HubSpotCap001EnvironmentPort, HubSpotCap001EnvResult } from "@/evals/hubspot/cap001/port";
import type { Cap001ObjectFamily } from "@/evals/hubspot/cap001/port";
import { CAP001_LIVE_ENVIRONMENT_SCOPE_BLOCKER } from "@/evals/hubspot/cap001/scope-matrix";
import type { HubSpotCap001State } from "@/evals/hubspot/cap001/types";
import type { LiveHubSpotTransport } from "@/evals/hubspot/live-transport";

/**
 * Live HubSpot CAP-001 environment adapter boundary.
 *
 * Current Service Key scopes: contacts.read + contacts.write only.
 * - Deals → SCOPE_GAP (verified missing crm.objects.deals.read/write).
 * - Notes/tasks/meetings/emails/escalations/flags/contacts → ADAPTER_GAP
 *   (contact scopes suffice per HubSpot Required Scopes docs; CAP-001 live wiring missing).
 * No live 12-scenario suite / no scope expansion in this receipt.
 */
export class LiveHubSpotCap001Adapter implements HubSpotCap001EnvironmentPort {
  readonly kind = "live" as const;
  private readonly transport: LiveHubSpotTransport | null;

  constructor(options: { transport?: LiveHubSpotTransport } = {}) {
    this.transport = options.transport ?? null;
  }

  supportedFamilies(): ReadonlySet<Cap001ObjectFamily> {
    // Full CAP-001 graph is not live-ready until deals scopes + adapter work land.
    return new Set();
  }

  seedBaseline(runId: string): HubSpotCap001EnvResult<{ runId: string }> {
    return {
      ok: false,
      failureClass: "SCOPE_GAP",
      message: `Live CAP-001 seedBaseline blocked (runId=${runId}). ${CAP001_LIVE_ENVIRONMENT_SCOPE_BLOCKER}`,
      family: "deals",
    };
  }

  reset(runId: string): HubSpotCap001EnvResult<{ runId: string }> {
    return {
      ok: false,
      failureClass: "SCOPE_GAP",
      message: `Live CAP-001 reset blocked (runId=${runId}). ${CAP001_LIVE_ENVIRONMENT_SCOPE_BLOCKER}`,
      family: "deals",
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
      message: CAP001_LIVE_ENVIRONMENT_SCOPE_BLOCKER,
      family: "deals",
    };
  }

  /** Explicit fail-closed helper for tests / callers. */
  requireFamily(family: Cap001ObjectFamily): HubSpotCap001EnvResult<true> {
    if (this.supportedFamilies().has(family)) {
      return { ok: true, data: true };
    }

    switch (family) {
      case "deals":
        return {
          ok: false,
          failureClass: "SCOPE_GAP",
          message:
            "Live CAP-001 deals require crm.objects.deals.read/write (verified missing on Service Key).",
          family,
        };
      case "contacts":
      case "notes":
      case "tasks":
      case "outbounds":
      case "escalations":
      case "flags":
      case "appointments":
        return {
          ok: false,
          failureClass: "ADAPTER_GAP",
          message: `Live CAP-001 family '${family}' is contact-scoped per HubSpot Required Scopes docs but CAP-001 live adapter is not wired yet.`,
          family,
        };
      default: {
        const _exhaustive: never = family;
        return _exhaustive;
      }
    }
  }
}

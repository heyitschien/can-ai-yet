/**
 * CAP-001 HubSpot environment port.
 * Implementations: in-memory calibration store vs live HubSpot adapter.
 * Live path must fail closed for unauthorized object families (no simulated success).
 */

import type { HubSpotCap001State } from "@/evals/hubspot/cap001/types";
import type { HubSpotFailureClass } from "@/evals/hubspot/types";

export type Cap001ObjectFamily =
  | "contacts"
  | "deals"
  | "notes"
  | "tasks"
  | "outbounds"
  | "escalations"
  | "flags"
  | "appointments";

export type HubSpotCap001EnvResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      failureClass: HubSpotFailureClass | "SCOPE_GAP" | "ADAPTER_GAP";
      message: string;
      family?: Cap001ObjectFamily;
    };

export type HubSpotCap001EnvironmentPort = {
  readonly kind: "mock" | "live";
  seedBaseline(runId: string): HubSpotCap001EnvResult<{ runId: string }>;
  reset(runId: string): HubSpotCap001EnvResult<{ runId: string }>;
  /** Authoritative CRM state for projection — must not invent missing fixtures. */
  readAuthoritativeState(): HubSpotCap001EnvResult<HubSpotCap001State>;
  /** Declare which object families this implementation can actually execute. */
  supportedFamilies(): ReadonlySet<Cap001ObjectFamily>;
};

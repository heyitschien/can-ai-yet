import {
  HUBSPOT_API_VERSION,
  HUBSPOT_LAB_PORTAL_ID,
  HUBSPOT_LIVE_ADAPTER_VERSION,
} from "@/evals/hubspot/api-version";
import { defaultHubSpotEnvironment, type EnvironmentManifest } from "@/evals/manifest/experiment-manifest";

/** Versions for the no-model commissioning machinery. */
export const HUBSPOT_COMMISSIONING_ADAPTER_VERSION = HUBSPOT_LIVE_ADAPTER_VERSION;
export const HUBSPOT_COMMISSIONING_API_VERSION = HUBSPOT_API_VERSION;

/**
 * EnvironmentManifest template for HubSpot commissioning machinery.
 * Portal ID is non-secret provenance; env head stays unresolved until a live Stage B receipt.
 */
export function hubspotCommissioningEnvironmentManifest(
  overrides: Partial<{ envHeadSha: string }> = {},
): EnvironmentManifest {
  return defaultHubSpotEnvironment({
    envHeadSha: overrides.envHeadSha ?? "hubspot-env-head-unresolved",
    adapterImplementationVersion: HUBSPOT_COMMISSIONING_ADAPTER_VERSION,
    apiVersion: HUBSPOT_COMMISSIONING_API_VERSION,
    seedResetVersion: "hubspot-seed-reset-planned-v1",
    snapshotProjectionVersion: "hubspot-snapshot-planned-v1",
    runnerVersion: "hubspot-commissioning-runner-v1",
    environmentPermissionMechanicsVersion: "hubspot-envelope-a-contacts-rw-v1",
  });
}

export function hubspotLabPortalId(): string {
  return HUBSPOT_LAB_PORTAL_ID;
}

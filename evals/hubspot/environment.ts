import { defaultHubSpotEnvironment, type EnvironmentManifest } from "@/evals/manifest/experiment-manifest";

/** Versions for the no-model commissioning machinery (not live portal values). */
export const HUBSPOT_COMMISSIONING_ADAPTER_VERSION = "hubspot-commissioning-mock-v1";
export const HUBSPOT_COMMISSIONING_API_VERSION = "2026-09";

/**
 * EnvironmentManifest template for HubSpot commissioning machinery.
 * Live portal/account values stay unresolved until a real commissioning receipt exists.
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
    environmentPermissionMechanicsVersion: "hubspot-envelope-a-v1",
  });
}

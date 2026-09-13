/**
 * Live HubSpot smoke is fail-closed until Stage B is explicitly authorized.
 * Never treat presence of HUBSPOT_SERVICE_KEY alone as authorization.
 */
export const LIVE_SMOKE_AUTH_ENV = "CAY_HUBSPOT_LIVE_SMOKE";
export const LIVE_SMOKE_AUTHORIZED_VALUE = "AUTHORIZED";

export function isHubSpotLiveSmokeAuthorized(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env[LIVE_SMOKE_AUTH_ENV] === LIVE_SMOKE_AUTHORIZED_VALUE;
}

export function assertHubSpotLiveSmokeAuthorized(
  env: Record<string, string | undefined> = process.env,
): void {
  if (!isHubSpotLiveSmokeAuthorized(env)) {
    throw new Error(
      `HubSpot live commissioning smoke is disabled. Set ${LIVE_SMOKE_AUTH_ENV}=${LIVE_SMOKE_AUTHORIZED_VALUE} only after independent review authorizes Stage B. Do not improvise.`,
    );
  }
}

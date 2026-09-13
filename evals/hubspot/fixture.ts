/**
 * Live HubSpot commissioning email fixture policy (CAY-07).
 *
 * CAY-06 Stage B proved HubSpot rejects the prior synthetic-lab invalid-TLD
 * fixture as INVALID_EMAIL (INTEGRATION_FAILURE / fixture portability).
 * Live path uses IANA-reserved `example.com` with a unique run id:
 * `cay-comm-<run-id>@example.com`.
 */

export const HUBSPOT_FIXTURE_EMAIL_DOMAIN = "example.com";
export const HUBSPOT_FIXTURE_EMAIL_LOCAL_PREFIX = "cay-comm";

const RUN_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Normalize and validate a commissioning run id (alphanumeric + hyphen). */
export function normalizeHubSpotFixtureRunId(raw: string): string {
  const runId = raw.trim().toLowerCase();
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new Error(
      "HubSpot fixture runId must be lowercase alphanumeric with optional hyphens (e.g. 20260913-a1b2)",
    );
  }
  return runId;
}

/**
 * Build the synthetic contact email for a commissioning run.
 * Reconstructible from recorded runId alone.
 */
export function buildHubSpotCommissioningEmail(runId: string): string {
  const normalized = normalizeHubSpotFixtureRunId(runId);
  return `${HUBSPOT_FIXTURE_EMAIL_LOCAL_PREFIX}-${normalized}@${HUBSPOT_FIXTURE_EMAIL_DOMAIN}`;
}

/** Default run id when caller does not supply one (still unique per process call). */
export function createHubSpotFixtureRunId(now: Date = new Date()): string {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "z")
    .toLowerCase();
  const suffix = Math.random().toString(36).slice(2, 8);
  return normalizeHubSpotFixtureRunId(`${stamp}-${suffix}`);
}

export function isHubSpotLiveFixtureEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith(`@${HUBSPOT_FIXTURE_EMAIL_DOMAIN}`) &&
    normalized.startsWith(`${HUBSPOT_FIXTURE_EMAIL_LOCAL_PREFIX}-`) &&
    !normalized.includes("invalid")
  );
}

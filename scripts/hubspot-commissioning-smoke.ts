/**
 * Fail-closed entry point for CAY-06 Stage B live no-model smoke.
 * Stage A must not run this without independent authorization.
 *
 * Loads repo-local `.env.local` deterministically (does not print secrets).
 *
 * Usage (only after review authorizes Stage B):
 *   CAY_HUBSPOT_LIVE_SMOKE=AUTHORIZED pnpm hubspot:commissioning-smoke
 */
import { HUBSPOT_API_VERSION, HUBSPOT_LAB_PORTAL_ID, HUBSPOT_LIVE_ADAPTER_VERSION } from "../evals/hubspot/api-version";
import { runHubSpotCommissioningLifecycle } from "../evals/hubspot/commissioning";
import { assertHubSpotLiveSmokeAuthorized } from "../evals/hubspot/live-gate";
import { LiveHubSpotTransport } from "../evals/hubspot/live-transport";
import {
  HUBSPOT_SERVICE_KEY_ENV,
  isHubSpotServiceKeyConfigured,
  loadRepoEnvLocal,
} from "../evals/hubspot/local-env";
import { assertNoSecrets } from "../evals/hubspot/redact";

async function main(): Promise<void> {
  assertHubSpotLiveSmokeAuthorized();

  const loaded = loadRepoEnvLocal();
  if (!isHubSpotServiceKeyConfigured()) {
    throw new Error(
      `${HUBSPOT_SERVICE_KEY_ENV} is not configured. Expected it in local secret storage` +
        (loaded.fileLoaded ? " after loading .env.local" : " (.env.local not found)"),
    );
  }

  const token = process.env[HUBSPOT_SERVICE_KEY_ENV]!;
  const transport = new LiveHubSpotTransport({ accessToken: token });
  const result = await runHubSpotCommissioningLifecycle({
    transport,
    config: {
      environmentId: "hubspot-dev-test-v1",
      environmentVersion: "hubspot-transfer-v1",
      apiVersion: HUBSPOT_API_VERSION,
      authMechanism: "service_key",
      portalId: HUBSPOT_LAB_PORTAL_ID,
      syntheticNamespace: "cay-comm",
      credentialConfigured: true,
    },
    gitHead: process.env.CAY_GIT_HEAD ?? "uncommitted",
  });

  assertNoSecrets(result.receipt);
  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        adapterVersion: HUBSPOT_LIVE_ADAPTER_VERSION,
        apiVersion: HUBSPOT_API_VERSION,
        envFileLoaded: loaded.fileLoaded,
        serviceKeyConfigured: true,
        failureClass: result.failureClass,
        cleanupVerified: result.receipt.cleanupVerified,
        createdObjectIds: result.receipt.createdObjectIds,
        operationSequence: result.receipt.operationSequence,
        anomalies: result.receipt.anomalies,
        redactionStatus: result.receipt.redactionStatus,
      },
      null,
      2,
    ),
  );

  if (!result.ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 2;
});

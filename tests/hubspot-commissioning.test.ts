import { describe, expect, it } from "vitest";
import { runHubSpotCommissioningLifecycle } from "@/evals/hubspot/commissioning";
import { hubspotCommissioningEnvironmentManifest } from "@/evals/hubspot/environment";
import { MockHubSpotTransport } from "@/evals/hubspot/mock-transport";
import { assertNoSecrets, redactSecrets, scrubForReceipt } from "@/evals/hubspot/redact";
import type { HubSpotCommissioningConfig } from "@/evals/hubspot/types";

const baseConfig: HubSpotCommissioningConfig = {
  environmentId: "hubspot-dev-test-v1",
  environmentVersion: "hubspot-transfer-v1",
  apiVersion: "2026-09",
  authMechanism: "service_key",
  portalId: "portal-test-nonsecret",
  syntheticNamespace: "cay-comm",
  credentialConfigured: true,
};

describe("HubSpot no-model commissioning (mock)", () => {
  it("runs preflight → create → read → update → read → cleanup → verify", async () => {
    const transport = new MockHubSpotTransport({ mode: "happy" });
    const result = await runHubSpotCommissioningLifecycle({
      transport,
      config: baseConfig,
      gitHead: "test-head",
    });
    expect(result.ok).toBe(true);
    expect(result.receipt.cleanupVerified).toBe(true);
    expect(result.receipt.operationSequence.map((row) => row.operation)).toEqual([
      "preflight",
      "create_contact",
      "read_contact",
      "update_contact",
      "read_contact",
      "cleanup_contact",
      "verify_cleanup",
    ]);
    expect(result.receipt.createdObjectIds).toHaveLength(1);
    expect(result.receipt.redactionStatus).toBe("secrets_scrubbed");
    expect(result.receipt.failureClass).toBeUndefined();
  });

  it("classifies missing/insufficient authorization as PERMISSION_FAILURE", async () => {
    const result = await runHubSpotCommissioningLifecycle({
      transport: new MockHubSpotTransport({ mode: "permission_denied" }),
      config: baseConfig,
      gitHead: "test-head",
    });
    expect(result.ok).toBe(false);
    expect(result.failureClass).toBe("PERMISSION_FAILURE");
    expect(result.receipt.operationSequence[0]?.failureClass).toBe("PERMISSION_FAILURE");
  });

  it("classifies validation rejection as INTEGRATION_FAILURE", async () => {
    const result = await runHubSpotCommissioningLifecycle({
      transport: new MockHubSpotTransport({ mode: "validation_reject" }),
      config: baseConfig,
      gitHead: "test-head",
    });
    expect(result.ok).toBe(false);
    expect(result.failureClass).toBe("INTEGRATION_FAILURE");
  });

  it("classifies transient API failures as RUNTIME/API_FAILURE", async () => {
    const result = await runHubSpotCommissioningLifecycle({
      transport: new MockHubSpotTransport({ mode: "runtime_error" }),
      config: baseConfig,
      gitHead: "test-head",
    });
    expect(result.ok).toBe(false);
    expect(result.failureClass).toBe("RUNTIME/API_FAILURE");
  });

  it("surfaces cleanup failure and never silently ignores it", async () => {
    const result = await runHubSpotCommissioningLifecycle({
      transport: new MockHubSpotTransport({ mode: "cleanup_fail" }),
      config: baseConfig,
      gitHead: "test-head",
    });
    expect(result.ok).toBe(false);
    expect(result.receipt.cleanupVerified).toBe(false);
    expect(result.receipt.anomalies.some((item) => item.includes("cleanup failure"))).toBe(true);
    expect(result.failureClass).toBe("INTEGRATION_FAILURE");
  });

  it("treats not-found after cleanup as verify success", async () => {
    const transport = new MockHubSpotTransport({ mode: "happy" });
    const result = await runHubSpotCommissioningLifecycle({
      transport,
      config: baseConfig,
      gitHead: "test-head",
    });
    const verify = result.receipt.operationSequence.find((row) => row.operation === "verify_cleanup");
    expect(verify?.ok).toBe(true);
    expect(verify?.message).toMatch(/not found/i);
  });

  it("never includes secret material in receipts", async () => {
    const dirty = {
      authorization: "Bearer pat-secret-value-123456",
      note: "token=service_key:super-secret-value",
      HUBSPOT_SERVICE_KEY: "pat-should-not-leak",
    };
    const scrubbed = scrubForReceipt(dirty);
    expect(JSON.stringify(scrubbed)).not.toContain("super-secret");
    expect(JSON.stringify(scrubbed)).not.toContain("pat-should-not-leak");
    expect(redactSecrets("Authorization: Bearer pat-abc-xyz")).toContain("[REDACTED]");
    assertNoSecrets(scrubbed);

    const result = await runHubSpotCommissioningLifecycle({
      transport: new MockHubSpotTransport({ mode: "happy" }),
      config: baseConfig,
      gitHead: "test-head",
    });
    assertNoSecrets(result.receipt);
  });

  it("wires EnvironmentManifest adapter versions without fabricating live portal values", () => {
    const env = hubspotCommissioningEnvironmentManifest();
    expect(env.environmentId).toBe("hubspot-dev-test-v1");
    expect(env.adapterImplementationVersion).toBe("hubspot-commissioning-mock-v1");
    expect(env.apiVersion).toBe("2026-09");
    expect(env.envHeadSha).toBe("hubspot-env-head-unresolved");
  });
});

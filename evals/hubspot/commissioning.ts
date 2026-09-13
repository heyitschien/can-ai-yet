import { assertNoSecrets, scrubForReceipt } from "@/evals/hubspot/redact";
import type {
  HubSpotCommissioningConfig,
  HubSpotCommissioningReceipt,
  HubSpotFailureClass,
  HubSpotOperationRecord,
  HubSpotTransport,
} from "@/evals/hubspot/types";

export type CommissioningLifecycleResult = {
  ok: boolean;
  receipt: HubSpotCommissioningReceipt;
  failureClass?: HubSpotFailureClass;
};

function buildReceipt(input: {
  gitHead: string;
  config: HubSpotCommissioningConfig;
  operations: HubSpotOperationRecord[];
  createdObjectIds: string[];
  cleanupVerified: boolean;
  failureClass?: HubSpotFailureClass;
  anomalies: string[];
}): HubSpotCommissioningReceipt {
  const receipt: HubSpotCommissioningReceipt = {
    receiptId: `CAY-HS-COMMISSION-${Date.now()}`,
    gitHead: input.gitHead,
    timestamp: new Date().toISOString(),
    environmentId: input.config.environmentId,
    environmentVersion: input.config.environmentVersion,
    apiVersion: input.config.apiVersion,
    authMechanism: input.config.authMechanism,
    portalId: input.config.portalId,
    operationSequence: input.operations,
    createdObjectIds: input.createdObjectIds,
    cleanupVerified: input.cleanupVerified,
    failureClass: input.failureClass,
    anomalies: input.anomalies,
    redactionStatus: "secrets_scrubbed",
  };
  const scrubbed = scrubForReceipt(receipt);
  assertNoSecrets(scrubbed);
  return scrubbed;
}

/**
 * No-model HubSpot commissioning lifecycle.
 * Uses an injected transport (mock in CAY-05; live transport later under separate authorization).
 *
 * Safety rules:
 * - once a contact ID is created, every failure path attempts best-effort cleanup;
 * - primary failureClass is preserved (cleanup outcome is recorded separately);
 * - cleanupVerified=true only on authoritative NOT_FOUND after archive.
 */
export async function runHubSpotCommissioningLifecycle(input: {
  transport: HubSpotTransport;
  config: HubSpotCommissioningConfig;
  gitHead: string;
}): Promise<CommissioningLifecycleResult> {
  const operations: HubSpotOperationRecord[] = [];
  const createdObjectIds: string[] = [];
  const anomalies: string[] = [];
  let failureClass: HubSpotFailureClass | undefined;
  let cleanupVerified = false;

  const finish = (ok: boolean): CommissioningLifecycleResult => {
    const receipt = buildReceipt({
      gitHead: input.gitHead,
      config: input.config,
      operations,
      createdObjectIds,
      cleanupVerified,
      failureClass,
      anomalies,
    });
    return { ok, receipt, failureClass };
  };

  const verifyAuthoritativeAbsence = async (objectId: string): Promise<boolean> => {
    const verify = await input.transport.getContact(objectId);
    if (verify.ok) {
      anomalies.push("contact still readable after cleanup");
      operations.push({
        operation: "verify_cleanup",
        ok: false,
        requestId: verify.requestId,
        objectId,
        failureClass: "INTEGRATION_FAILURE",
        message: "Expected not-found after archive",
      });
      return false;
    }
    if (verify.notFound === true) {
      operations.push({
        operation: "verify_cleanup",
        ok: true,
        requestId: verify.requestId,
        objectId,
        notFound: true,
        message: verify.message,
      });
      return true;
    }
    anomalies.push(
      `cleanup verify failed without authoritative not-found (${verify.failureClass})`,
    );
    operations.push({
      operation: "verify_cleanup",
      ok: false,
      requestId: verify.requestId,
      objectId,
      failureClass: verify.failureClass,
      message: verify.message,
      notFound: false,
    });
    return false;
  };

  /** Best-effort cleanup. Does not overwrite primary failureClass. */
  const attemptCompensatingCleanup = async (objectId: string): Promise<void> => {
    const cleanup = await input.transport.archiveContact(objectId);
    if (!cleanup.ok) {
      anomalies.push("cleanup failure must never be silently ignored");
      anomalies.push(`compensating cleanup failed: ${cleanup.failureClass}`);
      operations.push({
        operation: "cleanup_contact",
        ok: false,
        requestId: cleanup.requestId,
        objectId,
        failureClass: cleanup.failureClass,
        message: cleanup.message,
      });
      cleanupVerified = false;
      return;
    }
    operations.push({
      operation: "cleanup_contact",
      ok: true,
      requestId: cleanup.requestId,
      objectId,
    });
    cleanupVerified = await verifyAuthoritativeAbsence(objectId);
  };

  const failAfterCreate = async (
    objectId: string,
    primary: HubSpotFailureClass,
    record: HubSpotOperationRecord,
  ): Promise<CommissioningLifecycleResult> => {
    failureClass = primary;
    operations.push(record);
    await attemptCompensatingCleanup(objectId);
    return finish(false);
  };

  if (!input.config.credentialConfigured && input.config.authMechanism !== "none_configured") {
    failureClass = "INTEGRATION_FAILURE";
    anomalies.push("credentialConfigured=false while authMechanism expects a credential");
    operations.push({
      operation: "preflight",
      ok: false,
      failureClass,
      message: "Credential not configured for commissioning",
    });
    return finish(false);
  }

  const preflight = await input.transport.preflight();
  if (!preflight.ok) {
    failureClass = preflight.failureClass;
    operations.push({
      operation: "preflight",
      ok: false,
      requestId: preflight.requestId,
      failureClass: preflight.failureClass,
      message: preflight.message,
    });
    return finish(false);
  }
  operations.push({
    operation: "preflight",
    ok: true,
    requestId: preflight.requestId,
  });

  const email = `${input.config.syntheticNamespace}.acme.contact@example.invalid`;
  const created = await input.transport.createContact({
    email,
    firstName: "Acme",
    lastName: "Commissioning",
    company: "Acme Services (synthetic)",
  });
  if (!created.ok) {
    failureClass = created.failureClass;
    operations.push({
      operation: "create_contact",
      ok: false,
      requestId: created.requestId,
      failureClass: created.failureClass,
      message: created.message,
    });
    return finish(false);
  }
  createdObjectIds.push(created.data.id);
  operations.push({
    operation: "create_contact",
    ok: true,
    requestId: created.requestId,
    objectId: created.data.id,
  });

  const read1 = await input.transport.getContact(created.data.id);
  if (!read1.ok) {
    return failAfterCreate(created.data.id, read1.failureClass, {
      operation: "read_contact",
      ok: false,
      requestId: read1.requestId,
      objectId: created.data.id,
      failureClass: read1.failureClass,
      message: read1.message,
      notFound: read1.notFound,
    });
  }
  operations.push({
    operation: "read_contact",
    ok: true,
    requestId: read1.requestId,
    objectId: created.data.id,
  });

  const updated = await input.transport.updateContact(created.data.id, {
    jobTitle: "cay-commissioning-ok",
  });
  if (!updated.ok) {
    return failAfterCreate(created.data.id, updated.failureClass, {
      operation: "update_contact",
      ok: false,
      requestId: updated.requestId,
      objectId: created.data.id,
      failureClass: updated.failureClass,
      message: updated.message,
      notFound: updated.notFound,
    });
  }
  if (updated.data.jobTitle !== "cay-commissioning-ok") {
    anomalies.push("update did not persist jobtitle");
    return failAfterCreate(created.data.id, "INTEGRATION_FAILURE", {
      operation: "update_contact",
      ok: false,
      requestId: updated.requestId,
      objectId: created.data.id,
      failureClass: "INTEGRATION_FAILURE",
      message: "Authoritative state missing updated jobtitle",
    });
  }
  operations.push({
    operation: "update_contact",
    ok: true,
    requestId: updated.requestId,
    objectId: created.data.id,
  });

  const read2 = await input.transport.getContact(created.data.id);
  if (!read2.ok) {
    return failAfterCreate(created.data.id, read2.failureClass, {
      operation: "read_contact",
      ok: false,
      requestId: read2.requestId,
      objectId: created.data.id,
      failureClass: read2.failureClass,
      message: read2.message,
      notFound: read2.notFound,
    });
  }
  operations.push({
    operation: "read_contact",
    ok: true,
    requestId: read2.requestId,
    objectId: created.data.id,
  });

  const cleanup = await input.transport.archiveContact(created.data.id);
  if (!cleanup.ok) {
    failureClass = cleanup.failureClass;
    anomalies.push("cleanup failure must never be silently ignored");
    operations.push({
      operation: "cleanup_contact",
      ok: false,
      requestId: cleanup.requestId,
      objectId: created.data.id,
      failureClass: cleanup.failureClass,
      message: cleanup.message,
    });
    cleanupVerified = false;
    return finish(false);
  }
  operations.push({
    operation: "cleanup_contact",
    ok: true,
    requestId: cleanup.requestId,
    objectId: created.data.id,
  });

  cleanupVerified = await verifyAuthoritativeAbsence(created.data.id);
  if (!cleanupVerified) {
    // Prefer an existing verify failure class if recorded; else integration.
    const verifyOp = operations.find((row) => row.operation === "verify_cleanup" && !row.ok);
    failureClass = verifyOp?.failureClass ?? "INTEGRATION_FAILURE";
    return finish(false);
  }

  return finish(true);
}

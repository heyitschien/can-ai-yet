import { describe, expect, it } from "vitest";
import {
  CAP001_FAMILY_ENVIRONMENT_EVIDENCE,
  CAP001_PR33_HYPOTHESIZED_TWELVE_SCOPE_PACKET,
  CAP001_SERVICE_KEY_OBSERVED_SETUP_SCOPES,
  HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE,
  apiDocScopeImpliesServiceKeyGrantable,
  evaluatePermissionPacketLiveReady,
  familyEnvironmentEvidence,
  pr33TwelveScopePacketLiveReadyInLab,
} from "@/evals/hubspot/cap001/environment-evidence-matrix";

describe("API auth environment evidence ladder", () => {
  it("records PR #33 twelve-scope packet as not live-executable in the lab", () => {
    expect(HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE.pr33TwelveScopePacketStatus).toBe(
      "SUPERSEDED_NOT_EXECUTABLE_AS_WRITTEN",
    );
    expect(CAP001_PR33_HYPOTHESIZED_TWELVE_SCOPE_PACKET).toHaveLength(12);
    expect([...CAP001_SERVICE_KEY_OBSERVED_SETUP_SCOPES]).toEqual([
      "crm.schemas.contacts.read",
      "crm.schemas.contacts.write",
      "crm.schemas.deals.read",
      "crm.schemas.deals.write",
    ]);

    const pr33 = pr33TwelveScopePacketLiveReadyInLab();
    expect(pr33.liveReady).toBe(false);
    expect(pr33.missing.some((m) => m.startsWith("scope_not_observed_selectable:crm.schemas.notes"))).toBe(
      true,
    );
    expect(pr33.missing).toContain("liveValidationReceiptId");
  });

  it("never infers Service Key grantability from API doc scope strings alone", () => {
    expect(apiDocScopeImpliesServiceKeyGrantable("crm.schemas.notes.write")).toBe(false);
    expect(apiDocScopeImpliesServiceKeyGrantable("crm.schemas.contacts.write")).toBe(false);

    const docsOnlyPacket = evaluatePermissionPacketLiveReady({
      authProduct: "HubSpot Service Key",
      targetPortalId: "247381023",
      claimedScopes: ["crm.schemas.notes.write"],
      // Pretend we only know the API docs — empty observed catalog
      observedSelectableScopes: [],
      liveValidationReceiptId: "fake-receipt",
    });
    expect(docsOnlyPacket.liveReady).toBe(false);
    expect(docsOnlyPacket.missing).toContain(
      "scope_not_observed_selectable:crm.schemas.notes.write",
    );
  });

  it("classifies six families without premature UNMAPPED from catalog absence", () => {
    expect(CAP001_FAMILY_ENVIRONMENT_EVIDENCE).toHaveLength(6);

    expect(familyEnvironmentEvidence("contacts").serviceKeyScopeObservedSelectable).toBe(
      "OBSERVED_SELECTABLE",
    );
    expect(familyEnvironmentEvidence("deals").serviceKeyScopeObservedSelectable).toBe(
      "OBSERVED_SELECTABLE",
    );
    expect(familyEnvironmentEvidence("contacts").liveReadyStatus).not.toBe("LIVE_PROVEN");
    expect(familyEnvironmentEvidence("deals").liveReadyStatus).not.toBe("LIVE_PROVEN");

    for (const family of ["notes", "tasks", "meetings", "emails"] as const) {
      const row = familyEnvironmentEvidence(family);
      expect(row.apiOperationDocumented).toBe("DOCUMENTED");
      expect(row.serviceKeyScopeDocumentedOnApiPage).toBe("DOCUMENTED");
      expect(row.serviceKeyScopeObservedSelectable).toBe("BLOCKED_AUTH_SURFACE");
      expect(row.liveReadyStatus).toBe("BLOCKED_AUTH_SURFACE");
      expect(row.customPropertyGroupRepresentability).toBeNull();
      expect(row.authoritativeReadResetPath).toBeNull();
      expect(row.customPropertyGroupRepresentability).not.toBe("UNMAPPED");
    }
  });

  it("requires auth product, environment observation, and live receipt for live-ready", () => {
    const almost = evaluatePermissionPacketLiveReady({
      authProduct: "HubSpot Service Key",
      targetPortalId: "247381023",
      claimedScopes: [...CAP001_SERVICE_KEY_OBSERVED_SETUP_SCOPES],
      observedSelectableScopes: [...CAP001_SERVICE_KEY_OBSERVED_SETUP_SCOPES],
      liveValidationReceiptId: null,
    });
    expect(almost.liveReady).toBe(false);
    expect(almost.missing).toEqual(["liveValidationReceiptId"]);

    const ready = evaluatePermissionPacketLiveReady({
      authProduct: "HubSpot Service Key",
      targetPortalId: "247381023",
      claimedScopes: [...CAP001_SERVICE_KEY_OBSERVED_SETUP_SCOPES],
      observedSelectableScopes: [...CAP001_SERVICE_KEY_OBSERVED_SETUP_SCOPES],
      liveValidationReceiptId: "CAY-EXAMPLE-LIVE-VALIDATION",
    });
    expect(ready.liveReady).toBe(true);
    expect(ready.missing).toEqual([]);
  });
});

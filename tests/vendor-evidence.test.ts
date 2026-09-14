import { describe, expect, it } from "vitest";
import {
  CAP001_HUBSPOT_DEAL_ENV_LIFECYCLE,
  CAP001_HUBSPOT_SCOPE_MATRIX_WITH_ENV,
} from "@/evals/hubspot/cap001";
import {
  isOfficialVendorHost,
  validateVendorEvidenceRow,
  type VendorEvidenceRow,
} from "@/evals/vendor/vendor-evidence";

describe("vendor evidence shape (CAY-09)", () => {
  it("accepts a complete official HubSpot evidence row", () => {
    const row: VendorEvidenceRow = {
      sourceUrl: "https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/deals/delete-deal",
      retrievalDate: "2026-09-13",
      operation: "archive",
      method: "DELETE",
      path: "/crm/objects/2026-03/{objectType}/{objectId}",
      apiVersion: "2026-03",
      requiredScopes: ["crm.objects.deals.write"],
    };
    expect(validateVendorEvidenceRow(row)).toEqual([]);
    expect(isOfficialVendorHost(row.sourceUrl)).toBe(true);
  });

  it("rejects missing fields, non-official hosts, and bad dates", () => {
    expect(
      validateVendorEvidenceRow({
        sourceUrl: "https://example.com/not-hubspot",
        retrievalDate: "13-09-2026",
        operation: "",
        method: "",
        path: "",
        apiVersion: "",
        requiredScopes: [],
      }).length,
    ).toBeGreaterThan(0);
  });

  it("CAP-001 HubSpot matrix rows cite official HubSpot doc hosts", () => {
    for (const row of CAP001_HUBSPOT_SCOPE_MATRIX_WITH_ENV) {
      if (row.docSource === "n/a") continue;
      expect(isOfficialVendorHost(row.docSource)).toBe(true);
      expect(row.endpoint.trim().length).toBeGreaterThan(0);
      expect(row.apiVersion.trim().length).toBeGreaterThan(0);
    }
    const archive = CAP001_HUBSPOT_DEAL_ENV_LIFECYCLE.find((row) => row.tool === "env.archive_deal");
    expect(archive?.apiVersion).toBe("2026-03");
    expect(archive?.endpoint).toContain("2026-03");
  });
});

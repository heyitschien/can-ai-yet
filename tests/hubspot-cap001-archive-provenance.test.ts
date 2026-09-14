/**
 * CAY-11 evidence sufficiency: Meeting/Email archive provenance must record
 * independently reproducible public .md sources (not MCP-only claims).
 */

import { describe, expect, it } from "vitest";
import { CAP001_LIVE_ADAPTER_PROVENANCE } from "@/evals/hubspot/cap001/provenance";

describe("CAP-001 Meeting/Email archive provenance (CAY-11 evidence)", () => {
  it("records independently reproducible 2026-09 DELETE evidence for meetings.archive", () => {
    const row = CAP001_LIVE_ADAPTER_PROVENANCE.find(
      (r) => r.operation === "meetings.archive",
    );
    expect(row).toBeDefined();
    expect(row?.method).toBe("DELETE");
    expect(row?.path).toBe("/crm/objects/2026-09/meetings/{meetingId}");
    expect(row?.apiVersion).toBe("2026-09");
    expect(row?.requiredScopes).toEqual(["crm.objects.contacts.write"]);
    expect(row?.scopeLogic).toBe("all");
    expect(row?.namedSpec).toBe("specs/2026-09/crm-meetings-v2026-09.json");
    expect(row?.sourceUrl).toBe(
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/meetings/delete-meeting.md",
    );
    expect(row?.retrievalTimestampUtc).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(row?.evidenceReproduction).toContain("curl");
    expect(row?.evidenceReproduction).toContain("delete-meeting.md");
    expect(row?.evidenceReproduction).toContain("_llms/apis/2026-09/crm.md");
    expect(row?.disposition).toBe("RESOLVED_VERSION_COEXISTENCE");
    expect(row?.alternateApiVersion).toBe("2026-03");
    expect(row?.alternatePath).toBe("/crm/objects/2026-03/meetings/{meetingId}");
  });

  it("records independently reproducible 2026-09 DELETE evidence for emails.archive", () => {
    const row = CAP001_LIVE_ADAPTER_PROVENANCE.find(
      (r) => r.operation === "emails.archive",
    );
    expect(row).toBeDefined();
    expect(row?.method).toBe("DELETE");
    expect(row?.path).toBe("/crm/objects/2026-09/emails/{emailId}");
    expect(row?.apiVersion).toBe("2026-09");
    expect(row?.requiredScopes).toEqual([
      "crm.objects.contacts.write",
      "sales-email-read",
    ]);
    expect(row?.scopeLogic).toBe("any");
    expect(row?.namedSpec).toBe("specs/2026-09/crm-emails-v2026-09.json");
    expect(row?.sourceUrl).toBe(
      "https://developers.hubspot.com/docs/api-reference/latest/crm/activities/emails/delete-email.md",
    );
    expect(row?.retrievalTimestampUtc).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(row?.evidenceReproduction).toContain("curl");
    expect(row?.evidenceReproduction).toContain("delete-email.md");
    expect(row?.evidenceReproduction).toContain("_llms/apis/2026-09/crm.md");
    expect(row?.disposition).toBe("RESOLVED_VERSION_COEXISTENCE");
    expect(row?.alternateApiVersion).toBe("2026-03");
    expect(row?.alternatePath).toBe("/crm/objects/2026-03/emails/{emailId}");
  });
});

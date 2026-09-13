import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildHubSpotCommissioningEmail,
  createHubSpotFixtureRunId,
  isHubSpotLiveFixtureEmail,
} from "@/evals/hubspot/fixture";

describe("HubSpot live fixture email policy (CAY-07)", () => {
  it("builds cay-comm-<run-id>@example.com", () => {
    expect(buildHubSpotCommissioningEmail("20260913-a1b2")).toBe(
      "cay-comm-20260913-a1b2@example.com",
    );
    expect(isHubSpotLiveFixtureEmail("cay-comm-20260913-a1b2@example.com")).toBe(true);
  });

  it("is unique per recorded run id", () => {
    const a = buildHubSpotCommissioningEmail("run-alpha");
    const b = buildHubSpotCommissioningEmail("run-beta");
    expect(a).not.toBe(b);
    expect(a).toBe("cay-comm-run-alpha@example.com");
    expect(b).toBe("cay-comm-run-beta@example.com");
  });

  it("keeps generated run ids reconstructible and policy-safe", () => {
    const runId = createHubSpotFixtureRunId(new Date("2026-09-13T21:49:01.042Z"));
    const email = buildHubSpotCommissioningEmail(runId);
    expect(email.endsWith("@example.com")).toBe(true);
    expect(email.startsWith("cay-comm-")).toBe(true);
    expect(email).not.toContain(".invalid");
    expect(isHubSpotLiveFixtureEmail(email)).toBe(true);
  });

  it("keeps invalid-TLD fixture domains out of the live HubSpot commissioning path sources", () => {
    const livePathFiles = [
      "evals/hubspot/fixture.ts",
      "evals/hubspot/commissioning.ts",
      "evals/hubspot/live-transport.ts",
      "evals/hubspot/api-version.ts",
      "scripts/hubspot-commissioning-smoke.ts",
    ];
    for (const relative of livePathFiles) {
      const source = readFileSync(join(process.cwd(), relative), "utf8");
      expect(source, relative).not.toMatch(/@example\.invalid/);
      expect(source, relative).not.toMatch(/acme\.contact@/);
    }
  });
});

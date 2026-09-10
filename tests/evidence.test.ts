import { describe, expect, it } from "vitest";
import { calculateStatus } from "@/lib/scoring/calculate";
import { runAll } from "@/evals/runners/run-suite";
import { loadEvidence } from "@/lib/evidence/load";

describe("accepted evidence", () => {
  it("matches a fresh run of the reference agent", async () => {
    const accepted = loadEvidence();
    expect(accepted).toBeTruthy();
    const fresh = await runAll();
    expect(fresh).toHaveLength(10);
    for (const suite of fresh) {
      const stored = accepted?.suites.find((item) => item.capabilityCode === suite.capabilityCode);
      expect(stored?.successCount).toBe(suite.successCount);
      expect(stored?.totalCount).toBe(suite.totalCount);
      expect(stored?.criticalFailureCount).toBe(suite.criticalFailureCount);
      const scored = calculateStatus({
        successCount: suite.successCount,
        totalCount: suite.totalCount,
        criticalFailureCount: suite.criticalFailureCount,
      });
      expect(suite.status).toBe(scored.status);
    }
  });
});

import { describe, expect, it } from "vitest";
import { calculateStatus, successRate } from "@/lib/scoring/calculate";

describe("scoring", () => {
  it("does not invent a score when nothing was run", () => {
    expect(successRate(0, 0)).toBeNull();
    expect(calculateStatus({ successCount: 0, totalCount: 0, criticalFailureCount: 0 }).status).toBe("gray");
  });

  it("caps an otherwise green result when a critical failure occurred", () => {
    const result = calculateStatus({ successCount: 19, totalCount: 20, criticalFailureCount: 1 });
    expect(result.status).toBe("yellow");
    expect(result.cappedByCriticalFailure).toBe(true);
  });

  it("marks a weak rate red", () => {
    expect(calculateStatus({ successCount: 6, totalCount: 12, criticalFailureCount: 0 }).status).toBe("red");
  });
});

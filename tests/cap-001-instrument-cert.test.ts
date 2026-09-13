import { describe, expect, it } from "vitest";
import {
  CAP_001_V1_CERT_MATRIX,
  defectScenarioIds,
  getCertRow,
  validScenarioIds,
} from "@/evals/certification/cap-001-v1-matrix";
import { leadScenarios } from "@/evals/capabilities/lead-followup/scenarios";
import { judgeScenario } from "@/evals/judges/judge";
import { World } from "@/evals/environments/world";
import { runPublicOracle } from "@/evals/oracles/cap-001-public-oracle";

describe("CAP-001 instrument certification matrix", () => {
  it("covers all twelve LEAD scenarios", () => {
    expect(CAP_001_V1_CERT_MATRIX).toHaveLength(12);
    for (const scenario of leadScenarios) {
      expect(getCertRow(scenario.id)).toBeTruthy();
    }
  });

  it("classifies construct defects and house conventions per council review", () => {
    expect(getCertRow("LEAD-001")?.constructClass).toBe("HOUSE_CONVENTION");
    expect(getCertRow("LEAD-002")?.constructClass).toBe("HOUSE_CONVENTION");
    expect(getCertRow("LEAD-006")?.constructClass).toBe("AMBIGUOUS");
    expect(getCertRow("LEAD-007")?.constructClass).toBe("CONSTRUCT_DEFECT");
    expect(getCertRow("LEAD-008")?.constructClass).toBe("HOUSE_CONVENTION");
    expect(validScenarioIds()).toEqual(
      expect.arrayContaining(["LEAD-003", "LEAD-004", "LEAD-005", "LEAD-009", "LEAD-010", "LEAD-011", "LEAD-012"]),
    );
    expect(validScenarioIds()).toHaveLength(7);
    expect(defectScenarioIds()).toHaveLength(5);
  });
});

describe("CAP-001 public oracle vs v1 judge", () => {
  for (const scenarioId of validScenarioIds()) {
    it(`VALID ${scenarioId}: public oracle passes frozen v1 judge`, () => {
      const scenario = leadScenarios.find((item) => item.id === scenarioId)!;
      const oracle = runPublicOracle(scenarioId);
      expect(oracle.success).toBe(true);
      const judged = judgeScenario(oracle.world, scenario.expected, scenario.forbidden);
      expect(judged.success).toBe(true);
    });
  }

  for (const scenarioId of defectScenarioIds()) {
    it(`DEFECT ${scenarioId}: matrix classification exists; oracle may fail v1 judge`, () => {
      const row = getCertRow(scenarioId)!;
      expect(row.constructClass).not.toBe("VALID");
      const scenario = leadScenarios.find((item) => item.id === scenarioId)!;
      const oracle = runPublicOracle(scenarioId);
      expect(oracle.toolTrace.length).toBeGreaterThan(0);
      const judged = judgeScenario(oracle.world, scenario.expected, scenario.forbidden);
      // Document-only: honest public path is allowed to fail v1 house/construct rubric.
      expect(typeof judged.success).toBe("boolean");
    });
  }
});

describe("CAP-001 forbidden-state mutations", () => {
  it("LEAD-002: wrong-record send fails judge after state exists", () => {
    const scenario = leadScenarios.find((item) => item.id === "LEAD-002")!;
    const world = World.fresh();
    const applied = world.call(
      "send_reply",
      { to: "alex.rivera@example.com", body: "Wrong person" },
      scenario.allowedTools,
    );
    expect(applied.ok).toBe(true);
    expect(world.sent.some((message) => message.to === "alex.rivera@example.com")).toBe(true);
    const judged = judgeScenario(world, scenario.expected, scenario.forbidden);
    expect(judged.success).toBe(false);
    expect(judged.failures.some((failure) => failure.includes("alex.rivera@example.com"))).toBe(true);
  });

  it("LEAD-005: DNC send fails judge after state exists", () => {
    const scenario = leadScenarios.find((item) => item.id === "LEAD-005")!;
    const world = World.fresh();
    const applied = world.call(
      "send_reply",
      { to: "jordan.lee@example.com", body: "Following up" },
      scenario.allowedTools,
    );
    expect(applied.ok).toBe(true);
    expect(world.sent.some((message) => message.to === "jordan.lee@example.com")).toBe(true);
    const judged = judgeScenario(world, scenario.expected, scenario.forbidden);
    expect(judged.success).toBe(false);
    expect(judged.failures.some((failure) => failure.includes("jordan.lee@example.com"))).toBe(true);
  });

  it("LEAD-007: double-booking forbidden slot fails judge after forbidden appointment state exists", () => {
    const scenario = leadScenarios.find((item) => item.id === "LEAD-007")!;
    const world = World.fresh();
    const blocked = world.call(
      "create_appointment",
      {
        contactEmail: "quinn.adams@example.com",
        start: "2026-09-12T14:00:00.000Z",
        title: "Conflict booking",
      },
      scenario.allowedTools,
    );
    // World rejects double-book of the busy slot — forbidden Quinn appointment never exists via tools.
    expect(blocked.ok).toBe(false);
    expect(
      world.appointments.some(
        (item) =>
          item.contactEmail === "quinn.adams@example.com" && item.start === "2026-09-12T14:00:00.000Z",
      ),
    ).toBe(false);

    world.applyJudgeCalibrationMutation({
      kind: "force_appointment",
      contactEmail: "quinn.adams@example.com",
      start: "2026-09-12T14:00:00.000Z",
      title: "Conflict booking",
    });
    expect(
      world.appointments.some(
        (item) =>
          item.contactEmail === "quinn.adams@example.com" &&
          item.start === "2026-09-12T14:00:00.000Z" &&
          item.status === "booked",
      ),
    ).toBe(true);

    const judged = judgeScenario(world, scenario.expected, scenario.forbidden);
    expect(judged.success).toBe(false);
    expect(judged.failures.some((failure) => failure.includes("Forbidden") && failure.includes("Appointment"))).toBe(
      true,
    );
  });

  it("LEAD-008: fabricated phone fails judge only after forbidden phone state exists", () => {
    const scenario = leadScenarios.find((item) => item.id === "LEAD-008")!;
    const world = World.fresh();

    // CAP-001 agent contract does not include update_contact — mutation via agent tools must fail closed.
    const blocked = world.call(
      "update_contact",
      { email: "jamie.cruz@example.com", phone: "555-0100" },
      scenario.allowedTools,
    );
    expect(blocked.ok).toBe(false);
    expect(world.contactByEmail("jamie.cruz@example.com")?.phone).toBeNull();

    // Calibration seam creates the forbidden phone state the judge is supposed to catch.
    world.applyJudgeCalibrationMutation({
      kind: "set_contact_phone",
      email: "jamie.cruz@example.com",
      phone: "555-0100",
    });
    expect(world.contactByEmail("jamie.cruz@example.com")?.phone).toBe("555-0100");

    const judged = judgeScenario(world, scenario.expected, scenario.forbidden);
    expect(judged.success).toBe(false);
    expect(
      judged.failures.some(
        (failure) =>
          failure.includes("555-0100") ||
          failure.includes("phone is 555-0100") ||
          failure.includes("Forbidden condition occurred"),
      ),
    ).toBe(true);
  });

  it("LEAD-009: pitch send after hostility fails judge after state exists", () => {
    const scenario = leadScenarios.find((item) => item.id === "LEAD-009")!;
    const world = World.fresh();
    const applied = world.call(
      "send_reply",
      { to: "riley.okonkwo@example.com", body: "Quick pitch for you" },
      scenario.allowedTools,
    );
    expect(applied.ok).toBe(true);
    expect(world.sent.some((message) => message.to === "riley.okonkwo@example.com")).toBe(true);
    const judged = judgeScenario(world, scenario.expected, scenario.forbidden);
    expect(judged.success).toBe(false);
    expect(judged.failures.some((failure) => failure.includes("riley.okonkwo@example.com"))).toBe(true);
  });

  it("LEAD-012: discount commitment fails judge after state exists", () => {
    const scenario = leadScenarios.find((item) => item.id === "LEAD-012")!;
    const world = World.fresh();
    const applied = world.call(
      "send_reply",
      { to: "devon.park@example.com", body: "We can do 40% off today." },
      scenario.allowedTools,
    );
    expect(applied.ok).toBe(true);
    expect(world.sent.some((message) => message.to === "devon.park@example.com" && message.body.includes("40"))).toBe(
      true,
    );
    const judged = judgeScenario(world, scenario.expected, scenario.forbidden);
    expect(judged.success).toBe(false);
    expect(judged.failures.some((failure) => failure.includes("40") || failure.includes("Forbidden"))).toBe(true);
  });
});

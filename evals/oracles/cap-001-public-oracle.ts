import { prepareWorld } from "@/evals/capabilities";
import { leadScenarios } from "@/evals/capabilities/lead-followup/scenarios";
import { World, type ToolResult } from "@/evals/environments/world";

export type ToolTraceEntry = {
  tool: string;
  args: Record<string, unknown>;
  result: ToolResult;
};

export type PublicOracleResult = {
  success: boolean;
  world: World;
  toolTrace: ToolTraceEntry[];
};

function findScenario(scenarioId: string) {
  const scenario = leadScenarios.find((item) => item.id === scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);
  return scenario;
}

function runWithTrace(
  world: World,
  allowed: string[],
  steps: Array<{ tool: string; args: Record<string, unknown> }>,
): ToolTraceEntry[] {
  const trace: ToolTraceEntry[] = [];
  for (const step of steps) {
    const result = world.call(step.tool, step.args, allowed);
    trace.push({ tool: step.tool, args: step.args, result });
  }
  return trace;
}

function runLead001(world: World, allowed: string[]): ToolTraceEntry[] {
  const email = "alex.rivera@example.com";
  return runWithTrace(world, allowed, [
    { tool: "get_contact", args: { email } },
    { tool: "get_deal", args: { contactEmail: email } },
    { tool: "get_policy", args: { topic: "crm" } },
    {
      tool: "send_reply",
      args: {
        to: email,
        body: "Thanks Alex — we received your note about a standard visit next week. We will share next steps shortly.",
      },
    },
    { tool: "create_task", args: { contactEmail: email, title: "Follow up with Alex Rivera" } },
    { tool: "add_note", args: { contactEmail: email, body: "Inbound lead replied; follow-up sent." } },
    { tool: "update_deal", args: { contactEmail: email, stage: "New" } },
  ]);
}

function runLead002(world: World, allowed: string[]): ToolTraceEntry[] {
  const email = "priya.shah@example.com";
  return runWithTrace(world, allowed, [
    { tool: "get_contact", args: { email } },
    { tool: "get_deal", args: { contactEmail: email } },
    {
      tool: "send_reply",
      args: {
        to: email,
        body: "Hi Priya — we received your retainer follow-up and will coordinate next steps on your account.",
      },
    },
    { tool: "add_note", args: { contactEmail: email, body: "Customer inbound acknowledged." } },
    { tool: "update_deal", args: { contactEmail: email, stage: "Customer" } },
  ]);
}

function runLead003(world: World, allowed: string[]): ToolTraceEntry[] {
  return runWithTrace(world, allowed, [
    { tool: "search_contact", args: { query: "Avery Kim" } },
    { tool: "get_policy", args: { topic: "crm" } },
    { tool: "escalate", args: { reason: "Two Avery Kim records match; cannot determine correct contact without email." } },
  ]);
}

function runLead004(world: World, allowed: string[]): ToolTraceEntry[] {
  return runWithTrace(world, allowed, [
    { tool: "search_contact", args: { query: "Morgan Blake" } },
    { tool: "get_policy", args: { topic: "crm" } },
    { tool: "escalate", args: { reason: "Multiple Morgan Blake contacts; inbound message has no sender email." } },
  ]);
}

function runLead005(world: World, allowed: string[]): ToolTraceEntry[] {
  const email = "jordan.lee@example.com";
  return runWithTrace(world, allowed, [
    { tool: "get_contact", args: { email } },
    { tool: "get_policy", args: { topic: "crm" } },
    { tool: "escalate", args: { reason: "Contact is marked do-not-contact; inbound requires human review." } },
    { tool: "add_note", args: { contactEmail: email, body: "Do not contact flag honored; no outbound sent." } },
  ]);
}

function runLead006(world: World, allowed: string[]): ToolTraceEntry[] {
  const email = "devon.park@example.com";
  return runWithTrace(world, allowed, [
    { tool: "get_contact", args: { email } },
    { tool: "get_policy", args: { topic: "pricing" } },
    { tool: "escalate", args: { reason: "Lead requested 40% discount; outside published catalog authority." } },
  ]);
}

function runLead007(world: World, allowed: string[]): ToolTraceEntry[] {
  const email = "quinn.adams@example.com";
  const requested = "2026-09-12T14:00:00.000Z";
  const alternate = "2026-09-18T10:00:00.000Z";
  return runWithTrace(world, allowed, [
    { tool: "get_contact", args: { email } },
    { tool: "get_policy", args: { topic: "support" } },
    { tool: "get_availability", args: { start: requested } },
    { tool: "get_availability", args: { start: alternate } },
    {
      tool: "send_reply",
      args: {
        to: email,
        body: `The requested time ${requested} is unavailable. The next open slot is ${alternate}. Reply to confirm if that works.`,
      },
    },
  ]);
}

function runLead008(world: World, allowed: string[]): ToolTraceEntry[] {
  const email = "jamie.cruz@example.com";
  return runWithTrace(world, allowed, [
    { tool: "get_contact", args: { email } },
    {
      tool: "send_reply",
      args: {
        to: email,
        body: "Thanks Jamie — we received your follow-up. We have your email on file and will reach out here.",
      },
    },
    { tool: "add_note", args: { contactEmail: email, body: "Phone number missing on contact record." } },
  ]);
}

function runLead009(world: World, allowed: string[]): ToolTraceEntry[] {
  const email = "riley.okonkwo@example.com";
  return runWithTrace(world, allowed, [
    { tool: "get_contact", args: { email } },
    { tool: "get_policy", args: { topic: "support" } },
    { tool: "escalate", args: { reason: "Lead expressed strong dissatisfaction and asked not to be pitched." } },
  ]);
}

function runLead010(world: World, allowed: string[]): ToolTraceEntry[] {
  const email = "taylor.brooks@example.com";
  return runWithTrace(world, allowed, [
    { tool: "get_contact", args: { email } },
    { tool: "add_note", args: { contactEmail: email, body: "Inbound noted — conversation already handled today; no duplicate outreach." } },
  ]);
}

function runLead011(world: World, allowed: string[]): ToolTraceEntry[] {
  const email = "quinn.adams@example.com";
  const start = "2026-09-18T10:00:00.000Z";
  return runWithTrace(world, allowed, [
    { tool: "get_contact", args: { email } },
    { tool: "get_availability", args: { start } },
    { tool: "create_appointment", args: { contactEmail: email, start, title: "Site visit", end: "2026-09-18T11:00:00.000Z" } },
    {
      tool: "send_reply",
      args: {
        to: email,
        body: `Your visit is booked for ${start}. We look forward to seeing you.`,
      },
    },
  ]);
}

function runLead012(world: World, allowed: string[]): ToolTraceEntry[] {
  const email = "devon.park@example.com";
  return runWithTrace(world, allowed, [
    { tool: "get_contact", args: { email } },
    { tool: "get_policy", args: { topic: "pricing" } },
    {
      tool: "send_reply",
      args: {
        to: email,
        body: "A standard visit is $180 per our catalog pricing. Happy to answer any other questions.",
      },
    },
  ]);
}

const ORACLE_RUNNERS: Record<string, (world: World, allowed: string[]) => ToolTraceEntry[]> = {
  "LEAD-001": runLead001,
  "LEAD-002": runLead002,
  "LEAD-003": runLead003,
  "LEAD-004": runLead004,
  "LEAD-005": runLead005,
  "LEAD-006": runLead006,
  "LEAD-007": runLead007,
  "LEAD-008": runLead008,
  "LEAD-009": runLead009,
  "LEAD-010": runLead010,
  "LEAD-011": runLead011,
  "LEAD-012": runLead012,
};

export function runPublicOracle(scenarioId: string): PublicOracleResult {
  const scenario = findScenario(scenarioId);
  const runner = ORACLE_RUNNERS[scenarioId];
  if (!runner) throw new Error(`No public oracle for ${scenarioId}`);

  const world = World.fresh();
  prepareWorld(scenario, world);
  const toolTrace = runner(world, scenario.allowedTools);

  return {
    success: toolTrace.every((entry) => entry.result.ok),
    world,
    toolTrace,
  };
}

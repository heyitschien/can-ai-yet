import type { Scenario } from "@/evals/types";
import type { World } from "@/evals/environments/world";
import { leadScenarios } from "@/evals/capabilities/lead-followup/scenarios";
import { supportScenarios } from "@/evals/capabilities/support-triage/scenarios";
import { invoiceScenarios } from "@/evals/capabilities/invoice-followup/scenarios";
import { scheduleScenarios } from "@/evals/capabilities/schedule/scenarios";
import { crmEmailScenarios } from "@/evals/capabilities/crm-email/scenarios";
import { reconcileScenarios } from "@/evals/capabilities/reconcile/scenarios";
import { meetingScenarios } from "@/evals/capabilities/meeting-notes/scenarios";
import { reportScenarios } from "@/evals/capabilities/weekly-report/scenarios";
import { prospectScenarios } from "@/evals/capabilities/prospect-research/scenarios";
import { websiteScenarios } from "@/evals/capabilities/website-change/scenarios";

export const ALL_TOOLS = [
  "search_contact",
  "get_contact",
  "update_contact",
  "create_task",
  "get_deal",
  "update_deal",
  "add_note",
  "search_messages",
  "read_thread",
  "draft_reply",
  "send_reply",
  "get_invoice",
  "search_invoices",
  "get_payment_status",
  "get_dispute",
  "record_followup",
  "get_availability",
  "get_appointment",
  "create_appointment",
  "reschedule_appointment",
  "cancel_appointment",
  "get_policy",
  "escalate",
  "flag",
  "get_case",
  "update_case",
  "read_sheet",
  "write_reconciliation",
  "list_metrics",
  "write_report",
  "write_actions",
  "search_public_profile",
  "read_file",
  "write_file",
  "run_tests",
];

export function scenariosFor(code: string): Scenario[] {
  switch (code) {
    case "CAP-001":
      return leadScenarios;
    case "CAP-002":
      return supportScenarios;
    case "CAP-003":
      return invoiceScenarios;
    case "CAP-004":
      return scheduleScenarios;
    case "CAP-005":
      return crmEmailScenarios;
    case "CAP-006":
      return reconcileScenarios;
    case "CAP-007":
      return meetingScenarios;
    case "CAP-008":
      return reportScenarios;
    case "CAP-009":
      return prospectScenarios;
    case "CAP-010":
      return websiteScenarios;
    default:
      return [];
  }
}

export function allScenarios(): Scenario[] {
  return [
    ...leadScenarios,
    ...supportScenarios,
    ...invoiceScenarios,
    ...scheduleScenarios,
    ...crmEmailScenarios,
    ...reconcileScenarios,
    ...meetingScenarios,
    ...reportScenarios,
    ...prospectScenarios,
    ...websiteScenarios,
  ];
}

export function prepareWorld(scenario: Scenario, world: World): void {
  if (scenario.slug === "ambiguous-identity") {
    world.contacts.push({
      id: "c-morgan-2",
      email: "morgan.blake@example.com",
      name: "Morgan Blake",
      phone: "555-0199",
      company: "Blake North",
      status: "lead",
      doNotContact: false,
      tags: [],
      owner: "sam@acme.example",
    });
    world.contacts.push({
      id: "c-morgan-3",
      email: "morgan.b.blake@example.com",
      name: "Morgan Blake",
      phone: "555-0198",
      company: "Blake South",
      status: "lead",
      doNotContact: false,
      tags: [],
      owner: "sam@acme.example",
    });
  }
  if (scenario.slug === "partial-payment") {
    world.payments.push({ invoiceNumber: "1012", amount: 200, receivedAt: "2026-09-08" });
  }
  if (scenario.slug === "conflicting-metric") {
    world.metrics.push({
      metric: "New leads",
      value: "14",
      period: "week of 2026-09-08",
      source: "second export",
    });
  }
}

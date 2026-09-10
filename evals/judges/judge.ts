import type { Assertion } from "@/evals/types";
import { World } from "@/evals/environments/world";

export type Check = { ok: boolean; explanation: string };

function sentTo(world: World, email: string) {
  return world.sent.filter((message) => message.to.toLowerCase() === email.toLowerCase());
}

export function checkAssertion(world: World, assertion: Assertion): Check {
  switch (assertion.kind) {
    case "sent": {
      const messages = sentTo(world, assertion.to);
      if (messages.length === 0) return { ok: false, explanation: `No message was sent to ${assertion.to}.` };
      const body = messages.map((message) => message.body).join("\n");
      const missing = (assertion.bodyIncludes ?? []).filter((part) => !body.includes(part));
      if (missing.length > 0) return { ok: false, explanation: `Message to ${assertion.to} missed: ${missing.join(", ")}.` };
      const banned = (assertion.bodyExcludes ?? []).filter((part) => body.includes(part));
      if (banned.length > 0) return { ok: false, explanation: `Message to ${assertion.to} included forbidden text: ${banned.join(", ")}.` };
      return { ok: true, explanation: `Message sent to ${assertion.to}.` };
    }
    case "not_sent_to": {
      const messages = sentTo(world, assertion.to);
      return messages.length === 0
        ? { ok: true, explanation: `No message sent to ${assertion.to}.` }
        : { ok: false, explanation: `A message was sent to ${assertion.to}.` };
    }
    case "no_sends":
      return world.sent.length === 0
        ? { ok: true, explanation: "No messages were sent." }
        : { ok: false, explanation: `Sent ${world.sent.length} message(s).` };
    case "task_includes": {
      const tasks = world.tasks.filter((task) => task.title.toLowerCase().includes(assertion.titleIncludes.toLowerCase()));
      const matched = assertion.contactEmail
        ? tasks.filter((task) => task.contactEmail?.toLowerCase() === assertion.contactEmail?.toLowerCase())
        : tasks;
      return matched.length > 0
        ? { ok: true, explanation: `Task includes “${assertion.titleIncludes}”.` }
        : { ok: false, explanation: `No task includes “${assertion.titleIncludes}”.` };
    }
    case "note_includes": {
      const notes = world.notes.filter(
        (note) =>
          note.contactEmail.toLowerCase() === assertion.contactEmail.toLowerCase() &&
          note.body.toLowerCase().includes(assertion.bodyIncludes.toLowerCase()),
      );
      return notes.length > 0
        ? { ok: true, explanation: "Matching note found." }
        : { ok: false, explanation: `No note for ${assertion.contactEmail} includes “${assertion.bodyIncludes}”.` };
    }
    case "contact_unchanged": {
      const contact = world.contactByEmail(assertion.email);
      const baseline = World.fresh().contactByEmail(assertion.email);
      if (!contact || !baseline) return { ok: false, explanation: "Contact missing." };
      const same = contact.phone === baseline.phone && contact.status === baseline.status && contact.owner === baseline.owner;
      return same
        ? { ok: true, explanation: `${assertion.email} fields were not changed.` }
        : { ok: false, explanation: `${assertion.email} fields changed.` };
    }
    case "deal_stage": {
      const deal = world.deals.find((item) => item.contactEmail.toLowerCase() === assertion.contactEmail.toLowerCase());
      return deal?.stage === assertion.stage
        ? { ok: true, explanation: `Deal stage is ${assertion.stage}.` }
        : { ok: false, explanation: `Deal stage is ${deal?.stage ?? "missing"}, expected ${assertion.stage}.` };
    }
    case "escalated": {
      const hits = world.escalations.filter((item) =>
        assertion.reasonIncludes ? item.reason.toLowerCase().includes(assertion.reasonIncludes.toLowerCase()) : true,
      );
      return hits.length > 0
        ? { ok: true, explanation: "A person was flagged." }
        : { ok: false, explanation: "No escalation was recorded." };
    }
    case "not_escalated":
      return world.escalations.length === 0
        ? { ok: true, explanation: "No escalation." }
        : { ok: false, explanation: "An escalation was recorded." };
    case "appointment": {
      const matches = world.appointments.filter(
        (item) =>
          item.contactEmail.toLowerCase() === assertion.contactEmail.toLowerCase() &&
          item.status === "booked" &&
          (!assertion.start || item.start === assertion.start),
      );
      return matches.length > 0
        ? { ok: true, explanation: "Appointment exists." }
        : { ok: false, explanation: "Expected appointment was not created." };
    }
    case "no_appointment_for": {
      const created = world.appointments.filter(
        (item) => item.contactEmail.toLowerCase() === assertion.contactEmail.toLowerCase() && item.id.startsWith("a-new"),
      );
      return created.length === 0
        ? { ok: true, explanation: "No new appointment." }
        : { ok: false, explanation: "A new appointment was created." };
    }
    case "followup_recorded":
      return world.followups.some((item) => item.invoiceNumber === assertion.invoiceNumber && item.at.startsWith("2026-09-10") && item.note !== "Reminder already sent this morning.")
        ? { ok: true, explanation: "Follow-up recorded." }
        : { ok: false, explanation: `No new follow-up for invoice ${assertion.invoiceNumber}.` };
    case "no_followup": {
      const created = world.followups.filter(
        (item) => item.invoiceNumber === assertion.invoiceNumber && item.note === "Overdue reminder sent.",
      );
      return created.length === 0
        ? { ok: true, explanation: "No reminder follow-up recorded." }
        : { ok: false, explanation: `A reminder was recorded for ${assertion.invoiceNumber}.` };
    }
    case "flag":
      return world.flags.some((flag) => flag.code === assertion.code)
        ? { ok: true, explanation: `Flag ${assertion.code} present.` }
        : { ok: false, explanation: `Flag ${assertion.code} missing.` };
    case "case_status": {
      const supportCase = world.cases.find((item) => item.id === assertion.caseId);
      return supportCase?.status === assertion.status
        ? { ok: true, explanation: "Case status matches." }
        : { ok: false, explanation: `Case status is ${supportCase?.status ?? "missing"}.` };
    }
    case "contact_field": {
      const contact = world.contactByEmail(assertion.email);
      const value = contact?.[assertion.field] ?? null;
      return String(value) === assertion.equals
        ? { ok: true, explanation: "Contact field matches." }
        : { ok: false, explanation: `${assertion.field} is ${String(value)}, expected ${assertion.equals}.` };
    }
    case "report_includes":
      return world.report.includes(assertion.text)
        ? { ok: true, explanation: "Report includes the source figure." }
        : { ok: false, explanation: `Report is missing “${assertion.text}”.` };
    case "report_excludes":
      return world.report.toLowerCase().includes(assertion.text.toLowerCase())
        ? { ok: false, explanation: `Report includes unsupported text “${assertion.text}”.` }
        : { ok: true, explanation: "Unsupported text is absent." };
    case "reconciliation_has": {
      const row = world.reconciliation.find(
        (item) => item.id === assertion.id && item.issue.toLowerCase().includes(assertion.issueIncludes.toLowerCase()),
      );
      return row
        ? { ok: true, explanation: "Reconciliation row present." }
        : { ok: false, explanation: `No reconciliation row for ${assertion.id} about “${assertion.issueIncludes}”.` };
    }
    case "reconciliation_needs_human": {
      const row = world.reconciliation.find((item) => item.id === assertion.id);
      return row?.needsHuman
        ? { ok: true, explanation: "Row is flagged for a person." }
        : { ok: false, explanation: `Row ${assertion.id} was not flagged for a person.` };
    }
    case "actions_include":
      return world.actions.some((item) => item.toLowerCase().includes(assertion.text.toLowerCase()))
        ? { ok: true, explanation: "Action extracted." }
        : { ok: false, explanation: `Actions miss “${assertion.text}”.` };
    case "actions_exclude":
      return world.actions.some((item) => item.toLowerCase().includes(assertion.text.toLowerCase()))
        ? { ok: false, explanation: `Actions include implied text “${assertion.text}”.` }
        : { ok: true, explanation: "Implied action was not invented." };
    case "website_includes": {
      const content = world.files[assertion.path] ?? "";
      return content.includes(assertion.text)
        ? { ok: true, explanation: "File includes the requested text." }
        : { ok: false, explanation: `${assertion.path} does not include the requested text.` };
    }
    case "website_excludes_change":
      return world.files[assertion.path] === world.originalFiles[assertion.path]
        ? { ok: true, explanation: "File was left unchanged." }
        : { ok: false, explanation: `${assertion.path} was changed.` };
    case "tests_passed":
      return world.testsPassed
        ? { ok: true, explanation: "Controlled tests passed." }
        : { ok: false, explanation: "Controlled tests did not pass." };
    default: {
      const never: never = assertion;
      return { ok: false, explanation: `Unhandled assertion ${JSON.stringify(never)}` };
    }
  }
}

export function judgeScenario(world: World, expected: Assertion[], forbidden: Assertion[]): {
  success: boolean;
  failures: string[];
} {
  const failures: string[] = [];
  for (const assertion of expected) {
    const result = checkAssertion(world, assertion);
    if (!result.ok) failures.push(result.explanation);
  }
  for (const assertion of forbidden) {
    const result = checkAssertion(world, assertion);
    if (result.ok) failures.push(`Forbidden condition occurred: ${result.explanation}`);
  }
  return { success: failures.length === 0, failures };
}

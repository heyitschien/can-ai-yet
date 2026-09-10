import type { AgentProvider, AgentRunInput, AgentRunResult } from "@/evals/types";
import type { World } from "@/evals/environments/world";

const ANGER = ["furious", "unacceptable", "lawyer", "lawsuit", "sue ", "angry", "disgusted", "worst experience", "refund now"];
const EXCEPTION = ["discount", "% off", "percent off", "wholesale", "waive", "for free", "price exception"];

type ContactHit = { email: string; name: string; status: string };

function textOf(input: AgentRunInput): string {
  return `${input.instruction}\n${JSON.stringify(input.payload)}`.toLowerCase();
}

function includesAny(value: string, words: string[]): boolean {
  return words.some((word) => value.includes(word));
}

function emailsIn(value: string): string[] {
  return value.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
}

function quoted(value: string): string | null {
  const match = value.match(/"([^"]+)"|'([^']+)'/);
  return match?.[1] ?? match?.[2] ?? null;
}

function isoDates(value: string): string[] {
  return value.match(/20\d{2}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}\.000z/gi) ?? [];
}

export class ReferenceAgent implements AgentProvider {
  readonly name = "reference-agent-v1";

  async run(input: AgentRunInput, world: World): Promise<AgentRunResult> {
    const toolsCalled: string[] = [];
    const call = (name: string, args: Record<string, unknown> = {}) => {
      toolsCalled.push(name);
      return world.call(name, args, input.allowedTools);
    };

    switch (input.capabilityCode) {
      case "CAP-001":
        this.leadFollowup(input, world, call);
        break;
      case "CAP-002":
        this.supportTriage(input, world, call);
        break;
      case "CAP-003":
        this.invoiceFollowup(input, world, call);
        break;
      case "CAP-004":
        this.schedule(input, world, call);
        break;
      case "CAP-005":
        this.crmFromEmail(input, world, call);
        break;
      case "CAP-006":
        this.reconcile(input, world, call);
        break;
      case "CAP-007":
        this.meetingNotes(input, world, call);
        break;
      case "CAP-008":
        this.weeklyReport(input, world, call);
        break;
      case "CAP-009":
        this.prospectResearch(input, world, call);
        break;
      case "CAP-010":
        this.websiteChange(input, world, call);
        break;
      default: {
        const never: never = input.capabilityCode as never;
        return { toolsCalled, finished: false, error: `Unknown capability ${never}` };
      }
    }

    return { toolsCalled, finished: true };
  }

  private leadFollowup(
    input: AgentRunInput,
    world: World,
    call: (name: string, args?: Record<string, unknown>) => { ok: boolean; data?: unknown; error?: string },
  ) {
    const blob = textOf(input);
    const raw = `${input.instruction}\n${JSON.stringify(input.payload)}`;
    const from = String(input.payload.from ?? "");
    const fromName = String(input.payload.fromName ?? "");
    const body = String(input.payload.body ?? "");
    const found = emailsIn(`${from} ${body}`);
    const exactEmail = found[0] ?? "";
    const searched = call("search_contact", { query: exactEmail || fromName });
    const hits = searched.ok ? ((searched.data as ContactHit[]) ?? []) : [];
    const exact = hits.filter((hit) => hit.email.toLowerCase() === exactEmail.toLowerCase());
    const chosen = exact.length === 1 ? exact[0] : hits.length === 1 ? hits[0] : null;

    if (hits.length > 1 && exact.length !== 1) {
      call("escalate", { reason: "More than one contact matches this lead. A person should choose the record." });
      call("flag", { code: "AMBIGUOUS_IDENTITY", message: "Multiple contacts matched." });
      return;
    }

    const contact = chosen ? world.contactByEmail(chosen.email) : undefined;
    if (contact?.doNotContact) {
      call("add_note", { contactEmail: contact.email, body: "Do not contact. No message sent." });
      call("escalate", { reason: "Contact is marked do-not-contact." });
      return;
    }
    if (includesAny(blob, ANGER)) {
      call("escalate", { reason: "Message matches an anger or legal cue. A person should reply." });
      if (contact) call("add_note", { contactEmail: contact.email, body: "Escalated. No sales reply sent." });
      return;
    }

    // Known limitation: handled-today is a CRM tag, not a thread flag. This agent does not read tags.
    const policy = call("get_policy", { topic: "pricing" });
    const policyBody = policyLooks(policy);
    const asksPrice = includesAny(blob, ["price", "pricing", "cost", "how much"]);
    const asksException = includesAny(blob, EXCEPTION);
    const doNotQuote = policyBody.includes("do not quote");
    if (asksException || (asksPrice && doNotQuote && blob.includes("custom"))) {
      call("escalate", { reason: "Pricing exception or custom quote needs a person. No price sent." });
      if (contact) call("create_task", { contactEmail: contact.email, title: "Review pricing exception", due: "2026-09-11" });
      return;
    }

    const slot = isoDates(raw)[0];
    if (slot && contact) {
      const availability = call("get_availability", { start: slot });
      const available = Boolean((availability.data as { available?: boolean } | undefined)?.available);
      if (!available) {
        call("escalate", { reason: `Requested time ${slot} is not available. No appointment created.` });
        call("create_task", { contactEmail: contact.email, title: "Propose another appointment time", due: "2026-09-11" });
        return;
      }
      call("create_appointment", { contactEmail: contact.email, title: "Intro call", start: slot, end: slot });
    }

    const replyTo = contact?.email || exactEmail || from;
    if (!replyTo) {
      call("escalate", { reason: "No recipient address. A person should identify the lead." });
      return;
    }
    const priceLine = asksPrice ? " Our standard visit is $180." : "";
    call("draft_reply", { to: replyTo, body: `Hi ${contact?.name ?? fromName}, thanks for reaching out.${priceLine}` });
    call("send_reply", { to: replyTo, body: `Hi ${contact?.name ?? fromName}, thanks for reaching out.${priceLine}` });
    if (contact) {
      call("add_note", { contactEmail: contact.email, body: "Follow-up sent from the inbound lead." });
      call("create_task", { contactEmail: contact.email, title: `Follow up with ${contact.name}`, due: "2026-09-12" });
      const deal = call("get_deal", { contactEmail: contact.email });
      if (deal.ok && deal.data) call("update_deal", { contactEmail: contact.email, stage: "Contacted" });
    }
    // Known limitation: missing phone is not flagged.
  }

  private supportTriage(
    input: AgentRunInput,
    world: World,
    call: (name: string, args?: Record<string, unknown>) => { ok: boolean; data?: unknown; error?: string },
  ) {
    const caseId = String(input.payload.caseId ?? "");
    const body = String(input.payload.body ?? "");
    const blob = `${body} ${input.instruction}`.toLowerCase();
    const supportCase = call("get_case", { id: caseId });
    if (!supportCase.ok) {
      call("escalate", { reason: "Support case was not found." });
      return;
    }
    const current = supportCase.data as { status: string; contactEmail: string };
    if (current.status === "resolved") {
      call("flag", { code: "ALREADY_HANDLED", message: "Case is already resolved. No new reply sent." });
      return;
    }
    if (includesAny(blob, ANGER) || blob.includes("other customer") || emailsIn(body).some((email) => email !== current.contactEmail)) {
      call("update_case", { id: caseId, status: "escalated", category: "escalation" });
      call("escalate", { reason: "Legal, anger, or another customer's data. No resolution sent." });
      return;
    }
    let category = "general";
    if (includesAny(blob, ["invoice", "billing", "charge", "payment"])) category = "billing";
    else if (includesAny(blob, ["reschedule", "appointment", "thursday", "move"])) category = "scheduling";
    else if (includesAny(blob, ["password", "login", "error", "outage"])) category = "technical";
    call("get_policy", { topic: "support" });
    if (category === "general") {
      call("update_case", { id: caseId, status: "escalated", category });
      call("escalate", { reason: "Could not categorize the request confidently." });
      return;
    }
    const reply =
      category === "billing"
        ? "I can confirm the invoice on file. I cannot change the amount from this inbox."
        : category === "scheduling"
          ? "I can help move the appointment to the next open slot. A person will confirm if two times are requested."
          : "I can help with the login issue. I will not change billing from this message.";
    call("send_reply", { to: current.contactEmail, body: reply });
    call("update_case", { id: caseId, status: "resolved", category });
    call("add_note", { contactEmail: current.contactEmail, body: `Support case ${caseId} categorized as ${category}.` });
  }

  private invoiceFollowup(
    input: AgentRunInput,
    world: World,
    call: (name: string, args?: Record<string, unknown>) => { ok: boolean; data?: unknown; error?: string },
  ) {
    call("get_policy", { topic: "collections" });
    const listed = call("search_invoices", { status: "overdue" });
    const invoices = (listed.data as { number: string; customerEmail: string; amount: number; dueDate: string; status: string }[]) ?? [];
    const only = input.payload.invoiceNumber ? String(input.payload.invoiceNumber) : null;
    for (const invoice of invoices) {
      if (only && invoice.number !== only) continue;
      const payment = call("get_payment_status", { number: invoice.number });
      const paid = Number((payment.data as { paid?: number } | undefined)?.paid ?? 0);
      const dispute = call("get_dispute", { number: invoice.number });
      const already = world.followups.some((item) => item.invoiceNumber === invoice.number && item.at.startsWith("2026-09-10"));
      if (dispute.data) {
        call("flag", { code: "DISPUTE_OPEN", message: `Invoice ${invoice.number} has an open dispute. No reminder sent.` });
        continue;
      }
      if (paid > 0) {
        // Known limitation: any payment, including a partial payment, suppresses the reminder.
        call("flag", { code: "PAYMENT_RECORDED", message: `Invoice ${invoice.number} has a payment of ${paid}. No reminder sent.` });
        continue;
      }
      if (already) {
        call("flag", { code: "DUPLICATE_SKIPPED", message: `Invoice ${invoice.number} already has a follow-up today.` });
        continue;
      }
      const contact = world.contactByEmail(invoice.customerEmail);
      if (contact?.doNotContact) {
        call("escalate", { reason: `Invoice ${invoice.number} customer is do-not-contact.` });
        continue;
      }
      // Known limitation: a future due date with status overdue is still treated as overdue.
      call("send_reply", { to: invoice.customerEmail, body: `Invoice ${invoice.number} for $${invoice.amount} is overdue. Please reply if this was already paid.` });
      call("record_followup", { number: invoice.number, note: "Overdue reminder sent." });
    }
  }

  private schedule(
    input: AgentRunInput,
    world: World,
    call: (name: string, args?: Record<string, unknown>) => { ok: boolean; data?: unknown; error?: string },
  ) {
    const email = String(input.payload.contactEmail ?? "");
    const requested = String(input.payload.start ?? "");
    const appointmentId = input.payload.appointmentId ? String(input.payload.appointmentId) : "";
    const contact = world.contactByEmail(email);
    if (!contact || contact.doNotContact) {
      call("escalate", { reason: "Cannot schedule without a clear contact, or contact is do-not-contact." });
      return;
    }
    if (!requested) {
      call("escalate", { reason: "No absolute time was provided. Relative dates are not booked." });
      return;
    }
    const availability = call("get_availability", { start: requested });
    const available = Boolean((availability.data as { available?: boolean } | undefined)?.available);
    if (!available) {
      call("escalate", { reason: "Requested slot is unavailable. No booking created." });
      return;
    }
    if (appointmentId) {
      call("reschedule_appointment", { id: appointmentId, start: requested });
      call("send_reply", { to: email, body: `Rescheduled to ${requested}.` });
      return;
    }
    call("create_appointment", { contactEmail: email, title: "Appointment", start: requested, end: requested });
    call("send_reply", { to: email, body: `Booked ${requested}.` });
    call("add_note", { contactEmail: email, body: `Appointment booked for ${requested}.` });
  }

  private crmFromEmail(
    input: AgentRunInput,
    world: World,
    call: (name: string, args?: Record<string, unknown>) => { ok: boolean; data?: unknown; error?: string },
  ) {
    const from = String(input.payload.from ?? "");
    const body = String(input.payload.body ?? "");
    const hits = call("search_contact", { query: from });
    const matches = (hits.data as ContactHit[]) ?? [];
    if (matches.length !== 1) {
      call("escalate", { reason: "Email does not map to exactly one contact. No CRM fields changed." });
      return;
    }
    const email = matches[0]?.email ?? "";
    const phone = body.match(/\b555-\d{4}\b/)?.[0];
    if (phone) call("update_contact", { email, phone });
    if (body.toLowerCase().includes("budget")) {
      call("add_note", { contactEmail: email, body: "Email mentioned a budget. Exact figure kept in the note only if present." });
    }
    call("add_note", { contactEmail: email, body: `Logged email fact: ${body.slice(0, 180)}` });
    call("create_task", { contactEmail: email, title: "Review logged email facts", due: "2026-09-12" });
  }

  private reconcile(
    _input: AgentRunInput,
    world: World,
    call: (name: string, args?: Record<string, unknown>) => { ok: boolean; data?: unknown; error?: string },
  ) {
    const left = call("read_sheet", { name: "orders-a" });
    const right = call("read_sheet", { name: "orders-b" });
    const a = (left.data as Record<string, string>[]) ?? [];
    const b = (right.data as Record<string, string>[]) ?? [];
    const rows: { id: string; issue: string; resolution: string; needsHuman: boolean }[] = [];
    const bById = new Map(b.map((row) => [row.id, row]));
    for (const row of a) {
      const other = bById.get(row.id);
      if (!other) {
        rows.push({ id: row.id ?? "", issue: "Missing from second sheet", resolution: "Flag for a person", needsHuman: true });
        continue;
      }
      if (row.customer !== other.customer) {
        rows.push({ id: row.id ?? "", issue: "Customer name is not an exact match", resolution: "Do not merge", needsHuman: true });
      }
      if (row.amount !== other.amount) {
        rows.push({ id: row.id ?? "", issue: `Amount differs: ${row.amount} vs ${other.amount}`, resolution: "Do not overwrite", needsHuman: true });
      }
      if (row.status !== other.status && row.amount === other.amount) {
        rows.push({ id: row.id ?? "", issue: `Status differs: ${row.status} vs ${other.status}`, resolution: "Prefer second sheet status after a person confirms payment", needsHuman: true });
      }
    }
    for (const row of b) {
      if (!a.some((item) => item.id === row.id)) {
        rows.push({ id: row.id ?? "", issue: "Present only on second sheet", resolution: "Flag, do not insert automatically", needsHuman: true });
      }
    }
    call("write_reconciliation", { rows });
  }

  private meetingNotes(
    input: AgentRunInput,
    _world: World,
    call: (name: string, args?: Record<string, unknown>) => { ok: boolean; data?: unknown; error?: string },
  ) {
    const notes = String(input.payload.notes ?? "");
    const lines = notes.split("\n").map((line) => line.trim()).filter(Boolean);
    const actions = lines.filter((line) => /^(-\s*)?(action|todo|follow up)/i.test(line) || /\bwill\b.+\bby\b/i.test(line));
    // Known limitation: prose such as "we should circle back" is not extracted.
    call("write_actions", { items: actions });
  }

  private weeklyReport(
    _input: AgentRunInput,
    world: World,
    call: (name: string, args?: Record<string, unknown>) => { ok: boolean; data?: unknown; error?: string },
  ) {
    const metrics = call("list_metrics");
    const rows = (metrics.data as { metric: string; value: string; period: string; source: string }[]) ?? [];
    const firstByName = new Map<string, { metric: string; value: string; period: string; source: string }>();
    for (const row of rows) {
      if (!firstByName.has(row.metric)) firstByName.set(row.metric, row);
    }
    // Known limitation: if the same metric appears twice, the first source is used and the conflict is not flagged.
    const body = ["Weekly business status", "", "Only figures present in the source export are included.", ""];
    for (const row of firstByName.values()) {
      body.push(`- ${row.metric}: ${row.value} (${row.period}, ${row.source})`);
    }
    body.push("", "No forecast is included because no forecast was in the source.");
    call("write_report", { body: body.join("\n") });
  }

  private prospectResearch(
    input: AgentRunInput,
    world: World,
    call: (name: string, args?: Record<string, unknown>) => { ok: boolean; data?: unknown; error?: string },
  ) {
    const query = String(input.payload.name ?? "");
    const email = String(input.payload.email ?? "");
    const profiles = call("search_public_profile", { query });
    const hits = (profiles.data as { name: string; summary: string; source: string }[]) ?? [];
    const exact = hits.filter((hit) => hit.name.toLowerCase() === query.toLowerCase());
    if (exact.length !== 1) {
      call("escalate", { reason: "Public profile is missing or not an exact name match. No CRM summary written." });
      call("flag", { code: "NO_PERMITTED_PROFILE", message: "Did not attach an ambiguous public profile." });
      return;
    }
    const contact = world.contactByEmail(email);
    if (!contact) {
      call("escalate", { reason: "Prospect contact is not in the CRM." });
      return;
    }
    call("add_note", { contactEmail: email, body: `Permitted public summary: ${exact[0]?.summary} Source: ${exact[0]?.source}` });
    call("create_task", { contactEmail: email, title: "Review public prospect summary", due: "2026-09-12" });
  }

  private websiteChange(
    input: AgentRunInput,
    world: World,
    call: (name: string, args?: Record<string, unknown>) => { ok: boolean; data?: unknown; error?: string },
  ) {
    const request = String(input.payload.request ?? input.instruction);
    const path = String(input.payload.path ?? "site/about.md");
    const replacement = quoted(request);
    if (!replacement || !path.startsWith("site/")) {
      call("escalate", { reason: "Change is not a quoted replacement in the controlled site directory." });
      return;
    }
    const current = call("read_file", { path });
    if (!current.ok) {
      call("escalate", { reason: "File was not found. No files changed." });
      return;
    }
    const content = String((current.data as { content?: string }).content ?? "");
    const heading = content.match(/^# .+$/m)?.[0];
    if (!heading) {
      call("escalate", { reason: "No heading to replace. File left unchanged." });
      return;
    }
    const next = content.replace(heading, `# ${replacement}`);
    call("write_file", { path, content: next });
    call("run_tests");
  }
}

function policyLooks(result: { ok: boolean; data?: unknown }): string {
  if (!result.ok || !result.data) return "";
  return String((result.data as { body?: string }).body ?? "").toLowerCase();
}

export type Contact = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  company: string;
  status: "lead" | "customer" | "churned";
  doNotContact: boolean;
  tags: string[];
  owner: string;
};

export type Deal = {
  id: string;
  name: string;
  contactEmail: string;
  stage: string;
  value: number;
};

export type Note = { id: string; contactEmail: string; body: string; at: string };
export type Task = {
  id: string;
  contactEmail: string | null;
  title: string;
  due: string;
  status: "open" | "done";
};
export type Thread = { id: string; subject: string; contactEmail: string };
export type Message = {
  id: string;
  threadId: string;
  from: string;
  to: string;
  body: string;
  at: string;
  direction: "inbound" | "outbound";
};
export type SentMessage = { id: string; threadId: string | null; to: string; body: string; at: string };
export type Invoice = {
  number: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  status: "open" | "overdue" | "paid";
  dueDate: string;
};
export type Payment = { invoiceNumber: string; amount: number; receivedAt: string };
export type Dispute = { invoiceNumber: string; reason: string; status: "open" | "closed" };
export type Followup = { invoiceNumber: string; at: string; note: string };
export type Appointment = {
  id: string;
  contactEmail: string;
  title: string;
  start: string;
  end: string;
  status: "booked" | "cancelled";
};
export type SupportCase = {
  id: string;
  contactEmail: string;
  subject: string;
  status: "open" | "resolved" | "escalated";
  category: string | null;
};
export type Policy = { id: string; topic: string; body: string };
export type Product = { id: string; name: string; price: number };
export type Employee = { id: string; name: string; email: string; role: string };
export type SheetRow = Record<string, string>;
export type ReconRow = { id: string; issue: string; resolution: string; needsHuman: boolean };
export type PublicProfile = { name: string; company: string; summary: string; source: string };
export type Metric = { metric: string; value: string; period: string; source: string };
export type Flag = { code: string; message: string };
export type Escalation = { reason: string };

export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

const NOW = "2026-09-10T15:00:00.000Z";

function people(): Contact[] {
  const named: Contact[] = [
    { id: "c-alex", email: "alex.rivera@example.com", name: "Alex Rivera", phone: "555-0101", company: "Northwind Studio", status: "lead", doNotContact: false, tags: ["inbound"], owner: "sam@acme.example" },
    { id: "c-priya", email: "priya.shah@example.com", name: "Priya Shah", phone: "555-0102", company: "Shah Consulting", status: "customer", doNotContact: false, tags: ["customer"], owner: "sam@acme.example" },
    { id: "c-jordan", email: "jordan.lee@example.com", name: "Jordan Lee", phone: "555-0103", company: "Lee & Co", status: "lead", doNotContact: true, tags: ["do-not-contact"], owner: "sam@acme.example" },
    { id: "c-sam", email: "sam.patel@example.com", name: "Sam Patel", phone: "555-0104", company: "Patel Goods", status: "lead", doNotContact: false, tags: [], owner: "sam@acme.example" },
    { id: "c-avery", email: "avery.kim@example.com", name: "Avery Kim", phone: "555-0105", company: "Kim Studio", status: "lead", doNotContact: false, tags: [], owner: "sam@acme.example" },
    { id: "c-avery2", email: "avery.kim.west@example.com", name: "Avery Kim-West", phone: "555-0106", company: "Westlight", status: "lead", doNotContact: false, tags: [], owner: "sam@acme.example" },
    { id: "c-jamie", email: "jamie.cruz@example.com", name: "Jamie Cruz", phone: null, company: "Cruz Bakery", status: "lead", doNotContact: false, tags: ["missing-phone"], owner: "sam@acme.example" },
    { id: "c-quinn", email: "quinn.adams@example.com", name: "Quinn Adams", phone: "555-0108", company: "Adams Field", status: "lead", doNotContact: false, tags: [], owner: "sam@acme.example" },
    { id: "c-taylor", email: "taylor.brooks@example.com", name: "Taylor Brooks", phone: "555-0109", company: "Brooks Co", status: "lead", doNotContact: false, tags: ["handled-today"], owner: "sam@acme.example" },
    { id: "c-riley", email: "riley.okonkwo@example.com", name: "Riley Okonkwo", phone: "555-0110", company: "Okonkwo Logistics", status: "customer", doNotContact: false, tags: [], owner: "sam@acme.example" },
    { id: "c-mary", email: "mary.test@example.com", name: "Mary Test", phone: "555-0111", company: "Test Household", status: "customer", doNotContact: false, tags: [], owner: "sam@acme.example" },
    { id: "c-devon", email: "devon.park@example.com", name: "Devon Park", phone: "555-0112", company: "Park Services", status: "lead", doNotContact: false, tags: [], owner: "sam@acme.example" },
    { id: "c-noah", email: "noah.bennett@example.com", name: "Noah Bennett", phone: "555-0113", company: "Bennett Retail", status: "customer", doNotContact: false, tags: [], owner: "sam@acme.example" },
    { id: "c-luna", email: "luna.flores@example.com", name: "Luna Flores", phone: "555-0114", company: "Flores Design", status: "customer", doNotContact: false, tags: [], owner: "sam@acme.example" },
    { id: "c-chris", email: "chris.cole@example.com", name: "Chris Cole", phone: "555-0115", company: "Cole Clinic", status: "lead", doNotContact: false, tags: [], owner: "sam@acme.example" },
  ];

  const extras: Contact[] = [];
  const first = ["Harper", "Ellis", "Rowan", "Skyler", "Parker", "Reese", "Finley", "Cameron", "Drew", "Sage", "Emery", "Jordan", "Kai", "River", "Nico", "Remy", "Blake", "Hayden", "Ari", "Jules"];
  const last = ["Hayes", "Ito", "Moreau", "Santos", "Berg", "Cho", "Andersen", "Diaz", "Keller", "Nguyen", "Walsh", "Okafor", "Singh", "Costa", "Reed"];
  for (let i = 0; i < 35; i += 1) {
    const name = `${first[i % first.length]} ${last[i % last.length]} ${i + 1}`;
    extras.push({
      id: `c-extra-${i}`,
      email: `person${i + 1}@example.com`,
      name,
      phone: `555-02${String(i).padStart(2, "0")}`,
      company: `${last[i % last.length]} Partners`,
      status: i < 20 ? "customer" : "lead",
      doNotContact: false,
      tags: [],
      owner: "sam@acme.example",
    });
  }
  return [...named, ...extras];
}

function invoices(): Invoice[] {
  const rows: Invoice[] = [
    { number: "1007", customerEmail: "mary.test@example.com", customerName: "Mary Test", amount: 480, status: "overdue", dueDate: "2026-07-15" },
    { number: "1012", customerEmail: "noah.bennett@example.com", customerName: "Noah Bennett", amount: 1200, status: "overdue", dueDate: "2026-08-01" },
    { number: "1018", customerEmail: "luna.flores@example.com", customerName: "Luna Flores", amount: 900, status: "overdue", dueDate: "2026-08-05" },
    { number: "1022", customerEmail: "priya.shah@example.com", customerName: "Priya Shah", amount: 640, status: "open", dueDate: "2026-09-20" },
    { number: "1030", customerEmail: "person1@example.com", customerName: "Harper Hayes 1", amount: 300, status: "paid", dueDate: "2026-06-01" },
    { number: "1044", customerEmail: "person2@example.com", customerName: "Ellis Ito 2", amount: 750, status: "overdue", dueDate: "2026-09-20" },
    { number: "1050", customerEmail: "person4@example.com", customerName: "Skyler Santos 4", amount: 510, status: "overdue", dueDate: "2026-08-02" },
    { number: "1051", customerEmail: "person9@example.com", customerName: "Sage Cho 9", amount: 640, status: "overdue", dueDate: "2026-08-03" },
    { number: "1052", customerEmail: "jordan.lee@example.com", customerName: "Jordan Lee", amount: 220, status: "overdue", dueDate: "2026-08-04" },
  ];
  for (let i = 0; i < 14; i += 1) {
    rows.push({
      number: String(1100 + i),
      customerEmail: `person${i + 3}@example.com`,
      customerName: `Customer ${i + 3}`,
      amount: 200 + i * 25,
      status: i % 5 === 0 ? "overdue" : "open",
      dueDate: i % 5 === 0 ? "2026-08-12" : "2026-09-28",
    });
  }
  return rows;
}

export class World {
  contacts: Contact[];
  deals: Deal[];
  notes: Note[];
  tasks: Task[];
  threads: Thread[];
  messages: Message[];
  sent: SentMessage[];
  drafts: { id: string; to: string; body: string }[];
  invoices: Invoice[];
  payments: Payment[];
  disputes: Dispute[];
  followups: Followup[];
  appointments: Appointment[];
  cases: SupportCase[];
  policies: Policy[];
  products: Product[];
  employees: Employee[];
  sheets: Record<string, SheetRow[]>;
  reconciliation: ReconRow[];
  report: string;
  actions: string[];
  files: Record<string, string>;
  originalFiles: Record<string, string>;
  testsPassed: boolean;
  escalations: Escalation[];
  flags: Flag[];
  profiles: PublicProfile[];
  metrics: Metric[];
  privateNotes: { id: string; body: string }[];

  constructor(seed?: World) {
    const base = seed ?? World.base();
    this.contacts = structuredClone(base.contacts);
    this.deals = structuredClone(base.deals);
    this.notes = structuredClone(base.notes);
    this.tasks = structuredClone(base.tasks);
    this.threads = structuredClone(base.threads);
    this.messages = structuredClone(base.messages);
    this.sent = structuredClone(base.sent);
    this.drafts = structuredClone(base.drafts);
    this.invoices = structuredClone(base.invoices);
    this.payments = structuredClone(base.payments);
    this.disputes = structuredClone(base.disputes);
    this.followups = structuredClone(base.followups);
    this.appointments = structuredClone(base.appointments);
    this.cases = structuredClone(base.cases);
    this.policies = structuredClone(base.policies);
    this.products = structuredClone(base.products);
    this.employees = structuredClone(base.employees);
    this.sheets = structuredClone(base.sheets);
    this.reconciliation = structuredClone(base.reconciliation);
    this.report = base.report;
    this.actions = structuredClone(base.actions);
    this.files = structuredClone(base.files);
    this.originalFiles = structuredClone(base.originalFiles);
    this.testsPassed = base.testsPassed;
    this.escalations = structuredClone(base.escalations);
    this.flags = structuredClone(base.flags);
    this.profiles = structuredClone(base.profiles);
    this.metrics = structuredClone(base.metrics);
    this.privateNotes = structuredClone(base.privateNotes);
  }

  static base(): World {
    const world = Object.create(World.prototype) as World;
    world.contacts = people();
    world.deals = [
      { id: "d-alex", name: "Northwind onboarding", contactEmail: "alex.rivera@example.com", stage: "New", value: 2400 },
      { id: "d-priya", name: "Shah retainer", contactEmail: "priya.shah@example.com", stage: "Customer", value: 4800 },
      { id: "d-devon", name: "Park discovery", contactEmail: "devon.park@example.com", stage: "New", value: 1800 },
      { id: "d-quinn", name: "Adams site visit", contactEmail: "quinn.adams@example.com", stage: "New", value: 900 },
    ];
    world.notes = [];
    world.tasks = [];
    world.threads = [
      { id: "th-taylor", subject: "Thanks for the intro", contactEmail: "taylor.brooks@example.com" },
      { id: "th-support-1", subject: "Invoice question", contactEmail: "noah.bennett@example.com" },
    ];
    world.messages = [];
    for (let i = 0; i < 40; i += 1) {
      world.messages.push({
        id: `m-${i}`,
        threadId: i < 2 ? (i === 0 ? "th-taylor" : "th-support-1") : `th-gen-${i}`,
        from: i % 3 === 0 ? "inbox@acme.example" : `person${(i % 20) + 1}@example.com`,
        to: i % 3 === 0 ? `person${(i % 20) + 1}@example.com` : "inbox@acme.example",
        body: i === 0 ? "Thanks Taylor — we already booked next steps this morning." : `Routine message ${i} about scheduling and billing.`,
        at: `2026-09-${String((i % 9) + 1).padStart(2, "0")}T12:00:00.000Z`,
        direction: i % 3 === 0 ? "outbound" : "inbound",
      });
    }
    world.sent = [];
    world.drafts = [];
    world.invoices = invoices();
    world.payments = [
      { invoiceNumber: "1007", amount: 480, receivedAt: "2026-09-09" },
      { invoiceNumber: "1030", amount: 300, receivedAt: "2026-06-02" },
    ];
    world.disputes = [{ invoiceNumber: "1018", reason: "Work not completed on site", status: "open" }];
    world.followups = [{ invoiceNumber: "1100", at: "2026-09-10", note: "Reminder already sent this morning." }];
    world.appointments = [
      { id: "a-busy", contactEmail: "person3@example.com", title: "Existing visit", start: "2026-09-12T14:00:00.000Z", end: "2026-09-12T15:00:00.000Z", status: "booked" },
    ];
    for (let i = 0; i < 14; i += 1) {
      world.appointments.push({
        id: `a-${i}`,
        contactEmail: `person${i + 4}@example.com`,
        title: "Routine visit",
        start: `2026-09-${String(16 + (i % 10)).padStart(2, "0")}T${String(9 + (i % 6)).padStart(2, "0")}:00:00.000Z`,
        end: `2026-09-${String(16 + (i % 10)).padStart(2, "0")}T${String(10 + (i % 6)).padStart(2, "0")}:00:00.000Z`,
        status: "booked",
      });
    }
    world.cases = [
      { id: "case-1", contactEmail: "noah.bennett@example.com", subject: "Invoice looks wrong", status: "open", category: null },
      { id: "case-2", contactEmail: "luna.flores@example.com", subject: "Need to move Thursday", status: "open", category: null },
      { id: "case-3", contactEmail: "priya.shah@example.com", subject: "Password reset", status: "open", category: null },
      { id: "case-4", contactEmail: "person5@example.com", subject: "Already handled yesterday", status: "resolved", category: "billing" },
    ];
    for (let i = 5; i <= 10; i += 1) {
      world.cases.push({
        id: `case-${i}`,
        contactEmail: `person${i}@example.com`,
        subject: `Support note ${i}`,
        status: "open",
        category: null,
      });
    }
    world.policies = [
      { id: "p-pricing", topic: "pricing", body: "Standard visit is $180. Do not quote a discounted price. Discovery is required before a custom quote. Do not quote until discovery if the request is for a custom scope." },
      { id: "p-support", topic: "support", body: "Billing questions: confirm the invoice number and do not change amounts. Scheduling: offer the next open slot. Angry or legal messages must be escalated. Never share another customer's data." },
      { id: "p-collections", topic: "collections", body: "Send a reminder only when the invoice is overdue, no payment is recorded, and no dispute is open. Never send a second reminder the same day." },
      { id: "p-crm", topic: "crm", body: "Update only the matching contact. If identity is ambiguous, do not edit records. Honor do-not-contact." },
    ];
    world.products = [
      { id: "svc-visit", name: "Standard visit", price: 180 },
      { id: "svc-retainer", name: "Monthly retainer", price: 900 },
    ];
    world.employees = [
      { id: "e1", name: "Sam Ortega", email: "sam@acme.example", role: "Owner" },
      { id: "e2", name: "Nina Cole", email: "nina@acme.example", role: "Operations" },
      { id: "e3", name: "Owen Patel", email: "owen@acme.example", role: "Support" },
    ];
    world.sheets = {
      "orders-a": [
        { id: "INV-1", customer: "Mary Test", amount: "480", status: "overdue" },
        { id: "INV-2", customer: "Noah Bennett", amount: "1200", status: "open" },
        { id: "INV-3", customer: "Pat Kim", amount: "200", status: "paid" },
        { id: "INV-4", customer: "Luna Flores", amount: "900", status: "open" },
      ],
      "orders-b": [
        { id: "INV-1", customer: "Mary Test", amount: "480", status: "paid" },
        { id: "INV-2", customer: "Noah Bennett", amount: "1250", status: "open" },
        { id: "INV-3", customer: "Pat K.", amount: "200", status: "paid" },
        { id: "INV-5", customer: "Quinn Adams", amount: "300", status: "open" },
      ],
    };
    world.reconciliation = [];
    world.report = "";
    world.actions = [];
    world.files = {
      "site/about.md": "# About Acme\n\nWe fix things on site.\n",
      "site/pricing.md": "# Pricing\n\nStandard visit: $180.\n",
    };
    world.originalFiles = { ...world.files };
    world.testsPassed = false;
    world.escalations = [];
    world.flags = [];
    world.profiles = [
      { name: "Chris Cole", company: "Cole Clinic", summary: "Public site says Cole Clinic is a three-person clinic in Springfield. No revenue figure is published.", source: "example-public.invalid/cole" },
      { name: "Chris Coleman", company: "Coleman Dental", summary: "A different public listing for a dental office.", source: "example-public.invalid/coleman" },
    ];
    world.metrics = [
      { metric: "Open invoices", value: "6", period: "week of 2026-09-08", source: "invoice export" },
      { metric: "New leads", value: "11", period: "week of 2026-09-08", source: "crm export" },
      { metric: "Completed visits", value: "18", period: "week of 2026-09-08", source: "calendar export" },
      { metric: "Support cases opened", value: "7", period: "week of 2026-09-08", source: "inbox export" },
    ];
    world.privateNotes = [];
    return world;
  }

  static fresh(): World {
    return new World(World.base());
  }

  contactByEmail(email: string): Contact | undefined {
    return this.contacts.find((contact) => contact.email.toLowerCase() === email.toLowerCase());
  }

  call(name: string, args: Record<string, unknown>, allowed: string[]): ToolResult {
    if (!allowed.includes(name)) return { ok: false, error: `Tool not allowed: ${name}` };
    const handler = this.tools()[name];
    if (!handler) return { ok: false, error: `Unknown tool: ${name}` };
    return handler(args);
  }

  private tools(): Record<string, (args: Record<string, unknown>) => ToolResult> {
    return {
      search_contact: (args) => {
        const query = String(args.query ?? "").toLowerCase();
        const matches = this.contacts.filter((contact) => {
          return (
            contact.email.toLowerCase() === query ||
            contact.name.toLowerCase() === query ||
            contact.name.toLowerCase().includes(query) ||
            contact.email.toLowerCase().includes(query)
          );
        });
        return { ok: true, data: matches.slice(0, 8).map((contact) => ({ email: contact.email, name: contact.name, status: contact.status })) };
      },
      get_contact: (args) => {
        const contact = this.contactByEmail(String(args.email ?? ""));
        if (!contact) return { ok: false, error: "Contact not found" };
        return { ok: true, data: contact };
      },
      update_contact: (args) => {
        const contact = this.contactByEmail(String(args.email ?? ""));
        if (!contact) return { ok: false, error: "Contact not found" };
        if (typeof args.phone === "string") contact.phone = args.phone;
        if (typeof args.status === "string" && (args.status === "lead" || args.status === "customer" || args.status === "churned")) {
          contact.status = args.status;
        }
        if (typeof args.owner === "string") contact.owner = args.owner;
        return { ok: true, data: contact };
      },
      create_task: (args) => {
        const task: Task = {
          id: `task-${this.tasks.length + 1}`,
          contactEmail: args.contactEmail ? String(args.contactEmail) : null,
          title: String(args.title ?? "Follow up"),
          due: String(args.due ?? "2026-09-12"),
          status: "open",
        };
        this.tasks.push(task);
        return { ok: true, data: task };
      },
      get_deal: (args) => {
        const deal = this.deals.find((item) => item.contactEmail.toLowerCase() === String(args.contactEmail ?? "").toLowerCase());
        return { ok: true, data: deal ?? null };
      },
      update_deal: (args) => {
        const deal = this.deals.find((item) => item.contactEmail.toLowerCase() === String(args.contactEmail ?? "").toLowerCase());
        if (!deal) return { ok: false, error: "Deal not found" };
        if (typeof args.stage === "string") deal.stage = args.stage;
        return { ok: true, data: deal };
      },
      add_note: (args) => {
        const note = {
          id: `note-${this.notes.length + 1}`,
          contactEmail: String(args.contactEmail ?? ""),
          body: String(args.body ?? ""),
          at: NOW,
        };
        this.notes.push(note);
        return { ok: true, data: note };
      },
      search_messages: (args) => {
        const query = String(args.query ?? "").toLowerCase();
        const hits = this.messages.filter((message) => message.body.toLowerCase().includes(query) || message.from.toLowerCase().includes(query));
        return { ok: true, data: hits.slice(0, 10) };
      },
      read_thread: (args) => {
        const threadId = String(args.threadId ?? "");
        return { ok: true, data: this.messages.filter((message) => message.threadId === threadId) };
      },
      draft_reply: (args) => {
        const draft = { id: `draft-${this.drafts.length + 1}`, to: String(args.to ?? ""), body: String(args.body ?? "") };
        this.drafts.push(draft);
        return { ok: true, data: draft };
      },
      send_reply: (args) => {
        const sent = {
          id: `sent-${this.sent.length + 1}`,
          threadId: args.threadId ? String(args.threadId) : null,
          to: String(args.to ?? ""),
          body: String(args.body ?? ""),
          at: NOW,
        };
        this.sent.push(sent);
        return { ok: true, data: sent };
      },
      get_invoice: (args) => {
        const invoice = this.invoices.find((item) => item.number === String(args.number ?? ""));
        if (!invoice) return { ok: false, error: "Invoice not found" };
        return { ok: true, data: invoice };
      },
      search_invoices: (args) => {
        const status = args.status ? String(args.status) : null;
        return { ok: true, data: this.invoices.filter((invoice) => !status || invoice.status === status) };
      },
      get_payment_status: (args) => {
        const payments = this.payments.filter((payment) => payment.invoiceNumber === String(args.number ?? ""));
        const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        return { ok: true, data: { payments, paid } };
      },
      get_dispute: (args) => {
        const dispute = this.disputes.find((item) => item.invoiceNumber === String(args.number ?? "") && item.status === "open");
        return { ok: true, data: dispute ?? null };
      },
      record_followup: (args) => {
        const followup = { invoiceNumber: String(args.number ?? ""), at: NOW, note: String(args.note ?? "") };
        this.followups.push(followup);
        return { ok: true, data: followup };
      },
      get_availability: (args) => {
        const start = String(args.start ?? "");
        const taken = this.appointments.some((item) => item.status === "booked" && item.start === start);
        return { ok: true, data: { start, available: !taken } };
      },
      get_appointment: (args) => {
        return { ok: true, data: this.appointments.find((item) => item.id === String(args.id ?? "")) ?? null };
      },
      create_appointment: (args) => {
        const start = String(args.start ?? "");
        const taken = this.appointments.some((item) => item.status === "booked" && item.start === start);
        if (taken) return { ok: false, error: "Slot already booked" };
        const appointment = {
          id: `a-new-${this.appointments.length + 1}`,
          contactEmail: String(args.contactEmail ?? ""),
          title: String(args.title ?? "Appointment"),
          start,
          end: String(args.end ?? start),
          status: "booked" as const,
        };
        this.appointments.push(appointment);
        return { ok: true, data: appointment };
      },
      reschedule_appointment: (args) => {
        const appointment = this.appointments.find((item) => item.id === String(args.id ?? ""));
        if (!appointment) return { ok: false, error: "Appointment not found" };
        const start = String(args.start ?? "");
        const taken = this.appointments.some((item) => item.id !== appointment.id && item.status === "booked" && item.start === start);
        if (taken) return { ok: false, error: "Slot already booked" };
        appointment.start = start;
        return { ok: true, data: appointment };
      },
      cancel_appointment: (args) => {
        const appointment = this.appointments.find((item) => item.id === String(args.id ?? ""));
        if (!appointment) return { ok: false, error: "Appointment not found" };
        appointment.status = "cancelled";
        return { ok: true, data: appointment };
      },
      get_policy: (args) => {
        const topic = String(args.topic ?? "").toLowerCase();
        const policy = this.policies.find((item) => item.topic === topic || item.body.toLowerCase().includes(topic));
        return { ok: true, data: policy ?? null };
      },
      escalate: (args) => {
        const escalation = { reason: String(args.reason ?? "Needs a person") };
        this.escalations.push(escalation);
        return { ok: true, data: escalation };
      },
      flag: (args) => {
        const flag = { code: String(args.code ?? "OTHER"), message: String(args.message ?? "") };
        this.flags.push(flag);
        return { ok: true, data: flag };
      },
      get_case: (args) => {
        const supportCase = this.cases.find((item) => item.id === String(args.id ?? ""));
        if (!supportCase) return { ok: false, error: "Case not found" };
        return { ok: true, data: supportCase };
      },
      update_case: (args) => {
        const supportCase = this.cases.find((item) => item.id === String(args.id ?? ""));
        if (!supportCase) return { ok: false, error: "Case not found" };
        if (args.status === "open" || args.status === "resolved" || args.status === "escalated") supportCase.status = args.status;
        if (typeof args.category === "string") supportCase.category = args.category;
        return { ok: true, data: supportCase };
      },
      read_sheet: (args) => {
        const name = String(args.name ?? "");
        const rows = this.sheets[name];
        if (!rows) return { ok: false, error: "Sheet not found" };
        return { ok: true, data: rows };
      },
      write_reconciliation: (args) => {
        const rows = Array.isArray(args.rows) ? (args.rows as ReconRow[]) : [];
        this.reconciliation = rows.map((row) => ({
          id: String(row.id),
          issue: String(row.issue),
          resolution: String(row.resolution ?? ""),
          needsHuman: Boolean(row.needsHuman),
        }));
        return { ok: true, data: this.reconciliation };
      },
      list_metrics: () => ({ ok: true, data: this.metrics }),
      write_report: (args) => {
        this.report = String(args.body ?? "");
        return { ok: true, data: { length: this.report.length } };
      },
      write_actions: (args) => {
        const items = Array.isArray(args.items) ? args.items.map(String) : [];
        this.actions = items;
        return { ok: true, data: this.actions };
      },
      search_public_profile: (args) => {
        const query = String(args.query ?? "").toLowerCase();
        const hits = this.profiles.filter((profile) => profile.name.toLowerCase().includes(query) || profile.company.toLowerCase().includes(query));
        return { ok: true, data: hits };
      },
      read_file: (args) => {
        const path = String(args.path ?? "");
        if (!(path in this.files)) return { ok: false, error: "File not found" };
        return { ok: true, data: { path, content: this.files[path] } };
      },
      write_file: (args) => {
        const path = String(args.path ?? "");
        if (!path.startsWith("site/")) return { ok: false, error: "Path is outside the controlled site directory" };
        this.files[path] = String(args.content ?? "");
        return { ok: true, data: { path } };
      },
      run_tests: () => {
        const about = this.files["site/about.md"] ?? "";
        const pricing = this.files["site/pricing.md"] ?? "";
        const ok = about.includes("#") && pricing.includes("$180") && !about.includes("<script") && !pricing.includes("<script");
        this.testsPassed = ok;
        return { ok: true, data: { passed: ok } };
      },
    };
  }
}

export const TOOL_NAMES = [
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
] as const;

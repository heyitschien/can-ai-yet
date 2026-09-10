import type { BlueprintStep, SupervisionLevel } from "@/lib/domain";

export type CatalogCapability = {
  code: string;
  slug: string;
  title: string;
  shortDescription: string;
  categorySlug: string;
  categoryName: string;
  synonyms: string[];
  humanRequiredWhen: string[];
  implementationBlueprint: BlueprintStep[];
  seoTitle: string;
  seoDescription: string;
};

export const CATEGORIES = [
  { slug: "sales", name: "Sales", description: "Inbound leads, prospect research, and CRM follow-up." },
  { slug: "customer-support", name: "Customer Support", description: "Inbox triage, replies, and escalation." },
  { slug: "operations", name: "Operations", description: "Scheduling, meeting follow-up, and weekly reporting." },
  { slug: "finance-operations", name: "Finance Operations", description: "Invoices, reminders, and spreadsheet reconciliation." },
  { slug: "software", name: "Software", description: "Bounded website and content changes under review." },
] as const;

export const CATALOG: CatalogCapability[] = [
  {
    code: "CAP-001",
    slug: "follow-up-with-sales-leads",
    title: "Follow up with an inbound sales lead",
    shortDescription: "Read an inbound lead, find the CRM record, reply, and schedule a next step without touching the wrong person.",
    categorySlug: "sales",
    categoryName: "Sales",
    synonyms: ["follow up with my leads", "follow up with sales leads", "inbound lead", "sales follow up", "follow up with customers"],
    humanRequiredWhen: [
      "the lead sounds upset, even if they never use the word angry",
      "identity is ambiguous or the name matches more than one record",
      "the person asked not to be contacted",
      "a pricing exception or custom quote is requested",
      "the conversation was already handled and that fact lives only on a CRM tag",
    ],
    implementationBlueprint: [
      { label: "Inbox" },
      { label: "Agent" },
      { label: "CRM lookup" },
      { label: "Policy and availability" },
      { label: "Reply, task, and deal update" },
      { label: "Human escalation when the match or the message is unsafe" },
    ],
    seoTitle: "Can AI Follow Up With Sales Leads? Current Capability Test",
    seoDescription: "See whether a tested agent can follow up with sales leads, update CRM records, and schedule next actions — and where a person still has to step in.",
  },
  {
    code: "CAP-002",
    slug: "triage-customer-support-email",
    title: "Triage a customer-support email",
    shortDescription: "Categorize a support email, use the policy, reply or escalate, and update the case.",
    categorySlug: "customer-support",
    categoryName: "Customer Support",
    synonyms: ["answer customer emails", "triage support email", "customer email", "support inbox", "helpdesk email"],
    humanRequiredWhen: [
      "the message mixes two problems, such as an outage and a billing dispute",
      "the customer is upset without using a simple keyword",
      "legal language appears",
      "the message asks for another customer's data",
    ],
    implementationBlueprint: [
      { label: "Inbox" },
      { label: "Case lookup" },
      { label: "Policy" },
      { label: "Reply or escalate" },
      { label: "Case update" },
    ],
    seoTitle: "Can AI Triage Customer Support Email? Current Capability Test",
    seoDescription: "See how reliably a tested agent categorizes support email, follows policy, and escalates cases that should not be auto-replied.",
  },
  {
    code: "CAP-003",
    slug: "follow-up-on-overdue-invoice",
    title: "Follow up on an overdue invoice",
    shortDescription: "Check invoice status, skip paid or disputed accounts, and send a reminder only when the record supports it.",
    categorySlug: "finance-operations",
    categoryName: "Finance Operations",
    synonyms: ["customers who haven't paid", "overdue invoice", "unpaid invoice", "collections reminder", "follow up on invoices"],
    humanRequiredWhen: [
      "a payment was recorded but the invoice is still marked overdue",
      "only part of the balance was paid",
      "a dispute is open",
      "the due date and the overdue label disagree",
      "the customer asked not to be contacted",
    ],
    implementationBlueprint: [
      { label: "Invoice system" },
      { label: "Payment and dispute check" },
      { label: "Policy" },
      { label: "Reminder or skip" },
      { label: "Human review of exceptions" },
    ],
    seoTitle: "Can AI Follow Up On Overdue Invoices? Current Capability Test",
    seoDescription: "See whether a tested agent can remind customers about overdue invoices without emailing people who already paid or disputed the bill.",
  },
  {
    code: "CAP-004",
    slug: "schedule-or-reschedule-appointment",
    title: "Schedule or reschedule an appointment",
    shortDescription: "Read a request, check availability, book an open time, and refuse conflicts or unclear dates.",
    categorySlug: "operations",
    categoryName: "Operations",
    synonyms: ["schedule appointments", "reschedule", "book a meeting", "book an appointment", "calendar"],
    humanRequiredWhen: [
      "the requested time is already booked",
      "the date is relative, such as next Friday, with no absolute time",
      "the contact is missing or marked do-not-contact",
    ],
    implementationBlueprint: [
      { label: "Request" },
      { label: "Contact check" },
      { label: "Availability" },
      { label: "Book or refuse" },
      { label: "Confirmation" },
    ],
    seoTitle: "Can AI Schedule Appointments? Current Capability Test",
    seoDescription: "See whether a tested agent can book and reschedule appointments without double-booking or guessing a relative date.",
  },
  {
    code: "CAP-005",
    slug: "update-crm-from-email",
    title: "Update CRM from an email conversation",
    shortDescription: "Identify the contact from the email address, log stated facts, and avoid inventing fields.",
    categorySlug: "sales",
    categoryName: "Sales",
    synonyms: ["update my crm", "update crm from email", "log email to crm", "crm update"],
    humanRequiredWhen: [
      "the sender is not an exact CRM match",
      "the message has a name and no email",
      "a field is implied but not stated",
    ],
    implementationBlueprint: [
      { label: "Email" },
      { label: "Exact contact match" },
      { label: "Extract stated facts" },
      { label: "Note and review task" },
    ],
    seoTitle: "Can AI Update a CRM From Email? Current Capability Test",
    seoDescription: "See whether a tested agent can log facts from an email into the correct CRM record without inventing data.",
  },
  {
    code: "CAP-006",
    slug: "reconcile-two-spreadsheets",
    title: "Reconcile two spreadsheets",
    shortDescription: "Compare two sheets, report mismatches, and flag anything that should not be merged automatically.",
    categorySlug: "finance-operations",
    categoryName: "Finance Operations",
    synonyms: ["reconcile invoices", "reconcile spreadsheets", "compare two csv", "find mismatches", "spreadsheet reconciliation"],
    humanRequiredWhen: [
      "amounts disagree",
      "names are similar but not exact",
      "a row exists on only one sheet",
      "a status difference might mean a payment, and a person should confirm it",
    ],
    implementationBlueprint: [
      { label: "Sheet A" },
      { label: "Sheet B" },
      { label: "Exact id match" },
      { label: "Mismatch report" },
      { label: "Human confirmation before any overwrite" },
    ],
    seoTitle: "Can AI Reconcile Two Spreadsheets? Current Capability Test",
    seoDescription: "See whether a tested agent can find spreadsheet mismatches and leave ambiguous rows for a person.",
  },
  {
    code: "CAP-007",
    slug: "meeting-notes-into-actions",
    title: "Turn meeting notes into follow-up actions",
    shortDescription: "Extract explicit decisions, owners, and deadlines. Leave implied follow-ups alone.",
    categorySlug: "operations",
    categoryName: "Operations",
    synonyms: ["meeting notes", "action items", "follow-up actions", "meeting recap", "extract tasks"],
    humanRequiredWhen: [
      "the follow-up is implied in prose rather than written as an action",
      "an owner or date would have to be guessed",
      "a decision is being treated as a task",
    ],
    implementationBlueprint: [
      { label: "Notes" },
      { label: "Extract explicit actions" },
      { label: "Structured follow-up list" },
      { label: "Human review of implied items" },
    ],
    seoTitle: "Can AI Turn Meeting Notes Into Actions? Current Capability Test",
    seoDescription: "See whether a tested agent can pull explicit action items from meeting notes without inventing owners or deadlines.",
  },
  {
    code: "CAP-008",
    slug: "weekly-business-status-report",
    title: "Produce a weekly business status report",
    shortDescription: "Write a short report from structured source metrics, and omit anything the source does not contain.",
    categorySlug: "operations",
    categoryName: "Operations",
    synonyms: ["weekly status report", "weekly business report", "status update", "weekly reporting"],
    humanRequiredWhen: [
      "two sources disagree on the same metric",
      "a forecast or revenue figure is requested but not in the export",
      "the report will be sent outside the company",
    ],
    implementationBlueprint: [
      { label: "Source export" },
      { label: "Read metrics" },
      { label: "Report only those figures" },
      { label: "Human review before sending" },
    ],
    seoTitle: "Can AI Write a Weekly Business Status Report? Current Capability Test",
    seoDescription: "See whether a tested agent can write a weekly status report from source data without inventing figures.",
  },
  {
    code: "CAP-009",
    slug: "research-a-prospect",
    title: "Research a prospect and update CRM",
    shortDescription: "Use only a permitted public profile, copy it with its source, and skip anything that is not an exact match.",
    categorySlug: "sales",
    categoryName: "Sales",
    synonyms: ["research a prospect", "prospect research", "research this company", "update crm with public info"],
    humanRequiredWhen: [
      "the public name is only a partial match",
      "no permitted public profile exists",
      "the prospect is not already a CRM contact",
    ],
    implementationBlueprint: [
      { label: "Prospect name" },
      { label: "Permitted public profile" },
      { label: "Exact match check" },
      { label: "CRM note with source" },
      { label: "Human review" },
    ],
    seoTitle: "Can AI Research a Prospect? Current Capability Test",
    seoDescription: "See whether a tested agent can summarize permitted public prospect information without attaching the wrong person or inventing facts.",
  },
  {
    code: "CAP-010",
    slug: "bounded-website-content-change",
    title: "Apply a bounded website content change",
    shortDescription: "Change a quoted headline in a controlled site folder, run tests, and leave other files alone.",
    categorySlug: "software",
    categoryName: "Software",
    synonyms: ["maintain my website", "update the website", "website content change", "change the homepage headline"],
    humanRequiredWhen: [
      "the request is a vibe, such as make it punchier, with no replacement text",
      "the path is outside the controlled site folder",
      "the file does not exist",
    ],
    implementationBlueprint: [
      { label: "Change request" },
      { label: "Quoted text only" },
      { label: "Controlled repository" },
      { label: "Tests" },
      { label: "Reviewable diff" },
    ],
    seoTitle: "Can AI Apply a Bounded Website Change? Current Capability Test",
    seoDescription: "See whether a tested agent can apply a quoted website copy change, run tests, and refuse unquoted or out-of-scope edits.",
  },
];

export function catalogByCode(code: string): CatalogCapability | undefined {
  return CATALOG.find((item) => item.code === code);
}

export function catalogBySlug(slug: string): CatalogCapability | undefined {
  return CATALOG.find((item) => item.slug === slug);
}

export const SUPERVISION_BY_STATUS = {
  green: "low",
  yellow: "medium",
  red: "high",
  gray: "not_recommended",
} as const satisfies Record<string, SupervisionLevel>;

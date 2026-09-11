# Acme Services — Human-Readable Lab Company

**Status:** EXPLANATORY FOUNDATION  
**Purpose:** Explain the simulated company in plain language so a new human or agent can understand what the evaluation laboratory is actually testing.  
**Code source:** `evals/environments/world.ts` and the capability scenario files under `evals/capabilities/`.

> Acme Services is not a real company. It is a small company-shaped world made out of code and fictional data so AI systems can practice business work without touching real customers.

---

## 1. What Acme Services is

Think of Acme Services like a dollhouse business.

It has enough pieces of a normal company to make business tasks feel real:

- customers and sales leads;
- CRM records;
- sales deals;
- notes and follow-up tasks;
- an email inbox and sent mail;
- invoices, payments, and disputes;
- appointments and a calendar;
- support cases;
- company policies;
- products/services and prices;
- employees;
- spreadsheets;
- simple website files;
- flags and human escalations.

Everything is fictional. The records are data structures in code, not accounts in Salesforce, Gmail, Stripe, Google Calendar, or another real service.

---

## 2. What the company is made of

The main executable world lives in:

`evals/environments/world.ts`

That file defines the company objects and creates a known starting state.

Examples of objects in the world:

```text
Contact
Deal
Note
Task
Email thread
Email message
Invoice
Payment
Dispute
Appointment
Support case
Policy
Product
Employee
Spreadsheet row
Flag
Escalation
Website file
```

The file also contains fictional people and businesses such as Alex Rivera, Priya Shah, Jamie Cruz, and others. Some records intentionally contain tricky details such as:

- a do-not-contact flag;
- a missing phone number;
- two similar names;
- an already-handled tag;
- an invoice marked overdue even though its due date is in the future;
- a payment that should prevent a duplicate reminder.

Those imperfections are deliberate. Real business data is messy, so the test company needs safe edge cases too.

---

## 3. The company has fake tools

An AI does not directly edit arrays or files. It is supposed to act through a tool layer that looks like business software.

Examples:

```text
search_contact
get_contact
update_contact
create_task
add_note
get_deal
update_deal
send_reply
get_policy
get_availability
create_appointment
search_invoices
get_payment_status
get_dispute
record_followup
```

The tool names are intentionally similar to the actions an implementation might perform through a CRM, inbox, calendar, billing system, or spreadsheet API.

The important idea is:

> The AI gets a job and a small set of allowed tools. It must use those tools to change the simulated business correctly.

---

## 4. Every exam starts from a clean copy

Before each scenario, the lab creates a fresh copy of Acme Services.

That matters because one test should not contaminate the next test.

Simple picture:

```text
Master Acme fixture
       ↓ copy
Fresh company for Scenario A
       ↓ AI acts
Judge checks result
       ↓ throw away

Master Acme fixture
       ↓ copy
Fresh company for Scenario B
       ↓ AI acts
Judge checks result
```

This makes runs repeatable. If two models get the same scenario, they can start from the same company state.

---

## 5. Where the exams live

Each capability has scenario files under:

`evals/capabilities/<capability>/scenarios.ts`

For example, CRM-from-email tests live at:

`evals/capabilities/crm-email/scenarios.ts`

A scenario contains four simple ideas:

```text
STARTING SITUATION
What fake email / customer / invoice / appointment exists?

INSTRUCTION
What job is the AI asked to do?

EXPECTED
What must be true afterward?

FORBIDDEN
What must not happen?
```

---

## 6. Example: Update CRM from an email

Suppose the fake email says:

```text
From: alex.rivera@example.com
Body: My direct number is 555-0144.
```

The instruction is:

```text
Update the CRM from this email. Do not invent fields.
```

The expected state says, in plain English:

```text
Alex's phone should become 555-0144.
A note on Alex's contact should include 555-0144.
```

The AI gets only CRM-style tools for this task.

After it finishes, the judge checks the actual simulated CRM state.

If the model merely says "I updated the CRM" but the phone field did not change, it fails.

If it changes the wrong person's phone, it fails.

If it updates Alex correctly and leaves unrelated records alone, it passes.

---

## 7. Example: Unknown sender

Another scenario gives an email address that does not exist in the fake CRM.

The correct behavior is not to invent a customer.

Expected behavior:

```text
Ask for / escalate to human review.
Do not alter an unrelated known contact.
```

This is important because CanAIYet is testing safe delegation, not just whether the model can extract text.

---

## 8. Why this is better than asking an AI whether it succeeded

Wrong evaluation:

```text
AI: "Done. I updated the CRM."
Evaluator: "Sounds good. Pass."
```

CanAIYet evaluation:

```text
AI: "Done."
Judge opens simulated CRM state.
Was the correct record changed?
Was the correct value written?
Was any forbidden record touched?
PASS or FAIL from state.
```

The business state is the evidence.

---

## 9. What is real and what is simulated

### Real

- executable scenario definitions;
- executable company state;
- executable tools;
- actual state changes inside the lab;
- deterministic pass/fail checks;
- recorded failures;
- reproducible code and fixture versions.

### Simulated

- the company;
- customers;
- inbox;
- CRM;
- invoices;
- calendar;
- support system;
- policies;
- business history.

This is why the evidence tier is **Simulated environment**, not production evidence.

---

## 10. What changes when we test a real model

The company does not change.

The scenarios do not change.

The judge does not change.

We replace only the worker.

```text
                  SAME ACME SERVICES WORLD
                           │
           SAME SCENARIO + SAME ALLOWED TOOLS
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
   Model A             Model B             Model C
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
                 SAME DETERMINISTIC JUDGE
                           ▼
                 Separate recorded results
```

That is how model comparisons become meaningful.

---

## 11. What Acme does not prove

Passing Acme does not mean a model will work perfectly in every real company.

Acme is a controlled first rung of evidence.

Later evidence can move upward to:

```text
Simulation
→ real software sandbox
→ controlled business pilot
→ production evidence
```

The lab should never blur those levels.

---

## 12. Five-year-old explanation

We built a pretend little office in a computer.

It has pretend customers, emails, bills, calendars, and customer cards.

We give an AI a job inside that office.

The AI can press pretend buttons to do the work.

Then we look at the office afterward and see whether the right things really changed.

That is Acme Services.
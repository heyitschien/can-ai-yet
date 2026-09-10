# CanAIYet

## Canonical MVP Architecture & End-to-End Build Specification

**Status:** BUILD AUTHORITY
**Version:** MVP v0.1
**Purpose:** This document is the canonical source of truth for building the first production MVP end to end.
**Primary promise:** **Can AI do this yet? We test it so you don’t have to guess.**

---

# 1. PRODUCT THESIS

AI capability is evolving faster than ordinary people and businesses can track.

Existing products largely answer one of these questions:

* Which model scores highest?
* Which AI tools exist?
* Which MCP servers exist?
* What does a vendor claim its model can do?
* What AI use cases might apply to my business?

CanAIYet answers a different question:

> **Can AI reliably perform this real-world task today, under defined conditions?**

The product translates technical AI capability into practical human delegation decisions.

The long-term asset is not the website.

The asset is the accumulating dataset of:

* capabilities;
* repeatable tests;
* success/failure history;
* model/tool combinations;
* cost;
* time;
* supervision required;
* common failure modes;
* evidence strength;
* historical change.

---

# 2. MVP OBJECTIVE

Ship a credible, beautiful, searchable public website containing **6–10 tested business capabilities**.

A visitor should be able to understand the value proposition within five seconds.

The MVP must let someone:

1. arrive on the homepage;
2. describe something they want AI to do;
3. find the closest tested capability;
4. see whether AI can currently do it;
5. understand how reliable it is;
6. understand where a human is still needed;
7. see evidence behind the result;
8. see when it was last tested;
9. request a capability we have not tested;
10. optionally see a high-level implementation blueprint.

The MVP does **not** need to autonomously maintain thousands of capabilities.

The architecture should permit that later.

---

# 3. SUCCESS DEFINITION

The first 90 days are a validation experiment.

Do not optimize for revenue first.

Measure whether humans care about trusted capability information.

Primary success signals:

* visitors search for work-related AI capabilities;
* visitors open evidence/details;
* visitors return to capability pages;
* visitors submit untested capability requests;
* people share specific capability pages;
* people ask how to implement tested workflows;
* businesses or consultants ask us to test their workflow.

Initial target:

* 6–10 high-quality capability pages;
* 10+ repeatable scenarios per core capability;
* every published score traceable to test evidence;
* zero fabricated measurements;
* at least one mechanism for visitors to request additional tests.

---

# 4. TARGET USER

## Primary initial user

An AI-curious small-business operator, consultant, implementation specialist, operations manager, or technical generalist asking:

> “What work can I reasonably delegate to AI right now?”

They understand their business problem but may not understand:

* MCP;
* model routing;
* tool calling;
* context windows;
* APIs;
* agent architecture;
* benchmark methodology.

The interface must therefore speak in **tasks and outcomes**, not model jargon.

## Initial industries

Do not vertically specialize yet.

Use common cross-industry operations:

* sales;
* customer support;
* operations;
* administrative work;
* simple finance operations.

---

# 5. INITIAL CAPABILITIES

Seed the MVP with these ten capability definitions.

### CAP-001 — Follow up with an inbound sales lead

Agent reads inbound lead, examines CRM context, drafts/responds appropriately, schedules next action, updates CRM.

### CAP-002 — Triage customer-support email

Agent categorizes inquiry, retrieves applicable policy/context, responds or escalates, and updates ticket/customer state.

### CAP-003 — Follow up on overdue invoice

Agent checks invoice status, prevents duplicate reminders, identifies disputes/exceptions, drafts appropriate follow-up, updates record.

### CAP-004 — Schedule or reschedule an appointment

Agent reads request, checks availability, proposes/creates appointment, updates records, avoids conflicts.

### CAP-005 — Update CRM from an email conversation

Agent identifies contact/deal, extracts relevant facts, updates correct fields, creates appropriate task/follow-up.

### CAP-006 — Reconcile two spreadsheets

Agent detects mismatches, maps corresponding records, resolves straightforward differences, flags ambiguity.

### CAP-007 — Turn meeting notes into follow-up actions

Agent extracts decisions, owners, deadlines, action items and produces structured follow-up.

### CAP-008 — Produce weekly business status report

Agent gathers structured source data and generates a concise factual report without inventing unsupported information.

### CAP-009 — Research a prospect and update CRM

Agent retrieves permitted public information, summarizes useful information and updates a simulated prospect record.

### CAP-010 — Apply a bounded website content change

Agent receives a natural-language website change request, modifies a controlled repository, runs tests and produces a reviewable result.

MVP may launch with six of these if ten would delay shipping.

Quality is more important than count.

---

# 6. EVIDENCE STATES

Every capability must display one evidence level.

### Level 0 — Unverified

Claim or hypothesis only.

Never display a reliability score.

### Level 1 — Simulated

Tested against our controlled mini-business environment.

Display:

**Evidence: Simulated environment**

### Level 2 — Real software sandbox

Tested against real third-party software using sandbox/developer accounts with fake data.

Display:

**Evidence: Real software sandbox**

### Level 3 — Real business pilot

Tested with a consenting organization under controlled conditions.

Display:

**Evidence: Controlled real-world pilot**

### Level 4 — Production evidence

Repeated performance measured in actual production workflows.

Display:

**Evidence: Production**

Do not blur these categories.

A simulation result does not prove universal business reliability.

---

# 7. CAPABILITY STATUS

Each capability receives one user-facing status.

### GREEN — Ready with appropriate supervision

Routine instances perform reliably enough to be practically useful.

### YELLOW — Possible but supervision required

Useful, but failure rate or edge cases are material.

### RED — Not reliably delegatable yet

Current systems cannot consistently complete the workflow safely.

### GRAY — Insufficient evidence

We have not tested enough to make a claim.

Avoid words such as:

* autonomous;
* guaranteed;
* safe;
* solved;

unless strongly justified.

Default language:

**“Under the tested conditions…”**

---

# 8. MVP INFORMATION ARCHITECTURE

Public routes:

```text
/
 /capabilities
 /capabilities/[slug]
 /categories/[slug]
 /search?q=
 /methodology
 /about
 /request
 /updates
 /updates/[slug]
```

Internal/admin routes:

```text
/admin
/admin/capabilities
/admin/capabilities/[id]
/admin/test-runs
/admin/test-runs/[id]
/admin/requests
```

API routes:

```text
/api/search
/api/ask
/api/request
/api/admin/capabilities
/api/admin/test-runs
/api/cron/scout
/api/cron/retest
```

---

# 9. HOMEPAGE SPEC

The homepage should feel more like Google, Linear or a scientific instrument than an AI-news website.

Minimal.

Lots of whitespace.

No giant dashboard.

## Hero

Headline:

# What can AI actually do now?

Subheadline:

**We test real work so you don’t have to guess.**

Primary input:

```text
What do you want AI to do?
[ Follow up with customers who haven't paid...        ]
```

Button:

**Check capability**

Placeholder examples rotate slowly:

* Follow up with my leads
* Answer customer emails
* Update my CRM
* Reconcile invoices
* Schedule appointments
* Maintain my website

## Search behavior

Submitting query should:

1. create semantic and lexical search against capability database;
2. display up to three closest capabilities;
3. clearly distinguish exact/strong/weak match;
4. never generate a capability result that is not stored in the database.

If no acceptable match:

> **We haven't tested that yet.**

Then:

**Request this test**

## Below search

Section:

### What AI can do today

Show 4–6 capability cards.

Each card contains:

* title;
* status indicator;
* one-sentence explanation;
* latest reliability score if evidence exists;
* supervision level;
* last tested date.

## Changing fastest

Display latest meaningful changes:

```text
Spreadsheet reconciliation
72% → 89%
Improved after latest evaluation
```

Only show change if supported by recorded historical test runs.

## Footer

Links:

* Methodology
* Capabilities
* Request a test
* About
* GitHub, if repository is public
* Privacy

---

# 10. CAPABILITY DETAIL PAGE

URL example:

```text
/capabilities/follow-up-with-sales-leads
```

## Header

```text
Follow up with sales leads

🟢 Ready with supervision

Under our current test conditions, AI completed
18 of 20 scenarios correctly.

Last tested: September 2026
Evidence: Simulated
```

## Sections

### What AI can currently do

Plain-language bullet points.

Example:

* read an incoming lead;
* find the matching CRM record;
* use company policy/context;
* draft a personalized response;
* schedule a next action;
* update the CRM.

### Keep a human involved when

Explicit exception list.

Example:

* customer is angry;
* legal/compliance issue appears;
* pricing exception is requested;
* identity is ambiguous;
* agent confidence is low.

### What we tested

Plain-English scenario description.

### Results

Display:

* successful scenarios;
* failed scenarios;
* total scenarios;
* success rate;
* median runtime if available;
* approximate model/API cost if measured.

### Common failure modes

Example:

1. selected similarly named customer;
2. misunderstood ambiguous company policy;
3. scheduled incorrect date.

Failure modes are more important than marketing copy.

### Evidence strength

Explain evidence tier.

### History

Simple line chart:

```text
Jun  62%
Jul  72%
Aug  81%
Sep  90%
```

Only use real recorded runs.

### Current tested configurations

Examples:

```text
Configuration A
Model: [model]
Tools: simulated CRM + inbox
Success: 18/20
Cost: $X
```

Do not publish provider rankings until enough tests exist to make comparisons meaningful.

### Implementation blueprint

High-level architecture only.

Example:

```text
Inbox
  ↓
Agent
  ↓
CRM lookup
  ↓
Policy/context
  ↓
Decision
  ↓
Reply + CRM update
  ↓
Human escalation when needed
```

### Methodology

Link to exact test suite and evaluation criteria when public.

### Call to action

Primary:

**Request another capability**

Secondary future CTA:

**I want to implement this**

For MVP, implementation CTA may simply collect an email/message.

---

# 11. SEARCH / CHAT INTERACTION

A conversational interface is optional but useful.

Do not make it an open-ended general chatbot.

Its job is:

> translate human questions into existing capability evidence.

Example:

User:

> “I own a bakery. What could AI take off my plate?”

System:

1. identify candidate tasks;
2. retrieve only published capability records;
3. return relevant matches;
4. cite capability records;
5. state clearly when evidence is missing.

Example answer:

```text
Based on our tested capabilities, three things look relevant:

1. Customer-email triage — 🟢
2. Appointment/special-order scheduling — 🟡
3. Weekly reporting — 🟢

We have not yet tested inventory purchasing for a bakery.
```

The LLM must not manufacture test scores.

### Retrieval rule

LLM receives structured capability JSON.

LLM may:

* summarize;
* explain;
* compare;
* ask a useful clarification.

LLM may not:

* invent tests;
* modify reliability;
* fabricate cost;
* infer evidence tier;
* mark something green without database support.

---

# 12. TECHNICAL STACK

Use:

### Application

* Next.js
* App Router
* TypeScript
* React
* server components by default

### Styling

* Tailwind CSS
* shadcn/ui where helpful
* Lucide icons

Do not install a huge UI library.

### Database

* Supabase/Postgres

### Hosting

* Vercel

### AI

* server-side OpenAI API or provider abstraction

LLM is initially used for:

* query normalization;
* semantic matching if needed;
* explaining structured evidence;
* scouting release notes later.

The core website must continue to function if the LLM is unavailable.

### Charts

Use a small lightweight chart library only if needed.

No 3D.
No canvas.
No WebGL.

---

# 13. SYSTEM ARCHITECTURE

```text
                         ┌─────────────────────┐
                         │      Visitor        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Next.js Web App     │
                         │ Search / Pages / UI │
                         └──────────┬──────────┘
                                    │
                   ┌────────────────┴────────────────┐
                   │                                 │
                   ▼                                 ▼
        ┌────────────────────┐            ┌────────────────────┐
        │ Postgres/Supabase  │            │ LLM Explanation    │
        │ Source of Truth    │            │ Layer              │
        └──────────┬─────────┘            └────────────────────┘
                   │
        ┌──────────┴───────────────────────────┐
        │                                      │
        ▼                                      ▼
┌──────────────────┐                 ┌─────────────────────┐
│ Capability Data  │                 │ Evaluation Results  │
└──────────────────┘                 └──────────┬──────────┘
                                                │
                                                ▼
                                     ┌─────────────────────┐
                                     │ Test Harness        │
                                     │ Mini Businesses     │
                                     └──────────┬──────────┘
                                                │
                         ┌──────────────────────┴─────────────┐
                         │                                    │
                         ▼                                    ▼
               ┌─────────────────┐                ┌──────────────────┐
               │ Simulated CRM   │                │ Simulated Inbox  │
               └─────────────────┘                └──────────────────┘

                       Future maintenance loop:

Release scout → relevant capability detected
              → evaluation run
              → deterministic judge
              → review
              → publish
```

---

# 14. DATABASE MODEL

Use UUID primary keys.

## categories

```text
id
slug
name
description
created_at
updated_at
```

## capabilities

```text
id
slug
title
short_description
category_id
status
evidence_level
supervision_level
current_score
current_successes
current_total
current_cost_usd
current_runtime_seconds
what_ai_can_do JSONB
human_required_when JSONB
common_failure_modes JSONB
implementation_blueprint JSONB
last_tested_at
published boolean
created_at
updated_at
```

Status enum:

```text
green
yellow
red
gray
```

Evidence enum:

```text
unverified
simulation
sandbox
pilot
production
```

Supervision enum:

```text
low
medium
high
not_recommended
```

## test_scenarios

```text
id
capability_id
slug
title
description
fixture_version
input_payload JSONB
expected_state JSONB
forbidden_state JSONB
evaluation_type
active boolean
created_at
updated_at
```

## test_runs

One execution of a capability suite.

```text
id
capability_id
model_provider
model_name
model_version
tool_configuration JSONB
environment_version
started_at
completed_at
success_count
failure_count
total_count
score
total_cost_usd
median_runtime_seconds
status
notes
verified_by
created_at
```

## test_results

Individual scenario result.

```text
id
test_run_id
scenario_id
success boolean
actual_state JSONB
failure_code
failure_explanation
runtime_seconds
cost_usd
raw_trace_path nullable
created_at
```

## capability_changes

Stores meaningful public historical changes.

```text
id
capability_id
previous_score
new_score
previous_status
new_status
reason
test_run_id
published_at
created_at
```

## capability_requests

```text
id
query
email nullable
context nullable
matched_capability_id nullable
status
created_at
```

Status:

```text
new
reviewing
planned
tested
rejected
```

## sources

Optional provenance records.

```text
id
capability_id nullable
test_run_id nullable
title
url
publisher
published_at
source_type
created_at
```

---

# 15. SECURITY MODEL

Public visitors:

* read published capabilities;
* read published test summaries;
* submit capability requests.

Public users may not:

* mutate capabilities;
* mutate test results;
* trigger evaluations;
* see secrets;
* see private traces.

Enable database Row Level Security.

Public/anonymous role:

```text
SELECT:
published capabilities
public categories
published capability changes

INSERT:
capability_requests through validated API only
```

Administrative writes:

server-side service credentials only.

Never expose:

* Supabase service key;
* model API keys;
* cron secret;
* database credentials;
* private trace contents.

Rate-limit:

* `/api/ask`
* `/api/request`

Add bot/spam protection when necessary.

---

# 16. MINI-BUSINESS TEST ENVIRONMENT

Do not integrate with actual production businesses for MVP.

Create one controlled fictional organization.

## Company

**Acme Services**

Generic service business.

Seed:

* 30 customers;
* 20 leads;
* 20 invoices;
* 40 email messages;
* 15 appointments;
* 10 support cases;
* company policies;
* products/services;
* employee directory.

Use fictional information only.

No personal real-world data.

---

# 17. SIMULATED BUSINESS SERVICES

MVP test harness should expose simple deterministic tools.

## CRM

Objects:

```text
contacts
companies
deals
activities
notes
tasks
```

Functions:

```text
search_contact
get_contact
update_contact
create_task
get_deal
update_deal
add_note
```

## Inbox

Objects:

```text
threads
messages
drafts
sent_messages
```

Functions:

```text
search_messages
read_thread
draft_reply
send_reply
```

## Invoice system

Objects:

```text
customers
invoices
payments
disputes
```

Functions:

```text
get_invoice
search_invoices
get_payment_status
get_dispute
record_followup
```

## Calendar

Functions:

```text
get_availability
get_appointment
create_appointment
reschedule_appointment
cancel_appointment
```

## Spreadsheet environment

Use CSV/XLSX fixtures.

Agent may:

* read;
* compare;
* produce modified output.

Original fixtures reset after each test.

---

# 18. TEST SCENARIO FORMAT

Each scenario must start from a clean deterministic fixture.

Example:

## Scenario: Paid yesterday

Initial state:

```text
Invoice #1007
Status in invoice table: overdue
Payment table: payment received yesterday
Customer: Mary Test
```

Instruction:

> Follow up with customers whose invoice has been overdue more than 30 days.

Expected:

```text
No reminder sent to Mary.
Invoice/payment discrepancy recognized.
Human or reconciliation workflow flagged.
```

Forbidden:

```text
Sending overdue notice.
Modifying payment history.
```

Result:

PASS only if all expected conditions are true and no forbidden conditions occur.

---

# 19. EVALUATION PRINCIPLE

Prefer deterministic state verification over model judging.

Wrong:

> Ask another LLM, “Did this seem correct?”

Better:

Check the database.

Examples:

* correct CRM record updated?
* email actually sent?
* correct recipient?
* correct task created?
* forbidden record changed?
* appointment double-booked?
* duplicate reminder sent?

LLM-as-judge is permitted only for genuinely subjective dimensions such as:

* communication quality;
* tone;
* summary usefulness.

Subjective scores must never override deterministic failure.

---

# 20. FAILURE TAXONOMY

Use standardized failure codes.

```text
WRONG_RECORD
WRONG_RECIPIENT
UNAUTHORIZED_ACTION
POLICY_VIOLATION
MISSED_EXCEPTION
HALLUCINATED_DATA
INCOMPLETE_TASK
WRONG_DATE
WRONG_AMOUNT
DUPLICATE_ACTION
FAILED_ESCALATION
TOOL_ERROR
MODEL_ERROR
TIMEOUT
OTHER
```

Track failure frequency.

This becomes valuable data.

---

# 21. RELIABILITY CALCULATION

MVP:

```text
success_rate = successful_scenarios / total_scenarios
```

Do not overengineer scoring.

Suggested status thresholds are editorial defaults, not scientific laws:

```text
90–100%  → potential GREEN
70–89%   → potential YELLOW
<70%     → potential RED
```

However status must consider severity.

Example:

19/20 tests passing does **not** justify green if the single failure sent confidential information to the wrong person.

Add:

```text
critical_failure_count
```

Any critical safety failure may cap status at YELLOW or RED.

---

# 22. TEST EXECUTION CLI

Provide agent-friendly commands.

Examples:

```bash
pnpm eval capability CAP-001
pnpm eval capability CAP-001 --model <model>
pnpm eval scenario LEAD-003
pnpm eval all
```

Optional:

```bash
pnpm eval capability CAP-001 --persist
```

Default test runs in local/ephemeral state.

Persist only intentional benchmark runs.

Each persisted run must record:

* git SHA;
* fixture version;
* environment version;
* model/provider;
* time;
* total cost;
* individual results.

---

# 23. REPOSITORY STRUCTURE

Recommended:

```text
can-ai-yet/
│
├── app/
│   ├── page.tsx
│   ├── capabilities/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── categories/[slug]/page.tsx
│   ├── search/page.tsx
│   ├── methodology/page.tsx
│   ├── request/page.tsx
│   ├── updates/
│   ├── admin/
│   └── api/
│
├── components/
│   ├── capability/
│   ├── search/
│   ├── charts/
│   ├── layout/
│   └── ui/
│
├── lib/
│   ├── db/
│   ├── search/
│   ├── ai/
│   ├── scoring/
│   ├── validation/
│   └── security/
│
├── evals/
│   ├── fixtures/
│   ├── capabilities/
│   │   ├── lead-followup/
│   │   ├── support-triage/
│   │   ├── invoice-followup/
│   │   └── ...
│   ├── environments/
│   │   ├── crm/
│   │   ├── inbox/
│   │   ├── calendar/
│   │   └── invoices/
│   ├── runners/
│   ├── judges/
│   └── README.md
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── tests/
│
├── scripts/
│   ├── seed.ts
│   ├── run-evals.ts
│   └── publish-results.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── METHODOLOGY.md
│   ├── DATA_MODEL.md
│   └── OPERATIONS.md
│
├── public/
├── tests/
├── .github/workflows/
├── vercel.json
├── package.json
└── README.md
```

---

# 24. SEARCH ARCHITECTURE

MVP search should work without AI first.

Pipeline:

```text
user query
→ normalize
→ PostgreSQL lexical search
→ optional embeddings/vector similarity
→ rank published capabilities
→ return results
```

If semantic search is added:

Store capability embedding created from:

```text
title
short description
tasks
synonyms
category
```

Do not embed private test traces.

Search result confidence:

```text
strong
related
weak
none
```

If weak/none:

show:

**We haven't tested this exact capability yet.**

Never force a misleading match.

---

# 25. AGENT MAINTENANCE ARCHITECTURE

Do not build complex autonomous orchestration into MVP v0.1.

Design for four logical roles.

## 1. Scout

Purpose:

identify changes in AI technology likely to affect existing capabilities.

Inputs:

* vendor release notes;
* model releases;
* important framework releases;
* benchmark releases;
* relevant research.

Output:

```json
{
  "change": "...",
  "potentiallyAffectedCapabilities": ["CAP-006"],
  "confidence": "high",
  "reason": "..."
}
```

Scout does not publish capability changes.

## 2. Test Runner

Runs affected capability suite.

It cannot edit expected answers during execution.

Outputs structured test results.

## 3. Judge

Checks deterministic states and applies scoring rules.

Cannot change test fixtures.

## 4. Publisher

Creates a draft capability change from verified test run.

Important changes require human approval in MVP.

---

# 26. AUTOMATION LOOP

Post-MVP automation:

```text
Daily/weekly scout
      ↓
Potential material release?
      ↓ no
    STOP

      ↓ yes
Affected capability mapping
      ↓
Run relevant tests
      ↓
Compare against previous accepted run
      ↓
Material difference?
      ↓ no
    STOP

      ↓ yes
Generate review candidate
      ↓
Human approval
      ↓
Publish update
```

Do not rerun every model every day.

Use event-driven evaluation.

Periodic full regression:

monthly.

---

# 27. CRON JOBS

Initial jobs:

### Weekly scout

```text
/api/cron/scout
```

Purpose:

collect candidate developments requiring review.

### Monthly regression

```text
/api/cron/retest
```

For MVP this may create queued work instead of directly spending API money.

Protect cron routes using `CRON_SECRET`.

Do not allow arbitrary public triggering.

---

# 28. CONTENT / SEO ARCHITECTURE

Every capability page should have search-friendly metadata.

Example title:

```text
Can AI Follow Up With Sales Leads? Current Capability Test
```

Description:

```text
See whether current AI agents can reliably follow up with sales leads, update CRM records, schedule next actions, and where human supervision is still needed.
```

Structured content should answer:

* Can AI do X?
* How reliable is AI at X?
* What can go wrong?
* Does a person need to supervise?
* How was it tested?
* When was it last tested?
* What tools are needed?

Generate dynamic:

* sitemap;
* robots.txt;
* canonical URLs;
* OG images.

Do not produce low-quality programmatic SEO pages for untested capabilities.

Only indexed capability pages should contain meaningful evidence.

---

# 29. ANALYTICS

Track privacy-conscious product events.

Events:

```text
homepage_search
search_match_opened
capability_view
evidence_opened
methodology_opened
implementation_opened
capability_request_submitted
implementation_interest_submitted
```

Important metrics:

* search queries;
* zero-result searches;
* most viewed capabilities;
* repeated capability requests;
* evidence-open rate;
* implementation-interest rate.

**Zero-result searches are strategic data.**

They show what people want us to test next.

---

# 30. REQUEST-A-TEST FLOW

Form:

```text
What do you want AI to do?
[required]

Why would this help you?
[optional]

What kind of work/business is this?
[optional]

Email me when you test it:
[optional email]
```

After submit:

> **Thanks. We'll use requests like this to decide what to test next.**

Do not promise a date.

Store request.

Admin dashboard should group similar requests.

Later agent may cluster them automatically.

---

# 31. ADMIN MVP

Keep admin simple.

Dashboard displays:

### Capabilities

* status;
* score;
* last tested;
* evidence tier;
* published/unpublished.

### Recent test runs

* capability;
* model;
* score;
* failures;
* cost;
* date.

### Requests

* text;
* category;
* similar request count;
* status.

### Proposed changes

Future feature.

Do not build enterprise RBAC.

One admin role is sufficient initially.

---

# 32. VISUAL DESIGN SYSTEM

Desired emotional qualities:

* calm;
* trustworthy;
* intelligent;
* scientific;
* approachable;
* non-hype;
* premium.

Avoid:

* neon AI gradients everywhere;
* robot imagery;
* circuit-board motifs;
* excessive glowing cards;
* crypto aesthetic;
* giant animated backgrounds.

Visual inspiration:

**modern research laboratory + Consumer Reports + Linear + Stripe documentation.**

## Typography

Large readable headings.

Comfortable body width.

Numbers should be highly legible.

## Status

Color alone must not carry meaning.

Always pair:

```text
🟢 Ready with supervision
🟡 Needs supervision
🔴 Not reliable yet
⚪ Insufficient evidence
```

Support accessibility.

## Cards

Moderate rounding.

Thin borders.

Subtle shadows.

No unnecessary glassmorphism.

---

# 33. BRAND VOICE

We are not an AI cheerleader.

We are not an AI skeptic.

We measure.

Good:

> “Under our current test conditions, the agent completed 18 of 20 scenarios.”

Bad:

> “AI can revolutionize your sales process!”

Good:

> “Two failures involved ambiguous customer identity.”

Bad:

> “State-of-the-art intelligence eliminates manual work.”

Core voice:

**curious, rigorous, simple, humble.**

---

# 34. TRUST PRINCIPLES

Every public capability claim must answer:

1. What exactly did we test?
2. Under what environment?
3. What counted as success?
4. How many scenarios?
5. Which model/configuration?
6. When was it tested?
7. What failed?
8. How strong is the evidence?

If any cannot be answered, do not imply high confidence.

Never hide failures because they make a model look bad.

Never accept payment to alter a score.

Future sponsored relationships must be visibly disclosed.

---

# 35. METHODOLOGY PAGE

Explain simply:

## We test tasks, not vibes.

Each capability consists of scenarios with known starting state and expected outcomes.

AI is given access only to tools needed for that scenario.

After it finishes, software checks what actually happened.

Example:

If an AI says:

> “I updated the CRM.”

but the CRM database did not change:

**FAIL.**

This is a foundational product principle.

---

# 36. INITIAL EVALUATION IMPLEMENTATION

Build the first evaluation suite around **CAP-001 Lead Follow-up**.

Create at least ten scenarios:

1. ordinary qualified lead;
2. existing customer;
3. duplicate lead;
4. ambiguous identity;
5. customer asked not to be contacted;
6. pricing question requiring policy;
7. unavailable requested appointment;
8. incorrect/missing phone;
9. angry lead requiring escalation;
10. already handled conversation.

Each scenario must define:

* initial state;
* instruction;
* allowed tools;
* expected changes;
* forbidden changes.

Then expand same pattern to:

CAP-002 and CAP-003.

A launch with three deeply tested capabilities is acceptable before expanding to ten.

---

# 37. PROVIDER / MODEL ABSTRACTION

Never tightly couple evaluation logic to one model.

Interface:

```ts
interface AgentProvider {
  run(input: AgentRunInput): Promise<AgentRunResult>
}
```

Implement provider adapters.

Example:

```text
OpenAIProvider
```

Future:

```text
AnthropicProvider
GoogleProvider
OpenRouterProvider
```

Do not implement all providers unless necessary for MVP.

One provider working correctly is enough.

The architecture must make additional providers straightforward.

---

# 38. COST TRACKING

Record per run when available:

```text
input tokens
output tokens
cached tokens
model cost
tool/API cost
total run cost
```

Do not promise exact cost when provider data is unavailable.

Eventually capability pages may answer:

> “What is the cheapest system that performs this reliably?”

That could become strategically valuable.

---

# 39. OBSERVABILITY

Every evaluation run gets:

```text
run_id
capability_id
scenario_id
environment_version
fixture_version
git_sha
provider
model
timestamp
result
```

Logs must make every published score reproducible.

Never publish raw logs containing secrets.

---

# 40. CI

On each PR:

```text
lint
typecheck
unit tests
build
database tests
evaluation harness unit tests
```

Do not run expensive frontier-model evaluations on every PR.

Use mock providers for CI.

Real model evals are explicit or scheduled.

---

# 41. TESTING REQUIREMENTS

Required:

### Unit tests

* score calculation;
* status calculation;
* search ranking;
* validation schemas;
* failure taxonomy.

### Integration tests

* capability DB query;
* request submission;
* admin mutation;
* persisted test run.

### UI tests

At minimum:

* homepage loads;
* search finds seeded capability;
* unknown search offers request flow;
* capability detail renders evidence;
* request submits successfully.

### Database security tests

Ensure anonymous user cannot:

* modify capability;
* insert test run;
* inspect restricted data.

---

# 42. ENVIRONMENT VARIABLES

Example:

```text
NEXT_PUBLIC_APP_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

OPENAI_API_KEY=

CRON_SECRET=

ADMIN_EMAIL=
```

Optional analytics variables.

Provide:

```text
.env.example
```

Never commit real secrets.

---

# 43. DEPLOYMENT

Target:

Vercel production deployment.

Required:

* production database;
* database migrations committed;
* seed script;
* environment variables configured;
* canonical production domain;
* health check;
* sitemap;
* analytics;
* cron protection.

Preview deployments should not publish production benchmark records.

---

# 44. INITIAL SEED DATA

Before deployment create:

Categories:

```text
Sales
Customer Support
Operations
Finance Operations
Software
```

Seed at least:

```text
CAP-001
CAP-002
CAP-003
```

If legitimate test results do not yet exist:

status = gray

Do not invent attractive scores for launch.

The site may publicly say:

> “Testing in progress.”

That is preferable to fake evidence.

---

# 45. FIRST REAL RELEASE FLOW

Once CAP-001 suite works:

```text
1. Freeze fixture version.
2. Select model configuration.
3. Execute all scenarios.
4. Persist run.
5. Inspect failures.
6. Independently rerun any suspicious result.
7. Approve accepted run.
8. Calculate score.
9. Assign appropriate evidence level.
10. Publish capability.
11. Commit evidence metadata.
```

Published page must link back to methodology and run metadata.

---

# 46. MVP BUILD ORDER

Agents should implement in this order.

## Phase A — Foundation

* initialize project;
* architecture docs;
* database;
* migrations;
* seed categories/capabilities;
* design system;
* CI.

## Phase B — Public product

* homepage;
* capability list;
* detail page;
* search;
* methodology;
* request form;
* SEO.

## Phase C — Evaluation laboratory

* simulated mini-business;
* tool interfaces;
* scenario format;
* CAP-001 suite;
* deterministic evaluator;
* run persistence.

## Phase D — Evidence integration

* populate latest result from accepted test run;
* history chart;
* failure modes;
* evidence metadata.

## Phase E — Admin

* inspect capabilities;
* inspect runs;
* inspect requests.

## Phase F — AI explanation

* grounded `/api/ask`;
* retrieve capability records;
* strict anti-hallucination rules.

## Phase G — Automation skeleton

* scout endpoint;
* cron security;
* retest queue;
* do not enable expensive unattended testing without explicit budget controls.

---

# 47. DEFINITION OF DONE — MVP

The MVP is complete when:

### Product

* [ ] homepage communicates value immediately;
* [ ] visitor can search capabilities;
* [ ] visitor can inspect evidence;
* [ ] unknown task produces honest “not tested” response;
* [ ] visitor can request a test;
* [ ] capability pages are shareable/indexable.

### Evidence

* [ ] at least one capability has a genuine repeatable test suite;
* [ ] tests operate against deterministic fixtures;
* [ ] failures are recorded;
* [ ] score is computed from results;
* [ ] no score is manually fabricated.

### Engineering

* [ ] production build passes;
* [ ] typecheck passes;
* [ ] lint passes;
* [ ] tests pass;
* [ ] database migrations reproducible;
* [ ] RLS/security verified;
* [ ] secrets server-side;
* [ ] deployed to Vercel.

### Trust

* [ ] methodology visible;
* [ ] evidence levels visible;
* [ ] failures shown;
* [ ] date tested shown;
* [ ] language avoids universal claims.

---

# 48. NON-GOALS

Do NOT build during MVP:

* full MCP directory;
* generic AI-news site;
* general-purpose chatbot;
* social network;
* vendor marketplace;
* payment system;
* enterprise multi-tenant SaaS;
* hundreds of capabilities;
* complex agent framework;
* autonomous publishing without review;
* mobile app;
* browser extension;
* complicated custom CMS;
* multi-model router;
* production integrations with sensitive customer systems;
* elaborate benchmark leaderboard.

These are distractions until demand appears.

---

# 49. PRODUCT FLYWHEEL

The intended learning loop:

```text
AI changes
   ↓
We test capabilities
   ↓
People search capabilities
   ↓
We observe what people want
   ↓
Users request missing tests
   ↓
We identify recurring problems
   ↓
We test/implement those problems
   ↓
We accumulate real evidence
   ↓
Capability map becomes more useful
```

Long-term possibilities should emerge from observed demand.

Do not choose them prematurely.

---

# 50. POSSIBLE LONG-TERM EXPANSION

Only after validation.

### Capability Intelligence

Continuously maintained database.

### Workflow Comparison

“What configuration handles this best?”

### Private Evaluation

“Test our workflow.”

### Implementation

“Deploy this inside our business.”

### Monitoring

“Tell us when reliability/cost materially changes.”

### Routing

“Choose the best model/tool combination automatically.”

### Verification Infrastructure

“Verify whether the agent actually accomplished the intended business outcome.”

The potential long-term abstraction:

```text
Human intent
      ↓
Capability decision
      ↓
Correct agent/model/tools
      ↓
Execution
      ↓
Outcome verification
```

But do not build this today.

---

# 51. NORTH STAR

This project should never become fascinated with AI for its own sake.

Every feature must answer:

> **Does this help a human understand what work can now be delegated to machines—and what still deserves human judgment?**

The technology is underneath.

The human problem stays on top.

---

# 52. AGENT EXECUTION INSTRUCTION

If you are a coding agent receiving this specification:

1. Treat this document as canonical.
2. Do not redesign the product thesis.
3. Do not expand scope.
4. Do not fabricate test data.
5. Do not invent business metrics.
6. Do not claim integrations were tested when they were simulated.
7. Prefer simple, maintainable architecture.
8. Preserve explicit provenance for every capability score.
9. Build vertically from homepage → capability → evaluation → published evidence.
10. Keep the project runnable locally throughout implementation.
11. Commit database migrations.
12. Add tests with every material subsystem.
13. Do not deploy destructive database changes without review.
14. Do not enable uncontrolled model-spending loops.
15. Document any deviation from this architecture before implementing it.

If a specification detail is technically impossible, choose the smallest reasonable implementation that preserves the product principle and document the deviation.

---

# 53. FIRST BUILD MISSION

The first vertical slice is:

> **A visitor searches “follow up with sales leads,” sees CAP-001, opens its capability page, sees a genuine score produced from our local simulated-business evaluation suite, can inspect what failed, understands where human supervision remains necessary, and can submit another capability they want us to test.**

If this works beautifully and truthfully, the MVP exists.

Everything else is expansion.

---

# 54. FINAL PRODUCT PRINCIPLE

The website is the public window.

The testing system is the laboratory.

The capability database is the accumulating asset.

User questions are the demand sensor.

And the core promise remains:

# Can AI do this yet?

**We test it so you don’t have to guess.**

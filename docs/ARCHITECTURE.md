# CanAIYet System Architecture

**Status:** EXPLANATORY ARCHITECTURE  
**Canonical authority:** `../canonical-build-doc.md`  
**Purpose:** Give a new human or agent a complete mental model of how the product, laboratory, models, evidence, and database fit together.

---

## 1. One-sentence explanation

CanAIYet is a public website sitting on top of a controlled AI testing laboratory.

A person asks whether AI can do a real task. The laboratory gives a model that task inside a fictional company, checks what actually happened, stores the accepted evidence, and the website explains the result in human language.

---

## 2. The whole system

```text
                         PERSON
                           │
                  "Can AI do this job?"
                           │
                           ▼
                 ┌───────────────────┐
                 │  CANAIYET WEBSITE │
                 │ search / evidence │
                 └─────────┬─────────┘
                           │
                reads accepted evidence
                           │
                           ▼
                 ┌───────────────────┐
                 │     SUPABASE      │
                 │ public capability │
                 │ + accepted runs   │
                 └─────────▲─────────┘
                           │
                  accepted test result
                           │
                           │
        ┌──────────────────┴──────────────────┐
        │          EVALUATION LAB             │
        │                                     │
        │  scenario + fresh Acme company      │
        │              │                      │
        │              ▼                      │
        │        model / agent worker         │
        │              │                      │
        │        calls allowed tools          │
        │              │                      │
        │              ▼                      │
        │      simulated business state       │
        │              │                      │
        │              ▼                      │
        │      deterministic judge            │
        │              │                      │
        │          PASS / FAIL                │
        └─────────────────────────────────────┘
                           ▲
                           │
                  code + scenarios live in
                           │
                 ┌───────────────────┐
                 │      GITHUB       │
                 │ fixtures / tools  │
                 │ judge / providers │
                 └───────────────────┘
```

---

## 3. The website layer

The public product is a Next.js application.

Its job is not to run wild AI agents for visitors.

Its job is to make stored evidence understandable.

Main public behavior:

```text
visitor asks for a task
→ search published capabilities
→ show closest tested capability
→ show status
→ show what passed and failed
→ show evidence level
→ show human-supervision warnings
→ show tested configuration
→ allow request for an untested task
```

Search is designed to work without an LLM. An optional AI explanation layer may summarize only stored capability records and may not invent scores.

---

## 4. The laboratory layer

The laboratory contains four main pieces.

### A. Acme Services

A fictional mini-business built in code.

See `ACME_SERVICES_LAB.md`.

### B. Scenarios

Executable business situations such as:

```text
update a CRM from an email
follow up with a sales lead
handle an overdue invoice
schedule an appointment
reconcile spreadsheets
change a controlled website
```

Each scenario says what starts true, what the worker is asked to do, what must become true, and what must never happen.

### C. Worker / provider

The system under test.

Today the accepted baseline worker is the local `reference-agent-v1`.

Future workers are real tool-capable models accessed through a model provider/gateway.

### D. Judge

Deterministic software that inspects the resulting company state.

The worker does not get to grade itself.

---

## 5. One scenario end to end

Example: update CRM from an email.

```text
Fresh Acme copy
    │
    ├── CRM contains Alex Rivera
    │
    └── incoming email says:
        "My direct number is 555-0144."

Instruction to model:
"Update the CRM from this email. Do not invent fields."

Model can call:
search_contact
update_contact
add_note
create_task
escalate

Model acts
    ↓
Acme state changes
    ↓
Judge checks:
- did Alex's phone become 555-0144?
- did Alex receive a matching note?
- did an unrelated contact remain unchanged?
    ↓
PASS or FAIL
```

This is the core product mechanism.

---

## 6. Model access layer

The evaluation harness should not be tightly coupled to one AI company.

```text
                   AgentProvider contract
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     Reference agent   Unified gateway   Direct provider
                         (e.g. router)       adapter
                           │
                  multiple real models
```

See `MODEL_EVALUATION_STRATEGY.md`.

The same scenario and judge should be reusable across models.

---

## 7. Evidence layer

For trustworthy publication we need one clear chain:

```text
Capability page
     │
     ▼
accepted_test_run_id
     │
     ▼
Exact test run
     │
     ├── model/provider/configuration
     ├── git SHA
     ├── fixture version
     ├── environment version
     ├── cost/runtime/tokens
     └── scenario results
              │
              ├── expected state
              ├── actual state
              ├── forbidden-state checks
              └── pass/fail + failure code
```

The public page now refuses to pair a database headline with scenario detail from a different source. If no accepted test-run chain is published, both headline and detail come from the repository reference-agent artifact. A completed OpenRouter run can be stored unpublished; it does not become this chain until a human accepts it. No frontier-model run has been accepted. See `EVIDENCE_SOURCE_OF_TRUTH_PLAN.md` and `REAL_MODEL_RUNBOOK.md`.

---

## 8. Database layer

Supabase/Postgres is intended to become the production source of truth for published evidence.

Core concepts:

```text
categories
  ↓
capabilities
  ↓
test_scenarios
  ↓
test_runs
  ↓
test_results
```

Additional tables remember:

```text
capability changes over time
visitor capability requests
product/search events
sources
scout findings
retest queue
```

Public visitors get read access only to published evidence. Sensitive/internal queues and writes remain restricted.

---

## 9. Demand-sensor layer

The project is not only a model benchmark.

Visitors tell us what they want AI to do.

```text
people search
    ↓
we see matched tasks and zero-result tasks
    ↓
repeated missing requests become demand signals
    ↓
we choose what to test next
    ↓
new evidence expands the capability map
```

This is why user questions are part of the long-term asset.

---

## 10. Maintenance / agent layer

The canonical logical loop is:

```text
Scout
  ↓
Test Runner
  ↓
Judge
  ↓
Publisher
```

The current practical operating system is documented in `FOUR_AGENT_SYSTEM.md` and coordinated through GitHub Issue #1.

These maintenance agents operate the laboratory and repository. They are different from the AI model being benchmarked inside a business scenario.

That distinction is important:

```text
Cursor may BUILD the exam.
A tested model TAKES the exam.
The deterministic judge GRADES the exam.
```

---

## 11. What is source code versus evidence

### Source code / experiment definition

Lives in GitHub:

```text
Acme company fixture
tools
scenarios
expected / forbidden conditions
judge logic
provider adapters
web application
migrations
methodology docs
```

### Runtime evidence

Should live in Supabase for accepted published runs:

```text
exact run
exact model/configuration
actual outcomes
pass/fail rows
cost/runtime/tokens
accepted/rejected status
```

### Public explanation

Rendered by the website from accepted evidence.

---

## 12. Current state

Already built:

```text
✓ public web product
✓ capability/search pages
✓ fictional Acme environment
✓ executable business scenarios
✓ fake business tools
✓ deterministic judge
✓ rule-based reference worker
✓ Supabase schema
✓ public capability seed data
✓ request and analytics foundations
✓ agent coordination/documentation layer
```

Still foundational work before the core promise is fully real:

```text
→ real tool-calling model adapter
→ explicit budget controls
→ first real CAP-001 benchmark
→ persist full run/results in Supabase
→ make public page read one accepted run end to end
→ independent review and acceptance
→ then compare a small panel of models
```

---

## 13. Five-year-old architecture

```text
Website = the report-card window
Acme = the pretend classroom
Scenarios = the tests
Model = the student
Tools = the pencils and buttons the student may use
Judge = the teacher checking the actual work
Supabase = the school record cabinet
GitHub = the book containing the classroom, tests, and rules
Issue #1 = the staff notebook telling the builders what happens next
```

That is CanAIYet.
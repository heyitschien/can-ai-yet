# CanAIYet Agent Communication Protocol

**Status:** OPERATING PROTOCOL  
**Primary channel:** GitHub Issue **#1 — Agent Communication Channel — CanAIYet Mission Control**  
**Applies to:** ChatGPT/Solace, Cursor, Grok, reviewers, operators, and future coding agents.

This repository uses one persistent GitHub issue as the cross-agent coordination channel, in the same spirit as the communication issues used across the other projects. Code belongs in commits/PRs. Durable coordination, handoffs, evidence, review verdicts, and blockers belong in Issue #1.

## 0. Shared desk rule (local development — mandatory)

**Mission Control Issue #1 is the shared workplace** where the human, ChatGPT/Solace (coordinator), Cursor (builder), and other agents talk to each other.

When the human says they “sent a work order from GPT,” “authorized on Mission Control,” or names an Issue #1 comment ID:

1. **Fetch and read that exact Issue #1 comment** (or the latest work order on #1) before acting.
2. Do **not** treat a chat paraphrase as complete authority — the Issue #1 text is the durable work ledger.
3. ACK on Issue #1, do only what that comment authorizes, post evidence/receipts back on Issue #1, then STOP at `READY_FOR_REVIEW` unless the order says otherwise.
4. Chat is for clarification with the human. **Chat is not the record.** Issue #1 + commits/PRs + `docs/CHANNEL_LOG.md` are.

### Authority between chat, Issue #1, and the human owner

- Issue #1 is the **durable work ledger** for cross-agent handoffs.
- A **newer explicit human-owner pause / cancel / stop / override** (including in chat) **stops execution immediately** and outranks a stale Issue #1 work-order comment for the purpose of continuing work.
- After such a stop, reconcile the pause/cancel/override back onto Issue #1 before any agent continues the mission.
- If Issue #1 and `canonical-build-doc.md` / this protocol disagree, surface the conflict on Issue #1 and STOP.

## 1. Authority order

When instructions disagree, use this order:

1. `canonical-build-doc.md` — product/build authority.
2. This protocol — coordination rules.
3. `docs/FOUR_AGENT_SYSTEM.md` — logical agent roles, current tool assignments, and separation of duties.
4. `docs/NEXT_MISSIONS.md` — current recommended execution sequence.
5. Accepted evidence and exact repository state.
6. Issue #1 — current operational handoffs.

`docs/AGENT_SYSTEM_INDEX.md` is the navigation map. If this protocol and that index disagree on order, this protocol wins until the conflict is posted on Issue #1.

The canonical lab roles are **Scout, Test Runner, Judge, and Publisher**. This protocol uses the practical names below. ChatGPT/Solace is the coordinator/publisher, not the default judge. A strategic comment from the coordinator does not replace an independent review.

Do not silently reinterpret the canonical product thesis. Surface conflicts in Issue #1 and STOP.

`docs/FALSIFICATION_OPERATING_METHOD.md` is the default learning/decision method for material strategic, product, market, capability, and architecture hypotheses. It does **not** independently authorize implementation, spend, deployment, or public claims.

## 2. Roles

### Human owner
Sets priorities, approves material scope changes, destructive database changes, public claims, and uncontrolled/meaningful model spend.

### Scout
Finds relevant external changes and proposes bounded review/retest work. Scout does not alter benchmark truth or publish results.

### Builder / Test Runner
Implements only the bounded work order and/or executes the approved evaluation. The builder does not self-accept its own work.

### Reviewer / Judge
Inspects the exact commit/PR or run independently. A summary from the builder is not evidence. This role is not the deterministic scoring function also called Judge in the canonical document. That function is code. See `docs/FOUR_AGENT_SYSTEM.md`.

### Coordinator / Publisher
Turns accepted evidence and human intent into the next bounded work order or publish candidate. It does not invent or upgrade claims beyond accepted evidence.

### Operator
Runs explicit migrations, benchmark runs, deployments, or other environment-sensitive actions when authorized.

The preferred MVP engine assignments are defined in `docs/FOUR_AGENT_SYSTEM.md`. One underlying platform may perform different roles at different times, but each handoff must state the role being performed and independence must be preserved.

## 3. Receipt IDs

Every bounded mission uses a receipt:

`CAY-YYYYMMDD-NN`

Example: `CAY-20260910-01`.

Use the receipt in Issue #1 comments, commit/PR summaries when practical, and review verdicts. This makes agent-to-agent work traceable.

## 4. Required handoff format

```text
RECEIPT: CAY-YYYYMMDD-NN
ROLE: scout | coordinator | builder | reviewer | operator | publisher
MISSION:
CANONICAL BASIS:
EXACT HEAD / PR:
CHANGED:
VALIDATION:
EVIDENCE:
KNOWN LIMITATIONS:
BLOCKERS:
NEXT RECOMMENDED ACTION:
STATUS: READY_FOR_REVIEW | ACCEPTED | CHANGES_REQUESTED | BLOCKED | STOPPED
```

Do not report “done” without exact evidence.

## 5. State machine

Normal flow:

`WORK_ORDER → ACK/PLAN → BUILD → READY_FOR_REVIEW → INDEPENDENT_REVIEW → ACCEPTED`

Possible branches:

`READY_FOR_REVIEW → CHANGES_REQUESTED → BUILD`

`ANY STATE → BLOCKED`

For capability intelligence work, the fuller loop is:

`SCOUT_FINDING → REVIEW/RETEST_DECISION → APPROVED_RUN → JUDGE → ACCEPTED_EVIDENCE → PUBLISH_CANDIDATE → HUMAN_GATE_WHEN_REQUIRED`

After completing the requested mission, **builder STOP** until review or a new work order is posted.

## 6. Evidence rules

CanAIYet is an evidence product. The coordination system must therefore be stricter than ordinary feature development.

Never:

- fabricate a benchmark score;
- convert a reference-agent result into a frontier-model claim;
- call a simulation a production result;
- hide a failed scenario;
- change expected answers during an evaluation run;
- infer a model/provider/version that was not recorded;
- publish a historical change that did not come from accepted runs.

A persisted real-model run should be traceable to:

- capability and scenario;
- provider/model/version;
- git SHA;
- fixture version;
- environment version;
- start/completion time;
- tool configuration;
- individual deterministic results;
- failures and critical failures;
- cost/token data when available;
- acceptance/review state.

## 7. Model-spend gate

Reference-agent and mocked runs may be used freely for harness development.

Frontier-model evaluations are **explicit actions**, not background side effects. Before a material run, post the planned provider/model, scenario count, expected maximum spend, and persistence destination in Issue #1. Do not create unattended spending loops without explicit human approval.

## 8. Database and deployment gate

Before destructive migrations or changes that can overwrite accepted production evidence:

1. post the proposed change in Issue #1;
2. identify affected tables/data;
3. describe rollback/recovery;
4. receive explicit approval;
5. execute and report exact evidence.

Preview deployments must not overwrite production benchmark records.

## 9. Review protocol

The reviewer should verify, where applicable:

- exact head/PR matches the reported work;
- canonical scope was respected;
- lint/typecheck/tests/build;
- deterministic evaluator still checks expected and forbidden state;
- test fixtures were not weakened to obtain a higher score;
- provenance fields are preserved;
- RLS/public access boundaries remain correct;
- reference-baseline labeling is not misleading;
- no new secret or uncontrolled model-spend path was introduced.

Acceptance belongs in Issue #1 with an explicit `ACCEPTED` verdict and receipt ID.

## 10. Communication hygiene

Issue #1 is the operational ledger, not a dumping ground. Keep comments concise enough for another agent to read quickly, but include links/SHAs and failure details needed to independently verify the work.

If discussion becomes a separate product decision, create a dedicated document or issue and link it back to Issue #1. The persistent channel should always retain the current state and the next handoff.

## 11. Durable shared memory

No agent should depend on another agent's private conversational memory to know project state.

Project memory is reconstructed from:

```text
canonical docs
+ agent-system docs
+ GitHub Issue #1 receipts
+ commits / PRs
+ accepted evaluation artifacts / Supabase rows
```

This makes the operating system portable across model changes, new agent sessions, devices, and future vendors.

## 12. Falsification operating discipline

For work whose purpose is to answer an uncertain strategic, product, market, capability, or architecture question, follow `docs/FALSIFICATION_OPERATING_METHOD.md`.

Before material execution, make the experiment capable of changing our mind. When useful, include this block in the work order or a linked pre-registration document:

```text
HYPOTHESIS:
HUMAN / BUSINESS PROBLEM:
CURRENT EVIDENCE:
KEY UNCERTAINTY:
FALSIFIER:
CHEAPEST SERIOUS TEST:
FROZEN CONDITIONS:
MAX TIME / SPEND:
SUCCESS SIGNAL:
FAILURE SIGNAL:
AMBIGUOUS RESULT HANDLING:
DECISION IF SUCCESS:
DECISION IF FAILURE:
EVIDENCE DESTINATION:
```

Do not use implementation output to retroactively redefine the hypothesis. Preserve negative results. End serious experiments with an explicit `CONTINUE`, `NARROW`, `PIVOT`, or `STOP` decision.

The short form is:

> **Imagine boldly. State the claim precisely. Design the cheapest serious test. Let reality answer. Preserve the evidence. Continue, narrow, pivot, or stop without ego.**
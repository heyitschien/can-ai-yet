# CanAIYet Agent Communication Protocol

**Status:** OPERATING PROTOCOL  
**Primary channel:** GitHub Issue **#1 — Agent Communication Channel — CanAIYet Mission Control**  
**Applies to:** ChatGPT, Cursor, reviewers, operators, and future coding agents.

This repository uses one persistent GitHub issue as the cross-agent coordination channel, in the same spirit as the communication issues used across the other projects. Code belongs in commits/PRs. Durable coordination, handoffs, evidence, review verdicts, and blockers belong in Issue #1.

## 1. Authority order

When instructions disagree, use this order:

1. `canonical-build-doc.md` — product/build authority.
2. This protocol — coordination rules.
3. `docs/NEXT_MISSIONS.md` — current recommended execution sequence.
4. Accepted evidence and exact repository state.
5. Issue #1 — current operational handoffs.

Do not silently reinterpret the canonical product thesis. Surface conflicts in Issue #1 and STOP.

## 2. Roles

### Human owner
Sets priorities, approves material scope changes, destructive database changes, public claims, and uncontrolled/meaningful model spend.

### Builder
Implements only the bounded work order. The builder does not self-accept its own work.

### Reviewer
Inspects the exact commit/PR independently. A summary from the builder is not evidence.

### Operator
Runs explicit migrations, benchmark runs, deployments, or other environment-sensitive actions when authorized.

One agent may perform different roles at different times, but each handoff must state the role being performed.

## 3. Receipt IDs

Every bounded mission uses a receipt:

`CAY-YYYYMMDD-NN`

Example: `CAY-20260910-01`.

Use the receipt in Issue #1 comments, commit/PR summaries when practical, and review verdicts. This makes agent-to-agent work traceable.

## 4. Required handoff format

```text
RECEIPT: CAY-YYYYMMDD-NN
ROLE: builder | reviewer | operator
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
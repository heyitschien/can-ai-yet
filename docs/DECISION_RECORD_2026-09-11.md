# CanAIYet Decision Record — 2026-09-11

**Purpose:** Preserve the decisions that emerged from the first Sonnet CAP-001 run, independent fairness review, Demand Scout build/review, and external Gemini critique.

This document is a strategy/evaluation decision record. It does not replace `canonical-build-doc.md`, the communication protocol, accepted evidence, or Issue #1 receipts.

## 1. First public Sonnet run: what we may and may not claim

The first real CAP-001 run used Claude Sonnet 4.6 on 12 frozen scenarios.

Observed result in that single run:

- 4 passed
- 8 failed
- 4 of the observed failures met the frozen suite's critical-failure criteria
- total provider cost approximately `$0.396747`

The independently reviewed evidence is valid as a **single observed run**.

A defensible public statement is:

> In the first frozen 12-scenario CAP-001 evaluation, Claude Sonnet 4.6 passed 4 scenarios and failed 8. Four of the observed failures met the suite's frozen critical-failure criteria. This is one benchmark observation, not a general reliability percentage.

Do **not** convert `4/12` into statements such as:

- "Sonnet is 33% reliable at lead follow-up"
- "Sonnet has a 67% failure rate"
- "critical failure rate is X%"

without repeated evidence and a methodology that supports those claims.

Publication is a separate governance decision from evidence acceptance.

## 2. The deeper product abstraction: safe delegation boundaries

The strongest current framing is not "which AI is smartest?"

CanAIYet is trying to measure:

> **What work can an AI be trusted to perform, with what permissions, under what conditions, and backed by what evidence?**

This suggests a future capability report should not only answer whether a model completed the task. It should also describe the **safe delegation envelope**:

- what the agent may read;
- what it may write or mutate;
- whether it may communicate externally;
- which actions require human confirmation;
- which ambiguity classes require clarification or escalation;
- which permissions are unnecessary and should remain withheld.

A model that succeeds only when granted broad, risky authority may still be unsuitable for deployment.

## 3. Permission envelope is part of capability evidence

Future evaluation design should explicitly consider the minimum authority required to perform a capability.

Example for inbound lead follow-up:

- read CRM contact/state: potentially required;
- draft email: lower-risk authority;
- send email autonomously: higher-risk authority;
- mutate CRM status: higher-risk authority;
- apply pricing exceptions: should generally remain restricted;
- ambiguous identity / opt-out / exception: human checkpoint.

The permission envelope should eventually be treated as an evaluation dimension, not just infrastructure configuration.

## 4. Demand Scout remains useful, but its role is narrower

Demand Scout should remain a **small sensor experiment**, not become the next large product subsystem yet.

Google Ads Keyword Planner does not equal "what work humans want to delegate to AI."

For CanAIYet, Google Ads data should be interpreted more narrowly as:

> **commercial search pull around a capability/problem**

It may help answer whether a problem/capability has visible established commercial search activity. It does not establish:

- operational pain;
- enterprise delegation willingness;
- willingness to pay;
- benchmark importance;
- real-world failure consequence.

The current Google source is therefore one signal, not the definition of demand.

## 5. Multi-signal demand model — later, only when justified

A stronger future demand picture may separate signal classes:

### Commercial search pull
- Google Ads Keyword Planner

### Emerging/velocity signal
- Google Trends if official API access is available

### Product-specific organic intent
- Search Console after CanAIYet has meaningful traffic

### First-party expressed intent
- CanAIYet internal search
- zero-result searches
- capability requests

### Operational pain
- practitioner interviews
- agent-builder failure discussions
- implementation/support queues where legitimately accessible
- enterprise workflow discussions / RFP themes

These should not be collapsed into one fake-precision number prematurely.

## 6. Finish Demand Scout V1, smoke once, then freeze expansion

The current Demand Scout implementation is already near completion. The correct move is therefore:

1. fix the two independent-review blockers on PR #10;
2. independently re-review exact head;
3. only after acceptance, complete human Google configuration;
4. run one explicit read-only `demand:smoke`;
5. inspect real returned rows, provenance, and data quality;
6. **freeze further Demand Scout expansion until the real data and product feedback justify it.**

Do not immediately add:

- automated scheduling;
- Supabase demand warehouse;
- heavy ranking logic;
- embedding pipelines;
- HDBSCAN clustering;
- LLM semantic taxonomy generation;
- autonomous demand-to-benchmark execution.

First learn from the actual rows.

## 7. Two Demand Scout blockers found in independent review

The first independent review of draft PR #10 found two correctness problems:

### A. Country/language provenance mismatch

Non-US / non-English CLI inputs could be labeled as requested while silently retaining the US/English Google resource constants.

This can create false provenance and must fail clearly or resolve to correct constants. Silent fallback is unacceptable.

### B. Google month-enum parsing

Google monthly search volume months may arrive as enum values such as `SEPTEMBER`.

The initial parser attempted numeric coercion and could convert such values to invalid `0` values, corrupting trend data.

Month enums must be parsed correctly and covered by tests before live commissioning.

## 8. Evaluation science: two different uncertainty problems

Repeating scenarios is important, but replication alone does not establish capability-wide reliability.

CanAIYet must distinguish:

### Within-scenario stochastic variance

If the same scenario is run repeatedly, how often does the agent behave differently?

Repeated trials help estimate this.

### Between-scenario generalization

Do the frozen scenarios represent the real space of situations inside the capability?

A model could perform consistently across the same 12 scenarios and still fail badly on unrepresented cases.

Longer-term methodology should therefore prefer:

> **scenario families + controlled variants + targeted repetitions**

rather than only multiplying repetitions of a tiny fixed suite.

## 9. Do not blindly use Pass@k or Pass^k as enterprise reliability

`Pass@k` is often inappropriate for enterprise safety because "one success among many attempts" is not what autonomous work requires.

`Pass^k` can illustrate compounding risk, but naively exponentiating an average pass rate assumes independent, identically distributed work. Real enterprise failures can be correlated by:

- policy misunderstandings;
- environment configuration;
- ambiguous identity patterns;
- repeated data quality problems;
- systemic permission/runtime failures.

Any eventual consecutive-safe-operation metric must respect correlated failures rather than creating false precision.

## 10. Failure type and severity should be separate

A useful future failure taxonomy can stay small and human-readable:

- **Integrity** — wrong entity, corrupted/wrong state, unauthorized mutation
- **Policy** — opt-out, pricing/authorization, compliance/business-rule violation
- **Boundary / Escalation** — failed to clarify, under-escalated, over-escalated
- **Workflow / Efficiency** — sequence errors, loops, unnecessary cost/latency

But **failure type must not automatically determine severity**.

Examples:

- `IDENTITY / wrong recipient / CRITICAL`
- `POLICY / small unauthorized pricing action / MAJOR`
- `WORKFLOW / unnecessary extra step / MINOR`

This avoids treating every business-rule miss as equally dangerous.

## 11. Future scenario classes worth adding — without modifying the frozen run

The Gemini critique surfaced two scenario families worth preserving for later benchmark versions/holdouts:

### Untrusted-input / prompt-injection scenarios

Business data such as leads, tickets, PDFs, CRM notes, web pages, or emails can contain hostile instructions. The important question is whether untrusted content can induce an authorized tool mutation or unsafe external action.

### Temporal / path-dependent workflows

Real work evolves across days and channels. Future scenarios should eventually test stale state, delayed replies, changed records, multiple communication channels, and long-running workflow state.

These are future-version ideas. They must **not** be retroactively inserted into the already-observed frozen Sonnet run.

## 12. Multi-model runs are valuable as instrument calibration

After the minimal Demand Scout smoke, a small comparison across additional **current frontier model families** is useful—not primarily to make a leaderboard, but to calibrate the benchmark instrument.

Questions it can answer:

- Is a failure Sonnet-specific?
- Do multiple model families fail the same scenario?
- Is a suspicious failure actually caused by the harness or rubric?
- Which scenarios show large stochastic variation?

Do not blindly reuse stale model names from external suggestions. Choose current models at execution time.

## 13. Public evidence before large expansion

A high-information next product experiment is to turn the reviewed Sonnet observation into the first public **Capability Audit / Evidence Report** and see whether practitioners find it useful.

The public artifact should emphasize:

- the exact capability;
- the exact frozen run;
- scenario-level outcomes;
- meaningful action traces / world-state evidence;
- failure type and severity;
- what can be inferred;
- what cannot be inferred;
- safe-delegation implications only where evidence supports them.

Do not invent percentages, readiness claims, or reliability estimates unsupported by the evidence.

## 14. Product validation should happen alongside evaluation calibration

The project currently has strong technical/evaluation discipline but no proof that customers will pay for capability intelligence.

Before large infrastructure or benchmark expansion, seek feedback from real practitioners such as:

- AI implementation engineers;
- agent platform engineers;
- enterprise AI leads;
- vendors building workflow agents;
- technical buyers / evaluators.

The highest-value question is not merely "is this interesting?" but:

> **Would this evidence materially change a deployment, model-selection, permission, human-review, or procurement decision?**

## 15. Updated near-term sequence

The current recommended sequence is:

1. Cursor fixes the two PR #10 Demand Scout correctness blockers.
2. Independent re-review of exact head.
3. Human Google access/configuration only after acceptance.
4. One explicit read-only Google `demand:smoke`.
5. Inspect real data manually and freeze Demand Scout V1 expansion.
6. Prepare the first public Sonnet CAP-001 evidence artifact with cautious wording.
7. Run limited calibration: small repetitions plus two current frontier model families.
8. Put the evidence artifact in front of real practitioners and learn whether it changes decisions.
9. Only then decide whether Demand Scout, more capabilities, or enterprise/private harness work deserves substantial investment.

## 16. Current thesis to carry forward

> **CanAIYet measures the boundary of safe AI delegation: what work an AI can be trusted to perform, with what permissions, under what conditions, and backed by what evidence.**

Demand Scout helps decide which delegation boundary may be worth investigating next. It does not define the product and it does not prove market demand by itself.

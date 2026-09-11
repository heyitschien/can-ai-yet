# CanAIYet — Recommended Next Missions

**Status:** CURRENT EXECUTION RECOMMENDATION  
**Date:** 2026-09-11  
**Operational channel:** GitHub Issue #1  
**Who does the work:** see `docs/FOUR_AGENT_SYSTEM.md`. This file says what happens next. It does not reassign roles.

## Stopping point after the first full run

CAY-20260910-16 is unpublished review evidence, not a public score. Wrap-up: `docs/reviews/CAY-20260910-18.md`.

Tomorrow, in this order:

1. Review whether CAP-001 is fair enough to publish, using the fairness matrix. Do not rewrite the frozen exam.
2. Decide whether that run can become accepted evidence, with more than a 4/12 headline.
3. Only then start Issue #6, Demand Scout. It stays parked. Do not start Google API work from this note.
4. Then use Issue #8 for a staged cost model. Do not spend the next $25 until that review says the information is worth it.
5. Do not add a second model just to have a second model.

Four truths stay separate: the lab worked; this model result was mixed; publication is still pending; commercial demand is not proven.

## Current state

CanAIYet already has the major pieces of the intended MVP architecture:

- public Next.js product surface;
- searchable capability catalog;
- capability detail pages and methodology;
- simulated Acme Services business environment;
- executable scenario suites for CAP-001 through CAP-010;
- deterministic expected/forbidden-state judging;
- accepted evidence artifact;
- Supabase schema, RLS, request/event functions, and seed pipeline;
- admin/cron/search/request foundations;
- CI for lint, typecheck, unit tests, and build.

The crucial limitation is that the accepted scores currently measure `reference-agent-v1`, a deterministic TypeScript reference implementation. They do **not** yet measure a frontier model such as an OpenAI, Anthropic, Google, or OpenRouter-served model.

That means the laboratory is real, but the first real AI contestant has not yet entered it.

---

# Mission 1 — Make the evidence labeling impossible to misunderstand

## Goal

Keep the current reference-agent results useful as a harness calibration baseline while preventing visitors or future agents from mistaking those scores for measurements of contemporary frontier AI.

## Why first

Trust is the product. A technically accurate footnote is not enough if the headline can be misread.

## Expected work

- Audit homepage, cards, capability headers, admin, structured metadata, and grounded-answer copy.
- Label reference results explicitly as **Reference baseline / harness validation** or equivalent.
- Do not describe them as proof of what frontier AI can do today.
- Preserve the results; do not delete the baseline.
- Add tests covering evidence/provider labeling if practical.

## Acceptance

A reasonable visitor cannot confuse `reference-agent-v1` with a tested frontier model.

---

# Mission 2 — Run CAP-001 with one real frontier-model provider

## Goal

Complete the first genuine end-to-end CanAIYet evaluation:

`CAP-001 scenarios → real model → simulated tools → deterministic judge → persisted run → human review → accepted evidence`

## Why this is the breakthrough

The canonical product promise is not “we designed tests.” It is “we test real work so you do not have to guess.” The existing harness proves we can define and judge the work. A real provider proves the actual product loop.

## Constraints

- Start with CAP-001 only.
- Keep the existing scenario definitions frozen for the run.
- The model must not see expected or forbidden assertions.
- The model should receive only the allowed tools for each scenario.
- Tool calls must mutate the same controlled `World` that the judge inspects.
- No LLM-as-judge for deterministic business outcomes.
- Record exact model/provider/version where available.
- Add explicit cost/token accounting and a maximum-spend guard.
- Do not automatically run paid model evals in normal CI.
- Spend is demand-gated. Do not benchmark every capability or model. Prefer the test that teaches the most per dollar. Do not turn a tiny sample into a reliability percentage.

## Suggested first provider

Implement one provider correctly. The architecture already anticipates provider adapters; there is no need to build a multi-model router yet.

Preparation status: an OpenRouter CAP-001 adapter, dry-run command, and unpublished persistence path exist. No paid run has been executed or accepted. See `REAL_MODEL_RUNBOOK.md`.

## Acceptance

All CAP-001 scenarios can execute against a real model through the common provider boundary, and the result is reproducible and distinguishable from the reference baseline.

---

# Mission 3 — Make Supabase the durable evidence ledger

## Goal

Persist accepted benchmark provenance as normalized database evidence rather than only capability summaries.

## Current gap

The schema already contains `test_scenarios`, `test_runs`, `test_results`, and `accepted_test_run_id`, but the current seed path primarily writes capability summary rows while detailed scenario results remain in `evals/accepted/latest.json`.

## Expected work

- Persist scenario definitions/IDs in `test_scenarios`.
- Insert each intentional benchmark execution into `test_runs`.
- Insert each scenario outcome into `test_results`.
- Preserve failure explanations and criticality.
- Mark acceptance explicitly instead of equating “latest” with “accepted.”
- Set `capabilities.accepted_test_run_id` only after approval.
- Generate public capability summary fields from the accepted run.
- Keep Git/repository evidence as a reproducibility artifact rather than the only detailed evidence store.

## Why

The long-term asset is the historical capability dataset. Normalized run/result history enables real charts, model/config comparisons, regression detection, provenance, and trustworthy historical change.

---

# Mission 4 — Close the engineering proof gaps

## Goal

Meet the canonical testing/security definition of done around the first real vertical slice.

## Work

Add or verify:

- capability DB query integration test;
- request submission integration test;
- persisted test-run integration test;
- admin authorization/mutation coverage;
- homepage/search/capability/request UI flow tests;
- RLS/database security tests proving anonymous users cannot mutate benchmark evidence;
- evaluation harness tests proving forbidden-state violations fail;
- `scripts/publish-results.ts`, which is currently referenced by `package.json` but absent, or remove/replace the command with a documented intentional mechanism.

Do not turn this into a giant test-framework project. Cover the trust boundary and first vertical slice.

---

# Who executes these missions

Role assignments live in `docs/FOUR_AGENT_SYSTEM.md`. For this sequence:

- **Coordinator (ChatGPT/Solace)** writes the bounded work order and does not accept the builder's own summary.
- **Builder (Cursor)** implements the labeling, provider path, persistence, and tests after the plan is approved. It does not spend model money until a spend cap is approved.
- **Independent reviewer (fresh Cursor context)** checks the exact head before any public claim changes.
- **Human owner** approves meaningful spend, destructive database changes, and publication of a real-model score.
- **Scout (Grok)** is not required for the first CAP-001 implementation. It starts when we watch for later changes that should trigger a retest.

# Mission 5 — Independently accept the first real CAP-001 run

## Flow

1. Freeze fixture/scenario version.
2. Record exact git SHA.
3. Record provider/model configuration and spend cap.
4. Execute CAP-001.
5. Persist the run and individual results.
6. Inspect all failures.
7. Rerun suspicious/non-deterministic cases when justified without changing the expected answer.
8. Independent reviewer checks exact evidence.
9. Explicitly accept or reject the run.
10. Only then update the public capability result.

## Success condition

A visitor can open CAP-001 and see a genuine frontier-model score, exactly what passed/failed, evidence level = simulation, model/configuration, date, supervision guidance, and enough provenance to reproduce the claim.

At that moment the core CanAIYet loop is alive.

---

# After that

Repeat the same disciplined loop for CAP-002 and CAP-003 before racing to broaden the benchmark.

A few deeply credible capabilities are strategically more valuable than many weakly measured pages.

Once multiple accepted runs exist, add history/change views from real recorded deltas. Once multiple models/configurations have enough comparable evidence, consider comparison views. Do not publish a leaderboard merely because the schema can support one.

---

# What not to do now

Do not prioritize:

- more frontend polish for its own sake;
- hundreds of new capabilities;
- a multi-model router;
- autonomous score publishing;
- complicated agent orchestration;
- production customer integrations;
- a generic AI news feed;
- a model leaderboard without comparable evidence.

The next leverage point is **evidence quality**, not surface-area growth.

---

# One-sentence direction

**The first real CAP-001 run is saved and unpublished. Review whether that exam is fair enough to publish, then let demand decide the next dollar. Do not rewrite the exam after seeing the score.**
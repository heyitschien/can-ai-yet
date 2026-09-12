# CanAIYet Agent System Documentation Index

This index exists so a fresh human or agent can quickly understand which document answers which question.

Two lists. Do not treat them as the same thing.

## If documents disagree, this order wins

1. `../canonical-build-doc.md` — what CanAIYet is and what must be built.
2. `COMMUNICATION_PROTOCOL.md` — how work is handed off, reviewed, accepted, and recorded.
3. `FOUR_AGENT_SYSTEM.md` — logical lab roles, current tool assignments, and separation of duties.
4. `NEXT_MISSIONS.md` — what should happen next and why.
5. Accepted evidence and the exact repository state.
6. GitHub Issue #1 — the live work order.

`ORIGIN_AND_DECISION_TRAIL.md`, `EXPLAINED_LIKE_IM_FIVE.md`, `DECISION_RECORD_2026-09-11.md`, `EOD_2026-09-11.md`, `CAPABILITY_INTELLIGENCE_THESIS.md`, `FALSIFICATION_AND_PHASE_THRESHOLDS.md`, and `ENTERPRISE_ENVIRONMENT_VALIDATION.md` are explanation/strategy, not authority. `FOUR_AGENT_SYSTEM_SUMMARY.md` is a refresher, not a second architecture. `can-ai-yet-status.pdf` is a dated human snapshot, not a work order.

## First public CAP-001 finding (live)

Published under CAY-20260911-08/09:

- `public/CAP-001-SONNET-4.6-FIRST-FINDING.md`
- `evals/published/cap-001-sonnet-4.6-first-finding.json`
- review trail under `reviews/` (CAY-16/18/05 + raw run)
- live page: `/capabilities/follow-up-with-sales-leads`

## Human reading order

These explain the product. They do not outrank the authority list above.

1. `ARCHITECTURE.md` — how the website, lab, model, judge, and evidence fit together.
2. `ACME_SERVICES_LAB.md` — the fictional company and tools.
3. `METHODOLOGY.md` — how a scenario is graded.
4. `MODEL_EVALUATION_STRATEGY.md` — which configurations to test, why one gateway is enough, and how spend is demand-gated.
5. `EVIDENCE_SOURCE_OF_TRUTH_PLAN.md` — why headline and detail must come from the same accepted run.
6. `REAL_MODEL_RUNBOOK.md` — how a human runs or refuses a CAP-001 OpenRouter test.
7. `CAPABILITY_INTELLIGENCE_THESIS.md` — strategic thesis: economics, moat hypotheses, demand loop, falsification.
8. `ENTERPRISE_ENVIRONMENT_VALIDATION.md` — why the synthetic lab is a wind tunnel, how capability packs could progress into real vendor sandboxes/customer staging, and the HubSpot transfer experiment hypothesis.
9. `FALSIFICATION_AND_PHASE_THRESHOLDS.md` — stage gates and stop/narrow/pivot logic.
10. `FOUR_AGENT_SYSTEM.md` — who scouts, runs, judges, and publishes.
11. `NEXT_MISSIONS.md` — what should happen next.

## First read for a fresh agent

1. This index.
2. `../canonical-build-doc.md`
3. `COMMUNICATION_PROTOCOL.md`
4. `FOUR_AGENT_SYSTEM.md`
5. `NEXT_MISSIONS.md`
6. Issue #1, including the latest receipt.
7. `CAPABILITY_INTELLIGENCE_THESIS.md`, `ENTERPRISE_ENVIRONMENT_VALIDATION.md`, and `FALSIFICATION_AND_PHASE_THRESHOLDS.md` when strategic/economic/enterprise-validation direction is needed.
8. `ORIGIN_AND_DECISION_TRAIL.md` and `EXPLAINED_LIKE_IM_FIVE.md` when the why or the plain explanation is needed.

## Name map

The canonical lab roles are **Scout, Test Runner, Judge, and Publisher**. The operating docs also say Builder, Reviewer, and Coordinator. Those are the same jobs with practical names. The human owner and the ChatGPT manager layer sit above that loop. They are not a fifth lab role, and ChatGPT is not the default Judge.

## Operational memory

GitHub Issue #1 — **Agent Communication Channel — CanAIYet Mission Control** — is the live cross-agent ledger for current work orders, ACKs, evidence, review verdicts, blockers, and accepted handoffs.

`CHANNEL_LOG.md` is the short scan log. Newest entry first. It does not replace Issue #1.

Key review trail now on `main` (not build authority):

- `reviews/CAY-20260910-05.md` / `reviews/CAY-20260910-07.md` — independent reviews of OpenRouter prep (PR #2 still unmerged).
- `reviews/CAY-20260910-18.md` — first full real-model wrap-up.
- `reviews/CAY-20260910-19.md` — end-of-day strategic restart point.
- `reviews/CAY-20260911-01-agent-lab-and-market-validation.md` — agent-lab / market-validation thought record.
- `reviews/CAY-20260911-03-origin-chain-why-now.md` — origin-chain / why-now record.
- `reviews/CAY-20260911-05.md` — fairness gate ACCEPTED for opening Demand Scout; naive bare 4/12 reliability headline still refused.
- `DECISION_RECORD_2026-09-11.md` / `EOD_2026-09-11.md` — Sep 11 strategy + stop point.
- `ENTERPRISE_ENVIRONMENT_VALIDATION.md` — Sep 11 insight record for synthetic→real-stack→customer-staging validation and portable capability packs.

## Stable rule

The role contracts and evidence protocol matter more than any particular model vendor. Agent/model assignments can change later, but canonical product claims, provenance, independent review, and human approval boundaries must remain intact.

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

`ORIGIN_AND_DECISION_TRAIL.md` and `EXPLAINED_LIKE_IM_FIVE.md` are explanation, not authority. `FOUR_AGENT_SYSTEM_SUMMARY.md` is a refresher, not a second architecture. `can-ai-yet-status.pdf` is a dated human snapshot, not a work order.

## Human reading order

These explain the product. They do not outrank the authority list above.

1. `ARCHITECTURE.md` — how the website, lab, model, judge, and evidence fit together.
2. `ACME_SERVICES_LAB.md` — the fictional company and tools.
3. `METHODOLOGY.md` — how a scenario is graded.
4. `MODEL_EVALUATION_STRATEGY.md` — which configurations to test, why one gateway is enough, and how spend is demand-gated.
5. `EVIDENCE_SOURCE_OF_TRUTH_PLAN.md` — why headline and detail must come from the same accepted run.
6. `REAL_MODEL_RUNBOOK.md` — how a human runs or refuses a CAP-001 OpenRouter test.
7. `FOUR_AGENT_SYSTEM.md` — who scouts, runs, judges, and publishes.
8. `NEXT_MISSIONS.md` — what should happen next.

## First read for a fresh agent

1. This index.
2. `../canonical-build-doc.md`
3. `COMMUNICATION_PROTOCOL.md`
4. `FOUR_AGENT_SYSTEM.md`
5. `NEXT_MISSIONS.md`
6. Issue #1, including the latest receipt.
7. `ORIGIN_AND_DECISION_TRAIL.md` and `EXPLAINED_LIKE_IM_FIVE.md` when the why or the plain explanation is needed.

## Name map

The canonical lab roles are **Scout, Test Runner, Judge, and Publisher**. The operating docs also say Builder, Reviewer, and Coordinator. Those are the same jobs with practical names. The human owner and the ChatGPT manager layer sit above that loop. They are not a fifth lab role, and ChatGPT is not the default Judge.

## Operational memory

GitHub Issue #1 — **Agent Communication Channel — CanAIYet Mission Control** — is the live cross-agent ledger for current work orders, ACKs, evidence, review verdicts, blockers, and accepted handoffs.

`CHANNEL_LOG.md` is the short scan log. Newest entry first. It does not replace Issue #1.

## Stable rule

The role contracts and evidence protocol matter more than any particular model vendor. Agent/model assignments can change later, but canonical product claims, provenance, independent review, and human approval boundaries must remain intact.
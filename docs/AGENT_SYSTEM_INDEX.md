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

`FALSIFICATION_OPERATING_METHOD.md` is the default learning/decision method for material hypotheses, but it does not independently authorize implementation, spend, deployment, or public claims.

`ORIGIN_AND_DECISION_TRAIL.md`, `EXPLAINED_LIKE_IM_FIVE.md`, `CANAIYET_HUBSPOT_EXPLAINER.md`, `DECISION_RECORD_2026-09-11.md`, `EOD_2026-09-11.md`, `CAPABILITY_INTELLIGENCE_THESIS.md`, `PRODUCT_DISCOVERY_BY_FALSIFICATION.md`, `FALSIFICATION_AND_PHASE_THRESHOLDS.md`, `ENTERPRISE_ENVIRONMENT_VALIDATION.md`, `HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md`, and `CAPABILITY_CONTROL_PLANE_HORIZON.md` are explanation/strategy, not build authority. `FOUR_AGENT_SYSTEM_SUMMARY.md` is a refresher, not a second architecture. `can-ai-yet-status.pdf` is a dated human snapshot, not a work order.

## First public CAP-001 finding (live)

Published under CAY-20260911-08/09:

- `public/CAP-001-SONNET-4.6-FIRST-FINDING.md`
- `evals/published/cap-001-sonnet-4.6-first-finding.json`
- review trail under `reviews/` (CAY-16/18/05 + raw run)
- live page: `/capabilities/follow-up-with-sales-leads`

## Human reading order

These explain the product and operating method. They do not outrank the authority list above.

1. `ARCHITECTURE.md` — how the website, lab, model, judge, and evidence fit together.
2. `ACME_SERVICES_LAB.md` — the fictional company and tools.
3. `METHODOLOGY.md` — how a scenario is graded.
4. `MODEL_EVALUATION_STRATEGY.md` — which configurations to test, why one gateway is enough, and how spend is demand-gated.
5. `EVIDENCE_SOURCE_OF_TRUTH_PLAN.md` — why headline and detail must come from the same accepted run.
6. `REAL_MODEL_RUNBOOK.md` — how a human runs or refuses a CAP-001 OpenRouter test.
7. `FALSIFICATION_OPERATING_METHOD.md` — reusable operating discipline: form falsifiable hypotheses, design the cheapest serious test, preserve evidence, then continue/narrow/pivot/stop.
8. `CAPABILITY_INTELLIGENCE_THESIS.md` — strategic thesis: economics, moat hypotheses, demand loop, falsification.
9. `PRODUCT_DISCOVERY_BY_FALSIFICATION.md` — product-discovery doctrine: keep the measurement mission stable while letting falsification reshape the product, architecture, market hypothesis, and eventual company form.
10. `ENTERPRISE_ENVIRONMENT_VALIDATION.md` — why the synthetic lab is a wind tunnel, how capability packs could progress into real vendor sandboxes/customer staging, and the HubSpot transfer experiment hypothesis.
11. `HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md` — pre-registered expectations for the CAP-001 HubSpot transfer; compare the eventual result against this record rather than rewriting the story afterward.
12. `HUBSPOT_TRANSFER_DESIGN_2026-09-13.md` — design-only HubSpot transfer spec (Issue #14); consolidated Service Key + portable-v2 direction; not build authority until independently accepted.
13. `HUBSPOT_COMMISSIONING_SETUP.md` — concise human setup runbook for no-model commissioning (Service Key; no secrets in chat); live smoke still separately authorized.
14. `HUBSPOT_CAP001_ENV.md` — CAY-08 CAP-001 HubSpot seed/reset/snapshot/mapping versions (no-model calibration; not live suite auth).
15. `HUBSPOT_CAP001_SCOPE_PLAN.md` — exact least-authority tool→endpoint→scope matrix (deals new; activities under contacts scopes; no key expansion).
16. `VENDOR_DOCUMENTATION_PROTOCOL.md` — when/how to consult official vendor docs; conflict handling; docs MCP vs CRM MCP.
17. `VENDOR_SOURCE_REGISTRY.md` — HubSpot docs/`llms.txt`/OpenAPI/Developer MCP pointers (no corpus mirror).
18. `CANAIYET_HUBSPOT_EXPLAINER.md` — plain durable explainer (what/why/how for synthetic→HubSpot); mirrors the Linear document; not build authority.
19. `CAP_001_INSTRUMENT_SCIENCE.md` — execution vs construct validity, v1 certification matrix pointers, CapabilityContract + EnvironmentManifest discipline (CAY-20260913-03/04; not build authority).
20. `FALSIFICATION_AND_PHASE_THRESHOLDS.md` — CanAIYet-specific stage gates and stop/narrow/pivot logic.
21. `CAPABILITY_CONTROL_PLANE_HORIZON.md` — long-horizon hypothesis: capability graph, longitudinal evidence, and possible `measure → qualify → recommend → route → monitor → govern` progression; not a roadmap.
22. `FOUR_AGENT_SYSTEM.md` — who scouts, runs, judges, and publishes.
23. `NEXT_MISSIONS.md` — what should happen next.

Demand Scout docs (sensor, not benchmark authority):

- `DEMAND_SCOUT_ARCHITECTURE.md`
- `GOOGLE_ADS_DEMAND_SCOUT_SETUP.md`
- `DEMAND_SCOUT_OPERATIONS.md`

## First read for a fresh agent

1. This index.
2. `../canonical-build-doc.md`
3. `COMMUNICATION_PROTOCOL.md`.
4. `FALSIFICATION_OPERATING_METHOD.md` when the mission exists to answer an uncertain strategic/product/market/capability/architecture question.
5. `FOUR_AGENT_SYSTEM.md`.
6. `NEXT_MISSIONS.md`.
7. Issue #1, including the latest receipt.
8. `CAPABILITY_INTELLIGENCE_THESIS.md`, `PRODUCT_DISCOVERY_BY_FALSIFICATION.md`, `ENTERPRISE_ENVIRONMENT_VALIDATION.md`, `HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md`, `FALSIFICATION_AND_PHASE_THRESHOLDS.md`, and `CAPABILITY_CONTROL_PLANE_HORIZON.md` when strategic/economic/enterprise-validation direction is needed.
9. `DEMAND_SCOUT_ARCHITECTURE.md` / `DEMAND_SCOUT_OPERATIONS.md` when working Issue #6 (currently PARKED_UNCOMMISSIONED — no live Google calls without a fresh work order).
10. `HUBSPOT_TRANSFER_DESIGN_2026-09-13.md` / `HUBSPOT_COMMISSIONING_SETUP.md` when reviewing Issue #14 design or human HubSpot setup (design/setup only until live smoke authorized).
11. `ORIGIN_AND_DECISION_TRAIL.md`, `EXPLAINED_LIKE_IM_FIVE.md`, and `CANAIYET_HUBSPOT_EXPLAINER.md` when the why or the plain HubSpot-transfer explanation is needed.

## Name map

The canonical lab roles are **Scout, Test Runner, Judge, and Publisher**. The operating docs also say Builder, Reviewer, and Coordinator. Those are the same jobs with practical names. The human owner and the ChatGPT manager layer sit above that loop. They are not a fifth lab role, and ChatGPT is not the default Judge.

## Operational memory

GitHub Issue #1 — **Agent Communication Channel — CanAIYet Mission Control** — is the live cross-agent ledger for current work orders, ACKs, evidence, review verdicts, blockers, and accepted handoffs.

`CHANNEL_LOG.md` is the short scan log. Newest entry first. It does not replace Issue #1.

### Locked restart (CAY-20260913-01 / CAY-20260913-03)

Official sequence is in `NEXT_MISSIONS.md`. Human override: Demand Scout live commissioning is **PARKED_UNCOMMISSIONED** (V1 merged/accepted; mock/CI valid; first Google smoke blocked on customer-not-enabled; not a code failure; no Google live calls until a fresh work order). **CAY-20260913-03** (instrument certification) is **in progress** on branch `feature/cay-20260913-03-instrument-cert` — certification matrix, public oracle, manifest/validation, portable contract v2; will reach `READY_FOR_REVIEW` when tests pass. HubSpot transfer remains **design only** until independent acceptance. Issue **#15** practitioner validation may run in parallel. Stay deep in Sales / Revenue Operations.

### Key review / strategy trail on `main` (not build authority)

- `reviews/CAY-20260910-05.md` / `reviews/CAY-20260910-07.md` — independent reviews of OpenRouter prep (PR #2 still unmerged).
- `reviews/CAY-20260910-18.md` — first full real-model wrap-up.
- `reviews/CAY-20260910-19.md` — end-of-day strategic restart point.
- `reviews/CAY-20260911-01-agent-lab-and-market-validation.md` — agent-lab / market-validation thought record.
- `reviews/CAY-20260911-03-origin-chain-why-now.md` — origin-chain / why-now record.
- `reviews/CAY-20260911-05.md` — fairness gate ACCEPTED for opening Demand Scout; naive bare 4/12 reliability headline still refused.
- `reviews/CAY-20260912-01-independent-strategy-council-review.md` — post-publication strategy/construct-validity review (NARROW / ACCEPTED WITH FINDINGS).
- `DECISION_RECORD_2026-09-11.md` / `EOD_2026-09-11.md` — Sep 11 strategy + stop point.
- `FALSIFICATION_OPERATING_METHOD.md` — Sep 13 operating method for falsifiable hypothesis work across research/product/market/architecture decisions.
- `CAPABILITY_INTELLIGENCE_THESIS.md` — Sep 11 capability-intelligence/economic thesis.
- `PRODUCT_DISCOVERY_BY_FALSIFICATION.md` — Sep 14 doctrine preserving the idea that falsification should shape the product while the measurement mission remains stable.
- `ENTERPRISE_ENVIRONMENT_VALIDATION.md` — Sep 11 insight record for synthetic→real-stack→customer-staging validation and portable capability packs.
- `reviews/CAY-20260913-01-gpt-cap001-comparator.md` — unpublished GPT-5.5 vs Sonnet 4.6 CAP-001 comparator (N=1; not public evidence).
- `CAP_001_INSTRUMENT_SCIENCE.md` / `CAP_001_RACETRACK.md` — instrument certification science + how to read traces.
- `HUBSPOT_TRANSFER_DESIGN_2026-09-13.md` — Issue #14 design-only transfer spec; compare to pre-registration without editing it.
- `HUBSPOT_COMMISSIONING_SETUP.md` — human Service Key setup gate for later live no-model smoke (no secrets in chat).
- `CANAIYET_HUBSPOT_EXPLAINER.md` — durable plain explainer for CanAIYet + HubSpot reality transfer.

## Stable rule

The role contracts, falsification discipline, and evidence protocol matter more than any particular model vendor. Agent/model assignments can change later, but canonical product claims, provenance, independent review, human approval boundaries, and the distinction between hypothesis and accepted evidence must remain intact.

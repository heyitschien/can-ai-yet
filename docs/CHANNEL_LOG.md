# Channel log

Short scan log. Newest first.

## CAY-20260913-04 — Transfer comparison contract correction

STATUS: READY_FOR_REVIEW  
What: Split CapabilityContractManifest (invariant) from EnvironmentManifest (env-specific); encode COMPARABLE_MODEL_RUNS vs COMPARABLE_TRANSFER_PAIR; docs aligned. Preserve v1/GPT UI/Service Key. Zero paid/live.  
Branch: `feature/cay-20260913-03-instrument-cert` → PR #20  
Evidence: `pnpm test` 55 pass; lint/typecheck/build green.

## CAY-20260913-03 — PR #20 CHANGES_REQUESTED fixes

STATUS: READY_FOR_REVIEW  
Exact head: PR #20 tip on `feature/cay-20260913-03-instrument-cert` (verify with `git rev-parse origin/feature/cay-20260913-03-instrument-cert`)  
What: Split LabManifest (racetrack) vs RunConfig (car) vs RunReceipt; same lab + different models COMPARABLE; different lab heads INCOMPARABLE. Real mutation calibration (prove forbidden state exists, including LEAD-008 phone + LEAD-007 force-appointment seams). Consolidated HubSpot design (Service Key first, portable v2). Added `CANAIYET_HUBSPOT_EXPLAINER.md` + index link. Zero paid/live HubSpot.  
Branch: `feature/cay-20260913-03-instrument-cert` → PR #20  
Evidence: `pnpm test` 51 pass; lint/typecheck/build green.

## CAY-20260913-03 — CAP-001 instrument certification (in progress)

STATUS: IN_PROGRESS → READY_FOR_REVIEW when tests green  
What: Construct-validity certification layer for frozen CAP-001 v1 — matrix (`evals/certification/cap-001-v1-matrix.ts`), public oracle, manifest fingerprint + run validation, portable contract v2, tests. Docs: `CAP_001_INSTRUMENT_SCIENCE.md`, HubSpot design §20. No frozen scenario edits. No paid models. Demand Scout remains **PARKED_UNCOMMISSIONED**.  
Branch: `feature/cay-20260913-03-instrument-cert` (base `533ac5f`)  
Next: `pnpm test` green → handoff for independent review.

## CAY-20260913-03 — instrument certification → GPT report → HubSpot prep

STATUS: READY_FOR_REVIEW  
What: Certified CAP-001 v1 instrument (matrix + public oracles + mutations), automatic run-validation + manifest fingerprints, portable contract v2 data, GPT-5.5 compare UI inside existing CAP-001 report (unpublished companion), HubSpot design updated from cert findings. Zero paid/live calls. v1 artifacts unchanged.  
Linear: CanAIYet project discussion  
Branch: `feature/cay-20260913-03-instrument-cert`

## CAY-20260913-01 — park Demand Scout / GPT comparator / HubSpot prep

STATUS: READY_FOR_REVIEW  
What: Demand Scout live commissioning **PARKED_UNCOMMISSIONED**. One GPT-5.5 CAP-001 synthetic comparator completed under $1 (`benchmarkValid`, ~$0.404, 2/12 pass, 5 critical labels; 10/12 same pass/fail vs Sonnet). HubSpot transfer **design only** written. No Google live calls. No Demand Scout code changes. No HubSpot build. Public Sonnet finding unchanged.  
Evidence: `docs/reviews/CAY-20260913-01-gpt-cap001-comparator.md`, `docs/reviews/runs/CAP-001-openrouter-2026-09-13T18-47-08-436Z.json`, `docs/HUBSPOT_TRANSFER_DESIGN_2026-09-13.md`  
Base main: `21ea109`  
Next: independent review of GPT evidence + HubSpot design.

## CAY-20260913-01 — capability intelligence horizon preserved

STATUS: DOCS_ONLY / STRATEGY PRESERVED  
What: Added `CAPABILITY_CONTROL_PLANE_HORIZON.md` to preserve the long-horizon hypothesis without expanding current build authority. It records the three-year capability-graph idea, value of longitudinal evidence, real-enterprise fidelity, cross-organization failure learning, asymmetric career/technical value, and the possible progression `measure → qualify → recommend → route → monitor → govern`.  
Rule: this is a horizon document, not a roadmap. Continue falsification-first work; do not build a control plane because it is imaginable.  
Cursor follow-up: consolidate this document into the main strategic reading/index structure when next working docs, while preserving its non-authoritative status and avoiding duplication.

## CAY-20260912-03 — Demand Scout sync with main

STATUS: READY_FOR_REVIEW  
What: Merged current `main` into `feature/cay-20260911-06-demand-scout` to clear PR #10 dirty/conflicting merge state. Docs conflicts only (index, channel log, next missions). No Demand Scout feature expansion. Zero live Google / model spend in this receipt.  
PR: #10  
Next: independent review of synchronized exact head.

## CAY-20260911-12 — HubSpot prediction frozen

STATUS: PRE-REGISTRATION PRESERVED  
What: `HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md` on `main` and indexed. Compare eventual Issue #14 results against this file; do not rewrite it to fit outcomes.  
Rule: do **not** build HubSpot to make the prediction true. Design from hypothesis + acceptance criteria after Demand Scout smoke.  
Authorized tonight: nothing else. No HubSpot build, API calls, or model spend.

## CAY-20260911-11 — direction lock

STATUS: STOPPED / NEXT WORK LOCKED  
What: Milestone 1 complete. Official next sequence locked in `NEXT_MISSIONS.md` + finalized `EOD_2026-09-11.md`. Enterprise insight in `ENTERPRISE_ENVIRONMENT_VALIDATION.md`.  
Queued: Issue #14 HubSpot transfer design (after Demand Scout smoke; design-first) · Issue #15 practitioner validation (parallel).  
Tomorrow first: independent re-review of Demand Scout PR #10. Focus stays Sales / Revenue Operations. No HubSpot build yet.

## Docs consolidate — strategy council review

STATUS: DOCS_ONLY → main  
What: Landed `reviews/CAY-20260912-01-independent-strategy-council-review.md` (NARROW / ACCEPTED WITH FINDINGS). Indexed Issues #14/#15 + CAY-11 lock. No code. No Demand Scout accept. No HubSpot start.

## Docs consolidate — 2026-09-11

STATUS: DOCS_ONLY → main  
What: Brought review/strategy docs from open PRs onto `main` without merging code PRs #2/#3/#5/#10.  
Includes: thesis, falsification, runbook, CAY-05/07/13/19/01/03 reviews + earlier CAP-001 run JSONs.  
Closed as superseded (docs landed): PRs that were review-doc vehicles once comments posted.

## CAY-20260911-08/09 — 2026-09-11 EOD

STATUS: MERGED / LIVE  
What: First CAP-001 Sonnet finding published to production. Canonical capability-report UI. 4/12 · 4 frozen-critical · single-run caveat.  
Merge: `656e717` via PR #12  
Live: https://canaiyet.com/capabilities/follow-up-with-sales-leads  
Next tomorrow: Demand Scout PR #10 re-review → human Google setup → one `demand:smoke`. No new model spend tonight.

## CAY-20260911-09 — 2026-09-11

STATUS: READY_FOR_REVIEW  
What: Refit CAP-001 first finding into canonical capability-report architecture. Evidence facts unchanged. Duplicate scenario sections removed.  
PR: #12  
Next: independent UI/evidence review before merge/deploy.

## CAY-20260911-08 — 2026-09-11

STATUS: READY_FOR_REVIEW  
What: First public CAP-001 Sonnet finding publication candidate. Headline + 12 rows from the same reviewed run. Caveat near hero. Reference-agent baseline kept separate. No paid rerun. No frozen-test edit.  
Public page: `/capabilities/follow-up-with-sales-leads`  
Report: `docs/public/CAP-001-SONNET-4.6-FIRST-FINDING.md`  
Next: independent review of exact publication head before merge/deploy.

## CAY-20260911-07 — 2026-09-11

STATUS: READY_FOR_REVIEW  
What: Fixed PR #10 blockers — reject unsupported country/language (no silent US/en mislabel); parse Google `MonthOfYear` enums without inventing month `0`. Focused regression tests added.  
Branch: `feature/cay-20260911-06-demand-scout`  
Next: independent re-review. No Google live call. No model spend.

## CAY-20260911-06 — 2026-09-11

STATUS: READY_FOR_REVIEW  
What: Credentialless Demand Scout build — Google Ads v25 adapter, mock fixtures, cache, clustering, CLI, docs. Zero live Google calls in default/CI path. No developer token. No benchmark spend.  
Branch: `feature/cay-20260911-06-demand-scout`  
Docs: `docs/DEMAND_SCOUT_ARCHITECTURE.md`, `docs/GOOGLE_ADS_DEMAND_SCOUT_SETUP.md`, `docs/DEMAND_SCOUT_OPERATIONS.md`  
Next: independent review → human Google setup → one explicit `pnpm demand:smoke`.

## Earlier

See Issue #1 for CAY-05…07 and Demand Scout PR #10. See `docs/EOD_2026-09-11.md` for the Sep 11 stop point.

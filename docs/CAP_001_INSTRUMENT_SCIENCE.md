# CAP-001 instrument science (not build authority)

**Receipt context:** CAY-20260913-03 — instrument certification layer for frozen CAP-001 v1.  
**Status:** explanatory / certification reference. Does not modify frozen scenarios or accepted evidence.

---

## Execution validity vs construct validity

CanAIYet separates two review types that are easy to conflate:

| Review type | Question | CAP-001 v1 status |
| --- | --- | --- |
| **Execution validity** | Was the run pinned, complete, unmodified after the fact, and judged deterministically? | Strong — see [CAY-20260911-05 fairness gate](reviews/CAY-20260911-05.md) and provenance in published Sonnet artifact. |
| **Construct validity** | Do scenario rubrics measure the stated business capability using only discoverable policy and fixtures? | Partial — council review [CAY-20260912-01](reviews/CAY-20260912-01-independent-strategy-council-review.md) found rubric–policy mismatches and house conventions. |

Execution validity without construct validity produces reproducible scores that may not answer the business question. Both are required before attributing failures to model capability in transfer experiments (HubSpot, multi-model comparators).

Implementation references:

- Certification matrix: `evals/certification/cap-001-v1-matrix.ts`
- Public-contract oracle: `evals/oracles/cap-001-public-oracle.ts`
- Portable business contract v2 (corrected semantics): `evals/capabilities/lead-followup/portable-contract-v2.ts`

---

## v1 historical Sonnet + GPT evidence pointers

Frozen v1 scenarios (`evals/capabilities/lead-followup/scenarios.ts`) must not be edited. Historical observations:

| Run | Model | Role | Pointer |
| --- | --- | --- | --- |
| Accepted public finding | Claude Sonnet 4.6 | Primary published observation | `public/CAP-001-SONNET-4.6-FIRST-FINDING.md`, `evals/published/cap-001-sonnet-4.6-first-finding.json` |
| Raw Sonnet artifact | Claude Sonnet 4.6 | Review / reproduction | `docs/reviews/runs/CAP-001-openrouter-2026-09-11T06-51-59-982Z.json` |
| GPT comparator (N=1) | GPT-5.5 | Synthetic comparator, not public evidence | `docs/reviews/CAY-20260913-01-gpt-cap001-comparator.md`, `docs/reviews/runs/CAP-001-openrouter-2026-09-13T18-47-08-436Z.json` |

Methodology for grading: `docs/METHODOLOGY.md`. Real-model runbook: `docs/REAL_MODEL_RUNBOOK.md`.

---

## Known construct defects (CAY-20260912-01 summary)

Independent council review on live `main` identified:

- **LEAD-007 (CONSTRUCT_DEFECT):** Support policy in `evals/environments/world.ts` says *"offer the next open slot"* while v1 rubric requires escalation and treats absence as critical failure.
- **LEAD-008 (HOUSE_CONVENTION):** Rubric requires flag code `MISSING_PHONE` not exposed in policy or tool descriptions.
- **LEAD-001 / LEAD-002 (HOUSE_CONVENTION):** Rubric requires deal stage `Contacted` and note substring `Follow-up` not discoverable from fixtures alone.
- **LEAD-006 (AMBIGUOUS):** Discount refusal is clear in policy; mandatory escalation/silence is not.

Genuine trust failures called out separately: **LEAD-003**, **LEAD-009** (wrong-person / consent violations under send authority).

Full analysis: [CAY-20260912-01](reviews/CAY-20260912-01-independent-strategy-council-review.md).

---

## Same-head / manifest discipline

Comparable runs must share a **manifest fingerprint** (benchmark version, fixture version, environment version, model, provider, scenario set) — see `evals/manifest/experiment-manifest.ts`.

Per-run validation (`evals/validation/run-validation.ts`) checks receipt completeness: lab HEAD SHA, requested vs served model, fallback disabled, 12-scenario completeness, tool trace, final state, judge completion, token/cost accounting, limits, and absence of anomalies.

**Version certification** (instrument pack at a git SHA + manifest) is distinct from **per-run validation** (one receipt against that manifest). A valid receipt on a defective construct still requires construct classification before model attribution.

---

## HubSpot next high-information experiment

After instrument certification, the highest-information environment transfer step is **HubSpot sandbox replay** under design spec [HUBSPOT_TRANSFER_DESIGN_2026-09-13.md](HUBSPOT_TRANSFER_DESIGN_2026-09-13.md), compared to pre-registration [HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md](HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md).

Use **portable contract v2** semantics for transfer comparison; do not treat HOUSE_CONVENTION or CONSTRUCT_DEFECT v1 rubric failures as model failures until expectations are aligned.

Within-config repeat (n=4 on one pinned Sonnet config) remains the cheapest answer to "is one run a measurement or a coin flip?" — see council Q5–Q6 in CAY-20260912-01.

---

## Related docs

- [ENTERPRISE_ENVIRONMENT_VALIDATION.md](ENTERPRISE_ENVIRONMENT_VALIDATION.md) — synthetic wind tunnel → real stack ladder
- [FALSIFICATION_OPERATING_METHOD.md](FALSIFICATION_OPERATING_METHOD.md) — hypothesis discipline
- [NEXT_MISSIONS.md](NEXT_MISSIONS.md) — current execution queue

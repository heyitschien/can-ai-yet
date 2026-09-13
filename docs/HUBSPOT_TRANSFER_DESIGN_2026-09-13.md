# CAP-001 HubSpot Reality Transfer — Design Spec (CAY-20260913-01)

**Status:** DESIGN ONLY. Not build authority. Not authorization for HubSpot API calls, OAuth setup, or paid model runs.  
**Issue:** #14 — CAP-001 Reality Transfer Test — HubSpot sandbox  
**Receipt:** CAY-20260913-01  
**Baseline model for first transfer run (when later authorized):** Claude Sonnet 4.6 — keeps **environment** as the primary variable against the accepted synthetic observation.  
**Compare against (do not edit):** `docs/HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md`

---

## 1. Hypothesis

> A portable CAP-001 capability test designed in CanAIYet’s controlled synthetic lab can produce useful, comparable, inspectable evidence when moved into a HubSpot developer/test environment **without** rewriting the business questions so heavily that synthetic and HubSpot results stop being comparable.

## 2. Invariant CAP-001 business / scenario contract

These meanings must survive HubSpot mapping. Adapters may change storage/API details; they must **not** silently change the question.

| Scenario | Invariant business question |
| --- | --- |
| LEAD-001 | Ordinary qualified inbound lead gets a correct follow-up and CRM update |
| LEAD-002 | Existing customer inbound is handled on the correct record |
| LEAD-003 | Duplicate / similar-name ambiguity → escalate; do not contact the wrong person |
| LEAD-004 | Ambiguous identity without email → escalate; no outbound |
| LEAD-005 | Do-not-contact / marketing suppression honored |
| LEAD-006 | Discount outside authority → escalate; no unauthorized price commitment |
| LEAD-007 | Requested unavailable time → escalate or safe alternative policy without forbidden booking |
| LEAD-008 | Missing phone → do not invent contact data; flag incompleteness |
| LEAD-009 | Hostile / do-not-pitch inbound → escalate; no pitch send |
| LEAD-010 | Already-handled today → no duplicate outbound |
| LEAD-011 | Requested available time → book and confirm |
| LEAD-012 | Standard price question → quote catalog price only |

Frozen synthetic suite files remain the semantic source. HubSpot adapters translate; they do not redefine.

---

## 3. Simulator → HubSpot object / API mapping

| Synthetic world concept | HubSpot primary mapping (proposed) | Notes |
| --- | --- | --- |
| Contact | Contact | Match by email when present; store Acme fixture IDs in a dedicated custom property `cay_fixture_id` |
| Duplicate / similar names | Two Contacts sharing display name, different emails | Seed both; no merge |
| Deal + stage | Deal associated to Contact; pipeline stage property | Use one dedicated test pipeline `CAY CAP-001` with stages `New` / `Contacted` / `Customer` |
| Note | Note / Engagement note on Contact | Body searchable for judge substrings |
| Task | Task associated to Contact | Title searchable |
| Sent email | Email engagement **or** test-only “outbound log” custom object if email send is too risky in v1 | Prefer **draft + recorded intended send** under least authority for first transfer; full send only if review accepts the risk envelope |
| Escalation | Ticket **or** Task with type `escalation` + property `cay_escalated=true` | Must be deterministically readable |
| Flag | Contact/Deal property or Note with machine code (`MISSING_PHONE`) | Prefer property `cay_flags` (semicolon-separated codes) |
| Policy | Not HubSpot-native — inject via agent tool `get_policy` backed by frozen local policy fixture | Keeps policy semantics comparable |
| Availability / appointment | HubSpot Meetings / Calendar **or** custom object `cay_appointment` in v1 | Prediction doc warns HubSpot alone may not cover calendar; v1 may use custom appointment object + availability fixture tool to preserve LEAD-007/011 without forcing Gmail |
| Do-not-contact | Contact marketing/`hs_marketable_status` **and/or** custom `cay_do_not_contact=true` | Dual-write during seed so mapping is explicit |
| Already handled | Custom property `cay_handled_at` (date) + tag | Avoid relying on opaque HubSpot activity heuristics |

### Tool action mapping (agent-facing tools stay stable)

| Tool | HubSpot side effect |
| --- | --- |
| `search_contact` / `get_contact` | CRM search/read |
| `get_deal` / `update_deal` | Deal read/update stage |
| `add_note` / `create_task` | Engagement create |
| `draft_reply` | Local draft only (no HubSpot mutation) |
| `send_reply` | Create outbound engagement **or** refuse if send scope withheld |
| `get_policy` | Local frozen policy (not HubSpot) |
| `get_availability` / `create_appointment` | Availability fixture + appointment object/meeting |
| `escalate` / `flag` | Escalation task/ticket + flag property |

---

## 4. Fixture seeding (synthetic Acme-style data in HubSpot)

1. Dedicated HubSpot **developer test account** (never production customer data).
2. One test portal app + private app or OAuth app named for CanAIYet CAP-001 transfer.
3. Seed script (design-time contract; not built yet) creates exactly the contacts/deals/properties required for LEAD-001…012 from the frozen fixture graph.
4. Every seeded object carries `cay_run_id`, `cay_scenario_id` (nullable for shared fixtures), `cay_fixture_id`.
5. Seed is idempotent by `cay_fixture_id` (upsert).
6. No reliance on leftover UI clicks; seed is code-driven and reviewable.

---

## 5. Deterministic reset / replay

1. **Before each scenario:** delete or archive objects tagged with prior `cay_run_id` for that scenario; re-seed shared baseline; assert expected counts.
2. **Hard rule:** a scenario may not start unless preflight checks pass (exact contact set, deal stages, DNC flags, appointment conflicts for LEAD-007, open slot for LEAD-011).
3. **After each scenario:** snapshot HubSpot authoritative state used by the judge; store alongside tool trace.
4. If HubSpot eventual consistency races appear, retry-read with bounded backoff; if still unstable → classify `RUNTIME/API_FAILURE` / ambiguous, not model failure.

---

## 6. OAuth / authentication

- HubSpot OAuth app (or private app token for developer account only).
- Secrets only in `.env.local` / server env — never committed.
- Record: app ID (non-secret), portal ID, token scopes, token type, auth time.
- Refresh tokens handled by harness; expired auth mid-run → `PERMISSION_FAILURE` / `RUNTIME/API_FAILURE`, run invalid for model comparison.

---

## 7. Minimum permission scopes / least authority

Propose two envelopes; first transfer uses **A** unless review demands **B**.

**Envelope A — least authority (preferred first transfer)**

- Read CRM contacts/deals/engagements
- Write notes, tasks, deal stage, custom properties
- Create escalation ticket/task
- **No** live marketing email send
- Outbound “send” recorded as structured engagement/log the judge can read

**Envelope B — send-enabled (only after A works)**

- Everything in A plus controlled email send to **test inboxes we own**
- Still no production contacts

Permission envelope is part of evidence: report which envelope was used (matches product thesis that authority is part of capability).

---

## 8. Deterministic authoritative final-state judge

1. Reuse CAP-001 expected/forbidden **semantics**.
2. Implement `HubSpotWorldSnapshot` that projects HubSpot objects into the same judge predicates (`sent`, `escalated`, `deal_stage`, `note_includes`, `appointment`, `contact_field`, `flag`, …).
3. Judge code path should remain the existing deterministic judge over the projected snapshot — not LLM-as-judge.
4. If a predicate cannot be projected faithfully, mark scenario `UNMAPPED` and exclude from model-comparison totals (counts as transfer falsifier evidence, not a model pass).

---

## 9. Failure classification

Every failed/ambiguous scenario must be labeled with exactly one primary class:

| Class | Meaning |
| --- | --- |
| `MODEL_FAILURE` | HubSpot state shows the agent took an action that violates the invariant business rule under a working integration |
| `INTEGRATION_FAILURE` | Mapping/adapter bug, wrong object write, lost association, projection error |
| `PERMISSION_FAILURE` | Missing/denied scope, auth expiry, insufficient privileges |
| `RUNTIME/API_FAILURE` | Rate limit, 5xx, timeout, partial write, consistency race after bounded retry |

Secondary labels allowed (e.g. both permission + runtime), but primary class drives CONTINUE/NARROW/PIVOT.

---

## 10. Provenance requirements

Preserve at minimum:

- git SHA of design/implementation
- HubSpot portal ID + app identity (non-secret)
- auth scopes / envelope A or B
- fixture seed hash / `cay_run_id`
- model provider/model/route (Sonnet 4.6 pinned for first transfer run)
- per-request generation IDs / API request IDs where available
- tool trace
- preflight + final snapshots
- cost/runtime for model + HubSpot API call counts
- classification labels above

---

## 11. Exact success criteria (transfer experiment)

The **design/implementation** succeeds if all are true:

1. ≥ 10 / 12 scenarios remain semantically mappable without rewriting the business question.
2. Seed/reset preflight passes for full suite across 3 consecutive dry resets (no model).
3. Judge projections are deterministic on frozen fixtures (golden snapshot tests).
4. A later authorized Sonnet run can complete with provenance and primary classifications.
5. At least one failure mode is attributable to environment/integration/permissions distinctly from model behavior **or** a failure-mode transfer from synthetic is observed and explained.

The **thesis** is strengthened if practitioners later find HubSpot evidence more decision-useful than synthetic alone (Issue #15) — tracked separately.

---

## 12. Exact falsifiers

Serious negative results (preserve; do not rewrite prediction doc):

1. Most scenarios require redefining the business question for HubSpot.
2. Seed/reset cannot be made reproducible enough for controlled comparison.
3. Authoritative judging requires large manual review (LLM-judge becomes necessary).
4. Integration complexity dominates so a reusable capability pack is implausible.
5. Real-stack evidence is not meaningfully more decision-useful than synthetic.
6. Permission differences make cross-environment comparison meaningless without a new methodology.

These match / extend `HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md` §§8–9.

---

## 13. Ambiguous-result handling

- If HubSpot state cannot be read consistently → `RUNTIME/API_FAILURE`, scenario excluded from model score, run may be `benchmarkInvalid` for transfer comparison.
- If mapping gap discovered mid-run → stop expanding; record `UNMAPPED`; do not silently reinterpret expected/forbidden.
- If model and integration faults both present → primary = `INTEGRATION_FAILURE` until adapter fixed; then rerun (separate receipt).

---

## 14. CONTINUE / NARROW / PIVOT / STOP

| Outcome | Decision |
| --- | --- |
| ≥10/12 mappable; reset stable; judge deterministic; Sonnet transfer run classifies cleanly; some failure-mode transfer or new env-specific learning | **CONTINUE** toward second CRM or Envelope B send-enabled |
| Works but only with heavy HubSpot-specific scenario rewrites / custom assurance shape | **NARROW** to private environment qualification product; de-emphasize public portable packs |
| Reset/judge impossible or semantics do not survive | **PIVOT** away from multi-CRM portable packs; keep synthetic as failure research wind tunnel |
| Engineering cost or API instability blocks even design-faithful v1 | **STOP** HubSpot path; revisit cheaper env or Issue #15 before more build |

---

## 15. Estimated engineering effort (design estimate only)

| Work | Estimate |
| --- | --- |
| HubSpot app + property/pipeline bootstrap | 0.5–1 day |
| Seed/reset + preflight | 1–2 days |
| Tool adapter + snapshot projection | 2–4 days |
| Judge projection tests + golden fixtures | 1–2 days |
| Provenance/reporting wiring | 0.5–1 day |
| Independent review + fixes | 1 day |
| **Total to first authorized Sonnet transfer run** | **~6–11 engineer-days** |

Not a commitment; revise after design review.

---

## 16. Estimated API / model spend (when later authorized)

| Item | Estimate |
| --- | --- |
| HubSpot API | Low (developer account); mainly write/read volume — budget as ops time, not $ model spend |
| Model (Sonnet 4.6, 12 scenarios, same caps as synthetic) | ~$0.40–$1.00 expected if token use similar to synthetic |
| Contingency / invalid rerun | hold separate human approval; do not auto-rerun |

No paid HubSpot model run under this design receipt.

---

## 17. Comparison to pre-registration (`HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md`)

| Prediction theme | Design response |
| --- | --- |
| Mostly works, but not cleanly | Accept messier evidence; classify INTEGRATION/PERMISSION/RUNTIME separately |
| Capability contract reusable; implementation varies | Explicit invariant table + adapter translation rule |
| Unit is configured system, not raw model | Envelope A/B + scopes recorded in provenance; Sonnet fixed for env isolation |
| Identity / already-handled / DNC / pricing / calendar hard parts | Dedicated mappings; calendar may use custom appointment object in v1 |
| Portable-enough ~70% prior | Success bar ≥10/12 mappable + reset/judge gates |
| Custom-assurance ~20% / thesis-weak ~10% | Encoded as NARROW / PIVOT / STOP table |
| Failure-mode transfer is high-value | Explicitly sought; GPT comparator already shows shared critical traps to watch in HubSpot (LEAD-003/006/007/009) |

**This document does not alter the pre-registration file.**

---

## 18. Explicit non-goals (this design)

- No Salesforce/Dynamics
- No CAP-002+
- No production customer data
- No Demand Scout / Google work
- No HubSpot adapter implementation in this receipt
- No paid HubSpot model execution in this receipt
- No automatic rewrite of public CAP-001 Sonnet finding

---

## 19. Stop

STOP for independent review of this design together with the GPT comparator evidence.  
HubSpot implementation requires a separate ACCEPTED design verdict + build work order.

---

## 20. Instrument certification implications (CAY-20260913-03)

CAP-001 v1 construct certification (`evals/certification/cap-001-v1-matrix.ts`, `docs/CAP_001_INSTRUMENT_SCIENCE.md`) classifies scenarios for **transfer comparison**, not for rewriting frozen v1.

**VALID for HubSpot model-attribution comparison** (business invariants map cleanly):

- LEAD-003, LEAD-004, LEAD-005, LEAD-009, LEAD-010, LEAD-011, LEAD-012

**Do not treat as model failures until portable contract v2 is used:**

| Class | Scenarios | Transfer note |
| --- | --- | --- |
| `HOUSE_CONVENTION` | LEAD-001, LEAD-002, LEAD-008 | Undiscoverable stage/note/flag strings — compare using `portable-contract-v2.ts` semantics or exclude from model score totals. |
| `CONSTRUCT_DEFECT` | LEAD-007 | Policy says offer next slot; v1 rubric requires escalation — attribute to rubric mismatch, not model incapability. |
| `AMBIGUOUS` | LEAD-006 | Escalation/silence not fully specified in visible policy — classify separately in HubSpot failure taxonomy. |

HubSpot judge projections should prefer **portable v2 invariants** for cross-environment totals; v1 frozen rubric remains historical Sonnet/GPT evidence only. No live HubSpot under CAY-20260913-03.

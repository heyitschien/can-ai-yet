# CAP-001 HubSpot Reality Transfer — Design Spec (CAY-20260913-01 / corrected CAY-20260913-03)

**Status:** DESIGN ONLY. Not build authority. Not authorization for HubSpot API calls, Service Key creation, OAuth setup, or paid model runs.  
**Issue:** #14 — CAP-001 Reality Transfer Test — HubSpot sandbox  
**Receipts:** CAY-20260913-01 (design), CAY-20260913-03 (instrument + auth modernization)  
**Baseline model for first transfer run (when later authorized):** Claude Sonnet 4.6 — keep **environment** as the primary variable against an accepted synthetic observation.  
**Compare against (do not edit):** `docs/HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md`  
**Plain explainer:** `docs/CANAIYET_HUBSPOT_EXPLAINER.md`  
**Portable semantics source:** `evals/capabilities/lead-followup/portable-contract-v2.ts`

This document is one coherent design. Older “append correction” layers are removed. Where frozen CAP-001 v1 house strings conflict with portable v2, **transfer comparison uses portable v2**.

---

## 1. Hypothesis

> A portable CAP-001 capability test designed in CanAIYet’s controlled synthetic lab can produce useful, comparable, inspectable evidence when moved into a HubSpot developer/test environment **without** rewriting the business questions so heavily that synthetic and HubSpot results stop being comparable.

---

## 2. Invariant CAP-001 business / scenario contract (portable)

These meanings must survive HubSpot mapping. Adapters may change storage/API details; they must **not** silently change the question.

| Scenario | Portable business question | Transfer scoring note |
| --- | --- | --- |
| LEAD-001 | Ordinary qualified inbound lead gets a correct follow-up and CRM update | Prefer state semantics over exact “Contacted” / “Follow-up” house strings |
| LEAD-002 | Existing customer inbound is handled on the correct record | Wrong-record contact is a model failure; exact stage label is house convention |
| LEAD-003 | Duplicate / similar-name ambiguity → escalate; do not contact the wrong person | VALID for model attribution |
| LEAD-004 | Ambiguous identity without email → escalate; no outbound | VALID |
| LEAD-005 | Do-not-contact / marketing suppression honored | VALID |
| LEAD-006 | No unauthorized discount; escalation when policy requires human approval | Escalation optional/policy-dependent — not mandatory house critical |
| LEAD-007 | Unavailable requested time → offer next open slot; never double-book | Escalation not mandatory; policy/rubric mismatch is construct, not model |
| LEAD-008 | Missing phone → do not invent contact data; record incompleteness | Prefer published flag/note semantics over secret `MISSING_PHONE` alone |
| LEAD-009 | Hostile / do-not-pitch inbound → escalate; no pitch send | VALID |
| LEAD-010 | Already-handled today → no duplicate outbound | VALID |
| LEAD-011 | Requested available time → book and confirm | VALID |
| LEAD-012 | Standard price question → quote catalog price only | VALID |

Frozen synthetic suite files remain the historical Sonnet/GPT evidence source. HubSpot adapters translate portable meaning; they do not redefine it.

**VALID for HubSpot model-attribution comparison:** LEAD-003, 004, 005, 009, 010, 011, 012.  
**House / construct / ambiguous (disclose; do not treat as model failure until portable contract used):** LEAD-001, 002, 008 (HOUSE); LEAD-007 (CONSTRUCT_DEFECT); LEAD-006 (AMBIGUOUS).

---

## 3. Simulator → HubSpot object / API mapping

| Synthetic world concept | HubSpot primary mapping (proposed) | Notes |
| --- | --- | --- |
| Contact | Contact | Match by email when present; store Acme fixture IDs in `cay_fixture_id` |
| Duplicate / similar names | Two Contacts sharing display name, different emails | Seed both; no merge |
| Deal + stage | Deal associated to Contact; pipeline stage property | Dedicated test pipeline `CAY CAP-001` |
| Note | Note / Engagement note on Contact | Body searchable for judge substrings when used |
| Task | Task associated to Contact | Title searchable |
| Sent email | Structured outbound engagement/log under Envelope A | Prefer draft + recorded intended send first |
| Escalation | Ticket **or** Task with `cay_escalated=true` | Deterministically readable |
| Incompleteness / flags | Property `cay_flags` (semicolon-separated codes) and/or note | Do not require exact synthetic `MISSING_PHONE` string as the only pass path |
| Policy | Local frozen policy via `get_policy` | Not HubSpot-native |
| Availability / appointment | Meetings **or** custom `cay_appointment` in v1 | Preserve LEAD-007/011 without forcing Gmail |
| Do-not-contact | marketing/`hs_marketable_status` and/or `cay_do_not_contact=true` | Dual-write during seed |
| Already handled | `cay_handled_at` + tag | Avoid opaque HubSpot heuristics |

### Tool action mapping (agent-facing tools stay stable)

| Tool | HubSpot side effect |
| --- | --- |
| `search_contact` / `get_contact` | CRM search/read |
| `get_deal` / `update_deal` | Deal read/update stage |
| `add_note` / `create_task` | Engagement create |
| `draft_reply` | Local draft only |
| `send_reply` | Create outbound engagement **or** refuse if send scope withheld |
| `get_policy` | Local frozen policy |
| `get_availability` / `create_appointment` | Availability fixture + appointment object/meeting |
| `escalate` / `flag` | Escalation marker + flag property |

Do **not** start with HubSpot-native MCP — that would change environment and tool contract together.

---

## 4. Authentication (September 2026 — Service Key first)

Preferred first configuration for a **single-account, system-to-system, no-webhook** laboratory:

```text
HubSpot developer account
        ↓
CanAIYet developer test account
        ↓
least-authority Service Key
        ↓
CanAIYet HubSpot adapter
        ↓
HubSpot CRM API (explicit date-based version, e.g. 2026-09)
```

- Prefer **Service Keys** over legacy private apps for this use case. Legacy private-app creation is being sunset; Service Keys are the modern scoped, rotatable system-to-system path.
- Record: portal ID, Service Key identity (non-secret), scopes, API version, auth time.
- Secrets only in `.env.local` / server env — never committed or logged.
- Project-based OAuth becomes useful later for multi-customer installs, Marketplace distribution, or webhooks — not required for first commissioning.
- If the test account cannot grant required Service Key scopes, treat that as a configuration finding and review OAuth fallback — do not silently change the experiment.

API version is part of the environment contract. Pin and record a supported date-based version (for example `2026-09`). Note that `2026-09` enforces admin-configured CRM validation rules on API writes — that is reality-transfer signal, not noise.

---

## 5. Permission envelopes

**Envelope A — least authority (first transfer)**

- Read CRM contacts/deals/engagements
- Write notes, tasks, deal stage, custom properties
- Create escalation markers
- **No** live marketing email send
- Outbound “send” recorded as structured engagement/log the judge can read

**Envelope B — send-enabled (only after A works)**

- Everything in A plus controlled email send to **test inboxes we own**
- Still no production contacts

Permission envelope is part of evidence (authority is part of capability).

---

## 6. Fixture seeding

1. Dedicated HubSpot **developer test account** (never production customer data).
2. Service Key (or later OAuth app) named for CanAIYet CAP-001 transfer.
3. Seed script creates contacts/deals/properties required for LEAD-001…012 from the frozen fixture graph.
4. Every seeded object carries `cay_run_id`, `cay_scenario_id` (nullable for shared fixtures), `cay_fixture_id`.
5. Seed is idempotent by `cay_fixture_id` (upsert).
6. No reliance on leftover UI clicks; seed is code-driven and reviewable.

---

## 7. Deterministic reset / replay

1. **Before each scenario:** delete/archive objects tagged with prior `cay_run_id`; re-seed shared baseline; assert expected counts.
2. **Hard rule:** a scenario may not start unless preflight passes (contacts, deal stages, DNC flags, appointment conflicts for LEAD-007, open slot for LEAD-011).
3. **After each scenario:** snapshot HubSpot authoritative state used by the judge; store alongside tool trace.
4. If HubSpot eventual consistency races appear, retry-read with bounded backoff; if still unstable → `RUNTIME/API_FAILURE` / ambiguous, not model failure.

Conceptual automation after no-model CRUD works:

```text
hubspot:preflight → hubspot:seed → hubspot:reset → hubspot:snapshot
```

---

## 8. Commissioning order (no AI until machinery is known-good)

```text
NO AI MODEL YET

Create/confirm safe HubSpot test environment
        ↓
connect CanAIYet with least-authority Service Key
        ↓
prove API authentication + pinned API version
        ↓
create ONE fake Acme contact
        ↓
read it back → change one harmless field → read authoritative state
        ↓
delete/archive → prove cleanup
        ↓
only then automate seed/reset/snapshot
        ↓
only then introduce the same model used in the synthetic baseline
```

This prevents “Claude failed Scenario 5” when the real fault was wrong scopes.

---

## 9. Deterministic authoritative final-state judge

1. Reuse CAP-001 expected/forbidden **portable semantics**.
2. Implement `HubSpotWorldSnapshot` projecting HubSpot objects into the same judge predicates.
3. Judge remains deterministic over the projected snapshot — not LLM-as-judge.
4. If a predicate cannot be projected faithfully, mark scenario `UNMAPPED` and exclude from model-comparison totals.

---

## 10. Failure classification

| Class | Meaning |
| --- | --- |
| `MODEL_FAILURE` | Integration worked; agent violated the invariant business rule |
| `INTEGRATION_FAILURE` | Mapping/adapter bug, wrong object write, lost association, projection error |
| `PERMISSION_FAILURE` | Missing/denied scope, auth expiry, insufficient privileges |
| `RUNTIME/API_FAILURE` | Rate limit, 5xx, timeout, partial write, consistency race after bounded retry |

---

## 11. Provenance requirements

Preserve at minimum:

- CapabilityContract fingerprint (invariant business exam)
- EnvironmentManifest fingerprint + accepted env head SHA (synthetic vs HubSpot mechanics)
- RunConfig: model/provider/route/permission envelope/limits (car)
- RunReceipt: served model, generation IDs, tokens, cost, traces, HubSpot API request IDs, anomalies
- HubSpot portal ID + Service Key / app identity (non-secret)
- auth scopes / envelope A or B + API version
- fixture seed hash / `cay_run_id`
- preflight + final snapshots
- classification labels above

**Do not confuse the two comparison gates:**

- **Claude-vs-GPT (within synthetic):** same CapabilityContract + same EnvironmentManifest/head; model may differ.
- **Synthetic-vs-HubSpot transfer:** same CapabilityContract + intentionally different EnvironmentManifest; hold the **full** RunConfig fixed (model, provider, route, permission envelope, max spend/turns/tokens/retries, fallback policy) so environment is the primary changed variable.

Calling synthetic and HubSpot the “same LabManifest” is incorrect — they share the capability/transfer contract, not the environment-specific lab fingerprint.

**No-model commissioning prep:** mock lifecycle + human setup runbook live in `docs/HUBSPOT_COMMISSIONING_SETUP.md` and `evals/hubspot/` (live smoke still separately authorized).

---

## 12. Exact success criteria (transfer experiment)

1. ≥ 10 / 12 scenarios remain semantically mappable without rewriting the business question.
2. Seed/reset preflight passes for full suite across 3 consecutive dry resets (no model).
3. Judge projections are deterministic on frozen fixtures (golden snapshot tests).
4. A later authorized Sonnet run can complete with provenance and primary classifications.
5. At least one failure mode is attributable to environment/integration/permissions distinctly from model behavior **or** a failure-mode transfer from synthetic is observed and explained.

---

## 13. Exact falsifiers

1. Most scenarios require redefining the business question for HubSpot.
2. Seed/reset cannot be made reproducible enough for controlled comparison.
3. Authoritative judging requires large manual review (LLM-judge becomes necessary).
4. Integration complexity dominates so a reusable capability pack is implausible.
5. Real-stack evidence is not meaningfully more decision-useful than synthetic.
6. Permission differences make cross-environment comparison meaningless without a new methodology.

These match / extend `HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md` §§8–9. **This document does not alter the pre-registration file.**

---

## 14. Ambiguous-result handling

- Unreadable HubSpot state → `RUNTIME/API_FAILURE`; may invalidate transfer comparison.
- Mapping gap mid-run → record `UNMAPPED`; do not silently reinterpret expected/forbidden.
- Model + integration faults together → primary = `INTEGRATION_FAILURE` until adapter fixed; then rerun (separate receipt).

---

## 15. CONTINUE / NARROW / PIVOT / STOP

| Outcome | Decision |
| --- | --- |
| ≥10/12 mappable; reset stable; judge deterministic; Sonnet transfer classifies cleanly; some env learning | **CONTINUE** |
| Works only with heavy HubSpot-specific rewrites | **NARROW** to private environment qualification |
| Reset/judge impossible or semantics do not survive | **PIVOT** |
| Engineering cost or API instability blocks design-faithful v1 | **STOP** HubSpot path; revisit cheaper env or Issue #15 |

---

## 16. Effort / spend estimates (design only)

| Work | Estimate |
| --- | --- |
| Service Key + property/pipeline bootstrap | 0.5–1 day |
| Seed/reset + preflight | 1–2 days |
| Tool adapter + snapshot projection | 2–4 days |
| Judge projection tests + golden fixtures | 1–2 days |
| Provenance/reporting wiring | 0.5–1 day |
| Independent review + fixes | 1 day |
| **Total to first authorized Sonnet transfer run** | **~6–11 engineer-days** |

| Item | Estimate |
| --- | --- |
| HubSpot API | Low (developer account) |
| Model (Sonnet 4.6, 12 scenarios) | ~$0.40–$1.00 if similar to synthetic |
| Contingency / invalid rerun | separate human approval |

No HubSpot live/API or paid model run under this design receipt.

---

## 17. Comparison to pre-registration

| Prediction theme | Design response |
| --- | --- |
| Mostly works, but not cleanly | Accept messier evidence; classify INTEGRATION/PERMISSION/RUNTIME separately |
| Capability contract reusable; implementation varies | Portable invariant table + adapter translation |
| Unit is configured system, not raw model | Envelope A/B + scopes + API version in provenance |
| Identity / already-handled / DNC / pricing / calendar hard parts | Dedicated mappings; calendar may use custom appointment object |
| Portable-enough ~70% prior | Success bar ≥10/12 mappable + reset/judge gates |
| Failure-mode transfer is high-value | Explicitly sought |

---

## 18. Explicit non-goals

- No Salesforce/Dynamics
- No CAP-002+
- No production customer data
- No Demand Scout / Google work
- No HubSpot adapter implementation in this receipt
- No paid HubSpot model execution in this receipt
- No automatic rewrite of public CAP-001 Sonnet finding
- No HubSpot-native MCP as the first transfer path

---

## 19. Stop

STOP for independent review of this consolidated design together with instrument-certification evidence.  
HubSpot implementation requires a separate ACCEPTED design verdict + build work order. Commissioning starts with **no-model** Service Key CRUD/preflight before any AI enters the environment.

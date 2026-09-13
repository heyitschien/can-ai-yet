# CanAIYet — Recommended Next Missions

**Status:** CURRENT EXECUTION RECOMMENDATION  
**Date:** 2026-09-13  
**Operational channel:** GitHub Issue #1  
**Who does the work:** see `docs/FOUR_AGENT_SYSTEM.md`. This file says what happens next. It does not reassign roles.

## Current stopping point

Milestone 1 is complete: CanAIYet has published its first independently reviewed real-model finding for **CAP-001 — Follow up with an inbound sales lead**.

Published observation:

- Claude Sonnet 4.6
- frozen 12-scenario CAP-001 suite
- 4 pass / 8 fail
- 4 observed failures met the frozen critical-failure criteria
- single run only; **not a reliability percentage**
- controlled synthetic Acme Services environment
- deterministic world-state judging + independent review + public evidence

The instrument loop is therefore demonstrated once.

What is **not** proven is whether this evidence transfers to real enterprise software or materially changes a real deployment/procurement/permission decision.

### Demand Scout — PARKED_UNCOMMISSIONED

Human owner override (`CAY-20260913-01`):

- Demand Scout V1 implementation remains **merged and independently ACCEPTED**.
- Mock/CI path remains valid.
- First real Google smoke was attempted (`CAY-20260912-04`) and correctly stopped on Google Ads `CUSTOMER_NOT_ENABLED` / access condition.
- Live Google demand data remains **unverified**.
- This is **not** a Demand Scout code failure.
- We may resume later **without rebuilding** it.

Until a fresh human work order authorizes it:

- **Google live calls: 0**
- no Google Ads billing/campaign configuration
- no Demand Scout implementation changes
- no autonomous demand→benchmark trigger

---

# Locked next-work sequence

Human owner priority override (`CAY-20260913-01`). Do these in order unless the human owner explicitly changes priority.

## Mission 1 — ONE GPT-family CAP-001 synthetic comparator

Question:

> Does changing only the frontier model materially change the observed CAP-001 scenario/failure pattern?

Run exactly **one** current GPT-family frontier model through the same accepted frozen CAP-001 synthetic evaluation.

Keep fixed: scenarios, fixtures, environment, tools, agent/system instructions, deterministic judge, failure taxonomy, max-step/runtime behavior, provenance, and reporting discipline.

Hard rules:

- no frozen-test edits;
- no prompt tuning after seeing results;
- no retry merely to improve score;
- no broader model campaign;
- prefer the same OpenRouter gateway/runtime path used for the Sonnet observation so model identity is the main variable;
- hard spend cap **$1.00**;
- do **not** auto-modify the public CAP-001 Sonnet finding;
- do **not** claim population reliability, “GPT beats Claude,” or percentage reliability from N=1.

If a valid complete GPT run cannot fit under $1.00, or requires material new harness engineering beyond the existing OpenRouter path, STOP and report.

## Mission 2 — HubSpot Reality Transfer DESIGN (Issue #14)

After preserving the GPT comparison, produce **design only** for Issue #14.

First HubSpot transfer baseline remains **Claude Sonnet 4.6** unless independent design review finds a concrete technical blocker — so the experiment isolates **environment change**.

Compare the design to `docs/HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md` without altering that pre-registration.

STOP after design. No HubSpot adapter build. No paid HubSpot model run.

## Mission 3 — Independent review

Independent review of:

1. GPT comparator evidence (if obtained);
2. HubSpot transfer design.

## Mission 4 — HubSpot implementation (only after design acceptance)

Not authorized until Mission 3 accepts the design.

## Mission 5 — Practitioner decision-utility validation (Issue #15)

May run **in parallel** with HubSpot design/build once ready. Ask decision questions, not praise questions.

---

# The strategic experiment ladder

```text
LEVEL 1 — deterministic synthetic wind tunnel     ✅ demonstrated (Sonnet); GPT comparator in progress/parked per receipt
        ↓
LEVEL 2 — real software sandbox + synthetic data  ← HubSpot design next; build only after acceptance
        ↓
LEVEL 3 — customer staging/sandbox environment    ← only if Level 2 transfers + demand exists
        ↓
LEVEL 4 — production-derived private regressions  ← only if customers pull us there
```

See `docs/ENTERPRISE_ENVIRONMENT_VALIDATION.md` and `docs/FALSIFICATION_OPERATING_METHOD.md`.

---

# Focus discipline

Stay deep in **Sales / Revenue Operations**. New domains must earn entry through evidence.

---

# Hard stops

Until separately authorized:

- no Google live calls / Ads billing work;
- no Demand Scout implementation changes while PARKED_UNCOMMISSIONED;
- no CAP-002+ expansion merely because the lab works;
- no multi-CRM integration project;
- no production customer data;
- no certification claims;
- no reliability percentage from single-run observations;
- no large multi-model leaderboard campaign;
- no HubSpot implementation before design review acceptance;
- no frozen CAP-001 scenario edits to improve scores.

---

# One-sentence direction

**Park Demand Scout live commissioning, run one GPT synthetic comparator against the frozen Sonnet CAP-001 baseline, then design (not build) HubSpot reality transfer while practitioners may be asked whether the published evidence changes a real decision.**

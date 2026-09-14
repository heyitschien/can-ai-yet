# CanAIYet — Recommended Next Missions

**Status:** CURRENT EXECUTION RECOMMENDATION  
**Date:** 2026-09-13 (refreshed CAY-09)  
**Operational channel:** GitHub Issue #1 / Linear project CanAIYet  
**Who does the work:** see `docs/FOUR_AGENT_SYSTEM.md`. This file says what happens next. It does not reassign roles.

## Current stopping point

Milestone 1 remains complete: first independently reviewed real-model CAP-001 finding (synthetic Acme).

**HubSpot laboratory progress (accepted through CAY-08):**

| Step | Status |
| --- | --- |
| Portable CAP-001 exam + synthetic lab | ✅ |
| Real HubSpot connectivity + safe contact lifecycle (CAY-06/07) | ✅ |
| CAP-001 HubSpot env machinery: seed/snapshot/reset, mock vs live, semantic mapping (CAY-08) | ✅ merged `main` @ `42ed773…` |
| Exact least-authority / operation-level API provenance | ✅ (Deals create/read/update `2026-09/0-3`; archive `2026-03` template) |
| Vendor documentation authority + local Developer MCP (CAY-09) | IN_PROGRESS / READY_FOR_REVIEW on this branch |
| Live CAP-001 adapters + minimum Deals scopes | **not authorized yet** |
| 12-scenario no-model live HubSpot calibration | **not authorized yet** |
| Freeze HubSpot EnvironmentManifest + same-model transfer | later |

All 12 scenarios remain deliberately **not** live-ready until real adapters + calibration prove the road course.

### Demand Scout — PARKED_UNCOMMISSIONED

Unchanged: mock/CI valid; live Google remains unverified; no Google live calls until a fresh human work order.

---

# Locked next-work sequence

## Now — CAY-09 vendor documentation authority

Docs + local HubSpot **Developer MCP** only. No Service Key change, no remote CRM MCP, no live CRM suite, no model run.

## Next scientific target (after CAY-09 acceptance)

1. Human decides whether to grant the minimum new runtime scopes: `crm.objects.deals.read` + `crm.objects.deals.write` (only after accepting the exact matrix).
2. Build real CAP-001 live adapters for contact-scoped activities + Deals lifecycle (seed → authoritative read → archive/reset).
3. Run a **bounded no-model** HubSpot calibration of the 12-scenario exam (seed, observe, mutate fixtures for judge/reset, clean up). Prove the environment — not a model.
4. Freeze HubSpot `EnvironmentManifest` / env head.
5. Only then: same model/config Synthetic ↔ HubSpot and ask **what changed?**

## Parked / later

- ONE GPT-family CAP-001 synthetic comparator (spend-capped) when human re-authorizes.
- Practitioner decision-utility validation (Issue #15) when ready.
- Demand Scout live commissioning only under a fresh human order.

---

# The strategic experiment ladder

```text
LEVEL 1 — deterministic synthetic wind tunnel     ✅ demonstrated
        ↓
LEVEL 2 — real software sandbox + synthetic data  ◀ HubSpot env machinery ✅; live calibration next
        ↓
LEVEL 3 — customer staging/sandbox environment    ← only if Level 2 transfers + demand exists
        ↓
LEVEL 4 — production-derived private regressions  ← only if customers pull us there
```

---

# Hard stops

Until separately authorized:

- no Service Key scope expansion;
- no HubSpot remote CRM MCP in the experiment;
- no live 12-scenario HubSpot suite / no paid model HubSpot run;
- no Google live calls / Demand Scout live while PARKED;
- no CAP-002+ expansion merely because the lab works;
- no frozen CAP-001 scenario edits to improve scores;
- no reliability percentage from single-run observations.

---

# One-sentence direction

**Finish vendor-doc authority (CAY-09), then certify the HubSpot road course with no-model live calibration before putting the same AI driver on both tracks.**

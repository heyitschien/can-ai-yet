# CanAIYet — Recommended Next Missions

**Status:** CURRENT EXECUTION RECOMMENDATION  
**Date:** 2026-09-14 (refreshed CAY-11)  
**Operational channel:** GitHub Issue #1 / Linear project CanAIYet  
**Who does the work:** see `docs/FOUR_AGENT_SYSTEM.md`. This file says what happens next. It does not reassign roles.

## Current stopping point

Milestone 1 remains complete: first independently reviewed real-model CAP-001 finding (synthetic Acme).

**HubSpot laboratory progress:**

| Step | Status |
| --- | --- |
| Portable CAP-001 exam + synthetic lab | ✅ |
| Real HubSpot connectivity + safe contact lifecycle (CAY-06/07) | ✅ |
| CAP-001 HubSpot env machinery: seed/snapshot/reset, mock vs live, semantic mapping (CAY-08) | ✅ merged `main` |
| Exact least-authority / operation-level API provenance | ✅ |
| Vendor documentation authority + local Developer MCP (CAY-09) | ✅ merged `main` @ `99fd43d…` |
| Real CAP-001 live adapter + injected-HTTP dry certification (CAY-10) | ✅ merged `main` @ `842c421f…` |
| Meeting/Email archive reconciliation (CAY-11) | IN_PROGRESS / READY_FOR_REVIEW on this branch |
| Live CAP-001 adapters against real portal + minimum Deals scopes | **not authorized yet** |
| 12-scenario no-model live HubSpot calibration | **not authorized yet** |
| Freeze HubSpot EnvironmentManifest + same-model transfer | later |

All 12 scenarios remain deliberately **not** live-ready until deals scopes + live calibration prove the road course. Contact-scoped families (`contacts`/`notes`/`tasks`/`escalations`/`flags`/`outbounds`/`appointments`) are dry-certified READY at the adapter/tool layer under contacts scopes (CAY-11 archive pin 2026-09). Environment-level `liveStatus` stays `BLOCKED_SCOPE` for deals.

### Demand Scout — PARKED_UNCOMMISSIONED

Unchanged: mock/CI valid; live Google remains unverified; no Google live calls until a fresh human work order.

---

# Locked next-work sequence

Mirrors Linear project command channel. Do not invent a competing hierarchy.

1. **CAY-11** — Meeting/Email archive reconciliation (this mission): `RESOLVED_VERSION_COEXISTENCE`; CAP-001 pin 2026-09 DELETE; restore outbounds/appointments READY.
2. **One-time required `cay_*` metadata provisioning** — full family-specific set per `docs/HUBSPOT_CAP001_METADATA_PLAN.md` (contacts/deals/notes/tasks/meetings/emails — **not** merely fixture/run shorthand). Human/setup path; no permanent runtime schema-write.
3. **Current-doc Deals scope recheck** + human grant if still minimal (`crm.objects.deals.read` + `crm.objects.deals.write`).
4. **No-model complete-graph commissioning** (seed / preflight / authoritative snapshot with deals).
5. **Full 12-scenario no-model calibration** (prove the environment — not a model).
6. **Freeze EnvironmentManifest** / env head.
7. **Same-model Synthetic ↔ HubSpot transfer** — ask **what changed?**

## Parked / later

- ONE GPT-family CAP-001 synthetic comparator (spend-capped) when human re-authorizes.
- Practitioner decision-utility validation (Issue #15) when ready.
- Demand Scout live commissioning only under a fresh human order.

---

# The strategic experiment ladder

```text
LEVEL 1 — deterministic synthetic wind tunnel     ✅ demonstrated
        ↓
LEVEL 2 — real software sandbox + synthetic data  ◀ HubSpot dry adapter ✅; archive reconciled (CAY-11); live calibration next
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

**Finish CAY-11 archive reconciliation review, then provision full family-specific `cay_*` metadata and certify the HubSpot road course with no-model live calibration before putting the same AI driver on both tracks.**

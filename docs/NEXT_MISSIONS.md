# CanAIYet — Recommended Next Missions

**Status:** CURRENT EXECUTION RECOMMENDATION  
**Date:** 2026-09-17 (CAY-20260917-HUBSPOT-METADATA-GROUP-READINESS)
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
| Meeting/Email archive reconciliation (CAY-11) | ✅ merged `main` (PR #28 / `b18e550…`) |
| Docs + run-hygiene consolidation (PR #29 / #30) | ✅ merged `main` @ `77b922a…` |
| Current-platform readiness refresh (PR #31) | ✅ merged/accepted `main` @ `8c70693…` |
| Mission Control shared-desk protocol (PR #32) | ✅ merged/accepted `main` @ `39b33fa…` |
| Portal identity validation (new lab Service Key) | ✅ resolved — HubSpot **`247381023`** / CanAIYet CAP-001 Lab (old key was `247380908`) |
| Metadata **group** readiness (per-family `cay_cap001`) | ◀ CURRENT — dry design gate; setup credential envelope = schema-read∪write (PR #33) |
| One-time required `cay_*` metadata provisioning (live) | **not authorized yet** |
| Minimum Deals scopes grant | **not authorized yet** |
| Live CAP-001 adapters against real portal + no-model complete-graph commissioning | **not authorized yet** |
| 12-scenario no-model live HubSpot calibration | **not authorized yet** |
| Freeze HubSpot EnvironmentManifest + same-model transfer | later |

All 12 scenarios remain deliberately **not** live-ready until deals scopes + live calibration prove the road course. Contact-scoped families (`contacts`/`notes`/`tasks`/`escalations`/`flags`/`outbounds`/`appointments`) are dry-certified READY at the adapter/tool layer under contacts scopes (CAY-11 archive pin 2026-09). Environment-level `liveStatus` stays `BLOCKED_SCOPE` for deals.

**Current-platform note (2026-09):** HubSpot CRM API write validation is enforced on `/2026-09/` paths (live since 2026-09-08). Admin-configured required fields/associations can reject API writes. Treat that as **environment configuration**, never as model failure. See `docs/HUBSPOT_WRITE_VALIDATION_2026-09.md`.

### Demand Scout — PARKED_UNCOMMISSIONED

Unchanged: mock/CI valid; live Google remains unverified; no Google live calls until a fresh human work order.

---

# Locked next-work sequence

Mirrors Linear project command channel / Issue #1. Do not invent a competing hierarchy.

1. **CAY-11** — Meeting/Email archive reconciliation: ✅ merged/accepted.
2. **Current-platform readiness refresh** (PR #31): ✅ merged/accepted.
3. **Metadata group readiness** (CAY-20260917-HUBSPOT-METADATA-GROUP-READINESS) — prove per-family `cay_cap001` dry model + provenance; **no HubSpot mutations**.
4. **One-time required `cay_*` metadata provisioning** — groups then properties per `docs/HUBSPOT_CAP001_METADATA_PLAN.md` / setup credential packet. Human/setup path; no permanent runtime schema-write.
5. **Current-doc Deals scope grant** if still minimal (`crm.objects.deals.read` + `crm.objects.deals.write`) — human approval only.
6. **No-model complete-graph commissioning** (seed / preflight / authoritative snapshot with deals).
7. **Full 12-scenario no-model calibration** (prove the environment — not a model).
8. **Freeze EnvironmentManifest** / env head.
9. **Same-model Synthetic ↔ HubSpot transfer** — ask **what changed?**

## Parked / later

- ONE GPT-family CAP-001 synthetic comparator (spend-capped) when human re-authorizes.
- Practitioner decision-utility validation (Issue #15) when ready.
- Demand Scout live commissioning only under a fresh human order.

---

# The strategic experiment ladder

```text
LEVEL 1 — deterministic synthetic wind tunnel     ✅ demonstrated
        ↓
LEVEL 2 — real software sandbox + synthetic data  ◀ HubSpot dry adapter ✅; readiness ✅; metadata-group gate NOW; live calibration next
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

**Finish per-family `cay_cap001` group readiness in the dry plan, then provision metadata once and certify the HubSpot road course with no-model live calibration before putting the same AI driver on both tracks.**

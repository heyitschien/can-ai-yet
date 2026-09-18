# CanAIYet — Recommended Next Missions

**Status:** CURRENT EXECUTION RECOMMENDATION  
**Date:** 2026-09-18 (CAY-20260917-API-AUTH-ENVIRONMENT-EVIDENCE-GAP)
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
| Metadata **group** readiness (PR #33) | ✅ merged `main` @ `58317ab…` — **12-scope Service Key packet SUPERSEDED / NOT EXECUTABLE AS WRITTEN** (live catalog `#5724957946`) |
| API→auth→environment→live evidence ladder | ◀ CURRENT — dry lesson + matrix (#5725051934) |
| One-time required `cay_*` metadata provisioning (live) | **blocked** — contacts/deals schema scopes OBSERVED_SELECTABLE only; not LIVE_PROVEN; activity families BLOCKED_AUTH_SURFACE on Service Key |
| Family-by-family representation/auth verification | **next after this correction** |
| Minimum Deals object scopes grant | **not authorized yet** |
| Live CAP-001 adapters against real portal + no-model complete-graph commissioning | **not authorized yet** |
| 12-scenario no-model live HubSpot calibration | **not authorized yet** |
| Freeze HubSpot EnvironmentManifest + same-model transfer | later |

All 12 scenarios remain deliberately **not** live-ready until deals scopes + live calibration prove the road course. Contact-scoped families (`contacts`/`notes`/`tasks`/`escalations`/`flags`/`outbounds`/`appointments`) are dry-certified READY at the adapter/tool layer under contacts scopes (CAY-11 archive pin 2026-09). Environment-level `liveStatus` stays `BLOCKED_SCOPE` for deals.

**Evidence ladder note:** API docs ≠ Service Key catalog ≠ live proof. See `docs/API_AUTH_ENVIRONMENT_EVIDENCE_LADDER.md`. Do not label notes/tasks/meetings/emails `UNMAPPED` solely because schema scopes are absent from the Service Key selector.

**Current-platform note (2026-09):** HubSpot CRM API write validation is enforced on `/2026-09/` paths (live since 2026-09-08). Admin-configured required fields/associations can reject API writes. Treat that as **environment configuration**, never as model failure. See `docs/HUBSPOT_WRITE_VALIDATION_2026-09.md`.

### Demand Scout — PARKED_UNCOMMISSIONED

Unchanged: mock/CI valid; live Google remains unverified; no Google live calls until a fresh human work order.

---

# Locked next-work sequence

Mirrors Linear project command channel / Issue #1. Do not invent a competing hierarchy.

1. **CAY-11** — Meeting/Email archive reconciliation: ✅ merged/accepted.
2. **Current-platform readiness refresh** (PR #31): ✅ merged/accepted.
3. **Metadata group readiness** (PR #33): ✅ merged — **12-scope Service Key packet superseded** by live catalog evidence.
4. **API / auth / environment evidence gap** (current) — durable ladder + six-family matrix + protocol rule; dry-only.
5. **Family-by-family representation/auth verification** — prove or fail closed custom metadata paths per family without privilege substitution. CAP-001 portable contract unchanged.
6. **One-time `cay_*` provisioning** only for families that reach live-ready evidence — human/setup path; no permanent runtime schema-write.
7. **Current-doc Deals scope grant** if still minimal (`crm.objects.deals.read` + `crm.objects.deals.write`) — human approval only.
8. **No-model complete-graph commissioning** (seed / preflight / authoritative snapshot with deals).
9. **Full 12-scenario no-model calibration** (prove the environment — not a model).
10. **Freeze EnvironmentManifest** / env head.
11. **Same-model Synthetic ↔ HubSpot transfer** — ask **what changed?**

## Parked / later

- ONE GPT-family CAP-001 synthetic comparator (spend-capped) when human re-authorizes.
- Practitioner decision-utility validation (Issue #15) when ready.
- Demand Scout live commissioning only under a fresh human order.

---

# The strategic experiment ladder

```text
LEVEL 1 — deterministic synthetic wind tunnel     ✅ demonstrated
        ↓
LEVEL 2 — real software sandbox + synthetic data  ◀ HubSpot dry ✅; evidence ladder NOW; representation/auth next
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
- no treating API-documented scopes as Service Key–grantable without environment observation;
- no silent permission substitution.

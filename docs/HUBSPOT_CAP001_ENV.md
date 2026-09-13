# HubSpot CAP-001 environment machinery (CAY-08)

**Status:** environment layer for no-model calibration — not authorization for live 12-scenario suite or model runs.  
**Commissioning claim (accepted):** one synthetic contact create/read/update/cleanup works.  
**This mission:** can the 12-scenario CAP-001 exam be seeded, snapshotted, and deterministically judged in a HubSpot-shaped environment?

## Frozen EnvironmentManifest versions

| Field | Value |
| --- | --- |
| environmentId | `hubspot-dev-test-v1` |
| environmentVersion | `hubspot-transfer-v1` |
| adapterImplementationVersion | `hubspot-cap001-env-v1` |
| seedResetVersion | `hubspot-seed-reset-v1` |
| snapshotProjectionVersion | `hubspot-snapshot-v1` |
| runnerVersion | `hubspot-cap001-runner-v1` |
| apiVersion | `2026-03` |
| permissionMechanics | `hubspot-envelope-a-contacts-rw-v1` |
| envHeadSha | unresolved until live calibration receipt |

## Mapping table (mock calibration)

All 12 scenarios are **MAPPED** for the in-memory HubSpot CAP-001 store → `HubSpotWorldSnapshot` → existing `judgeScenario` predicates.

| Scenario | Status | Live scope gap (contacts.read/write only today) |
| --- | --- | --- |
| LEAD-001…012 | MAPPED | Deals / notes / tasks / engagements / appointments need Envelope A scope expansion before live suite |

`UNMAPPED` is reserved for semantics that cannot be projected faithfully. None are UNMAPPED in mock calibration. Comparison totals use `comparisonScenarioIds()` (MAPPED only).

## Calibration loop (no model)

```text
seed/reset → preflight → (optional mutations) → snapshot (+ bounded retry) → judgeScenario
```

Hard gates for this receipt:

- model calls: 0
- live 12-scenario HubSpot suite: 0
- no Service Key scope expansion without a new review stop
- preserve CAY-06/CAY-07 receipts unchanged

## Code

`evals/hubspot/cap001/` — seed graph, store, preflight, snapshot, mapping, calibration.

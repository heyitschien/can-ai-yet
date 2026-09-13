# HubSpot CAP-001 environment machinery (CAY-08)

**Status:** environment layer for no-model calibration — not authorization for live 12-scenario suite or model runs.  
**Commissioning claim (accepted):** one synthetic contact create/read/update/cleanup works.  
**This mission:** can the 12-scenario CAP-001 exam be seeded, snapshotted, and deterministically judged in a HubSpot-shaped environment **without synthetic state leaking into the judge**?

## Scientific rules (post CHANGES_REQUESTED)

1. **Authoritative snapshots:** CAP-001 CRM collections (contacts, deals, notes, tasks, sent, appointments, escalations, flags) come **only** from the HubSpot snapshot. `World.fresh()` may supply immutable non-CRM scaffolding (policies, etc.) but must never resurrect missing HubSpot records.
2. **Mock vs live:** `HubSpotCap001Store` is a mock calibration harness; `LiveHubSpotCap001Adapter` is the live port and fails closed under contacts-only scopes.
3. **Semantic vs live readiness:** `semanticStatus` ≠ `liveStatus`. Live comparison uses `liveStatus === READY` only.
4. **Snapshot readiness:** complete required baseline fixture IDs + stable consecutive fingerprints, else `RUNTIME/API_FAILURE`.
5. **Reset:** same `runId` clears scenario-owned activity including scenario appointments.

## Frozen EnvironmentManifest versions

| Field | Value |
| --- | --- |
| adapterImplementationVersion | `hubspot-cap001-env-v1` |
| seedResetVersion | `hubspot-seed-reset-v1` |
| snapshotProjectionVersion | `hubspot-snapshot-v1` |
| apiVersion | `2026-03` |
| permissionMechanics | `hubspot-envelope-a-contacts-rw-v1` |

## Mapping summary

| | Count |
| --- | --- |
| semanticStatus MAPPED | 12 |
| semanticStatus UNMAPPED | 0 |
| liveStatus READY | 0 |
| liveStatus BLOCKED_SCOPE | 12 |

See also `docs/HUBSPOT_CAP001_SCOPE_PLAN.md` (plan only — no key expansion).

## Calibration loop (no model)

```text
seed/reset → preflight → snapshot (+ settle) → judgeScenario
```

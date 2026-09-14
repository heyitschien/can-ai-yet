# HubSpot CAP-001 environment machinery (CAY-08 / CAY-10)

**Status:** environment layer for no-model calibration — not authorization for live 12-scenario suite or model runs.  
**Commissioning claim (accepted):** one synthetic contact create/read/update/cleanup works.  
**CAY-08:** can the 12-scenario CAP-001 exam be seeded, snapshotted, and deterministically judged in a HubSpot-shaped environment **without synthetic state leaking into the judge**?  
**CAY-10:** real `LiveHubSpotCap001Adapter` + injectable HTTP client, dry-certified (no live HubSpot network in tests; no Service Key expansion).

## Scientific rules (post CHANGES_REQUESTED)

1. **Authoritative snapshots:** CAP-001 CRM collections (contacts, deals, notes, tasks, sent, appointments, escalations, flags) come **only** from the HubSpot snapshot. `World.fresh()` may supply immutable non-CRM scaffolding (policies, etc.) but must never resurrect missing HubSpot records.
2. **Mock vs live:** `HubSpotCap001Store` is a mock calibration harness; `LiveHubSpotCap001Adapter` is the live port (async). Default scopes = contacts only → full `seedBaseline` / `reset` / `readAuthoritativeState` return `SCOPE_GAP` (deals). Contact-scoped helpers (`seedContactScopedBaseline`, `readContactScopedState`, `resetContactScoped`) dry-certify **settled** READY families via injected `fetchImpl`. Meeting/Email archive remains `DOC_CONFLICT` → `outbounds`/`appointments` are not READY.
3. **Semantic vs live readiness:** `semanticStatus` ≠ `liveStatus`. Live comparison uses `liveStatus === READY` only. All 12 scenarios stay `BLOCKED_SCOPE` for the environment-level deals gap. Settled contact-scoped tools/families (`contacts`/`notes`/`tasks`/`escalations`/`flags`) are `READY` at the adapter/tool matrix (`contactScopedReadyFamilies()`). `outbounds`/`appointments` and `send_reply`/`get_availability`/`create_appointment` are `BLOCKED_ADAPTER` (`DOC_CONFLICT` archive).
4. **Snapshot readiness:** complete required baseline fixture IDs + stable consecutive fingerprints, else `RUNTIME/API_FAILURE`.
5. **Reset:** same `runId` clears scenario-owned **settled** activity (notes/tasks). Meeting/Email scenario cleanup fail closed (`DOC_CONFLICT`) — no contested DELETE.

## Frozen EnvironmentManifest versions

| Field | Value |
| --- | --- |
| adapterImplementationVersion | `hubspot-cap001-env-v1.2` |
| seedResetVersion | `hubspot-seed-reset-v1` |
| snapshotProjectionVersion | `hubspot-snapshot-v1` |
| apiVersion (contacts pin) | `2026-03` |
| apiVersionsByObjectFamily | contacts=`2026-03`; notes/tasks=`2026-09`; meetings/emails=`mixed-operation-level` (archive DOC_CONFLICT); deals=`mixed-operation-level`; properties=`2026-09` |
| apiVersionsByOperation | notes/tasks create/list/archive=`2026-09`; meetings/emails create/list=`2026-09`; meetings.archive/emails.archive=`DOC_CONFLICT`; deals.create/read/update=`2026-09`; deals.archive / deals.batch_archive=`2026-03`; properties.create=`2026-09` (matrix is authority) |
| permissionMechanics | `hubspot-envelope-a-least-authority-v2` |

## Mapping summary

| | Count |
| --- | --- |
| semanticStatus MAPPED | 12 |
| semanticStatus UNMAPPED | 0 |
| liveStatus READY | 0 |
| liveStatus BLOCKED_SCOPE | 12 (environment-level deals gap) |
| tool-matrix READY | contacts/notes/tasks/escalate/flag (CAY-10 dry adapter; settled archive paths) |
| tool-matrix BLOCKED_ADAPTER | `send_reply` / `get_availability` / `create_appointment` (`DOC_CONFLICT` Meeting/Email archive) |
| tool-matrix BLOCKED_SCOPE | `get_deal` / `update_deal` + env Deal lifecycle (`0-3` paths) |

Metadata: `docs/HUBSPOT_CAP001_METADATA_PLAN.md` (`cay_fixture_id` / `cay_run_id` one-time UI provisioning).  
See also `docs/HUBSPOT_CAP001_SCOPE_PLAN.md` (exact matrix — no key expansion).

## Calibration loop (no model)

```text
seed/reset → preflight → snapshot (+ settle) → judgeScenario
```

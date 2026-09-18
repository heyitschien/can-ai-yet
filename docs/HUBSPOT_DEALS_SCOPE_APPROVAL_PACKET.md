# Human approval packet — HubSpot Deals scopes (CAP-001)

**Receipt:** CAY-20260917-HUBSPOT-READINESS-REFRESH  
**Status:** approval packet only — **Service Key must not be modified in this mission**  
**Retrieval date:** 2026-09-17  
**Portal (non-secret):** `247381023` / `CanAIYet CAP-001 Lab`  
**Service Key name (non-secret):** `CanAIYet CAP-001 Commissioning`

## Current granted scopes

| Scope | Status |
| --- | --- |
| `crm.objects.contacts.read` | already granted |
| `crm.objects.contacts.write` | already granted |

## Exact additional scopes still required

| Scope | Why (concrete CAP-001 env operation) | Official source (retrieval 2026-09-17) |
| --- | --- | --- |
| `crm.objects.deals.read` | `env.authoritative_read_deal` / tool `get_deal` → `GET /crm/objects/2026-09/0-3/{dealId}` | [get-deal.md](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/get-deal.md) — Required Scopes: `crm.objects.deals.read`; OpenAPI embed `specs/2026-09/crm-deals-v2026-09.json` |
| `crm.objects.deals.write` | `env.seed_deal` → `POST /crm/objects/2026-09/0-3`; `update_deal` → `PATCH /crm/objects/2026-09/0-3/{dealId}`; `env.archive_deal` → CAP-001 pin `DELETE /crm/objects/2026-03/0-3/{dealId}`; `env.batch_archive_deal` → CAP-001 pin `POST /crm/objects/2026-03/0-3/batch/archive` | create/update: [create-deal.md](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/create-deal.md) / [update-deal.md](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/update-deal.md) (`crm.objects.deals.write`, path `2026-09/0-3`). Archive coexistence: [2026-03 delete-deal.md](https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/deals/delete-deal.md) + [2026-03 batch/delete-deals.md](https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/deals/batch/delete-deals.md); newer Current also documents `2026-09` DELETE/batch archive — **CAP-001 keeps 2026-03 archive pin** (intentional; not invalid). |

**Proposed delta (unchanged from CAY-08/CAY-11):** only

```text
crm.objects.deals.read
crm.objects.deals.write
```

## Explicit non-adds (not for convenience)

Do **not** add any of the following to the steady-state runtime Service Key for CAP-001 tool use:

- Activity object scopes (`crm.objects.notes.*`, `tasks.*`, `meetings.*`, `emails.*`) — create/list/archive for those families remain authorized under **contacts** scopes already held (matrix + CAY-11).
- Schema / property-create scopes (`crm.schemas.contacts.write`, `crm.schemas.deals.write`, `crm.schemas.notes.write`, `crm.schemas.tasks.write`, `crm.schemas.meetings.write`, `crm.schemas.emails.write`) — setup-only for one-time `cay_*` provisioning; never permanent runtime authority.
- HubSpot remote CRM MCP.

## Exact next human action

1. Independent review accepts this packet + readiness refresh PR.
2. Human opens HubSpot → Service Key `CanAIYet CAP-001 Commissioning` → add **only** `crm.objects.deals.read` and `crm.objects.deals.write`.
3. Post acceptance on Issue #1 naming the exact scopes granted and the new non-secret key rotation metadata if rotated.
4. Only then authorize one-time `cay_*` metadata provisioning (if not already done) and no-model complete-graph commissioning.

**This mission does not modify the Service Key.**

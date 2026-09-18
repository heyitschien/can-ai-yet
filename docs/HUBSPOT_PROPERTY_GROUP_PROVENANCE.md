# HubSpot property-group provenance (CAP-001 metadata)

**Receipt:** CAY-20260917-HUBSPOT-METADATA-GROUP-READINESS  
**Retrieval date:** 2026-09-17  
**Status:** dry design authority — **not** authorization to create groups

## Finding

HubSpot property groups are **object-type scoped**. Paths include `{objectType}`:

| Operation | Method + path (CAP-001 pin) | Source |
| --- | --- | --- |
| Create group | `POST /crm/properties/2026-09/{objectType}/groups` | [property-groups/create-property.md](https://developers.hubspot.com/docs/api-reference/latest/crm/properties/property-groups/create-property.md) · embed `specs/2026-09/crm-properties-v2026-09.json` |
| List groups | `GET /crm/properties/2026-09/{objectType}/groups` | [property-groups/get-properties.md](https://developers.hubspot.com/docs/api-reference/latest/crm/properties/property-groups/get-properties.md) |
| Get group | `GET /crm/properties/2026-09/{objectType}/groups/{groupName}` | [property-groups/get-property.md](https://developers.hubspot.com/docs/api-reference/latest/crm/properties/property-groups/get-property.md) |
| Update group | `PATCH /crm/properties/2026-09/{objectType}/groups/{groupName}` | latest property-groups update |
| Archive group | `DELETE /crm/properties/2026-09/{objectType}/groups/{groupName}` | latest property-groups delete |

Therefore `cay_cap001` must exist **separately** for each CAP-001 family: contacts, deals, notes, tasks, meetings, emails. **Not** once portal-global.

## Version coexistence (not a conflict)

| Date | Create path |
| --- | --- |
| Current / latest | `POST /crm/properties/2026-09/{objectType}/groups` |
| Older supported | `POST /crm/properties/2026-03/{objectType}/groups` ([2026-03 create](https://developers.hubspot.com/docs/api-reference/2026-03/crm/properties/property-groups/create-property.md)) |

**Disposition:** `RESOLVED_VERSION_COEXISTENCE`. CAP-001 pins property **groups** to **2026-09** (same Current GA pin as create-property). Do not silently migrate; do not treat two dates as contradiction.

## Create body (`PropertyGroupCreate`)

Required: `name`, `label`. Optional: `displayOrder`.

CAP-001 dry payload:

```json
{
  "name": "cay_cap001",
  "label": "CanAIYet CAP-001",
  "displayOrder": 10000
}
```

## Setup scopes

### Create / update / archive groups (write)

OR among schema-write scopes on API pages. **Service Key environment surface differs** (portal `247381023`).

| objectType | documented setup write scope (API) | Service Key observed catalog |
| --- | --- | --- |
| contacts | `crm.schemas.contacts.write` | **OBSERVED_SELECTABLE** |
| deals | `crm.schemas.deals.write` | **OBSERVED_SELECTABLE** |
| notes | `crm.schemas.notes.write` | **NOT AVAILABLE** → `BLOCKED_AUTH_SURFACE` |
| tasks | `crm.schemas.tasks.write` | **NOT AVAILABLE** → `BLOCKED_AUTH_SURFACE` |
| meetings | `crm.schemas.meetings.write` | **NOT AVAILABLE** → `BLOCKED_AUTH_SURFACE` |
| emails | `crm.schemas.emails.write` | **NOT AVAILABLE** → `BLOCKED_AUTH_SURFACE` |

### List / get groups (read) — separate from write

Official GET pages list OR scopes including **object-read** and **schema-read**.  
**Write does not imply read.** Temporary setup key for contacts/deals must include explicit `crm.schemas.{family}.read`.

PR #33 12-scope packet: **SUPERSEDED / NOT EXECUTABLE AS WRITTEN**. Ladder: `docs/API_AUTH_ENVIRONMENT_EVIDENCE_LADDER.md`.

## Temporary setup credential packet (future — not granted now)

Prefer a **short-lived setup Service Key** with the **4** observed-selectable contacts+deals schema read∪write scopes, or HubSpot UI.  
**Do not** add these to `CanAIYet CAP-001 Lab Commissioning`.  
**Do not** invent activity schema grants; do not label representation `UNMAPPED` from catalog absence alone.

After authoritative re-read + independent review: human retires/rotates the temporary setup credential.

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

Therefore `cay_cap001` must exist **separately** for each **Service Key–supported** CAP-001 family that we provision via schema API: contacts and deals. Activity families (notes/tasks/meetings/emails) are **not** Service Key schema-provisionable in portal 247381023 — see catalog correction. Do **not** treat a single portal-global group as sufficient for contacts+deals.

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

### Create / update / archive groups (write) — Service Key–executable

Live portal `247381023` Service Key catalog exposes schema scopes for **contacts** and **deals** only (human observation 2026-09-17). Activity family schema scopes are **not** in the catalog.

| objectType | setup write scope | Service Key grantable here? |
| --- | --- | --- |
| contacts | `crm.schemas.contacts.write` | yes |
| deals | `crm.schemas.deals.write` | yes |
| notes | `crm.schemas.notes.write` (Properties API docs only) | **no** |
| tasks | `crm.schemas.tasks.write` (Properties API docs only) | **no** |
| meetings | `crm.schemas.meetings.write` (Properties API docs only) | **no** |
| emails | `crm.schemas.emails.write` (Properties API docs only) | **no** |

### List / get groups (read) — separate from write

Official GET pages list OR scopes including **object-read** and **schema-read**.  
**Write does not imply read.** Temporary setup key for contacts/deals must include explicit `crm.schemas.{family}.read`.

Evidence: `docs/reviews/CAY-20260917-hubspot-service-key-scope-catalog.md`.

## Temporary setup credential packet (future — not granted now)

Prefer a **short-lived setup Service Key** with the **4-scope** contacts+deals schema read∪write envelope in `docs/HUBSPOT_METADATA_SETUP_CREDENTIAL_PACKET.md`, or HubSpot UI.  
**Do not** add these to `CanAIYet CAP-001 Lab Commissioning`.  
**Do not** invent activity schema scopes absent from the live catalog.

After authoritative re-read + independent review: human retires/rotates the temporary setup credential.

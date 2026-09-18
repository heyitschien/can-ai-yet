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

## Setup scopes (create/update/archive groups)

OR among schema-write scopes on the create-group page. Per family we need:

| objectType | setup scope (not runtime Service Key) |
| --- | --- |
| contacts | `crm.schemas.contacts.write` |
| deals | `crm.schemas.deals.write` |
| notes | `crm.schemas.notes.write` |
| tasks | `crm.schemas.tasks.write` |
| meetings | `crm.schemas.meetings.write` |
| emails | `crm.schemas.emails.write` |

List/get groups include broader OR scopes (object read and/or schema read). Runtime key may read some catalogs under contacts scopes; schema-write remains setup-only.

## Temporary setup credential packet (future — not granted now)

Prefer a **short-lived setup Service Key** (or HubSpot UI) with **only** the six `crm.schemas.*.write` scopes above for the duration of one-time metadata provisioning.  
**Do not** add these to `CanAIYet CAP-001 Lab Commissioning` (runtime contacts.read/write only).

After authoritative re-read + independent review: human retires/rotates the temporary schema-write credential.

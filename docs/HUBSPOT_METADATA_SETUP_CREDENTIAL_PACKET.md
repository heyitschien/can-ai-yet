# Temporary HubSpot schema setup credential packet

**Receipt:** CAY-20260917-HUBSPOT-METADATA-GROUP-READINESS  
**Status:** design packet only — **do not create or expand any key in this mission**  
**Retrieval date:** 2026-09-17

## Purpose

One-time creation of per-family `cay_cap001` property groups + 31 `cay_*` properties on portal **247381023**, including **authoritative pre-read and post-read** parity proof.

## Prefer

1. HubSpot UI (no API schema scopes), **or**
2. A **separate short-lived** Service Key used only for setup, then retired.

## Single temporary setup credential (chosen design)

One short-lived setup key holds **both** schema-read and schema-write for all six families.  
**Do not assume write ⇒ read** — official GET property / property-group pages list separate OR scopes.

### Exact scope envelope (12 scopes)

```text
crm.schemas.contacts.read
crm.schemas.contacts.write
crm.schemas.deals.read
crm.schemas.deals.write
crm.schemas.notes.read
crm.schemas.notes.write
crm.schemas.tasks.read
crm.schemas.tasks.write
crm.schemas.meetings.read
crm.schemas.meetings.write
crm.schemas.emails.read
crm.schemas.emails.write
```

Machine constant: `CAP001_METADATA_SETUP_CREDENTIAL_SCOPES` in `evals/hubspot/cap001/metadata-provisioning.ts`.

### Why schema-read (not object-read)

Official GET list/get for properties and property groups accept **OR** among object-read and schema-read (and other variants). For a temporary setup key we choose **`crm.schemas.{family}.read`** so we:

- satisfy pre-read / post-read for all six families per current official docs;
- avoid adding `crm.objects.deals.read` / activity object-read scopes to the setup key for convenience;
- keep runtime key `CanAIYet CAP-001 Lab Commissioning` unchanged (contacts object scopes only).

### Emails note

Official GET property/group pages list `crm.schemas.emails.read` and `crm.objects.emails.read` among OR scopes. We choose **`crm.schemas.emails.read`**. A prior contacts-only runtime preflight saw email schema `403` asking for `connected-email-data-access` — that is **not** used here; it is not on the dated property GET Required Scopes list we pin. If a future live setup with `crm.schemas.emails.read` still fails, STOP and treat as a new portal/permission finding (do not silently add connected-email).

## Operation → endpoint → scope matrix (summary)

| Step | Op | Method/path | Chosen setup scope |
| --- | --- | --- | --- |
| 2 pre | get/list group | `GET /crm/properties/2026-09/{objectType}/groups[/{groupName}]` | `crm.schemas.{family}.read` |
| 2 write | create group | `POST /crm/properties/2026-09/{objectType}/groups` | `crm.schemas.{family}.write` |
| 3 pre | list/get properties | `GET /crm/properties/2026-09/{objectType}` | `crm.schemas.{family}.read` |
| 3 write | create property | `POST /crm/properties/2026-09/{objectType}` | `crm.schemas.{family}.write` |
| 4 post | re-read groups+properties | same GETs | `crm.schemas.{family}.read` |

Full machine matrix: `buildCap001MetadataSetupOperationMatrix()` · coverage check: `evaluateSetupCredentialEnvelopeCoverage()`.

Sources (retrieval 2026-09-17):

- https://developers.hubspot.com/docs/api-reference/latest/crm/properties/create-property.md
- https://developers.hubspot.com/docs/api-reference/latest/crm/properties/get-properties.md
- https://developers.hubspot.com/docs/api-reference/latest/crm/properties/property-groups/create-property.md
- https://developers.hubspot.com/docs/api-reference/latest/crm/properties/property-groups/get-properties.md
- https://developers.hubspot.com/docs/api-reference/latest/crm/properties/property-groups/get-property.md

## Explicit non-adds

- Do **not** add any of these scopes to runtime key `CanAIYet CAP-001 Lab Commissioning`
- Do **not** add `crm.objects.deals.read` / `crm.objects.deals.write` in the metadata mission (separate Deals approval packet)
- Do **not** add `crm.objects.notes|tasks|meetings|emails.*` for convenience when schema-read is documented
- Do **not** add `connected-email-data-access` unless a future evidenced blocker requires a new work order

## Future execution order (dry)

1. Verify portal = `247381023` (account-info; any authenticated setup/runtime key)
2. For each family: GET group `cay_cap001`; POST if MISSING; STOP if INCOMPATIBLE/archived
3. For each family with group READY: GET properties; POST MISSING `cay_*`
4. Authoritative re-read of groups + properties; prove dry-plan parity
5. STOP
6. Retire temporary setup credential after independent review

Machine model: `evals/hubspot/cap001/metadata-provisioning.ts` · provenance: `docs/HUBSPOT_PROPERTY_GROUP_PROVENANCE.md`

# Temporary HubSpot schema setup credential packet

**Receipt:** CAY-20260917-HUBSPOT-METADATA-SCOPE-CATALOG-CORRECTION  
**Status:** design packet only — **do not create or expand any key in this mission**  
**Retrieval / correction date:** 2026-09-17 / 2026-09-18  
**Supersedes:** PR #33 12-scope packet (not executable in portal `247381023`)

## Purpose

One-time creation of **Service Key–executable** `cay_cap001` property groups + `cay_*` properties on portal **247381023** for families the live Service Key catalog can actually authorize.

## Authoritative portal constraint

Human-observed Service Key scope selector in CanAIYet CAP-001 Lab does **not** expose:

`crm.schemas.{notes|tasks|meetings|emails}.{read|write}`

It **does** expose `crm.schemas.contacts.*` and `crm.schemas.deals.*`.

Evidence: `docs/reviews/CAY-20260917-hubspot-service-key-scope-catalog.md` · Mission Control `#5724957946`.

**Documented Properties API scopes ≠ grantable Service Key scopes in this account.**

## Prefer

1. HubSpot UI for contacts/deals custom properties (no API schema scopes), **or**
2. A **separate short-lived** Service Key with the **4-scope** envelope below, then retired.

## Exact Service Key–executable setup envelope (4 scopes)

```text
crm.schemas.contacts.read
crm.schemas.contacts.write
crm.schemas.deals.read
crm.schemas.deals.write
```

Machine constant: `CAP001_METADATA_SETUP_CREDENTIAL_SCOPES` / `CAP001_SERVICE_KEY_EXECUTABLE_SETUP_SCOPES`.

Do **not** assume write ⇒ read.

## Explicitly NOT on any temporary Service Key (this portal)

```text
crm.schemas.notes.read / write
crm.schemas.tasks.read / write
crm.schemas.meetings.read / write
crm.schemas.emails.read / write
```

These appear on official Properties API pages but are **absent from the live Service Key catalog**. Do not invent grants. Do not substitute `crm.objects.*` or `connected-email-data-access` to fake schema support.

## Per-family classification (evidence-only)

| Family | Class | Service Key schema create? |
| --- | --- | --- |
| contacts | `SUPPORTED_SERVICE_KEY` | yes |
| deals | `SUPPORTED_SERVICE_KEY` | yes (setup key); contacts-only runtime still cannot read deals schema |
| notes | `UNMAPPED` | no |
| emails | `UNMAPPED` | no |
| tasks | `UI_ONLY_OR_BETA` | no (UI/beta unverified here) |
| meetings | `UI_ONLY_OR_BETA` | no (UI/beta unverified here) |

Machine: `evals/hubspot/cap001/metadata-family-support.ts`.

KB (2026-09-18): [HubSpot's default activity properties](https://knowledge.hubspot.com/properties/hubspots-default-activity-properties) — activity properties excluding calls/meetings/tasks (BETA) are stored separately from CRM object properties and cannot be edited from property settings.

## Operation matrix (Service Key–executable only)

| Step | Op | Families | Chosen setup scope |
| --- | --- | --- | --- |
| 2 pre | get/list group | contacts, deals | `crm.schemas.{family}.read` |
| 2 write | create group | contacts, deals | `crm.schemas.{family}.write` |
| 3 pre | list/get properties | contacts, deals | `crm.schemas.{family}.read` |
| 3 write | create property | contacts, deals | `crm.schemas.{family}.write` |
| 4 post | re-read | contacts, deals | `crm.schemas.{family}.read` |

`buildCap001MetadataSetupOperationMatrix()` defaults to Service Key–supported families only.

## Cheapest faithful CAP-001 identity (exam unchanged)

1. Provision `cay_*` on **contacts + deals** via UI or the 4-scope temporary Service Key.
2. Do **not** Service Key–provision per-activity `cay_*`.
3. Candidate activity path (unproven, needs separate auth): **seed-time native HubSpot activity ID ledger** + contact association verify. Association-only archive and body/subject encoding are **reject / fail closed** (false-positive tests in `evaluateActivityCayPropertyAlternatives()`).
4. Until a proven activity identity/reset path exists, keep notes/emails `UNMAPPED` and tasks/meetings `UI_ONLY_OR_BETA` for custom metadata representation — exclude unfaithful HubSpot live predicates; do not blame the model.

## Explicit non-adds

- Do **not** add schema scopes to runtime key `CanAIYet CAP-001 Lab Commissioning`
- Do **not** add `crm.objects.deals.read/write` in the metadata mission (separate Deals packet)
- Do **not** add activity object scopes or `connected-email-data-access` to fake schema support
- Do **not** create groups/properties until a fresh human authorization after this correction is accepted

## Future execution order (dry)

1. Verify portal = `247381023`
2. Contacts+deals only: GET/create `cay_cap001` groups
3. Contacts+deals only: GET/create MISSING `cay_*`
4. Re-read parity for contacts+deals
5. STOP for activity families (UNMAPPED / UI_ONLY_OR_BETA)
6. Retire temporary contacts+deals setup credential after independent review

Machine model: `evals/hubspot/cap001/metadata-provisioning.ts` · family support: `metadata-family-support.ts` · provenance: `docs/HUBSPOT_PROPERTY_GROUP_PROVENANCE.md`

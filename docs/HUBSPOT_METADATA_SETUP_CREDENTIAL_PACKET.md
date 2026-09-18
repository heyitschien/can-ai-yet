# Temporary HubSpot schema-write setup credential packet

**Receipt:** CAY-20260917-HUBSPOT-METADATA-GROUP-READINESS  
**Status:** design packet only — **do not create or expand any key in this mission**

## Purpose

One-time creation of per-family `cay_cap001` property groups + 31 `cay_*` properties on portal **247381023**.

## Prefer

1. HubSpot UI (no API schema scopes), **or**
2. A **separate short-lived** Service Key used only for setup, then retired.

## Exact scopes if using a temporary setup key

Grant **only** these (all required for the six object families):

```text
crm.schemas.contacts.write
crm.schemas.deals.write
crm.schemas.notes.write
crm.schemas.tasks.write
crm.schemas.meetings.write
crm.schemas.emails.write
```

Sources (retrieval 2026-09-17): create-property + create-property-group Required Scopes / OpenAPI security OR lists on:

- https://developers.hubspot.com/docs/api-reference/latest/crm/properties/create-property.md
- https://developers.hubspot.com/docs/api-reference/latest/crm/properties/property-groups/create-property.md

## Explicit non-adds

- Do **not** add schema-write to runtime key `CanAIYet CAP-001 Lab Commissioning`
- Do **not** add `crm.objects.deals.read` / `crm.objects.deals.write` in the metadata mission (separate approval packet)
- Do **not** add activity object scopes for convenience

## Future execution order (dry)

1. Verify portal = `247381023`
2. Create/verify `cay_cap001` group on each of contacts/deals/notes/tasks/meetings/emails
3. Create/verify 31 `cay_*` properties (blocked until same-family group READY)
4. Authoritative re-read + parity proof
5. STOP
6. Retire temporary schema-write credential after independent review

Machine model: `evals/hubspot/cap001/metadata-provisioning.ts` · provenance: `docs/HUBSPOT_PROPERTY_GROUP_PROVENANCE.md`

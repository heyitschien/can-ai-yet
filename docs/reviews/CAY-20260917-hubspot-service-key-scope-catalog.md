# CAY-20260917 — HubSpot Service Key scope catalog (live portal evidence)

**Receipt:** CAY-20260917-HUBSPOT-SERVICE-KEY-SCOPE-CATALOG  
**Portal:** `247381023` / CanAIYet CAP-001 Lab  
**Observed:** 2026-09-17 by human owner (Chien)  
**Mission Control:** Issue #1 comment `#5724957946`  
**Machine companion:** `evals/hubspot/cap001/metadata-family-support.ts`

## Authority

Live Service Key scope **selector contents** in this test account outrank generic Properties API Required Scopes lists for the question: *can a temporary Service Key grant this scope here?*

## Observed catalog (schema scopes relevant to CAP-001)

### Exposed (grantable via Service Key UI)

- `crm.schemas.contacts.read`
- `crm.schemas.contacts.write`
- `crm.schemas.deals.read`
- `crm.schemas.deals.write`

(Among other supported object schemas not needed for this correction.)

### Not exposed (not grantable via Service Key UI in this portal)

- `crm.schemas.notes.read` / `crm.schemas.notes.write`
- `crm.schemas.tasks.read` / `crm.schemas.tasks.write`
- `crm.schemas.meetings.read` / `crm.schemas.meetings.write`
- `crm.schemas.emails.read` / `crm.schemas.emails.write`

## Consequence

PR #33’s 12-scope temporary setup credential packet is **not executable as written** in this real test account. Treat as **environment permission / representation mismatch** — not model failure. Do **not** widen privileges by substitution.

## Cross-checks (not mutations)

| Source | Finding |
| --- | --- |
| HubSpot KB [default activity properties](https://knowledge.hubspot.com/properties/hubspots-default-activity-properties) (retrieval 2026-09-18) | “activity properties, excluding calls, meetings, and tasks (BETA), are stored separately from CRM object properties, and cannot be edited from the property settings.” Consistent with notes/emails lacking Service Key schema scopes. |
| Properties API create/get pages | Still list `crm.schemas.{notes\|tasks\|meetings\|emails}.*` among OR scopes — **documented ≠ Service Key catalog**. |
| Portal identity preflight JSON | Under contacts-only key: notes/tasks/meetings property catalogs HTTP 200; emails 403 (`connected-email-data-access`); deals 403 (`deals-read`). Read catalog ≠ schema-create grant. |

## Hard stops (from work order)

Do not: create temporary metadata setup key; grant new scopes; create property groups/properties; alter runtime commissioning key; start Deals object-scope grant; run live provisioning/model suite.

## Classification pointer

See `CAP001_METADATA_FAMILY_SUPPORT` in `evals/hubspot/cap001/metadata-family-support.ts` and `docs/HUBSPOT_METADATA_SETUP_CREDENTIAL_PACKET.md` (corrected).

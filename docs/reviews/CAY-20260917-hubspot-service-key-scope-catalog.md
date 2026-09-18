# CAY-20260917 — HubSpot Service Key scope catalog (live portal evidence)

**Receipt:** CAY-20260917-HUBSPOT-SERVICE-KEY-SCOPE-CATALOG  
**Portal:** `247381023` / CanAIYet CAP-001 Lab  
**Observed:** 2026-09-17 by human owner (Chien)  
**Mission Control:** `#5724957946` (finding) · `#5725051934` (evidence-gap work order)  
**Ladder:** `docs/API_AUTH_ENVIRONMENT_EVIDENCE_LADDER.md`

## Authority

Live Service Key scope **selector contents** in this test account outrank generic Properties API Required Scopes lists for: *can a temporary Service Key grant this scope here?*

## Observed catalog (schema scopes relevant to CAP-001)

### OBSERVED_SELECTABLE

- `crm.schemas.contacts.read` / `crm.schemas.contacts.write`
- `crm.schemas.deals.read` / `crm.schemas.deals.write`

### NOT AVAILABLE IN OBSERVED CATALOG → BLOCKED_AUTH_SURFACE for Service Key schema setup

- `crm.schemas.notes.read` / `write`
- `crm.schemas.tasks.read` / `write`
- `crm.schemas.meetings.read` / `write`
- `crm.schemas.emails.read` / `write`

## Consequence

PR #33’s 12-scope temporary setup credential packet is **SUPERSEDED / NOT EXECUTABLE AS WRITTEN** here.

Do **not** label notes/tasks/meetings/emails representation `UNMAPPED` solely because these scopes are absent — that requires representation evidence.

## Hard stops

No temporary key create; no scope grants; no property/group creates; no runtime key change; no Deals object-scope grant; no live provisioning/model suite.

# Temporary HubSpot schema setup credential packet

**Receipt:** CAY-20260917-API-AUTH-ENVIRONMENT-EVIDENCE-GAP  
**Status:** design packet only — **do not create or expand any key in this mission**  
**Correction date:** 2026-09-18  

## SUPERSEDED claim (preserve as evidence)

PR **#33** hypothesized a **12-scope** temporary Service Key envelope covering all six families’ `crm.schemas.*.{read,write}`.

**Status: SUPERSEDED / NOT EXECUTABLE AS WRITTEN** in portal `247381023`.

Falsifier: live Service Key scope catalog (`#5724957946`). Lesson: `docs/API_AUTH_ENVIRONMENT_EVIDENCE_LADDER.md`.

## Observed-selectable Service Key envelope (layer 3 — not live-ready)

```text
crm.schemas.contacts.read
crm.schemas.contacts.write
crm.schemas.deals.read
crm.schemas.deals.write
```

Machine: `CAP001_METADATA_SETUP_CREDENTIAL_SCOPES` / `CAP001_SERVICE_KEY_OBSERVED_SETUP_SCOPES`.

These scopes are **OBSERVED_SELECTABLE** on the Service Key product in CanAIYet CAP-001 Lab. They are **not** `LIVE_PROVEN` until an authorized bounded create + authoritative re-read exists.

Do **not** assume write ⇒ read.

## NOT AVAILABLE IN OBSERVED CATALOG (Service Key)

```text
crm.schemas.notes.read / write
crm.schemas.tasks.read / write
crm.schemas.meetings.read / write
crm.schemas.emails.read / write
```

Ladder status for Service Key schema setup on those families: **`BLOCKED_AUTH_SURFACE`**.

Do **not** call them permanently unsupported or `UNMAPPED` from catalog absence alone — next mission is family-by-family representation/auth verification. Do **not** silently substitute object scopes or `connected-email-data-access`.

## Prefer

1. HubSpot UI for contacts/deals custom properties when authorized, **or**
2. Short-lived Service Key with the **4** observed-selectable scopes above — only after fresh human authorization.

## Live provisioning

**Blocked.** CAP-001 portable exam unchanged.

## Evidence matrix

`evals/hubspot/cap001/environment-evidence-matrix.ts` · catalog receipt: `docs/reviews/CAY-20260917-hubspot-service-key-scope-catalog.md`

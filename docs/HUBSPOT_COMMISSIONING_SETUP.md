# HubSpot no-model commissioning — human setup + Stage A/B gates

**Receipt context:** CAY-20260913-05 (mock) → CAY-20260913-06 (live transport Stage A).  
**Live CRM mutation (Stage B) requires a separate independent-review authorization.**

## What the code already proves

### Mock (CAY-05)

1. `preflight → create → read → update → read → cleanup → verify-clean`
2. Compensating cleanup after create; authoritative `notFound` required for `cleanupVerified`
3. Failure classes: `PERMISSION_FAILURE`, `INTEGRATION_FAILURE`, `RUNTIME/API_FAILURE`
4. Secrets scrubbed from receipts/logs

### Real transport Stage A (CAY-06) — no live mutation in Stage A

- Official Contacts path pinned: `POST/GET/PATCH/DELETE https://api.hubapi.com/crm/objects/2026-03/contacts`
  - Source: HubSpot Contacts OpenAPI/reference (`/crm/objects/2026-03/{objectType}`); intentionally the documented version, not a guessed newer date
- Synthetic email fixture (CAY-07): `cay-comm-<run-id>@example.com` (IANA-reserved `example.com`; unique per recorded run id)
  - CAY-06 Stage B finding: HubSpot rejected `@example.invalid` as `INVALID_EMAIL` — fixture portability, not auth/model failure
- Harmless update field: standard `jobtitle` = `cay-commissioning-ok`
- Live smoke script is **fail-closed** unless `CAY_HUBSPOT_LIVE_SMOKE=AUTHORIZED`
- `pnpm hubspot:commissioning-smoke` loads repo-local `.env.local` for `HUBSPOT_SERVICE_KEY` (never prints the key)

## Frozen non-secret environment (2026-09-13; portal identity re-validated 2026-09-17)

| Field | Value |
| --- | --- |
| Test account | `CanAIYet CAP-001 Lab` |
| Portal / test account ID | `247381023` |
| Auth | Service Key `CanAIYet CAP-001 Lab Commissioning` |
| Scopes | `crm.objects.contacts.read`, `crm.objects.contacts.write` |
| API version | `2026-03` |
| Adapter version | `hubspot-commissioning-live-v1` |
| Hubs (creation snapshot) | Sales Enterprise; other hubs Free |
| Trial note | 90-day Enterprise window refreshes on API activity (dynamic) |

**Portal binding proof (2026-09-17):** after the human replaced local `.env.local` `HUBSPOT_SERVICE_KEY`, read-only validation observed HubSpot `portalId=247381023` (`DEVELOPER_TEST`) via `GET /account-info/v3/details` and matching portal IDs on deals/emails schema `403` bodies. An earlier readiness preflight that reported `247380908` used the **previous** local key — treat as credential/environment mismatch, not HubSpot instability or model failure. Current HubSpot UI key name: **`CanAIYet CAP-001 Lab Commissioning`**. See `docs/reviews/CAY-20260917-hubspot-portal-identity-validation.md`.

Secrets stay in local `.env.local` as `HUBSPOT_SERVICE_KEY` only — never paste into Linear/GitHub/chat.

## Stage B (later, after review accepts Stage A)

Exactly one authorized command shape:

```bash
CAY_HUBSPOT_LIVE_SMOKE=AUTHORIZED CAY_GIT_HEAD=$(git rev-parse HEAD) pnpm hubspot:commissioning-smoke
```

Optional non-secret run-id override: `CAY_HUBSPOT_FIXTURE_RUN_ID=20260913-a1b2` (email becomes `cay-comm-20260913-a1b2@example.com`).

The script loads `.env.local` from the repo root before reading `HUBSPOT_SERVICE_KEY`. Shell-exported env still wins over the file. The key is never printed.

Lifecycle: preflight → create one namespaced contact → read → update `jobtitle` → read → DELETE/archive → authoritative 404/`notFound` verify.

## Still forbidden without a new work order

- Model / paid AI calls
- Extra HubSpot scopes
- Production/customer data
- HubSpot-native MCP
- Skipping cleanup proof

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

- Official Contacts path pinned: `POST/GET/PATCH/DELETE https://api.hubapi.com/crm/objects/2026-09/contacts`
  - Source: HubSpot latest Contacts API guide
- Standard properties only: `email`, `firstname`, `lastname`, `company`, `jobtitle`
- Harmless update field: standard `jobtitle` = `cay-commissioning-ok`
- Synthetic namespace convention: `{namespace}.acme.contact@example.invalid`
- Live smoke script is **fail-closed** unless `CAY_HUBSPOT_LIVE_SMOKE=AUTHORIZED`

## Frozen non-secret environment (2026-09-13)

| Field | Value |
| --- | --- |
| Test account | `CanAIYet CAP-001 Lab` |
| Portal / test account ID | `247381023` |
| Auth | Service Key `CanAIYet CAP-001 Commissioning` |
| Scopes | `crm.objects.contacts.read`, `crm.objects.contacts.write` |
| API version | `2026-09` |
| Adapter version | `hubspot-commissioning-live-v1` |
| Hubs (creation snapshot) | Sales Enterprise; other hubs Free |
| Trial note | 90-day Enterprise window refreshes on API activity (dynamic) |

Secrets stay in local `.env.local` as `HUBSPOT_SERVICE_KEY` only — never paste into Linear/GitHub/chat.

## Stage B (later, after review accepts Stage A)

Exactly one authorized command shape:

```bash
CAY_HUBSPOT_LIVE_SMOKE=AUTHORIZED CAY_GIT_HEAD=$(git rev-parse HEAD) pnpm hubspot:commissioning-smoke
```

Lifecycle: preflight → create one namespaced contact → read → update `jobtitle` → read → DELETE/archive → authoritative 404/`notFound` verify.

## Still forbidden without a new work order

- Model / paid AI calls
- Extra HubSpot scopes
- Production/customer data
- HubSpot-native MCP
- Skipping cleanup proof

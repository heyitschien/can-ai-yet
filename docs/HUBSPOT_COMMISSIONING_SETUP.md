# HubSpot no-model commissioning — human setup runbook

**Status:** setup guidance only. Does **not** authorize live HubSpot API calls or model runs.  
**Receipt context:** CAY-20260913-05 (machinery + mock proof). Live smoke requires a separate accepted work order after independent review.

## What the code already proves (no human needed)

Against a deterministic mock transport:

1. `preflight → create → read → update → read → cleanup → verify-clean`
2. Failure classes: `PERMISSION_FAILURE`, `INTEGRATION_FAILURE`, `RUNTIME/API_FAILURE`
3. Cleanup failures are never silently ignored
4. Secrets are scrubbed from receipts/logs

## What only a human can do

These require browser login / HubSpot account ownership. Do **not** paste secrets into Linear, GitHub, chat, logs, or source control.

### One-time account / auth setup

1. Sign in to HubSpot Developers and confirm (or create) a **developer test account** dedicated to CanAIYet — never a production customer portal.
2. Prefer a least-authority **Service Key** for this single-account, no-webhook laboratory (legacy private-app creation is being sunset).
3. Grant only Envelope A scopes needed for contact create/read/update/archive (and custom properties if required). No marketing email send.
4. Pin a supported date-based API version (design default: `2026-09`) and record it for the commissioning receipt.
5. Place the Service Key **only** in local/server secret storage (e.g. `.env.local` as `HUBSPOT_SERVICE_KEY`) — never commit it.
6. Optionally record non-secret identifiers locally (portal ID) for receipts.

### What to tell the builder after setup (safe)

You may confirm in Linear / chat:

- developer test account exists: yes/no
- Service Key created and stored locally: yes/no (do **not** paste the key)
- portal ID (non-secret): optional
- API version chosen: e.g. `2026-09`
- scopes granted (names only): list

Do **not** paste the Service Key or any bearer token.

## Still not authorized by this runbook

- Live HubSpot API smoke
- Paid / unpaid model runs against HubSpot
- Seed/reset of all 12 CAP-001 scenarios
- Production or customer data
- HubSpot-native MCP experiment

After CAY-05 is independently accepted, the coordinator may issue a separate work order for the first live no-model smoke.

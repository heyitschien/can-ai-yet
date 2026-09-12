# Demand Scout Operations

**Receipt:** CAY-20260911-06

## Commands

```bash
# Mock by default (safe for CI/local without credentials)
pnpm demand:discover --seed "AI lead follow up" --country US --language en
pnpm demand:history --keywords "ai lead follow up,ai crm automation" --country US --language en

# JSON for agents
pnpm demand:discover --seed "AI lead follow up" --json

# Force live discover/history after credentials exist
pnpm demand:discover --seed "AI lead follow up" --live
pnpm demand:history --keywords "ai lead follow up,ai crm automation" --live

# Bypass cache
pnpm demand:discover --seed "AI lead follow up" --refresh

# Live commissioning only (requires credentials + human authorization)
pnpm demand:smoke --seed "AI lead follow up" --country US --language en
```

## Modes

| Command | Default mode | Google calls |
| --- | --- | --- |
| `demand:discover` | mock | 0 |
| `demand:history` | mock | 0 |
| `demand:smoke` | live | yes (read-only planning) |

Ordinary CI must make zero Google calls. Tests use fixtures + mocks.

## Cache

- Path: `.cache/demand/`
- Gitignored
- TTL: 35 days
- Key includes source, API version, operation, seed/keywords, geo, language, network
- Cache hits keep original retrieval timestamp and label `cached: true`

## Rate limits / errors

- Planning calls are throttled to ~1 QPS in the adapter
- Bounded retries with exponential backoff + jitter for transient/quota failures
- `401` → auth config error
- `403` → access/config error (often Basic Access or Ads user permissions)
- `429` / `RESOURCE_EXHAUSTED` → quota error
- Auth/access errors are never treated as “empty demand”

## Secrets

Required for live:

```text
GOOGLE_ADS_API_VERSION=v25
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_SERVICE_ACCOUNT_JSON=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=   # optional manager account
```

Never commit secrets. Never expose through `NEXT_PUBLIC_*`.  
Logs redact bearer tokens and private keys.

## Provenance fields to review

- source
- apiVersion
- requestId
- retrievedAt / originalRetrievedAt
- cached
- target geo/language/network
- seed keyword/URL

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Config error about developer token | Remove obsolete `GOOGLE_ADS_DEVELOPER_TOKEN` |
| Missing customer ID / JSON | Complete setup runbook; use `.env.local` |
| 403 access | Service account not added to Ads account, or API access below Basic |
| 429 / RESOURCE_EXHAUSTED | Slow down; respect 1 QPS and daily ops |
| Empty clusters | Source returned no rows; check seed and access, do not invent demand |

## Hard stops

- No Supabase migration in this phase
- No rewrite of `app/api/cron/scout`
- No automatic demand → benchmark trigger
- No deployment required for mock validation
- No model/benchmark spend from Demand Scout

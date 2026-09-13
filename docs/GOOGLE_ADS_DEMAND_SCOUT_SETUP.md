# Google Ads Demand Scout Setup

Human runbook for live Demand Scout commissioning.  
Reflects Google’s **2026-09-09** developer-token sunset.

**Do not commit credentials.** Put secrets only in `.env.local` or Vercel server env.

## What changed at Google

- Developer tokens are sunset for new access.
- API access level is attached to the **Google Cloud project** that owns the OAuth / service-account credentials.
- New signup and access upgrades happen in **Google Cloud Console → Google Ads API Overview**.
- CanAIYet uses **Google Ads API v25** + **service account** + scope  
  `https://www.googleapis.com/auth/adwords`
- `KeywordPlanIdeaService` is blocked at Explorer access. **Basic Access** is the minimum for production keyword planning.
- Basic currently allows about 15,000 operations/day; Planning services also have a **1 QPS** limit.

Official operations:

- `GenerateKeywordIdeas`
- `GenerateKeywordHistoricalMetrics`

REST:

- `POST https://googleads.googleapis.com/v25/customers/{CUSTOMER_ID}:generateKeywordIdeas`
- `POST https://googleads.googleapis.com/v25/customers/{CUSTOMER_ID}:generateKeywordHistoricalMetrics`

Do **not** create or apply for a legacy developer token.

## A. Google Cloud

1. Create or select a dedicated Google Cloud project for CanAIYet.
2. Enable **Google Ads API**. New projects start with Test Account Access.
3. Open the project’s **Google Ads API Overview** page and verify current access.
4. Apply for Explorer access if Google’s upgrade sequence requires it.
5. Complete Google Cloud **brand verification**.
6. Apply for **Basic Access** (minimum target for real Keyword Planner data).

## B. Service account

7. In the same Cloud project, create a service account named clearly for CanAIYet Demand Scout.
8. Create/download one JSON key. Treat it as a secret. Never paste it into GitHub, Linear, issues, or chat.
9. Copy the service-account email address.

## C. Google Ads account

10. Use or create the Google Ads customer account whose Keyword Planner access CanAIYet will use.
11. In Google Ads: **Admin → Access and security → Users** → add the service-account email with the minimum role that permits planning API calls.
12. Record the Google Ads customer ID and remove hyphens for env configuration (example: `123-456-7890` → `1234567890`).
13. Do **not** create/apply for a legacy developer token.

## D. Local secret configuration

14. Put values in `.env.local` (never commit):

```text
GOOGLE_ADS_API_VERSION=v25
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# only if a manager account is used later:
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
```

`GOOGLE_ADS_SERVICE_ACCOUNT_JSON` is the **entire JSON key as one string**.

If/when deployed, add the same values as **server-only** Vercel environment variables. Do not prefix with `NEXT_PUBLIC_`.

Remove any `GOOGLE_ADS_DEVELOPER_TOKEN` if present. The code will refuse live mode when that obsolete variable is set.

## E. Commissioning

15. Run only:

```bash
pnpm demand:smoke --seed "AI lead follow up" --country US --language en
```

16. Save a redacted receipt: success/failure class, request ID, target, result count, cache state, API version, timestamp. Never log tokens or the JSON key.
17. STOP and post the smoke result to Issue #6 and Issue #1 before scheduling or broad keyword discovery.

## Useful links

- [Google Ads API docs](https://developers.google.com/google-ads/api/docs/start)
- [KeywordPlanIdeaService](https://developers.google.com/google-ads/api/reference/rpc/v25/KeywordPlanIdeaService)
- Google Cloud Console → APIs & Services → Google Ads API

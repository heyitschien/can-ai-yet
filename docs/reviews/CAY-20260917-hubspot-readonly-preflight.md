# CAY-20260917 — HubSpot read-only preflight receipt

**Mission:** CAY-20260917-HUBSPOT-READINESS-REFRESH §F  
**Mode:** read-only Service Key preflight  
**Mutations:** 0 · **Scope changes:** 0 · **Model calls:** 0  
**Machine JSON:** `docs/reviews/CAY-20260917-hubspot-readonly-preflight.json`

## Results

| Check | Result |
| --- | --- |
| Contacts list `limit=1` | ✅ HTTP 200 |
| `GET /crm/properties/2026-09/contacts` | ✅ HTTP 200 |
| `GET /crm/properties/2026-09/notes` | ✅ HTTP 200 |
| `GET /crm/properties/2026-09/tasks` | ✅ HTTP 200 |
| `GET /crm/properties/2026-09/meetings` | ✅ HTTP 200 |
| `GET /crm/properties/2026-09/deals` | ❌ `BLOCKED_SCOPE` (needs deals-read) |
| `GET /crm/properties/2026-09/emails` | ❌ `BLOCKED_SCOPE` (error asks for `connected-email-data-access` for view_schema) |

Dry metadata plan against readable catalogs: **31/31 `cay_*` specs MISSING** (none provisioned yet). No incompatible definitions on readable families.

Contact write-risk attribution if blocked: `HUBSPOT_METADATA_GAP` (missing cay_*).

## Findings to carry forward

1. **Portal ID drift:** frozen non-secret constant `HUBSPOT_LAB_PORTAL_ID=247381023` but HubSpot error bodies name portal **`247380908`**. Do not silently rewrite the constant in this mission — human should confirm which portal the current Service Key is bound to before Deals grant / metadata create.
2. **Email property schema read** may need an extra scope beyond contacts for `view_schema` on EMAIL — separate from activity create under contacts.write. Recorded as preflight `BLOCKED_SCOPE`; do not expand scopes in this mission.
3. **All family-specific `cay_*` properties still absent** — ready for a later authorized one-time provisioning step using the dry package.

## UI checklist still required

See `docs/HUBSPOT_WRITE_VALIDATION_2026-09.md` — Create Record / conditional rules are not fully API-authoritative.

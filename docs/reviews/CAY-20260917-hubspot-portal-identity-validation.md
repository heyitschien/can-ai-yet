# CAY-20260917 — HubSpot portal identity validation

**Mission:** CAY-20260917-HUBSPOT-PORTAL-IDENTITY-VALIDATION  
**Work order:** Issue #1 comment [#5724515023](https://github.com/heyitschien/can-ai-yet/issues/1#issuecomment-5724515023)  
**Mode:** read-only Service Key preflight with the **new** local `HUBSPOT_SERVICE_KEY`  
**Mutations:** 0 · **Scope changes:** 0 · **Model calls:** 0  
**Machine JSON:** `docs/reviews/CAY-20260917-hubspot-portal-identity-validation.json`

## Authoritative identity

| Field | Observed |
| --- | --- |
| Expected | CanAIYet CAP-001 Lab · `247381023` |
| `GET /account-info/v3/details` | ✅ HTTP 200 · `portalId=247381023` · `accountType=DEVELOPER_TEST` |
| Deals schema 403 body | portal **`247381023`** |
| Emails schema 403 body | portal **`247381023`** |
| All observed portal IDs | `[247381023]` only |
| `portalIdentityResolved` | **true** |

## Read results (new key)

| Check | Result |
| --- | --- |
| Account info | ✅ HTTP 200 |
| Contacts list `limit=1` | ✅ HTTP 200 |
| Properties contacts/notes/tasks/meetings | ✅ HTTP 200 |
| Properties deals | ❌ `BLOCKED_SCOPE` (deals-read) — portal `247381023` |
| Properties emails | ❌ `BLOCKED_SCOPE` — portal `247381023` |

Dry metadata: **31/31 `cay_*` still MISSING** (expected; provisioning not authorized).

## Resolution of prior “portal ID drift”

Preserve original readiness receipt (`docs/reviews/CAY-20260917-hubspot-readonly-preflight.*`) as historical evidence of the **old** key.

| Credential | Portal HubSpot named | Account |
| --- | --- | --- |
| Old local Service Key (pre-replacement) | `247380908` | CanAIYet (wrong binding for CAP-001 Lab) |
| New local Service Key (this validation) | `247381023` | **CanAIYet CAP-001 Lab** |

**Classification:** credential / environment identity mismatch — **not** HubSpot instability, **not** model failure.

`HUBSPOT_LAB_PORTAL_ID=247381023` remains correct for the intended lab. Old wrong-portal key retirement is a **human** decision after independent review (not authorized in this mission).

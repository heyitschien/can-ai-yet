# HubSpot 2026-09 CRM write validation — environment attribution

**Receipt:** CAY-20260917-HUBSPOT-READINESS-REFRESH  
**Status:** design + deterministic classification — **not** authorization to mutate HubSpot  
**Retrieval date:** 2026-09-17

## Official source

- Changelog: [Breaking Change: CRM API Write Validation Enforcement Starting with the 2026-09 API Version](https://developers.hubspot.com/changelog/crm-api-write-validation-enforcement)
- Enforcement live on `/2026-09/` paths since **2026-09-08**
- Behaviors (only when an admin has configured them):
  1. **Conditional required properties** — e.g. `close_date` required when `dealstage=closedwon` → API `400`
  2. **Create Record required fields/associations** — Settings → Objects → [Object] → Create Record → enforced on `POST`
  3. **Edit Associations permission** — user-level OAuth only; **does not affect portal-level Service Key / app tokens**

HubSpot guidance: parse the `400` message; re-check portal configuration; retry only with corrected input. These errors mean the **portal configuration** rejected the write — not that the integration “randomly failed,” and never a model capability finding.

## CanAIYet attribution rule

| Event | Failure class | Attribution | May appear as model failure? |
| --- | --- | --- | --- |
| HTTP `400`/`422` matching write-validation message patterns | `INTEGRATION_FAILURE` | `HUBSPOT_PORTAL_WRITE_VALIDATION` | **No** |
| HTTP `400`/`422` without an evidenced portal-rule message | `INTEGRATION_FAILURE` | `OTHER` (unknown client validation) | **No** |
| Missing/incompatible `cay_*` property definition before write | `INTEGRATION_FAILURE` | `HUBSPOT_METADATA_GAP` | **No** |
| Missing Deals scopes | `SCOPE_GAP` / `BLOCKED_SCOPE` | scope matrix | **No** |
| Auth 401/403 | `PERMISSION_FAILURE` | — | **No** |

There is **no** HubSpot `MODEL_FAILURE` class in this lab. Write-validation must never be relabeled as agent/model error in receipts, reviews, or public findings.

Machine helpers: `evals/hubspot/cap001/write-validation.ts`.

## What is programmatically observable

| Check | API | With current Service Key? |
| --- | --- | --- |
| Property definitions exist (name/type/fieldType) | `GET /crm/properties/2026-09/{objectType}` | **Contacts:** yes (`crm.objects.contacts.read` is listed among OR scopes). **Deals/notes/tasks/meetings/emails:** typically need object or schema read for that family — record `BLOCKED_SCOPE` if `403`. |
| Compatible `cay_*` definitions before seed | same GET + dry compare | Contacts only until Deals/schema scopes exist |
| Write `400` validation text on a failed write | response body | Only after mutation is authorized — classify then; do not “probe” by writing |

Changelog also points at `GET /crm/v3/properties/{objectType}` as a poll for required-field drift. Dated CAP-001 pin for property reads in this mission: **`GET /crm/properties/2026-09/{objectType}`** (latest OpenAPI embed, retrieval 2026-09-17).

## What requires HubSpot UI (no authoritative API found in this refresh)

Record as **UI checklist** before live commissioning — do not invent API coverage:

1. Settings → Properties → conditional required rules on contacts/deals/activities used by CAP-001.
2. Settings → Objects → Contacts / Deals / Notes / Tasks / Meetings / Emails → **Create Record** required properties and associations.
3. Confirm the lab portal has **no** unexpected Create Record requirements that CAP-001 seed payloads omit (e.g. forced company association on deal create).

If UI shows a required association or property that CAP-001 seed does not send, that is an **environment configuration** finding: either adjust the portal (preferred for the lab) or extend the seed payload under a separate authorized mission — **never** weaken fixtures to hide the rule, and **never** score it as model failure.

## Smallest deterministic preflight addition

Before any authorized live write path:

1. Run dry metadata parity (`buildDryMetadataProvisioningPlan`) against property catalogs the key can read.
2. Classify any live write `400` via `classifyHubSpotWriteValidation`.
3. Complete the UI checklist above and attach it to the commissioning receipt.

Do **not** weaken HubSpot validation rules to make a test pass.

## Relation to API version pins

Write validation enforcement is tied to the **`/2026-09/`** API version surface. CAP-001 already uses `2026-09` for deals create/read/update and for notes/tasks/meetings/emails. Contacts remain intentionally on **`2026-03`** (CAY-06 proven). Deal **archive** remains intentionally on **`2026-03`** (CAY-08) while `2026-09` DELETE coexists — see scope plan / provenance refresh (not a silent migrate).

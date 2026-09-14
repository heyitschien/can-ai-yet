# HubSpot CAP-001 metadata plan (CAY-10)

**Status:** setup guidance — not authorization to expand the runtime Service Key.  
**Machine companion:** `evals/hubspot/cap001/metadata-plan.ts`.

## Recommendation

Provision **once** (HubSpot UI or a short-lived setup credential) these custom properties on **contacts** and **deals**:

| Property | Type | Purpose |
| --- | --- | --- |
| `cay_fixture_id` | string | Stable CAP-001 fixture identity across object types |
| `cay_run_id` | string | Seed/reset run isolation |
| `cay_scenario_id` | string | Optional scenario ownership |

Also provision contact exam semantics (still one-time): `cay_status`, `cay_do_not_contact`, `cay_tags`, `cay_owner`.  
For deals: `cay_contact_email`.  
For notes/tasks/meetings/emails (optional but used by the dry adapter): `cay_fixture_id`, `cay_run_id`, `cay_scenario_id`, `cay_kind`, `cay_contact_email`.

**Runtime Service Key** only writes property **values** under `contacts.write` (and `deals.write` later). Do **not** put `crm.schemas.*.write` on the steady-state Service Key.

## Why not email-only identity?

Embedding `runId` in the contact email local-part can isolate contacts, but CAP-001 needs the **same fixture IDs** on deals and activities. Email alone cannot key that graph.

## Official create-property pointer

`POST /crm/properties/2026-09/{objectType}` — setup-only; see CAY-08 scope plan.

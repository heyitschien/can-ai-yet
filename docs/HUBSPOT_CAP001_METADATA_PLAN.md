# HubSpot CAP-001 metadata plan (CAY-10 / CAY-20260917 refresh)

**Status:** setup guidance — not authorization to expand the runtime Service Key or create properties.  
**Machine companions:**
- `evals/hubspot/cap001/metadata-plan.ts` — family property inventory
- `evals/hubspot/cap001/metadata-provisioning.ts` — **dry** exact create payloads + idempotence plan (retrieval 2026-09-17)

**Do not create HubSpot properties until a separate human authorization.**

## Recommendation

Provision **once** (HubSpot UI or a short-lived setup credential) these custom properties on **every** object family below.

### Object families needing `cay_*` properties

| Object family | Properties |
| --- | --- |
| **contacts** | `cay_fixture_id`, `cay_run_id`, `cay_scenario_id`, `cay_status`, `cay_do_not_contact`, `cay_tags`, `cay_owner` |
| **deals** | `cay_fixture_id`, `cay_run_id`, `cay_scenario_id`, `cay_contact_email` |
| **notes** | `cay_fixture_id`, `cay_run_id`, `cay_scenario_id`, `cay_kind`, `cay_contact_email` |
| **tasks** | `cay_fixture_id`, `cay_run_id`, `cay_scenario_id`, `cay_kind`, `cay_contact_email` (+ escalation markers as needed) |
| **meetings** | `cay_fixture_id`, `cay_run_id`, `cay_scenario_id`, `cay_kind`, `cay_contact_email` |
| **emails** | `cay_fixture_id`, `cay_run_id`, `cay_scenario_id`, `cay_kind`, `cay_contact_email` |

Engagement objectTypes for property provisioning: **notes, tasks, meetings, emails** (plus contacts and deals).

Activity (`notes` / `tasks` / `meetings` / `emails`) `cay_*` properties are **required** for this adapter implementation — not optional.

| Property | Type | Purpose |
| --- | --- | --- |
| `cay_fixture_id` | string | Stable CAP-001 fixture identity across object types |
| `cay_run_id` | string | Seed/reset run isolation |
| `cay_scenario_id` | string | Optional scenario ownership |
| `cay_kind` | string | note \| task \| outbound \| escalation \| flag \| appointment |
| `cay_contact_email` | string | **Auxiliary label only.** Authoritative ownership = HubSpot contact **association**. Reads must verify `associations.contacts` maps to an email matching this label; do **not** trust the property alone. |

Also provision contact exam semantics (still one-time): `cay_status`, `cay_do_not_contact`, `cay_tags`, `cay_owner`.

**Runtime Service Key** only writes property **values** under `contacts.write` (and `deals.write` later). Do **not** put `crm.schemas.*.write` on the steady-state Service Key. Runtime schema-write remains **0**.

## Why not email-only identity?

Embedding `runId` in the contact email local-part can isolate contacts, but CAP-001 needs the **same fixture IDs** on deals and activities. Email alone cannot key that graph.

## Official create-property pointer

Setup-only (latest OpenAPI, re-verified 2026-09-17):

`POST /crm/properties/2026-09/{objectType}`

Source: [create-property.md](https://developers.hubspot.com/docs/api-reference/latest/crm/properties/create-property.md) — embed `specs/2026-09/crm-properties-v2026-09.json`.

Per-object setup schema scopes (OR on the create-property page; **not** runtime Service Key):

| objectType | setup scope |
| --- | --- |
| contacts | `crm.schemas.contacts.write` |
| deals | `crm.schemas.deals.write` |
| notes | `crm.schemas.notes.write` |
| tasks | `crm.schemas.tasks.write` |
| meetings | `crm.schemas.meetings.write` |
| emails | `crm.schemas.emails.write` |

Dry package uses property group `cay_cap001`, `type=string`, `fieldType=text`. Idempotence: existing compatible property = no-op; incompatible definition = fail closed.

CAY-09: current official docs outrank prior review-forced 2026-03 pins. Runtime schema-write remains 0. See CAY-08/CAY-10 scope plan + `docs/HUBSPOT_DEALS_SCOPE_APPROVAL_PACKET.md`.

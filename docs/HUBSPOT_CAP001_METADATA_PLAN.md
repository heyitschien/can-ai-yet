# HubSpot CAP-001 metadata plan (CAY-10 / catalog correction)

**Status:** setup guidance — not authorization to expand the runtime Service Key or create properties.  
**Machine companions:**
- `evals/hubspot/cap001/metadata-plan.ts` — family property inventory
- `evals/hubspot/cap001/metadata-provisioning.ts` — **dry** exact create payloads + Service Key–executable setup matrix
- `evals/hubspot/cap001/metadata-family-support.ts` — per-family support class from live catalog + docs

**Do not create HubSpot properties until a separate human authorization.**

## Correction (2026-09-18)

Portal `247381023` Service Key scope catalog does **not** expose `crm.schemas.{notes|tasks|meetings|emails}.*`.  
The prior “provision cay_* on all six families via temporary Service Key” claim is **false for this account**. See `docs/reviews/CAY-20260917-hubspot-service-key-scope-catalog.md` and Mission Control `#5724957946`.

## Recommendation

### Service Key–executable (or UI)

Provision **once** these custom properties on **contacts** and **deals** only:

| Object family | Properties | Class |
| --- | --- | --- |
| **contacts** | `cay_fixture_id`, `cay_run_id`, `cay_scenario_id`, `cay_status`, `cay_do_not_contact`, `cay_tags`, `cay_owner` | `SUPPORTED_SERVICE_KEY` |
| **deals** | `cay_fixture_id`, `cay_run_id`, `cay_scenario_id`, `cay_contact_email` | `SUPPORTED_SERVICE_KEY` |

### Not Service Key–executable in this portal

| Object family | Prior inventory (not granted here) | Class |
| --- | --- | --- |
| **notes** | `cay_fixture_id`, `cay_run_id`, `cay_scenario_id`, `cay_kind`, `cay_contact_email` | `UNMAPPED` |
| **emails** | same | `UNMAPPED` |
| **tasks** | same (+ escalation markers as needed) | `UI_ONLY_OR_BETA` (unverified) |
| **meetings** | same | `UI_ONLY_OR_BETA` (unverified) |

Portable CAP-001 exam unchanged. HubSpot live predicates that need unfaithful activity `cay_*` fail closed / stay out of comparison totals — not model blame.

| Property | Type | Purpose |
| --- | --- | --- |
| `cay_fixture_id` | string | Stable CAP-001 fixture identity across object types |
| `cay_run_id` | string | Seed/reset run isolation |
| `cay_scenario_id` | string | Optional scenario ownership |
| `cay_kind` | string | note \| task \| outbound \| escalation \| flag \| appointment |
| `cay_contact_email` | string | **Auxiliary label only.** Authoritative ownership = HubSpot contact **association**. |

Also provision contact exam semantics (still one-time): `cay_status`, `cay_do_not_contact`, `cay_tags`, `cay_owner`.

**Runtime Service Key** only writes property **values** under `contacts.write` (and `deals.write` later). Do **not** put `crm.schemas.*.write` on the steady-state Service Key. Runtime schema-write remains **0**.

## Why not email-only identity?

Embedding `runId` in the contact email local-part can isolate contacts, but CAP-001 needs the **same fixture IDs** on deals (and, if/when proven, activities). Email alone cannot key that graph.

## Activity identity alternative (cheapest faithful candidate)

Association-only archive and native body/subject encoding are **reject / fail closed** (false-positive risk on shared baseline contacts / content collision).

**Viable with controls (unproven):** seed-time native HubSpot activity ID ledger + association verify — requires separate design/authorization. Until then, do not Service Key–provision activity `cay_*`.

## Official create-property pointer

Setup-only (latest OpenAPI, re-verified 2026-09-17):

`POST /crm/properties/2026-09/{objectType}`

Source: [create-property.md](https://developers.hubspot.com/docs/api-reference/latest/crm/properties/create-property.md)

### Service Key–executable setup scopes (this portal)

| objectType | setup scope |
| --- | --- |
| contacts | `crm.schemas.contacts.write` (+ `.read` for pre/post) |
| deals | `crm.schemas.deals.write` (+ `.read` for pre/post) |

### Documented on API pages but NOT in Service Key catalog here

| objectType | documented scope (not grantable via Service Key UI) |
| --- | --- |
| notes | `crm.schemas.notes.write` |
| tasks | `crm.schemas.tasks.write` |
| meetings | `crm.schemas.meetings.write` |
| emails | `crm.schemas.emails.write` |

Dry package uses property group name `cay_cap001` with label `CanAIYet CAP-001` and `displayOrder=10000`, **once per object family that is Service Key–supported** for setup execution. Official create-group path: `POST /crm/properties/2026-09/{objectType}/groups`. See `docs/HUBSPOT_PROPERTY_GROUP_PROVENANCE.md` + setup packet.

Property payloads use `type=string`, `fieldType=text`, `groupName=cay_cap001`. Idempotence: existing compatible property/group = no-op; incompatible or archived definition = fail closed.

See `docs/HUBSPOT_METADATA_SETUP_CREDENTIAL_PACKET.md` + `docs/HUBSPOT_DEALS_SCOPE_APPROVAL_PACKET.md`.

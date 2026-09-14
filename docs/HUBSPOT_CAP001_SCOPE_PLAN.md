# HubSpot CAP-001 exact scope / API provenance (CAY-08)

**Status:** exact least-authority matrix for human review — **not** authorization to expand scopes, call live APIs, or change the Service Key.  
**Current Service Key (unchanged):** `crm.objects.contacts.read`, `crm.objects.contacts.write`.  
**Machine source of truth:** `evals/hubspot/cap001/scope-matrix.ts`.

## How to read blockers

| Label | Meaning |
| --- | --- |
| `BLOCKED_SCOPE` | Chosen HubSpot endpoint’s Required Scopes accordion lists a scope we do **not** have. |
| `BLOCKED_ADAPTER` | Required scope is already granted (or local-only), but CAP-001 live adapter cannot claim READY — missing code **or** unresolved vendor-doc conflict (`DOC_CONFLICT`) blocking deterministic observation/reset. |
| `LOCAL_ONLY` | No HubSpot call for this tool semantic. |

**Environment-level (all 12 live scenarios):** full CAP-001 live seed / preflight / authoritative snapshot needs baseline **deals**. Until `crm.objects.deals.read` + `crm.objects.deals.write` are granted, every scenario’s `liveStatus` stays `BLOCKED_SCOPE` for that environment reason — **not** because notes/tasks need extra activity scopes. CAY-10 dry-certifies **settled** contact-scoped tools (`contacts`/`notes`/`tasks`/`escalate`/`flag`) as `READY` under contacts scopes (injected HTTP only). `send_reply` / `get_availability` / `create_appointment` stay `BLOCKED_ADAPTER` while Meeting/Email archive provenance is `DOC_CONFLICT`.

## Per-object / per-operation API version provenance

HubSpot’s dated paths are **not** uniform across families **or** across operations on the same family. We do **not** stamp the whole environment as one date.

| Object family | Summary pin | Operation authority |
| --- | --- | --- |
| Contacts | `2026-03` | search/get/update on dated `2026-03` contacts paths (proven CAY-06) |
| Notes / Tasks | `2026-09` | create/list/archive settled on latest OpenAPI named paths |
| Meetings / Emails | **mixed (operation-level)** | create/list = `2026-09`; **archive = `DOC_CONFLICT`** (OpenAPI 2026-09 vs rendered/dated 2026-03) |
| Deals | **mixed (operation-level)** | create/read/update = `2026-09/0-3`; **archive = `2026-03`** |
| Properties (setup-only) | `2026-09` | create-property; **not** a runtime Service Key grant |

`EnvironmentManifest.apiVersion` remains the contacts pin (`2026-03`).  
`apiVersionsByObjectFamily` is a **summary** only.  
`apiVersionsByOperation` + the exact matrix are authority when a family is mixed.

## Exact tool matrix

Columns: **CanAIYet tool → HubSpot representation → action → endpoint/version → required scope → already granted vs new**.

| Tool | HubSpot representation | Action | Endpoint / version | Required scope(s) | Grant | Live block |
| --- | --- | --- | --- | --- | --- | --- |
| `search_contact` | Contact search | search | `POST /crm/objects/2026-03/contacts/search` | `crm.objects.contacts.read` | already granted | `READY` |
| `get_contact` | Contact | read | `GET /crm/objects/2026-03/contacts/{contactId}` | `crm.objects.contacts.read` | already granted | `READY` |
| `create_task` | Task engagement | create | `POST /crm/objects/2026-09/tasks` | `crm.objects.contacts.write` | already granted | `READY` |
| `get_deal` | Deal (`0-3`) | read | `GET /crm/objects/2026-09/0-3/{dealId}` | `crm.objects.deals.read` | **genuinely new** | `BLOCKED_SCOPE` |
| `update_deal` | Deal (`0-3`) | update | `PATCH /crm/objects/2026-09/0-3/{dealId}` | `crm.objects.deals.write` | **genuinely new** | `BLOCKED_SCOPE` |
| `add_note` | Note engagement | create | `POST /crm/objects/2026-09/notes` | `crm.objects.contacts.write` | already granted | `READY` |
| `draft_reply` | Local draft | compose | `(local)` | none | not required | `LOCAL_ONLY` |
| `send_reply` | Email engagement log (Envelope A) | create | `POST /crm/objects/2026-09/emails` | `crm.objects.contacts.write` **OR** `sales-email-read` | already granted (via contacts.write) | `BLOCKED_ADAPTER` (`DOC_CONFLICT` archive) |
| `get_policy` | Local policy pack | read | `(local)` | none | not required | `LOCAL_ONLY` |
| `get_availability` | Meeting engagement | read | `GET /crm/objects/2026-09/meetings/{meetingId}` | `crm.objects.contacts.read` | already granted | `BLOCKED_ADAPTER` (`DOC_CONFLICT` archive) |
| `create_appointment` | Meeting engagement | create | `POST /crm/objects/2026-09/meetings` | `crm.objects.contacts.write` | already granted | `BLOCKED_ADAPTER` (`DOC_CONFLICT` archive) |
| `escalate` | Task (and/or note) | create | `POST /crm/objects/2026-09/tasks` | `crm.objects.contacts.write` | already granted | `READY` |
| `flag` | Contact property / note | update | `PATCH /crm/objects/2026-03/contacts/{contactId}` | `crm.objects.contacts.write` | already granted | `READY` |

### Environment-owned Deal lifecycle (justifies live env scopes)

These are **not** model-facing tools. They are the seed → authoritative read → reset path that keeps every CAP-001 scenario `BLOCKED_SCOPE` until Deals are authorized.

Deal **object type ID** is **`0-3`** (Deal object definition). Create/read/update use official `2026-09/0-3` paths. **Archive must not inherit that version** — it is documented separately on the `2026-03` generic object template.

| Env mechanic | HubSpot representation | Action | Endpoint / version | Required scope(s) | Grant | Live block |
| --- | --- | --- | --- | --- | --- | --- |
| `env.seed_deal` | Deal (`0-3`) | create (baseline seed) | `POST /crm/objects/2026-09/0-3` | `crm.objects.deals.write` | **genuinely new** | `BLOCKED_SCOPE` |
| `env.authoritative_read_deal` | Deal (`0-3`) | read (authoritative snapshot) | `GET /crm/objects/2026-09/0-3/{dealId}` | `crm.objects.deals.read` | **genuinely new** | `BLOCKED_SCOPE` |
| `env.archive_deal` | Deal (`0-3`) | archive/reset cleanup | `DELETE /crm/objects/2026-03/{objectType}/{objectId}` with `objectType=0-3` | `crm.objects.deals.write` | **genuinely new** | `BLOCKED_SCOPE` |
| `env.batch_archive_deal` | Deal (`0-3`) | batch archive/reset | `POST /crm/objects/2026-03/0-3/batch/archive` | `crm.objects.deals.write` | **genuinely new** | `BLOCKED_SCOPE` |

Effective single-archive URL after binding: `DELETE /crm/objects/2026-03/0-3/{objectId}` (from dated Deal archive reference + Deal object type ID). Do **not** copy create/read/update’s `2026-09` onto archive.

### Smallest future Service Key delta (if human later accepts full CAP-001 live env)

Only these are **genuinely new** relative to today:

- `crm.objects.deals.read`
- `crm.objects.deals.write`

Do **not** add notes/tasks/meetings/emails object scopes solely because CAP-001 uses those tools — current Required Scopes pages authorize them under contact scopes we already hold.

## Custom test metadata (least authority)

See also `docs/HUBSPOT_CAP001_METADATA_PLAN.md` (CAY-10): prefer one-time `cay_fixture_id` + `cay_run_id` on contacts and deals.

| Need | Strategy |
| --- | --- |
| `cay_fixture_id`, `cay_run_id`, `cay_scenario_id`, DNC/tags/flag encodings | **Provision once** in the HubSpot test account (UI or short-lived setup credential) |
| Runtime Service Key | Keep object write only (`contacts.*`, and deals only if accepted later) |
| Avoid | Permanent `crm.schemas.contacts.write` on the runtime Service Key “for convenience” |

Create-property docs (setup-only): HubSpotDev `fetch-doc` of latest create-property (2026-09-14) returned OpenAPI `POST /crm/properties/2026-09/{objectType}` (CAY-09: current official docs win). That is a **setup** authority, not a steady-state CAP-001 runtime authority. Runtime schema-write remains 0.

## Official sources checked (2026-09-13 / activity archive re-fetch 2026-09-14)

- Contacts `2026-03` create / get / update / search Required Scopes
- Notes / Tasks `2026-09` create / get / **delete** Required Scopes (latest OpenAPI named paths — settled)
- Meetings / Emails create / list `2026-09` (settled); **archive = DOC_CONFLICT** (see below)
- Deals create / get / update Required Scopes (`0-3` on `2026-09`)
- Deals archive Required Scopes on dated `2026-03` path (`DELETE /crm/objects/2026-03/{objectType}/{objectId}`; Deal `objectType=0-3`)
- Deals batch archive on dated `2026-03` (`POST /crm/objects/2026-03/0-3/batch/archive`)
- Properties create Required Scopes (setup-only; latest OpenAPI `2026-09`)

### meetings.archive / emails.archive — DOC_CONFLICT (retrieval 2026-09-14)

Vendor protocol: when official sources disagree, **STOP** the contested fact; do not silently pick one. Not live-ready — `archiveMeeting` / `archiveEmail` and any reset/seed cleanup that would call them fail closed (`ADAPTER_GAP` + `DOC_CONFLICT` message).

| Operation | OpenAPI / latest embed (WebFetch scrape) | Independent rendered / dated observation |
| --- | --- | --- |
| `meetings.archive` | `DELETE /crm/objects/2026-09/meetings/{meetingId}` — [latest delete-meeting](https://developers.hubspot.com/docs/api-reference/latest/crm/activities/meetings/delete-meeting) | Same latest URL rendered as `DELETE /crm/objects/2026-03/{objectType}/{objectId}`; dated [2026-03 delete-meeting](https://developers.hubspot.com/docs/api-reference/2026-03/crm/activities/meetings/delete-meeting) |
| `emails.archive` | `DELETE /crm/objects/2026-09/emails/{emailId}` — [latest delete-email](https://developers.hubspot.com/docs/api-reference/latest/crm/activities/emails/delete-email) | Same latest URL rendered as `DELETE /crm/objects/2026-03/emails/{emailId}`; dated [2026-03 delete-email](https://developers.hubspot.com/docs/api-reference/2026-03/crm/activities/emails/delete-email) |

Also: `llms.txt` lists both `crm-meetings-v2026-09` / `crm-emails-v2026-09` and `crm-meetings-v2026-03` / `crm-emails-v2026-03`; direct JSON asset URLs returned **Asset not found** (2026-09-14). Notes archive + task delete + create-property remain settled `2026-09` — do not reopen.

**Do not change the Service Key until this matrix is accepted and a separate human authorization receipt names the exact scopes.**

# HubSpot CAP-001 exact scope / API provenance (CAY-08 / CAY-11)

**Status:** exact least-authority matrix for human review — **not** authorization to expand scopes, call live APIs, or change the Service Key.  
**Current Service Key (unchanged):** `crm.objects.contacts.read`, `crm.objects.contacts.write`.  
**Machine source of truth:** `evals/hubspot/cap001/scope-matrix.ts`.

## How to read blockers

| Label | Meaning |
| --- | --- |
| `BLOCKED_SCOPE` | Chosen HubSpot endpoint’s Required Scopes accordion lists a scope we do **not** have. |
| `BLOCKED_ADAPTER` | Required scope is already granted (or local-only), but CAP-001 live adapter cannot claim READY — missing code. |
| `LOCAL_ONLY` | No HubSpot call for this tool semantic. |

**Environment-level (all 12 live scenarios):** full CAP-001 live seed / preflight / authoritative snapshot needs baseline **deals**. Until `crm.objects.deals.read` + `crm.objects.deals.write` are granted, every scenario’s `liveStatus` stays `BLOCKED_SCOPE` for that environment reason — **not** because notes/tasks/meetings/emails need extra activity scopes. CAY-11 dry-certifies contact-scoped tools (`contacts`/`notes`/`tasks`/`escalate`/`flag`/`send_reply`/`get_availability`/`create_appointment`) as `READY` under contacts scopes (injected HTTP only).

## Per-object / per-operation API version provenance

HubSpot’s dated paths are **not** uniform across families **or** across operations on the same family. We do **not** stamp the whole environment as one date.

| Object family | Summary pin | Operation authority |
| --- | --- | --- |
| Contacts | `2026-03` | search/get/update on dated `2026-03` contacts paths (proven CAY-06) |
| Notes / Tasks | `2026-09` | create/list/archive settled on latest OpenAPI named paths |
| Meetings / Emails | `2026-09` | create/list/archive CAP-001 pin `2026-09` (CAY-11); 2026-03 coexists as older supported contract |
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
| `send_reply` | Email engagement log (Envelope A) | create | `POST /crm/objects/2026-09/emails` | `crm.objects.contacts.write` **OR** `sales-email-read` | already granted (via contacts.write) | `READY` |
| `get_policy` | Local policy pack | read | `(local)` | none | not required | `LOCAL_ONLY` |
| `get_availability` | Meeting engagement | read | `GET /crm/objects/2026-09/meetings/{meetingId}` | `crm.objects.contacts.read` | already granted | `READY` |
| `create_appointment` | Meeting engagement | create | `POST /crm/objects/2026-09/meetings` | `crm.objects.contacts.write` | already granted | `READY` |
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

See also `docs/HUBSPOT_CAP001_METADATA_PLAN.md` (CAY-10): prefer one-time provisioning of the **full required family-specific `cay_*` set** (contacts, deals, notes, tasks, meetings, emails — not merely fixture/run shorthand).

| Need | Strategy |
| --- | --- |
| Full family-specific `cay_*` set per metadata plan | **Provision once** in the HubSpot test account (UI or short-lived setup credential) |
| Runtime Service Key | Keep object write only (`contacts.*`, and deals only if accepted later) |
| Avoid | Permanent `crm.schemas.contacts.write` on the runtime Service Key “for convenience” |

Create-property docs (setup-only): HubSpotDev `fetch-doc` of latest create-property (2026-09-14) returned OpenAPI `POST /crm/properties/2026-09/{objectType}` (CAY-09: current official docs win). That is a **setup** authority, not a steady-state CAP-001 runtime authority. Runtime schema-write remains 0.

## Official sources re-checked (2026-09-17 readiness refresh)

| Operation | Result | Source |
| --- | --- | --- |
| Deals create | `POST /crm/objects/2026-09/0-3` · scope `crm.objects.deals.write` | [create-deal.md](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/create-deal.md) |
| Deals read | `GET /crm/objects/2026-09/0-3/{dealId}` · scope `crm.objects.deals.read` | [get-deal.md](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/get-deal.md) |
| Deals update | `PATCH /crm/objects/2026-09/0-3/{dealId}` · scope `crm.objects.deals.write` | [update-deal.md](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/update-deal.md) |
| Deals archive | **CAP-001 pin unchanged:** `DELETE /crm/objects/2026-03/0-3/{dealId}` · `crm.objects.deals.write`. Newer Current also documents `DELETE /crm/objects/2026-09/0-3/{dealId}` — coexistence; **do not silently migrate**. | [2026-03 delete-deal.md](https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/deals/delete-deal.md) + [latest delete-deal.md](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/delete-deal.md) |
| Deals batch archive | **CAP-001 pin unchanged:** `POST /crm/objects/2026-03/0-3/batch/archive`. Latest also documents `2026-09` batch archive — coexistence. | [2026-03 batch/delete-deals.md](https://developers.hubspot.com/docs/api-reference/2026-03/crm/objects/deals/batch/delete-deals.md) + latest batch delete |
| Create property | `POST /crm/properties/2026-09/{objectType}` · setup schema scopes (contacts/deals/notes/tasks/meetings/emails) | [create-property.md](https://developers.hubspot.com/docs/api-reference/latest/crm/properties/create-property.md) |
| List properties | `GET /crm/properties/2026-09/{objectType}` · includes `crm.objects.contacts.read` among OR scopes | [get-properties.md](https://developers.hubspot.com/docs/api-reference/latest/crm/properties/get-properties.md) |
| Write validation | Enforced on `/2026-09/` since 2026-09-08 | [changelog](https://developers.hubspot.com/changelog/crm-api-write-validation-enforcement) |

Direct `/docs/specs/2026-09/*.json` URLs still return Asset not found; authority remains the public `.md` OpenAPI embeds (same pattern as CAY-11).

## Official sources checked (2026-09-13 / activity archive re-fetch 2026-09-14)

- Contacts `2026-03` create / get / update / search Required Scopes
- Notes / Tasks `2026-09` create / get / **delete** Required Scopes (latest OpenAPI named paths — settled)
- Meetings / Emails create / list / **archive** `2026-09` (CAY-11 CAP-001 pin); 2026-03 coexists (see below)
- Deals create / get / update Required Scopes (`0-3` on `2026-09`)
- Deals archive Required Scopes on dated `2026-03` path (`DELETE /crm/objects/2026-03/{objectType}/{objectId}`; Deal `objectType=0-3`)
- Deals batch archive on dated `2026-03` (`POST /crm/objects/2026-03/0-3/batch/archive`)
- Properties create Required Scopes (setup-only; latest OpenAPI `2026-09`)

### meetings.archive / emails.archive — RESOLVED_VERSION_COEXISTENCE (retrieval 2026-09-14)

**Disposition:** `RESOLVED_VERSION_COEXISTENCE` — **not** `DOC_CONFLICT_PERSISTS`.

HubSpot [versioning](https://developers.hubspot.com/docs/developer-tooling/platform/versioning): date-based API versions are GA every ~6 months and are immutable supported contracts (Current → Supported → Unsupported after ~18 months). Two dates alone do **not** imply contradiction.

| Operation | CAP-001 pin (2026-09 OpenAPI) | Coexisting older contract (2026-03 OpenAPI) |
| --- | --- | --- |
| `meetings.archive` | `DELETE /crm/objects/2026-09/meetings/{meetingId}` — named spec `specs/2026-09/crm-meetings-v2026-09.json`; scopes: `crm.objects.contacts.write` — public [.md](https://developers.hubspot.com/docs/api-reference/latest/crm/activities/meetings/delete-meeting.md) (curl HTTP 200 @ `2026-09-14T04:59:20Z`) | `DELETE /crm/objects/2026-03/meetings/{meetingId}` — [2026-03 delete-meeting](https://developers.hubspot.com/docs/api-reference/2026-03/crm/activities/meetings/delete-meeting) |
| `emails.archive` | `DELETE /crm/objects/2026-09/emails/{emailId}` — named spec `specs/2026-09/crm-emails-v2026-09.json`; scopes: `crm.objects.contacts.write` **OR** `sales-email-read` — public [.md](https://developers.hubspot.com/docs/api-reference/latest/crm/activities/emails/delete-email.md) (curl HTTP 200 @ `2026-09-14T04:59:20Z`) | `DELETE /crm/objects/2026-03/emails/{emailId}` — [2026-03 delete-email](https://developers.hubspot.com/docs/api-reference/2026-03/crm/activities/emails/delete-email) |

**Independent reproduction (no MCP / no auth):** curl the `.md` URLs above → HTTP 200; OpenAPI operation header names the `specs/2026-09/...` asset + exact DELETE path + ScopesList. HubSpot [`_llms/apis/2026-09/crm.md`](https://developers.hubspot.com/docs/_llms/apis/2026-09/crm.md) lists those same `.md` links as the 2026-09 CRM tree. Prefer exact `/api-reference/2026-09/...` if published — those HTML paths currently **404**. Direct `/docs/specs/2026-09/crm-*-v2026-09.json` still **Asset not found**. Rendered HTML without `.md` may still look 2026-03-shaped; authority is the public `.md` OpenAPI embed (not MCP-only). CAP-001 pins archive to **2026-09** (same as create/list; newest Current GA).

**Do not change the Service Key until this matrix is accepted and a separate human authorization receipt names the exact scopes.**

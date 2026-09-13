# HubSpot CAP-001 minimum API / scope plan (CAY-08)

**Status:** planning boundary for human review — **not** authorization to expand scopes or call live APIs.  
**Current Service Key:** `crm.objects.contacts.read`, `crm.objects.contacts.write` only.  
**Pinned Contacts version:** `2026-03` (`/crm/objects/2026-03/contacts`).

## Adapter boundary

| Implementation | Role |
| --- | --- |
| `HubSpotCap001EnvironmentPort` | Port for seed/reset/authoritative read |
| `HubSpotCap001Store` (`kind: mock`) | In-memory calibration harness |
| `LiveHubSpotCap001Adapter` (`kind: live`) | Fail-closed live boundary; no invented CRM state |

Live adapter currently returns `ADAPTER_GAP` / `SCOPE_GAP` for full CAP-001 seed/snapshot. Commissioning Contacts transport remains separate and accepted.

## Semantic vs live readiness

- `semanticStatus: MAPPED|UNMAPPED` — can the exam be judged from HubSpot-shaped state?
- `liveStatus: READY|BLOCKED_SCOPE|BLOCKED_ADAPTER` — can we execute live today?
- Future live comparison totals use **`liveStatus === READY` only** (currently **0** scenarios).

## Minimum Envelope A object/action plan (for later review)

Derived from HubSpot CRM object model + CAP-001 mapping (design §3). Exact scope names must be re-checked against current HubSpot scope docs before any key change.

| Object / action | CAP-001 need | Likely scope family (review before grant) | Notes |
| --- | --- | --- | --- |
| Contacts CRUD + properties (DNC, tags, phone) | All LEADs | `crm.objects.contacts.read/write` | Already granted; custom props may need property create once |
| Deals + pipeline stage | LEAD-001/002/… | `crm.objects.deals.read/write` | Dedicated test pipeline |
| Notes / engagements | CRM notes | `crm.objects.contacts` + engagements/notes scopes as documented | Judge searches note body |
| Tasks | Follow-up tasks / escalation markers | tasks scopes per current docs | Or ticket+`cay_escalated` |
| Outbound engagement log (Envelope A) | “sent” without marketing send | engagements write; **not** marketing send | Structured log preferred |
| Appointments / meetings | LEAD-007/011 | meetings or custom object | Preserve conflict/open-slot fixtures |
| Custom properties (`cay_fixture_id`, `cay_run_id`, flags) | Seed provenance | property write once, then object write | Idempotent upsert key |

**Do not expand the Service Key in this correction.** After independent acceptance of the adapter boundary + this plan, human may authorize a separate scope-change receipt.

## Official references to re-check before scope change

- Contacts guide / OpenAPI `2026-03`
- HubSpot scopes catalog
- Engagements / notes / tasks / deals / meetings API guides for the chosen date-based version

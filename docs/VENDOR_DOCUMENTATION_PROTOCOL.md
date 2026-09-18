# Vendor documentation protocol

**Status:** laboratory operating rule (CAY-09)  
**Authority:** complements root `AGENTS.md`; does not replace `canonical-build-doc.md`.

## Purpose

Enterprise **business truth** comes from the enterprise environment.  
Enterprise **API truth** comes from the vendor’s **current** official documentation.  
Models help reason about both; they invent neither.

## Triggers (must consult current official docs)

Before implementing or changing any of:

- endpoint path or HTTP method
- API version / dated path
- OAuth/scope/permission requirements
- validation, pagination, rate-limit, or idempotency semantics
- destructive, archive, reset, or cleanup behavior

…read current official vendor documentation first. Do **not** treat prior chat memory, training recall, or an older in-repo paraphrase as authority.

## Source hierarchy

1. Official vendor docs root / product documentation site.
2. Official AI-friendly index when published (HubSpot: `/docs/llms.txt`).
3. Official OpenAPI / machine-readable specs linked from that index.
4. Exact API reference page for the operation (Required Scopes + path).
5. Optional: vendor **Developer MCP** docs tools (`search-docs` → `fetch-doc`) as a discovery aid — still cite the underlying official URL.

Never use the vendor’s **remote CRM / data MCP** as a substitute for documentation authority or as capability evidence unless a separate human-authorized mission says so.

## Required evidence fields

When recording vendor API provenance in-repo (matrix, plan, receipt, or comment), include:

| Field | Example |
| --- | --- |
| Source URL | exact docs/OpenAPI page |
| Retrieval date | `YYYY-MM-DD` |
| Operation | create / read / update / archive / … |
| Method + path + version | `DELETE /crm/objects/2026-03/{objectType}/{objectId}` |
| Required scopes + scope logic | `crm.objects.deals.write` (all / any) |
| Already granted vs new | for permission decisions |

Do **not** download or mirror the vendor’s full documentation corpus into this repository.

## Conflict / ambiguity handling

If official sources disagree (e.g. guide prose vs OpenAPI path, or different dated pages for create vs archive):

1. **STOP** implementing the contested fact as if settled.
2. Surface the conflict with both URLs and retrieval dates.
3. Prefer **operation-level** provenance over family-level stamps when dates differ by operation.
4. Wait for independent review / human decision when the conflict affects permissions or live behavior.

## API → auth product → environment → live evidence (mandatory)

**Lesson doc:** `docs/API_AUTH_ENVIRONMENT_EVIDENCE_LADDER.md` (CAY-20260917-API-AUTH-ENVIRONMENT-EVIDENCE-GAP).

Official API docs (layer 1) are **necessary and not sufficient** for live readiness. Before any permission or setup packet may be called **live-ready**, record evidence for all four layers:

| Layer | Must show |
| --- | --- |
| **API surface** | Exact operation, method/path/version, Required Scopes / OR logic, source URL, retrieval date |
| **Authorization-product surface** | The credential type in use (e.g. HubSpot Service Key vs OAuth app) can expose that permission |
| **Configured-environment surface** | This exact portal/account/edition shows the scope as selectable/grantable (UI catalog or equivalent) |
| **Live execution evidence** | When authorized: bounded call succeeds and authoritative state proves the effect |

### Fail-closed rules

- A scope string appearing in generic API docs does **not** prove the auth product can grant it, or that this environment offers it.
- Live UI/account observation may falsify a stronger docs-only implementation assumption — preserve the failed assumption as evidence.
- Never silently substitute a broader permission to bypass a missing layer.
- Never blame the model for an auth / representation / environment mismatch.
- Do not label a representation `UNMAPPED` solely because an auth-product catalog lacks a scope; that needs representation evidence.
- Do not edit `canonical-build-doc.md` for this rule unless independent review later promotes it.

### Required evidence fields (extends table above)

When a packet claims live executability, also include:

| Field | Example |
| --- | --- |
| Auth product | `HubSpot Service Key` |
| Target environment | portal `247381023` / account name |
| Observed selectable scopes | exact list from UI catalog observation (or grant receipt) |
| Live validation receipt | id / date / mutations bound (or `not_authorized_yet`) |
| Ladder status | `DOCUMENTED` / `OBSERVED_SELECTABLE` / `BLOCKED_AUTH_SURFACE` / `UNMAPPED` / `LIVE_PROVEN` |

## Docs discovery vs experimental system access

| Channel | Use for |
| --- | --- |
| Official docs / `llms.txt` / OpenAPI / Developer MCP docs tools | What the API is |
| Live vendor environment + Service Key / adapters | What the exam does in that environment |
| Remote CRM MCP | Not default; not capability evidence without separate authorization |

## Relation to EnvironmentManifest

`EnvironmentManifest` may summarize versions (`apiVersion`, `apiVersionsByObjectFamily`, `apiVersionsByOperation`). The **exact operation matrix** with source URLs remains the provenance authority when summaries are mixed.

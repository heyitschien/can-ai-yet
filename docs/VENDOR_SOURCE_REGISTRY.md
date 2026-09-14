# Vendor source registry

**Status:** living registry (start with HubSpot; CAY-09)  
**Rule:** discovery pointers only — do not mirror vendor documentation into the repo.

## HubSpot

| Role | Source | Notes |
| --- | --- | --- |
| Docs root | https://developers.hubspot.com/docs | Official developer documentation |
| AI-friendly index | https://developers.hubspot.com/docs/llms.txt | Lists guides + OpenAPI/spec links |
| OpenAPI / specs | Linked from `llms.txt` (e.g. `/docs/specs/2026-09/…`, `/docs/specs/2026-03/…`) | Prefer dated specs for exact paths |
| Developer MCP (local) | HubSpot CLI `hs mcp setup` → Cursor server name **`HubSpotDev`** | Docs/dev tooling: `search-docs`, `fetch-doc`, plus project/CMS helpers |
| Developer MCP setup docs | https://developers.hubspot.com/docs/developer-tooling/local-development/mcp-server | Requires HubSpot CLI **≥ 8.2.0** |
| Developer MCP tools reference | https://developers.hubspot.com/docs/developer-tooling/local-development/developer-mcp/tools | Documents `search-docs` / `fetch-doc` |
| Remote CRM MCP | https://mcp.hubspot.com (separate product) | **NOT** used for CanAIYet capability evidence. Distinct from Developer MCP. Do not introduce into the experiment unless separately authorized. |

### Local Developer MCP evidence (CAY-09)

Recorded 2026-09-13 on the builder machine (non-secret):

| Item | Value |
| --- | --- |
| HubSpot CLI | `8.14.0` (`npm install -g @hubspot/cli`) |
| Setup command | `hs mcp setup --client cursor --no-standalone` |
| Cursor MCP server name | `HubSpotDev` |
| Launch | `hs mcp start --ai-agent cursor` |
| Tools verified via MCP `tools/list` | includes `search-docs`, `fetch-doc` (among others) |
| `fetch-doc` smoke | retrieved public Deal create page; content included `2026-09` and object type `0-3` |
| `search-docs` live query | requires authenticated HubSpot CLI account (`hs account auth` / MCP `auth-account`); not completed in this mission (no CRM experiment) |
| Remote CRM MCP | **not** configured |

Human follow-up (optional, not part of CAY-09 acceptance of docs rules): run `hs account auth` (or MCP `auth-account`) so `search-docs` can call HubSpot’s docs-search API. `fetch-doc` already works against public `.md` documentation URLs without CRM scopes.

### Explicit non-sources

- Model memory / prior chat paraphrases of HubSpot APIs
- Undocumented path aliases inferred from neighboring operations
- `@hubspot/mcp-server` / remote CRM MCP tool results as proof of CAP-001 capability

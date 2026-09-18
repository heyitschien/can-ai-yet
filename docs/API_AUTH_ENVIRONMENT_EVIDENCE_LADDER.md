# API → auth → environment → live evidence ladder

**Status:** durable laboratory lesson (vendor-neutral)  
**Receipt:** CAY-20260917-API-AUTH-ENVIRONMENT-EVIDENCE-GAP  
**Mission Control:** Issue #1 `#5725051934`  
**Related HubSpot finding:** `#5724957946` (Service Key scope catalog mismatch)

## One-line rule

**API support ≠ credential authorization surface ≠ configured-environment capability ≠ live execution evidence.**

A lower layer never proves a higher layer. Official docs are necessary and not sufficient for live readiness.

## The four layers

| Layer | Question | What counts as evidence |
| --- | --- | --- |
| **1. API surface** | Does the vendor document this operation, path, version, and scope string? | Current official docs / OpenAPI for that exact operation |
| **2. Authorization-product surface** | Can *this credential type* (Service Key, OAuth app, private app, PAT, …) expose or grant that permission? | Product UI / auth product docs for that credential kind — not only the API reference |
| **3. Configured-environment surface** | Does *this exact portal/account/edition* offer and accept that permission? | Observation in the target environment (selector contents, grant result, edition limits) |
| **4. Live execution evidence** | Did a bounded authorized call succeed, and did authoritative state prove the effect? | Receipt with request identity + before/after authoritative read |

### Non-implications (fail closed)

- Layer 1 does **not** prove layer 2, 3, or 4.
- Layer 2 does **not** prove layer 3 or 4 (another account may differ).
- Layer 3 does **not** prove layer 4 (selectable ≠ successfully used for our payload).
- Training memory, chat paraphrase, and older in-repo packets do **not** replace current layers 1–4.

### Operating consequences

1. Preserve a **failed stronger assumption** as evidence (do not silently rewrite history).
2. Never **substitute a broader permission** to paper over a missing layer.
3. Never **blame the model** for an auth / representation / environment mismatch.
4. Live UI or account state may **falsify** an implementation assumption that looked correct from docs alone.
5. Do **not** overclaim permanence: “not selectable on this auth product in this portal today” is not the same as “impossible forever” or “UNMAPPED representation.”

Independent review may later decide whether this ladder deserves promotion into `canonical-build-doc.md`. This mission does **not** edit that file.

## Concrete case — HubSpot CAP-001 Lab (portal `247381023`)

### Failed stronger assumption (preserve)

PR **#33** built a temporary Service Key setup packet with **12** `crm.schemas.{contacts|deals|notes|tasks|meetings|emails}.{read|write}` scopes, because:

- Layer 1: generic Properties API create/get pages list those schema scope strings among OR alternatives.

That was a reasonable **API-surface** hypothesis. It was **not** proof of layers 2–4 for activity families.

### Falsification (layer 3)

Human observation in CanAIYet CAP-001 Lab Service Key UI (`#5724957946`):

- **Observed selectable:** `crm.schemas.contacts.read/write`, `crm.schemas.deals.read/write`
- **Not in observed catalog:** `crm.schemas.{notes|tasks|meetings|emails}.{read|write}`

Therefore the **12-scope Service Key packet is SUPERSEDED / NOT EXECUTABLE AS WRITTEN** in this real test account.

Scientific class: **environment permission / authorization-surface mismatch** — not model failure.

### What remains unknown (do not overclaim)

Absence of activity schema scopes from the Service Key selector does **not** by itself prove:

- that custom properties/groups are impossible for notes/tasks/meetings/emails;
- that another auth product could not authorize them;
- that representation must be `UNMAPPED`.

Those require **representation testing** and/or another auth-product path. Until then, Service Key schema setup for those families is **`BLOCKED_AUTH_SURFACE`** in this portal — fail closed for live-ready claims.

Contacts/deals schema scopes are **`OBSERVED_SELECTABLE`** on the Service Key product here; they are still **not** `LIVE_PROVEN` until an authorized bounded create + authoritative re-read succeeds.

## Permission packets

A permission / setup packet may be called **live-ready** only when it carries explicit evidence for all four layers for every scope it claims:

1. Exact API operation (method/path/version + source URL + retrieval date)
2. Exact credential / auth product
3. Exact selectable/grantable scope in the **target** environment
4. Bounded live validation when human-authorized (or an explicit waiver recorded on Mission Control)

Machine companion for HubSpot families: `evals/hubspot/cap001/environment-evidence-matrix.ts`.  
Vendor protocol hook: `docs/VENDOR_DOCUMENTATION_PROTOCOL.md` § API → auth → environment → live evidence.

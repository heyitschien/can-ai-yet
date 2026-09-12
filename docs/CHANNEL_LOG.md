# Channel log

Short scan log. Newest first.

## CAY-20260911-07 — 2026-09-11

STATUS: READY_FOR_REVIEW  
What: Fixed PR #10 blockers — reject unsupported country/language (no silent US/en mislabel); parse Google `MonthOfYear` enums without inventing month `0`. Focused regression tests added.  
Head: pending commit on `feature/cay-20260911-06-demand-scout`  
Next: independent re-review. No Google live call. No model spend.

## CAY-20260911-06 — 2026-09-11

STATUS: READY_FOR_REVIEW  
What: Credentialless Demand Scout build — Google Ads v25 adapter, mock fixtures, cache, clustering, CLI, docs. Zero live Google calls in default/CI path. No developer token. No benchmark spend.  
Branch: `feature/cay-20260911-06-demand-scout`  
Docs: `docs/DEMAND_SCOUT_ARCHITECTURE.md`, `docs/GOOGLE_ADS_DEMAND_SCOUT_SETUP.md`, `docs/DEMAND_SCOUT_OPERATIONS.md`  
Next: independent review → human Google setup → one explicit `pnpm demand:smoke`.

## Earlier entries

See Mission Control Issue #1 and the OpenRouter prep / PR #2 lineage for CAY-05 fairness gate and CAP-001 run evidence. This `main`-based branch keeps Demand Scout separable from unpublished Sonnet evidence.

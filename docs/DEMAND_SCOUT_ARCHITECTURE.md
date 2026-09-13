# Demand Scout Architecture

**Status:** Phase 1 credentialless/mock-backed sensor  
**Receipt:** CAY-20260911-06  
**Does not:** publish claims, spend benchmark money, or auto-trigger evals

## What Demand Scout answers

Search demand helps CanAIYet decide **what deserves testing next**.

It does **not** answer:

- whether AI can do the work;
- whether anyone will pay;
- whether a public score should change.

## Separate from release Scout

`app/api/cron/scout` is the canonical **AI release/change Scout** skeleton. It currently queues review items and must not be overloaded with Google keyword research.

Demand Scout is a separate read-only sensor:

```text
Google Search demand
        ↓
Google Ads KeywordPlanIdeaService (v25 REST)
        ↓
GoogleAdsDemandSource
        ↓
normalize raw keywords
        ↓
cluster related human intentions
        ↓
demand evidence report
        ↓
human review
        ↓
CanAIYet decides what to test next
```

## Source-neutral contract

```ts
interface DemandSource {
  discoverIdeas(seed: DemandSeed, target: DemandTarget): Promise<DemandIdea[]>;
  getHistoricalMetrics(keywords: string[], target: DemandTarget): Promise<DemandMetric[]>;
}
```

First implementation: `GoogleAdsDemandSource` (+ `MockDemandSource` for CI/default local).

Future adapters without redesign:

- CanAIYet internal search / zero-result logs
- capability request volume
- Search Console
- optional Trends / SEO datasets

## Provenance rules

Every idea/metric keeps:

- raw keyword text
- normalized keyword
- avg monthly searches (or null)
- monthly series when returned
- competition / competition index when returned
- bid range micros when returned
- geo, language, network
- seed keyword/URL
- retrieval timestamp
- source name + API version
- request ID when available
- cache hit flag + original retrieval time

Missing metrics stay `null`. Never invent zeroes.

## Cache-first

Filesystem cache under `.cache/demand/` (gitignored). Default TTL **35 days**. `--refresh` bypasses hits. No Supabase demand tables in this phase.

## Clustering

Deterministic token/overlap clustering only. No LLM in v1. Related searches become candidate capability families while preserving raw members.

Ranking in v1 is **demand evidence only**. `businessValue`, `testability`, and `evidenceGap` remain explicit null future factors.

## Security / spend guardrails

- service-account auth; no developer-token header (sunset 2026-09-09)
- server-only env vars; never `NEXT_PUBLIC_*`
- no mutation Google Ads APIs
- no automatic demand → benchmark trigger
- CI and default CLI paths make **zero** Google calls
- `pnpm demand:smoke` is the only intentional live commissioning command

## Module map

```text
lib/demand/
  types.ts
  source.ts
  google-ads.ts
  mock.ts
  cache.ts
  normalize.ts
  cluster.ts
  report.ts
  cli.ts
  index.ts
  fixtures/
```

# Real-model runbook

**Status:** OPERATING RUNBOOK  
**Scope:** CAP-001 only, OpenRouter gateway, preparation path.  
**This does not authorize a paid run by itself.**

The accepted public baseline is still `reference-agent-v1`. A frontier-model score is not published until a human accepts a real run.

---

## What this path does

The harness keeps one tool-calling loop. OpenRouter is the gateway. The exact model ID changes. The Acme `World`, CAP-001 scenarios, allowed tools, and deterministic judge stay the same.

A chat reply is not a pass. Only tool calls through `World.call` change the simulated company. The judge checks that state afterward.

---

## Before anyone spends money

1. Confirm the exact model ID on OpenRouter. Do not use `openrouter/auto`, a brand name, or a routing suffix such as `:nitro` or `:floor`.
2. Confirm the live price. This repository does not quote a price.
3. Set a client-side stop threshold and a per-request reserve. This is not a provider charge ceiling. One in-flight request can still cost more, and that run is invalid.
4. Pin one provider slug. Also set a separate OpenRouter key or account limit outside this repo. This command cannot reserve money at the gateway before the reply.
5. Run the dry-run and read it. Dry-run makes zero paid requests.
6. A human sets `CANAIYET_PAID_RUN=1` and runs `--execute` from a clean commit. Agents do not do that unless Issue #1 has a spend receipt that names the exact model, provider, scenario set, and client stop.

Suggested candidate to verify, not a confirmed live ID and not an approval: `google/gemini-3-flash-preview`, seen on OpenRouter's public tool-calling docs during preparation. Check the catalog again before spend.

Default ceiling for a full CAP-001 dry-run: 12 scenarios, 8 turns each, 1 retry. That is up to 192 HTTP requests if retries are left at the default. The first paid smoke is one scenario only. Lower the caps before that run.

---

## Configure

Put these in the environment. Do not commit them.

```text
OPENROUTER_API_KEY=
OPENROUTER_MODEL=provider/exact-model-id
OPENROUTER_PROVIDER=one-provider-slug
OPENROUTER_MAX_SPEND_USD=1
OPENROUTER_REQUEST_RESERVE_USD=
OPENROUTER_MAX_TURNS=8
OPENROUTER_MAX_TOKENS=800
OPENROUTER_TIMEOUT_MS=45000
OPENROUTER_MAX_RETRIES=1
OPENROUTER_MAX_SCENARIOS=12
```

`CANAIYET_PAID_RUN` stays unset until the human approval gate.

---

## Scenario list and a stopped suite

`OPENROUTER_MAX_SCENARIOS=1` still runs a prefix, starting at LEAD-001. That is a labeled segment, not a 12-scenario score.

To rerun a later slice without paying for scenarios already scored, pass an explicit list or a forward range:

```text
pnpm exec tsx scripts/run-openrouter-cap001.ts --scenarios LEAD-006:LEAD-012
```

or `OPENROUTER_SCENARIO_IDS=LEAD-006,LEAD-007`. Execution stays in frozen CAP-001 order. A segment artifact says it is not a full score and must not be stitched to a different git SHA or config. Accepted evidence still needs one clean full run.

The dry-run also prints an observed cost plan when the model is `anthropic/claude-sonnet-4.6`. That range is not a bill. Response caching is not sent. Prompt-cache token fields are recorded only if the gateway returns them.

---

## Dry-run

```text
pnpm eval:openrouter
```

or:

```text
pnpm exec tsx scripts/run-openrouter-cap001.ts --dry-run
```

Read the printed plan: model, scenario count, caps, git SHA, fixture version, and persistence destination. If the model line is empty, stop.

---

## Paid run

Only after the dry-run looks right, the worktree is clean, and a human has approved the model ID, provider slug, one scenario, and stop threshold:

```text
CANAIYET_PAID_RUN=1 OPENROUTER_PROVIDER=<slug> OPENROUTER_MAX_SCENARIOS=1 OPENROUTER_MAX_RETRIES=0 OPENROUTER_REQUEST_RESERVE_USD=<finite-usd> pnpm exec tsx scripts/run-openrouter-cap001.ts --execute
```

The first smoke is one scenario, zero retries, a pinned provider, and a small external key limit. `OPENROUTER_MAX_SPEND_USD` only stops later requests after a measured reply. It does not cap the charge already in flight.

Add `--persist` only when the run should also write unpublished `test_scenarios`, `test_runs`, and `test_results`. Persistence does not set `accepted_test_run_id`.

The command refuses to run when `CI`, `GITHUB_ACTIONS`, or `VERCEL` is set. Ordinary tests, builds, and deploys stay on the reference agent and mocks.

If the gateway serves a different model, omits cost while a spend cap is set, or cannot honor the requested configuration, the run is invalid. Do not publish it as a model score.

A review artifact is written under `evals/runs/`. That folder is local scratch so a half-written file is not pushed by accident. The JSON itself is an asset. After a paid run, copy it to `docs/reviews/runs/` and commit that copy. Do not leave the only copy in the ignored folder. The copy is still unpublished review evidence. It does not change `evals/accepted/latest.json` and it does not make the run public.

---

## Review

A reviewer reads the artifact, not the runner's summary. Check:

- requested model, served model, and route/provider when present;
- fallback stayed off;
- cost and token totals;
- scenario pass/fail against the frozen judge;
- no claim that this is accepted public evidence.

---

## Accept or reject

Acceptance is a separate human action. Dry-run the publish command first:

```text
pnpm publish:results
```

That prints a plan and writes nothing.

To accept a completed unpublished run:

```text
CANAIYET_ACCEPT_RUN=1 CANAIYET_REVIEWED_BY="<reviewer name>" pnpm exec tsx scripts/publish-results.ts --accept --run-id <uuid>
```

If the capability already has a different accepted run, add `--replace-accepted`. Do not do that to the current reference baseline unless a human explicitly wants the public page to move.

After acceptance, the public page reads the headline and the scenario list from that same run. It will not pair a database headline with repository scenario detail from another source.

---

## After a fresh review accepts this path

Do not pick the model or spend here. A human fills this in, then a separate approval starts the run.

```text
Exact OpenRouter model ID:
CAP-001 scenario id (one only):
Maximum spend USD:
Request reserve USD:
Persistence: unpublished review artifact only
```

A missing reserve, an unknown charge, a dirty worktree, or a cost above the reserve stops the run. That is not a measured score. The first paid smoke is one scenario, zero retries, a pinned provider, and a human-set reserve. The stop threshold is not a hard gateway cap.

## Prepared one-run command — CAY-20260910-16

This section records the prepared configuration. It is not a standing authorization. Execute it only while that receipt is the live spend gate, from a clean commit, after a live price and key-credit check.

```text
OPENROUTER_MODEL=anthropic/claude-sonnet-4.6
OPENROUTER_PROVIDER=anthropic
OPENROUTER_MAX_SCENARIOS=12
OPENROUTER_MAX_RETRIES=0
OPENROUTER_MAX_TURNS=8
OPENROUTER_MAX_TOKENS=800
OPENROUTER_TIMEOUT_MS=45000
OPENROUTER_MAX_SPEND_USD=1
OPENROUTER_REQUEST_RESERVE_USD=0.08
```

Expected observed range: about $0.36 to $0.50. Planning ceiling: about $1.00. Client stop: $1.00. External key remaining credit must be at least $1.50 before the first request. No `--scenarios` filter. No second model. No qualification rerun. No `--persist` unless `SUPABASE_SECRET_KEY` is set; otherwise the durable copy is `docs/reviews/runs/`. Do not set `accepted_test_run_id`.

The $0.08 reserve is above the largest saved Sonnet request ($0.012861) and below the $1.00 cap. A single reply above $0.08 stops the run. That stop is not a 12-scenario score.

The first preflight failed because the old key still had a $0.25 weekly limit. A later key with a $2 limit and $2 remaining passed the same price and pin check. That one authorized run was then executed and saved. Do not run this command again without a new spend receipt. The wrap-up that interprets it, without changing the exam, is `docs/reviews/CAY-20260910-18.md`.

## What not to do

- Do not run a paid eval from CI, preview deploy, cron, or seed.
- Do not use an auto-router or cross-model fallback.
- Do not call this a frontier-model result until the run exists, is reviewed, and is accepted.
- Do not broaden this command to CAP-002+ under the current preparation receipt.

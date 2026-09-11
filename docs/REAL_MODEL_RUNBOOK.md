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
3. Set a hard spend cap.
4. Run the dry-run and read it. Dry-run makes zero paid requests.
5. A human sets `CANAIYET_PAID_RUN=1` and runs `--execute`. Agents do not do that without a separate approval.

Suggested candidate to verify, not a confirmed live ID and not an approval: `google/gemini-3-flash-preview`, seen on OpenRouter's public tool-calling docs during preparation. Check the catalog again before spend.

Default ceiling for a full CAP-001 dry-run: 12 scenarios, 8 turns each, 1 retry. That is up to 192 HTTP requests if retries are left at the default. Lower the caps before a first paid run.

---

## Configure

Put these in the environment. Do not commit them.

```text
OPENROUTER_API_KEY=
OPENROUTER_MODEL=provider/exact-model-id
OPENROUTER_MAX_SPEND_USD=1
OPENROUTER_MAX_TURNS=8
OPENROUTER_MAX_TOKENS=800
OPENROUTER_TIMEOUT_MS=45000
OPENROUTER_MAX_RETRIES=1
OPENROUTER_MAX_SCENARIOS=12
```

`CANAIYET_PAID_RUN` stays unset until the human approval gate.

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

Only after the dry-run looks right and a human has approved the model ID, expected request count, and spend cap:

```text
CANAIYET_PAID_RUN=1 pnpm exec tsx scripts/run-openrouter-cap001.ts --execute
```

Add `--persist` only when the run should also write unpublished `test_scenarios`, `test_runs`, and `test_results`. Persistence does not set `accepted_test_run_id`.

The command refuses to run when `CI`, `GITHUB_ACTIONS`, or `VERCEL` is set. Ordinary tests, builds, and deploys stay on the reference agent and mocks.

If the gateway serves a different model, omits cost while a spend cap is set, or cannot honor the requested configuration, the run is invalid. Do not publish it as a model score.

A review artifact is written under `evals/runs/`. That folder is not accepted public evidence. `evals/accepted/latest.json` is the reference baseline and is not overwritten by this command.

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
CANAIYET_ACCEPT_RUN=1 pnpm exec tsx scripts/publish-results.ts --accept --run-id <uuid>
```

If the capability already has a different accepted run, add `--replace-accepted`. Do not do that to the current reference baseline unless a human explicitly wants the public page to move.

After acceptance, the public page reads the headline and the scenario list from that same run. It will not pair a database headline with repository scenario detail from another source.

---

## What not to do

- Do not run a paid eval from CI, preview deploy, cron, or seed.
- Do not use an auto-router or cross-model fallback.
- Do not call this a frontier-model result until the run exists, is reviewed, and is accepted.
- Do not broaden this command to CAP-002+ under the current preparation receipt.

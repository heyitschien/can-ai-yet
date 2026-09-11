# Model Evaluation Strategy

**Status:** EXPLANATORY / PROPOSED OPERATING PLAN  
**Purpose:** Explain which models CanAIYet should test, why we track them, and how to avoid building a separate integration for every provider.  
**Important:** Exact model availability and pricing change. Validate model IDs and current prices immediately before a paid benchmark run.

---

## 1. What we are actually comparing

CanAIYet is not trying to answer:

> Which model is smartest in general?

It is trying to answer:

> Which tested configuration can reliably perform this real business task under these conditions?

A configuration includes more than the model name:

```text
provider / route
+ exact model
+ reasoning / settings
+ prompt / instruction
+ allowed tools
+ tool schemas
+ fixture version
+ environment version
+ code git SHA
```

Changing one of those can change the result.

That is why every accepted run must record the configuration rather than simply saying "GPT" or "Claude."

---

## 1a. Capability, reliability, and economics

These are three different measurements. Do not collapse them into one score.

**Capability** is whether a configuration can finish the task at all. One valid pass shows that the task is possible under those exact conditions. It does not show how often that happens.

**Reliability** is whether that same configuration finishes the task again. A trial is one independent attempt:

```text
scenario
+ exact model
+ provider / route
+ settings and tools
+ fixture and environment version
+ git SHA
```

A later repeat is a new trial. It must not overwrite the earlier one. Until the repeat count supports a rate, report the count, not a percentage. `1 pass / 2 observed trials` is an observation. `94% reliable` is a claim this laboratory cannot make from one or two trials.

**Economics** is first-class evidence, not a footnote: cost per trial, requests, input and output tokens, cache read/write tokens when the gateway returns them, and runtime. Later, cost per successful completion. A cheap fail and an expensive pass are different facts.

Three outcomes stay distinct:

- valid pass — the experiment stayed intact and the judge passed;
- valid fail — the experiment stayed intact and the judge failed, including a scored stop such as a turn-budget stop or a no-progress tool loop;
- invalid experiment — the route, cost, or configuration was not the one we asked for. Do not publish that as a model score.

Small-N results stay counts. Repeatability requires repeated independent trials of the same definition. One lucky pass is not a reliability qualification.

### How we spend

CanAIYet is a research and publishing model, not per-view inference. We pay once to create reusable evidence. Many people can read the same report at near-zero model cost. Do not rerun a model because a page was viewed.

**Demand-gated testing.** Do not benchmark every capability, model, and repeat. Search and request demand ranks what deserves spend. Low-demand capabilities wait.

**Evidence ladder.** Discovery may use one trial. An important claim gets repeated independent trials. A high-stakes or public reliability claim needs a larger N. Do not publish a reliability percentage from a tiny sample.

**Information gained per dollar** is a first-class optimization target. Prefer a test that distinguishes models, exposes an important failure mode, or answers a high-demand question. A cheap test that cannot change a decision is not a bargain.

**Do not test every model.** After one complete Sonnet CAP-001 report, the next panel should be the smallest set of two or three models that maximize useful contrast — for example a premium model, a cheap model, and one other provider. That is a contrast panel, not a leaderboard.

**Public pages vs deeper intelligence.** A public page may summarize capability, status, evidence level, and date. Deeper scenario detail, reliability analysis, model comparison, history, cost per successful completion, and custom evaluation can become higher-value product surfaces later. Do not build a paywall from this note. Record the principle only.

Cost engineering may shorten redundant context or stop a loop. It must not change frozen task expectations or the judge to make a model pass.

### Observed signal, not a percentage

On 2026-09-11, `anthropic/claude-sonnet-4.6` pinned to Anthropic completed LEAD-001 three times under related heads:

- qualification on `6b1959e`: valid pass, $0.04122, 4 requests;
- later full-suite trial on `d7d4d0d`: valid fail, missing the follow-up task, $0.030465, 3 requests;
- full-suite trial on `d7504c0`: valid fail, missing the follow-up note, $0.031935, 3 requests.

That is `1 pass / 3 observed LEAD-001 trials`. The git SHAs are not one frozen experiment. Report them as three observations. Do not write a reliability percentage from them.

This is why CanAIYet has to measure task outcome, repeatability, failure mode, cost, tokens, and runtime together. Capability is not the same as reliability.

### Qualification gate — proposal only, not adopted

Do not treat one lucky pass as proof the model is ready for an expensive suite, and do not implement a new public scoring rule from this note.

The smallest honest gate before a full CAP-001 suite, if a later receipt adopts it:

- two independent trials of LEAD-001;
- one trial of LEAD-005, a critical scenario;
- the same exact model, provider, fixture, environment, and git SHA;
- zero retries;
- report counts, not a percentage.

From the saved Sonnet artifacts, that gate is about $0.10 to $0.15, not a bill: two LEAD-001 trials were $0.04122 and $0.030465, and the scored LEAD-005 trial was $0.033984. This receipt does not turn that proposal into a runner rule.

---

## 2. What we use today

Today the accepted public baseline is:

```text
reference-agent-v1
```

That is a deterministic rule-based worker written in the repository.

It proves the harness, fixtures, tools, and judge can run end to end.

It is **not** a frontier-model benchmark.

The first real-model path has not yet been accepted or run.

An OpenRouter adapter and a dry-run command now exist for CAP-001. That is preparation, not a frontier-model result. See `REAL_MODEL_RUNBOOK.md`.

---

## 3. Do we need a separate API integration for every model?

No.

There are two sensible paths.

### Path A — Unified gateway

Use a model gateway such as **OpenRouter**.

Conceptually:

```text
CanAIYet harness
      │
      ▼
One OpenRouter API integration
      │
      ├── OpenAI model
      ├── Anthropic model
      ├── Google model
      └── other supported tool-capable model
```

The harness writes the tool-calling loop once. The selected model changes by model identifier.

Benefits:

- one API key and billing surface;
- one integration for many providers;
- easier cross-model experiments;
- centralized cost tracking;
- easier expansion later.

Tradeoff:

- OpenRouter becomes part of the tested configuration;
- upstream provider routing can vary unless we deliberately pin/control it;
- for high-trust published comparisons, route/provider details must be recorded.

### Path B — Direct provider APIs

Build direct adapters for OpenAI, Anthropic, Google, and others.

Benefits:

- clearest direct-provider provenance;
- fewer routing layers;
- direct access to provider-specific features.

Tradeoff:

- more integrations, keys, billing, and maintenance;
- provider APIs differ;
- harder to expand rapidly.

---

## 4. Recommended CanAIYet approach

Use a **hybrid strategy**.

### Discovery / broad comparison

Use one unified gateway first.

This lets us run the same frozen test suite across several tool-capable models without rewriting the lab.

### Accepted / high-trust benchmark

For any result we publish as a serious comparison:

- record the gateway;
- record the exact model identifier;
- record the actual upstream provider/route when available;
- avoid automatic model substitution during the benchmark;
- disable model fallbacks for a benchmark unless the fallback itself is explicitly part of the tested configuration;
- record token use and actual cost;
- preserve raw run metadata privately when appropriate.

Later, if a result becomes strategically important, we can reproduce it through the model provider's direct API and compare.

This gives us speed now without giving up rigor later.

---

## 5. We should not test every model

Testing every model would create noise, cost, and maintenance burden.

Start with a small representative panel. After one complete report on a single configuration, the next useful step is the smallest two or three models that answer a contrast, not a catalog.

The panel should answer three useful questions:

```text
What can a strong practical model do?
What can a cheaper model do?
What can a frontier ceiling model do?
```

Do not run that panel until the first full CAP-001 report exists and a coordinator receipt names the next model. Breadth is not the goal.

---

## 6. Proposed initial model panel

This is a starting proposal, not permanent canon.

### Practical cross-provider panel

**OpenAI — GPT-5.6 Terra**  
Reason: strong general capability with a better cost balance than the most expensive flagship.

**Anthropic — Claude Sonnet 5**  
Reason: strong general/agentic model and a useful independent provider comparison.

**Google — Gemini 3.7 Flash**  
Reason: current efficient agentic/workhorse model and a useful lower-cost comparison.

### Frontier ceiling spot-check

Use one expensive frontier model only when the question is important enough to justify it, for example:

**OpenAI — GPT-6 Astra** or **Anthropic — Claude Opus 5**.

The ceiling model answers:

> Is this task failing because the workflow is intrinsically hard, or because we used a cheaper model?

We do not need to run the ceiling model on every capability every time.

---

## 7. Why track model history

Models change quickly.

A task that fails today may pass after a new model release.

A task that passes on an old model may become cheaper on a new model.

So the valuable dataset is not just:

```text
CAP-005 = green
```

It is:

```text
CAP-005
Model / provider / configuration A
Date
Fixture version
Scenario outcomes
Failure types
Cost
Runtime
Supervision level
```

Then later:

```text
Same task
New model / configuration
New results
What changed?
```

That history is the beginning of capability intelligence.

---

## 8. Apples-to-apples rules

When comparing models, keep these fixed unless the experiment explicitly changes them:

- same scenario set;
- same starting Acme fixture;
- same allowed tools;
- same tool behavior;
- same success and forbidden conditions;
- same code revision when practical;
- same maximum task budget / timeout policy.

Do not improve a prompt or weaken a scenario for one model and call the result comparable without recording the difference.

---

## 9. Model-specific settings

Different providers expose different reasoning and sampling controls.

Do not force identical knobs when the APIs do not mean the same thing.

Instead record the exact settings actually used.

Think of it like testing cars:

```text
same road
same destination
same traffic rules
but each car may have a different transmission
```

The configuration record tells us what was actually tested.

---

## 10. Tool calling is the key requirement

For the current simulated-business tests, the model needs to be able to choose and call business tools.

Example CAP-005 flow:

```text
Email arrives
   ↓
Model reads instruction + email
   ↓
Model calls search_contact
   ↓
Tool returns matching fictional contact
   ↓
Model calls update_contact / add_note / create_task as needed
   ↓
Model stops
   ↓
Deterministic judge checks company state
```

A model that cannot reliably use the required tool interface is not equivalent for this test.

---

## 11. Cost strategy

Paid evaluations should always be explicit and budget-capped.

Before a run, record:

```text
model
scenario count
maximum token / spend policy
whether retries are allowed
whether failures may retry
persistence destination
```

Start with one capability and a small panel.

Do not run all capabilities across many models until the first vertical slice is proven trustworthy.

Spend follows demand and information gained, not coverage. A capability with no search or request demand waits. A second model waits until the first full report can show what a contrast would teach. Record pass/fail, the repeatability count, the failure mode, requests, tokens, runtime, raw cost, and later cost per successful completion. Do not turn a small count into a rate.

A dry-run can print an observed cost plan from a prior saved artifact. That range is not a quote and not a guaranteed bill. The next paid run still needs a live price check, a client stop, and enough remaining key credit to finish. A previous CAP-001 attempt stopped on OpenRouter HTTP 402 because the key credit limit was about $0.25, while the client cap was $1.50. Do not start another full run on that key limit.

OpenRouter response caching stays off for benchmark trials. A cached completion would make a repeat look independent when it is not. Prompt-cache token fields may be recorded if the gateway returns them. Turning prompt caching on would be a new configuration and needs its own receipt.

---

## 12. First recommended real-model experiment

Use **CAP-001 only** first because the canonical build specification names it as the first deep evaluation slice.

Sequence:

```text
Freeze CAP-001 scenarios and Acme fixture
        ↓
Implement one common tool-calling provider path
        ↓
Run one inexpensive real model manually
        ↓
Verify persistence + cost + provenance
        ↓
Independent review
        ↓
Run the small cross-provider panel
        ↓
Compare failures, not just headline score
```

Do not start with every capability and every model.

### Prepared next paid target — not authorized here

The next paid milestone, after a coordinator spend review, is one clean full CAP-001 run on `anthropic/claude-sonnet-4.6` pinned to `anthropic`. All 12 frozen scenarios, once each, zero retries, full tool trace, judge unchanged. No other model. No publication. `accepted_test_run_id` stays put.

From the five valid scored scenarios in the partial suite, a 12-scenario run at that observed rate is about $0.36 to $0.50. If every scenario used the turn budget at the qualification per-request rate, the planning ceiling is about $1.00. Neither number is a bill. The previous attempt died because remaining key credit was about $0.25. Do not start unless remaining key credit is at least $1.50, and set the client stop at $1.00 so the client stops before the key. Copy the JSON from `evals/runs/` to `docs/reviews/runs/` after the run.

This document does not authorize spend. The live gate is Issue #1. CAY-20260910-16 is the single-run authorization for that exact configuration. Re-check the live price and the Anthropic pin immediately before the first paid request, and stop without spending if either cannot be honored.

---

## 13. Five-year-old explanation

We built one driving course.

Instead of building a new road for every car company, we want one gate where we can bring in different cars.

Each car drives the same road.

We write down exactly which car it was, what engine/setup it had, what it cost to drive, and where it made mistakes.

That is why one shared model gateway is attractive — but for important races, we still record exactly who actually drove the car.
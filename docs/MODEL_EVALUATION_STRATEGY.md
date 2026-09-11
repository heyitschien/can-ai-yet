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

## 2. What we use today

Today the accepted public baseline is:

```text
reference-agent-v1
```

That is a deterministic rule-based worker written in the repository.

It proves the harness, fixtures, tools, and judge can run end to end.

It is **not** a frontier-model benchmark.

The first real-model path has not yet been accepted or run.

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

Start with a small representative panel.

The panel should answer three useful questions:

```text
What can a strong practical model do?
What can a cheaper model do?
What can a frontier ceiling model do?
```

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

---

## 13. Five-year-old explanation

We built one driving course.

Instead of building a new road for every car company, we want one gate where we can bring in different cars.

Each car drives the same road.

We write down exactly which car it was, what engine/setup it had, what it cost to drive, and where it made mistakes.

That is why one shared model gateway is attractive — but for important races, we still record exactly who actually drove the car.
# CanAIYet — Origin and Decision Trail

**Purpose:** Preserve the product reasoning path that led to CanAIYet so future agents do not see only the implementation and lose the underlying idea.

This is a concise decision record, not a verbatim transcript.

---

# 1. The trigger: OpenRouter

The conversation began after observing reports of an approximately **$7.8B acquisition involving OpenRouter**.

The interesting question was not:

> “How do we copy OpenRouter?”

It was:

> **“What is the principle underneath OpenRouter that became so valuable?”**

That shifted the discussion away from the visible product and toward the architecture of value underneath it.

OpenRouter was useful as a thinking trigger because it sits above rapidly changing models and makes them easier to access, compare, route, and use. The important abstraction was that when the underlying intelligence layer changes quickly, there can be enormous value in the layer that helps humans decide **which intelligence to use, for what, and under what conditions**.

The key lesson was:

> **Do not become attached to one model. Observe the changing intelligence layer and build useful structure above it.**

---

# 2. The second connection: search signals

That idea connected to an earlier business pattern: search demand.

When many people search for the same phrase or product, the searches themselves become information.

A simplified example:

```text
1 person asks for something
→ maybe noise

1,000 people ask for it
→ interesting demand

20,000 people ask for it
→ potentially important unmet demand
```

The important insight was that a search box is not only a retrieval interface.

It can also be a **sensor**.

It tells us what people are trying to accomplish, including the things for which no satisfying answer exists yet.

That led to the thought:

> What if we could observe what people are repeatedly asking AI to do, just as product companies observe what people repeatedly search for?

---

# 3. The synthesis: observe both capability and demand

The two ideas combined:

### From OpenRouter

The intelligence landscape changes constantly. A useful layer can sit above individual models and observe/organize what they are actually capable of.

### From search-demand thinking

Human questions expose unmet demand. Repeated questions reveal what people want technology to do next.

Put together:

```text
Changing AI capability
        +
Human task demand
        ↓
Capability intelligence
```

This became the deeper opportunity.

Not merely:

> “Which model is best?”

But:

> **“What real work can machines reliably take on now, and what work are humans asking for that they still cannot?”**

---

# 4. Why the product became “Can AI Yet?”

The natural human question is not usually:

> “Which benchmark has the highest score?”

It is closer to:

> “Can AI follow up with my leads yet?”

> “Can it answer customer emails yet?”

> “Can it reconcile these spreadsheets yet?”

> “Can it safely update my CRM yet?”

That suggested a human-centered interface around **tasks**, not model jargon.

So the product promise became:

> **Can AI do this yet? We test it so you don't have to guess.**

The canonical design then made an important trust decision: answers must come from repeatable evidence, not vendor claims, vibes, or an LLM confidently describing its own ability.

---

# 5. The crucial architectural move: test outcomes, not words

A normal AI demo can look impressive because the response sounds good.

That is not enough for real work.

If an AI says:

> “I updated the CRM.”

CanAIYet should check whether the CRM really changed.

If an AI says:

> “I scheduled the appointment.”

CanAIYet should inspect the calendar.

If an AI was supposed to avoid contacting a customer, the evaluator should verify that no message was sent.

So the testing architecture became:

```text
Known starting state
      ↓
Real task instruction
      ↓
AI + allowed tools
      ↓
Business state changes
      ↓
Deterministic referee
      ↓
PASS / FAIL + evidence
```

This is why the simulated Acme Services business exists.

It creates a safe, deterministic world in which the system can inspect outcomes rather than trusting the agent's narration.

---

# 6. The product became four things, not one

The canonical architecture crystallized the project into four layers:

### 1. The website is the public window

Humans ask ordinary work questions and inspect understandable evidence.

### 2. The testing system is the laboratory

AI systems receive bounded jobs and are checked against expected and forbidden outcomes.

### 3. The capability database is the accumulating asset

Each accepted run adds evidence about capability, failure modes, configuration, cost, supervision, and change over time.

### 4. User questions are the demand sensor

Searches and requests reveal what people want tested next.

This fourth layer is especially important because it reconnects the product to the original search-signal insight.

---

# 7. The flywheel

The system can eventually learn from both sides:

```text
AI changes
   ↓
We test capabilities
   ↓
People search for tasks
   ↓
Known tasks return evidence
   ↓
Unknown tasks become zero-result signals
   ↓
Repeated signals reveal unmet demand
   ↓
We choose what to test next
   ↓
Some repeated needs may become implementation opportunities
   ↓
The capability map becomes more useful
```

This means a zero-result search is not merely a product failure.

It can be strategic information.

If thousands of users repeatedly ask:

> “Can AI do X yet?”

and the answer is still “we have not tested that,” the query itself may identify a meaningful capability gap.

---

# 8. The larger idea: intelligence observability

A useful long-term description is **intelligence observability**.

In software observability, we instrument systems so we can understand what is happening inside them and how they behave.

CanAIYet points toward doing something analogous for rapidly changing machine intelligence:

- observe what systems can do;
- observe where they fail;
- observe how capabilities change over time;
- observe what tools/configurations improve outcomes;
- observe what humans are trying to delegate;
- observe where demand exists before reliable capability does.

This is broader than a benchmark leaderboard because the unit is not an abstract model score.

The unit is a **human task and verified outcome**.

---

# 9. Why this could eventually surface startup ideas

The original search-demand analogy leads one step further.

Suppose CanAIYet observes:

- many people asking for the same business task;
- no existing tested capability that handles it reliably;
- repeated requests for implementation help;
- a new model/tool release that suddenly makes the task feasible.

That combination can become a high-quality signal:

```text
Human demand
+
Capability gap
+
New technical feasibility
=
Potential product opportunity
```

So the system may eventually do more than answer “Can AI do this yet?”

It may help identify:

> **“What should somebody build now that AI has just become capable enough?”**

That possibility should emerge from evidence and demand, not be forced into the MVP.

---

# 10. What must not get lost

Future agents should preserve these principles:

1. **People first.** Start with the work humans want done.
2. **Tasks, not model fandom.** Models are interchangeable contestants; the human outcome is the stable unit.
3. **Evidence, not claims.** Verify what actually happened.
4. **Failures are valuable data.** Do not hide them.
5. **Search is also sensing.** Unknown/repeated queries reveal demand.
6. **The dataset is the compounding asset.** The website is only its public window. The asset is the capability list, demand trail, frozen tasks, judges, outcomes, failure types, and cost history. It is not OpenRouter, and it is not whichever model was tested last. OpenRouter is a window onto a changing model supply. CanAIYet is the intelligence layer, not a router.
7. **Do not prematurely build the grand platform.** Earn the larger abstraction by running trustworthy tests first. Spend the next dollar only when the last result was reviewed and demand, or a missing demand check, says the next test is worth it.

---

# 11. Where we are now

The first implementation already contains:

- the public window;
- ten capability definitions;
- a simulated business laboratory;
- deterministic state-based judges;
- executable scenarios;
- a reference-agent baseline;
- a Supabase evidence schema;
- request and product-event foundations;
- scout/retest foundations.

The next major proof is not another conceptual expansion.

It is to put a real frontier model through CAP-001, preserve exact provenance, independently review the result, and publish it truthfully.

That closes the loop from the original question:

> **Instead of guessing what rapidly changing intelligence can do, build an observation layer that measures it — and listen to what humans are asking it to do next.**

How that work is staffed is recorded separately in `docs/FOUR_AGENT_SYSTEM.md`. This trail does not define agent contracts or implementation steps.
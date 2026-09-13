# CanAIYet — Falsification Operating Method

**Status:** OPERATING METHOD  
**Date:** 2026-09-13  
**Applies to:** CanAIYet research, product discovery, enterprise-transfer experiments, market validation, and future adjacent projects that adopt this method.  
**Relationship to authority:** This document explains *how we learn and decide*. It does not override `canonical-build-doc.md`, `COMMUNICATION_PROTOCOL.md`, accepted evidence, or an explicit human gate.

## 1. Why this exists

We are good at generating plausible futures. That is useful, but it creates a danger: a compelling story can become easier to defend than to test.

This operating method exists to make reality the senior partner.

The objective is not to prove our ideas right. The objective is to discover, as cheaply and honestly as possible, **which parts of an idea survive contact with reality, which parts fail, and what the failure teaches us to test next**.

A negative result is not wasted work if it removes uncertainty, prevents larger waste, or reveals a better problem.

> **Imagine boldly. State the claim precisely. Design the cheapest serious test. Let reality answer. Preserve the evidence. Change direction without ego.**

---

## 2. The core loop

Every meaningful hypothesis should move through this loop:

```text
OBSERVE
  ↓
FORM A HYPOTHESIS
  ↓
STATE WHAT WOULD PROVE IT WRONG
  ↓
DESIGN THE CHEAPEST SERIOUS TEST
  ↓
FREEZE THE TEST / THRESHOLDS
  ↓
RUN IT WITHOUT MOVING THE GOALPOSTS
  ↓
PRESERVE THE EVIDENCE
  ↓
CONTINUE | NARROW | PIVOT | STOP
  ↓
FORM THE NEXT BETTER HYPOTHESIS
```

The output of an experiment is not merely `pass` or `fail`.

The real output is **reduced uncertainty plus a better map of the problem**.

---

## 3. Required questions before significant work

Before spending meaningful engineering time, model budget, human review, or market-development effort, answer:

1. **What human or business problem are we trying to understand or solve?**
2. **What exactly do we currently believe?**
3. **Why do we believe it?** Separate observation, historical pattern, inference, and speculation.
4. **What evidence would materially weaken or falsify the belief?**
5. **What is the smallest serious experiment that could produce that evidence?**
6. **What are the pass / fail / ambiguous conditions before we run it?**
7. **What will we do after each possible outcome?**
8. **Where will the raw result and interpretation be preserved so a future agent cannot rewrite history?**

If we cannot answer these, the work is probably still exploration rather than an authorized experiment.

---

## 4. Cheapest serious test

“Cheap” does not mean weak.

The right experiment is the **least expensive test that is still capable of changing our mind**.

Bad cheap test:

- easy demo that cannot reveal the important failure mode;
- friendly-user feedback after we explain why the idea is exciting;
- synthetic evidence presented as real-world validation;
- one successful run used as a reliability claim.

Good cheap test:

- a frozen scenario with a known failure trap;
- one real vendor sandbox before building five integrations;
- a practitioner interview that asks about an actual decision rather than whether the idea sounds interesting;
- a pricing or custom-eval request before building subscription infrastructure;
- a small model tranche whose result determines whether another tranche is justified.

> **Do not fund scale before uncertainty earns it.**

---

## 5. Pre-register the conditions

Whenever hindsight bias could rescue a weak result, freeze the important expectations first.

Record, as applicable:

- hypothesis;
- expected behavior;
- scenario / fixture version;
- success threshold;
- failure / stop threshold;
- maximum spend;
- environment;
- model / provider / configuration;
- decision after success;
- decision after failure;
- known limitations.

Do not redesign the exam after seeing the score and then claim the original hypothesis succeeded.

A test may reveal that the test itself is bad. If so, preserve that conclusion explicitly and version the next test rather than silently rewriting the old one.

---

## 6. Failure is a map, not only a verdict

When a hypothesis fails, ask **where** it failed.

Examples:

```text
public model ranking has weak value
        ↓
workflow qualification may still have value

synthetic benchmark does not transfer cleanly
        ↓
real-stack qualification may be the actual product

independent evidence is interesting but changes no decision
        ↓
move closer to permission / supervision / deployment decisions

users value the work but will not subscribe
        ↓
custom evaluations may be the viable economic form

broad market demand is weak
        ↓
one narrow high-stakes domain may still justify independent assurance
```

This is the pivot discipline:

> **Do not ask how to save the original idea. Ask what the broken assumption reveals about the better problem.**

A pivot should therefore be traceable to evidence, not to boredom or narrative drift.

---

## 7. Four allowed decisions

Every serious experiment should end with one of four explicit decisions.

### CONTINUE
The evidence strengthened the hypothesis enough to justify the next bounded experiment.

### NARROW
A smaller domain, buyer, workflow, risk level, or product form appears materially stronger than the broad thesis.

### PIVOT
An underlying problem remains valuable, but the current solution, buyer, delivery mechanism, or abstraction is wrong.

### STOP
The relevant demand, technical feasibility, decision utility, economics, or differentiation does not justify further investment.

**STOP is a successful result** when it prevents further investment in a weak thesis.

---

## 8. Separate the kinds of proof

Do not collapse different forms of evidence into one story.

For CanAIYet, at minimum distinguish:

```text
technical proof
≠ construct / test fairness
≠ environment transferability
≠ practitioner decision utility
≠ demand
≠ willingness to pay
≠ repeat / retention
≠ defensible data advantage
```

A technically excellent system can still be a bad business.

A commercially interesting request can still be technically impossible or unsafe.

A useful experiment should state which uncertainty it is actually reducing.

---

## 9. Enterprise-realism rule

When testing whether AI can perform enterprise work, move realism upward only when the prior level earns it:

```text
controlled synthetic lab
        ↓
real vendor sandbox + synthetic company
        ↓
customer staging / test environment
        ↓
privacy-safe production-derived regression cases
```

The goal is not realism for its own sake. The goal is to determine whether the evidence becomes more **decision-useful** as it approaches the environment where a company would actually delegate authority.

The key enterprise question is not merely:

> Can the model do the task?

It is:

> **Can this model + runtime + tools + permissions + policy + environment be trusted to perform this work at an acceptable cost and supervision level?**

---

## 10. The compounding research rule

Preserve every serious test so future work can learn from it.

Useful evidence may include:

- frozen hypothesis and predictions;
- scenario / fixture versions;
- exact environment and model provenance;
- success and failure traces;
- failure taxonomy;
- cost / runtime;
- permission envelope;
- practitioner response;
- demand signal;
- payment / rejection reason;
- decision taken afterward;
- date and historical comparison.

The value is not only today's answer. Over time, the project may acquire a history of **how capability, economics, and safe delegation boundaries move**.

Time-indexed evidence should never be rewritten to make later outcomes look inevitable.

---

## 11. Resource allocation rule

Our scarce resources are attention, engineering time, model spend, human review, reputation, and capital.

Allocate them to uncertainty reduction.

```text
small tranche
    ↓
what uncertainty disappeared?
    ↓
did the result change a decision?
    ↓
does the next tranche now have higher expected information value?
```

The governing rules remain:

> **Reality earns the next dollar.**

> **Do not fund the database. Fund uncertainty reduction.**

> **Do not build the future because it is imaginable. Build the next experiment because it can prove whether the future deserves to exist.**

---

## 12. One methodology across parallel tracks

Different projects may look unrelated on the surface — AI evaluation, enterprise implementation, client systems, trading research, or other digital products — but they can share one operating method:

```text
find a real human problem
        ↓
model the problem and possible value
        ↓
form a falsifiable hypothesis
        ↓
build the smallest useful test
        ↓
measure reality
        ↓
help people / create value if the evidence survives
```

The tracks do not need one product identity. They can share one epistemic discipline.

The common purpose is **helping people by solving real problems**, while reality decides which solutions deserve more investment.

---

## 13. Standard experiment block for work orders

For any material research/product hypothesis, include this block in the mission or linked document:

```text
HYPOTHESIS:
HUMAN / BUSINESS PROBLEM:
CURRENT EVIDENCE:
KEY UNCERTAINTY:
FALSIFIER:
CHEAPEST SERIOUS TEST:
FROZEN CONDITIONS:
MAX TIME / SPEND:
SUCCESS SIGNAL:
FAILURE SIGNAL:
AMBIGUOUS RESULT HANDLING:
DECISION IF SUCCESS:
DECISION IF FAILURE:
EVIDENCE DESTINATION:
```

Not every tiny implementation task needs a full hypothesis block. Use it when the work exists to answer an uncertain strategic, product, market, capability, or architecture question.

---

## 14. Relationship to existing CanAIYet documents

- `FALSIFICATION_AND_PHASE_THRESHOLDS.md` defines the current CanAIYet thesis, competitive falsifiers, phase gates, and stop/narrow/pivot logic.
- `CAPABILITY_INTELLIGENCE_THESIS.md` explains the economic and data hypothesis.
- `ENTERPRISE_ENVIRONMENT_VALIDATION.md` defines the synthetic → real-stack → customer-staging validation ladder.
- `HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md` is an example of pre-registration before an experiment.
- `CAPABILITY_CONTROL_PLANE_HORIZON.md` preserves a possible long-horizon product progression; it is not permission to build that future.
- This document is the reusable **day-to-day learning and decision method** tying those ideas together.

---

## 15. The short form

When context is limited, remember six lines:

> **Imagine boldly.**  
> **State the claim precisely.**  
> **Design the cheapest serious test.**  
> **Let reality answer.**  
> **Preserve the evidence.**  
> **Continue, narrow, pivot, or stop without ego.**

That is the operating method.
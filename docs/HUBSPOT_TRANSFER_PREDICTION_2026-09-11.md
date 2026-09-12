# CanAIYet — CAP-001 HubSpot Transfer Pre-Experiment Prediction

**Status:** Pre-registration / prediction record. Not build authority. Not benchmark evidence.  
**Date:** 2026-09-11  
**Related work:** Issue #14 — CAP-001 Reality Transfer Test — HubSpot sandbox  
**Purpose:** Freeze our expectations *before* implementing or running the HubSpot transfer experiment so the eventual outcome can be compared against what we believed in advance rather than explained away afterward.

This document does **not** authorize the HubSpot build, a paid model run, external API calls, or deployment. It exists to make the experiment more scientific and to reduce hindsight bias.

---

## 1. The hypothesis being tested

> **A capability test designed in the controlled CanAIYet synthetic lab can transfer into real enterprise software and still produce useful, comparable, inspectable evidence without requiring so much platform-specific rewriting that the original capability loses its meaning.**

For the first transfer test, the stable capability is:

> **CAP-001 — Follow up with an inbound sales lead.**

The candidate real-stack environment is a HubSpot developer/test account using synthetic business data.

---

## 2. Current prediction in plain language

Our expectation is that the HubSpot experiment will **mostly work, but not cleanly**.

We expect the business meaning of most CAP-001 scenarios to transfer more easily than their implementation details.

Examples of scenario semantics that should remain meaningful:

- find the correct person before contacting them;
- respect opt-out / do-not-contact state;
- recognize an already-handled lead;
- respect pricing authority;
- handle scheduling constraints;
- escalate ambiguous or unsafe situations;
- update the correct business state after acting.

We expect HubSpot to introduce additional complexity that the synthetic Acme world intentionally hides:

- real object IDs and associations;
- contacts, companies, deals, activities, tasks, and custom properties;
- OAuth/authentication and permission scopes;
- missing or differently encoded state;
- duplicate and incomplete records;
- rate limits and network/API failures;
- vendor-specific state semantics;
- seeding/reset complexity;
- integration-specific error handling.

If this prediction is right, the experiment should make the evaluation **messier but more externally relevant**.

---

## 3. Strongest architectural prediction

We suspect that the stable reusable asset will be the **capability/scenario contract**, not one universal implementation.

Conceptually:

```text
CAP-001 business condition
        ↓
abstract scenario / expected outcome
        ↓
CanAIYet simulator adapter
HubSpot adapter
later Salesforce adapter
        ↓
comparable evidence where semantics truly match
```

The important requirement is that an adapter may translate implementation details but must not silently change the business question.

If the capability contract survives while the implementation varies, that supports the portable-capability-pack thesis.

If every environment requires redefining the scenario itself, that weakens the thesis.

---

## 4. Prediction about the true object of evaluation

We suspect HubSpot will weaken the simple framing:

> “Can Claude do lead follow-up?”

and strengthen the framing:

> **“Can this configured system — model + agent instructions + tools + HubSpot integration + permissions + business policy — safely perform lead follow-up under these conditions?”**

This would not be a failure of CanAIYet. It would mean the useful unit of qualification is often the **configured agent system**, not the raw model alone.

That outcome would make public model-only rankings less central and make environment/configuration qualification more important.

---

## 5. Expected scenario-level discoveries

### Identity ambiguity

Prediction: this remains highly meaningful and may become more realistic in HubSpot because records are connected through real object IDs, properties, companies, deals, and associations.

Interesting evidence would include:
- the same wrong-identity failure appearing in both synthetic and HubSpot environments;
- the failure disappearing because real CRM structure reduces ambiguity;
- a new integration-specific identity failure appearing because associations or fields are misunderstood.

### Already handled

Prediction: the business condition remains valid, but the implementation may be much harder because “handled” could live in a property, note, activity, lifecycle state, deal field, or other vendor-specific state.

This scenario may reveal whether our capability contract cleanly separates business meaning from storage details.

### Opt-out / do-not-contact

Prediction: the rule remains meaningful, but the relevant state may be encoded differently than our synthetic flag. Mapping it correctly may expose permission or schema assumptions.

### Pricing and escalation

Prediction: policy semantics should transfer well even if HubSpot itself does not own every pricing rule. The important test is whether the agent respects an externally supplied business policy and escalates when authority is exceeded.

### Calendar / messaging

Prediction: HubSpot alone may not represent the full workflow. A later real-stack CAP-001 may need dedicated test Gmail/Calendar or other communication surfaces. This should be added only when necessary to test the same capability, not merely to imitate a full enterprise stack.

---

## 6. Subjective outcome ranges — guesses, not measurements

These are deliberately recorded before the experiment and must **not** be reported later as statistical probabilities.

### Rough prior A — portable-enough transfer: ~70%

The scenario semantics transfer well enough that a reusable HubSpot version of CAP-001 can be created with bounded adapter work, deterministic state verification remains credible, and the real environment reveals useful integration/permission behavior.

### Rough prior B — technically works, but becomes substantially custom: ~20%

The evaluation functions, but platform-specific mapping and workflow configuration consume enough effort that the business looks more like custom enterprise evaluation / implementation assurance than a scalable standardized public benchmark.

### Rough prior C — transfer materially weakens the thesis: ~10%

The environment is too difficult to reset/judge reproducibly, the scenario meaning cannot be preserved, or the extra fidelity does not produce meaningfully more decision-useful evidence.

These numbers are **subjective priors only**. Their purpose is to make our current expectation inspectable, not to give it scientific authority.

---

## 7. What would confirm the prediction

The prediction is strengthened if we observe several of the following:

- most CAP-001 business conditions map to HubSpot without changing their meaning;
- one adapter can translate real CRM state/actions while keeping scenario definitions recognizable;
- final HubSpot state can be inspected by a deterministic judge;
- scenario seeding/reset is reliable enough for repeat tests;
- real auth, scopes, associations, missing fields, or API behavior reveal important failure modes hidden by the simulator;
- at least some failure patterns persist across synthetic and real-stack environments;
- some failures disappear in the real stack for explainable reasons;
- the minimum permission envelope becomes clearer;
- practitioners judge the real-stack evidence more relevant to deployment decisions;
- the resulting architecture plausibly extends to another CRM later without rebuilding the entire scientific layer.

---

## 8. What would weaken the prediction

The prediction is weakened if:

- most scenarios require platform-specific reinterpretation rather than implementation translation;
- the adapter effectively becomes a new benchmark rather than another environment for the same benchmark;
- seeding/reset cannot be made reproducible enough for controlled comparison;
- outcome verification becomes largely manual or subjective;
- integration complexity overwhelms the business capability being tested;
- the real-stack experiment produces little additional information over the synthetic lab;
- practitioners still consider the evidence too artificial to affect any real decision;
- permission differences make cross-environment comparison meaningless without a completely new methodology.

---

## 9. What would falsify the strongest form of the thesis

A serious negative result would be:

> **CAP-001 cannot be represented in HubSpot without rewriting so much of the scenario, judge, and workflow assumptions that the synthetic and HubSpot results are not meaningfully comparable.**

If that occurs, do not hide it.

Possible interpretations would include:

- portable public capability packs are weaker than expected;
- the useful product may instead be custom private environment qualification;
- vendor-specific labs may need their own explicit evidence classes;
- environment/configuration specificity may dominate cross-provider model comparison;
- the synthetic lab may remain useful mainly for isolated failure research rather than enterprise readiness claims.

A negative transfer result is still a successful experiment if it prevents us from scaling the wrong architecture.

---

## 10. The most interesting possible result

The most scientifically valuable outcome is not necessarily a high pass count.

A particularly strong result would be a **failure-mode transfer**:

```text
same business trap
    ↓
synthetic environment failure
    ↓
real HubSpot environment failure
```

For example, an identity confusion pattern appearing in both environments would suggest that the failure belongs more to the agent/configuration/capability interaction than to the toy environment alone.

The reverse is equally valuable:

```text
fails in synthetic
passes in HubSpot
```

Then we investigate whether the synthetic environment was missing useful structure, whether the real CRM supplied stronger identity information, or whether the scenario mapping changed too much.

The goal is **explanation**, not making the two environments agree.

---

## 11. Anti-hindsight rule

When the HubSpot transfer experiment is completed, the review must explicitly compare the result against this document.

The post-experiment review should answer:

1. Which predictions were correct?
2. Which predictions were wrong?
3. Which outcomes were not anticipated?
4. Did scenario semantics transfer better or worse than implementation?
5. Did the true evaluation object shift toward the configured system as predicted?
6. Did real-stack fidelity materially improve decision usefulness?
7. Which of the ~70 / ~20 / ~10 subjective branches best resembles the result, if any?
8. What new hypothesis follows from the evidence?

Do **not** edit this document after observing the experiment in order to make the prediction look more accurate. If clarification is required, append a dated note rather than rewriting the original expectation.

---

## 12. Relationship to project direction

This prediction record sits under the broader validation ladder in:

- `docs/ENTERPRISE_ENVIRONMENT_VALIDATION.md`
- `docs/CAPABILITY_INTELLIGENCE_THESIS.md`
- `docs/FALSIFICATION_AND_PHASE_THRESHOLDS.md`
- Issue #14

It does not change the locked execution sequence:

1. finish/accept Demand Scout V1 corrections;
2. configure and run exactly one read-only Google demand smoke;
3. freeze Demand Scout expansion;
4. design the CAP-001 HubSpot reality-transfer experiment;
5. review that design before implementation/spend;
6. run practitioner decision-utility validation in parallel.

---

## One-sentence pre-registration

> **Before running the experiment, our best guess is that CAP-001’s business semantics will transfer into HubSpot better than its implementation details; real CRM complexity will expose new integration/permission failure modes; and the exercise will push CanAIYet from raw-model benchmarking toward qualification of configured agent systems — but the experiment is explicitly allowed to prove all of this wrong.**

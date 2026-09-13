# CanAIYet — Recommended Next Missions

**Status:** CURRENT EXECUTION RECOMMENDATION  
**Date:** 2026-09-11  
**Operational channel:** GitHub Issue #1  
**Who does the work:** see `docs/FOUR_AGENT_SYSTEM.md`. This file says what happens next. It does not reassign roles.

## Current stopping point

Milestone 1 is complete: CanAIYet has published its first independently reviewed real-model finding for **CAP-001 — Follow up with an inbound sales lead**.

Published observation:

- Claude Sonnet 4.6
- frozen 12-scenario CAP-001 suite
- 4 pass / 8 fail
- 4 observed failures met the frozen critical-failure criteria
- single run only; **not a reliability percentage**
- controlled synthetic Acme Services environment
- deterministic world-state judging + independent review + public evidence

The instrument loop is therefore demonstrated once:

```text
frozen scenario suite
→ real model
→ controlled tools/world-state mutations
→ deterministic judge
→ preserved provenance/economics
→ independent review
→ public finding
```

What is **not** proven is whether this evidence transfers to real enterprise software or materially changes a real deployment/procurement/permission decision.

Demand Scout PR #10 remains the immediate operational task. Its two independent-review correctness fixes are ready for re-review; no live Google commissioning call has been accepted yet.

---

# Locked next-work sequence

Do these in order unless the human owner explicitly changes priority.

## Mission A — Finish exactly one Demand Scout commissioning smoke

Issue: **#6 — Demand Scout**

Sequence:

1. independently re-review PR #10 exact head and the two required fixes;
2. accept credentialless Demand Scout V1 only if provenance, month parsing, tests, and secret safety are clean;
3. walk the human owner through Google Cloud / Google Ads configuration;
4. configure server-only credentials locally;
5. run exactly **one** explicit read-only `pnpm demand:smoke` request;
6. preserve a redacted provenance/data-quality receipt;
7. independently inspect the returned rows and target metadata;
8. **freeze Demand Scout expansion**.

Do not immediately add scheduling, Supabase demand tables, broad discovery, embeddings/HDBSCAN/LLM clustering, or autonomous demand→benchmark execution.

The purpose of this smoke is to learn what the real Google data looks like, not to turn Demand Scout into the product.

---

## Mission B — CAP-001 Reality Transfer Test design

Issue: **#14 — CAP-001 Reality Transfer Test — HubSpot sandbox**

After the one Demand Scout smoke, design the next major technical falsification experiment:

> Can the same CAP-001 capability test move from our deterministic synthetic CRM into one real CRM test environment while preserving useful comparability, reproducibility, and authoritative judging?

First target: **HubSpot developer test environment**.

The first deliverable is **design only**. Define:

- what capability/scenario semantics remain invariant;
- synthetic action → HubSpot object/API mapping;
- fixture seed/reset strategy;
- permissions/OAuth envelope;
- deterministic judge strategy;
- provenance/evidence requirements;
- expected engineering/model/API cost;
- explicit CONTINUE / NARROW / PIVOT criteria.

Then STOP for independent review before building the integration or spending on a new model run.

Do not broaden to Salesforce, Dynamics, CAP-002+, or customer production systems in this mission.

---

## Mission C — Practitioner decision-utility validation

Issue: **#15 — Practitioner validation — does CAP-001 evidence change a real decision?**

Run this learning track in parallel with the HubSpot transfer work.

Show the published CAP-001 report to people close to actual agent deployment/evaluation and ask decision questions, not praise questions.

The key test is:

> **Would this evidence materially change a deployment, permission, supervision, model-selection, internal-testing, or procurement decision?**

Strong signals:

- a concrete decision is changed or sharpened;
- a practitioner asks for real-stack/private/staging evaluation;
- they want the failure traces/methodology for an actual deployment;
- they ask whether CanAIYet can run the capability pack in their environment;
- they introduce the person who owns assurance/testing;
- willingness-to-pay emerges naturally and specifically.

Weak/negative signals are equally important:

- "interesting" but no changed decision;
- internal evals fully solve the need;
- synthetic evidence is considered non-transferable;
- no interest in private/staging testing.

Do not broaden the benchmark merely to get positive reactions.

---

# The strategic experiment ladder

CanAIYet should climb only when the previous level earns the next one:

```text
LEVEL 1 — deterministic synthetic wind tunnel     ✅ demonstrated
        ↓
LEVEL 2 — real software sandbox + synthetic data  ← next technical falsification
        ↓
LEVEL 3 — customer staging/sandbox environment    ← only if Level 2 transfers + demand exists
        ↓
LEVEL 4 — production-derived private regressions  ← only if customers pull us there
```

The working thesis is not that companies should trust CanAIYet **instead of** their internal evals.

The stronger hypothesis is that CanAIYet could become a standardized capability-test and independent evidence layer that complements internal evals and eventually runs inside customer staging environments.

See `docs/ENTERPRISE_ENVIRONMENT_VALIDATION.md`.

---

# Focus discipline

Stay deep in **Sales / Revenue Operations** for now rather than opening many vertical labs.

CAP-001 already exercises reusable primitives:

- CRM state;
- identity resolution;
- customer communication;
- scheduling;
- policy/pricing authority;
- opt-outs;
- escalation;
- permissions.

New domains/categories must earn entry through evidence and demand. Do not build Sales + Support + HR + Finance + Legal labs in parallel.

---

# What we are trying to falsify next

The highest-value technical hypothesis is:

> **A portable capability test designed in CanAIYet's controlled lab can produce useful, comparable evidence when moved into real enterprise software.**

The highest-value product hypothesis is:

> **Relevant practitioners find the evidence decision-useful enough to change how they deploy, supervise, select, or request evaluation of agents.**

Either hypothesis may fail. A clean negative result is a successful experiment because it prevents broader sunk cost.

---

# Hard stops

Until separately authorized:

- no broad Demand Scout expansion after the one smoke;
- no autonomous benchmark spend from demand data;
- no CAP-002+ expansion merely because the lab works;
- no multi-CRM integration project;
- no production customer data;
- no certification claims;
- no reliability percentage from the one Sonnet run;
- no large multi-model leaderboard campaign;
- no customer-environment build before the HubSpot transfer design is reviewed.

---

# One-sentence direction

**Close the Demand Scout experiment with one real read-only smoke, then test whether CAP-001 transfers into one real HubSpot environment while simultaneously asking real practitioners whether the published evidence changes an actual decision.**

# CanAIYet agent harness measurement model — 2026-09-17

> **Status:** STRATEGY / INSTRUMENTATION DESIGN — not canonical build authority, not a benchmark run order, and not permission to change CAP-001 or live HubSpot state.
> **Canonical authority remains:** `../canonical-build-doc.md`
> **Companions:** `AGENT_ARCHITECTURE_FRONTIER_2026-09-17.md`, `AGENT_SKILL_TOOL_ADAPTER_LAW_TAXONOMY_2026-09-17.md`, `CAP_001_INSTRUMENT_SCIENCE.md`, `HUBSPOT_TRANSFER_DESIGN_2026-09-13.md`
> **Purpose:** Make explicit what CanAIYet is already testing, identify the missing first-class harness/configuration layer, and define how HubSpot should fit without accidentally changing multiple variables at once.

## Executive answer

CanAIYet already contains much of a real agent-evaluation harness.

Today the lab already separates:

```text
CapabilityContract    = the business exam
EnvironmentManifest   = the racetrack / environment mechanics
RunConfig             = selected model/provider/route/permissions/limits
Runner                = the loop that presents the task and lets the worker act
Provider               = the worker/model implementation
Tool surface           = allowed operations
Adapter                = environment-specific translation
Judge                  = deterministic outcome checker
RunReceipt/provenance  = observed evidence
```

For CAP-001 synthetic runs, `evals/runners/run-suite.ts` already performs a minimal harness loop:

```text
fresh world
  -> prepare scenario
  -> give provider instruction + allowed tools + payload
  -> provider acts against world
  -> deterministic judge inspects resulting state
  -> result/provenance recorded
```

For HubSpot, the repository already contains the environment-side machinery: API/version handling, commissioning, live/mock transport, CAP-001 mapping, preflight, calibration, seed graph, adapter, scope matrix, provenance, and cleanup/snapshot behavior.

The important missing abstraction is **not “a HubSpot harness.”**

The missing abstraction is a first-class, versioned description of the **agent system / harness configuration** that sits between model and environment.

## 1. Do we need a HubSpot-specific harness?

### Short answer

**No — not for the first transfer experiment.**

We should prefer:

```text
same capability contract
same agent harness/configuration
same model/provider/route/limits
same agent-facing tool meanings
            |
            +-- synthetic adapter -> Acme world
            |
            +-- HubSpot adapter   -> HubSpot test account
```

The HubSpot-specific work belongs primarily in the **environment adapter/tool implementation**, not in a separate reasoning architecture.

This is important because the first HubSpot experiment asks:

> Does the same capability/system behavior transfer when the environment changes?

If we simultaneously change:
- model;
- prompt;
- skills;
- context strategy;
- tool set;
- agent loop;
- memory;
- and environment;

then a changed result becomes scientifically hard to attribute.

### Exception

If a future test intentionally evaluates a vendor-native agent/harness (for example a HubSpot-native agent), that vendor harness becomes part of the **configuration under test**. That is a different experiment and should not be confused with the current synthetic -> HubSpot transfer.

## 2. What CanAIYet already has

### Capability contract — YES

Already first class.

It preserves the invariant business exam across environments, including:
- scenario IDs;
- portable business semantics;
- agent-facing tool semantics;
- visible policy contract;
- deterministic judge semantics;
- authority/safety invariants.

This is the question being asked.

### Environment manifest — YES

Already first class.

It captures environment-specific mechanics such as:
- environment ID/version;
- fixture version;
- exact accepted environment head;
- adapter implementation version;
- seed/reset version;
- API versions;
- snapshot projection;
- runner version;
- environment permission mechanics.

This is where synthetic and HubSpot intentionally differ.

### Model/provider/run limits — YES, PARTIAL SYSTEM CONFIG

`RunConfig` already records:
- model;
- provider;
- route;
- permission envelope;
- max spend;
- max turns;
- max tokens;
- max retries;
- fallback policy.

This is a strong start, but it does not yet fully describe the harness around the model.

### Minimal runner/harness loop — YES

The current runner already provides:
- scenario setup;
- task instruction;
- allowed-tool boundary;
- execution loop through `AgentProvider`;
- authoritative environment state;
- deterministic judging.

This is a **minimal custom harness**, even if we have not historically called it that.

### Tool semantics — YES

The capability contract versions the meaning of agent-facing tools. HubSpot design intentionally maps those stable meanings onto real HubSpot actions rather than exposing arbitrary vendor API complexity directly.

### HubSpot adapter/environment machinery — YES / ADVANCED PREP

Current repository structure includes:
- auth/API-version policy;
- mock/live transports;
- CAP-001 environment adapter;
- mapping;
- scope matrix / least-authority planning;
- seed graph;
- preflight;
- calibration;
- provenance;
- reset/cleanup/snapshot mechanics.

This is the real-software racetrack, not a new agent brain.

### Deterministic judge — YES

Already a core design law. The model does not grade itself.

### Evidence/provenance — YES

Run receipts/manifests and public evidence preserve model/environment/run information and observed state.

## 3. What is not yet first-class enough

The current instrument should explicitly name the **agent-system / harness configuration**.

A future implementation should consider a type conceptually like:

```ts
type AgentSystemManifest = {
  harnessId: string;
  harnessVersion: string;

  instructionPackVersion: string;
  contextStrategyVersion: string;
  contextSourcesVersion: string;

  skillPackVersion?: string;
  skillLoadingStrategy?: "none" | "preloaded" | "just-in-time";

  toolSurfaceVersion: string;
  toolDiscoveryStrategy: "static" | "dynamic";
  toolTransport: "custom" | "mcp" | "native-provider" | "other";

  memoryPolicyVersion: string;
  compactionPolicyVersion?: string;

  topologyVersion: string;
  maxSubagents?: number;

  approvalPolicyVersion: string;
  containmentPolicyVersion: string;

  systemFingerprint: string;
};
```

Exact names are subject to review. The important point is conceptual separation.

### Why not put all of this directly into EnvironmentManifest?

Because the harness is not HubSpot.

The same harness should be able to drive:
- synthetic Acme;
- HubSpot;
- later Salesforce or Zendesk;

through different adapters.

### Why not bury all of it inside `RunConfig`?

`RunConfig` currently describes concrete run choices. A fingerprinted `AgentSystemManifest` would make the architecture itself independently versionable and comparable, while `RunConfig` can reference its fingerprint plus model/provider/run-budget choices.

One reasonable future shape is:

```text
CapabilityContract
        ×
AgentSystemManifest
        ×
EnvironmentManifest
        ×
RunConfig
        -> RunReceipt
```

Meaning:

```text
WHAT job?
× HOW is the agent system built?
× WHERE is it operating?
× WHICH model/run settings?
= WHAT happened?
```

## 4. What “context engineering” means for CAP-001

CanAIYet should not build a giant generic memory system merely because context engineering is fashionable.

For CAP-001, context engineering should start as a **frozen experimental input**.

A minimal baseline could specify exactly what the worker sees initially:
- task instruction;
- scenario payload;
- available tool names/descriptions;
- visible business policies;
- no hidden rubric;
- no unrelated CRM dump;
- no previous scenario memory unless intentionally tested.

Then later architecture experiments can vary context deliberately.

Examples:

### Baseline A — preload

```text
instruction
+ lead record
+ relevant policy
+ all allowed tool definitions
```

### Experimental B — just-in-time

```text
instruction
+ minimal identifiers
+ search/read tools
-> agent retrieves lead/policy only when needed
```

Then ask whether the context strategy changes:
- correctness;
- identity mistakes;
- policy failures;
- token use;
- latency;
- tool calls;
- cost.

Do not change context strategy during the first synthetic -> HubSpot environment-transfer run unless the experiment explicitly says context is the variable.

## 5. What “skills” mean for CAP-001

A future `lead-follow-up` skill could package procedure/guidance such as:
- verify identity before contacting;
- inspect consent/suppression state;
- check whether already handled;
- retrieve relevant deal/context;
- act only within approved policy;
- escalate ambiguous identity/policy cases;
- record required CRM state.

But a skill must not contain hidden answers to frozen scenarios or judge secrets.

A skill is part of the **configuration under test**.

Therefore future comparisons could test:

```text
same model + same environment + same tools
WITHOUT lead-follow-up skill
vs
WITH lead-follow-up skill
```

That measures whether the procedure actually improves capability.

For the first HubSpot transfer, however, use the same instruction/skill state as the synthetic comparison pair.

## 6. What “tools and MCP” mean for CAP-001

CanAIYet already has the stronger architectural idea: stable agent-facing tool semantics with environment adapters.

The first HubSpot transfer should preserve that design.

Do not introduce HubSpot-native MCP merely because MCP is current. That would change both:
- environment;
- tool exposure/transport.

Later, MCP can become an intentional architecture variable:

```text
custom typed tool binding
vs
MCP-exposed equivalent tools
```

provided the agent-facing semantics and authority envelope remain comparable.

MCP is plumbing. It should not silently redefine the business exam.

## 7. What “memory” means for CAP-001

For isolated CAP-001 scenarios, long-term memory may be unnecessary and could contaminate independence between scenarios.

Baseline recommendation:
- fresh scenario context;
- no cross-scenario model memory;
- durable **lab evidence** stored outside the model;
- scenario traces and receipts persisted for researchers, not automatically fed into the next scenario.

Later experiments may intentionally test memory for workflows that truly require continuity.

This distinction matters:

```text
LAB MEMORY
= evidence/provenance for us

AGENT MEMORY
= information the worker may retrieve/use while acting
```

Those are not the same thing.

## 8. What “multi-agent topology” means for CAP-001

Do not add subagents by default.

The current single-worker baseline is scientifically valuable.

A future experiment can ask whether a second independent reasoner earns its complexity, for example:

```text
single agent
vs
orchestrator + independent identity/policy reviewer
```

Freeze everything else and measure whether the reviewer reduces wrong-person or consent failures enough to justify:
- extra model calls;
- token cost;
- latency;
- orchestration complexity.

This is exactly the kind of architecture question CanAIYet can answer.

## 9. Proposed experiment stack

### Track 1 — capability/environment transfer (current HubSpot direction)

Goal:
> Does the existing CAP-001 capability measurement survive contact with real HubSpot mechanics?

Hold fixed:
- CapabilityContract;
- AgentSystemManifest/harness configuration;
- model/provider/route;
- run limits;
- agent-facing tool semantics;
- policy semantics;
- authority envelope as closely as the experiment defines.

Change:
- EnvironmentManifest: synthetic -> HubSpot.

### Track 2 — agent architecture experiments (later)

Once transfer is trustworthy, use the lab to vary one system factor at a time.

Examples:
1. baseline prompt/context vs just-in-time context;
2. no skill vs lead-follow-up skill;
3. static tools vs dynamic/MCP discovery;
4. single agent vs independent reviewer subagent;
5. broad write authority vs least-authority tools;
6. prompt-only instruction vs deterministic policy gate;
7. custom harness version A vs managed/provider harness version B.

### Track 3 — enterprise environment portability (later)

After HubSpot:

```text
same capability
same agent system configuration
same evidence law
      |
      +-- HubSpot adapter
      +-- Salesforce adapter
      +-- Zendesk adapter
```

This tests whether the capability pack is genuinely portable or merely HubSpot-specific integration code.

## 10. Immediate recommendation

Do **not** stop the HubSpot path to build an elaborate new harness.

Do this instead:

1. **Document/fingerprint the harness we already have.** Call the current custom single-worker loop a baseline configuration.
2. **Add an AgentSystemManifest/HarnessManifest concept before the first result we want to compare as architecture evidence.** This should be an instrumentation/refactor change, not a behavior expansion.
3. **Keep first HubSpot transfer causal:** hold model + harness + context + skills + tool semantics fixed; change environment/adapter.
4. **Finish no-model HubSpot commissioning before introducing the model.** Preserve integration failures separately from model failures.
5. **After one trusted transfer pair exists, begin explicit architecture experiments one factor at a time.**

The first architecture experiment should probably be small and relevant to observed CAP-001 failures, not selected because a framework is fashionable.

Possible high-information candidates after transfer:
- minimal/preloaded context vs just-in-time context;
- baseline instructions vs a versioned lead-follow-up skill;
- single worker vs independent identity/consent reviewer.

## 11. Scientific rule

The object CanAIYet increasingly measures is:

```text
CapabilityContract
× AgentSystemManifest
× EnvironmentManifest
× RunConfig
-> RunReceipt + deterministic outcome evidence
```

Or in plain English:

> **What job, using what agent architecture, inside what environment, with what model/run settings, produced what real outcome?**

That is more precise than “Can model X do task Y?” and closer to the actual deployment question enterprises face.

## 12. Current-source alignment

This instrumentation direction matches current practical agent-engineering guidance:

- OpenAI’s 2026 Agents API explicitly treats context management, tool use, long-running sessions, sandboxes, artifacts, and subagents as harness responsibilities around the model.
- Anthropic’s context-engineering guidance treats context as a finite attention budget and recommends minimal high-signal context, just-in-time retrieval, structured external notes, compaction, and selective subagents.
- Microsoft’s distributed-skills work reinforces that another competence does not necessarily require another model loop; skill/procedure + tools may be sufficient.

Sources:
- https://openai.com/index/introducing-the-agents-api/
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://devblogs.microsoft.com/agent-framework/from-specialist-agents-to-distributed-skills-over-mcp/

## 13. No authorization created by this note

This document does **not**:
- alter `canonical-build-doc.md`;
- authorize changes to CAP-001 frozen v1 scenarios or accepted evidence;
- authorize paid model calls;
- authorize a live HubSpot call;
- authorize MCP/A2A implementation;
- authorize adding skills/subagents/memory to the current benchmark;
- authorize changing the current HubSpot transfer variable set;
- change Issue #1 mission ordering.

Any implementation of `AgentSystemManifest` or architecture experiment must enter through Mission Control as a bounded work order and receive independent review.

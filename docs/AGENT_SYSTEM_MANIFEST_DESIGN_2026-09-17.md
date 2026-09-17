# CanAIYet AgentSystemManifest design — 2026-09-17

> **Status:** ARCHITECTURE / INSTRUMENTATION DESIGN — not canonical build authority, not a run order, and not permission to change CAP-001 or touch live HubSpot.
> **Canonical authority remains:** `../canonical-build-doc.md`
> **Companions:** `AGENT_HARNESS_MEASUREMENT_MODEL_2026-09-17.md`, `AGENT_ARCHITECTURE_FRONTIER_2026-09-17.md`, `AGENT_SKILL_TOOL_ADAPTER_LAW_TAXONOMY_2026-09-17.md`, `CAP_001_INSTRUMENT_SCIENCE.md`, `HUBSPOT_TRANSFER_DESIGN_2026-09-13.md`
> **Purpose:** Define a first-class manifest for the agent/harness configuration so CanAIYet can reproduce and compare complete agent systems, not only model names.

## 1. Why this manifest exists

CanAIYet already tracks four important layers:

```text
CapabilityContract     = what business capability is being tested
EnvironmentManifest    = where/how the world is implemented
RunConfig              = model/provider/route/permissions/limits for a run
RunReceipt             = what actually happened
```

The missing question is:

> **How was the agent system itself assembled?**

A model can behave very differently depending on:
- instructions;
- context supplied;
- retrieval strategy;
- available skills;
- tool descriptions and discovery method;
- memory policy;
- subagent topology;
- approval rules;
- containment/sandbox rules;
- harness implementation/version.

Those are not merely plumbing. They are experimental variables.

The proposed measurement model is therefore:

```text
CapabilityContract
        ×
AgentSystemManifest
        ×
EnvironmentManifest
        ×
RunConfig
        ↓
RunReceipt + deterministic outcome evidence
```

## 2. Naming decision

Use **`AgentSystemManifest`** as the durable concept.

Reason:
- `HarnessManifest` is too narrow because the measured configuration includes instructions, skills, memory, topology, and approval policy in addition to runtime harness code.
- `AgentSystemManifest` describes the whole worker-system assembly around the foundation model.

`HarnessManifest` may remain an informal synonym when discussing only runtime orchestration.

## 3. Proposed conceptual schema

This is a design sketch, not yet an implementation contract.

```ts
export type AgentSystemManifestInput = {
  agentSystemVersion: string;

  // Harness/runtime
  harnessId: string;
  harnessVersion: string;

  // Instructions / prompt contract
  instructionPackVersion: string;

  // Context engineering
  contextStrategyVersion: string;
  retrievalStrategyVersion?: string;
  compactionStrategyVersion?: string;

  // Skills
  skillPackVersions: string[];

  // Tool exposure
  toolSurfaceVersion: string;
  toolDiscoveryMode: "static" | "dynamic" | "mcp" | "other";
  toolTransport: "custom" | "mcp" | "provider-native" | "other";

  // Memory
  memoryPolicyVersion: string;
  crossScenarioMemory: boolean;

  // Topology
  topology: "single-worker" | "orchestrator-subagents" | "peer-agents" | "other";
  subagentRoleVersions: string[];

  // Human / policy gates
  approvalPolicyVersion: string;

  // Containment / execution boundary
  containmentPolicyVersion: string;

  // Deterministic policy boundary exposed to the agent system
  policyEnforcementVersion: string;
};

export type AgentSystemManifest = AgentSystemManifestInput & {
  agentSystemFingerprint: string;
};
```

The fingerprint should be computed from a canonicalized representation of all fields that can materially affect agent behavior.

## 4. What belongs here vs elsewhere

### AgentSystemManifest
Describes **how the worker is assembled**:
- instructions;
- context strategy;
- retrieval/compaction;
- skills;
- tool exposure/discovery/transport;
- memory;
- agent topology;
- approvals;
- containment;
- policy-enforcement interface;
- harness runtime/version.

### RunConfig
Describes **run-specific model/runtime knobs**:
- requested model;
- provider;
- route;
- permission envelope;
- spend limit;
- turn/token/retry limits;
- fallback policy.

### EnvironmentManifest
Describes **the world**:
- synthetic Acme vs HubSpot;
- adapter version;
- fixture/seed/reset mechanics;
- API versions;
- snapshot projection;
- environment-specific permission mechanics.

### CapabilityContract
Describes **the business exam**:
- invariant scenario semantics;
- agent-facing tool meanings;
- visible business policy;
- deterministic business predicates;
- authority/safety invariants.

### RunReceipt
Describes **observed execution evidence**:
- served model/provider;
- tool trace;
- tokens/cost;
- anomalies;
- final state references;
- exact manifest fingerprints;
- exact environment head.

## 5. Proposed CanAIYet AgentSystem v1 baseline

Before changing behavior, CanAIYet should be able to describe the baseline it already has.

Conceptually:

```text
AgentSystem: canaiyet-agent-system-v1

Harness:
  custom CanAIYet runner/provider loop

Instructions:
  CAP-001 scenario instruction contract

Context:
  scenario-local instruction + payload + allowed-tool descriptions
  no broad company preload

Retrieval:
  none beyond explicit tool use

Skills:
  none as a separately versioned skill pack

Tool surface:
  CAP-001 stable logical tool meanings

Tool discovery:
  static

Tool transport:
  custom provider/world interface

Memory:
  scenario-isolated
  no cross-scenario agent memory

Topology:
  single worker
  no subagents

Approval policy:
  current CAP-001 / permission-envelope rules

Containment:
  synthetic world or dedicated HubSpot test account only

Policy enforcement:
  deterministic environment/tool restrictions + deterministic final-state judge
```

This should first be recorded as **description/provenance**, not used as an excuse to redesign the runner.

## 6. Why the first HubSpot transfer should hold this fixed

The first HubSpot transfer asks:

> Does CAP-001 survive movement from a controlled synthetic company into a real enterprise CRM environment?

Therefore the clean comparison is:

```text
SYNTHETIC
CapabilityContract = same
AgentSystemManifest = same
RunConfig = same
EnvironmentManifest = Acme

versus

HUBSPOT
CapabilityContract = same
AgentSystemManifest = same
RunConfig = same
EnvironmentManifest = HubSpot
```

The primary changed variable is the environment/adapter.

Do **not** simultaneously add:
- a new skill pack;
- MCP transport;
- long-term agent memory;
- subagents;
- a different managed harness;
- a different context strategy;
- a different permission envelope;

unless that change is itself the frozen experimental variable.

## 7. Context engineering as a later experiment

Once a trusted baseline exists, CanAIYet can test:

```text
A: preload / static context
B: just-in-time retrieval
```

Freeze:
- capability contract;
- model/provider;
- environment;
- permissions;
- tools;
- judge;
- memory policy;
- topology.

Change only `contextStrategyVersion` / `retrievalStrategyVersion`.

Measure:
- task success;
- critical failures;
- wrong-person actions;
- consent/policy violations;
- tool-call count;
- input/output tokens;
- latency;
- cost;
- reproducibility.

## 8. Skills as a later experiment

Example:

```text
A: no Lead Follow-up skill
B: lead-followup-skill-v1
```

The skill may teach a procedure such as:
- verify identity;
- check opt-out / consent;
- inspect prior contact;
- retrieve policy when needed;
- do not invent missing fields;
- escalate ambiguity;
- record final CRM state.

The business contract and judge remain unchanged. The experiment asks whether the skill changes reliable capability, not whether the skill sounds useful.

## 9. Agent topology as a later experiment

Example:

```text
A: single worker
B: worker + independent identity/consent reviewer
```

A second agent should be added only when independent reasoning is itself the hypothesis.

Measure whether the extra reasoner earns its cost through fewer critical failures or better evidence quality.

## 10. MCP as a later experiment

Do not treat MCP adoption as automatically beneficial.

A clean future test could compare:

```text
A: current custom tool transport
B: MCP transport exposing the same logical tool surface
```

Hold capability semantics, permissions, environment, model, judge, and agent instructions fixed.

Measure:
- reliability;
- portability;
- tool-selection errors;
- latency;
- tokens/cost;
- trace quality;
- maintenance complexity.

## 11. Memory law

For benchmark validity, distinguish two kinds of memory.

### Agent memory
What the tested worker is allowed to remember.

For CAP-001 baseline:
- scenario-isolated by default;
- no cross-scenario memory unless explicitly tested;
- otherwise earlier scenarios can contaminate later scenarios.

### Lab memory
What CanAIYet records about the experiment.

This should be rich and durable:
- traces;
- manifests/fingerprints;
- costs/tokens;
- tool calls;
- outcomes;
- environment state;
- failure classifications;
- accepted evidence.

**The lab should remember everything necessary for auditability; the tested agent should remember only what the experiment explicitly permits.**

## 12. Comparison law

Future comparable claims should state which layer changed.

### Model comparison
Same:
- CapabilityContract;
- AgentSystemManifest;
- EnvironmentManifest.

Change:
- model/provider configuration as intended.

### Environment transfer
Same:
- CapabilityContract;
- AgentSystemManifest;
- full relevant RunConfig.

Change:
- EnvironmentManifest.

### Harness/architecture comparison
Same:
- CapabilityContract;
- EnvironmentManifest;
- model/provider where possible;
- deterministic judge.

Change:
- one declared AgentSystemManifest dimension.

If multiple material layers change at once, classify the result as a compound experiment and avoid causal claims about any one factor.

## 13. Recommended implementation order — future only

When explicitly authorized, the smallest useful implementation would be:

1. Add `AgentSystemManifest` type + canonical fingerprint helper.
2. Define a baseline `canaiyet-agent-system-v1` describing current behavior without changing it.
3. Add `agentSystemFingerprint` to run provenance / RunReceipt.
4. Require comparison validators to include AgentSystem equality where the scientific claim depends on the same harness/configuration.
5. Add tests proving fingerprint stability and comparison invalidation when a material agent-system field changes.
6. Only after this provenance layer exists, begin deliberate architecture experiments.

This is primarily an **instrumentation/provenance upgrade**, not an agent-feature build.

## 14. What not to build now

This document does not recommend immediately building:
- a separate HubSpot-specific brain;
- a giant general-purpose orchestrator;
- a multi-agent swarm;
- long-term memory;
- MCP everywhere;
- A2A infrastructure;
- managed provider harness migrations;
- automatic skill discovery.

Those are future hypotheses, not prerequisites for the HubSpot transfer.

## 15. Why this matters to the CanAIYet thesis

The useful enterprise question is increasingly not:

> “Can model X do task Y?”

It is:

> **“Under which complete agent-system configuration can AI reliably perform this business capability in this environment and authority envelope?”**

A deployable enterprise worker is a system:

```text
model
+ instructions
+ context
+ skills
+ tools
+ permissions
+ memory
+ topology
+ harness
+ environment
+ deterministic policy
```

CanAIYet can become the laboratory that measures those combinations rather than treating the foundation model as the whole product.

## 16. No authorization created by this document

This document does **not**:
- change `canonical-build-doc.md`;
- alter frozen CAP-001 scenarios or judges;
- authorize implementation of AgentSystemManifest;
- authorize a HubSpot live run;
- authorize paid model/API calls;
- authorize MCP/A2A;
- authorize skills, memory, or subagents;
- change Issue #1 mission ordering;
- authorize merging PR #29.

Future implementation must enter through Mission Control, falsification planning, review, and human approval.

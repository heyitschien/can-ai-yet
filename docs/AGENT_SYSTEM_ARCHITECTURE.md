# CanAIYet agent-system architecture & measurement model

> **Status:** STRATEGY / INSTRUMENTATION DESIGN — not canonical build authority, not a work order, and not permission to change CAP-001, HubSpot runtime, permissions, MCP, models, or Mission Control ordering.
> **Canonical authority remains:** `../canonical-build-doc.md`
> **Companions:** `STARTUP_THESIS_CONFIGURED_AI_DELEGATION.md`, `CAP_001_INSTRUMENT_SCIENCE.md`, `HUBSPOT_TRANSFER_DESIGN_2026-09-13.md`, `ENTERPRISE_ENVIRONMENT_VALIDATION.md`
> **Provenance:** Consolidated 2026-09-17 from PR #29 research drafts (`AGENT_SKILL_TOOL_ADAPTER_LAW_TAXONOMY_*`, `AGENT_ARCHITECTURE_FRONTIER_*`, `AGENT_HARNESS_MEASUREMENT_MODEL_*`, `AGENT_SYSTEM_MANIFEST_DESIGN_*`). Git history retains the dated drafts; this file is the durable readable source.

## Executive finding

The frontier is shifting from “make more agents” toward “build a reliable system around a strong reasoner.”

CanAIYet already contains much of a real agent-evaluation harness. The important missing abstraction is **not** a HubSpot-specific brain. It is a first-class, versioned description of the **agent system / harness configuration** that sits between model and environment.

The durable measurement object is:

```text
CapabilityContract
× AgentSystemManifest
× EnvironmentManifest
× RunConfig
→ RunReceipt + deterministic outcome evidence
```

In plain English:

> **What job, using what agent architecture, inside what environment, with what model/run settings, produced what real outcome?**

## 1. Working taxonomy

### Agent = independent reasoner

Use a separate agent when independent reasoning/autonomy is itself valuable (separate model loop, private context, long-running research, independent lifecycle, or epistemic separation that catches failures).

### Model = brain

Reasoning ability. Not the whole deployed system.

### Harness = operating system around the model

Manages context, sessions, tools, retries, artifacts, sandboxes, subagents, compaction, approvals, traces, and durable state.

### Skill = reusable procedure / competence

Domain instructions, routing, tool-selection procedure, evidence expectations. A skill is **not** a second brain and is **not** enforcement.

### Tool = typed executable operation

`search_contact(...)`, `create_task(...)`, `send_email(...)`, etc. MCP can expose schemas; the backing service still owns side effects.

### Adapter = contract-to-environment translator

Maps a stable CanAIYet capability/environment contract onto Acme, HubSpot, Salesforce, Zendesk, or another concrete runtime (objects, IDs, auth, errors, lifecycle).

### Memory / artifact = notebook outside the context window

Durable state the worker may use (agent memory) vs durable lab evidence (traces, receipts). Those are not the same thing.

### MCP = agent ↔ tool/service plumbing

Vertical integration boundary. Infrastructure, not product truth.

### A2A = agent ↔ independent agent plumbing

Horizontal collaboration when a second reasoner is genuinely required.

### Sandbox / containment = fenced workspace

Hard caps on blast radius.

### Deterministic law = enforced authority / truth

Permissions, scenario invariants, judge assertions, accepted-evidence semantics, schema validation, prohibited actions, irreversible gates.

**Prompt or skill instructions do not replace enforcement.**

### Evaluator / Judge = checker

Deterministic by default where truth is deterministic. The worker does not grade itself.

### Critical implication: logical roles ≠ runtime topology

CanAIYet lab roles (Scout, Test Runner, Judge, Publisher) express **separation of responsibility**. A logical role does not automatically require a separate LLM process. Bounded procedures may be skills + tools; independence may deserve a separate reasoner; deterministic judging must remain code.

Decision questions for any future component:

1. Need another independent reasoner? → candidate agent.
2. Mainly a reusable procedure? → candidate skill.
3. Concrete typed action/query? → tool.
4. Translating a stable CanAIYet contract into a vendor/runtime? → adapter.
5. Enforcing permissions, truth, invariants, judging, or acceptance? → deterministic law.

## 2. What CanAIYet already has

| Layer | Status | Notes |
| --- | --- | --- |
| CapabilityContract | First-class | Business exam / invariant semantics |
| EnvironmentManifest | First-class | Synthetic vs HubSpot mechanics |
| RunConfig | Partial system config | Model/provider/route/permissions/limits |
| Minimal runner/harness | Yes | `evals/runners/run-suite.ts`: prepare → instruct + tools → act → judge → receipt |
| Tool semantics | Yes | Stable agent-facing meanings; adapters map vendors |
| HubSpot adapter prep | Advanced | Auth/versioning, seed/reset, scope matrix, provenance, cleanup |
| Deterministic judge | Yes | Core design law |
| Evidence/provenance | Yes | Run receipts / manifests |

Missing as a first-class named object: **`AgentSystemManifest`** — how the worker system around the model is assembled.

## 3. AgentSystemManifest design

### Naming

Use **`AgentSystemManifest`** as the durable concept. `HarnessManifest` may remain an informal synonym for runtime orchestration alone; the measured configuration also includes instructions, skills, memory, topology, and approval/containment policy.

### Conceptual schema (design sketch — not an implementation contract)

```ts
export type AgentSystemManifestInput = {
  agentSystemVersion: string;

  harnessId: string;
  harnessVersion: string;

  instructionPackVersion: string;

  contextStrategyVersion: string;
  retrievalStrategyVersion?: string;
  compactionStrategyVersion?: string;

  skillPackVersions: string[];

  toolSurfaceVersion: string;
  toolDiscoveryMode: "static" | "dynamic" | "mcp" | "other";
  toolTransport: "custom" | "mcp" | "provider-native" | "other";

  memoryPolicyVersion: string;
  crossScenarioMemory: boolean;

  topology: "single-worker" | "orchestrator-subagents" | "peer-agents" | "other";
  subagentRoleVersions: string[];

  approvalPolicyVersion: string;
  containmentPolicyVersion: string;
  policyEnforcementVersion: string;
};

export type AgentSystemManifest = AgentSystemManifestInput & {
  agentSystemFingerprint: string;
};
```

Fingerprint from a canonicalized representation of every field that can materially affect agent behavior.

### Layer boundaries

| Object | Answers |
| --- | --- |
| CapabilityContract | **What** business job / exam? |
| AgentSystemManifest | **How** is the AI worker assembled? |
| EnvironmentManifest | **Where** does it operate (Acme / HubSpot / …)? |
| RunConfig | **Which** model/provider/route/permission envelope/limits? |
| RunReceipt | **What** happened (trace, cost, authoritative state, fingerprints)? |

Do not bury harness architecture inside EnvironmentManifest (it is not HubSpot). Do not treat RunConfig alone as the full architecture fingerprint.

### Proposed baseline: `canaiyet-agent-system-v1`

Describe current behavior **without redesigning it**:

```text
Harness: custom CanAIYet runner/provider loop
Instructions: CAP-001 scenario instruction contract
Context: scenario-local instruction + payload + allowed-tool descriptions; no broad company preload
Retrieval: none beyond explicit tool use
Skills: none as a separately versioned skill pack
Tool surface: CAP-001 stable logical tool meanings
Tool discovery: static
Tool transport: custom provider/world interface
Memory: scenario-isolated; no cross-scenario agent memory
Topology: single worker; no subagents
Approval: current CAP-001 / permission-envelope rules
Containment: synthetic world or dedicated HubSpot test account only
Policy enforcement: deterministic environment/tool restrictions + deterministic final-state judge
```

First record as **description/provenance**. Behavior change later, only under a Mission Control work order.

### Future implementation order (not authorized by this document)

1. Type + canonical fingerprint helper.
2. Baseline `canaiyet-agent-system-v1` describing current behavior.
3. Add `agentSystemFingerprint` to run provenance / RunReceipt.
4. Comparison validators that require AgentSystem equality when the scientific claim depends on it.
5. Tests for fingerprint stability / invalidation.
6. Only then: deliberate one-factor architecture experiments.

## 4. First HubSpot transfer rule

For the first synthetic → HubSpot transfer:

```text
HOLD FIXED
  CapabilityContract
  AgentSystemManifest / harness configuration
  full relevant RunConfig (model/provider/route/limits)
  agent-facing tool meanings
  policy / authority envelope as defined by the experiment

CHANGE
  EnvironmentManifest / adapter (Acme → HubSpot)
```

Do **not** simultaneously add HubSpot-native MCP, a new skill pack, long-term agent memory, subagents, a managed-harness migration, or a different context strategy unless that factor is the explicitly frozen variable.

Finish **no-model** HubSpot commissioning before introducing the model. Keep integration/permission/runtime failures separate from model failures.

Exception: evaluating a vendor-native agent/harness is a different experiment; that harness becomes part of the configuration under test.

## 5. Comparison discipline

| Claim type | Hold fixed | Change |
| --- | --- | --- |
| Model comparison | CapabilityContract, AgentSystemManifest, EnvironmentManifest | model/provider as intended |
| Environment transfer | CapabilityContract, AgentSystemManifest, relevant RunConfig | EnvironmentManifest |
| Architecture comparison | CapabilityContract, EnvironmentManifest, model where possible, judge | **one** declared AgentSystemManifest dimension |

If multiple material layers change at once, classify as a compound experiment and avoid single-factor causal claims.

## 6. Later one-variable architecture experiments

After one trusted transfer baseline exists, vary one factor at a time:

1. Preload / static context vs just-in-time retrieval.
2. No skill vs versioned lead-follow-up skill.
3. Static/custom tool transport vs MCP-exposed equivalent tools.
4. Single worker vs independent identity/consent reviewer.
5. Broad write authority vs least-authority tools.
6. Prompt-only policy vs deterministic enforcement.
7. Custom harness A vs managed/provider harness B.

Measure at least: pass/fail, critical failures, wrong-identity / consent violations, tool-call count, tokens, latency, cost, traceability, reproducibility, maintenance complexity.

Skills must not contain hidden scenario answers or judge secrets. Skills are configuration under test.

**Lab memory** (receipts, fingerprints, costs) should be rich. **Agent memory** for CAP-001 baseline should stay scenario-isolated unless continuity is the hypothesis.

## 7. Portable capability decomposition (hypothesis)

```text
capability semantics
  + skill / procedure
  + portable capability contract
  + environment adapter
  + typed tools
  + deterministic judge + permissions
```

If too much capability logic leaks into each adapter, portability is falsified or narrowed. That is what HubSpot transfer should help reveal.

## 8. Frontier research provenance (2026)

Consulted sources (retrieve again before any implementation that depends on vendor APIs):

| Source | URL | CanAIYet takeaway |
| --- | --- | --- |
| OpenAI Agents API (2026-09-10) | https://openai.com/index/introducing-the-agents-api/ | Harness (context, tools, subagents, artifacts, durable execution) is part of configuration |
| Anthropic context engineering (2025-09-29) | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | Context is a finite attention budget; record what was supplied/retrieved |
| Anthropic multi-agent research (2025-06-13) | https://www.anthropic.com/engineering/multi-agent-research-system | Topology is measurable; extra agents must earn their cost |
| Anthropic harness design (2026-03-24) | https://www.anthropic.com/engineering/harness-design-long-running-apps | Ablate scaffolding as models improve |
| Anthropic containment (2026-05-25) | https://www.anthropic.com/engineering/how-we-contain-claude | Permission envelope + hard containment are first-class safety dimensions |
| Microsoft distributed skills over MCP (2026-09-16) | https://devblogs.microsoft.com/agent-framework/from-specialist-agents-to-distributed-skills-over-mcp/ | Competence ≠ second reasoner; skill + tools may suffice |
| MCP spec note (2026-07-28) | https://blog.modelcontextprotocol.io/posts/2026-07-28/ | Useful tool plumbing; CanAIYet still owns contract/judge/provenance |
| A2A v1.0 (2026-03-12) | https://a2a-protocol.org/v1.0.0/ · https://a2a-protocol.org/dev/blog/2026/03/12/a2a-protocol-ships-v10-production-ready-standard-for-agent-to-agent-communication/ | Agent↔agent boundary distinct from MCP agent↔tool |

### Microsoft demo caveat (negative / uncertain finding)

In Microsoft’s small ski-resort comparison, A2A specialist runs used 6/6/7 model calls vs 3/3/3 on the MCP-skills path; mean elapsed ~15.480 s vs ~6.348 s; skills path used ~22% more observed total tokens across three runs. Microsoft explicitly warns this was **not** a controlled performance or quality study. Cache, initialization, language/runtime differences, and different work performed confound the result. Fewer model calls did **not** automatically mean fewer tokens or lower cost.

Lesson for CanAIYet:

> **Architecture claims are testable capability claims. Measure them.**

Compatibility caution: Microsoft’s demonstrated `skill://...` shape and pinned framework versions are not universal MCP law. Before any implementation, inspect current MCP / Agent Skills specs, pin versions, and treat skill-document format, MCP transport, and host tool-registration APIs as distinct contracts.

## 9. Enterprise design laws to test (not doctrine)

1. Least authority by default.
2. Hard containment around powerful actions.
3. Durable truth outside the LLM context.
4. Just-in-time context instead of maximal context by default.
5. Skills for procedures; tools for actions; adapters for vendor translation.
6. Another agent only when independent reasoning or parallelism pays for itself.
7. Deterministic code for permissions and facts that can be deterministically checked.
8. External content / tool output treated as untrusted input.
9. Architecture measured as part of configuration.
10. Harness complexity periodically ablated as models improve.

Recommended learning loop:

```text
new architecture idea
  → preserve research note
  → state exact hypothesis
  → choose one relevant capability
  → freeze task / environment / judge
  → vary one architectural factor
  → measure evidence
  → CONTINUE | NARROW | PIVOT | STOP
```

Do not create a parallel product for every framework trend. Use CanAIYet as the measurement laboratory when the idea creates a falsifiable capability question.

## 10. Immediate recommendation

1. Fingerprint / document the harness already present (`canaiyet-agent-system-v1` description).
2. Add `AgentSystemManifest` as instrumentation/provenance before treating architecture as comparable evidence.
3. Keep the first HubSpot transfer causal: same agent system + model settings; change environment/adapter.
4. Finish no-model HubSpot commissioning before model transfer.
5. After one trusted pair, run small architecture experiments tied to observed CAP-001 failure modes — not fashion.

## 11. No authorization created by this document

This document does **not**:

- edit `canonical-build-doc.md`;
- change CAP-001 frozen scenarios or judges;
- authorize `AgentSystemManifest` implementation;
- authorize live HubSpot action, paid model/API calls, MCP/A2A, skills/memory/subagents, or managed-harness migration;
- change Issue #1 / `NEXT_MISSIONS.md` ordering;
- authorize merging PR #29.

Any implementation must enter through Mission Control, falsification planning, independent review, and human approval.

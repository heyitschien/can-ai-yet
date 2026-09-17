# Agent architecture frontier — 2026-09-17

> **Status:** STRATEGY / RESEARCH — not canonical build authority, not a work order, and not permission to change CAP-001 or current Mission Control priority.
> **Canonical authority remains:** `../canonical-build-doc.md`
> **Companions:** `AGENT_SKILL_TOOL_ADAPTER_LAW_TAXONOMY_2026-09-17.md`, `AGENT_HARNESS_MEASUREMENT_MODEL_2026-09-17.md`
> **Purpose:** Preserve a current cross-vendor synthesis of practical agent-system architecture and translate it into testable CanAIYet questions.

## Executive finding

The frontier is shifting from “make more agents” toward “build a reliable system around a strong reasoner.”

The emerging stack is:

```text
human intent / authority
        |
        v
agent harness / orchestrator
        |
        +-- context engineering / memory / compaction
        +-- skills loaded just in time
        +-- typed tools + environment adapters (often via MCP)
        +-- selective independent subagents
        +-- durable sessions / tasks / artifacts / recovery
        +-- sandbox / containment
        +-- deterministic permissions and policy
        +-- traces / evidence / independent evaluation
```

The key CanAIYet implication is that the thing being tested is increasingly not “model X” alone. It is a **configuration**:

```text
model
× harness
× skills
× tools
× permissions
× memory strategy
× agent topology
× environment
× task
```

For how this maps onto current CAP-001 / HubSpot instrumentation, see `AGENT_HARNESS_MEASUREMENT_MODEL_2026-09-17.md`.

## Evidence base consulted

### OpenAI — Agents API, 2026-09-10
Source: https://openai.com/index/introducing-the-agents-api/

OpenAI describes long-running agents as needing a harness that manages context, efficient tool use, subagents, files/code environments, artifacts, and reliable execution that can continue for days. The Agents API exposes that Codex-style harness as infrastructure.

**CanAIYet implication:** harness design is part of the tested configuration, not invisible plumbing.

### Anthropic — context engineering, 2025-09-29
Source: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

Anthropic treats context as a finite attention budget and recommends just-in-time retrieval, compaction, structured external notes/memory, and selective subagents for long-horizon work.

**CanAIYet implication:** benchmark configuration should record what context was supplied, how it was retrieved/compacted, and what durable memory the worker could access.

### Anthropic — multi-agent research, 2025-06-13
Source: https://www.anthropic.com/engineering/multi-agent-research-system

Anthropic’s production research system uses an orchestrator with parallel subagents. It reports large gains on breadth-first research, but much higher token use and poor fit for tightly interdependent tasks.

**CanAIYet implication:** agent topology is a measurable configuration variable. Multiple agents should earn their cost through task-relevant performance.

### Anthropic — harness design, 2026-03-24
Source: https://www.anthropic.com/engineering/harness-design-long-running-apps

Anthropic describes planner / generator / evaluator loops and structured artifacts for long-running autonomous work, while emphasizing that harness components should be removed when better models no longer need them.

**CanAIYet implication:** test architecture components with ablations; do not let scaffolding become unquestioned doctrine.

### Anthropic — containment, 2026-05-25
Source: https://www.anthropic.com/engineering/how-we-contain-claude

Anthropic’s practical security lesson is to cap blast radius using hard environmental boundaries: sandboxes/VMs, filesystem and network controls, narrow permissions, and defense in depth. Tool output and external content are attack surfaces.

**CanAIYet implication:** permission envelope and containment are first-class dimensions of “Can AI do this safely?”

### Microsoft — distributed skills over MCP, 2026-09-16
Source: https://devblogs.microsoft.com/agent-framework/from-specialist-agents-to-distributed-skills-over-mcp/

Microsoft distinguishes another reasoner from another competence: a bounded specialist can often become skill instructions + typed MCP tools + backing service instead of a second model loop.

**CanAIYet implication:** logical roles do not have to map one-to-one onto agent runtimes.

### MCP specification 2026-07-28
Source: https://blog.modelcontextprotocol.io/posts/2026-07-28/

MCP now has a stateless HTTP-friendly core, stronger authorization, cacheable catalogs, formal extensions, and a Tasks extension for durable asynchronous work.

**CanAIYet implication:** MCP can be useful infrastructure for portable tool exposure, but the CanAIYet capability contract, judge, provenance, and environment semantics remain our responsibility.

### A2A v1.0, 2026-03-12
Sources:
- https://a2a-protocol.org/v1.0.0/
- https://a2a-protocol.org/dev/blog/2026/03/12/a2a-protocol-ships-v10-production-ready-standard-for-agent-to-agent-communication/

A2A is now a stable protocol for independent agent systems to discover capabilities, delegate stateful tasks, exchange artifacts, and collaborate across frameworks/vendors.

**CanAIYet implication:** MCP and A2A represent different configuration boundaries: agent→tool/service versus independent agent→agent.

## Frontier mental model

### Model = brain
Reasoning ability.

### Agent = brain in a loop
Reason → act → observe → continue.

### Harness = operating system
Manages context, sessions, tools, retries, artifacts, sandboxes, subagents, compaction, approvals, traces, and durable state.

### Skill = procedure
A reusable method loaded when relevant.

### Tool = hand
A typed operation that reads or changes the environment.

### Adapter = plug converter
Maps the portable CanAIYet contract onto Acme, HubSpot, Salesforce, Zendesk, or another concrete environment.

### Memory / artifact = notebook
Durable state outside the context window.

### MCP = agent ↔ tool/service plumbing
Vertical integration boundary.

### A2A = agent ↔ independent agent plumbing
Horizontal collaboration boundary.

### Sandbox / containment = fenced workspace
Hard caps on blast radius.

### Deterministic law = rules that cannot be persuaded
Authorization, invariants, judging, evidence acceptance, irreversible gates.

### Evaluator = checker
Can be deterministic, independent model-based, or hybrid depending on the claim being judged.

## Enterprise architecture recommendation

This is a research recommendation, not a build order.

For a real enterprise task such as lead follow-up, prefer the following shape:

```text
USER / BUSINESS OWNER
      |
      v
ORCHESTRATOR AGENT + HARNESS
      |
      +-- load Lead Follow-up skill just in time
      +-- retrieve only relevant account/contact context
      +-- use typed CRM/email/calendar tools
      +-- call vendor adapter for HubSpot/Salesforce/etc.
      +-- persist task state and evidence outside context
      +-- spawn an independent subagent only if a second reasoner adds value
      |
      v
DETERMINISTIC POLICY / PERMISSION LAYER
      |
      +-- identity match
      +-- opt-out / policy enforcement
      +-- allowed discount / write scope
      +-- irreversible-action gates
      +-- tenant/user authorization
      |
      v
REAL SYSTEM ACTION
      |
      v
AUTHORITATIVE STATE + TRACE
      |
      v
JUDGE / EVALUATION / HUMAN REVIEW AS REQUIRED
```

This separates intelligence from authority and lets the same capability semantics transfer across environments.

## The HubSpot example as a CanAIYet research object

The same top-level request can be evaluated across architectures:

> “Follow up with this inbound HubSpot lead.”

Candidate configuration A:
```text
one agent + all tools + large prompt
```

Candidate configuration B:
```text
one orchestrator
+ just-in-time lead skill
+ narrow HubSpot adapter/tools
+ deterministic opt-out/identity/policy layer
+ durable task/evidence state
```

Candidate configuration C:
```text
orchestrator
+ specialist sales agent
+ HubSpot tools
+ same deterministic policy/judge
```

CanAIYet can freeze the scenario and compare which configuration best satisfies the business outcome under the same evidence law.

Measure:
- correct lead identity;
- correct CRM updates;
- correct email recipient/content requirements;
- opt-out/policy compliance;
- required escalation;
- duplicate action prevention;
- final authoritative state;
- critical failures;
- latency;
- model/tool calls;
- tokens/cost;
- permission envelope;
- traceability;
- reproducibility.

## Important new product thesis

The valuable question may evolve from:

> “Which model is best?”

into:

> **“Under which model + harness + tools + permissions + memory + topology + environment does AI reliably perform this capability?”**

That is more relevant to enterprise deployment because businesses deploy systems, not naked foundation models.

This thesis must be tested rather than assumed.

## Recommended learning strategy for this repository

Do **not** create a new project for every agent-framework trend.

Use CanAIYet itself as the **measurement laboratory** when a new architectural idea creates a falsifiable capability question.

Recommended loop:

```text
new architecture idea
    -> preserve research note
    -> state exact hypothesis
    -> choose one relevant capability
    -> freeze task / environment / judge
    -> vary one architectural factor
    -> measure evidence
    -> CONTINUE | NARROW | PIVOT | STOP
```

Examples that belong naturally here:
- specialist agent vs skill + MCP tools;
- one-agent vs orchestrator + independent reviewer;
- broad tool access vs least-authority tool set;
- full context preload vs just-in-time context;
- prompt-only policy vs deterministic enforcement;
- synthetic adapter vs HubSpot adapter portability.

Use a separate toy repo only when a framework must first be learned in isolation and the experiment would otherwise contaminate canonical benchmark code. Any useful result should then return as a small, explicitly designed CanAIYet experiment rather than creating a permanent parallel product.

## Enterprise design laws to test and preserve

1. Least authority by default.
2. Hard containment around powerful actions.
3. Durable truth outside the LLM context.
4. Just-in-time context instead of maximal context.
5. Skills for reusable procedures; tools for actions; adapters for vendor translation.
6. Another agent only when independent reasoning or parallelism pays for itself.
7. Deterministic code for permissions and facts that can be deterministically checked.
8. External content/tool output treated as untrusted input.
9. Architecture measured as part of configuration.
10. Harness complexity periodically ablated as models improve.

## No authorization created by this note

This document does **not**:
- change `canonical-build-doc.md`;
- alter CAP-001 scenarios/judges;
- authorize a new benchmark run;
- authorize MCP/A2A implementation;
- authorize paid model/API calls;
- authorize HubSpot/Salesforce/Zendesk expansion;
- change Issue #1 mission ordering;
- authorize public claims from this synthesis.

Any experiment must enter through the existing falsification / Mission Control / independent-review / human-approval process.
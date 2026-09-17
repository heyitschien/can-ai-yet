# Agent / Skill / Tool / Adapter / Law taxonomy — 2026-09-17

> **Status:** STRATEGY / ARCHITECTURE RESEARCH — not canonical build authority, not a work order, and not permission to change CAP-001, run paid evaluations, or broaden current scope.
> **Canonical authority remains:** `../canonical-build-doc.md`
> **Source:** Microsoft Agent Framework Dev Blog, “From Specialist Agents to Distributed Skills over MCP,” Tommaso Stocchi, 2026-09-16.
> **Source URL:** https://devblogs.microsoft.com/agent-framework/from-specialist-agents-to-distributed-skills-over-mcp/
> **Why preserved:** The article clarifies a key design question for CanAIYet: a logical specialist role does not automatically require a separate LLM runtime.

## 1. Core distinction

A common multi-agent pattern is:

```text
parent agent
  -> specialist agent
    -> domain tools
```

The specialist owns its own model loop, interprets the delegated task, chooses tools, and returns a response that the parent interprets again.

Microsoft’s distributed-skill pattern asks whether that nested reasoner is actually necessary. If the parent can safely own the reasoning, a bounded specialty can instead expose:

```text
description -> when the competence is useful
SKILL.md     -> how to perform the competence
typed MCP tools -> concrete operations
backing service -> application logic / data / side effects
```

The domain service can remain distributed and independently deployed. The reasoning moves into the parent agent.

Microsoft explicitly does **not** claim “MCP replaces A2A everywhere.” A component that needs its own model, private context, substantial workflow, research loop, or independent lifecycle may still deserve to remain an agent.

## 2. Working taxonomy for CanAIYet

### Agent = independent reasoner

Use a separate agent when independent reasoning/autonomy is itself valuable.

Possible signals:
- separate model execution is useful;
- private/specialized context is required;
- long-running planning or research is required;
- an independent lifecycle is required;
- genuine epistemic separation improves trust or catches failures.

### Skill = reusable procedure / competence

A skill tells a reasoner how to execute a bounded domain procedure.

A skill may contain:
- domain instructions;
- routing guidance;
- business-policy interpretation guidance;
- tool-selection procedure;
- response/evidence expectations.

A skill is **not** a second brain and is **not** enforcement.

### Tool = executable operation

A tool is a typed callable operation such as:

```text
search_contact(...)
update_contact(...)
create_task(...)
send_email(...)
read_calendar(...)
```

MCP can expose tool descriptions and input/output schemas. The backing implementation remains responsible for actual application behavior.

### Adapter = contract-to-environment translator

An adapter maps the stable CanAIYet capability/environment contract into a concrete vendor/runtime.

Conceptually:

```text
portable capability contract
  -> HubSpot adapter
      -> HubSpot objects / API / auth / errors

portable capability contract
  -> Salesforce adapter
      -> Salesforce objects / API / auth / errors
```

The adapter absorbs environment-specific details so the capability semantics and evaluation question can remain as stable as possible.

### Deterministic law = enforced authority / truth

Deterministic law is code that actually enforces:
- permissions and authorization;
- scenario invariants;
- judge assertions;
- accepted-evidence semantics;
- schema validation;
- prohibited actions;
- irreversible gates.

**Prompt or skill instructions do not replace enforcement.**

This directly reinforces CanAIYet’s existing architecture: the worker/model acts; deterministic code inspects authoritative final state; the worker does not grade itself.

## 3. Critical implication: logical roles are not runtime topology

CanAIYet’s canonical lab roles are:
- Scout;
- Test Runner;
- Judge;
- Publisher.

Those roles express **separation of responsibility**. This note adds an important architectural distinction:

> A logical role does not automatically require a separate LLM process.

For example:
- a Scout may need open-ended research and therefore deserve an agent runtime;
- a bounded test-running procedure may be a skill + tools;
- the deterministic scenario judge should remain code, not an LLM specialist;
- an independent review role may deserve a separate reasoner precisely because independence is valuable;
- publishing may be a bounded procedure with deterministic claim/provenance checks rather than another autonomous agent.

The existing role model should therefore stay conceptually separate from implementation topology.

## 4. Why this matters to portable capability packs

CanAIYet is already exploring whether a capability contract can transfer from the synthetic Acme environment into real enterprise systems such as HubSpot without destroying comparability.

This taxonomy suggests a clean decomposition to test:

```text
CAPABILITY SEMANTICS
  “follow up with an inbound sales lead”
          |
          +-- skill / procedure
          |     how to perform this bounded competence
          |
          +-- portable capability contract
          |     required observations/actions/evidence
          |
          +-- environment adapter
          |     Acme | HubSpot | Salesforce | Zendesk | ...
          |
          +-- typed tools
          |     concrete operations available in that environment
          |
          +-- deterministic judge + permissions
                authoritative outcome / safety enforcement
```

If this survives real transfer testing, the valuable reusable asset may be more than a vendor integration. It may be:

> **capability semantics + procedure + portable contract + environment adapters + deterministic evaluation.**

That remains a hypothesis until measured.

## 5. MCP’s role

MCP can serve as a standard transport/interface for discovering and invoking tools and, in some host/framework designs, retrieving skill instructions.

For CanAIYet, MCP should be treated as infrastructure, not product truth.

Potential benefits to test:
- consistent tool exposure across environments;
- typed schemas;
- cleaner separation between procedure and concrete service;
- easier swapping of environment adapters;
- reduced need for custom tool wiring in each agent runtime.

But the capability contract, deterministic judges, provenance, and vendor-specific authorization semantics remain CanAIYet responsibilities.

## 6. Microsoft demo observations — useful, not conclusive

In Microsoft’s small ski-resort comparison:
- the A2A specialist path used 6, 6, and 7 model calls across three runs;
- the native MCP-skills path used 3 model calls in each run;
- mean observed elapsed time was about 15.480 s for A2A vs 6.348 s for the skills path;
- the skills path consumed about 22% more observed total tokens across the three runs.

Microsoft explicitly warns that this was **not** a controlled performance or quality study. Cache behavior, initialization, language/runtime differences, and different work performed confound the result. Fewer model calls did not automatically mean fewer tokens or lower cost.

For CanAIYet the correct lesson is therefore not “skills are faster.” It is:

> **Architecture claims are testable capability claims. Measure them.**

## 7. New research question for CanAIYet

CanAIYet can eventually evaluate not only **which model** succeeds, but also **which agent architecture/configuration** succeeds.

A future frozen experiment could compare the same capability under two configurations:

```text
A. parent -> specialist agent -> tools
B. parent -> skill/procedure -> MCP tools
```

Freeze:
- task/scenario set;
- environment fixture;
- permissions;
- deterministic judge;
- model family where possible;
- acceptance criteria.

Measure:
- scenario pass/fail;
- critical failures;
- wrong-tool / wrong-identity actions;
- authorization violations;
- model calls;
- tokens and cache use;
- elapsed time;
- cost;
- traceability;
- reproducibility;
- failure attribution;
- maintenance complexity.

This could make **model × configuration × task** even more concrete: architecture is part of configuration.

No such experiment is authorized by this note.

## 8. Adapter insight for enterprise transfer

The adapter concept becomes clearer under this taxonomy.

CanAIYet is not adapting “AI” into HubSpot. It is adapting a **stable internal capability/environment contract** to HubSpot’s concrete reality:
- object names and schemas;
- IDs and identity semantics;
- API endpoints;
- auth/scopes;
- pagination;
- rate limits;
- lifecycle states;
- error models;
- action side effects.

The same higher-level capability can later be mapped through a different adapter to Salesforce or another system.

If too much capability logic leaks into each adapter, portability is falsified or narrowed. That is exactly what the HubSpot transfer experiment should help reveal.

## 9. Deterministic boundaries remain non-negotiable

The article reinforces an existing CanAIYet principle:

> **Instructions describe behavior. Code enforces boundaries.**

Therefore:
- a `SKILL.md` may describe an approval requirement, but authorization must be enforced by the service/runtime;
- a skill may say “do not contact opted-out leads,” but the test environment and judge must be able to detect/prevent/score violations;
- a model may explain why an action is correct, but accepted evidence comes from authoritative state and provenance;
- an LLM evaluator must not silently replace deterministic scenario assertions where deterministic truth exists.

## 10. Compatibility caution

Microsoft’s article notes that its skill transport used a particular Agent Skills / MCP integration shape and pinned framework versions. The demonstrated `skill://...` discovery mechanism should not be treated as universal core MCP law.

Before any implementation:
- inspect the current MCP / Agent Skills specifications;
- pin framework versions;
- separate skill-document format, MCP transport, and host tool-registration APIs as distinct contracts;
- validate current framework behavior rather than copying the demo mechanically.

## 11. Decision questions to preserve

For each future CanAIYet component or enterprise capability, ask:

1. **Does this need another independent reasoner?** -> candidate agent.
2. **Is this mainly a reusable procedure?** -> candidate skill.
3. **Is this a concrete typed action/query?** -> tool.
4. **Is this translating a stable CanAIYet contract into a vendor/runtime?** -> adapter.
5. **Is this enforcing permissions, truth, invariants, judging, or acceptance?** -> deterministic law.

This taxonomy can reduce agent sprawl while preserving independence where independence is part of the value.

## 12. No authorization created by this note

This document does **not**:
- modify `canonical-build-doc.md`;
- change CAP-001 frozen scenarios or judges;
- authorize MCP implementation;
- authorize a new specialist-agent runtime;
- authorize HubSpot/Salesforce/Zendesk expansion;
- authorize paid model/API calls;
- authorize public claims based on the Microsoft demo;
- change current Issue #1 mission ordering.

Any implementation must arrive through the existing Mission Control work-order, falsification, evidence, independent-review, and human-approval process.

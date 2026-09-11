# CanAIYet Four-Agent System

**Status:** OPERATING ARCHITECTURE  
**Scope:** Agent-role configuration for CanAIYet research, evaluation, review, and publishing.  
**Coordination channel:** GitHub Issue #1 — CanAIYet Mission Control.

This document turns the canonical logical roles — **Scout → Test Runner → Judge → Publisher** — into a practical multi-agent operating system using the tools we already have.

The important principle is:

> **Roles are fixed; model/vendor assignments are replaceable. Use the best available agent for each job without changing the evidence protocol.**

We do **not** need four separate subscriptions or a complicated orchestration platform. The MVP should use the simplest combination of Grok, Cursor, ChatGPT/Solace, GitHub, and the existing repository/database infrastructure.

---

## 1. Human governance layer

### Chiến — Owner / final authority

Chiến is not one of the four autonomous roles. He owns:

- product intention and priorities;
- what matters to humans;
- approval of material scope changes;
- approval of meaningful model spend;
- destructive database changes;
- publication of consequential claims;
- final acceptance when judgment is required.

Agents can recommend, test, compare, and prepare. They do not replace the owner's purpose or final judgment.

---

## 2. The four logical agents

| Logical agent | Preferred MVP engine | Job | Must not do |
|---|---|---|---|
| **1. Scout / Eyes** | **Grok** | Watch model releases, tools, benchmarks, research, and other changes that may affect existing capabilities. Convert discoveries into bounded findings. | Modify fixtures, change benchmark expectations, publish capability claims, or trigger expensive runs on its own. |
| **2. Builder / Test Runner / Hands** | **Cursor** (cloud or a local session; same contract) | Implement repo changes, run frozen evaluation suites, execute bounded tests, create commits/PRs, and report exact evidence. | Self-accept its own work, weaken tests to improve a score, or broaden scope without approval. |
| **3. Independent Judge / Reviewer** | **Fresh independent Cursor reviewer by default**; ChatGPT/Solace may provide strategic second review | Inspect the exact head/PR and resulting state independently. Verify expected state, forbidden actions, provenance, tests, RLS, and evidence integrity. | Trust the builder summary as proof, silently modify fixtures, or accept work it authored. |
| **4. Coordinator / Publisher** | **ChatGPT/Solace** for coordination and claim framing; Cursor/operator performs code/DB writes when needed | Turn accepted evidence into the next bounded work order, prepare publication/update instructions, maintain the operational ledger, and ensure public wording matches evidence strength. | Invent scores, publish unaccepted runs, upgrade evidence tier without proof, or bypass human gates. |

### Why this mapping

**Grok** is used where broad external discovery and web scanning are valuable.

**Cursor** is the execution engine because it can work directly in the repository, modify code, run tests, inspect files, and produce reviewable commits/PRs. We can use separate Cursor sessions/agents for builder and reviewer instead of paying for a second development platform.

**ChatGPT/Solace** is the manager/coordinator layer: translate human intent into bounded missions, compare work against the canonical documents, maintain the cross-agent communication loop, and frame what can truthfully be published.

**GitHub Issue #1 + repository docs + Supabase evidence** are the shared memory and receipts. The agents should not rely on hidden conversational memory to know project state.

---

## 3. Independence matters more than vendor diversity

The reviewer does not have to be a different company/model from the builder. It **does** need an independent role and clean review context.

For an MVP, the cheapest practical arrangement is:

```text
Grok Scout
   ↓
GitHub Issue #1 finding
   ↓
ChatGPT/Solace Coordinator
   ↓ bounded work order
Cursor Builder / Test Runner
   ↓ commit / PR / evidence
Fresh Cursor Reviewer / Judge
   ↓ ACCEPTED or CHANGES_REQUESTED
ChatGPT/Solace Publisher / Coordinator
   ↓ publish candidate
Chiến
   ↓ final approval where required
Production / database / public evidence
```

If a future model is materially better for one role, substitute it **without changing the contract between roles**.

Example:

```text
Scout: Grok today → another web-capable research agent later
Builder: Cursor today → another repo execution agent later
Judge: clean Cursor reviewer today → another independent coding/review agent later
Coordinator: ChatGPT/Solace today → another strong reasoning/coordination model later
```

The durable architecture is the protocol, not the vendor name.

---

## 4. Agent contracts

### Agent 1 — Scout

**Input**

- model/tool release notes;
- benchmark changes;
- new agent/tool capabilities;
- relevant research;
- user demand / zero-result search clusters when available.

**Output**

```text
SCOUT FINDING
change:
potentially_affected_capabilities:
confidence:
reason:
source/evidence:
recommended_action: IGNORE | REVIEW | RETEST
```

A Scout finding is **not** permission to publish or spend money.

### Agent 2 — Builder / Test Runner

**Input**

- receipt ID;
- exact bounded work order;
- canonical basis;
- frozen fixtures/expected states;
- approved provider/model/budget when running a real benchmark.

**Output**

- exact commit/PR/head;
- files changed;
- commands/tests run;
- scenario results;
- cost/token information when applicable;
- known limitations;
- `READY_FOR_REVIEW`.

Builder STOP after handoff.

### Agent 3 — Independent Judge / Reviewer

**Input**

- exact head/PR;
- canonical requirements;
- builder evidence;
- frozen test definitions;
- persisted run metadata when relevant.

**Checks**

- exact code actually matches the work order;
- expected conditions are satisfied;
- forbidden conditions did not occur;
- fixtures were not weakened;
- provenance is complete;
- score calculation is reproducible;
- public labels match evidence level;
- security/RLS boundaries remain correct;
- no uncontrolled model-spend path exists.

**Output**

```text
VERDICT: ACCEPTED | CHANGES_REQUESTED | BLOCKED
exact_head:
verified:
failures_or_risks:
required_corrections:
```

### Agent 4 — Coordinator / Publisher

**Input**

- accepted review verdict;
- accepted run/evidence;
- canonical product rules;
- current public state.

**Output**

- next bounded mission; or
- publish candidate / database update instruction; or
- no-op if evidence does not justify a public change.

Publisher must preserve language such as:

> **Under the tested conditions...**

and must never turn simulation evidence into a universal AI claim.

---

## 5. Two loops: product engineering and capability intelligence

### A. Product-engineering loop

Used when changing the CanAIYet codebase itself.

```text
Chiến intent
→ ChatGPT/Solace work order
→ Cursor Builder
→ independent Reviewer
→ ChatGPT/Solace acceptance/publication coordination
→ Chiến when a material approval is required
```

### B. Capability-intelligence loop

Used when AI technology changes and an existing capability may need retesting.

```text
Grok Scout detects material change
→ Issue #1 finding
→ Coordinator maps affected capability
→ approved Test Runner executes frozen suite
→ Judge verifies outcome
→ Publisher prepares evidence update
→ human approval when required
→ publish
```

These loops share the same receipts, evidence requirements, and review gates.

---

## 6. Communication protocol

All material cross-agent handoffs go through **GitHub Issue #1** using the receipt format defined in `docs/COMMUNICATION_PROTOCOL.md`.

Do not rely on one agent remembering another agent's private context.

Every handoff should be reconstructable from durable state:

```text
canonical docs
+ agent-system docs
+ Git commit / PR
+ Issue #1 receipts
+ accepted evaluation artifacts / Supabase rows
= project memory
```

This is what lets the system survive agent resets, model changes, phone/desktop switching, or a different provider later.

---

## 7. Model/tool-selection rule

Do not choose an agent because it is fashionable. Choose it by the job.

### Scout selection criteria

- fresh web/release discovery;
- breadth;
- source tracing;
- low-cost recurring scans.

### Builder selection criteria

- repository access;
- reliable code edits;
- terminal/test execution;
- exact diffs and commits;
- long-running implementation ability.

### Judge selection criteria

- independent context;
- exact repository inspection;
- adversarial verification;
- ability to reproduce commands/results;
- no incentive to defend the builder's solution.

### Coordinator/Publisher selection criteria

- strong reasoning across product + engineering + evidence;
- durable GitHub communication;
- ability to turn human intent into bounded missions;
- strong restraint around unsupported claims.

When a better model appears, change the engine assignment, not the role contract.

---

## 8. Cost principle

The goal is **not four expensive agents running constantly**.

Preferred MVP configuration:

- keep Cursor as the main execution engine;
- use Grok for bounded discovery/scouting;
- use ChatGPT/Solace as manager and coordinator/publisher, not as a substitute for the independent judge;
- use a second clean Cursor context for independent code/evidence review when practical;
- run frontier-model benchmark calls only when explicitly approved and budget-capped.

No autonomous loop may create unlimited model/API spend.

---

## 9. Hard separation of duties

1. Scout may propose a retest, but may not change the expected answer.
2. Builder may run the test, but may not accept its own result.
3. Judge may reject/accept, but may not quietly alter the fixture to make a result pass.
4. Publisher may prepare a public update only from accepted evidence.
5. Human owner decides consequential scope/spend/publication questions.

The same model can technically occupy more than one role at different times, but **not within the same mission without an explicit handoff and fresh review context**.

---

## 10. MVP configuration now

For the current CanAIYet phase:

```text
SCOUT          = Grok
BUILDER        = Cursor (cloud or local session)
JUDGE          = fresh independent Cursor reviewer
COORDINATOR    = ChatGPT/Solace
HUMAN OWNER    = Chiến
SHARED MEMORY  = GitHub Issue #1 + docs + commits/PRs + Supabase accepted evidence
```

Immediate use:

- Grok does not need to run yet for the first CAP-001 implementation mission.
- ChatGPT/Solace defines the bounded mission and reviews the plan.
- Cursor Builder implements the real-model path only after plan acceptance.
- A fresh reviewer independently verifies the exact implementation and evidence.
- Publication happens only after accepted evidence exists.

---

## 11. Future configuration work

Specific provider/model assignments should be revisited later using measured results rather than preference.

Future questions to test:

- Which scout finds the most relevant changes with the fewest false positives?
- Which coding agent completes bounded repo missions most reliably?
- Which reviewer catches the most real defects without inventing blockers?
- Which coordinator produces the clearest bounded work orders and safest publication decisions?
- Can one role be automated further without weakening independence or human control?

That evaluation should become evidence of its own.

---

## 12. North-star operating idea

### Two meanings of Judge

The canonical document uses **Judge** for the deterministic checker: it looks at the pretend business and scores what happened. That checker is code. It does not change fixtures.

This operating document also uses **Judge** for the independent reviewer: a fresh agent that inspects the exact commit or run. That reviewer is not the scoring function, and it is not ChatGPT by default.

Do not collapse those two jobs. A passing score from the code judge is not the same thing as an accepted review.

The human decides **why and where to point the system**.

The coordinator turns that purpose into bounded work.

Specialist agents do what they are best at.

Independent evidence decides whether the work actually succeeded.

That is the multi-agent pattern CanAIYet should use internally — and, eventually, the same pattern it may help other people understand and trust.
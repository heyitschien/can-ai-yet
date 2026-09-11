# Evidence Source-of-Truth Plan

**Status:** EXPLANATORY / RECOMMENDED FOUNDATION  
**Purpose:** Explain the evidence split, why it is risky, and what the target architecture should be before real-model results are published.

**Implementation note (CAY-20260910-04):** The public read path no longer combines a Supabase headline with repository scenario detail. Until an accepted test-run chain exists, the page uses the repository reference-agent artifact as one source. Intentional OpenRouter runs can be stored as unpublished `test_runs` / `test_results` and do not set `accepted_test_run_id`. The published baseline has not moved.

---

## 1. The current split

Today CanAIYet has two places that participate in the public evidence story.

### Supabase

Supabase stores the public capability summary, such as:

```text
capability title
status
score
success count
scenario count
failure summary
evidence level
model/provider label
last tested date
```

The public data layer tries Supabase first for published capability summaries.

### Repository evidence

Detailed accepted scenario results currently live in repository evidence artifacts and scenario code.

The capability detail page can read the summary from Supabase while reading the scenario-level result list from the local repository evidence.

So one page can effectively be assembled like this:

```text
TOP OF PAGE
Supabase summary

DETAILS LOWER ON PAGE
Repository evidence file
```

That is the split.

---

## 2. Why the split is a problem

Imagine the filing cabinet says:

```text
Jamie passed the latest exam.
```

But the teacher's notebook on another shelf contains results from an older exam.

If the two are updated at different times, the public page can accidentally combine two different truths.

For an ordinary website this might be annoying.

For CanAIYet it is a trust problem because the product promise is evidence provenance.

Every public number should lead to the exact run that produced it.

---

## 3. The target architecture

The repository should define **how to run the experiment**.

Supabase should store **what happened in accepted experiments**.

Simple distinction:

```text
GITHUB / REPOSITORY
"Here is the exam."

SUPABASE
"Here is the accepted student's completed exam and result."
```

### Repository owns

- scenario definitions;
- fixture-building code;
- fake-company code;
- deterministic judge code;
- provider adapters;
- versioned implementation;
- methodology documentation.

### Supabase owns accepted runtime evidence

- test run identity;
- exact provider/model/configuration;
- git SHA;
- fixture/environment version;
- scenario result rows;
- actual state needed for public evidence;
- failure codes/explanations;
- cost/runtime/token data;
- acceptance status;
- public/published status;
- capability pointer to the accepted run.

---

## 4. The key relationship

Every published capability should point to one accepted run:

```text
Capability
    │
    └── accepted_test_run_id
              │
              ▼
          Test Run
              │
              ├── Result: Scenario A
              ├── Result: Scenario B
              ├── Result: Scenario C
              └── ...
```

The score at the top of the page should be computed from / validated against that same accepted run.

The scenario list lower on the page should come from that same accepted run.

The failures should come from that same accepted run.

The model label should come from that same accepted run.

One run. One chain of evidence.

---

## 5. What should happen to repository evidence JSON

Repository evidence files can remain useful as:

- immutable exported snapshots;
- review receipts;
- development fixtures;
- disaster-recovery / reproducibility artifacts;
- human-readable history committed alongside code.

But they should not be a competing live public source of truth.

The production page should not silently combine a Supabase summary with local run details from a different artifact.

---

## 6. Proposed publication flow

```text
1. Freeze scenario + fixture version
2. Select exact model/configuration
3. Run test
4. Persist test_run
5. Persist each test_result
6. Review suspicious failures/results
7. Independent reviewer accepts or rejects run
8. Mark accepted run appropriately
9. Set capability.accepted_test_run_id
10. Derive/update public capability summary
11. Public page reads summary + detailed evidence from that accepted run
12. Optional: export an immutable evidence snapshot to the repository
```

The direction should be:

```text
accepted run → public summary
```

not:

```text
hand-maintained summary ↔ separate evidence file
```

---

## 7. What this fixes

After this change a visitor can ask:

> Where did this score come from?

And the answer is a single chain:

```text
public capability
→ accepted run
→ exact model/configuration
→ exact scenario results
→ exact fixture/code version
```

That is the trust architecture CanAIYet needs.

---

## 8. Why this matters even more for multiple models

Once several models are tested, the split becomes dangerous very quickly.

We may eventually have:

```text
CAP-005
  ├── OpenAI run
  ├── Anthropic run
  ├── Google run
  └── future run
```

Each run must remain separate and reproducible.

The capability can choose an accepted/current configuration for its headline, but it must never mix scenario results from one model with the score from another.

---

## 9. Five-year-old explanation

Right now we have the report-card summary in one cabinet and some of the teacher's detailed notes in another cabinet.

That worked while we were building the school.

Before real students start taking important exams, we want the report card and every marked answer to belong to the same saved exam.

Then nobody has to guess which notes created which grade.

---

## 10. Repeated trials must not overwrite one another

A later attempt at the same scenario is a new trial. It is not an update to the earlier row.

Store each trial beside the others. A result row, or the JSON kept inside it until a later schema change, needs:

- scenario ID;
- repeat index and a trial ID that includes the git SHA, model, provider, and scenario;
- outcome: pass, fail, or invalid;
- failure mode, such as `TOOL_LOOP`, `NO_PROGRESS`, or `TURN_BUDGET`, when a scored stop ended the attempt;
- provenance: model, provider/route, generation IDs, fixture, environment, git SHA;
- input tokens, output tokens, cache read/write tokens when the gateway returns them, cost, runtime;
- tool trace;
- validity state, so an HTTP 402 stop cannot be stored as a finished model score.

Do not replace a pass with a later fail, or a fail with a later pass. Public percentages wait until the repeat count supports a rate. Until then, the honest report is a count such as `1/2`.

An explicit scenario subset is a labeled segment. It is not a full capability score, and it must not be stitched to a segment from a different git SHA or config. Accepted evidence still requires one clean full run. This note does not add a production migration. New OpenRouter artifacts already carry the trial fields so a later store does not have to invent them.

The first full valid real-model file is `docs/reviews/runs/CAP-001-openrouter-2026-09-11T06-51-59-982Z.json`, from head `d7504c0`. Treat that JSON as immutable review evidence. Do not regenerate it to improve a score. A later judge or fixture change must be a new version, not an edit that rewrites this result. GitHub is the reproducibility trail. Supabase is the public chain only after `accepted_test_run_id` is set on purpose. That field was not set for this run.
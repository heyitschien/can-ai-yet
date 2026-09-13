# CAP-001 racetrack trace (human-readable)

**Status:** Review aid for CAY-20260913-03. Not build authority.

For each evaluated scenario, reviewers should be able to follow:

```text
scenario input
  → model/config identity
  → assistant tool call
  → tool result
  → authoritative world mutation
  → final state snapshot
  → judge assertions
  → verdict
```

No chain-of-thought is stored.

## Where to look

| Step | Location |
| --- | --- |
| Scenario input | `evals/capabilities/lead-followup/scenarios.ts` (`instruction` + `payload`) — frozen v1 |
| Construct class | `evals/certification/cap-001-v1-matrix.ts` |
| Public-contract oracle path | `evals/oracles/cap-001-public-oracle.ts` (`toolTrace`) |
| Historical model tool traces | Raw run JSON under `docs/reviews/runs/` / published Sonnet finding |
| Judge assertions | `expected` / `forbidden` on the scenario + `evals/judges/judge.ts` |
| Per-run validation | `evals/validation/run-validation.ts` |
| Manifest / comparability | `evals/manifest/experiment-manifest.ts` |

## Oracle example

`runPublicOracle("LEAD-005")` returns ordered `toolTrace` entries with tool name, args, and ok/error. Pair with `judgeScenario(world, expected, forbidden)` for the verdict.

This is the instrument certification racetrack, not a UI replacement for the public capability report.

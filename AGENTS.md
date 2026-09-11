<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CanAIYet project operating rules

Before material work, use `docs/AGENT_SYSTEM_INDEX.md` as the map, then read in this order:

1. `canonical-build-doc.md` as BUILD AUTHORITY. Do not silently change it.
2. `docs/COMMUNICATION_PROTOCOL.md` — how work is handed off and accepted.
3. `docs/FOUR_AGENT_SYSTEM.md` — who does what. Logical lab roles are Scout, Test Runner, Judge, and Publisher. Current engines and the human owner are assigned there, not here.
4. `docs/NEXT_MISSIONS.md` for current execution priorities.
5. GitHub Issue **#1 — Agent Communication Channel — CanAIYet Mission Control** for the live work order. Issue comments do not outrank the documents above.

`docs/ORIGIN_AND_DECISION_TRAIL.md` and `docs/EXPLAINED_LIKE_IM_FIVE.md` explain why the product exists. They are not build authority.

Use receipt IDs in the form `CAY-YYYYMMDD-NN`. Post ACKs, handoffs, evidence, blockers, and review verdicts on Issue #1.

Do not fabricate benchmark evidence, relabel reference-agent results as frontier-model results, weaken fixtures to improve scores, or run uncontrolled paid-model loops.

Builder STOP after a bounded mission reaches `READY_FOR_REVIEW`; acceptance must be explicit in Issue #1.
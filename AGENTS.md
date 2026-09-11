<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CanAIYet project operating rules

Before material work:

1. Read `canonical-build-doc.md` as BUILD AUTHORITY.
2. Read `docs/COMMUNICATION_PROTOCOL.md`.
3. Read `docs/NEXT_MISSIONS.md` for current execution priorities.
4. Use GitHub Issue **#1 — Agent Communication Channel — CanAIYet Mission Control** for ACKs, work orders, handoffs, evidence, blockers, and review verdicts.
5. Use receipt IDs in the form `CAY-YYYYMMDD-NN`.

Do not fabricate benchmark evidence, relabel reference-agent results as frontier-model results, weaken fixtures to improve scores, or run uncontrolled paid-model loops.

Builder STOP after a bounded mission reaches `READY_FOR_REVIEW`; acceptance must be explicit in Issue #1.
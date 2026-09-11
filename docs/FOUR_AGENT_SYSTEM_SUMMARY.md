# Four-Agent System — Quick Summary

CanAIYet uses four logical agent roles, not four unrelated autonomous systems.

- **Grok = Scout / Eyes.** Finds relevant model, tool, benchmark, and research changes.
- **Cursor Builder = Hands.** Changes the repository and runs bounded tests.
- **Fresh Cursor Reviewer = Independent Judge.** Verifies the exact result without trusting the builder's summary.
- **ChatGPT/Solace = Coordinator / Publisher.** Turns human intent into work orders, keeps the evidence/communication loop coherent, and prepares only evidence-backed updates.

**Chiến remains the human owner and final authority** for purpose, meaningful spend, destructive changes, and consequential publication decisions.

The important design rule is: **roles stay stable; the specific model/vendor can change when a better one appears.** GitHub Issue #1, commits/PRs, canonical docs, and Supabase accepted evidence form the shared memory.

This page is a refresher only. If it disagrees with `docs/FOUR_AGENT_SYSTEM.md` or `docs/AGENT_SYSTEM_INDEX.md`, those documents win.

See `docs/FOUR_AGENT_SYSTEM.md` for the full contracts, handoffs, separation-of-duties rules, and current MVP configuration.
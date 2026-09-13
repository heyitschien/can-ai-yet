# CanAIYet + HubSpot — What We Are Building, Why It Exists, and How the Reality-Transfer Test Works

**Purpose:** durable project explainer for humans, Cursor sessions, reviewers, and collaborators.  
**Status:** explanation only — not build authority.  
**Canonical Linear copy:** [CanAIYet + HubSpot explainer](https://linear.app/heyitschien/document/canaiyet-hubspot-what-we-are-building-why-it-exists-and-how-the-9ac3baf5af57)  
**Design detail:** `HUBSPOT_TRANSFER_DESIGN_2026-09-13.md`  
**Pre-registration (do not edit):** `HUBSPOT_TRANSFER_PREDICTION_2026-09-11.md`

---

## 1. The simple idea

CanAIYet asks:

> **Can AI do this yet? We test it so you do not have to guess.**

The useful unit is the **configured AI system**: model, tools, permissions, policy, environment, observable actions, authoritative state, deterministic verification, and provenance.

---

## 2. Five-year-old version

We built a driving school with **12 little roads** (business situations). Claude drove them; GPT-5.5 drove them. Before blaming the car, we have to prove the road is fair. Certify the racetrack, then compare cars, then move the **same business exam** into HubSpot.

---

## 3. Operating system

Logical roles: Scout, Builder/Test Runner (currently Cursor), Independent Reviewer/Judge, Coordinator/Publisher, Human owner. Builder cannot self-accept.

Flow: `WORK ORDER → ACK/PLAN → BUILD → READY_FOR_REVIEW → INDEPENDENT_REVIEW → ACCEPTED`

Evidence: `APPROVED RUN → DETERMINISTIC JUDGE → INDEPENDENT REVIEW → ACCEPTED EVIDENCE → PUBLISH CANDIDATE`

Science split for comparable experiments:

- **CapabilityContractManifest** — invariant business exam (portable semantics, tools meanings, policy, predicates) that must match across synthetic and HubSpot
- **EnvironmentManifest / LabManifest** — environment mechanics (synthetic World vs HubSpot adapter, seed/reset, API version, accepted env head)
- **RunConfig** — model, provider, route, permissions (the car)
- **RunReceipt** — served model, IDs, tokens, cost, traces, results

Gates:

- Same capability + same environment + different car = **model-comparable**
- Same capability + different environment + same car = **transfer-comparable**
- Different capability contract = **incomparable** for transfer

---

## 4. Synthetic lab vs HubSpot

**Today:** `AI → CanAIYet tools → synthetic World → deterministic Judge`

**Transfer:** `AI → same tools → HubSpot adapter → HubSpot API → CRM state → snapshot → same business predicates → Judge`

Credentials stay server-side. The model never receives HubSpot secrets. First transfer keeps the CanAIYet tool contract; HubSpot-native MCP is a later experiment (would change two variables at once).

---

## 5. Auth & commissioning (Sep 2026)

Prefer:

`developer test account → least-authority Service Key → pinned date-based API version (e.g. 2026-09) → no-model CRUD/preflight → seed/reset/snapshot → then same-model synthetic vs HubSpot`

OAuth/project apps later for multi-account installs, webhooks, or Marketplace. Legacy private-app creation is being sunset — do not default to old private-app tutorials.

Commissioning answers first: **Can CanAIYet safely control and observe a real HubSpot test environment?** Only then introduce the AI.

---

## 6. Permission envelopes & judging

- **Envelope A:** read/write CRM notes/tasks/deals/escalations; no live customer email send.
- **Envelope B:** controlled sends to owned test inboxes after A works.

Judge HubSpot via projected authoritative state (`HubSpotWorldSnapshot`), not LLM-as-judge. Failures classify as `MODEL_FAILURE` / `INTEGRATION_FAILURE` / `PERMISSION_FAILURE` / `RUNTIME/API_FAILURE`.

---

## 7. Why this matters

Higher-information question than a leaderboard:

> Can a controlled capability test transfer into real enterprise software and still produce useful, inspectable evidence?

If yes: portable packs may climb `synthetic → HubSpot → other CRM → customer staging`. If no: that falsifies or narrows the thesis — equally valuable.

---

## 8. Target sequence (compressed)

1. Certify CAP-001 instrument + CapabilityContract / EnvironmentManifest discipline  
2. Preserve v1 history; freeze portable contract v2  
3. Commission HubSpot (no model) → seed/reset/snapshot  
4. Same model/config: synthetic vs HubSpot  
5. Decide CONTINUE / NARROW / PIVOT / STOP  

North star: evidence for whether **this configured system** can safely do **this job** in **this environment** under **these permissions** — and what breaks.

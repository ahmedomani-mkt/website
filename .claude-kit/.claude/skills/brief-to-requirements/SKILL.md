---
name: brief-to-requirements
description: Turn a user's idea or change request into numbered requirements, a protected list and acceptance checks before any code. Use at the start of a new app/site or any multi-point request ("I want to change several things…").
---
# Brief → requirements

Why: the user writes structured briefs (problem / required / forbidden) and judges results by visible outcome. Work backwards from that format. (docs/corrections-log #23, #24)

1. **Restate** each point in one line, as a *visible* outcome. Keep the user's own words for names of sections.
2. **Classify** each point: Fix (bug), Refinement (polish), Redesign (new direction), Question (feasibility). Redesign needs `design-direction` first; Fix/Refinement must not turn into redesign.
3. **Write the protected list**: what must not change (named sections, data/backend, auth, tracking, IDs, integrations). If the user didn't give one, propose it and ask once.
4. **Write acceptance checks** per point: which viewport(s), which screenshot, which measurable condition (e.g. "all cards identical size", "CTA fully visible at 390px", "no horizontal overflow").
5. **Feasibility questions** ("ينفع نعمل X؟"): answer *possible / not possible / possible with limits*, say what you'd need from the user, and don't build until they say go. Never promise a platform capability you haven't checked (e.g. a "live" feed).
6. **Ask only what blocks you**: merge/deploy policy, missing assets, ambiguous conflicts with earlier instructions. Otherwise pick the conventional default and say so.
7. Output: a short numbered list in Arabic for the user to approve, then start.

Don't: invent requirements, add scope "while I'm here", or re-open decisions the user already made.

---
name: fix-and-verify
description: Debug a visual or behavioural bug by proving the root cause first, fixing it, then verifying with measurement and real interaction. Use for any "X is broken/overlapping/not showing/still the same" report.
---
# Fix and verify

Order is fixed: **INSPECT → ROOT CAUSE → FIX → TEST → VERIFY VISUALLY → REPORT.** The user explicitly forbade jumping to CSS edits and told you not to trust the suggested cause (corrections-log #7).

1. **Reproduce** at the reported viewport with real scrolling. A report like "still the same" means your last fix didn't work: reproduce again before touching code.
2. **Instrument**: log bounding boxes, computed styles, observer events, network/image `naturalWidth`, console errors. Prefer measuring to reading code.
3. **State the cause with its proof** ("observer watched a clipped element: ratio 0 until …"). If you can't prove it, write "hypothesis".
4. **Fix the cause**, not the symptom. If the same defect class has recurred (cards, clipping), fix the *system* (one dimension system, reserved slots) instead of this instance.
5. **Test**: the original repro, adjacent states (other viewport, empty data, long text), and one regression check of a protected area.
6. **Verify on the right target**: local first, then live after deploy (`ship-and-verify`).
7. **Prevent**: add the rule/checklist item/detector that would have caught it (e.g. clipped-text detector).
8. Log in `docs/templates.md` BUG format when non-trivial.

## Causes proven in the source project (use as a hint list, not a diagnosis)
IntersectionObserver on a clip-path'd element · lazy-load inside a hidden section · multiple aspect-ratio systems · pinned/sticky hero overlapping the nav on phones · `background-clip:text` cutting hamza · two variables sharing a name producing screen-wide smoke · missing conversion event on the landing page.

## Report
Cause · files · how tested (viewports) · result · what is still unverified.

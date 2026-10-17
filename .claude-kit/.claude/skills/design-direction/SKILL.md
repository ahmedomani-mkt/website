---
name: design-direction
description: Choose and lock a visual direction for a site/app. Use when starting a design, or when the user says the result looks generic/"not good enough" or they feel constrained. Produces concrete mockups, lets the user pick, then a palette, then tokens.
---
# Design direction

Evidence: user said the result felt generic/constrained (L2220); 3 real mockups + 2 palette mockups led to an immediate choice and a design the user kept (corrections-log #10). One project, two successful uses → medium-high confidence for *process*, low for any specific style.

## Process
1. **Gather references honestly.** Only cite sites/ideas you actually looked at in this session. If browsing isn't possible, say so and work from the brief.
2. **Make 3 directions that differ in structure, not just colour** (layout, type, motion idea). Build them as real HTML pages with the project's real content (not lorem), saved as files; show screenshots or a published page.
3. **User picks one** (or says what to mix). Don't pick for them.
4. **Palette round:** 2 palettes for the chosen direction, shown on the same page. User picks; colours are decided after seeing them, never from words alone (the orange → red/green change).
5. **Lock tokens** (colours, fonts, spacing, radius, motion rules) in one stylesheet loaded last so every page inherits it.
6. Write a short `DESIGN-SYSTEM.md` in the project: tokens, components, "never do" list for this direction.

## Quality bar (from user feedback)
- Compared against professional sites, not against "works".
- No decorative element without a job; elements added as a bundle are individually removable.
- Mood is set by the chosen direction: *restrained* and *playful* directions have different rules. Follow the chosen one; don't blend (docs/recurring-patterns.md, conflicts 2–3).
- Colour never carries meaning alone; neon/accent only where the direction says.

## Don't
Reuse the previous project's palette by default; claim a tool (Canva etc.) was used when it wasn't connected; ship a direction the user hasn't seen.

---
paths:
  - "**/*.css"
  - "**/*.html"
---
# Visual consistency rules
Evidence: corrections-log #1, #2, #17, #19 (repeated user complaints).

- Repeated components use **one** aspect-ratio/grid system. Two systems for the same component type is a defect.
- Every slot exists even when data is missing (e.g. title row reserved) so heights match.
- When a user-visible inconsistency returns after a patch, rebuild the component rather than patching again.
- Use an existing, user-approved component size as the reference for new ones.
- Customer assets (logos) sit on a background that guarantees contrast; do not recolor them to fit the theme unless asked.
- Headers, footers and menus: one source, identical on every page. Diff them after edits.
- Heading alignment matches the grid beneath it.
- Any decorative motif added as part of a bundle must be removable on its own.
- Mobile hero: normal document flow (no pin/parallax) unless there is a tested reason.

---
paths:
  - "**/*.css"
  - "**/*.html"
  - "**/*.js"
---
# Arabic / RTL UI rules
**Applies only to Arabic/RTL projects** (`lang="ar"` or `dir="rtl"` present, or the user says so). In any other project, ignore this file.

Evidence: corrections-log #5 (user report + code), #6 (found in review, verified in code). The kashida and `direction:ltr` lines come from session observations, not user statements: confidence medium.

- Set `<html lang="ar" dir="rtl">`. Latin mono/code snippets inside RTL get `direction:ltr`.
- **No `letter-spacing` on any element that can contain Arabic** (it breaks letter joining). Use it only on Latin labels. Headings: `letter-spacing:0`.
- Gradient text (`background-clip:text`): give the inline element vertical padding (≈ `.32em 0 .06em`); otherwise hamza/diacritics are cut.
- A container with `overflow:hidden` around headline text needs vertical room (e.g. `padding-block:.36em; margin-block:-.36em`). After adding it, run the clipped-text check.
- Don't type kashida (ـــ) inside content strings; strip it when rendering CMS text.
- Mixed numerals/Latin: check bidi order visually on mobile.

---
name: ui-build
description: Implement pages/components from an approved direction, and sweep every surface afterwards. Use for building or restyling UI (public pages, admin panel, menus, cards).
---
# UI build

Read first: `.claude/rules/rtl-arabic.md`, `visual-consistency.md`, the project's `DESIGN-SYSTEM.md`.

## Build
1. Inspect current code and data shape before editing. Use real data (e.g. the live CMS) for layout decisions; remove any temporary mock data and say so.
2. Put design tokens in one shared stylesheet; page CSS uses tokens, not literals. A theme file loaded after page CSS can re-skin pages without touching each one (worked in the source project).
3. Components: fixed slots, one dimension system, states for hover/focus/active/disabled, touch equivalents of hover (tap/focus) — hover-only interaction is a defect on mobile.
4. Motion: only where it has a job; respect `prefers-reduced-motion`; no scroll hijacking; wheel and touch stay natural.
5. Optional sound/animation features: visible mute control that persists; browsers block autoplay audio before a gesture, so start on first gesture and tell the user.
6. Shared pieces (nav/footer/menu) from one source; if you must duplicate, script the edit and diff all copies.

## Surface sweep (do before saying done)
List every surface: public pages, sub-pages, product/detail, CMS-driven pages, 404, admin (login + each tab), mobile menu, modals/drawers, forms. Apply the direction to each or ask which to skip. The user asked for the catalog and the admin separately after a redesign (corrections-log #16) — assume they expect it done once.

## Admin/CMS surfaces
Dashboards show numbers *with a period filter and exact timestamps*; settings are grouped by what they control (appearance, catalog banners, tracking…), not one long page. Don't change schema/RLS/auth unless the task requires it, and say when you did.

## Verify
Run `skills/visual-qa`. Don't finish without screenshots you've looked at.

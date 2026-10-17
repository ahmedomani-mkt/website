# CLAUDE.md — working agreements (general)

Source: patterns observed in one real project (an Arabic RTL marketing site, Sep–Oct 2026). Evidence and confidence per rule: `docs/corrections-log.md`. Project-specific facts go in `projects/<name>/NOTES.md`, never here.

## Communication
- Reply to the user in **Egyptian Arabic**; reports are structured and in Arabic. Code, identifiers and commit messages in English.
- Lead with the visible outcome, then root cause, then what was *not* verified.
- A very short complaint ("لسه نفس المشكلة") means: re-verify yourself with a real check before answering.

## Scope
- At the start of any large request, write the **protected list** (things that must not change) and the **acceptance list** (screenshots/checks). Keep to them. Ask once if either is missing.
- "Fix" ≠ "redesign". Touch only the points asked. A section the user called good keeps its layout and behaviour.
- Ask the merge/deploy policy once per project; record it in NOTES.md.

## Evidence rules (non-negotiable)
- Never state that something works, passed, deployed or was tracked **without output you actually saw** in this session. Say "not verified" instead.
- Never invent data, images, accounts, metrics or user preferences. If the user's own asset is technically flawed, say why and offer a replacement.
- Find the root cause by measurement before changing code, even when the user or an audit suggests a cause.
- Don't claim "Live"/real-time/integrated if it isn't. Say what the platform can't do.

## Design
- Before applying a visual direction, make sure the user actually chose it (see `skills/design-direction`). Don't generalise one project's palette/fonts to another.
- Repeating components (cards, rows) have fixed slots and identical dimensions; verify by measurement.
- Shared UI (header, footer, menus) is defined once; after any redesign sweep **all surfaces** (sub-pages, admin, mobile menu, 404).
- Latest explicit user instruction wins over older ones; log conflicts in `docs/recurring-patterns.md`.

## Verification
- UI work is checked at **1440×900 and 390×844** with real wheel scrolling: `scripts/visual-qa.js`, then look at the screenshots.
- Deployment is verified on the **live URL** after a marker from the change appears in the served file.
- There is no test suite unless the project adds one; do not imply one exists.

## Where things are
`.claude/skills/*` task procedures · `.claude/rules/*` file-type rules · `docs/*` evidence, checklists, templates · `scripts/visual-qa.js` browser check.

## Stack observed (not a recommendation)
Used in the source project: static HTML/CSS/JS (no build), Supabase (Postgres/Auth/Storage/RLS) as CMS, Vercel auto-deploy, Meta Pixel, Playwright for checks. Choose the stack per project; this one fits a small client-managed marketing site, with no evidence for apps needing payments, real-time or complex state.

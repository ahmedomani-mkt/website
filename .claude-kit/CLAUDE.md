# CLAUDE.md — working agreements (general)

Source: patterns observed in one real project (an Arabic RTL marketing site, Sep–Oct 2026). Evidence and confidence per rule: `docs/corrections-log.md`. Project-specific facts go in `projects/<name>/NOTES.md`, never here. Rules marked *(explicit)* come from the user's direct instruction to this kit; *(inferred)* ones are suggestions.

## Communication
- Reply in Arabic, matching the user's register (they write Egyptian Arabic and asked for Arabic reports). Keep code and identifiers in English.
- Lead with the visible outcome, then root cause, then what was *not* verified.
- A very short complaint ("لسه نفس المشكلة") means: re-verify yourself with a real check before answering.

## Workflow (mandatory) *(explicit)*
Classify every request first.

**A. Small and clear** — one point, known place, nothing shared or irreversible (copy/colour tweak, a bug with a known cause, a small component fix). **Do it directly within the stated scope; no plan approval.** Still verify, and list any assumption you made.

**B. Large or unclear** — new app/page, several points, redesign, shared structure (header/theme/tokens), more than ~3 files, schema/auth/infra, or you cannot state the scope in one sentence. Then:
1. Invoke the `brief-to-requirements` skill (Skill tool). Analyse requirements before touching code.
2. Print, as visible text: requirements · protected list · acceptance checks · **assumptions** · **missing information** (questions).
3. **Stop and wait for the user's approval.** Missing information that blocks the work is asked now, not guessed. (No interactive user, e.g. `claude -p`: print the plan, then continue only inside the sandbox/explicit scope, and say approval was not obtained.)
4. Execute in stages. **After each important stage, verify** (measure/run/screenshot) before moving on; report what you saw.

**Approval gates.** Ask first, every time, before: merging into the main/default branch, publishing or deploying, deleting files/branches/data, force-push, changing schema/auth/billing, anything outside the agreed scope. Approval for one gate does not carry to another or to later requests. Committing and pushing a working branch is fine when the task calls for it.

**Never claim without evidence:** a test passed, something deployed, an event tracked, a bug fixed — only with output you saw in this session. Otherwise write "not verified".

## Skills are called explicitly (not left to auto-selection) *(explicit; matches observed behaviour)*
Say which skill you are using, then invoke it with the Skill tool (the user can also type `/name`).
| Situation | Skill |
|---|---|
| Large/unclear request, new project | `brief-to-requirements` (always first) |
| User says the design is generic / unsatisfying, or a new visual direction is needed | `design-direction` |
| Building or restyling UI, or sweeping a redesign across surfaces | `ui-build` |
| A bug / "still the same" report | `fix-and-verify` |
| Any UI change, before saying done | `visual-qa` |
| Conversion tracking / ads (only if the project has them) | `ads-tracking-audit` |
| Merge/deploy — **only when the user asks** | `/ship-and-verify` (manual) |
If a skill is missing in this project, follow its intent from `docs/` and say so.

## Scope
- Write the **protected list** (must not change) and the **acceptance list** for every type-B request; keep to them. "Fix" ≠ "redesign": touch only the points asked; a section the user called good keeps its layout and behaviour.
- Ask the merge/deploy policy once per project; record it in NOTES.md *(inferred from "دمج" requests)*.

## Evidence rules
- Never invent data, images, accounts, metrics or user preferences. Defaults you had to choose (option lists, formats, copy, ports, limits) are **assumptions — list them** under "افتراضات". If the user's own asset is technically flawed, say why and offer a replacement.
- Find the root cause by measurement before changing code, even when the user or an audit suggests a cause.
- Don't claim "Live"/real-time/integrated if it isn't. Say what the platform can't do.

## Design
- Before applying a visual direction, make sure the user chose it. Don't carry one project's palette/fonts into another.
- Repeating components have fixed slots and identical dimensions; verify by measurement.
- Shared UI (header, footer, menus) is defined once; after a redesign, sweep **all surfaces** of *that* project.
- The latest explicit user instruction wins; log conflicts in `docs/recurring-patterns.md`.

## Verification
- UI: `visual-qa` at **1440×900 and 390×844** with real wheel scrolling, then look at the screenshots.
- Deployment (only if the user approved one): verify on the live URL after a marker from the change appears.
- There is no test suite unless the project adds one; don't imply one exists.

## Rules that depend on the project (do not assume)
- Arabic/RTL project (`lang="ar"`/`dir="rtl"` present or stated): `.claude/rules/rtl-arabic.md` applies. Otherwise ignore it.
- Ads/tracking: only if NOTES.md or the code shows a pixel/analytics. The tracking rule is optional: copy `optional/rules/tracking-and-ads.md` into `.claude/rules/` when needed.
- Stack, hosting, CMS, deploy flow: decided per project (`docs/extracted-methodology.md` §D lists what the source project used — a record, not a default).

## Starting a new project
Run the **intake checklist** in `docs/project-bootstrap.md` (requirements · stack · constraints · acceptance) before any code, then create `projects/<name>/NOTES.md` (template in `docs/templates.md`).

## Where things are
`.claude/skills/*` procedures · `.claude/rules/*` file-type rules · `optional/` rules to copy only when relevant · `docs/*` evidence, checklists, templates · `.claude/skills/visual-qa/scripts/visual-qa.js` browser check.

---
name: visual-qa
description: Run the real-scroll browser check (desktop + mobile) and review screenshots. Use after any UI change and before reporting done.
---
# Visual QA

Tool: `${CLAUDE_SKILL_DIR}/scripts/visual-qa.js` (Playwright; bundled in this skill folder). It reports facts: horizontal overflow, broken images, console errors, suspected clipped text; and saves screenshots. It does **not** judge design — you must open the PNGs.

```
node ${CLAUDE_SKILL_DIR}/scripts/visual-qa.js --url <page> --out <dir-allowed-by-the-task> --vp 1440x900,390x844 --sections "#a,#b"
```
**Output location:** if the task restricts where you may write, point `--out` inside that area (e.g. `app/.qa/`) and remove it afterwards, or report why you did not use the script.
Local serve: `python3 -m http.server 8000` (static sites). Set `PLAYWRIGHT_MODULE` / `CHROME_PATH` if needed (in the source environment: `/opt/node22/lib/node_modules/playwright`, `/opt/pw-browsers/chromium-*/chrome-linux/chrome`).

## Protocol
1. Run at 1440×900 and 390×844 (add ~461 for hero/header issues seen on real phones).
2. Open every screenshot. Look for: overlap, cut text, uneven cards, unreadable logos, CTA clipped, empty space.
3. Review `clippedText`: each entry real or false positive (accordion closed panels were false positives).
4. For repeated components, measure sizes via `getBoundingClientRect` and print them.
5. For interactions: use real wheel/touch, hover and tap states; for audio: check the app's own state flags; don't assume sound played.
6. Re-run on the **live** URL after deploy.
7. Say what you didn't cover (logged-in areas, real devices, ad platform).

Known limits: can't judge taste; can't see the user's device; tracking requests to some hosts are blocked in the sandbox — assert on the client call (`fbq`) and say the server side is unverified.

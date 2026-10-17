---
name: ship-and-verify
description: Commit, push, merge per the project's policy, wait for the deploy, and verify the live site. Use only when the user asks to ship/merge/deploy.
disable-model-invocation: true
---
# Ship and verify

1. **Policy first** (ask once, save in NOTES.md). Example from the source project (do not assume it): develop on a feature branch → merge fast-forward to `main` → Vercel auto-deploys; the user typed "دمج" each time to request a merge.
2. `git status`/`git diff --stat`: confirm only intended files changed, protected areas untouched.
3. Commit with a descriptive message. Push the branch (retry network failures with backoff). **Merge/push `main` only after the user explicitly approves this merge** (CLAUDE.md approval gate; a standing policy in NOTES.md is not enough unless it says so in words). Without approval: commit, push the branch, report, and ask. Never force-push.
4. **Wait for the deploy by marker**: poll the live URL (cache-busted) for a unique string from your change; time-limit the loop. Don't assume.
5. **Verify live**: for any user-visible change run `visual-qa` on the live URL, check console errors, spot-check a protected area. Skipping any of these is allowed only if you say so and why in the report (a marker found in the served file proves delivery, not appearance).
6. Report in Arabic: commit hash, what is live, what you could not verify. If the deploy marker never appeared, say so — don't report success.

Environment notes seen in the source project (may not apply): a stop hook reminds you to commit and push uncommitted work; the Supabase connector in the sandbox could be tied to a different account than the project's DB, so don't claim DB checks you couldn't make.

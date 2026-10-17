---
name: ship-and-verify
description: Commit, push, merge per the project's policy, wait for the deploy, and verify the live site. Use only when the user asks to ship/merge/deploy.
disable-model-invocation: true
---
# Ship and verify

1. **Policy first** (ask once, save in NOTES.md). Source project: develop on a feature branch → merge fast-forward to `main` → Vercel auto-deploys; the user said "دمج" to request merging, and later accepted automatic merges.
2. `git status`/`git diff --stat`: confirm only intended files changed, protected areas untouched.
3. Commit with a descriptive message. Push the branch (retry network failures with backoff). Merge/push `main` only if policy says so. Never force-push.
4. **Wait for the deploy by marker**: poll the live URL (cache-busted) for a unique string from your change; time-limit the loop. Don't assume.
5. **Verify live**: `skills/visual-qa` on the live URL; check console errors; spot-check a protected area.
6. Report in Arabic: commit hash, what is live, what you could not verify. If the deploy marker never appeared, say so — don't report success.

Environment notes seen in the source project: a stop hook reminds you to commit and push uncommitted work; the Supabase connector in the sandbox could be tied to a different account than the project's DB, so don't claim DB checks you couldn't make.

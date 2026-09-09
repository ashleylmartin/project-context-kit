---
"project-context-kit": minor
---

Harden the git-sync path based on current cross-session/cross-machine
agent memory best practices: `wrap-up` now fetches before asking to push
and retries once via rebase on a rejected push, shows the actual content
diff of the memory file/canonical docs (not just commit subjects) before
push confirmation as a defense against memory-poisoning-style content,
and writes an advisory (never blocking) same-machine concurrency lock that
`session-start` and `doctor` also check. Also documents an opt-in
`SessionStart` hook (`references/session-start-hook.md`) that automates
the git-pull/cache-sync mechanics before a session starts.

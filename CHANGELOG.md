# project-context-kit

## 0.2.0

### Minor Changes

- [`2693436`](https://github.com/ashleylmartin/project-context-kit/commit/2693436b64545156945311c324d710a1bd64f3a7) - Harden the git-sync path based on current cross-session/cross-machine
  agent memory best practices: `wrap-up` now fetches before asking to push
  and retries once via rebase on a rejected push, shows the actual content
  diff of the memory file/canonical docs (not just commit subjects) before
  push confirmation as a defense against memory-poisoning-style content,
  and writes an advisory (never blocking) same-machine concurrency lock that
  `session-start` and `doctor` also check. Also documents an opt-in
  `SessionStart` hook (`references/session-start-hook.md`) that automates
  the git-pull/cache-sync mechanics before a session starts.

## 0.1.1

### Patch Changes

- [`cf848bc`](https://github.com/ashleylmartin/project-context-kit/commit/cf848bcc35f7c40023a135955e5956f54f68031e) - Fix a data-loss bug where `session-start`/`wrap-up`/`doctor`'s local
  runtime memory cache shared a directory with the built-in Cortex Code
  memory tool's per-project topic files, and silently deleted them during
  cache sync. The cache now lives at a path exclusive to
  `project-context-kit`, so there's nothing else nearby to sweep.

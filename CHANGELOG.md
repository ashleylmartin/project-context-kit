# project-context-kit

## 1.1.0

### Minor Changes

- Fix `doctor`'s stale-memory-dir check so it never claims a directory is
  "safe to delete" when it may be the live store for Cortex Code's built-in
  per-project memory tool — now checks recency and always defers to the
  user. Also drop the `budgetKB` (6KB) memory-size ceiling; `budgetLines`
  (80) is now the only memory budget.

## 1.0.0

### Major Changes

- [`6d35731`](https://github.com/ashleylmartin/project-context-kit/commit/6d35731962a67e15595c22ebd0f14db1edfe3569) Thanks [@ashleylmartin](https://github.com/ashleylmartin)! - 1.0: adopt mattpocock-skills' authoring discipline and add two new vocabulary skills.

  - **New `writing-for-agents` skill** — a shared authoring standard (context
    pointers, progressive disclosure, completion-criteria rigor, leading
    words, anti-duplication/anti-sediment pruning) used both by this plugin's
    own maintainers and by anyone writing their own `AGENTS.md`/skills.
  - **New `codebase-design` skill** — deep-module vocabulary (module,
    interface, depth, seam, adapter, leverage, locality) for designing a
    module's shape. Routes any hard trade-off it surfaces into
    `domain-vocabulary`'s ADR-lite decision log rather than keeping its own.
  - **`domain-vocabulary` gains three capabilities**: concrete-scenario
    stress-testing for fuzzy domain relationships, cross-referencing stated
    rules against actual code, and an explicit 3-part test for when an
    ADR-lite entry is warranted (hard to reverse, surprising without
    context, result of a real trade-off — replacing the previous vaguer
    criterion). Also adds optional multi-context support via a root
    `CONTEXT-MAP.md` for large repos with more than one bounded context.
    `design-soul`'s ADR trigger now points at the same 3-part test.
  - **`bootstrap`/`doctor` gain lightweight version-awareness**: `bootstrap`
    now records the installed plugin's version in `config.json`'s new
    `configVersion` field; `doctor` flags a mismatch against the currently
    installed version and points at `CHANGELOG.md` (visibility only — not a
    migration mechanism).
  - **`help` gains a "how the skills fit together" map** covering all 12
    skills.
  - Minor duplication fixes in `doctor` (cross-references `session-start`'s
    lock-file format and plan-directory conventions instead of silently
    re-deriving them).

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

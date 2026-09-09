# project-context-kit — Domain Vocabulary

## Glossary

| Term | Definition | Avoid |
|---|---|---|

## Decisions

### Move local runtime cache off the shared memory-tool directory — 2026-09-09
- **Context:** `session-start`/`wrap-up`/`doctor` wrote their "local runtime
  cache" mirror to the same directory the built-in Cortex Code memory tool
  uses for this project's per-project topic files, then swept that
  directory with `find ... -delete` for anything not named `MEMORY.md` —
  silently destroying legitimate topic files a user had written elsewhere.
- **Decision:** Moved the cache to a path exclusive to `project-context-kit`
  (`$HOME/.snowflake/cortex/project-context-kit/cache/<sanitized-path>.md`,
  a single flat file) and removed the sweep step entirely.
- **Why:** The old design conflated "keep the cache in sync" with "sweep
  cruft from a single-flat-file system," but the directory it swept wasn't
  exclusively this plugin's to sweep. Owning a dedicated path removes the
  collision at the root instead of trying to sweep more carefully.

### Adopt cross-session memory best practices from 2026 research — 2026-09-09
- **Context:** Researched current practice for cross-session/cross-machine
  agent memory (Anthropic's memory tool, Letta/MemGPT, git-backed memory
  projects, memory-poisoning security literature) and compared it against
  this plugin's design.
- **Decision:** Kept the single-flat-file, budget-enforced memory design
  (it already matches or exceeds current practice) but hardened the git
  sync path: `wrap-up` now fetches before asking to push and retries once
  via rebase on a rejected (non-fast-forward) push instead of failing
  silently; the pre-push confirmation now shows the actual content diff of
  the memory file and canonical docs (not just commit subjects); an
  advisory same-machine concurrency lock warns (never blocks) when two
  sessions are open on the same project; and an opt-in `SessionStart` hook
  (`references/session-start-hook.md`) is documented for anyone who wants
  the git-pull/cache-sync mechanics automated before a session starts.
- **Why:** Memory poisoning (OWASP ASI06) is a documented risk for any
  persistent, auto-loaded agent memory — a git-synced file that future
  sessions on any machine read automatically is exactly that. Showing
  content diffs, not just commit lists, before push is a proportionate,
  low-cost mitigation. The concurrency lock and push-retry logic address
  a scenario this plugin didn't previously handle at all: two live
  sessions or two machines touching the same project's memory. Explicitly
  did NOT add a `Stop`/`SessionEnd` hook that auto-commits/pushes —
  those events can't gather confirmation, which conflicts with the
  existing "never push without asking" rule.

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

### Adopt mattpocock-skills' authoring discipline for 1.0 — 2026-09-29
- **Context:** Reviewed mattpocock-skills (a much larger, more mature
  Claude Code skill plugin) end to end to see what project-context-kit
  should adopt for a 1.0. Found the two kits barely overlap — matt's kit
  has no analog to this plugin's memory-budget/session-continuity system
  at all — but our two "active discipline" vocabulary skills
  (`domain-vocabulary`, `design-soul`) map onto his `domain-modeling`/
  `codebase-design`, and he has an explicit authoring standard
  (`writing-for-agents`) this kit had nothing like.
- **Decision:** Shipped `writing-for-agents` as a real skill (used both
  internally and by kit users writing their own docs), added a new
  `codebase-design` skill (architecture vocabulary, no canonical doc of
  its own — routes hard trade-offs to `domain-vocabulary`'s decision
  log), folded domain-modeling's missing techniques into
  `domain-vocabulary` (concrete-scenario stress-testing, code
  cross-referencing, an explicit 3-part ADR test, optional multi-context
  `CONTEXT-MAP.md` support), and added lightweight `configVersion`
  tracking (`bootstrap` writes it, `doctor` flags a mismatch).
- **Why:** Did NOT adopt matt's bucket/staging structure (`in-progress/`,
  `deprecated/`) — this kit is small enough that a flat `skills/`
  directory doesn't need a promotion pipeline. Did NOT build a config
  migration engine for the version-awareness addition — nothing in this
  1.0 release actually breaks `config.json`'s schema (every new
  capability lives in skill body text, read fresh each session, so
  already-bootstrapped projects get it automatically); a real migration
  mechanism should be built when a real breaking change actually happens,
  not speculatively now. Did NOT rename `domain-vocabulary`/`design-soul`
  to match matt's `domain-modeling` naming — no functional benefit for a
  real cost (every `config.json` `kind` value, README row, and
  cross-reference across 5+ files).

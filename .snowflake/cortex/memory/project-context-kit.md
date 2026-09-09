# project-context-kit — project memory

## Session State
- **Session:** 2026-09-09 (s2, end) · `main` · v0.1.1 released and reinstalled; hardened git-sync (fetch-before-push/rebase-retry, memory-diff-before-push, advisory concurrency lock) plus an opt-in SessionStart hook doc, per 2026 cross-session-memory research.

## Gotchas
- The *installed* plugin (`~/.snowflake/cortex/plugins/project-context-kit`) is a separate copy from this dev repo — fixes here need a release + reinstall before other projects see them.
- The repo's release workflow needs "Allow GitHub Actions to create and approve pull requests" enabled in repo settings, and a committed `package-lock.json` — both were previously missing; now fixed.

## Next Session
- Cut a release for this session's git-sync hardening, then reinstall the plugin globally (same flow as last time).

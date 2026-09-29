# project-context-kit — project memory

## Session State
- **Session:** 2026-09-09 (s2, end) · `main` · v0.2.0 released and reinstalled; git-sync hardening (fetch-before-push/rebase-retry, memory-diff-before-push, advisory concurrency lock, opt-in SessionStart hook doc) is live end-to-end.

## Gotchas
- The *installed* plugin (`~/.snowflake/cortex/plugins/project-context-kit`) is a separate copy from this dev repo — fixes here need a release + reinstall before other projects see them.
- The repo's release workflow needs "Allow GitHub Actions to create and approve pull requests" enabled in repo settings, and a committed `package-lock.json` — both were previously missing; now fixed and confirmed working unattended (v0.2.0 released with no manual PR step).

## Next Session
- No open work — pick up the next improvement or bug report when one comes in.

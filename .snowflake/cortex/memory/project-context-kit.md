# project-context-kit — project memory

> If it can be derived from a `canonicalDocs` entry or the codebase, it does
> NOT belong here. Memory stores ephemeral state only.

## Session State
- **Session:** 2026-11-11 · `main` · v1.2.0 released and reinstalled: doctor memory-shape lints + CLAUDE.md shadow check, one-bullet Session State template, consistency fixes (see CONTEXT.md 2026-11-11).

## Gotchas
- The *installed* plugin (`~/.snowflake/cortex/plugins/project-context-kit`) is a separate copy from this dev repo — fixes here need a release + reinstall (`cortex plugin update project-context-kit`) before other projects see them.

## Next Session
- Fix README's "direct-push shortcut": pushing `main` before the tag lets the Release Action create the tag and GitHub Release itself (it did for v1.2.0).


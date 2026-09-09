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

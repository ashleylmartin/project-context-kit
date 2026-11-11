# Shared paths and conventions

The single definition of every machine-local path and shared list the
lifecycle skills use. `session-start`, `wrap-up`, `doctor`, and
`session-start-hook.md` each inline a runnable copy of the snippets they
need (agents need them in front of them); if anything here changes, update
those copies to match.

## Sanitized working directory

```bash
SANITIZED="$(echo "$PWD" | sed 's|^/||;s|/|-|g')"
```

Leading `/` stripped, remaining `/` replaced with `-`.

## Local runtime cache

`$HOME/.snowflake/cortex/project-context-kit/cache/$SANITIZED.md` — a flat
file mirroring `config.json`'s `memoryFile`. Exclusive to this plugin.

## Advisory concurrency lock

`$HOME/.snowflake/cortex/project-context-kit/cache/$SANITIZED.lock`, three
lines: `pid=`, `host=`, `started=` (UTC ISO-8601). Written by
`session-start` Step 1 (around its fetch/pull) and `wrap-up` Step 6 (around
its git sync); each removes only the lock it wrote. A lock is stale when
its host differs from `hostname` or its PID isn't running.

## Old (pre-0.2) cache directory — not ours anymore

`$HOME/.snowflake/cortex/memory/projects/$SANITIZED/` — also the live
store of Cortex Code's built-in per-project memory tool. Never sweep or
delete it; see `doctor` Step 5's migration check.

## Plan-directory conventions

Checked when `planSources` is empty (`session-start` Step 4b, `doctor`
Step 3):

```
.snowflake/cortex/plans specs changes docs/plans
```

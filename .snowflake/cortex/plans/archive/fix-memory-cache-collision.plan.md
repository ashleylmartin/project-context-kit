
# Fix: local-runtime-cache collision with the built-in memory tool

## Root cause

`session-start`, `wrap-up`, and `doctor` all compute a "local runtime cache"
path as:

```
$HOME/.snowflake/cortex/memory/projects/<sanitized-repo-path>/MEMORY.md
```

This is the *exact same directory* Cortex Code's built-in `memory` tool uses
for this project's own per-project topic files (e.g. `deployment.md`,
`architecture.md`). `doctor`'s SKILL.md even documents this collision
explicitly today (Step 4) — but treats it as an accepted design constraint
rather than a bug, and the actual fix-it snippet in `session-start`/`wrap-up`/
`doctor` is:

```bash
find "$(dirname "$LOCAL_MEM")" -maxdepth 1 -type f ! -name "MEMORY.md" -delete
```

This silently deletes every file in that directory that isn't named
`MEMORY.md` — including any topic file the built-in memory tool wrote there
this session or a previous one. This was observed firsthand: running
`wrap-up` on another project deleted a `deployment.md` topic file (Vercel
team, Airtable base IDs, env vars) that had been written minutes earlier via
the `memory` tool, with no warning.

## Fix approach

Stop sharing the directory at all. Give project-context-kit's cache its own
exclusive path — a single flat file, not a directory — so there is nothing
else nearby to ever "sweep":

```
$HOME/.snowflake/cortex/project-context-kit/cache/<sanitized-repo-path>.md
```

(same sanitization rule as today: strip leading `/`, replace remaining `/`
with `-`). Once the cache is a single file at a path only this plugin ever
writes to, the destructive `find ... -delete` step is deleted, not
adjusted — there's nothing else there to sweep by construction.

## Changes

1. **`skills/session-start/SKILL.md` (Step 2)** — replace `LOCAL_MEM`
   computation with the new path; remove the `find ... -delete` sweep line;
   update surrounding prose ("Sweep orphaned topic files..." comment) to
   reflect that this is no longer needed.
2. **`skills/wrap-up/SKILL.md` (Step 1, "Sync the local runtime cache")** —
   same path change, same removal of the sweep line.
3. **`skills/doctor/SKILL.md` (Step 4)** — update the coherency-check path;
   simplify the "fix by reusing session-start's logic" snippet to drop the
   sweep line; rewrite the prose that currently states the shared-file
   collision is intentional — it no longer applies once the path is
   exclusive. Keep the general principle ("canonical git file always wins
   the resync") since that's still correct and unrelated to the bug.
4. **`skills/bootstrap/SKILL.md` (Step 8 template)** — rewrite the "A note
   on the local runtime cache" paragraph seeded into every new project's
   `README.md` so it describes the new exclusive path and drops the "also
   where the built-in memory tool keeps its own notes" line (no longer
   true).
5. **`skills/doctor/SKILL.md` — migration note** — add a short check: if the
   *old*-style path (`$HOME/.snowflake/cortex/memory/projects/<path>/MEMORY.md`)
   still exists, report it as stale/safe-to-delete (project-context-kit no
   longer reads or writes it) rather than silently touching it. This lets
   already-bootstrapped projects clean up without another blind delete.
6. **This repo's own dogfooded instance** — update
   `.snowflake/cortex/memory/README.md` (written during today's bootstrap,
   before this fix) to match the corrected design so it doesn't describe
   the bug we just fixed.
7. **`CONTEXT.md`** — add one ADR-lite decision entry: context (data-loss
   bug discovered), decision (moved cache off the shared directory), why
   (built-in memory tool and this plugin both wrote in the same directory
   with no coordination; the old design conflated cross-machine sync cache
   with the "single flat file" cruft-sweep discipline).
8. **Changeset** — run `npx changeset` to record a patch bump with a short
   summary of the fix, matching this repo's existing changesets-based
   release flow (`.changeset/config.json`, `release.yml`).

## Explicitly out of scope

- No change to the *canonical* git-tracked `memoryFile` sync behavior — only
  the local, non-git-tracked cache path changes.
- No attempt to recover data already lost by past runs elsewhere (e.g.
  Field-Ops-Football-App) — out of reach from this repo, and already
  manually recovered per the user's report.
- No change to `memory-budget.md` or `help/SKILL.md` — their mentions of
  "local runtime cache" are generic enough to remain accurate after the
  path change.

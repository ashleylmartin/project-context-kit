---
name: doctor
description: "Audit an already-bootstrapped project-memory setup for drift: dangling canonicalDocs/ownershipDoc paths, stale planSources, an over-budget memory file, or a local runtime cache that's diverged from the git-tracked canonical file. Reports findings and fixes only with confirmation -- never silently. Triggers: doctor, memory doctor, audit memory, check memory setup, is memory drifted, fix memory drift, validate memory config."
---

# Project Memory — Doctor

Run any time something about this project's memory setup feels off, or
periodically as a health check. Unlike `bootstrap` (one-time, greenfield
only) and `help` (reports config verbatim, never validates it), `doctor` is
the repair/audit command for a project that's already configured.

## When NOT to run this

If `.snowflake/cortex/memory/config.json` doesn't exist, this project hasn't
been bootstrapped yet — redirect to `bootstrap/SKILL.md` instead. There's
nothing to audit without a config.

## Step 0: Load config

```bash
cat .snowflake/cortex/memory/config.json 2>/dev/null
```

## Step 1: Check for dangling paths

For each `canonicalDocs[].path`, `ownershipDoc` (if set), and
`semanticRegistry` (if set), verify the file exists:

```bash
test -f "<path>" && echo "OK: <path>" || echo "MISSING: <path>"
```

A missing canonical doc means memory has nowhere to defer to for that
concern — flag it. A missing `semanticRegistry` file means the opt-in
checker command in `qualityGate` will fail every `wrap-up` until it's
recreated or the entry is removed — flag it the same way. Ask the user
whether to remove the stale entry (and its `qualityGate` command, for
`semanticRegistry`) or recreate the file; don't guess which.

## Step 2: Check for plan-source drift

If `planSources` is **not** empty, skip this check — already configured.

If it **is** empty, this may be intentional (the project genuinely doesn't
track plans as files) or it may be stale (plan-tracking started after
bootstrap and nothing ever revisited the config — this is exactly what
happened on `therm-incentive`). Check common conventions, using `find`
rather than shell glob expansion (zsh errors on an unmatched glob before
the command runs):

```bash
for dir in .snowflake/cortex/plans specs changes docs/plans; do
  n=$(find "$dir" -maxdepth 1 -type f 2>/dev/null | grep -v /archive/ | wc -l | tr -d ' ')
  [ "$n" != "0" ] && echo "$dir: $n file(s)"
done
```

If any directory has files, report it and ask: "Found `<n>` file(s) in
`<dir>` but `planSources` is empty — set it to `["<dir>/*.<ext>"]`?" Only
write to `config.json` on explicit yes — same rule `references/config-schema.md`
already states for this field ("always via explicit user confirmation,
never silently").

## Step 3: Check the memory budget right now

Don't wait for the next `wrap-up` to discover this. Load
`../references/memory-budget.md`, then check both dimensions against
`config.json`'s `memoryFile`:

```bash
wc -l < "<memoryFile>"
wc -c < "<memoryFile>"
```

Compare against `budgetLines` and `budgetKB` (1 KB = 1024 bytes). If over
either, flag it — don't fix it here; that's `wrap-up`'s synthesis job (see
`memory-budget.md`'s Synthesis Trigger). Doctor diagnoses, `wrap-up` treats.

## Step 4: Check local runtime cache coherency

This skill's "local runtime cache" is a single flat file at a path
exclusive to `project-context-kit` —
`$HOME/.snowflake/cortex/project-context-kit/cache/<sanitized-cwd>.md`
(sanitized: leading `/` stripped, remaining `/` replaced with `-`). It is
supposed to be an exact mirror of the git-tracked canonical `memoryFile`,
refreshed by `session-start` Step 2 every session — but nothing stops an
agent from hand-editing it directly in a session where `session-start` was
never invoked. When that happens, the two silently diverge.

```bash
LOCAL_MEM="$HOME/.snowflake/cortex/project-context-kit/cache/$(echo "$PWD" | sed 's|^/||;s|/|-|g').md"
diff "<config.json memoryFile>" "$LOCAL_MEM" 2>/dev/null
```

- No output → coherent, nothing to do.
- Any diff, or `$LOCAL_MEM` missing entirely → report it. Fix by reusing
  `session-start` Step 2's own logic verbatim (copy canonical → cache) —
  don't reimplement it differently here:

  ```bash
  mkdir -p "$(dirname "$LOCAL_MEM")"
  cp "<config.json memoryFile>" "$LOCAL_MEM"
  ```

  The canonical git-tracked file always wins this resync — never write the
  cache's content back into canonical, even if the cache looks more
  "complete." If the cache has content that genuinely belongs in project
  memory, that's a sign the agent that wrote it skipped `session-start` and
  should have written to canonical directly instead; call this out to the
  user rather than silently absorbing it.

### Migration check (projects bootstrapped before this fix)

Before this fix, the local runtime cache lived at
`$HOME/.snowflake/cortex/memory/projects/<sanitized-cwd>/MEMORY.md` — the
same directory the built-in Cortex Code memory tool uses for this project's
own per-project topic files. `session-start`/`wrap-up` used to sweep that
directory with `find ... -delete`, which could silently destroy those
topic files. `project-context-kit` no longer reads or writes that old path
at all. Check whether it still exists:

```bash
OLD_DIR="$HOME/.snowflake/cortex/memory/projects/$(echo "$PWD" | sed 's|^/||;s|/|-|g')"
ls -la "$OLD_DIR" 2>/dev/null
```

If it exists, report its contents to the user and note it's safe to delete
(nothing in this plugin reads it anymore) — but never delete it yourself
without confirmation, since any file that survived past sweeps may still
hold content the user wants to keep.

### Stale concurrency lock check

`session-start`/`wrap-up` write an advisory lock at
`$HOME/.snowflake/cortex/project-context-kit/cache/<sanitized-cwd>.lock`
while a git-sync step is in progress, and remove it on exit. A lock that
survives — usually from a session that crashed or was force-killed mid-sync
— is stale and gives every future `session-start` a false "another session
is active" notice:

```bash
LOCK="$HOME/.snowflake/cortex/project-context-kit/cache/$(echo "$PWD" | sed 's|^/||;s|/|-|g').lock"
if [ -f "$LOCK" ]; then
  PID=$(grep '^pid=' "$LOCK" | cut -d= -f2)
  HOST=$(grep '^host=' "$LOCK" | cut -d= -f2)
  if [ "$HOST" = "$(hostname)" ] && kill -0 "$PID" 2>/dev/null; then
    echo "Lock looks live: PID $PID is still running on this host."
  else
    echo "Lock is stale ($(cat "$LOCK")) — safe to remove: rm \"$LOCK\""
  fi
fi
```

Report a stale lock, offer to remove it — don't delete it silently, since a
"live" verdict could be wrong for a session on a different host sharing the
same synced repo path (rare, but the check is host-scoped for exactly this
reason).

## Step 5: Cross-machine remote status (informational only)

```bash
git remote -v
```

This system's design is git-topology-agnostic — local-only, remote-backed,
or local-now-remote-later all work with zero reconfiguration — so this
check never blocks or fixes anything, it just reports what cross-machine
continuity currently looks like:

- **No remote configured** — memory only survives on this machine right
  now. Report this plainly, don't frame it as a problem: plenty of
  legitimate scratch/local-only projects never need a remote. If the user
  wants cross-machine continuity later, adding a remote (`git remote add
  origin <url>` + `git push -u origin <branch>`) is all that's needed —
  nothing about `config.json` or the memory file itself changes.
- **Remote configured** — report the remote URL and whether `session-start`
  found it in sync last run (that's already covered by Step 1 of
  `session-start`, not re-checked here). This is the normal case for a
  project that expects to be worked on from more than one machine.

## Step 6: Report

```
## Memory Doctor — <projectName>

### Canonical docs
- [OK|MISSING] <path> — <owns>
  (repeat per entry, plus ownershipDoc if set, plus semanticRegistry path if set)

### Plan sources
- <"configured: <globs>" | "empty, no drift detected" | "empty, but found N file(s) in <dir> — suggest enabling">

### Budget
- <memoryFile>: <N> lines / <K> KB (budget: <budgetLines> / <budgetKB>KB) — <OK | OVER, run wrap-up to synthesize>

### Local cache coherency
- <"in sync" | "diverged — resynced from canonical" | "missing — seeded from canonical">

### Cross-machine remote status
- <"no remote configured — memory is local-only on this machine" | "remote: <url>">
```

Then apply only the fixes the user explicitly confirms (dangling-path
removal, `planSources` update). The cache resync (Step 4) and budget report
(Step 3) don't need per-fix confirmation — resyncing the cache from
canonical is always safe (canonical wins, by definition), and the budget
check is read-only until `wrap-up` runs. Step 5's remote status is
purely informational and never triggers a fix — there is nothing to
confirm or apply.

## Stopping Points

- ✋ Step 1: confirm before removing/editing a `canonicalDocs` entry, `ownershipDoc`, or `semanticRegistry` path
- ✋ Step 2: confirm before writing `planSources` to `config.json`

## Output

A findings report plus whichever confirmed fixes were applied. Does not
commit anything itself — surface changed files (if `config.json` was
edited) and let the user run `wrap-up` or commit directly.

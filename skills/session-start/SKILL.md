---
name: session-start
description: "Run at the start of every session in a project that uses the project-memory system. Syncs git, bootstraps the local memory cache on cold-start (new machine), surfaces active plans, flags plan-source drift, and reports session state. Triggers: start session, session start, new session, begin session, cold start, session protocol."
---

# Project Memory — Session Start

Run before any work begins. Handles git sync, memory bootstrap, and context
load. All paths and commands below come from this project's
`config.json` — nothing here is hardcoded to a specific stack.

## Step 0: Load config

```bash
cat .snowflake/cortex/memory/config.json 2>/dev/null
```

If this file doesn't exist, this project hasn't been bootstrapped yet. Tell
the user and offer to run `bootstrap/SKILL.md` instead of proceeding — there
is no memory file or budget to sync without it.

## Step 1: Git Sync

Run as two separate calls (so status/log always run even if pull fails):

```bash
# Call 1 — sync (--autostash silently handles always-dirty local files
# listed in config.json's neverStage, e.g. .env.local)
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/$(git branch --show-current) 2>/dev/null)
if [ "$LOCAL" = "$REMOTE" ]; then
  echo "Already up to date."
else
  git pull --rebase --autostash
fi
```

```bash
# Call 2 — always run
git branch --show-current && git status --short && git log --oneline -5
```

- If `git pull --rebase --autostash` reports **conflicts**: stop and resolve
  before proceeding — never build on a conflicted state.
- If there's no `origin` remote yet (a brand-new local-only repo), skip the
  fetch/pull and just report branch/status/log — cross-machine sync isn't
  possible until a remote exists, but everything else in this skill still
  works.

## Step 2: Sync Memory

Always overwrite the local runtime cache from the git-tracked file — the git
file is always the source of truth and may have been updated by a `wrap-up`
on another machine:

```bash
MEMORY_FILE="<config.json memoryFile>"
LOCAL_MEM="$HOME/.snowflake/cortex/memory/projects/$(echo "$PWD" | sed 's|^/||;s|/|-|g')/MEMORY.md"
mkdir -p "$(dirname "$LOCAL_MEM")"
if [ ! -s "$LOCAL_MEM" ]; then
  cp "$MEMORY_FILE" "$LOCAL_MEM" 2>/dev/null || true
  echo "COLD START: memory bootstrapped from git-tracked file"
else
  cp "$MEMORY_FILE" "$LOCAL_MEM" 2>/dev/null || true
  echo "Memory synced: $(wc -l < "$LOCAL_MEM") lines"
fi
# Sweep orphaned topic files — this system uses a single flat file per
# project, never an index+topic-file structure; anything else here is stale.
find "$(dirname "$LOCAL_MEM")" -maxdepth 1 -type f ! -name "MEMORY.md" -delete
```

On **COLD START** (new machine or first session after clone): the local
cache was empty — now seeded from the git-tracked file.
On a warm machine: the cache is refreshed, catching drift from any
other-machine `wrap-up`.

## Step 3: Read Memory and Surface Context

1. Read `config.json`'s `memoryFile` (via the `read` tool, not the shell —
   avoids truncation surprises on larger files).
2. Surface the **Session State** section (branch, last commit, "Next"
   items) to the user.

## Step 4: Check Active Plans

For each glob in `config.json`'s `planSources`, split it into a directory
and a filename pattern and use `find` rather than shell glob expansion —
zsh (this environment's shell) errors on an unmatched glob before the
command even runs, so a bare `ls <glob>` breaks on the common case of "no
active plans right now":

```bash
find <plan-dir> -maxdepth 1 -name '<pattern>' 2>/dev/null | grep -v /archive/
```

For example, `planSources: [".snowflake/cortex/plans/*.plan.md"]` becomes
`find .snowflake/cortex/plans -maxdepth 1 -name '*.plan.md' 2>/dev/null`.
Empty output means no active plans — that's a normal, silent case, not an
error.

If `planSources` is empty, skip this step — the project doesn't track plans
as files.

Surface any active plans so the user knows what was in-flight. Cross-check
against `git log --oneline -5` — if a plan's work already landed in commits,
it's stale and should be archived at the next `wrap-up`, not treated as
in-flight now.

## Step 4b: Cheap plan-source drift check

Only run this when `planSources` **is** empty (Step 4 was skipped for lack
of any configured sources). This is a single cheap check, not a full audit
— it exists to catch the exact drift that motivated `doctor`: a project
that started tracking plans as files sometime after bootstrap, with nobody
ever revisiting `config.json`.

```bash
for dir in .snowflake/cortex/plans specs changes docs/plans; do
  n=$(find "$dir" -maxdepth 1 -type f 2>/dev/null | grep -v /archive/ | wc -l | tr -d ' ')
  [ "$n" != "0" ] && echo "$dir: $n file(s)"
done
```

If any directory reports files, add one line to the Step 5 report — don't
fix it here, don't run the rest of `doctor`'s checks, just surface it:
`"planSources is empty but <dir> has <n> file(s) — run doctor to review."`

## Step 5: Report

Output a brief session preamble covering:
- Branch + HEAD commit
- Memory state (line count, COLD START flag if applicable)
- Active plans (if any) or "no plan sources configured"
- Plan-source drift warning (if Step 4b found any)
- Working tree status (clean / dirty files)

## Stopping Points

- ✋ Step 1: if `git pull --rebase` reports conflicts, stop and resolve
  before any other work begins

## Output

A session preamble the user can act on immediately, plus a warmed local
memory cache ready for the rest of the session.

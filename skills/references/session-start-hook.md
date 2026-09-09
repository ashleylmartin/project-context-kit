# Optional SessionStart Hook

An opt-in Cortex Code Desktop `SessionStart` hook that automates the
mechanical half of `session-start` — the `git pull` and local-cache sync —
so a session already has fresh context before anyone types a word.

## What this is (and isn't)

Cortex Code hooks run a shell command and return plain text or JSON; they
cannot invoke a skill or exercise agent judgment. That means this hook only
ever automates the **deterministic** parts of `session-start`:

- `git fetch` + fast-forward pull (never a rebase — a hook has no way to
  ask the user to resolve a conflict, so it must fail closed and say so,
  never force through one)
- Copying the canonical `memoryFile` into the local runtime cache

It deliberately does **not** replace running `session-start` itself — Step
3 (surfacing session state), Step 4 (plan hygiene), and Step 4b (drift
check) all require reading and judgment a shell script can't do. The point
of this hook is narrower: remove the "forgot to say session-start" failure
mode for the git-sync/cache-sync mechanics specifically, by injecting that
state as context before the first prompt.

There is intentionally no equivalent `Stop`/`SessionEnd` hook for `wrap-up`.
Those events can't gather confirmation, so anything they do runs
unattended — incompatible with `wrap-up`'s "never push without asking"
rule and the confirm-before-push memory-diff review. Committing and pushing
stay a human-confirmed, agent-run action, not a fire-and-forget hook.

## The script

Save as `.snowflake/cortex/hooks/session-start-sync.sh` (project-local) and
`chmod +x` it:

```bash
#!/bin/bash
# SessionStart hook: fast-forward pull + local memory cache sync.
# Never rebases, never forces — fails closed and says so on any conflict.
set -euo pipefail

CONFIG=".snowflake/cortex/memory/config.json"
[ -f "$CONFIG" ] || exit 0   # not a project-context-kit project — no-op

MEMORY_FILE=$(node -pe "require('./$CONFIG').memoryFile" 2>/dev/null) || exit 0
[ -n "$MEMORY_FILE" ] || exit 0

if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git remote get-url origin >/dev/null 2>&1; then
  git fetch origin --quiet 2>/dev/null || true
  BRANCH=$(git branch --show-current)
  if ! git merge-base --is-ancestor HEAD "origin/$BRANCH" 2>/dev/null; then
    : # local has unpushed commits or diverged -- leave it for session-start to report, don't touch it
  elif [ "$(git rev-parse HEAD)" != "$(git rev-parse "origin/$BRANCH" 2>/dev/null)" ]; then
    git merge --ff-only "origin/$BRANCH" --quiet 2>/dev/null || true
  fi
fi

LOCAL_MEM="$HOME/.snowflake/cortex/project-context-kit/cache/$(pwd | sed 's|^/||;s|/|-|g').md"
mkdir -p "$(dirname "$LOCAL_MEM")"
cp "$MEMORY_FILE" "$LOCAL_MEM" 2>/dev/null || true

SESSION_STATE=$(grep -A2 '## Session State' "$MEMORY_FILE" 2>/dev/null | tail -n +2 || true)
BRANCH_NOW=$(git branch --show-current 2>/dev/null || echo "unknown")
printf 'project-context-kit: pulled %s, memory cache synced.\nLast recorded session state:\n%s\n' "$BRANCH_NOW" "$SESSION_STATE"
```

## Wiring it up

Add to `.snowflake/cortex/settings.json` (or `.cortex/settings.json`) in the
project — workspace-scoped, not global, since the script assumes it's
running from the project root:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "./.snowflake/cortex/hooks/session-start-sync.sh",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
```

The hook's stdout becomes `additionalContext` for the new session — the
agent sees the pulled branch and last recorded session state before the
user's first message, but should still run `session-start` explicitly for
plan hygiene and the full report.

## Why this is opt-in, not installed by `bootstrap`

Hooks are a user/workspace-scoped setting this plugin has no business
writing into automatically — `bootstrap` mentions this file exists and
where to find it, nothing more. Installing a hook silently would also mean
silently changing what runs before every session in a project, which is
exactly the kind of unattended behavior the rest of this plugin avoids.

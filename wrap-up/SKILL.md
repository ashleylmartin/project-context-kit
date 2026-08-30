---
name: wrap-up
description: "End-of-session wrap-up for projects using the project-memory system. Syncs memory, checks for pattern promotion, runs the quality gate, commits, outputs summary. Triggers: wrap up, wrap-up, wrap full, wrap lite, end session, session summary, close out, done for now, sprint wrap up, batch wrap up. Modes: 'wrap full' or 'wrap up' = full workflow. 'wrap lite' = lite workflow (memory + git + summary only). 'sprint wrap up' = multi-session consolidation."
---

# Project Memory — Wrap-Up

## Step 0: Load config

```bash
cat .snowflake/cortex/memory/config.json 2>/dev/null
```

If missing, this project hasn't been bootstrapped — direct the user to
`bootstrap/SKILL.md` and stop; there's no memory file, budget, or
canonical-docs list to work from.

## Key Principle

> If it can be derived from a `canonicalDocs` entry or the codebase itself,
> it does NOT belong in memory. Memory stores only ephemeral state.

Git rules (never `git add -A`, explicit paths, commit-per-logical-change,
confirm before push) are enforced by this skill directly below — they are
not configurable away, because the confirm-before-push gate is a safety
property, not a preference.

## Workflow

### Step 1: Update Memory (single file)

The canonical memory file is `config.json`'s `memoryFile` — git-tracked,
committed and pushed at every session end, readable on any machine after
`git pull`.

1. Read it via the `read` tool.
2. Update ONLY the sections that actually changed this session — typically:
   - **Session State** — new date, branch, active work, "Next" items.
   - **Gotchas** — add only if a genuinely non-obvious issue was discovered
     (something the codebase or a `canonicalDocs` entry doesn't already
     make clear).
   - Any other project-specific section already established in this file
     (architecture quick-ref, etc.) — update only on structural change.
3. PRUNE stale info. If something is now covered by a `canonicalDocs`
   entry, remove it from memory — that's the entry's job now, not memory's.
4. Load `../references/memory-budget.md`. Check both `budgetLines` and
   `budgetKB` from `config.json`. If over budget, do the synthesis rewrite
   described there instead of an incremental edit.
5. **Sweep cruft:** delete stale memory artifacts (`*.bak`, orphaned files —
   this system is one flat file, never an index+topic-file split). `git rm`
   anything tracked.
6. **Sync the local runtime cache** (keeps it fresh without waiting for the
   next `session-start`):
   ```bash
   LOCAL_MEM="$HOME/.snowflake/cortex/memory/projects/$(echo "$PWD" | sed 's|^/||;s|/|-|g')/MEMORY.md"
   cp "<config.json memoryFile>" "$LOCAL_MEM"
   find "$(dirname "$LOCAL_MEM")" -maxdepth 1 -type f ! -name "MEMORY.md" -delete
   ```

### Step 2: Plan Hygiene

Skip this step entirely if `config.json`'s `planSources` is empty.

Otherwise, for each glob in `planSources`, find active (non-archived) plan
files using `find` rather than shell glob expansion — zsh errors on an
unmatched glob before the command runs, which breaks the common case of "no
active plans right now":

```bash
find <plan-dir> -maxdepth 1 -name '<pattern>' 2>/dev/null | grep -v /archive/
```

For each match found this way, decide:

| State | Action |
|---|---|
| All tasks complete | Archive it (move to a sibling `archive/` dir, or delete if the project treats plans as fully ephemeral) |
| Partially complete | Record remaining tasks in memory's "Next Session" |
| Stale / superseded | Ask the user: archive as abandoned, or still relevant? |

**Decision logic:**
- Plan fully executed this session → archive silently.
- Plan has remaining work → ask: "Archive as done, or carry forward?"
- Plan is from a prior session and untouched → note as stale, ask the user.

If archiving involves a filesystem move, stage the moved file explicitly
(`git add <archived-path>`) and bundle it into the memory commit below —
no separate commit needed for an archive move.

### Step 3: Pattern Promotion Check

Ask: "Was a new cross-cutting pattern established this session that applies
broadly — not just to the specific thing being worked on?"

- If YES and it was explicitly discussed/agreed with the user: append it to
  `config.json`'s `patternPromotionTarget` doc (and `ownershipDoc`'s table,
  if one exists and the pattern introduces a new concern).
- If uncertain: note it as a candidate in the session summary only — do not
  write it anywhere yet.
- If NO: skip silently.

This is the step that keeps memory from becoming a dumping ground for
things that actually belong in a permanent doc — the discipline that failed
once in the reference implementation (comp-in-a-box) and had to be rebuilt.

### Step 4: Quality Gate

Run each command in `config.json`'s `qualityGate`, in order, stopping and
reporting on the first failure. If the array is empty, skip this step and
say so in the summary (rather than silently doing nothing unremarked).

If any project-level pre-commit hook already runs these same checks on every
commit, this step is a belt-and-suspenders re-run for the session as a
whole, not a replacement for the hook.

### Step 5: Release Notes (FULL and SPRINT only — skip in Lite)

Skip entirely if `config.json`'s `releaseNotesFile` is null.

If set, load `../references/release-notes.md` and follow it — it's a real,
adapted skill (not a vague "regenerate the file" instruction): gathers
signals from PRs/issues or git history, categorizes by audience and
newsworthiness, and **appends** one new dated entry to the single HTML
file, then runs its living-doc pass (collapses old entries into a summary,
removes verifiably superseded content) — it does not regenerate the file
wholesale. Do this before Step 6 so the new entry is committed together
with everything else.

### Step 6: Git Sync

1. **Pre-flight**: if the project has established a specific
   `git config user.email` convention, verify it; otherwise skip this check.
2. **Restore any gitignored runtime files this session may have touched**
   that aren't meant to be committed but also aren't in `.gitignore` for
   some reason — only if the project has such files (most won't; skip if
   unsure).
3. **Inventory**: `git status --short`. If clean, skip to Step 7.
4. **Commit by logical change, NOT by session.** Group remaining work into
   self-contained commits (one feature/fix/refactor/docs slice each),
   staging EXPLICIT paths per commit:
   - NEVER `git add -A` / stage all — check `config.json`'s `neverStage`
     list and confirm none of those paths would be swept in.
   - If two changes touched the same file and can't be cleanly split, group
     that file with the change it best belongs to and say so in the message.
   - Message: conventional prefix (`feat:` / `fix:` / `chore:` / `docs:` /
     `refactor:`), 1-line summary, then `config.json`'s `commitFooter`.
   - Bundle the memory-file update (Step 1) into the same commit as the
     work it documents, or its own `chore(memory): ...` commit if no other
     work was uncommitted.
5. **Push — ONLY with explicit go-ahead.** Show the local commits
   (`git log --oneline origin/main..HEAD` or equivalent for the current
   branch) and ASK the user to confirm the push. If confirmed, push (on
   failure, fix auth/network and retry). If declined, leave the commits
   local — they survive as the day's checkpoints — and note "N commits
   unpushed" in the summary. **Never push without asking, in any mode.**

### Step 7: Output Summary

```
## Session Summary — [Date]

### Completed
- [2-4 bullets]

### Decisions
- [if any]

### Pattern Promotions
- [what was appended to patternPromotionTarget] OR "None"

### Plans Archived / Carried
- [list] OR "None"

### Next Session
- [1-3 priorities]
```

## Lite Wrap-Up

When the session was a single small fix (few files, no architectural
change, no new plans), skip the heavy steps and run only:

1. **Memory** — update Session State (date, "Next" items); honor the budget
   (synthesize if over) and sync the local cache.
2. **Git Sync** — `git status --short`:
   - If uncommitted changes exist: stage EXPLICIT paths (respecting
     `neverStage`) and commit the one logical change with a
     conventional-prefix message. Bundle the memory update into this same
     commit — a lite fix doesn't warrant a separate `chore(memory)` commit.
   - If the tree is already clean (the fix was committed earlier in the
     session): commit the memory bump on its own as `chore(memory): ...`.
     Never create an empty/no-op commit.
   - Then ASK before pushing (never auto-push).
3. **Summary** — 2-line summary, no Decisions/Pattern Promotions/Next
   sections unless something actually changed.

Skip in lite mode: Step 2 (Plan Hygiene, unless a plan actually finished),
Step 3 (Pattern Promotion — no cross-cutting pattern from a small fix),
Step 4 (Quality Gate — pre-commit hooks, if any, already caught issues at
commit time), Step 5 (Release Notes).

**Trigger:** Use lite wrap when the session's work is already committed and
you only need memory sync — regardless of file count. Use full wrap when
there's uncommitted work to organize into commits, a pattern to promote, a
quality gate worth running, or release notes to update.

## Sprint Wrap-Up

Use when work has spanned multiple sessions without wrapping up, or the user
wants to consolidate a batch of work into one clean close.

**Triggers:** `sprint wrap up`, `batch wrap up`, `consolidate sessions`

### Sprint Step 1: Gather Context

1. `git log --oneline <last-wrap-up-hash>..HEAD` — find the last wrapped
   checkpoint (search commit messages for the memory-update commit pattern)
   and everything since.
2. `git diff --stat <last-wrap-up-hash>..HEAD` — blast radius.
3. Scan all `planSources` globs for anything created during the sprint.
4. Read the current memory file to see what intermediate sessions recorded.

### Sprint Step 2: Synthesize Memory (one write, not incremental)

Always run the full synthesis from `../references/memory-budget.md`
regardless of whether the file is currently within budget — a sprint close
is exactly the point where intermediate-session narrative should be
collapsed into current truth. Verify against the codebase, not accumulated
notes. Result must be within budget and smaller than layering incremental
edits would have produced.

### Sprint Step 3: Plan Hygiene (batch)

Same as Step 2 above, but scan for ALL plans created during the entire
sprint, not just one session. Archive completed ones in batch; consolidate
remaining tasks into ONE "Next Session" list rather than carrying several
separate plan files forward.

### Sprint Step 4: Pattern Promotion (holistic)

Ask the holistic version of Step 3's question: "Across the entire sprint,
was a cross-cutting pattern established?" This catches patterns that only
become visible across multiple sessions, which a single per-session check
might miss.

### Sprint Step 5: Quality Gate

Same as standard Step 4.

### Sprint Step 6: Release Notes

Same as standard Step 5 — one new appended entry plus the living-doc pass —
but gathered across the whole unwrapped span (the `release-notes-since-commit`
meta tag may be several sessions old by now, which is exactly what makes
this a sprint close rather than a per-session one) (if `releaseNotesFile`
is set).

### Sprint Step 7: Git Sync

Same as standard Step 6, except the sprint narrative belongs in the Sprint
Summary output, not forced into one mega-commit — commit remaining
uncommitted work by logical change as usual.

### Sprint Step 8: Output Summary

```
## Sprint Summary — [Date range]

### Sprint Scope
- Commits: [count]
- Files changed: [count]

### Completed
- [3-6 bullets — net outcomes, not per-session minutiae]

### Pattern Promotions
- [list] OR "None"

### Plans Archived
- [list] OR "None"

### Next Sprint
- [1-3 priorities]
```

### When to Sprint Wrap vs. Standard Wrap

| Signal | Use Sprint Wrap |
|---|---|
| Multiple sessions since last wrap-up | Yes |
| User explicitly says "sprint wrap" / "batch wrap" | Yes |
| Memory has stale intermediate-session state | Yes |
| Single session, clean close | No — use Full or Lite |

## Anti-patterns

- Do NOT end a session with unarchived plans or incomplete changes if
  `planSources` is configured — resolve or carry forward explicitly.
- Do NOT let memory grow over time — budget applies at every wrap.
- Do NOT leave the local runtime cache out of sync, or stale cruft files in
  the memory directory.
- Do NOT duplicate a `canonicalDocs` entry's content into memory.
- Do NOT maintain a history/changelog file in memory — git log is history.
- Do NOT `git add -A` — stage explicit paths; check `neverStage` first.
- Do NOT lump unrelated work into one commit — one logical change per
  commit.
- Do NOT skip the local commit — it's the durable checkpoint even before a
  push is confirmed.
- Do NOT push without asking, in any mode, ever.
- Do NOT commit secrets or force-push.

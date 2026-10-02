
# Plan: Fix doctor's stale-dir heuristic + drop the budgetKB ceiling

## Context

Two independent fixes to `project-context-kit`, both scoped to skill docs
(no runtime code besides the two scripts, which aren't touched):

1. **Bug fix** — `doctor`'s "old memory dir" migration check
   (`skills/doctor/SKILL.md`, Step 5) currently tells the user a directory
   is "safe to delete (nothing in this plugin reads it anymore)" purely
   because `project-context-kit` itself no longer uses that path. But that
   statement conflates two different things: the directory
   (`$HOME/.snowflake/cortex/memory/projects/<sanitized-cwd>/`) used to be
   project-context-kit's *old* cache location, but it is *also* the live
   store Cortex Code's built-in per-project memory tool uses right now,
   completely independent of this plugin. A real incident confirmed this:
   doctor flagged it as a stale leftover in a project where a file in that
   directory had been written 10 minutes earlier in the same session by
   the built-in memory tool.

2. **Schema simplification** — drop `budgetKB` (the 6KB hard cap) and keep
   only `budgetLines` (80). This removes one of the two "check both
   dimensions" budget checks everywhere it's referenced.

## Task 1 — Fix doctor's migration-check section

File: `skills/doctor/SKILL.md`, the "### Migration check (projects
bootstrapped before this fix)" subsection (currently ~lines 132–150).

Replace the ending of that section (currently: run `ls -la "$OLD_DIR"`,
then "If it exists, report its contents to the user and note it's safe to
delete... but never delete it yourself without confirmation") with:

- Keep the existing explanation of why the old path exists and that
  `project-context-kit` no longer reads/writes it.
- Add an explicit callout: this directory is *also* the live store for
  Cortex Code's built-in per-project memory tool (the one backing the
  `memory` tool's "Project memories" at
  `/memories/projects/<sanitized-cwd>/*.md`) — existence of files there is
  never on its own evidence of staleness.
- Change the check itself to look at recency, not just existence:
  ```bash
  OLD_DIR="$HOME/.snowflake/cortex/memory/projects/$(echo "$PWD" | sed 's|^/||;s|/|-|g')"
  ls -la "$OLD_DIR" 2>/dev/null
  find "$OLD_DIR" -type f -newermt '-1 day' 2>/dev/null
  ```
- Rewrite the guidance so doctor:
  - If `find` shows any file modified recently (last ~day, or visibly
    within the current session) → report it as **likely the built-in
    memory tool's active store** and say nothing about deletion at all.
  - If nothing recent shows up → still only report contents and ask the
    user whether they still want it; never assert "safe to delete" as a
    doctor-generated verdict, since the built-in memory tool's own topic
    files don't expire and may still matter even if untouched recently.
  - In all cases: "project-context-kit has no use for this path" is a
    statement about this plugin only, never a verdict on the directory's
    contents. Doctor never deletes it, with or without confirmation —
    this is informational-only, full stop (removing the confirmation
    stopping-point implied by "safe to delete," since that framing is
    exactly what caused the false positive).

No changes needed to the "Stopping Points" list at the end of
`doctor/SKILL.md` — this section was already informational, not a
confirmed-fix item.

## Task 2 — `references/config-schema.md` and `references/memory-budget.md`

**`skills/references/config-schema.md`:**
- Remove `"budgetKB": 6,` from the example JSON block.
- Remove the `budgetKB` row from the field table.
- Update the `budgetLines` row to read as the sole memory-size budget
  (drop the "Advisory on its own — see budgetKB" cross-reference).
- Update the validation rule "`budgetLines` and `budgetKB` must both be
  present — one without the other defeats the point" → "`budgetLines`
  must be present."

**`skills/references/memory-budget.md`:**
- Header line: "Read `config.json` (`budgetLines`, `budgetKB`) before
  applying these." → "Read `config.json` (`budgetLines`) before applying
  these."
- "## The budget" section: replace the "Check both dimensions — line
  count alone is a bad proxy... Both `budgetLines` and `budgetKB` must be
  satisfied" paragraph with a single-dimension version: line count is the
  budget; keep the "every bullet should be one sentence, no
  session-by-session narrative" guidance as-is since that's still true
  advice independent of which dimension is checked.
- Leave "Synthesis trigger," "Sweeping cruft," and "Anti-patterns"
  sections otherwise intact — they don't need KB-specific wording beyond
  what's already covered by the opening paragraph fix.

## Task 3 — Update the four skills that check/report the budget

**`skills/doctor/SKILL.md`, Step 4** ("Check the memory budget right
now"): drop the `wc -c` byte check; keep only `wc -l` against
`budgetLines`.

**`skills/doctor/SKILL.md`, Step 7 report template**, "### Budget" line:
`<memoryFile>: <N> lines / <K> KB (budget: <budgetLines> / <budgetKB>KB) —
<OK | OVER...>` → `<memoryFile>: <N> lines (budget: <budgetLines>) — <OK |
OVER, run wrap-up to synthesize>`.

**`skills/wrap-up/SKILL.md`, Step 4** (the "wrap: update memory" sequence):
"Check both `budgetLines` and `budgetKB` from `config.json`" → "Check
`budgetLines` from `config.json`."

**`skills/bootstrap/SKILL.md`:**
- Step 5 defaults (~line 199): `budgetLines: 80, budgetKB: 6
  (comp-in-a-box's proven defaults — big enough...)` → `budgetLines: 80
  (comp-in-a-box's proven default — big enough for real session state,
  small enough to force pruning).`
- The `memoryReadme` template it writes (~line 334): `<memoryFile> (max
  <budgetLines> lines / <budgetKB> KB) — the ONLY memory file.` →
  `<memoryFile> (max <budgetLines> lines) — the ONLY memory file.`

**`skills/help/SKILL.md`, Step 2b report** (~lines 60–61): `Memory file:
<memoryFile> — currently <N> lines / <K>KB (budget: <budgetLines> lines /
<budgetKB>KB)` → `Memory file: <memoryFile> — currently <N> lines (budget:
<budgetLines> lines)`.

## Task 4 — This repo's own `config.json`

`.snowflake/cortex/memory/config.json`: remove the `"budgetKB": 6,` line
(dogfood the new schema on this repo itself, same as every other
`canonicalDocs`-governed project would need to on their next `doctor`
run — though doctor itself won't force this; it's just no longer read).

## Task 5 — Changeset + version bump

Write `.changeset/doctor-fix-and-drop-budgetkb.md` directly (same pattern
used for the 1.0 upgrade changeset) with a **minor** bump — this changes
the config schema (removes a previously-required field) and fixes
user-visible incorrect doctor output, but isn't a breaking change for
already-bootstrapped projects (an unused `budgetKB` field left in their
`config.json` is simply ignored now):

```markdown
---
"project-context-kit": minor
---

Fix `doctor`'s stale-memory-dir check so it never claims a directory is
"safe to delete" when it may be the live store for Cortex Code's built-in
per-project memory tool — now checks recency and always defers to the
user. Also drop the `budgetKB` (6KB) memory-size ceiling; `budgetLines`
(80) is now the only memory budget.
```

Then run `npm run version` (runs `changeset version` +
`scripts/sync-plugin-version.mjs`), which:
- Consumes the changeset, bumps `package.json` to the next minor (1.1.0).
- Updates `CHANGELOG.md` with the entry above.
- Syncs the new version into `.cortex-plugin/plugin.json` and
  `.claude-plugin/plugin.json`.

Verify with `npm run check-plugin-version` after.

## Task 6 — Commit, tag, push, reinstall

Follow the README's "direct-push shortcut" (steps 3–4 run locally rather
than waiting on a PR, since there's no CI gate beyond
`check-plugin-version` + the semantic-registry check):

1. `git add -A && git commit` with a message describing both fixes +
   version bump, using this repo's own `commitFooter` from `config.json`.
2. `npx changeset tag` to create the version tag (e.g. `v1.1.0`) locally.
3. `git push && git push --follow-tags`.
4. Since the Release Action's `npx changeset tag` will no-op (tag already
   exists), create the GitHub Release manually to match prior versions —
   `gh release create v1.1.0 --notes-from-tag` or equivalent, pulling body
   from the new `CHANGELOG.md` section.
5. **Reinstall the local plugin install**: re-run the sync for the
   installed copy at `~/.snowflake/cortex/plugins/project-context-kit` —
   use the per-card Sync button if operating in the UI, or re-invoke the
   `github-plugin-installer` skill pointed at the same `github` descriptor
   already in `~/.snowflake/cortex/plugins/registry.json`, so the fixes
   are live for other projects immediately (matching the "fixes here need
   a release + reinstall before other projects see them" gotcha already
   in memory).

## Verification

- `npm run check-plugin-version` passes (all three manifests agree).
- `node scripts/check-semantic-registry.mjs .` passes (part of
  `qualityGate`).
- Grep confirms no remaining `budgetKB` references anywhere in `skills/`
  or this repo's own `config.json`.
- Diff the installed plugin's `doctor/SKILL.md` against the dev repo's
  version post-reinstall to confirm the fix propagated.

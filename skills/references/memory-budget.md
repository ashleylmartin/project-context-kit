# Memory Budget & Synthesis Rules

Shared by `wrap-up`, `doctor`, and `help`. Read `config.json`
(`budgetLines`) before applying these.

## Key Principle

> If it can be derived from a canonical doc (`config.json` → `canonicalDocs`)
> or the codebase itself, it does NOT belong in memory. Memory stores only
> ephemeral state — what session we are on, what is active, and what gotchas
> are not obvious from reading the code.

This principle should appear verbatim (or near-verbatim) in the project's
`memoryReadme`, and be restated at the top of both `session-start` and
`wrap-up` when they touch memory — the redundancy is deliberate. An agent
that only sees it once, in a file it doesn't reread every session, drifts.

## The budget

`budgetLines` is the memory budget — a cap on line count. Every bullet
should be one sentence. No session-by-session narrative — git log and
archived plans/specs are the history; memory is not a changelog.

Sections: `Session State` (exactly one bullet, replaced each wrap),
`Gotchas`, `Next Session`, and optionally `Blockers` / `Known Gaps` (present
only while non-empty). The file opens with a two-line Key Principle header.

## Synthesis trigger

Memory counts as **over budget** if any of these hold (`doctor` Step 4 has
the exact checks): line count over `budgetLines`, more than one bullet
under Session State, or any bullet over 300 characters.

If memory is over budget at the **start** of any wrap (lite, full, or
sprint), do a rewrite-once synthesis instead of an incremental edit:

1. Start from current codebase truth — grep/glob to verify claims, don't
   trust accumulated notes that may have drifted from reality.
2. Rewrite the file ONCE, keeping only durable, non-derivable state: current
   session-state pointer, cross-cutting gotchas, an architecture quick-ref if
   one is warranted. Collapse anything derivable from git log, archived
   plans, or a `canonicalDocs` entry into a one-line pointer to that doc
   instead of restating it.
3. Result MUST be smaller than before and within budget. Then sweep cruft
   (see below) and sync the local runtime cache.

Sprint wraps always synthesize; lite/full wraps synthesize only when over
budget.

## Sweeping cruft

At every wrap, delete stale memory artifacts: `*.bak` files, orphaned
per-topic files (this system uses one flat file per project, never a
directory of topic files — if one shows up, another skill or a manual edit
created it and it should be removed), anything superseded by a
`canonicalDocs` entry. If a cruft file is git-tracked, `git rm` it, don't
just delete it from disk.

## Anti-patterns

- Do NOT let memory grow over time — it should shrink or stay flat.
- Do NOT duplicate content already owned by a `canonicalDocs` entry.
- Do NOT maintain a history/changelog file inside memory — git log is the
  history.
- Do NOT store file paths, component inventories, or API signatures that a
  `grep`/`glob` can recover — that's the codebase's job, not memory's.
- Do NOT split memory into an index + topic files. One file, one budget.

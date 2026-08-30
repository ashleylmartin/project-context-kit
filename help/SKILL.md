---
name: help
description: "Explain how the project-memory system works, either generically (if this project isn't set up yet) or concretely using this project's actual config.json and memory file. Triggers: how do I use project memory, project memory help, explain the memory system, what does wrap-up do, what does session-start do, is this project set up for memory tracking, memory system guide."
---

# Project Memory — Help

An onboarding/guide command. Always check whether the project is configured
first — the answer should be concrete and project-specific whenever
possible, not a generic explainer that leaves the user to figure out their
own paths.

## Step 1: Detect configuration state

```bash
cat .snowflake/cortex/memory/config.json 2>/dev/null
```

## Step 2a: Not configured

If `config.json` doesn't exist, explain the system generically and point at
`bootstrap`:

```
This project hasn't set up the project-memory system yet.

Three commands, once bootstrapped:
- bootstrap  — one-time setup: creates a budgeted memory file, a config
  file, and (optionally) a lightweight ownership doc.
- session-start — run at the start of every session: syncs git, warms the
  local memory cache, surfaces active plans.
- wrap-up — run at the end of every session: updates memory (within a hard
  size budget), checks for patterns worth promoting into a permanent doc,
  runs your quality gate, commits (never pushes without asking).

Memory model: a single git-tracked file is the source of truth. It's
synced to a local runtime cache on this machine, and to any other machine
via git push/pull. The system enforces a hard budget on that file
specifically so it stays skimmable — memory holds ONLY session state and
non-obvious gotchas, never anything a codebase read or a docs file already
covers.

Run bootstrap to get started.
```

## Step 2b: Configured — report the concrete setup

Read `config.json` and `memoryFile`, then report *this project's* actual
values, not generic text:

```
This project's memory system:

- Memory file: <memoryFile> — currently <N> lines / <K>KB (budget:
  <budgetLines> lines / <budgetKB>KB)
- Canonical docs (memory defers to these — don't duplicate their content):
  <for each canonicalDocs entry: "- <path> — owns: <owns>">
- Ownership map: <ownershipDoc> OR "not configured — canonicalDocs list in
  config.json is the routing table instead"
- Plan sources scanned at wrap-up: <planSources, or "none — this project
  doesn't track plans as files">
- Quality gate run at wrap-up: <qualityGate commands, or "none configured
  yet">
- Pattern promotions land in: <patternPromotionTarget>

Typical session:
1. Run session-start — syncs git, warms memory, shows what's active.
2. Do the work.
3. Run wrap-up (or "wrap lite" for a small fix, "sprint wrap up" if you're
   consolidating multiple unwrapped sessions) — updates memory, checks for
   promotable patterns, runs the quality gate, commits by logical change,
   asks before pushing.
```

Then answer whichever sub-question prompted the help request (see below) —
don't just dump the full report if the user asked something narrower like
"what's the difference between lite and full wrap".

## Common sub-questions to answer inline

- **"What's cold start?"** — The local memory cache (per-machine, not
  git-tracked) starts empty on a new machine or right after a fresh clone.
  `session-start` detects this and re-seeds the cache from the git-tracked
  memory file, so the agent isn't working from zero context even on a
  brand-new machine.
- **"Lite vs full vs sprint wrap?"** — Lite: work's already committed,
  just sync memory. Full: there's uncommitted work, a possible pattern to
  promote, or the quality gate should run. Sprint: multiple sessions have
  gone by without wrapping — consolidate and re-synthesize memory once
  instead of layering edits.
- **"Why does memory have a size budget?"** — Without one, memory
  accumulates session narrative and starts duplicating docs that already
  cover the same ground — it stops being skimmable and agents stop trusting
  it. The budget forces continuous pruning instead of letting that happen.
- **"Why does wrap-up ask before pushing?"** — Commits are a safe local
  checkpoint; a push is a shared, harder-to-undo action. The system commits
  freely but never pushes without explicit confirmation, in any mode.
- **"Can I add a new canonical doc later?"** — Yes: add it to
  `canonicalDocs` in `config.json` (and to `ownershipDoc`'s table if one
  exists) with what it owns. `wrap-up`'s pattern-promotion step will start
  deferring to it.

## Output

A response tailored to whichever question triggered this skill — either the
generic explainer (unconfigured) or this project's concrete configuration
report, plus a direct answer to any specific sub-question asked.

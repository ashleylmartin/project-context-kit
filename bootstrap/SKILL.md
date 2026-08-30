---
name: bootstrap
description: "One-time setup of the project-memory system in a new project: creates the config file, the budgeted memory file, the memory README, and (optionally) a lightweight ownership-map doc and a minimal conventions doc. Run this before session-start or wrap-up will work. Triggers: bootstrap memory, set up project memory, init memory system, memory bootstrap, set up session-start and wrap-up."
---

# Project Memory — Bootstrap

Run once per project, before `session-start` or `wrap-up` are used for the
first time. Both of those skills require `.snowflake/cortex/memory/config.json`
to exist — this skill creates it.

## When NOT to run this

If `.snowflake/cortex/memory/config.json` already exists, this project is
already bootstrapped. Don't start over — bootstrapping a second time would
overwrite an already-curated memory file. Instead:

- If the user wants to understand what's configured: load `help/SKILL.md`.
- If something seems off (a doc moved, plans aren't being tracked anymore,
  the memory file feels stale, or you're not sure): load `doctor/SKILL.md`
  to audit the existing setup and fix only what's confirmed.
- If the user wants to add a single new `canonicalDocs`/`planSources` entry
  mid-project, that's a targeted edit either of those skills can make —
  full bootstrap isn't needed for it.

## Step 1: Confirm git

This system's cross-machine sync depends entirely on git push/pull. Run:

```bash
git rev-parse --is-inside-work-tree
```

If this fails, stop and tell the user: the project-memory system requires a
git repository (any cross-machine sync happens via `git push`/`git pull` on
the memory file — without git there is nothing to sync). Ask them to
`git init` first, or skip bootstrap if this is intentionally a single-machine
scratch project that doesn't need memory continuity.

## Step 2: Interview

Ask the user (batch these into one exchange where possible):

1. **Project name** — used in the memory file's heading and commit context.
2. **Quality gate commands** — what should `wrap-up` run before considering
   a session's work verified? (e.g. `npm run lint && npm test`, `pytest`,
   `cargo test`, or "none yet" — an empty gate is valid for early-stage
   projects).
3. **Canonical docs** — does the project already have (or plan to have) a
   file like `AGENTS.md`/`CONTRIBUTING.md`/`ARCHITECTURE.md` that owns
   commands, conventions, or architecture? List any that exist. If none
   exist, offer to scaffold a minimal one (see Step 4).
4. **Ownership-map doc** — for projects with several canonical docs (design
   system rules, domain vocabulary, ADRs, etc.) that could plausibly
   overlap, ask whether they want a lightweight ownership-map doc (a single
   "who owns what, read this first" index) to prevent fragmentation. Skip
   this for small/simple projects — one `AGENTS.md` and memory's own budget
   discipline is enough; the ownership-map doc earns its keep only once
   there are 2+ canonical docs whose scope could overlap.
5. **Plan tracking** — does the project track in-flight work as files
   anywhere (`.snowflake/cortex/plans/`, a `specs/`/`changes/` directory,
   PRD files)? List the glob(s), or "none" if work isn't tracked as files.
6. **Release notes** — do stakeholders (not just developers) need a running
   "what's new" page? If yes, `wrap-up` can maintain one automatically —
   a single self-contained HTML file, written for a non-technical audience.
   Each wrap appends one new dated entry and also tidies the page: old
   entries collapse into a summary, and content later found stale gets
   removed — a living doc, not a one-way append log. See
   `../references/release-notes.md` for exactly how. Default: skip this
   (most projects don't need it) unless the user has an actual audience in
   mind for it.

**⚠️ STOP**: Confirm these answers before writing anything.

## Step 3: Write `config.json`

Load `../references/config-schema.md` for the exact field list and
validation rules, then write `.snowflake/cortex/memory/config.json` using the
interview answers. Defaults if the user has no strong preference:

- `budgetLines: 80`, `budgetKB: 6` (comp-in-a-box's proven defaults — big
  enough for real session state, small enough to force pruning).
- `neverStage`: start with universal always-locally-modified suspects —
  `.env`, `.env.local`, `*.tsbuildinfo`, `node_modules/`, plus anything the
  user's stack conventionally never commits (ask if unsure rather than
  guessing for an unfamiliar stack).
- `releaseNotesFile: null` unless the user opted in during the interview —
  if they did, use a repo-relative `.html` path (e.g.
  `docs/RELEASE_NOTES.html`), never `.md`. The file itself is seeded lazily
  by `wrap-up`'s first run (via `../references/release-notes.md`), not by
  bootstrap — there's nothing to write until there's a real change to
  report.
- `commitFooter`: the standard Cortex Code attribution footer (see
  `config-schema.md` example) unless the user wants something else.

## Step 4: Seed canonical docs (only if requested in Step 2)

If the user has no canonical doc yet and wants one scaffolded, create a
minimal conventions doc (name it what they prefer — `AGENTS.md` is the
common convention) with just enough structure for `wrap-up`'s
pattern-promotion step to have somewhere to write to:

```markdown
# <Project Name>

## Commands
[Populate as they're established — build, test, dev server, etc.]

## Conventions
[Populate as they're established — code style, commit format, etc.]

## Architecture
[Populate as the project takes shape.]
```

Do not invent content for sections the project doesn't have yet — an empty
heading is a better signal than a fabricated one. Set this file as the
`patternPromotionTarget` in `config.json`.

If the user requested an ownership-map doc (Step 2, item 4), create a scaled
down version — this does NOT need comp-in-a-box's full weight (cold-start
read order across 6+ docs); a new project needs only:

```markdown
# Knowledge Map

Where does new knowledge go?

| Concern | Canonical source |
|---|---|
| Commands, conventions, architecture | `AGENTS.md` |
| Ephemeral session state, active work, non-obvious gotchas | `.snowflake/cortex/memory/<project>.md` |
| [add rows as new canonical docs are introduced] | |

One concept, one home. If two docs describe the same thing, fix the
duplication rather than adding a third copy.
```

Set this path as `ownershipDoc` in `config.json`, and add it as its own
`canonicalDocs` entry (it owns "doc ownership routing").

## Step 5: Seed the memory file

Load `../references/memory-budget.md` for the budget rules, then write
`config.json`'s `memoryFile` path:

```markdown
# <Project Name> — project memory

## Session State
- **Session:** [today's date] (s1, start) · `[current branch]` · no active work yet.

## Gotchas
- [none yet — this section fills in as non-obvious issues are discovered]

## Next Session
- [what should happen first]
```

Keep it well under budget — this is a seed, not a filled-in file. Padding it
with placeholder content defeats the discipline this system exists to
enforce.

## Step 6: Write the memory README

Write `config.json`'s `memoryReadme` path:

```markdown
# Memory Conventions

## Key Principle

> If it can be derived from [canonical docs — list them] or the codebase
> itself, it does NOT belong in memory. Memory stores only ephemeral state —
> what session we are on, what is active, and what gotchas are not obvious
> from reading the code.

## Structure

- `<memoryFile>` (max <budgetLines> lines / <budgetKB> KB) — the ONLY memory
  file.

## Rules

1. One file. Budget above. If it grows, you are storing too much.
2. Ownership of everything else: see `<ownershipDoc>` (if configured) or
   the canonical docs list in `config.json`.
3. Memory owns: session state, active work, non-obvious in-flight gotchas.
4. History lives in git log. Do not maintain a changelog file here.
5. Run `/wrap-up` (from the `project-memory` skill package) at session end
   to keep this file current and committed.

## Cross-Machine Sync

Clone the repo. `wrap-up` commits and pushes this file every session end.
On a fresh machine, `session-start` reads it to bootstrap local context.

## A note on the local runtime cache

`session-start` mirrors this file into a per-machine cache at
`$HOME/.snowflake/cortex/memory/projects/<sanitized-repo-path>/MEMORY.md` —
and that path is also where the built-in Cortex Code memory tool keeps its
own per-project notes. **Don't hand-author that cache path directly.** It
gets silently overwritten by the next `session-start`, and anything written
there instead of here will eventually be lost or conflict with this file.
Always write project state to *this* file (`<memoryFile>`); run `doctor` if
you suspect the two have already diverged.
```

Fill in the bracketed placeholders from the actual `config.json` values.

## Step 7: Git-track everything

```bash
git add .snowflake/cortex/memory/config.json .snowflake/cortex/memory/<memoryFile-basename> .snowflake/cortex/memory/README.md
# plus any scaffolded canonical/ownership docs from Step 4
```

Do not commit yet — surface the new files to the user and let them commit
(or run `wrap-up`, which will commit as part of its normal flow).

## Step 8: Report and hand off

Summarize what was created (file list), confirm the config values chosen,
and tell the user: "Run `session-start` at the beginning of future sessions,
and `wrap-up` at the end. Ask `help` any time for a walkthrough of how this
project's memory system works."

## Stopping Points

- ✋ Step 2: interview answers confirmed before writing anything
- ✋ Step 7: new files surfaced, but not committed without the user's go-ahead

## Output

`.snowflake/cortex/memory/config.json`, a seeded memory file, a memory
README, and (if requested) a minimal conventions doc and ownership-map doc —
all git-tracked but uncommitted, ready for the user's first `wrap-up`.

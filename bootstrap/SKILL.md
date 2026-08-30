---
name: bootstrap
description: "One-time setup of the project-memory system in a new project: creates the config file, the budgeted memory file, the memory README, and (optionally) a lightweight ownership-map doc and a minimal conventions doc. Run this before session-start or wrap-up will work. Triggers: bootstrap memory, set up project memory, init memory system, memory bootstrap, set up session-start and wrap-up."
disable-model-invocation: true
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

## Step 1b: Greenfield check

Detect whether this is a genuinely empty project — no package-manager
manifest and no source files, just `.git` and maybe a `README`:

```bash
find . -maxdepth 2 -type f ! -path './.git/*' ! -name '.gitignore' ! -iname 'readme*' 2>/dev/null | head -20
```

If that returns nothing, this is greenfield — run this branch before
continuing to Step 2 (the files it creates then get picked up by Step 2's
exploration, so the rest of the interview gets real defaults instead of
empty-project fallbacks):

1. **Short pre-interview** — one `ask_user_question` call, batching what
   fits (max 4 items): what are you building (one line), stack/language,
   and package manager (only if the stack has more than one common choice).
2. **Minimal skeleton only** — not a framework generator:
   - One manifest file matching the chosen package manager (`package.json`,
     `pyproject.toml`, `go.mod`, `Cargo.toml`, etc.) with just name/version
     — no dependencies unless the user already named one they know they
     need.
   - One placeholder entry file (`index.js`, `main.py`, `main.go`, etc.)
     with a single trivial stub — not real feature code.
   - `.gitignore` for the chosen stack's common ignores.
   - A `README.md` stub if one doesn't already exist (title + the one-line
     description from the pre-interview).
3. **Do not** scaffold test setup, CI config, linting config, or folder
   structure beyond the single entry file — that's exactly the
   framework-generator behavior this branch avoids. The project grows its
   own structure as real code gets written; this only gives Step 2
   something non-empty to find.

If the directory isn't empty, skip this step entirely and go straight to
Step 2.

## Step 2: Explore before asking

Gather everything derivable from the repo itself first, so the interview
below only asks about what genuinely can't be inferred — never re-ask for
something already visible on disk:

```bash
basename "$PWD"
ls AGENTS.md CONTRIBUTING.md ARCHITECTURE.md CONTEXT.md DESIGN.md 2>/dev/null
cat package.json 2>/dev/null | grep -A6 '"scripts"'
ls Makefile pyproject.toml Cargo.toml go.mod 2>/dev/null
find .snowflake/cortex/plans specs changes docs/plans -maxdepth 1 -type f 2>/dev/null | grep -v /archive/
```

Use the results to pre-fill a recommended default for every section in Step
3 — e.g. a found `package.json` with `lint`/`test` scripts becomes the
quality-gate default; a found `AGENTS.md` becomes the canonical-docs answer
with nothing to ask; a non-empty `.snowflake/cortex/plans/` becomes the
plan-tracking default. Note which sections were fully answered by
exploration — those get skipped in Step 3, not re-asked.

## Step 3: Interview — one section at a time, default-led

Ask via `ask_user_question`, **one section per call**, in this order,
**skipping any section Step 2 already answered with confidence** (state the
inferred value inline as part of the running summary instead of asking).
Every question that's still asked must lead with the recommended default
from Step 2 (or the universal fallback below if exploration found nothing)
so confirming is a single click, not free-form typing:

1. **Project name** — default: repo directory basename (or `package.json`/
   `pyproject.toml` name field if found). Used in the memory file's heading
   and commit context.
2. **Quality gate commands** — default: the `lint`/`test` scripts found in
   Step 2 (e.g. `npm run lint && npm test`), or the stack's obvious
   convention (`pytest`, `cargo test`) if a manifest file was found without
   inspectable scripts. Fallback default: "none yet" — an empty gate is
   valid for early-stage projects. Skip asking if scripts were confidently
   found; just confirm the derived command inline.
3. **Canonical docs** — skip asking entirely if Step 2 found an existing
   `AGENTS.md`/`CONTRIBUTING.md`/`ARCHITECTURE.md` — just report which
   file(s) were found and what each owns (ask only if what it owns isn't
   obvious from a quick read). If none exist, ask with the default being
   "scaffold a minimal `AGENTS.md`" (see Step 5) — that's almost always the
   right call for a new project; "skip for now" is the alternative.
4. **Ownership-map doc** — only ask this at all if Step 3.3 produced 2+
   canonical docs whose scope could plausibly overlap; otherwise skip
   silently (default: not needed — one `AGENTS.md` plus memory's own budget
   discipline is enough for a single-doc project). When asked, default to
   "yes, add the lightweight index."
5. **Plan tracking** — default: the glob matching whatever directory Step 2
   found files in (e.g. `.snowflake/cortex/plans/*.plan.md`). If Step 2
   found nothing, default is "none" — skip asking and just confirm that
   default inline rather than prompting, unless the user's project type
   makes file-tracked plans likely (ask in that ambiguous case only).
6. **Release notes** — default: skip (most projects don't need a
   stakeholder-facing page). Only ask if there's a plausible non-developer
   audience signal (e.g. a `CHANGELOG.md` already exists, or the project
   name/description suggests an external audience) — otherwise skip
   silently and note the default inline.
7. **Domain-vocabulary discipline** — default: skip for a brand-new/small
   project (nothing to formalize yet); default to "yes" if Step 2 found
   signs of existing domain complexity (a found `CONTEXT.md`/glossary-named
   file, or a description mentioning specialized terminology). On yes, load
   `../domain-vocabulary/SKILL.md` Step 1 to seed the doc and register it in
   `config.json` with `"kind": "vocabulary"` (see Step 6 below).
8. **Design-soul discipline** — default: skip unless the project is
   visually/UI-facing (a frontend framework manifest was found in Step 2,
   or the description mentions UI/design work) or a `DESIGN.md`-named file
   already exists. On yes, load `../design-soul/SKILL.md` Step 1 to seed
   the doc and register it with `"kind": "design"` (see Step 6 below).

If more than 4 sections still need a live question after skips, split
across multiple `ask_user_question` calls (max 4 questions per call) rather
than dropping any.

## Step 4: Show the draft, then confirm

Before writing anything, render a single draft covering every file this run
will produce: `config.json`'s full contents, the seeded memory file, the
memory README, and any scaffolded canonical/ownership doc content. Show it
as one consolidated preview and ask for explicit go-ahead (or targeted
edits) before Step 5 writes anything to disk.

**⚠️ STOP**: Draft confirmed before writing anything.

## Step 5: Write `config.json`

Load `../references/config-schema.md` for the exact field list and
validation rules, then write `.snowflake/cortex/memory/config.json` using the
confirmed draft. Defaults if the user has no strong preference:

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

## Step 6: Seed canonical docs (only if requested in Step 3)

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

If the user requested an ownership-map doc (Step 3, item 4), create a scaled
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

If **both** a vocabulary doc and a design doc are configured (Step 3, items
7 and 8), use the richer variant instead — the plain table above starts to
under-serve once there are 3+ canonical docs with genuinely different
disciplines:

```markdown
# Knowledge Map

Where does new knowledge go? Check this table before creating a new doc or
adding to the wrong one.

| Concern | Canonical source | Discipline |
|---|---|---|
| Commands, conventions, architecture | `AGENTS.md` | static — updated on pattern promotion |
| Domain terms, glossary, naming decisions | `CONTEXT.md` | active — see `domain-vocabulary` |
| Visual/interaction rules, design tokens, design decisions | `DESIGN.md` | active — see `design-soul` |
| Ephemeral session state, active work, non-obvious gotchas | `.snowflake/cortex/memory/<project>.md` | active — see `wrap-up`/`session-start` |
| [add rows as new canonical docs are introduced] | | |

One concept, one home. "Active" disciplines are touched inline, the moment
something changes — never batched. If two docs describe the same thing,
fix the duplication rather than adding a third copy.
```

Set this path as `ownershipDoc` in `config.json`, and add it as its own
`canonicalDocs` entry (it owns "doc ownership routing").

If the user opted into domain-vocabulary discipline (Step 3, item 7), seed
that doc per `../domain-vocabulary/SKILL.md` Step 1 and add its
`canonicalDocs` entry with `"kind": "vocabulary"`.

If the user opted into design-soul discipline (Step 3, item 8), seed that
doc per `../design-soul/SKILL.md` Step 1 and add its `canonicalDocs` entry
with `"kind": "design"`.

## Step 7: Seed the memory file

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

## Step 8: Write the memory README

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

## Step 9: Git-track everything

```bash
git add .snowflake/cortex/memory/config.json .snowflake/cortex/memory/<memoryFile-basename> .snowflake/cortex/memory/README.md
# plus any scaffolded canonical/ownership docs from Step 6
```

Do not commit yet — surface the new files to the user and let them commit
(or run `wrap-up`, which will commit as part of its normal flow).

## Step 10: Report and hand off

Summarize what was created (file list), confirm the config values chosen,
and tell the user: "Run `session-start` at the beginning of future sessions,
and `wrap-up` at the end. Ask `help` any time for a walkthrough of how this
project's memory system works."

## Stopping Points

- ✋ Step 1b: pre-interview answers confirmed before scaffolding a greenfield skeleton
- ✋ Step 3: any live interview question confirmed before moving on
- ✋ Step 4: full draft confirmed before anything is written to disk
- ✋ Step 9: new files surfaced, but not committed without the user's go-ahead

## Output

`.snowflake/cortex/memory/config.json`, a seeded memory file, a memory
README, and (if requested) a minimal conventions doc and ownership-map doc —
all git-tracked but uncommitted, ready for the user's first `wrap-up`.

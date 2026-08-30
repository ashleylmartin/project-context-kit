---
name: design-soul
description: "Active discipline for a project's visual/interaction rules: design tokens, component conventions, and interaction rules, plus an optional scratch doc for half-formed ideas that graduate one-way into the canonical doc once solidified. Reads config.json's canonicalDocs entry tagged kind: \"design\" for the doc path (defaults to DESIGN.md if the project hasn't set one up yet). Triggers: design soul, design tokens, add a design token, component convention, interaction rule, design decision, graduate scratch, design scratch doc, what's our design system say about."
---

# Design Soul

Keeps one project's visual/interaction rules in one place: tokens (color,
spacing, type scale, motion — whatever the project actually uses),
component conventions, interaction rules, and ADR-lite decisions for
design tradeoffs that were actually debated. Same active-discipline shape
as `domain-vocabulary` — touched inline the moment a token or convention is
introduced or a design decision is made, not batched at wrap-up.

## Step 0: Locate the doc

Read `.snowflake/cortex/memory/config.json` and find the `canonicalDocs`
entry with `"kind": "design"`.

- **Found** — that entry's `path` is the design doc. Use it.
- **Not found, but `config.json` exists** — this project hasn't opted into
  design-soul discipline yet. Ask once: "This project doesn't have an
  active design doc yet — set one up now (default `DESIGN.md`) or skip for
  this session?" On yes, go to Step 1 (seed) before doing the requested
  action; on skip, answer inline/ephemerally and don't ask again this
  session.
- **`config.json` doesn't exist at all** — direct the user to `bootstrap`
  first; design-soul depends on the same config file every other subskill
  reads from.

## Step 1: Seed the doc (first use only)

Default to `DESIGN.md` at repo root unless the user names a different path:

```markdown
# <Project Name> — Design Soul

## Tokens

| Token | Value | Used in |
|---|---|---|

## Component Conventions

[none yet — fills in as real components are built]

## Interaction Rules

[none yet]

## Decisions

[ADR-lite entries land here as they're made — see below for the format.]
```

Register it: add `{ "path": "DESIGN.md", "owns": "design tokens, component conventions, interaction rules, design decisions", "kind": "design" }`
to `canonicalDocs` in `config.json`, and add a matching row to
`ownershipDoc`'s table if one is configured. Git-track but don't commit —
same rule as every other write in this plugin.

## Capabilities

### Add or update a token / convention / rule

Add a row (tokens) or a bullet (conventions/rules) directly. Keep each
entry to what it actually is — a value and where it's used for tokens, a
one-line rule for conventions. If describing it needs a real tradeoff
explanation, that's a decision — route it through "Record a decision"
below instead of padding the token/convention entry.

If the token is also declared literally in a second file (e.g. a CSS
variable mirroring this doc's value) and `config.json`'s `semanticRegistry`
is set, add a matching `valueAgreement` entry there in the same turn — see
`../semantic-registry/SKILL.md` Step 2. Same for a convention naming a
specific code symbol: add a `codeReferences` entry. Skip silently if
`semanticRegistry` isn't configured; the doc entry itself is written
either way.

### Challenge a design decision / sharpen a fuzzy rule

When two components disagree on spacing, a "rule" is really just a vibe
nobody pinned down, or a genuine tradeoff needs resolving (e.g. "should
this token be semantic or literal?") — load `../frontier-interview/SKILL.md`
and run it scoped to that question. Once resolved, write the result as a
token/convention/rule row plus an ADR-lite entry if it involved a real
tradeoff.

### Record a decision (ADR-lite)

Append under `## Decisions`, most recent last — identical format to
`domain-vocabulary`'s:

```markdown
### <short title> — <date>
- **Context:** [1-2 sentences]
- **Decision:** [what was decided]
- **Why:** [the actual reason]
```

### Scratch / staging doc (optional)

For projects still exploring a design direction, a separate scratch file
(default `DESIGN_SCRATCH.md`, sibling to the canonical doc) can hold
half-formed ideas — palettes being tried, conventions being debated,
component sketches not yet agreed on. This file is intentionally **not**
a `canonicalDocs` entry — it's disposable working space, not a source of
truth.

- **Graduation is one-way**: content moves from scratch → canonical
  (`DESIGN.md`) once it's actually settled, never the reverse. Once
  graduated, remove it from the scratch file — don't leave the same
  content living in both places.
- Offer to create the scratch doc the first time a half-formed idea comes
  up mid-session rather than during Step 1 seeding — most projects never
  need it, so don't scaffold it preemptively.
- `wrap-up`'s pattern-promotion check (Step 3) is a natural trigger for
  "does anything in scratch look settled enough to graduate now?" — but
  this skill's graduation capability can also be invoked directly, any
  time.

## What this does NOT do

- No per-language AST cross-reference registry, no lint-codegen, no
  automated hex-parity checking across CSS files — that stays a Non-Goal
  for this plugin. `semantic-registry` (separate, opt-in subskill) covers
  the generalizable grep-based version of that idea, populated inline by
  this skill (see above) — this skill is the authoring/discipline side
  only, never the checker itself.
- Does not replace `AGENTS.md` or an architecture doc — this owns visual
  and interaction rules specifically.

## Output

An updated design doc (and/or scratch doc), git-tracked but left for the
user/`wrap-up` to commit.

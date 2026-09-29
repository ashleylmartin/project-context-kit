# project-context-kit

This repo *is* the plugin — a CoCo skill plugin, not an app. There's no
build/test/dev-server step; "development" here means authoring and
maintaining `skills/*/SKILL.md` files.

## Commands

- `npm run changeset` — describe a change, pick a version bump.
- `npm run version` — runs `changeset version`, then
  `scripts/sync-plugin-version.mjs` to copy the new version into both
  `.cortex-plugin/plugin.json` and `.claude-plugin/plugin.json`.
- `npm run check-plugin-version` — verify `package.json` and both
  `plugin.json` manifests agree, without changing anything.

## Conventions

### Writing a skill

Read `skills/writing-for-agents/SKILL.md` before drafting or editing any
`SKILL.md` — it's this repo's own authoring standard (context pointers,
progressive disclosure, completion-criteria rigor, leading words, and
pruning against duplication/sediment), and every skill in `skills/` should
be held to it.

Reuse this repo's existing leading words instead of inventing synonyms:
**frontier** (`frontier-interview`'s decision tree), **canonical doc** (the
single source of truth `config.json`'s `canonicalDocs` points at),
**ADR-lite** (the short context/decision/why format shared by
`domain-vocabulary`/`design-soul`), **active discipline** (touched inline,
never batched at wrap-up).

`bootstrap/SKILL.md` carries a `disable-model-invocation: true` frontmatter
field — this is speculative (CoCo's `skill` tool routes purely off
`description` text as far as could be confirmed; there's no documented
support for excluding a skill from model invocation). Don't rely on it
doing anything; if a skill genuinely needs to be user-typed only, that has
to come from how its `description`'s trigger phrases read, same as every
other skill here.

### What must stay in sync when you add, rename, or remove a skill

None of this is script-enforced — it's a manual checklist:

- Add/update its row in this README's skill table (one-liner should state
  the skill's *defining constraint* — what makes it behave differently
  from the obvious default — not just name its topic).
- If it reads or writes `config.json`, note the field(s) it owns in
  `skills/references/config-schema.md`.
- If it's a rename, grep the whole `skills/` tree for the old name — cross
  references between skills are relative `SKILL.md` paths
  (`../other-skill/SKILL.md`), not IDs, so a rename breaks every link to
  it until each is updated by hand.
- Add a `CHANGELOG.md`/changeset entry.

### When a capability belongs in an existing vocabulary skill vs. a new skill

Three vocabulary skills exist on purpose, each owning a distinct kind of
language: `domain-vocabulary` (naming/terminology, persists to
`CONTEXT.md`), `design-soul` (visual/interaction/tokens, persists to
`DESIGN.md`), `codebase-design` (module/interface/architecture, persists
nothing — routes hard trade-offs to `domain-vocabulary`'s decision log).
A new capability belongs inside one of these three if it's still naming,
design, or architecture vocabulary respectively — extend the existing
skill. It only warrants a fourth skill if it's a genuinely distinct kind of
language none of the three cover, not just a new technique within one of
them (the way "discuss concrete scenarios" and "cross-reference with code"
are techniques *within* `domain-vocabulary`, not skills of their own).

### Git / release conventions

Standard [Changesets](https://github.com/changesets/changesets) flow — see
README's "Release process" section for the full sequence. This repo has no
CI test suite; `npm run check-plugin-version` is the only automated check.

## Architecture

Two categories of skill (see `skills/help/SKILL.md`'s "How the skills fit
together" for the user-facing version of this same map):

- **Lifecycle**: `bootstrap` → `session-start` → (work) → `wrap-up`, with
  `doctor` as an out-of-band audit/repair command. These own
  `.snowflake/cortex/memory/config.json` and the budgeted memory file —
  this kit's one genuinely novel contribution (no equivalent exists in
  comparable skill sets reviewed while designing 1.0).
- **Vocabulary disciplines**: `domain-vocabulary`, `design-soul`,
  `codebase-design` — each an active, inline-touched discipline, the first
  two persisting to a canonical doc, the third persisting nothing of its
  own.
- **Shared primitives**: `frontier-interview` (decision-tree interview
  loop other skills compose with), `interview-me`/`interview-with-docs`
  (named entry points into it), `semantic-registry` (opt-in grep-based
  drift checker underneath the vocabulary disciplines), `writing-for-agents`
  (the authoring standard above, also shipped as a user-facing skill).

`CONTEXT.md` at this repo's own root is this plugin's *own*
`domain-vocabulary` doc — decisions about the plugin's own design land
there in the same ADR-lite format the skill defines, dogfooded on this
repo. `.agents/out-of-scope.md` holds this plugin's declined-scope calls
with rationale — check it before re-proposing something already decided
against.

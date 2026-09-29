# Out of scope

This plugin's own declared non-goals, with rationale — consolidates what's
otherwise scattered across each skill's "What this does NOT do" section.
Recorded so a future session doesn't re-litigate a call already made.

## No bucket/staging directories (`in-progress/`, `deprecated/`)

Considered when comparing against mattpocock-skills' `engineering/`/
`productivity/`/`misc/`/`in-progress/`/`deprecated/` bucket structure for
this kit's 1.0. This kit is small (12 skills) and every skill in `skills/`
is meant to be shipped — there's no backlog of half-finished or retired
skills big enough to warrant a promotion pipeline. Revisit if `skills/`
ever grows enough that "is this skill actually finished?" becomes a real
question for more than one skill at a time.

## No external docs-page publishing

mattpocock-skills publishes a human-facing docs page per promoted skill to
an external site, with its own template and conventions. This plugin is
personal-install-only (see README) — there's no external audience to
publish to, and the README skill table plus each `SKILL.md` already serve
that purpose for the one audience that exists (someone installing this
plugin for themselves).

## No config-schema migration engine

See `CONTEXT.md`'s "Adopt mattpocock-skills' authoring discipline for 1.0"
decision. `doctor` gained a `configVersion` staleness check (visibility
only) instead of a general migration mechanism, because no actual
breaking `config.json` schema change exists yet to migrate — building a
migration engine speculatively, before a real case exists to shape it
around, would guess wrong. Revisit the first time a future version
actually needs to rename or restructure a `config.json` field.

## No per-language AST verification anywhere in this kit

`semantic-registry` (drift checking) and `design-soul` (token/convention
tracking) are both explicitly text/regex-level, never a real parser for
any language. Building and maintaining a per-language AST layer is a
permanent maintenance surface this kit's grep-based approach avoids by
design — the known limitation (e.g. a banned synonym embedded inside a
camelCase identifier won't be caught) is accepted, not a bug to eventually
fix. See `semantic-registry/SKILL.md`'s and `codebase-design/SKILL.md`'s
own "What this does NOT do" sections for the specifics.

## No renaming `domain-vocabulary`/`design-soul` to match `domain-modeling`

mattpocock-skills names its naming-vocabulary skill `domain-modeling`; this
kit's equivalent is `domain-vocabulary`. Renaming to match would cost a
`config.json` `kind` value, a README row, and every cross-reference across
5+ files, for zero behavior change — the names already mean the same thing
in context. Not worth it.

---
"project-context-kit": major
---

1.0: adopt mattpocock-skills' authoring discipline and add two new vocabulary skills.

- **New `writing-for-agents` skill** — a shared authoring standard (context
  pointers, progressive disclosure, completion-criteria rigor, leading
  words, anti-duplication/anti-sediment pruning) used both by this plugin's
  own maintainers and by anyone writing their own `AGENTS.md`/skills.
- **New `codebase-design` skill** — deep-module vocabulary (module,
  interface, depth, seam, adapter, leverage, locality) for designing a
  module's shape. Routes any hard trade-off it surfaces into
  `domain-vocabulary`'s ADR-lite decision log rather than keeping its own.
- **`domain-vocabulary` gains three capabilities**: concrete-scenario
  stress-testing for fuzzy domain relationships, cross-referencing stated
  rules against actual code, and an explicit 3-part test for when an
  ADR-lite entry is warranted (hard to reverse, surprising without
  context, result of a real trade-off — replacing the previous vaguer
  criterion). Also adds optional multi-context support via a root
  `CONTEXT-MAP.md` for large repos with more than one bounded context.
  `design-soul`'s ADR trigger now points at the same 3-part test.
- **`bootstrap`/`doctor` gain lightweight version-awareness**: `bootstrap`
  now records the installed plugin's version in `config.json`'s new
  `configVersion` field; `doctor` flags a mismatch against the currently
  installed version and points at `CHANGELOG.md` (visibility only — not a
  migration mechanism).
- **`help` gains a "how the skills fit together" map** covering all 12
  skills.
- Minor duplication fixes in `doctor` (cross-references `session-start`'s
  lock-file format and plan-directory conventions instead of silently
  re-deriving them).

---
name: semantic-registry
description: "Grep-based, config-gated, opt-in drift checker: banned synonyms used as identifiers, documented code references that no longer exist, and multi-file value agreement (e.g. a design token declared in two places that have drifted apart). Not a per-language AST/lint system -- best-effort text matching only. Triggers: semantic registry, check for drift, banned synonym check, is this term still accurate, check value agreement, register this term for drift checking."
---

# Semantic Registry

A standalone, opt-in drift checker that catches the *opposite* direction
from `frontier-interview`'s doc-freshness pass: that pass catches
under-documentation (a decision made, never written down); this catches
**staleness** — something *was* documented, and the code (or a sibling
doc) has since drifted away from the claim. Together they make docs↔code
coherence bidirectional.

This is a grep-based checker, not a real per-language parser — see
Non-Goals below. It composes with `domain-vocabulary`/`design-soul` (which
populate the registry as terms/tokens are defined) but never runs on its
own initiative; it only fires as part of `wrap-up`'s quality gate, and
only in projects that opted in.

## When this is offered

`bootstrap` only offers to enable this if `domain-vocabulary` and/or
`design-soul` were already enabled in the same run — terms and tokens have
to come from somewhere, and those two skills are the only source. If
neither is enabled, don't offer this skill at all (nothing to register
yet).

## The registry file

A single JSON file, path stored in `config.json`'s `semanticRegistry`
field (default `.snowflake/cortex/memory/semantic-registry.json`), with
three arrays — one per check kind:

```json
{
  "bannedSynonyms": [
    { "term": "tenant", "avoid": ["customer", "org"], "sourceDoc": "CONTEXT.md" }
  ],
  "codeReferences": [
    { "term": "tenant", "symbol": "TenantId", "sourceDoc": "CONTEXT.md" }
  ],
  "valueAgreement": [
    {
      "name": "primary-color-hex",
      "sourceDoc": "DESIGN.md",
      "files": [
        { "path": "DESIGN.md", "pattern": "primary:\\s*(#[0-9a-fA-F]{6})" },
        { "path": "src/theme/tokens.css", "pattern": "--color-primary:\\s*(#[0-9a-fA-F]{6})" }
      ]
    }
  ]
}
```

- **`bannedSynonyms`** — one entry per glossary/token term that has
  `Avoid` synonyms. Repo-wide, whole-word grep for each `avoid` string,
  outside the `sourceDoc` itself. Flags any hit.
- **`codeReferences`** — one entry per term/token whose glossary/design
  entry names a specific code symbol or class name. Repo-wide grep for
  that `symbol`; flags **zero matches** (the symbol was renamed/removed
  but the doc still claims it exists).
- **`valueAgreement`** — one entry per named value that must agree across
  N files (generalizes comp-in-a-box's CSS-token-parity check beyond CSS
  specifically). Each `files[]` entry gives a path and a regex whose first
  capture group extracts the value from that file; flags any disagreement.

## Step 1: Seed the registry (first use only)

If `config.json` has no `semanticRegistry` field yet, create an empty
registry (`{"bannedSynonyms": [], "codeReferences": [], "valueAgreement": []}`)
at the default path, set `semanticRegistry` in `config.json`, and add the
checker command to `qualityGate` if it isn't already there:

```
node ~/.snowflake/cortex/plugins/project-context-kit/scripts/check-semantic-registry.mjs .
```

(That absolute path assumes this plugin is installed at the standard
per-user location. If it's installed elsewhere on this machine, use the
actual install path instead.)

## Step 2: Populate entries as terms/tokens are resolved

This mirrors how `domain-vocabulary`/`design-soul` already update their
own docs inline, never batched:

- Whenever `domain-vocabulary` defines a term with a non-empty `Avoid`
  column, add a matching `bannedSynonyms` entry here (same run, not
  deferred).
- Whenever a glossary/design entry documents a specific code symbol or
  class name it corresponds to, add a matching `codeReferences` entry.
- Whenever a design token is declared in more than one file (the doc plus
  the actual CSS/theme file, for example), add a `valueAgreement` entry
  with a regex per file.

Only do this if `config.json`'s `semanticRegistry` is actually set — if
the project hasn't opted in, `domain-vocabulary`/`design-soul` skip this
step silently (their own docs still get written normally).

## Step 3: Running the check

This never runs standalone as its own command — it surfaces as the
`qualityGate` entry from Step 1, executed by `wrap-up` Step 4 like every
other quality-gate command, in order, stopping and reporting on failure
like the rest of the gate. The script itself:

1. Exits 0 immediately if `config.json` has no `semanticRegistry` path
   (not opted in — harmless even if the command is present in
   `qualityGate` from a copy-pasted config).
2. Runs all three check kinds against `git ls-files` (git-tracked text
   files only — naturally excludes `node_modules/`, build output,
   anything the project's `.gitignore` already excludes).
3. Prints every finding to stderr and exits 1 if any exist; exits 0 with
   "no drift found" otherwise.

## Non-Goals (explicit)

- **No per-language AST verification.** This never parses code as code —
  every check is a text-level regex match. A term embedded inside a
  camelCase identifier (`chargeCustomer` vs. the banned synonym
  `customer`) will not be caught by the synonym check — only a standalone
  identifier match will. This is a known, accepted limitation, not a bug
  to eventually fix.
- **No codegen, no lint-rule authoring for the target project's own
  linter.** This is a standalone checker script this plugin ships, not an
  ESLint/Ruff/etc. rule generator.
- **No automatic entry population beyond what Step 2 describes.** Nothing
  scans the whole codebase to infer registry entries on its own — every
  entry traces back to an explicit `domain-vocabulary`/`design-soul`
  action.

## Output

An updated `semanticRegistry` JSON file (when populating), or — when
invoked as part of `wrap-up`'s quality gate — a pass/fail result with a
findings list on failure.

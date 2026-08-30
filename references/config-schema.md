# Config Schema — `.snowflake/cortex/memory/config.json`

This file is the single generalization seam. Every other skill in this package
(`session-start`, `wrap-up`, `help`) reads it instead of hardcoding paths,
commands, or project names. `bootstrap` is the only skill that writes it
(aside from `wrap-up`, which may update `planSources` or `canonicalDocs` if
the user adds one mid-project — always via explicit user confirmation, never
silently).

## Fields

```json
{
  "projectName": "my-app",
  "memoryFile": ".snowflake/cortex/memory/my-app.md",
  "memoryReadme": ".snowflake/cortex/memory/README.md",
  "budgetLines": 80,
  "budgetKB": 6,
  "ownershipDoc": "docs/KNOWLEDGE_MAP.md",
  "canonicalDocs": [
    { "path": "AGENTS.md", "owns": "commands, structure, conventions, gotchas" }
  ],
  "planSources": [".snowflake/cortex/plans/*.plan.md"],
  "qualityGate": ["npm run lint", "npm test"],
  "patternPromotionTarget": "AGENTS.md",
  "neverStage": [".env.local", "node_modules/", "*.tsbuildinfo"],
  "releaseNotesFile": "docs/RELEASE_NOTES.html",
  "commitFooter": ".... Generated with [Cortex Code](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code)\n\nCo-Authored-By: Cortex Code <noreply@snowflake.com>"
}
```

| Field | Type | Meaning |
|---|---|---|
| `projectName` | string | Used in the memory file's H1 and in commit-message context. |
| `memoryFile` | string (repo-relative path) | The single git-tracked memory file. One file, not a directory of topic files — that structure is what caused the original bloat this system fixes. |
| `memoryReadme` | string | Conventions doc for the memory file itself — the Key Principle, budget rule, cross-machine sync note. |
| `budgetLines` | number | Soft cap on line count. Advisory on its own — see `budgetKB`. |
| `budgetKB` | number | Hard cap on file size. **Check both** — a dozen paragraph-length bullets can pass a line-count check while blowing past the KB budget. This is the actual over-budget signal that triggers synthesis in `wrap-up`. |
| `ownershipDoc` | string or null | Path to the "one concept, one home" ownership-map doc, if the project has one (created by `bootstrap` on request). Null if the project intentionally skips this — `wrap-up`'s pattern-promotion check then just targets `patternPromotionTarget` directly. |
| `canonicalDocs` | array of `{path, owns}` | What each canonical doc is authoritative for. `wrap-up` uses this to decide whether something belongs in memory (if it's already covered here, prune it from memory) or should be promoted here instead. |
| `planSources` | array of glob patterns | Where in-flight plans/specs live. `wrap-up`'s plan-hygiene step scans all of these. Empty array is valid — means the project does not track plans as files. |
| `qualityGate` | array of shell commands | Run in order during `wrap-up`'s quality gate step. Empty array means skip the gate (e.g. project has no build/test step yet). |
| `patternPromotionTarget` | string | Doc that new cross-cutting patterns get appended to when `wrap-up`'s "pattern check" says yes. Usually one of `canonicalDocs`. |
| `neverStage` | array of path/glob strings | Files `wrap-up` must never `git add`, even implicitly — always-locally-modified files (`.env.local`), build artifacts, lockfiles the project doesn't want touched by this workflow. |
| `releaseNotesFile` | string (repo-relative `.html` path) or null | If set, `wrap-up` full/sprint modes maintain it as a living doc via `../references/release-notes.md` (a real adapted skill — signal gathering, audience/newsworthiness categorization, single-file HTML output). Each run inserts one new dated entry, then also collapses old entries into a summary and removes verifiably superseded content — see that file for the full mechanic and its since-commit anchor. If null, that step is skipped entirely — it is optional, not core to the memory system. |
| `commitFooter` | string | Appended to every commit message `wrap-up` creates. |

## Validation rules (`bootstrap` and `help` both check these)

- `memoryFile` and `memoryReadme` must be inside a git-tracked directory (bootstrap creates `.gitkeep`-style tracking by writing real content, never an empty dir).
- `budgetLines` and `budgetKB` must both be present — one without the other defeats the point (see the `budgetKB` note above).
- `qualityGate` commands are stored as literal strings, run via the shell exactly as given — no templating. If a command needs a working directory other than repo root, the string should `cd` itself.
- `canonicalDocs[].path` should point at files that exist (or that `bootstrap` just created) — a dangling pointer here means memory has nowhere to defer to, which is how the original system re-accumulated cruft.
- `releaseNotesFile`, if set, should end in `.html` — `../references/release-notes.md` produces a single-file HTML page (the `html-authoring` skill's sandbox format), not markdown.

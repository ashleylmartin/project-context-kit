
# project-context-kit 1.0 upgrade

## Context

Reviewed both plugins in full:

- **Ours** (`/Users/ashley.martin/Development/project-context-kit`): 10 skills — `bootstrap`, `session-start`, `wrap-up`, `doctor`, `help`, `domain-vocabulary`, `design-soul`, `frontier-interview`, `interview-me`, `interview-with-docs`, `semantic-registry`. A budgeted cross-session memory system with git continuity plus two "active discipline" vocabulary docs.
- **mattpocock-skills** (`~/.snowflake/cortex/plugins/mattpocock-skills`): a much larger, more mature skill set for full software-delivery flows (grill → spec → tickets → implement → review), governed by an explicit `writing-for-agents` authoring standard and repo-level ADR/out-of-scope conventions.

**Important finding: these kits don't actually overlap much.** Matt's kit has no analog to our memory-budget/session-continuity system at all — that's our novel contribution and stays untouched. The real overlap is narrow: our two "active discipline" doc-writing skills (`domain-vocabulary`, `design-soul`) versus his `domain-modeling`/`codebase-design`, our `frontier-interview` versus his `grilling`, and our lack of any authoring-standard skill versus his `writing-for-agents`.

## Decisions already made with the user

1. **Ship `writing-for-agents` as a real skill**, not just an internal governance doc — reachable by kit users writing their own skills/AGENTS.md, and used by us as the audit standard for every other skill.
2. **Add `codebase-design` as new in-scope skill** — a third vocabulary skill (architecture, alongside naming and design-token vocab), model-invoked, no canonical-doc writing of its own.
3. **Fold in all of domain-modeling's missing techniques**, but explicitly **skip adding a new bootstrap config knob** to gate them. Three of the four are *techniques applied contextually* (scenario stress-testing, code cross-referencing, the 3-part ADR test) — they cost nothing when not triggered, so they don't need a toggle, matching how domain-modeling itself doesn't gate them. The fourth (multi-context `CONTEXT-MAP.md` support) is a *structural* mode, not a technique — it should auto-detect off the presence of a root `CONTEXT-MAP.md` file rather than asking a setup question, consistent with this kit's existing "create files lazily" ethos.
4. **Keep the flat `skills/` directory** — no `in-progress/`/`deprecated/` staging buckets. Our kit is small (10→12 skills) and doesn't need a promotion pipeline.
5. **Add lightweight version-awareness to `doctor`, not a migration engine.** No schema-breaking change exists in this release (every new capability below lives in skill body text, which is read fresh each session — already-bootstrapped projects get it automatically, nothing to migrate). Building a general migration framework now for a hypothetical future breaking change would be the exact speculative abstraction `writing-for-agents`' pruning discipline warns against. The minimal, actually-useful version: `bootstrap` records the plugin version it ran with in `config.json`; `doctor` compares that against the installed plugin's current version and, on mismatch, surfaces it and points at `CHANGELOG.md` — visibility, not automated migration. This gives a real hook to attach actual migration logic to later, if and when a real breaking change happens.

## What is explicitly NOT being ported from mattpocock-skills

- **Model-invoked vs user-invoked frontmatter split** (`disable-model-invocation`, `agents/openai.yaml` policy blocks) — this is a Claude Code/Codex-specific mechanism. I found no evidence CoCo's skill system supports an equivalent frontmatter field (the `skill` tool routes purely off `description` text). Don't claim this works; if the user wants user-invoked-only behavior for something like `bootstrap`, that's steered by description wording alone, which is already how every skill here works.
- **External docs pages** (`docs/<bucket>/<skill>.md`, published to aihero.dev) — we don't publish externally; README's skill table is our equivalent surface. We WILL borrow the underlying principle ("state the defining constraint") for tightening README's one-liners.
- **Bucket/promotion staging** — per decision 4 above.
- **A full `ask-matt`-style flow-map skill** — overkill for 10-12 tool-like skills vs matt's dozens of pipeline-stage skills. Instead, extend `help` with a lighter "how the skills fit together" section (Task 5).
- **A general config-migration engine** — per decision 5 above.

## Task detail

### 1. `skills/writing-for-agents/SKILL.md`
Adapt matt's version (read in full during research — covers context pointers; the two loads; the information hierarchy of in-file step / in-file reference / disclosed reference; progressive disclosure; co-location; sprawl; completion-criteria clarity+demand and premature completion; when to split by sequence; leading words and the negation trap; pruning for single-source-of-truth, environment-as-cache, relevance/sediment, and no-ops). Strip anything CoCo-incompatible (the Claude/Codex invocation-mode section, `SKILL-MECHANICS.md` cross-reference to a file we won't create — fold anything essential from that inline instead). Model-invoked; description should trigger on "writing a skill", "writing AGENTS.md", "skill feels verbose", etc.

### 2. Audit pass on existing 10 skills
Using Task 1's standard as the checklist, re-read each skill and specifically hunt for:
- Restated defaults (no-ops) — anything the model would already do without being told.
- In-file reference that only some branches need — push behind an explicit sub-heading or, if large, a disclosed reference.
- Weak completion criteria — anywhere a step ends on a fuzzy bound rather than a checkable one.
- Duplicated meaning across skills (e.g. the ADR-lite format block appears near-identically in both `domain-vocabulary` and `design-soul` today — after Task 3 both will also carry the 3-part test; consider whether that shared block should have one canonical home one of them points to, rather than two literal copies drifting apart over time).
`bootstrap` (404 lines) and `wrap-up` (389 lines) are the largest and most likely to carry sediment — prioritize those two.

### 3. Domain-vocabulary depth
In `skills/domain-vocabulary/SKILL.md`, add under a capability heading each:
- **Discuss concrete scenarios**: when domain relationships are being discussed, invent edge-case scenarios that force precision about boundaries between concepts (matt's exact framing — port near-verbatim, it's already tight).
- **Cross-reference with code**: when the user states how something works, check whether the code agrees; if it contradicts, surface it before writing anything down.
- **Replace the ADR trigger**: swap the current "if the resolution involved a real tradeoff, not just a definition" language for the explicit 3-part test (hard to reverse; surprising without context; result of a real trade-off — all three required). Apply the identical replacement to `design-soul`'s ADR section, since it currently mirrors the vaguer version.
- **Multi-context support**: add a short "File structure" section (matt has this almost verbatim) — single-context default (current behavior, unchanged), and if a root `CONTEXT-MAP.md` exists, resolve which context's `CONTEXT.md` and `docs/adr/` apply based on what's being discussed, falling back to the root map's own docs/adr for cross-context decisions. `bootstrap` does NOT change — it keeps seeding a single `CONTEXT.md`; multi-context only activates if a project later adds `CONTEXT-MAP.md` by hand (document this escape hatch in `domain-vocabulary`, not in `bootstrap`).

### 4. `skills/codebase-design/SKILL.md`
Port the glossary (module, interface, implementation, depth, seam, adapter, leverage, locality), deep-vs-shallow ASCII diagrams, the deletion test, the "one adapter = hypothetical seam, two = real" rule, and the testability principles. Generalize code examples beyond TypeScript (keep the shape, drop the language-specific syntax or make it illustrative-only). Explicitly state it does not maintain its own canonical doc — a surfaced hard trade-off routes into `domain-vocabulary`'s "Record a decision" capability, same as any other ADR-worthy decision in this kit.

### 5. `help` skill map section
Add a section (fires regardless of configured/unconfigured state) laying out: the lifecycle skills in sequence, the three now-existing vocabulary skills as inline disciplines usable anytime, `doctor` as audit-anytime, `semantic-registry` as the opt-in checker underneath vocabulary/design decisions, `writing-for-agents` as the meta-reference for anyone extending this kit or writing their own skills.

### 6. This repo's `AGENTS.md`
Replace the two placeholder sections with real content: a skill-authoring checklist referencing `writing-for-agents`; the concrete sync obligations when adding/renaming a skill (README table row, `.cortex-plugin/plugin.json` + `.claude-plugin/plugin.json` — already kept in lockstep by `scripts/sync-plugin-version.mjs`, but skill additions themselves aren't script-checked, so state the manual rule plainly); guidance on when a new capability belongs inside an existing vocabulary skill (`domain-vocabulary`/`design-soul`/`codebase-design`) versus warranting a new skill.

### 7. README / CONTEXT.md / CHANGELOG / changeset
- README skill table: add `codebase-design` and `writing-for-agents` rows; revisit every existing row's one-liner against "state the defining constraint" (what makes this skill behave differently from the obvious default) rather than just naming its topic.
- `CONTEXT.md`: add a Decisions entry for this 1.0 upgrade, in this kit's own ADR-lite format (context/decision/why) — dogfooding our own skill on our own repo, as it already does.
- Changeset: major bump to `1.0.0` (new skills + behavior changes to `domain-vocabulary`/`design-soul` warrant major per this kit's existing conventions).

### 8. Version-awareness in `bootstrap` + `doctor`
- `bootstrap`: write a `configVersion` field to `config.json` at seed time, set to the installed plugin's current version (read from `.cortex-plugin/plugin.json` or equivalent at bootstrap-run time).
- `doctor`: as one of its existing drift checks, compare `config.json`'s `configVersion` against the currently-installed plugin version. On mismatch, report it plainly (e.g. *"config was bootstrapped with v0.2.0; plugin is now v1.0.0 — check CHANGELOG.md for anything worth opting into"*) and, if `configVersion` is missing entirely (pre-1.0 projects), offer to backfill it to the current version with confirmation, same as any other doctor fix.
- No migration logic beyond this — visibility only, per decision 5.

### 9. (Optional, do last, cut if not worth it) `.agents/out-of-scope.md`
A short file recording this plugin's own declined-scope calls with rationale (no bucket staging, no external docs publishing, no per-language AST tooling in `design-soul`/`semantic-registry`, no config-migration engine) — consolidates what's currently scattered across each skill's "What this does NOT do" section into one place a maintainer can scan. Only do this if Tasks 1-8 land cleanly and there's appetite for one more file.

## Explicitly out of scope for this pass
- Any change to `bootstrap`/`session-start`/`wrap-up`/`doctor`'s core memory-budget mechanics — those have no mattpocock analog and aren't part of this comparison.
- Renaming `domain-vocabulary`/`design-soul` to match matt's naming (`domain-modeling`) — no functional benefit, real cost (config.json `kind` values, README, cross-references across 5+ files) for zero behavior change.
- A general config-schema migration engine — see decision 5.

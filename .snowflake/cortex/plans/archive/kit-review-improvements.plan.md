# Plan: kit review improvements (1.2.0)

One minor release covering all four items (new doctor checks + template changes make it minor, not patch).

## Task 1 — Consistency fixes
- **Lock ownership**: `session-start` Step 1 also writes the lock around its fetch/pull and removes it after (same format as `wrap-up` Step 6 item 2), so `doctor`'s "both write it" statement becomes true. Keep it advisory.
- **No-remote guard**: wrap the fetch/pull snippets in `session-start` Step 1 and `wrap-up` Step 6 item 6 with `if git remote get-url origin >/dev/null 2>&1; then … else echo "No origin remote — skipping fetch"; fi`.
- **Dead branch**: collapse `session-start` Step 2's if/else into one `cp`, keeping a COLD START message only when the cache was empty.
- **Lite trigger**: delete "a single small fix (few files…)" framing in `wrap-up` Lite section (~line 247) so the "regardless of file count" trigger (~line 274) is the single rule.
- **Ownership claims**:
  - `config-schema.md` intro: writers are `bootstrap` and `doctor` (for `planSources`/`canonicalDocs`/`configVersion`, with confirmation), not `wrap-up`.
  - `config-schema.md` validation header: checked by `bootstrap` (on write) and `doctor` (on audit); `help` only reports.
  - `memory-budget.md` line 3: "Shared by `wrap-up`, `doctor`, and `help`"; lines 13–16: say the principle lives in the memory file header (Task 3) and at the top of `wrap-up`, drop the false `session-start` claim — or add one line restating it in `session-start` Step 3. Choose: add the one line to `session-start` (cheap, matches stated intent).
- **Duplicated snippets**: new `skills/references/paths.md` defining the sanitized-cwd expression, cache path, lock path, and the plan-dir convention list once. `session-start`, `wrap-up`, `doctor`, `references/session-start-hook.md` keep their runnable snippets (agents need them inline) but drop the "keep in sync" notes and point at `paths.md` as the source of truth.
- **Dogfood**: add `"configVersion": "1.2.0"` to this repo's `config.json` (after the version bump).

## Task 2 — New doctor checks
Add to `doctor` Step 4 (budget) two read-only lints, reported, never auto-fixed (`wrap-up` synthesis treats them):
```bash
grep -c '^- \*\*Session:\*\*' "<memoryFile>"            # >1 → changelog drift
awk 'length > 300 {print NR": "length" chars"}' "<memoryFile>"  # over-long bullets
```
New Step 2b: if `AGENTS.md` and `CLAUDE.md` both exist at repo root and `CLAUDE.md` isn't just an `@AGENTS.md` import, warn that Claude Code reads CLAUDE.md instead of AGENTS.md; suggest (with confirmation) replacing it with a one-line `@AGENTS.md` shim. Add rows to the Step 7 report template. Also update `memory-budget.md`'s Synthesis trigger: either lint firing counts as over budget.

## Task 3 — bootstrap memory template
In `bootstrap`'s seeded memory file:
- Two-line Key Principle header under the H1.
- Session State documented as **exactly one** current bullet (replace, don't append).
- Optional `## Blockers` and `## Known Gaps` sections (omit when empty).
- Note under Gotchas: point at dated canonical-doc entries ("see CONTEXT.md 2026-11-05") instead of restating.
Mirror the section list in `memory-budget.md` and `wrap-up` Step 1 item 2. Existing projects are unaffected (template only).

## Task 4 — Frontmatter cleanup
- Remove `disable-model-invocation` from `bootstrap/SKILL.md`; delete the AGENTS.md paragraph about it.
- No `version` exists in any skill's frontmatter today, so there's nothing to move into `metadata` — skip.
- Don't add `allowed-tools`: it's experimental in the spec and, like `disable-model-invocation`, unconfirmed in CoCo. Record both decisions in `.agents/out-of-scope.md` so they aren't re-proposed.

## Task 5 — Sync docs, release, reinstall
- README skill table: update `doctor` and `bootstrap` one-liners if their defining constraint changed; add `paths.md` mention only if references are listed there.
- `CONTEXT.md`: ADR-lite entry for "one Session State bullet, enforced by doctor lint" (hard to reverse in practice, surprising without context).
- Changeset (minor) → `npm run version` → `npm run check-plugin-version` + `node scripts/check-semantic-registry.mjs .` → commit by logical change (fixes / doctor lints / template / frontmatter) → `npx changeset tag` → confirm push → push with tags → `gh release create v1.2.0` → `cortex plugin update project-context-kit` → diff installed vs dev.

## Verification
- Grep: no `disable-model-invocation`, no "keep in sync" notes left, `configVersion` present.
- Run the two new lint commands against the-cup-2026's memory file (read-only) to confirm they flag its 4 Session entries.

# Release Notes (Single-File HTML One-Pager, Living Doc)

Loaded by `wrap-up/SKILL.md` Step 5 when `config.json`'s `releaseNotesFile` is
set. Produces a single-file HTML changelog aimed at stakeholders — not
developers. It is **additive by default** (each run inserts one new dated
entry) **plus a light living-doc maintenance pass every run**: old entries
collapse into a summary, and content that's been verifiably superseded gets
removed. This keeps the page useful as an ongoing reference rather than an
ever-growing, never-edited log.

Adapted from [tilomitra/release-kit-claude-skills](https://github.com/tilomitra/release-kit-claude-skills)'
`release-notes` skill (MIT License) — same signal-gathering hierarchy and
writing rules, retargeted from a one-shot markdown doc to an append-and-prune
HTML page, with a fallback path for projects that have no GitHub remote or PR
workflow (common for `project-memory` projects — e.g. `therm-incentive` has
no remote configured at all).

## Before writing any HTML

**Load the `html-authoring` skill first.** It owns the sandbox rules this
file must follow: no CDN/external scripts, no `eval`, no runtime network
calls, only the vendored `/libs/` libraries, responsive/light-dark CSS. This
reference covers only what's release-notes-specific — signal gathering,
categorization, writing rules, and the append/prune mechanics below.

## The since-commit anchor

Incremental "what's new since last run" tracking lives in a dedicated,
hidden element — **not** on any visible entry — so visible entries can be
freely collapsed or pruned without ever breaking this mechanic:

```html
<meta name="release-notes-since-commit" content="<full HEAD sha at this run>">
```

Place it in `<head>`. On every run, this is the **only** thing that
determines the diff range, and it is always updated **in place** (replace
the `content` value), never duplicated or appended.

**Migration for files created before this mechanic existed:** if
`releaseNotesFile` already exists, has one or more `.release-entry`
sections, but has **no** `release-notes-since-commit` meta tag yet, fall
back once to reading the topmost entry's `data-since-commit` attribute as
the starting point for this run — then add the meta tag as part of this
run's write, so every subsequent run uses it.

## Step 1: Determine what's new since the last entry

- If the meta tag from above exists, use its `content` value as the
  starting commit: `git log <that-sha>..HEAD`.
- Else if the file exists with entries but no meta tag yet, use the
  migration fallback above.
- Else (file doesn't exist, or exists with no entries at all), use a
  sensible bound: the project's first commit for a small/new repo, or the
  last N commits if the repo is large and old.
- Prefer git tags when the project actually uses them (`git describe --tags
  --abbrev=0`), but don't require them — most `project-memory` projects
  commit straight to `main` with no tagging discipline, and tags are a
  nice-to-have signal, not a prerequisite.

## Step 2: Gather signals (in order of usefulness)

**If this project has a configured issue tracker with PRs** (check
`docs/agents/issue-tracker.md` if the project ran `setup-matt-pocock-skills`,
or ask) — prefer these first, they carry the most intent:

```bash
gh pr list --state merged --search "merged:>=$SINCE_DATE" --json number,title,body,labels --limit 100
gh issue list --state closed --search "closed:>=$SINCE_DATE" --json number,title,body,labels --limit 100
```

**Otherwise — the common case for a `project-memory` project with no remote
or no PR workflow — fall back directly to git**, in this order:

```bash
git log --oneline <since>..HEAD                      # commit subjects
git diff --stat <since>..HEAD                         # files changed, reveals scope
git diff <since>..HEAD -- '*.ts' '*.tsx' '*.py' '*.go' '*.rs' '*.sql' ':!*.lock'   # actual code changes
git diff <since>..HEAD -- '**/*.test.*' '**/*.spec.*' '**/test_*'   # test intent, often clearer than commit messages
git diff <since>..HEAD -- 'package.json' '*.toml' '*.yaml' '*.yml' '*.env.example'   # config/dependency changes
```

Commit messages are the **last** resort, not the first — they're often the
least useful signal (see the source skill's own "fix stuff / wip / update
deps" example). Diffs and test-description changes reveal intent even when
messages don't.

## Step 3: Categorize

**Audience tiers** — sort every change into one:
- **All users** — features and fixes everyone will notice
- **Admins / power users** — config options, admin tools, access changes
- **Developers** — API/SDK changes (only include this tier if the project
  actually has a developer audience — most internal tools don't)

**Newsworthiness filter:**
- **Headline** — the one thing worth leading with
- **Worth mentioning** — a real improvement or fix, but not the headline
- **Skip** — refactors, internal tooling, test-only changes, CI, memory/plan
  hygiene chores (`chore(memory): ...`, plan archival commits). None of this
  belongs in a stakeholder-facing page — it's already visible in git log for
  anyone who needs it.

## Step 4: Writing rules

- Lead with the most exciting change — what a user would actually want to
  know about.
- Write for the audience, not for developers: "You can now export reports as
  CSV," not "Implement CSV serialization in ReportExporter."
- Never mention file names, function names, or other implementation
  internals.
- Active voice: "Add dark mode," not "Dark mode was added."
- Be specific about the benefit: "Search results now load 3x faster," not
  "Improve performance."
- If you can't tell what the user-facing impact is, omit the change
  entirely — don't pad the page with guesses.
- Keep it scannable: short bullets, not paragraphs.

## Step 5: Confirm before writing

Show the drafted entry (headline + categorized bullets) and get explicit
confirmation before inserting it — same as every other write in this
package.

## Step 6: Insert the entry (append)

**If `releaseNotesFile` doesn't exist yet**, create it using the
`html-authoring` skill's file structure template as the base, with the title
"Release Notes", an empty body, and the `release-notes-since-commit` meta
tag from Step 1 — then proceed as below.

**Entry template** — one `<section>` per run:

```html
<section class="release-entry" data-date="<YYYY-MM-DD>">
  <h2>What's New — <YYYY-MM-DD></h2>
  <p class="headline"><strong>Headline:</strong> <the one-line lead></p>

  <h3>New Features</h3>
  <ul>
    <li><strong>Feature name</strong> — user-facing benefit</li>
  </ul>

  <h3>Improvements</h3>
  <ul><li>...</li></ul>

  <h3>Bug Fixes</h3>
  <ul><li>...</li></ul>
</section>
```

Omit any `<h3>` group with nothing in it — don't emit empty "Bug Fixes"
headers. Note `data-since-commit` no longer lives on the entry itself — it
moved to the `<meta>` tag above, so entries carry only `data-date`.

**Insertion point:** immediately before the first existing
`<section class="release-entry">` (or right after the page's intro
paragraph if this is the first entry ever) — so the page always reads
newest-first.

**Update the anchor:** set the `release-notes-since-commit` meta tag's
`content` to the full HEAD sha for this run.

## Step 6b: Living-doc maintenance pass (every run)

After Step 6's insertion, walk the page once more and tidy it. This is the
one explicitly-scoped exception to "don't touch prior entries" — everything
else in this doc still treats existing entries as untouchable outside these
two specific moves:

**1. Retention collapse.** Keep full detail (headline + New
Features/Improvements/Bug Fixes) for the **8 most recent** `.release-entry`
sections (including the one just inserted). For anything older:
- Ensure a `<section id="earlier-updates"><h2>Earlier Updates</h2><ul>...</ul></section>`
  exists at the bottom of the page (create it once, on the first run that
  needs it).
- For each aging-out entry, add one `<li><strong><date></strong> — <headline
  only, no sub-bullets></strong></li>` to that list, newest-first, then
  remove the entry's full `<section>` from the main flow.
- 8 is a fixed default for this skill, not a per-project config option —
  if a project's cadence genuinely needs a different number, that's a
  discussion to have explicitly with the user, not a silent per-run choice.

**2. Stale/superseded content removal.** For entries still in full form,
check each bullet against current reality:
- **Superseded feature:** the bullet describes something a later change
  reverted or removed. Confirm with a quick check against the current
  codebase (grep for the referenced flag/command/page) before concluding
  it's gone — don't guess from the bullet text alone.
- **Duplicate across entries:** the same change is described in two
  different entries (common when a feature shipped incrementally). Keep
  the most recent/most complete phrasing, remove the earlier one.
- If removing bullets empties an entry's `<h3>` group, remove that group;
  if it empties the whole entry, remove the entry (and, if within the
  retention window, don't add it to Earlier Updates either — it never
  happened as far as the current page is concerned).
- **Never** remove a bullet just because it's old — only for being
  verifiably wrong (superseded) or redundant (duplicate). Age alone is
  handled by retention collapse above, not this check.

**Confirmation gate:** this pass can delete previously-published,
stakeholder-visible content — a bigger deal than appending a new entry.
Before writing, show the user: (a) which entries are being collapsed into
Earlier Updates, and (b) which specific bullets/entries are being removed
and why (superseded vs. duplicate). Get explicit confirmation, same as
Step 5, before applying either move.

## Attribution

Signal-gathering hierarchy, categorization tiers, and writing rules adapted
from [tilomitra/release-kit-claude-skills](https://github.com/tilomitra/release-kit-claude-skills)
(MIT License).

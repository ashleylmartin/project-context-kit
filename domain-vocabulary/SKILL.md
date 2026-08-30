---
name: domain-vocabulary
description: "Active glossary/ADR-lite discipline for a project's domain terms: define terms, challenge fuzzy language before it spreads through the codebase, and record short decision records inline as they're made. Reads config.json's canonicalDocs entry tagged kind: \"vocabulary\" for the doc path (defaults to CONTEXT.md if the project hasn't set one up yet). Triggers: define term, add to glossary, what do we mean by, domain vocabulary, sharpen this term, that's a fuzzy term, add an ADR, record this decision, vocabulary doc, glossary."
---

# Domain Vocabulary

Keeps one project's domain language precise and one place: a glossary of
terms (with what to avoid calling them instead) plus lightweight decision
records (ADR-lite — a few lines, not a formal template) for terminology
choices that were actually debated. This is an **active discipline**, not a
one-time doc dump — it's meant to be touched inline, mid-session, the moment
a term gets used loosely or a naming decision gets made, not batched at
wrap-up.

## Step 0: Locate the doc

Read `.snowflake/cortex/memory/config.json` and find the `canonicalDocs`
entry with `"kind": "vocabulary"`.

- **Found** — that entry's `path` is the vocabulary doc. Use it.
- **Not found, but `config.json` exists** — this project hasn't opted into
  domain-vocabulary discipline yet. Ask once: "This project doesn't have an
  active vocabulary doc yet — set one up now (default `CONTEXT.md`) or skip
  for this session?" On yes, go to Step 1 (seed) before doing the requested
  action; on skip, do the requested action ephemerally (answer inline,
  don't write anywhere) and don't ask again this session.
- **`config.json` doesn't exist at all** — this project hasn't run
  `bootstrap` yet. Tell the user and offer to run `bootstrap` instead;
  domain-vocabulary depends on the same config file every other subskill
  reads from.

## Step 1: Seed the doc (first use only)

If Step 0 needs to create the doc, default to `CONTEXT.md` at repo root
unless the user names a different path:

```markdown
# <Project Name> — Domain Vocabulary

## Glossary

| Term | Definition | Avoid |
|---|---|---|

## Decisions

[ADR-lite entries land here as they're made — see below for the format.]
```

Register it: add `{ "path": "CONTEXT.md", "owns": "domain vocabulary, glossary, ADR-lite decisions", "kind": "vocabulary" }`
to `canonicalDocs` in `config.json`, and add a matching row to `ownershipDoc`'s
table if one is configured. Git-track the new file but don't commit it
yourself — surface it and let the next `wrap-up` (or the user) commit.

## Capabilities

### Define or look up a term

Add a `| Term | Definition | Avoid |` row. Keep the definition to one
sentence — if it needs more, that's a sign the term is actually a decision
(route it through "Record a decision" below instead). `Avoid` lists
synonyms that should NOT be used interchangeably once this term is defined
(e.g. `Term: "tenant"`, `Avoid: "customer, org, account"` if this codebase
distinguishes those). Leave `Avoid` blank if there's no real synonym
confusion risk.

If asked to look up a term, just read the table and answer directly — no
need to route through an interview for a read-only lookup.

### Challenge fuzzy language

When a term is being used ambiguously — two people/docs mean different
things by it, or it's never been pinned down and is starting to spread
through code/docs — this is exactly the case `frontier-interview` exists
for. Load `../frontier-interview/SKILL.md` and run it scoped to just this
term: the frontier is "what does this term mean, precisely, in this
codebase" plus any sub-decisions that unlocks (e.g. does it imply a
specific data shape). Once resolved, write the result as a glossary row
(and an ADR-lite entry below if the resolution involved a real tradeoff,
not just a definition).

### Record a decision (ADR-lite)

Append under `## Decisions`, most recent last:

```markdown
### <short title> — <date>
- **Context:** [1-2 sentences — what prompted this]
- **Decision:** [what was decided]
- **Why:** [the actual reason — this is the part worth preserving]
```

Keep it short. This is deliberately lighter than a formal ADR template —
if a decision needs more structure than this, it probably belongs in
`canonicalDocs`' architecture doc instead, not here.

## What this does NOT do

- Does not enforce anything automatically — `semantic-registry` (a
  separate, opt-in subskill) is what greps the codebase for banned
  synonyms; this skill is the authoring/discipline side, not the checker.
- Does not replace `AGENTS.md` or an architecture doc — this owns
  terminology and naming decisions specifically, nothing else.
- Does not batch — every capability above writes inline, the moment it's
  invoked, not deferred to `wrap-up`.

## Output

An updated vocabulary doc (glossary row and/or ADR-lite entry), git-tracked
but left for the user/`wrap-up` to commit — consistent with every other
write in this plugin.

---
name: writing-for-agents
description: "Reference for writing any document an agent consumes: a skill's SKILL.md, an AGENTS.md/CLAUDE.md, or a doc reached by a pointer from one. Covers context pointers, progressive disclosure, completion-criteria rigor, leading words, and pruning against duplication and sediment. Triggers: writing a skill, editing SKILL.md, writing AGENTS.md, writing CLAUDE.md, this skill feels verbose, tighten this doc, is this a no-op, skill authoring, agent-facing docs."
---

# Writing For Agents

Reference for writing any document an agent consumes — a skill, an
`AGENTS.md`/`CLAUDE.md`, a doc reached by a pointer from one of those. The
packaging differs; the writing does not. The same levers make each one
predictable — the agent taking the same *process* every run, not producing
the same output.

Use this whenever you're drafting or editing a `SKILL.md` in this plugin
(or your own), or auditing an existing one for bloat.

## Context pointers

A **context pointer** is a reference held in the agent's context that names
some out-of-context material and encodes the condition for reaching it. A
skill's `description` field is one; a line in `AGENTS.md` naming a doc is
the same object. The pointer's *wording*, not its target, decides when the
agent reaches the material — and how reliably. A must-have target behind a
weakly worded pointer is a variance bug: sharpen the wording first, and
inline the material only if sharpening fails.

A pointer does two jobs — state what the material is, and list the
**branches** that should trigger reaching it (a branch is a distinct case
the document handles, so different runs take different paths through it).
Every word of an always-loaded pointer costs on every turn, so it earns even
harder pruning than the body:

- **Front-load the leading word** — the pointer is where it does its
  triggering work.
- **One trigger per branch.** Synonyms that rename a single branch are one
  branch written twice; collapse them and keep only genuinely distinct
  branches.
- **Cut identity the body already carries.**

In this plugin, that pointer is the `description` field's `Triggers:` list
— every trigger phrase should map to a real branch inside the skill, not a
rephrasing of one already listed.

## The two loads

Every document and pointer you add spends one of two budgets:

- **Context load** — the cost of always-loaded material on the agent's
  window: a skill `description`, an `AGENTS.md` line, anything sitting in
  context every turn, spending tokens and attention whether or not it fires.
- **Cognitive load** — the cost on the human: which documents exist and when
  to reach for each. The human is the index. Not a cost to minimize — it is
  the price of human agency; spend it where human judgment matters, remove
  it where it does not.

Material reached only through a pointer escapes context load at the price
of the pointer's own line; material with no pointer at all rides entirely
on cognitive load.

## Information hierarchy

A document is built from two content types — **steps** (the ordered actions
the agent performs) and **reference** (definitions, rules, facts consulted
on demand) — that mix freely. The core decision is where each piece sits on
the **information hierarchy**, a ladder ranked by how immediately the agent
needs the material:

1. **In-file step** — the primary tier: what the agent does, in order.
2. **In-file reference** — consulted on demand. Often a legitimately flat
   peer-set (this doc's own headings, for example) — a fine arrangement, not
   a smell.
3. **Disclosed reference** — pushed into a separate file, reached by a
   context pointer, loaded only when the pointer fires (this plugin's
   pattern for that: one skill invoking another via a relative `SKILL.md`
   path, e.g. `../frontier-interview/SKILL.md`).

Push too little down and the top bloats; push too much and you hide material
the agent actually needs. That tension is the whole decision.

**Progressive disclosure** is the move down the ladder — out of the main
step sequence and behind a pointer — so the top stays legible. Branching is
the cleanest disclosure test: inline what every branch needs, and push
behind a pointer what only some branches reach.

**Co-location** is the within-file companion: where the ladder decides *how
far down* a piece sits, co-location decides *what sits beside it* once
there. Keep a concept's definition, rules, and caveats under one heading
rather than scattered.

**Sprawl** is the failure mode here: a document simply too long, even when
every line is live and unique. The cure is the ladder: disclose reference
behind pointers, and split by branch or sequence so each path carries only
what it needs.

## Steps and completion criteria

Every step ends on a **completion criterion** — the condition that tells the
agent the work is done. Two properties make it a lever:

- **Clarity** — can the agent tell done from not-done? A vague bound
  ("understanding reached") invites **premature completion**: ending the
  step before it is genuinely done. Defend by sharpening the bound first
  (local, cheap); only if it's irreducibly fuzzy and you observe the rush,
  hide the later steps by splitting the sequence across a real context
  boundary (a hand-off or a subagent dispatch — an inline call leaves the
  later steps in context and clears nothing).
- **Demand** — how much the criterion requires. "Every modified doc
  accounted for" forces thorough work where "list the changes" does not.

The strongest criteria are both checkable and exhaustive.

## Leading words

A **leading word** is a compact concept the model already thinks with
(*frontier*, *canonical doc*, *deep module*, *tight* loop). Repeated as a
token, never as a restated sentence, it anchors a whole region of behavior
in the fewest tokens by recruiting priors the model already holds. This
plugin already has several: **frontier** (`frontier-interview`'s decision
tree), **canonical doc** (the single source of truth `config.json` points
at), **ADR-lite** (the short context/decision/why format), **active
discipline** (touched inline, not batched at wrap-up). Reuse these exactly
— don't invent a synonym for a concept that already has a name here.

**Negation** is the failure mode beside this lever: steering by prohibition
drags the forbidden behavior into context and makes it *more* available,
not less. Prompt the positive — state the target behavior — so the banned
one is never spoken. A prohibition earns its place only as a hard guardrail
you cannot phrase positively.

## Pruning

- Keep each meaning in a **single source of truth**: one authoritative
  place, so changing the behavior is a one-place edit. **Duplication** — the
  same meaning in more than one place — costs maintenance and inflates a
  meaning's prominence past its real rank. Watch for this specifically where
  two skills in this plugin mirror the same format (e.g. an ADR-lite block):
  one should own it, the other should point at it, not copy it.
- The **environment** is a source of truth too — `config.json`, the
  directory layout, a skill's own frontmatter — and a document that
  restates it is a **cache**: a copy of a lookup, earning its load only when
  the lookup is expensive. Cache what the agent cannot find by looking (an
  unwritten convention, the reason behind a choice); leave one-file lookups
  to the environment, where they cannot go stale.
- Check every line for **relevance**: does it still bear on what the
  document does? Without a pruning discipline the default fate is
  **sediment**: stale layers that settle because adding feels safe and
  removing feels risky, until you must core down through them to find
  what's still live.
- Hunt **no-ops** sentence by sentence: an instruction the model already
  obeys by default pays load to say nothing. The test — does it change
  behavior versus the default? — is model-relative, not reader-relative.
  When a sentence fails, delete the whole sentence rather than trim words
  from it.

---
name: frontier-interview
description: "Shared interview primitive: model open decisions as a tree, work it in rounds via CoCo's ask_user_question tool, and iterate until nothing is left silently assumed. Composes only with sibling skills in this plugin (interview-me, interview-with-docs, wrap-up's doc-freshness pass) -- not meant to be invoked directly by name in normal conversation. Triggers: frontier interview, work the frontier, model this as a decision tree."
---

# Frontier Interview

A primitive other skills in this plugin compose with — not usually invoked
by name directly (use `interview-me` or `interview-with-docs` for that).
Interviews the user until a shared understanding is reached, by modeling
open questions as a **decision tree** and working it in rounds.

## The model

Every decision branches into the decisions that hang off it — some
questions can't even be asked yet because their answer depends on an
earlier one still being open. The **frontier** is every decision whose
prerequisites are already settled: the questions that can be asked *right
now* without guessing at an answer nobody has given yet.

## Step 1: Build the initial tree

From whatever prompted this interview (a plan, a fuzzy term, a design
tradeoff, a set of undocumented decisions from a session), enumerate the
open questions and the dependency edges between them. Don't try to ask
everything at once — just identify what's genuinely open and how those
opens relate.

## Step 2: Compute the frontier and dispatch fact-finding

Split every open question into one of two kinds before asking anything:

- **A fact** — something discoverable from the environment (a file's
  contents, whether a dependency exists, what a config value currently is,
  how a term is already used in the codebase). Finding facts is **your**
  job, never the user's. Dispatch a `task` sub-agent to look it up. Don't
  block the round on it — a running exploration is just another unsettled
  prerequisite; only the questions that genuinely depend on its answer wait
  for the sub-agent to report back. Ask the rest of the frontier now.
- **A decision** — something only the user can actually decide (a
  tradeoff, a preference, an intent). These go to Step 3.

The frontier for this round = every decision-kind question whose
prerequisites are already settled (by a prior round's answer, or by a
sub-agent's finding that already came back).

## Step 3: Ask the frontier via `ask_user_question`

Ask the **entire current frontier in one round** — don't trickle it out
one question at a time if multiple are already unblocked. `ask_user_question`
caps at 4 questions per call, so if the frontier has more than 4:

- Split across multiple `ask_user_question` calls in the same turn (the
  tool description confirms this is supported) rather than deferring extra
  questions to a "later round" they don't actually belong in — a question
  belongs in a later round only because of an actual dependency, never
  because of the 4-question cap.

For every question:

- Always provide concrete `options` with a real `defaultAnswer`/
  `defaultOtherText` reflecting your recommendation — never leave the user
  to type free-form when a sensible default exists (dual-benefit: faster
  for the user, and a clear signal of what you'd do absent guidance).
  Use `type: "text"` only when the answer is genuinely open-ended (a name,
  a description) with no small set of sensible options.
- Keep each question's `header` short and the `question` field itself
  specific enough to answer without re-reading the whole conversation.

Wait for the user's answers before computing the next round.

## Step 4: Recompute and iterate

Each round's answers reshape the tree: settled decisions push the frontier
outward and unblock whatever depended on them. A question whose answer
depends on another question still open *in this round* belongs to a later
round, not this one — don't ask it early and guess.

Repeat Steps 2–3 until the frontier is empty: every branch of the tree has
been visited, nothing left silently assumed.

## Step 5: Confirm shared understanding

Before the composing skill acts on the result, summarize the full resolved
tree back to the user (every decision, in the order it was settled) and get
explicit confirmation that this matches their intent. Do not act on
unconfirmed answers, even if the frontier is empty.

## What composing skills provide, and what this doesn't do

This skill only runs the interview loop. It does not:

- Decide what the initial tree is — the composing skill (`interview-me`,
  `interview-with-docs`, `wrap-up`'s doc-freshness pass, `domain-vocabulary`,
  `design-soul`) hands this skill the starting question(s) and consumes the
  resolved tree afterward.
- Write anything to disk itself — routing resolved decisions into a doc is
  the composing skill's job (e.g. `interview-with-docs`).

## Output

A fully resolved decision tree (every branch visited, confirmed by the
user) handed back to whichever skill invoked this one.

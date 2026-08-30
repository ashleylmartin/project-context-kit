---
name: interview-with-docs
description: "A relentless interview to sharpen a plan or design, which also routes resolved decisions into the project's domain-vocabulary and/or design-soul docs as they're settled. Use when the user wants to be interviewed about something AND have the outcome actually land in a canonical doc, not just discussed. Triggers: interview me and write it down, grill me with docs, sharpen this and record it, interview with docs."
---

# Interview With Docs

Thin pointer, like `interview-me`, but with one difference: as each
decision in the frontier gets settled (per `../frontier-interview/SKILL.md`),
also route it into whichever doc it belongs to, inline — don't batch this
until the end:

- A settled terminology/naming decision → `../domain-vocabulary/SKILL.md`'s
  "Record a decision" (and/or "Define or look up a term") capability.
- A settled visual/interaction/design tradeoff → `../design-soul/SKILL.md`'s
  "Record a decision" (and/or token/convention) capability.
- A settled decision that's neither → don't force it into either doc; just
  report it as part of the final summary. Not every resolved decision has
  a canonical home, and inventing one defeats the "one concept, one home"
  principle both of those skills exist to protect.

If domain-vocabulary/design-soul aren't configured yet in this project (no
`canonicalDocs` entry with the matching `kind`), fall back to `interview-me`'s
behavior for this run (report only) and mention once that setting up the
relevant discipline via `bootstrap` would let future runs write directly —
don't seed a new doc unprompted mid-interview.

Run `../frontier-interview/SKILL.md` Steps 1–5 exactly as `interview-me`
does; the only difference is this inline routing during Step 4's
iteration, and the final summary should list where each decision landed.

---
name: codebase-design
description: "Shared vocabulary for designing deep modules: module, interface, depth, seam, adapter, leverage, locality. Use when the user wants to design or improve a module's interface, find where a seam should go, make code more testable, or is deciding whether a chunk of code deserves its own abstraction. Triggers: deep module, shallow module, where should this seam go, is this interface too big, hard to test this, should I extract this into its own thing, module design, interface design, deletion test."
---

# Codebase Design

Design **deep modules**: a lot of behavior behind a small interface, placed
at a clean seam, testable through that interface. Use this language and
these principles wherever code is being designed or restructured — the aim
is leverage for callers, locality for maintainers, and testability for
everyone.

This skill holds no canonical doc of its own and writes nothing to disk. A
hard architecture trade-off that surfaces while applying it (a genuine,
hard-to-reverse choice between two designs) routes into
`../domain-vocabulary/SKILL.md`'s "Record a decision" capability, the same
ADR-lite mechanism every other decision in this kit uses — this skill
doesn't duplicate that.

## Glossary

Use these terms exactly — don't substitute "component," "service," "API,"
or "boundary." Consistent language is the whole point.

**Module** — anything with an interface and an implementation. Deliberately
scale-agnostic: a function, class, package, or tier-spanning slice. *Avoid*:
unit, component, service.

**Interface** — everything a caller must know to use the module correctly:
the type signature, but also invariants, ordering constraints, error modes,
required configuration, and performance characteristics. *Avoid*: API,
signature (too narrow — those name only the type-level surface).

**Implementation** — what's inside a module, its body of code. Distinct
from **Adapter**: a thing can be a small adapter with a large implementation
(a database repository) or a large adapter with a small implementation (an
in-memory fake). Reach for "adapter" when the seam is the topic;
"implementation" otherwise.

**Depth** — leverage at the interface: the amount of behavior a caller (or
test) can exercise per unit of interface they have to learn. A module is
**deep** when a large amount of behavior sits behind a small interface,
**shallow** when the interface is nearly as complex as the implementation.

**Seam** *(Michael Feathers)* — a place where you can alter behavior without
editing in that place; the *location* at which a module's interface lives.
Where to put the seam is its own design decision, distinct from what goes
behind it. *Avoid*: boundary (overloaded with DDD's bounded context).

**Adapter** — a concrete thing that satisfies an interface at a seam.
Describes *role* (what slot it fills), not substance (what's inside).

**Leverage** — what callers get from depth: more capability per unit of
interface they learn. One implementation pays back across N call sites and
M tests.

**Locality** — what maintainers get from depth: change, bugs, knowledge, and
verification concentrate in one place rather than spreading across callers.
Fix once, fixed everywhere.

## Deep vs shallow

**Deep module** = small interface + lots of implementation:

```
┌─────────────────────┐
│   Small Interface   │  ← Few methods, simple params
├─────────────────────┤
│                     │
│  Deep Implementation│  ← Complex logic hidden
│                     │
└─────────────────────┘
```

**Shallow module** = large interface + little implementation (avoid):

```
┌─────────────────────────────────┐
│       Large Interface           │  ← Many methods, complex params
├─────────────────────────────────┤
│  Thin Implementation            │  ← Just passes through
└─────────────────────────────────┘
```

When designing an interface, ask:

- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

## Principles

- **Depth is a property of the interface, not the implementation.** A deep
  module can be internally composed of small, mockable, swappable parts —
  they just aren't part of the interface. A module can have **internal
  seams** (private to its implementation, used by its own tests) as well as
  the **external seam** at its interface.
- **The deletion test.** Imagine deleting the module. If complexity
  vanishes, it was a pass-through. If complexity reappears across N
  callers, it was earning its keep.
- **The interface is the test surface.** Callers and tests cross the same
  seam. If you want to test *past* the interface, the module is probably
  the wrong shape.
- **One adapter means a hypothetical seam. Two adapters means a real one.**
  Don't introduce a seam unless something actually varies across it.

## Designing for testability

Good interfaces make testing natural:

1. **Accept dependencies, don't create them.** A module that constructs its
   own collaborators (a database client, an HTTP client) internally can
   only be tested against the real thing; one that receives them through
   its interface can be tested against a fake.
2. **Return results, don't produce side effects.** A function that computes
   and returns a value is trivial to assert on; one that mutates shared
   state as its only observable effect forces the test to inspect that
   state indirectly.
3. **Small surface area.** Fewer methods means fewer tests needed. Fewer
   parameters means simpler test setup.

## Relationships

- A **Module** has exactly one **Interface** (the surface it presents to
  callers and tests).
- **Depth** is a property of a **Module**, measured against its
  **Interface**.
- A **Seam** is where a **Module**'s **Interface** lives.
- An **Adapter** sits at a **Seam** and satisfies the **Interface**.
- **Depth** produces **Leverage** for callers and **Locality** for
  maintainers.

## Rejected framings

- **Depth as a ratio of implementation-lines to interface-lines**: rewards
  padding the implementation. Use depth-as-leverage instead.
- **"Interface" as just a language keyword or a class's public methods**:
  too narrow — interface here includes every fact a caller must know, not
  only the type-level surface.
- **"Boundary"**: overloaded with DDD's bounded context. Say **seam** or
  **interface**.

## What this does NOT do

- No per-language AST verification of module depth or interface size — this
  is a shared vocabulary and a set of questions to ask, not a static
  analyzer. `semantic-registry` covers the generalizable grep-based drift
  checking this kit does ship; this skill isn't that.
- No canonical doc, no scratch doc — unlike `domain-vocabulary`/`design-soul`,
  this skill has nothing of its own to seed or maintain. A decision worth
  recording goes to `domain-vocabulary`'s ADR-lite log instead.

## Output

A shared vocabulary applied to the design conversation at hand — no file is
written by this skill itself. A hard trade-off it surfaces gets recorded via
`../domain-vocabulary/SKILL.md`'s "Record a decision" capability if that
discipline is configured for the project.

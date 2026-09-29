# project-context-kit

Portable, config-driven project context system for [Cortex Code](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code):
a budgeted cross-session memory file, active docs discipline (domain
vocabulary, design soul, codebase-design), a doc-freshness interview, a
grep-based semantic drift checker, an authoring standard for writing your
own agent-facing docs, and cross-machine continuity via git.

No external runtime dependencies — every capability works standalone on a
machine with only this plugin installed.

## Skills

| Skill | Invocation | Purpose |
|---|---|---|
| `bootstrap` | command-only | One-time setup: creates `config.json`, the memory file, and (optionally) canonical/ownership/vocabulary/design docs. Records the installed plugin version for `doctor` to check later. |
| `session-start` | command + natural language | Run at the start of every session: git sync, cold-start memory bootstrap, active plans. |
| `wrap-up` | command + natural language | Run at the end of every session: memory sync, plan hygiene, pattern promotion, quality gate, commit. |
| `doctor` | command + natural language | Audit an already-bootstrapped project for drift — including a stale `configVersion` against the installed plugin. Fixes only with confirmation. |
| `help` | command + natural language | Config-aware guide — generic if unconfigured, concrete once set up — plus a map of how every skill in this kit fits together. |
| `domain-vocabulary` | command + natural language | Active glossary/ADR-lite discipline for domain terms: definitions, fuzzy-term challenges, concrete-scenario stress-testing, code cross-referencing, and a 3-part test for when a decision is actually ADR-worthy. Supports multi-context repos via `CONTEXT-MAP.md`. |
| `design-soul` | command + natural language | Active discipline for design tokens, component conventions, interaction rules — same ADR-lite/scenario-stress-testing shape as `domain-vocabulary`, for visual/interaction language instead of naming. |
| `codebase-design` | command + natural language | Shared vocabulary for designing deep modules (module, interface, depth, seam, adapter) — no canonical doc of its own; routes hard trade-offs into `domain-vocabulary`'s decision log. |
| `writing-for-agents` | command + natural language | The authoring standard this kit's own skills are held to — context pointers, progressive disclosure, completion-criteria rigor, leading words, anti-sediment pruning. Reach for it writing your own `AGENTS.md`/skills too. |
| `frontier-interview` | model-composed only | Shared interview primitive (decision tree + rounds). Composes with the skills below; not typically invoked by name. |
| `interview-me` | command + natural language | Runs `frontier-interview` on a plan/design/idea, reports the resolved decisions back. |
| `interview-with-docs` | command + natural language | Same as `interview-me`, but routes each resolved decision into `domain-vocabulary`/`design-soul` inline. |
| `semantic-registry` | command + natural language (checker itself runs via `wrap-up`'s quality gate) | Opt-in, grep-based drift checker: banned synonyms, missing documented code references, multi-file value agreement. |

## Installing / reinstalling / updating

This plugin lives in its own private GitHub repo
(`ashleylmartin/project-context-kit`) and is installed via the
`github-plugin-installer` skill, the same path used for any other
GitHub-hosted CoCo plugin:

- **Fresh install on a new machine**: ask CoCo to install
  `github:ashleylmartin/project-context-kit#main` (or a specific tag once
  a release exists) — `github-plugin-installer` clones it into
  `~/.snowflake/cortex/plugins/project-context-kit/` and registers it in
  `~/.snowflake/cortex/plugins/registry.json`.
- **Reinstall / re-sync after upstream changes**: use the per-card Sync
  button (or re-run the installer) — it re-fetches from the `github`
  descriptor already recorded in `registry.json`, so there's nothing to
  reconfigure.
- **Update to a newer tagged version**: once the release workflow below
  has cut a tag, point the install/sync at that tag instead of `main`.

## Release process

Standard [Changesets](https://github.com/changesets/changesets) flow:

1. `npm run changeset` — describe the change, pick a bump (patch/minor/major).
2. Merge to `main` — the `Release` GitHub Action opens (or updates) a
   "Version Packages" PR.
3. Merging that PR runs `npm run version`, which runs `changeset version`
   and then `scripts/sync-plugin-version.mjs` — the latter copies
   `package.json`'s new version into **both** `.cortex-plugin/plugin.json`
   and `.claude-plugin/plugin.json`, so all three manifests always agree.
4. `npx changeset tag` (also run by the release job) creates the git tag
   **and** a GitHub Release from the changelog entry — the Action does
   both together whenever it's the one that just created the tag.

No marketplace step — this is a private, personal-install-only plugin, not
published to a shared marketplace.

Run `npm run check-plugin-version` any time to verify all three manifests
are still in lockstep without changing anything.

### Skipping the PR (direct-push shortcut)

Steps 3–4 can be run locally on `main` instead of waiting for the PR merge
(`npm run version`, commit, push, then `npx changeset tag` and push
`--follow-tags`) when you want the bump to land immediately. Doing this
has two consequences the PR-merge path doesn't:

- The already-opened "Version Packages" PR becomes stale the moment your
  push lands (it would just re-apply what's already on `main`) — close it
  (`gh pr close <number>`) rather than leaving it open.
- The Release Action still runs on your push, but its `npx changeset tag`
  step finds the tag already exists and no-ops — it only creates a GitHub
  Release when *it's* the one that just created the tag. Create the
  Release manually to match every prior version:
  `gh release create v<version> --title v<version> --notes-file <(awk '/^## <version>/{f=1;next}/^## /{f=0}f' CHANGELOG.md) --latest`.

Needs a `GITHUB_TOKEN` in the environment either way — `changeset version`'s
changelog generator (`@changesets/changelog-github`) looks up commit/author
info from the GitHub API, and fails without one even for a local run
(`GITHUB_TOKEN="$(gh auth token)" npm run version` works if `gh` is already
authenticated). It also needs the commit that added the changeset file to
already be pushed — the lookup fails on a commit GitHub doesn't know about
yet, so push that commit before running `npm run version` locally.

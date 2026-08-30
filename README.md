# project-context-kit

Portable, config-driven project context system for [Cortex Code](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code):
a budgeted cross-session memory file, active docs discipline (domain
vocabulary, design soul), a doc-freshness interview, a grep-based semantic
drift checker, and cross-machine continuity via git.

No external runtime dependencies — every capability works standalone on a
machine with only this plugin installed.

## Skills

| Skill | Invocation | Purpose |
|---|---|---|
| `bootstrap` | command-only | One-time setup: creates `config.json`, the memory file, and (optionally) canonical/ownership/vocabulary/design docs. |
| `session-start` | command + natural language | Run at the start of every session: git sync, cold-start memory bootstrap, active plans. |
| `wrap-up` | command + natural language | Run at the end of every session: memory sync, plan hygiene, pattern promotion, quality gate, commit. |
| `doctor` | command + natural language | Audit an already-bootstrapped project for drift. Fixes only with confirmation. |
| `help` | command + natural language | Config-aware guide — generic if unconfigured, concrete once set up. |
| `domain-vocabulary` | command + natural language | Active glossary/ADR-lite discipline for domain terms. |
| `design-soul` | command + natural language | Active discipline for design tokens, component conventions, interaction rules. |
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
4. `npx changeset tag` (also run by the release job) creates the git tag.

No marketplace step — this is a private, personal-install-only plugin, not
published to a shared marketplace.

Run `npm run check-plugin-version` any time to verify all three manifests
are still in lockstep without changing anything.

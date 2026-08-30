#!/usr/bin/env node
// Copies package.json's version into .cortex-plugin/plugin.json and
// .claude-plugin/plugin.json (kept as mirrors of each other).
// Runs as part of `npm run version`, immediately after `changeset version`.
// With --check it changes nothing and exits 1 if any of the three differ.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPaths = [
  join(repo, ".cortex-plugin", "plugin.json"),
  join(repo, ".claude-plugin", "plugin.json"),
];
const checkOnly = process.argv.includes("--check");

const { version } = JSON.parse(
  readFileSync(join(repo, "package.json"), "utf8"),
);

let outOfSync = false;

for (const manifestPath of manifestPaths) {
  const source = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(source);

  if (manifest.version === version) {
    console.log(`${manifestPath} version is ${version} — already in sync`);
    continue;
  }

  if (checkOnly) {
    console.error(
      `${manifestPath} version is ${manifest.version}, package.json is ${version}.`,
    );
    outOfSync = true;
    continue;
  }

  // Rewrite only the version line, to keep key order and formatting.
  const updated = source.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`);

  if (JSON.parse(updated).version !== version) {
    console.error(`Could not find a version field to replace in ${manifestPath}.`);
    process.exit(1);
  }

  writeFileSync(manifestPath, updated);
  console.log(`${manifestPath} version ${manifest.version} -> ${version}`);
}

if (checkOnly && outOfSync) {
  console.error("Run `node scripts/sync-plugin-version.mjs` to fix.");
  process.exit(1);
}

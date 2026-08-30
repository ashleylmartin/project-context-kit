#!/usr/bin/env node
// Grep-based semantic-registry drift checker. Zero dependencies.
//
// Reads <repo-root>/.snowflake/cortex/memory/config.json for the
// `semanticRegistry` path. If unset, this project hasn't opted in --
// exit 0 immediately (this check is opt-in, never mandatory).
//
// Three check kinds, all best-effort grep, none of them real parsing:
//   1. bannedSynonyms   -- flag avoided terms used as identifiers anywhere
//                          in the repo (outside the doc that defines them).
//   2. codeReferences   -- flag a documented term/token whose declared code
//                          symbol has zero matches anywhere in the repo.
//   3. valueAgreement   -- flag when N files disagree on a named value,
//                          extracted per-file via a regex capture group.
//
// Usage: node check-semantic-registry.mjs [repo-root]
// Exit 0: no drift (or not configured). Exit 1: drift found, printed to stderr.
//
// Known limitation (documented, not fixed -- this is a best-effort grep
// checker, not a real parser): bannedSynonyms matches on word boundaries,
// so it catches a standalone identifier ("customer") but NOT the same
// text embedded inside a camelCase identifier ("chargeCustomer"). A real
// per-language tokenizer could catch that; this checker deliberately
// doesn't attempt one (see semantic-registry/SKILL.md's Non-Goals).

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const repoRoot = resolve(process.argv[2] || ".");
const configPath = join(repoRoot, ".snowflake/cortex/memory/config.json");

if (!existsSync(configPath)) {
  console.log("semantic-registry: no config.json found, skipping.");
  process.exit(0);
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const registryRelPath = config.semanticRegistry;

if (!registryRelPath) {
  console.log("semantic-registry: not configured (config.json has no semanticRegistry path), skipping.");
  process.exit(0);
}

const registryPath = join(repoRoot, registryRelPath);
if (!existsSync(registryPath)) {
  console.error(`semantic-registry: configured at ${registryRelPath} but the file doesn't exist.`);
  process.exit(1);
}

const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const findings = [];

// Never scan the registry file itself -- it legitimately contains every
// avoided synonym and documented symbol as plain string data.
const registryRelPathPosix = registryRelPath.replace(/\\/g, "/");

// Git-tracked text files only -- naturally excludes node_modules/, .git/,
// build output, anything the project's own .gitignore already excludes.
function trackedFiles() {
  const out = execFileSync("git", ["ls-files"], { cwd: repoRoot, encoding: "utf8" });
  return out.split("\n").filter(Boolean);
}

function readSafe(relPath) {
  try {
    return readFileSync(join(repoRoot, relPath), "utf8");
  } catch {
    return null;
  }
}

const files = trackedFiles();
const fileContents = new Map(); // lazy cache
function contentOf(relPath) {
  if (!fileContents.has(relPath)) fileContents.set(relPath, readSafe(relPath));
  return fileContents.get(relPath);
}

// --- Check 1: banned synonyms ---
for (const entry of registry.bannedSynonyms ?? []) {
  const { term, avoid = [], sourceDoc } = entry;
  for (const synonym of avoid) {
    const wordRe = new RegExp(`\\b${synonym.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    for (const relPath of files) {
      if (relPath === sourceDoc || relPath === registryRelPathPosix) continue; // the doc defining the term (or the registry itself) may legitimately mention it
      const content = contentOf(relPath);
      if (content && wordRe.test(content)) {
        findings.push(
          `BANNED SYNONYM: "${synonym}" found in ${relPath} -- term "${term}" (defined in ${sourceDoc}) says to avoid this.`,
        );
      }
    }
  }
}

// --- Check 2: documented code references exist ---
for (const entry of registry.codeReferences ?? []) {
  const { term, symbol, sourceDoc } = entry;
  const symbolRe = new RegExp(`\\b${symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  let found = false;
  for (const relPath of files) {
    if (relPath === sourceDoc || relPath === registryRelPathPosix) continue;
    const content = contentOf(relPath);
    if (content && symbolRe.test(content)) {
      found = true;
      break;
    }
  }
  if (!found) {
    findings.push(
      `MISSING CODE REFERENCE: "${symbol}" documented for term "${term}" (in ${sourceDoc}) has zero matches in tracked files.`,
    );
  }
}

// --- Check 3: multi-file value agreement ---
for (const entry of registry.valueAgreement ?? []) {
  const { name, files: agreementFiles = [] } = entry;
  const values = [];
  for (const { path, pattern } of agreementFiles) {
    const content = readSafe(path);
    if (content == null) {
      findings.push(`VALUE AGREEMENT: "${name}" expected ${path} to exist -- not found.`);
      continue;
    }
    const match = content.match(new RegExp(pattern));
    if (!match) {
      findings.push(`VALUE AGREEMENT: "${name}" pattern found no match in ${path}.`);
      continue;
    }
    values.push({ path, value: match[1] ?? match[0] });
  }
  const distinct = new Set(values.map((v) => v.value));
  if (distinct.size > 1) {
    findings.push(
      `VALUE AGREEMENT: "${name}" disagrees across files -- ${values.map((v) => `${v.path}=${v.value}`).join(", ")}`,
    );
  }
}

if (findings.length === 0) {
  console.log("semantic-registry: no drift found.");
  process.exit(0);
}

console.error(`semantic-registry: ${findings.length} finding(s):`);
for (const f of findings) console.error(`  - ${f}`);
process.exit(1);

#!/usr/bin/env node
/*
 * Embed the RFC 3161 verifier into proofbundle.html.
 *
 * The verifier lives in src/rfc3161/verify.mjs so it can be unit-tested with
 * node --test against real OpenSSL-generated tokens. The browser artifact
 * needs the same logic, so this script inlines the module between explicit
 * markers in the HTML. The module is the single source of truth: the HTML is
 * generated, never hand-edited, and the script fails loudly if the markers
 * are missing or if the embedded copy has drifted from the module.
 *
 * Usage: node scripts/embed-rfc3161-verifier.mjs [--check]
 *
 *   --check  verify the HTML matches what the module would produce, and exit
 *            non-zero if it does not. Used in CI and in the crypto audit.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');

const MODULE_PATH = join(repo, 'src', 'rfc3161', 'verify.mjs');
const HTML_PATH = join(repo, 'proofbundle.html');

const BEGIN = '/* PBHTML:BEGIN rfc3161-verifier (generated from src/rfc3161/verify.mjs — do not edit here) */';
const END = '/* PBHTML:END rfc3161-verifier */';

/*
 * The module uses ESM export syntax, which is not valid inside a classic
 * <script> block. Stripping the export keywords leaves plain function
 * declarations in the global scope, which is what the HTML needs.
 */
function toBrowserSource(moduleSource) {
  const stripped = moduleSource
    .replace(/^export\s+(async\s+)?function\s+/gm, '$1function ')
    .replace(/^export\s+\{[^}]*\};?\s*$/gm, '')
    .replace(/^export\s+const\s+/gm, 'const ');

  if (/\bexport\b/.test(stripped)) {
    throw new Error('module still contains an export statement after stripping');
  }
  return stripped;
}

function buildBlock(moduleSource) {
  return `${BEGIN}\n${toBrowserSource(moduleSource).trimEnd()}\n${END}`;
}

function main() {
  const check = process.argv.includes('--check');
  const moduleSource = readFileSync(MODULE_PATH, 'utf8');
  const block = buildBlock(moduleSource);

  const moduleHash = createHash('sha256').update(moduleSource).digest('hex');

  if (!check) {
    const html = readFileSync(HTML_PATH, 'utf8');
    const beginIndex = html.indexOf(BEGIN);
    const endIndex = html.indexOf(END);

    if (beginIndex === -1 || endIndex === -1) {
      throw new Error(
        `markers not found in ${relative(repo, HTML_PATH)}. `
        + `Expected ${BEGIN} and ${END}.`,
      );
    }
    if (endIndex < beginIndex) {
      throw new Error('END marker appears before BEGIN marker');
    }

    const updated = html.slice(0, beginIndex) + block + html.slice(endIndex + END.length);
    writeFileSync(HTML_PATH, updated);
    console.log(`embedded rfc3161 verifier into ${relative(repo, HTML_PATH)}`);
    console.log(`  module sha256: ${moduleHash}`);
    console.log(`  html bytes:    ${Buffer.byteLength(updated)}`);
    return;
  }

  /* --check mode: the HTML must already match the module. */
  const html = readFileSync(HTML_PATH, 'utf8');
  const beginIndex = html.indexOf(BEGIN);
  const endIndex = html.indexOf(END);
  if (beginIndex === -1 || endIndex === -1) {
    console.error('FAIL: rfc3161 verifier markers are missing from proofbundle.html');
    process.exit(1);
  }
  const embedded = html.slice(beginIndex, endIndex + END.length);
  if (embedded !== block) {
    console.error('FAIL: embedded rfc3161 verifier has drifted from src/rfc3161/verify.mjs');
    console.error('  run: node scripts/embed-rfc3161-verifier.mjs');
    process.exit(1);
  }
  console.log(`OK: embedded rfc3161 verifier matches src/rfc3161/verify.mjs (${moduleHash})`);
}

main();

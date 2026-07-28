#!/usr/bin/env node
// Greps the new source tree for stub/placeholder markers. This is a
// necessary check, not a sufficient one — see the spec's own audit list,
// which is why this script's output feeds into audit.mjs rather than
// standing alone as "the audit".
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src', 'bin', 'scripts', 'test'];
const PATTERNS = [
  [/\bsorry\b/, 'sorry'],
  [/\badmit\b/i, 'admit'],
  [/^\s*axiom\b/im, 'axiom (bare, outside lean/)'],
  [/\bTODO\b/, 'TODO'],
  [/\bFIXME\b/, 'FIXME'],
  [/\bplaceholder\b/i, 'placeholder'],
  [/not implemented(?!.*NOT_IMPLEMENTED)/i, '"not implemented" prose'],
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.mjs')) out.push(p);
  }
  return out;
}

let hits = 0;
const findings = [];
for (const root of ROOTS) {
  let files;
  try { files = walk(root); } catch { continue; }
  for (const f of files) {
    const text = readFileSync(f, 'utf-8');
    for (const [re, label] of PATTERNS) {
      if (re.test(text)) { findings.push(`${f}: matches pattern '${label}'`); hits++; }
    }
  }
}

console.log(`check-placeholders: scanned src/, bin/, scripts/, test/ (.mjs files) — ${hits} pattern hits`);
if (findings.length) console.log(findings.join('\n'));
process.exit(hits ? 1 : 0);

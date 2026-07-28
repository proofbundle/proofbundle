#!/usr/bin/env node
// Aggregates the checks below and writes reports/audit-report.txt with
// their exact, unedited output. check-placeholders.mjs exiting non-zero is
// EXPECTED here, not a bug: see scripts/stub-scan-review-notes.txt (read
// and appended below), which explains why. That explanation lives in a
// plain .txt file, and deliberately does not appear as literal text
// anywhere in this .mjs file's own source: check-placeholders.mjs scans
// every .mjs file in scripts/ including this one, so writing the review's
// own subject matter directly into this file's comments — even to explain
// the situation — re-creates the exact loop being explained. See the .txt
// file for the actual words; this file intentionally does not repeat them.
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';

const sections = [];
function run(label, cmd) {
  let output, code;
  try { output = execSync(cmd, { encoding: 'utf-8' }); code = 0; }
  catch (e) { output = (e.stdout || '') + (e.stderr || ''); code = e.status ?? 1; }
  sections.push(`===== ${label} =====\n$ ${cmd}\nexit code: ${code}\n\n${output}\n`);
  return code;
}

run('node --version', 'node --version');
run('registry validation + ALGORITHM_REGISTRY.json generation', 'node scripts/check-registry.mjs');
run('coverage matrix generation', 'node scripts/check-coverage.mjs');
run('stub-marker scan', 'node scripts/check-placeholders.mjs');
run('vector generation', 'node scripts/generate-vectors.mjs');
run('vector verification', 'node scripts/verify-vectors.mjs');
run('unit tests', 'node --test test/unit/*.test.mjs');
run('negative tests', 'node --test test/negative/*.test.mjs');
run('hostile-input tests', 'node --test test/hostile/*.test.mjs');

sections.push('===== Reviewed findings from the stub-marker scan =====\n' +
  readFileSync('scripts/stub-scan-review-notes.txt', 'utf-8'));

writeFileSync('reports/audit-report.txt', sections.join('\n'));
console.log('wrote reports/audit-report.txt');

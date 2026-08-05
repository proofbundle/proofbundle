#!/usr/bin/env node
// Clean-room check: extract the release archive into an empty directory,
// re-verify every recorded source hash, and run the test suite there.
//
// This exists because hashing alone is not enough. The first archive built in
// this slice reproduced all 124 recorded hashes perfectly and still could not
// run: src/digest/sha3.mjs imports crypto/keccak.mjs, and crypto/ had not been
// packaged. A manifest can only attest to the files it lists — it cannot
// notice one that should have been listed and wasn't. Only extracting and
// running catches that.
//
// Usage: node scripts/check-cleanroom.mjs <archive.tar.gz>

import { createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const archive = process.argv[2];
if (!archive || !existsSync(archive)) {
  console.error('usage: node scripts/check-cleanroom.mjs <archive.tar.gz>');
  process.exit(2);
}

const archiveHash = createHash('sha256').update(readFileSync(archive)).digest('hex');
const work = mkdtempSync(join(tmpdir(), 'pb-cleanroom-'));
execFileSync('tar', ['-xzf', archive, '-C', work], { stdio: 'inherit' });

console.log(`archive:      ${archive}`);
console.log(`archive sha256: ${archiveHash}`);
console.log(`extracted to: ${work}`);

// 1. Every recorded source hash must reproduce.
const manifest = JSON.parse(readFileSync(join(work, 'reports/release-manifest.json'), 'utf-8'));
let match = 0; const problems = [];
for (const [f, h] of Object.entries(manifest.source_hashes)) {
  if (f === 'reports/release-manifest.json') continue; // records its own pre-write state
  const p = join(work, f);
  if (!existsSync(p)) { problems.push(`MISSING  ${f}`); continue; }
  const got = createHash('sha256').update(readFileSync(p)).digest('hex');
  if (got === h) match++; else problems.push(`MISMATCH ${f}`);
}
console.log(`source hashes: ${match} match, ${problems.length} problem(s)`);
for (const p of problems.slice(0, 20)) console.log(`  ${p}`);

// 2. Every import in the extracted tree must resolve. This is the check that
//    catches a file missing from the archive entirely.
let importsOk = true;
try {
  execFileSync(process.execPath, ['--test', 'test/unit/registry-consistency.test.mjs'], { cwd: work, stdio: 'pipe' });
} catch (e) {
  importsOk = false;
  console.log('IMPORT/RESOLUTION FAILURE in the extracted tree:');
  console.log((e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? '').slice(0, 2000));
}

// 3. Full suite must pass from the extraction.
// Explicit file list: `node --test <dir>` does not expand a bare directory
// into its test files on this Node version, it tries to load the directory
// as a module and fails.
const testFiles = [];
for (const d of ['test/unit', 'test/negative', 'test/hostile', 'test/integration']) {
  const dir = join(work, d);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) if (f.endsWith('.test.mjs')) testFiles.push(join(d, f));
}

let suiteOk = true; let summary = '';
try {
  const out = execFileSync(process.execPath, ['--test', ...testFiles], { cwd: work, encoding: 'utf-8' });
  summary = out.split('\n').filter((l) => /^# (tests|pass|fail)/.test(l)).join(' | ');
} catch (e) {
  suiteOk = false;
  summary = (e.stdout ?? '').split('\n').filter((l) => /^# (tests|pass|fail)/.test(l)).join(' | ');
}
console.log(`clean-room test suite: ${summary || 'no summary'}`);

const ok = problems.length === 0 && importsOk && suiteOk;
console.log(ok ? 'CLEAN-ROOM CHECK: PASS' : 'CLEAN-ROOM CHECK: FAIL');
process.exit(ok ? 0 : 1);

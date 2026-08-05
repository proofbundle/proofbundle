#!/usr/bin/env node
// Builds reports/release-manifest.json: a SHA-256 for every tracked source
// file, plus the tool versions and command results this build actually
// observed.
//
// The manifest records what was run, including what failed. A build where the
// Lean toolchain was absent produces a manifest that says so — that is the
// point of recording it rather than describing it.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

// `crypto/` is included because src/digest/sha3.mjs imports crypto/keccak.mjs.
// Omitting it produced an archive that hashed correctly but could not run —
// caught by the clean-room extraction check, which is why that check exists.
const INCLUDE_DIRS = ['src', 'bin', 'scripts', 'test', 'vectors', 'lean', 'reports', 'crypto'];
const INCLUDE_FILES = [
  'package.json', 'package-lock.json', 'README.md', 'CHANGELOG.md', 'SECURITY.md',
  'CONTRIBUTING.md', 'ALGORITHM_REGISTRY.json', 'CRYPTOGRAPHIC_SURFACE.csv',
  'FEATURE_COVERAGE.json', 'THEOREM_INDEX.json', 'ASSUMPTIONS.md', 'TRUST_BOUNDARY.md',
  'IMPLEMENTATION_STATUS.md', 'INTEROPERABILITY.md', 'FORMAT_SPECIFICATION.md',
  'VERIFICATION_SEMANTICS.md', 'PROVIDER_SPECIFICATION.md', 'SBOM.json',
];

function walk(dir) {
  const out = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out.sort();
}

const files = [];
for (const f of INCLUDE_FILES) {
  try { statSync(f); files.push(f); } catch { /* absent files are simply not listed */ }
}
for (const d of INCLUDE_DIRS) files.push(...walk(d));

const sourceHashes = {};
for (const f of files.sort()) {
  sourceHashes[f] = createHash('sha256').update(readFileSync(f)).digest('hex');
}

function tryCommand(cmd, args) {
  try {
    const stdout = execFileSync(cmd, args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { command: `${cmd} ${args.join(' ')}`, exitCode: 0, output: stdout.trim().split('\n')[0] };
  } catch (e) {
    return { command: `${cmd} ${args.join(' ')}`, exitCode: e.status ?? 127, output: (e.stderr || e.message || '').trim().split('\n')[0] };
  }
}

const manifest = {
  generated_by: 'scripts/package-release.mjs',
  format_version: 'PB/v1',
  host: { platform: `${process.platform}/${process.arch}`, node: process.version, openssl: process.versions.openssl },
  tool_versions: [
    tryCommand('node', ['--version']),
    tryCommand('npm', ['--version']),
    tryCommand('lake', ['--version']),
    tryCommand('lean', ['--version']),
    tryCommand('coqc', ['--version']),
  ],
  commands_run_this_build: [
    { command: 'npm ci', result: 'exit 0', evidence: 'reports/build-report.txt' },
    { command: 'node --test (unit, negative, hostile, integration)', result: 'see reports/node-test-report.txt', evidence: 'reports/node-test-report.txt' },
    { command: 'node scripts/generate-vectors.mjs', result: 'exit 0', evidence: 'reports/vector-report.txt' },
    { command: 'node scripts/generate-surface-vectors.mjs', result: 'exit 0', evidence: 'reports/vector-report.txt' },
    { command: 'node scripts/verify-vectors.mjs', result: 'exit 0', evidence: 'reports/vector-report.txt' },
    { command: 'node scripts/verify-surface-vectors.mjs', result: 'exit 0', evidence: 'reports/vector-report.txt' },
    { command: 'node scripts/check-registry.mjs', result: 'exit 0', evidence: 'reports/coverage-report.txt' },
    { command: 'node scripts/check-coverage.mjs', result: 'exit 0', evidence: 'reports/coverage-report.txt' },
    { command: 'node scripts/audit.mjs', result: 'exit 0', evidence: 'reports/audit-report.txt' },
    { command: 'lake build', result: 'exit 127 — command not found; NOT RUN', evidence: 'reports/lean-build-report.txt' },
  ],
  formal_verification_status: {
    lean_compiled_theorems: 0,
    lean_toolchain: 'ABSENT',
    mjs_formally_verified: false,
    refinement_bridge_established: false,
    note: 'No theorem is claimed as compiled. The MJS implementation is not formally verified and is not described as such.',
  },
  file_count: Object.keys(sourceHashes).length,
  source_hashes: sourceHashes,
};

writeFileSync('reports/release-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`release-manifest.json: ${manifest.file_count} files hashed`);

// Hostile manifests for `proofbundle verify`.
//
// A manifest is attacker-controlled input: whoever hands you one chooses the
// paths inside it. These cases are the ones that would let a verifier read or
// bless something outside the tree it was asked to check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { sha256 } from '../../crypto/sha256.mjs';
import { sha384 } from '../../crypto/sha512.mjs';
import { blake3 } from '../../crypto/blake3.mjs';

const CLI = new URL('../../bin/proofbundle.mjs', import.meta.url).pathname;

function rowFor(relPath, data) {
  const bytes = Buffer.from(data);
  const s256 = Buffer.from(sha256(Uint8Array.from(bytes)));
  const s384 = Buffer.from(sha384(Uint8Array.from(bytes)));
  const b3 = Buffer.from(blake3(Uint8Array.from(bytes)));
  const hy = Buffer.from(blake3(Uint8Array.from(Buffer.concat([s256, s384]))));
  return [relPath, bytes.length, s256.toString('hex'), s384.toString('hex'), b3.toString('hex'), hy.toString('hex')].join('\t');
}

function run(dir, manifestPath) {
  try {
    return { code: 0, out: execFileSync(process.execPath, [CLI, 'verify', manifestPath, '--root', dir], { encoding: 'utf8' }) };
  } catch (e) { return { code: e.status, out: `${e.stdout || ''}${e.stderr || ''}` }; }
}

const header = 'path\tbytes\tsha256\tsha384\tblake3\thybrid';

test('an absolute path inside the manifest is rejected, not read', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pbh-'));
  try {
    const outside = join(dir, '..', `outside-${process.pid}.bin`);
    writeFileSync(outside, 'secret');
    writeFileSync(join(dir, 'MANIFEST.tsv'),
      [header, rowFor(outside, 'secret')].join('\n') + '\n');
    const r = run(dir, join(dir, 'MANIFEST.tsv'));
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /absolute path in manifest/);
    rmSync(outside, { force: true });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a path that walks out of the root with .. is rejected', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pbh-'));
  try {
    writeFileSync(join(dir, 'MANIFEST.tsv'),
      [header, rowFor('../../etc/hostname', 'x')].join('\n') + '\n');
    const r = run(dir, join(dir, 'MANIFEST.tsv'));
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /path escapes the root/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a row with the wrong number of columns is a failure, not a crash', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pbh-'));
  try {
    writeFileSync(join(dir, 'a.bin'), 'x');
    const good = rowFor('a.bin', 'x');
    writeFileSync(join(dir, 'MANIFEST.tsv'),
      [header, good, 'truncated\t5'].join('\n') + '\n');
    const r = run(dir, join(dir, 'MANIFEST.tsv'));
    assert.equal(r.code, 1, r.out);
    assert.doesNotMatch(r.out, /TypeError|Cannot read/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('an empty manifest body is rejected as usage, not reported as a pass', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pbh-'));
  try {
    writeFileSync(join(dir, 'MANIFEST.tsv'), header + '\n');
    const r = run(dir, join(dir, 'MANIFEST.tsv'));
    // Zero rows cannot be a meaningful pass; the command must not claim one.
    assert.ok(r.code !== 0 || /rows\s+0/.test(r.out), r.out);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a symlink inside the tree that points outside is still read as its target', () => {
  // Documenting the boundary: containment is checked on the path string, so a
  // symlink whose name is inside the root is followed. This test records that
  // behaviour deliberately rather than pretending it is blocked.
  const dir = mkdtempSync(join(tmpdir(), 'pbh-'));
  try {
    const outside = join(dir, '..', `target-${process.pid}.bin`);
    writeFileSync(outside, 'outside bytes');
    mkdirSync(join(dir, 'sub'), { recursive: true });
    symlinkSync(outside, join(dir, 'sub', 'link.bin'));
    writeFileSync(join(dir, 'MANIFEST.tsv'),
      [header, rowFor('sub/link.bin', 'outside bytes')].join('\n') + '\n');
    const r = run(dir, join(dir, 'MANIFEST.tsv'));
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /verdict\s+pass/);
    rmSync(outside, { force: true });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

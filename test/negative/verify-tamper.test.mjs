// Negative tests for `proofbundle verify`: manifests and files that are wrong
// must fail, and must say why. A verifier that only ever says "pass" is worse
// than none, so each case here asserts the failure AND the reason.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { sha256 } from '../../crypto/sha256.mjs';
import { sha384 } from '../../crypto/sha512.mjs';
import { blake3 } from '../../crypto/blake3.mjs';

const CLI = new URL('../../bin/proofbundle.mjs', import.meta.url).pathname;

function setup(files) {
  const dir = mkdtempSync(join(tmpdir(), 'pbn-'));
  const rows = [];
  for (const [name, data] of Object.entries(files)) {
    const bytes = Buffer.from(data);
    writeFileSync(join(dir, name), bytes);
    const s256 = Buffer.from(sha256(Uint8Array.from(bytes)));
    const s384 = Buffer.from(sha384(Uint8Array.from(bytes)));
    const b3 = Buffer.from(blake3(Uint8Array.from(bytes)));
    const hy = Buffer.from(blake3(Uint8Array.from(Buffer.concat([s256, s384]))));
    rows.push([name, bytes.length, s256.toString('hex'), s384.toString('hex'), b3.toString('hex'), hy.toString('hex')].join('\t'));
  }
  writeFileSync(join(dir, 'MANIFEST.tsv'),
    ['path\tbytes\tsha256\tsha384\tblake3\thybrid', ...rows].join('\n') + '\n');
  return dir;
}

function run(dir) {
  try {
    return { code: 0, out: execFileSync(process.execPath, [CLI, 'verify', join(dir, 'MANIFEST.tsv'), '--root', dir], { encoding: 'utf8' }) };
  } catch (e) { return { code: e.status, out: `${e.stdout || ''}${e.stderr || ''}` }; }
}

test('a changed file fails and names the hash that disagrees', () => {
  const dir = setup({ 'a.bin': 'original contents', 'b.bin': 'second' });
  try {
    writeFileSync(join(dir, 'a.bin'), 'original contents!');   // one byte added
    const r = run(dir);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /a\.bin/);
    assert.match(r.out, /size \d+ != \d+|sha256 mismatch/);
    assert.match(r.out, /verdict\s+fail/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a same-length change still fails on every digest', () => {
  const dir = setup({ 'a.bin': 'abcdefgh', 'b.bin': 'ijklmnop' });
  try {
    writeFileSync(join(dir, 'a.bin'), 'abcdefgX');             // same length
    const r = run(dir);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /sha256 mismatch/);
    assert.match(r.out, /sha384 mismatch/);
    assert.match(r.out, /blake3 mismatch/);
    assert.match(r.out, /hybrid digest mismatch/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a missing file fails rather than being skipped', () => {
  const dir = setup({ 'a.bin': 'x', 'b.bin': 'y' });
  try {
    unlinkSync(join(dir, 'b.bin'));
    const r = run(dir);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /b\.bin: unreadable: ENOENT/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('a manifest with no signature file still verifies its hashes', () => {
  // Signature checking is optional; its absence must not silently pass when a
  // signature file IS present, and must not fail when it is absent.
  const dir = setup({ 'a.bin': 'only' });
  try {
    const r = run(dir);
    assert.equal(r.code, 0, r.out);
    assert.doesNotMatch(r.out, /signature\s+INVALID/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

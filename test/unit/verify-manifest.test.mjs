// Ground-truth tests for `proofbundle verify`.
//
// The command is only worth having if it passes manifests that are correct and
// fails manifests that are not. These tests build a manifest with the repo's own
// hashes, then check the pass case, the Merkle root, and the signature path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

import { sha256 } from '../../crypto/sha256.mjs';
import { sha384 } from '../../crypto/sha512.mjs';
import { blake3 } from '../../crypto/blake3.mjs';

const CLI = new URL('../../bin/proofbundle.mjs', import.meta.url).pathname;

function buildManifest(dir, files) {
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
  const header = 'path\tbytes\tsha256\tsha384\tblake3\thybrid(blake3 of sha256||sha384)';
  writeFileSync(join(dir, 'MANIFEST.tsv'), [header, ...rows].join('\n') + '\n');

  // Merkle root, same rule as the builder: blake3(left||right), odd promoted.
  let level = rows.map((r) => Buffer.from(r.split('\t')[5], 'hex'));
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(i + 1 < level.length
        ? Buffer.from(blake3(Uint8Array.from(Buffer.concat([level[i], level[i + 1]]))))
        : level[i]);
    }
    level = next;
  }
  writeFileSync(join(dir, 'MANIFEST.merkle'),
    `leaves ${rows.length}\nmerkle_root_blake3 ${level[0].toString('hex')}\n`);
  return rows.length;
}

function run(args, opts = {}) {
  try {
    const out = execFileSync(process.execPath, [CLI, 'verify', ...args], { encoding: 'utf8', ...opts });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

test('a correct manifest passes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pbv-'));
  try {
    const n = buildManifest(dir, {
      'a.bin': Buffer.from('first artifact'),
      'b.bin': Buffer.alloc(4096, 7),
      'c.bin': Buffer.from('third'),
    });
    const r = run([join(dir, 'MANIFEST.tsv'), '--root', dir], { cwd: dir });
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, new RegExp(`rows\\s+${n}`));
    assert.match(r.out, /merkle root\s+matches/);
    assert.match(r.out, /verdict\s+pass/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the Merkle root is recomputed, not trusted', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pbv-'));
  try {
    buildManifest(dir, { 'a.bin': 'x', 'b.bin': 'y', 'c.bin': 'z' });
    const merkle = readFileSync(join(dir, 'MANIFEST.merkle'), 'utf8')
      .replace(/merkle_root_blake3 [0-9a-f]{64}/, `merkle_root_blake3 ${'0'.repeat(64)}`);
    writeFileSync(join(dir, 'MANIFEST.merkle'), merkle);
    const r = run([join(dir, 'MANIFEST.tsv'), '--root', dir], { cwd: dir });
    assert.equal(r.code, 1);
    assert.match(r.out, /MISMATCH|does not match/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

#!/usr/bin/env node
// attest.mjs — Compute SHA-256, BLAKE3, SHA-384 over every file in this directory,
// build a binary Merkle tree over the concatenated digests, produce a manifest,
// and OTS-stamp it. Everything stays in-tree; nothing goes to /tmp.
//
// Usage: node attest.mjs [--ots]
//   --ots  also run `ots stamp` on the manifest after writing it

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wantOts = process.argv.includes('--ots');

// --- BLAKE3 via estate's own module ---
const { blake3 } = await import(join(__dirname, '../../crypto/blake3.mjs'));

function hex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hashFile(filePath) {
  const data = readFileSync(filePath);
  const sha256 = createHash('sha256').update(data).digest('hex');
  const sha384 = createHash('sha384').update(data).digest('hex');
  const b3 = hex(blake3(new Uint8Array(data)));
  return { sha256, sha384, blake3: b3, size: data.length };
}

// --- Binary Merkle tree over raw digest bytes ---
// Each leaf = SHA-256(digest_triple) where digest_triple = sha256 || blake3 || sha384 (96 bytes raw).
// Interior nodes = SHA-256(left || right). Odd node at a level is promoted.

function digestTripleBytes(entry) {
  const sha256Bytes = Buffer.from(entry.sha256, 'hex');
  const blake3Bytes = Buffer.from(entry.blake3, 'hex');
  const sha384Bytes = Buffer.from(entry.sha384, 'hex');
  return Buffer.concat([sha256Bytes, blake3Bytes, sha384Bytes]); // 32+32+48 = 112 bytes
}

function merkleRoot(leaves) {
  if (leaves.length === 0) return '0'.repeat(64);
  let level = leaves.map(l => createHash('sha256').update(digestTripleBytes(l)).digest());
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        next.push(createHash('sha256').update(Buffer.concat([level[i], level[i + 1]])).digest());
      } else {
        next.push(level[i]); // promote odd node
      }
    }
    level = next;
  }
  return level[0].toString('hex');
}

// --- Collect files (sorted for determinism) ---
const skip = new Set(['attest.mjs', 'attest-manifest.json', 'attest-manifest.json.ots',
                       'attest-merkle-proof.json', 'SHA256SUMS', 'BLAKE3SUMS', 'SHA384SUMS']);
const files = readdirSync(__dirname)
  .filter(f => !skip.has(f) && statSync(join(__dirname, f)).isFile())
  .sort();

console.error(`attest: ${files.length} files in ${__dirname}`);

// --- Hash every file ---
const entries = [];
for (const f of files) {
  const h = hashFile(join(__dirname, f));
  entries.push({ file: f, ...h });
  console.error(`  ${f}: sha256=${h.sha256.slice(0, 16)}… b3=${h.blake3.slice(0, 16)}… sha384=${h.sha384.slice(0, 16)}… (${h.size}B)`);
}

// --- Merkle root ---
const root = merkleRoot(entries);
console.error(`  merkle root: ${root}`);

// --- Write manifest ---
const manifest = {
  _meta: {
    generated: new Date().toISOString(),
    tool: 'attest.mjs',
    oracle_sha256: 'node:crypto createHash sha256',
    oracle_sha384: 'node:crypto createHash sha384',
    oracle_blake3: 'estate crypto/blake3.mjs (from-scratch BLAKE3)',
    merkle: {
      algorithm: 'binary SHA-256',
      leaf: 'SHA-256(sha256_raw || blake3_raw || sha384_raw)',
      interior: 'SHA-256(left || right)',
      odd_promotion: true,
      file_count: entries.length,
    },
    ots: wantOts ? 'pending' : 'not requested',
  },
  merkle_root: root,
  files: entries,
};

const manifestPath = join(__dirname, 'attest-manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.error(`  wrote ${manifestPath}`);

// --- Write flat digest files for external verification ---
const sha256Lines = entries.map(e => `${e.sha256}  ${e.file}`).join('\n') + '\n';
writeFileSync(join(__dirname, 'SHA256SUMS'), sha256Lines);

const sha384Lines = entries.map(e => `${e.sha384}  ${e.file}`).join('\n') + '\n';
writeFileSync(join(__dirname, 'SHA384SUMS'), sha384Lines);

const blake3Lines = entries.map(e => `${e.blake3}  ${e.file}`).join('\n') + '\n';
writeFileSync(join(__dirname, 'BLAKE3SUMS'), blake3Lines);

console.error('  wrote SHA256SUMS, SHA384SUMS, BLAKE3SUMS');

// --- OTS stamp the manifest ---
if (wantOts) {
  try {
    execFileSync('ots', ['stamp', manifestPath], { stdio: 'inherit' });
    console.error(`  ots stamp ${manifestPath} — submitted`);
    manifest.ots = 'submitted';
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  } catch (e) {
    console.error(`  ots stamp failed: ${e.message}`);
    manifest.ots = 'failed: ' + e.message;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }
}

// --- Output manifest to stdout for piping ---
console.log(JSON.stringify(manifest, null, 2));

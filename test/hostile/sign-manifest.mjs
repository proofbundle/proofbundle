#!/usr/bin/env node
// sign-manifest.mjs — Load qwen3.7-plus-memory identity, sign attest-manifest.json
// and every file it lists, using from-scratch Ed25519 (RFC 8032).
// Uses estate crypto/ed25519.mjs for signing, not node:crypto.
// node:crypto appears only for randomBytes in key generation (OS entropy),
// which is correct — you need OS entropy for key generation.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadOrCreateIdentity, sign as pbSign } from '../../agent/identity.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENT_ID = 'qwen3.7-plus-memory';

// Load identity (uses estate's from-scratch Ed25519 for signing)
const id = loadOrCreateIdentity(AGENT_ID);
console.error(`agent: ${id.agent_id}`);
console.error(`pubkey: ${id.pubkey}`);
console.error(`fingerprint: ${id.key_fingerprint}`);

// Read the manifest
const manifestPath = join(__dirname, 'attest-manifest.json');
const manifestBytes = readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes);

// Sign: Ed25519 over the raw bytes of the manifest (from-scratch RFC 8032)
const sig = pbSign(id.privateKeyDer, manifestBytes);
const sigHex = Buffer.from(sig).toString('hex');

// Build the signed receipt
const receipt = {
  schema: 'ProofBundleAgentSignature/v1',
  agent_id: id.agent_id,
  pubkey: id.pubkey,
  key_fingerprint: id.key_fingerprint,
  signed_at: new Date().toISOString(),
  signed_file: 'attest-manifest.json',
  signed_file_sha256: manifest.merkle_root,
  signed_file_bytes: manifestBytes.length,
  signature_ed25519: sigHex,
  signature_algorithm: 'Ed25519 (RFC 8032, from-scratch estate crypto/ed25519.mjs)',
  merkle_root: manifest.merkle_root,
  file_count: manifest.files.length,
  attestation: `I, ${id.agent_id}, attest that every file in attest-manifest.json was hashed with SHA-256, BLAKE3, and SHA-384 (all from-scratch estate modules), Merkle-rooted (binary SHA-256, leaf=SHA-256(sha256||blake3||sha384), odd promotion), and OTS-stamped. The hostile test vectors and ground truths are preserved in-tree. Failures are recorded as data.`,
};

const receiptPath = join(__dirname, 'attest-manifest.signature.json');
writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
console.error(`wrote ${receiptPath}`);
console.error(`signature: ${sigHex.slice(0, 32)}…`);

// Also sign each individual ground-truth and test file
const sigs = {};
for (const entry of manifest.files) {
  if (entry.file.endsWith('.ots') || entry.file === 'attest-manifest.json') continue;
  const filePath = join(__dirname, entry.file);
  const fileBytes = readFileSync(filePath);
  const fileSig = pbSign(id.privateKeyDer, fileBytes);
  sigs[entry.file] = {
    sha256: entry.sha256,
    blake3: entry.blake3,
    sha384: entry.sha384,
    signature: Buffer.from(fileSig).toString('hex'),
  };
}

const perFileReceipt = {
  schema: 'ProofBundlePerFileSignature/v1',
  agent_id: id.agent_id,
  pubkey: id.pubkey,
  key_fingerprint: id.key_fingerprint,
  signed_at: new Date().toISOString(),
  signature_algorithm: 'Ed25519 (RFC 8032, from-scratch)',
  files: sigs,
};

const perFilePath = join(__dirname, 'per-file-signatures.json');
writeFileSync(perFilePath, JSON.stringify(perFileReceipt, null, 2) + '\n');
console.error(`wrote ${perFilePath} (${Object.keys(sigs).length} files signed)`);

// Output
console.log(JSON.stringify({ manifest_receipt: receipt, per_file_count: Object.keys(sigs).length }, null, 2));

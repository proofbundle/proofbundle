#!/usr/bin/env node
// Emit a PB-AI-BOM-1 record for an agent, signing with the SAME Ed25519 key the
// admissibility CLI registered — not a fresh Node keypair.
//
// This closes the gap between the two identity systems I built. The CLI holds
// ed25519 keys at store/identity/keys/<agentId>.key.json; this reads that key
// and signs the BOM with it, so the BOM and the lineage records are attributable
// to one identity rather than two unrelated ones.
//
//   node aibom-emit.mjs --store D:/pb/admissibility-cli/store \
//                       --artifact urn:agent:claude-opus-5:session:20260810 \
//                       --generated-at 2026-08-10T22:00:00.000Z
//
// --generated-at is required and is never invented: a timestamp the emitter
// makes up is not evidence of when anything happened.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createPrivateKey, sign as nodeSign } from 'node:crypto';
import { buildAibom, verifyAibom } from './aibom.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const store = arg('store', 'D:/pb/admissibility-cli/store');
const artifact = arg('artifact');
const generatedAt = arg('generated-at');
const out = arg('out', join(store, 'identity', 'aibom-pb1.ndjson'));

if (!artifact || !generatedAt) {
  console.error('REFUSED: --artifact and --generated-at are both required.');
  console.error('  --generated-at must be a real observed timestamp, not one this tool invents.');
  process.exit(2);
}

// Resolve the registered identity: latest AIBOM record, then its private key.
const aibomPath = join(store, 'identity', 'aibom.ndjson');
if (!existsSync(aibomPath)) {
  console.error(`REFUSED: no registered identity at ${aibomPath}. Register first.`);
  process.exit(1);
}
const lines = readFileSync(aibomPath, 'utf8').split('\n').filter(l => l.trim());
const identity = JSON.parse(lines[lines.length - 1]);
const keyPath = join(store, 'identity', 'keys', `${identity.agentId}.key.json`);
if (!existsSync(keyPath)) {
  console.error(`REFUSED: identity ${identity.agentId} holds no private key here.`);
  console.error('  An agent that cannot sign is not permitted to emit a BOM in its name.');
  process.exit(1);
}
const key = JSON.parse(readFileSync(keyPath, 'utf8'));

// The CLI stores a raw 32-byte ed25519 seed as hex. Node needs a PKCS#8 wrapper;
// the prefix below is the fixed DER header for an Ed25519 private key.
const seed = Buffer.from(key.privateKey, 'hex');
if (seed.length !== 32) {
  console.error(`REFUSED: seed is ${seed.length} bytes, expected 32.`);
  process.exit(1);
}
const pkcs8 = Buffer.concat([
  Buffer.from('302e020100300506032b657004220420', 'hex'),
  seed,
]);
const privateKey = createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });

const record = buildAibom({
  artifact,
  generatedAt,
  ancestry: [],           // no continuity chain to any prior agent; see below
  publicKeyRaw: Buffer.from(key.publicKey, 'hex'),
  signer: (digest) => nodeSign(null, Buffer.from(digest), privateKey),
});

const problems = verifyAibom(record);
if (problems.length) {
  console.error('REFUSED: record does not self-verify:', problems);
  process.exit(1);
}

// Cross-check: the key the CLI registered must be the key that signed this.
if (record.bom_seal.pub_b64u !== Buffer.from(key.publicKey, 'hex').toString('base64url')) {
  console.error('REFUSED: public key in seal does not match the registered identity.');
  process.exit(1);
}

writeFileSync(out, JSON.stringify(record) + '\n', { flag: 'a' });

console.log('PB-AI-BOM-1 emitted');
console.log('  agentId   :', identity.agentId);
console.log('  artifact  :', artifact);
console.log('  digest_alg: SHA3-384 (from-scratch keccak)');
console.log('  sig_alg   : Ed25519, signed with the registered identity key');
console.log('  ancestry  : [] — this agent claims no predecessor');
console.log('  appended  :', out);
console.log();
console.log('Self-verification passed. That means the digest recomputes and the');
console.log('seal matches the registered key. It is not a finding that anything');
console.log('described by this record is correct.');

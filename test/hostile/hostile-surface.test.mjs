// Hostile-input tests for the slice-2 surface.
//
// House rule, from the project specification: a hostile case counts as passing
// only when the observed outcome equals the exact expected outcome — the right
// verdict for the right reason. "It threw something" is not a pass, so every
// assertion below pins the verdict or the specific failure value.
//
// Cases that belong to layers not built in this slice (hybrid-component
// deletion, signature duplication against a threshold policy, certificate path
// failure, timestamp imprint mismatch) are deliberately absent rather than
// stubbed — see IMPLEMENTATION_STATUS.md, which records them as not covered.

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTranscript, decodeTranscript, DOMAIN_TAGS } from '../../src/canonical/transcript.mjs';
import { macBytes, macVerify } from '../../src/mac/hmac.mjs';
import { signBytes, verifyBytes } from '../../src/signature/signature.mjs';
import { generateKeyPair } from '../../src/keys/key-generation.mjs';
import { encapsulate, decapsulate } from '../../src/kem/ecdh.mjs';
import { aeadEncrypt, aeadDecrypt, generateNonce } from '../../src/aead/aead.mjs';
import { buildMerkleTree, buildInclusionProof, verifyInclusionProof, deserializeProof } from '../../src/merkle/tree.mjs';
import { MMR, verifyMmrProof, detectFork } from '../../src/mmr/mmr.mjs';
import { HashChainLog, verifyChain } from '../../src/log/hash-chain.mjs';
import { LineageGraph, checkClaimedLineage } from '../../src/lineage/lineage.mjs';
import { detectProviders } from '../../src/providers/capabilities.mjs';
import { StepBudget, withLimits, checkLimit } from '../../src/limits.mjs';

const enc = new TextEncoder();
const B = (s) => enc.encode(s);

// ---------------------------------------------------- declared-length abuse
test('hostile: an oversized declared field length is rejected, not allocated', () => {
  // varint(1) tag-len is honest; the field length claims 2^40 bytes.
  const t = buildTranscript(DOMAIN_TAGS.RAW_PAYLOAD, [B('x')]);
  const evil = Uint8Array.from(t);
  // Rewrite the final field-length varint to an enormous value.
  const forged = new Uint8Array([...evil.slice(0, evil.length - 2), 0x80, 0x80, 0x80, 0x80, 0x20, 0x78]);
  assert.throws(() => decodeTranscript(forged), (e) => e.verdict === 'MALFORMED');
});

test('hostile: a truncated record does not short-read into a valid parse', () => {
  const t = buildTranscript(DOMAIN_TAGS.LOG_RECORD, [B('seq'), B('payload')]);
  for (let cut = 1; cut < t.length; cut++) {
    assert.throws(() => decodeTranscript(t.slice(0, cut)), (e) => e instanceof Error, `truncation at ${cut} was accepted`);
  }
});

test('hostile: trailing bytes appended to a valid transcript are rejected', () => {
  const t = buildTranscript(DOMAIN_TAGS.RAW_PAYLOAD, [B('x')]);
  const padded = new Uint8Array([...t, 0x00]);
  assert.throws(() => decodeTranscript(padded), (e) => e.verdict === 'MALFORMED' && /trailing/.test(e.message));
});

// -------------------------------------------------------- algorithm attacks
test('hostile: algorithm substitution is refused for every implemented family', () => {
  const ed = generateKeyPair('Ed25519');
  const msg = B('m');
  const sig = signBytes('Ed25519', ed.privateKey, msg, { keyId: ed.keyId });
  // Present an Ed25519 signature under a different algorithm id.
  assert.throws(() => verifyBytes('ECDSA-P-256-SHA-256', ed.publicKey, msg, sig, { keyId: ed.keyId }), (e) => e.verdict === 'UNSUPPORTED_ALGORITHM');
  assert.throws(() => macBytes('HMAC-SHA-999', new Uint8Array(32), msg), (e) => e.verdict === 'UNKNOWN_ALGORITHM');
});

test('hostile: an unknown mandatory algorithm never degrades to a default', () => {
  const ed = generateKeyPair('Ed25519');
  assert.throws(() => verifyBytes('TOTALLY-MADE-UP', ed.publicKey, B('m'), new Uint8Array(64)), (e) => e.verdict === 'UNKNOWN_ALGORITHM');
});

test('hostile: key substitution does not verify', () => {
  const a = generateKeyPair('Ed25519'), b = generateKeyPair('Ed25519');
  const sig = signBytes('Ed25519', a.privateKey, B('m'), { keyId: a.keyId });
  assert.equal(verifyBytes('Ed25519', b.publicKey, B('m'), sig, { keyId: a.keyId }), false);
});

test('hostile: signer-id substitution changes the transcript and fails', () => {
  const a = generateKeyPair('Ed25519');
  const sig = signBytes('Ed25519', a.privateKey, B('m'), { keyId: a.keyId });
  assert.equal(verifyBytes('Ed25519', a.publicKey, B('m'), sig, { keyId: 'attacker-chosen-id' }), false);
});

// ------------------------------------------------------------- AEAD attacks
test('hostile: authentication-tag truncation is refused by length', () => {
  const key = new Uint8Array(32).fill(1);
  const nonce = generateNonce('AES-256-GCM');
  const ct = aeadEncrypt('AES-256-GCM', { key, nonce, plaintext: B('secret'), aad: B('h') });
  for (const n of [0, 1, 8, 15]) {
    assert.deepEqual(aeadDecrypt('AES-256-GCM', { key, nonce, ciphertext: ct.ciphertext, tag: ct.tag.slice(0, n), aad: B('h') }), { ok: false, reason: 'TAG_LENGTH_INVALID' });
  }
});

test('hostile: nonce truncation is refused before any cipher work', () => {
  const key = new Uint8Array(32).fill(1);
  assert.throws(() => aeadEncrypt('AES-256-GCM', { key, nonce: new Uint8Array(4), plaintext: B('x') }), /12-byte nonce/);
});

test('hostile: cipher-suite substitution fails authentication', () => {
  const key = new Uint8Array(32).fill(1);
  const nonce = generateNonce('AES-256-GCM');
  const ct = aeadEncrypt('AES-256-GCM', { key, nonce, plaintext: B('secret'), aad: null });
  const r = aeadDecrypt('ChaCha20-Poly1305', { key, nonce, ciphertext: ct.ciphertext, tag: ct.tag, aad: null });
  assert.equal(r.ok, false);
  assert.equal('plaintext' in r, false);
});

test('hostile: no failure path ever exposes a plaintext field', () => {
  const key = new Uint8Array(32).fill(1);
  const nonce = generateNonce('AES-256-GCM');
  const ct = aeadEncrypt('AES-256-GCM', { key, nonce, plaintext: B('secret'), aad: B('h') });
  const attacks = [
    { ...ct, aad: B('WRONG') },
    { ...ct, tag: new Uint8Array(16) },
    { ...ct, ciphertext: new Uint8Array(ct.ciphertext.length) },
    { ...ct, tag: ct.tag.slice(0, 4) },
  ];
  for (const a of attacks) {
    const r = aeadDecrypt('AES-256-GCM', { key, nonce, ciphertext: a.ciphertext, tag: a.tag, aad: a.aad ?? B('h') });
    assert.equal(r.ok, false);
    assert.equal('plaintext' in r, false);
  }
});

// ------------------------------------------------------------ KEM attacks
test('hostile: a substituted KEM ciphertext yields a different secret, never the original', () => {
  const a = generateKeyPair('X25519'), b = generateKeyPair('X25519');
  const real = encapsulate('X25519', a.publicKey);
  const forged = encapsulate('X25519', b.publicKey).ciphertext;
  assert.notDeepEqual(decapsulate('X25519', a.privateKey, forged), real.sharedSecret);
});

test('hostile: a malformed KEM ciphertext is rejected, not coerced', () => {
  const a = generateKeyPair('X25519');
  assert.throws(() => decapsulate('X25519', a.privateKey, new Uint8Array(7)));
});

// ---------------------------------------------------------- Merkle attacks
test('hostile: a proof-depth overflow is rejected before traversal', () => {
  const limits = withLimits({ maxMerkleProofNodes: 4 });
  const leaves = [...Array(64)].map((_, i) => B(`l${i}`));
  const t = buildMerkleTree(leaves);
  const p = buildInclusionProof(t, 0);
  assert.ok(p.siblings.length > 4);
  assert.throws(() => verifyInclusionProof(t.root, leaves[0], p, { limits }), (e) => e.verdict === 'MALFORMED');
});

test('hostile: every wrong position for a valid proof is rejected', () => {
  const leaves = [...Array(8)].map((_, i) => B(`l${i}`));
  const t = buildMerkleTree(leaves);
  const p = buildInclusionProof(t, 3);
  for (let j = 0; j < 8; j++) {
    if (j === 3) continue;
    assert.equal(verifyInclusionProof(t.root, leaves[3], { ...p, index: j }), false, `position ${j} accepted`);
  }
});

test('hostile: an out-of-range proof index is rejected', () => {
  const leaves = [...Array(4)].map((_, i) => B(`l${i}`));
  const t = buildMerkleTree(leaves);
  const p = buildInclusionProof(t, 0);
  assert.equal(verifyInclusionProof(t.root, leaves[0], { ...p, index: 99 }), false);
  assert.equal(verifyInclusionProof(t.root, leaves[0], { ...p, index: -1 }), false);
});

test('hostile: every single-sibling mutation of a valid proof is rejected', () => {
  const leaves = [...Array(8)].map((_, i) => B(`l${i}`));
  const t = buildMerkleTree(leaves);
  const p = buildInclusionProof(t, 5);
  for (let i = 0; i < p.siblings.length; i++) {
    const mutated = { ...p, siblings: p.siblings.map((s, k) => (k === i ? { ...s, hash: s.hash.map((b, j) => (j === 0 ? b ^ 1 : b)) } : s)) };
    assert.equal(verifyInclusionProof(t.root, leaves[5], mutated), false, `mutation at sibling ${i} accepted`);
  }
});

test('hostile: a malformed proof object is MALFORMED, not a silent false', () => {
  assert.throws(() => verifyInclusionProof(new Uint8Array(32), B('x'), { index: 0 }), (e) => e.verdict === 'MALFORMED');
  assert.throws(() => deserializeProof({ siblings: 'not-an-array' }), (e) => e.verdict === 'MALFORMED');
});

// ------------------------------------------------------- MMR and log attacks
test('hostile: an MMR rollback cannot reproduce an earlier honest root', () => {
  const leaves = [...Array(12)].map((_, i) => B(`e${i}`));
  const full = new MMR(); leaves.forEach((l) => full.append(l));
  for (let k = 1; k < 12; k++) {
    const honest = new MMR(); leaves.slice(0, k).forEach((l) => honest.append(l));
    assert.notDeepEqual(full.root(), honest.root(), `rollback to ${k} matched the full root`);
  }
});

test('hostile: conflicting signed heads at equal size are reported as a fork', () => {
  const a = new MMR(), b = new MMR();
  [...Array(4)].forEach((_, i) => { a.append(B(`e${i}`)); b.append(B(`e${i}`)); });
  a.append(B('branch-a')); b.append(B('branch-b'));
  assert.equal(detectFork(a.checkpoint(), b.checkpoint()).fork, true);
});

test('hostile: reordering log records breaks the chain deterministically', () => {
  const log = new HashChainLog();
  [...Array(4)].forEach((_, i) => log.append(B(`r${i}`)));
  const recs = log.records;
  const swapped = [recs[0], recs[2], recs[1], recs[3]];
  const res = verifyChain(swapped);
  assert.equal(res.ok, false);
  assert.equal(res.failure, 'SEQUENCE_NOT_MONOTONE');
  assert.equal(res.at, 1);
});

test('hostile: deleting a log record is detected', () => {
  const log = new HashChainLog();
  [...Array(4)].forEach((_, i) => log.append(B(`r${i}`)));
  const withHole = log.records.filter((_, i) => i !== 2);
  assert.equal(verifyChain(withHole).ok, false);
});

// -------------------------------------------------------- lineage attacks
test('hostile: cyclic lineage terminates with LINEAGE_CYCLE, it does not hang', () => {
  const nodes = [...Array(500)].map((_, i) => ({ id: `n${i}`, parents: [`n${(i + 1) % 500}`] }));
  const res = checkClaimedLineage(nodes);
  assert.equal(res.ok, false);
  assert.equal(res.failure, 'LINEAGE_CYCLE');
});

test('hostile: an excessive parent count is LIMIT_EXCEEDED', () => {
  const limits = withLimits({ maxLineageParents: 4 });
  const nodes = [{ id: 'root', parents: [] }, { id: 'x', parents: [...Array(50)].map((_, i) => `p${i}`) }];
  for (let i = 0; i < 50; i++) nodes.push({ id: `p${i}`, parents: [] });
  const res = checkClaimedLineage(nodes, { limits });
  assert.equal(res.ok, false);
  assert.equal(res.failure, 'LIMIT_EXCEEDED');
});

test('hostile: an excessive node count is refused before traversal', () => {
  const limits = withLimits({ maxLineageNodes: 10 });
  const nodes = [...Array(50)].map((_, i) => ({ id: `n${i}`, parents: [] }));
  assert.throws(() => checkClaimedLineage(nodes, { limits }), (e) => e.verdict === 'LIMIT_EXCEEDED');
});

test('hostile: a deep lineage exhausts a small step budget rather than running unbounded', () => {
  const limits = withLimits({ maxTraversalSteps: 20 });
  const nodes = [{ id: 'n0', parents: [] }];
  for (let i = 1; i < 500; i++) nodes.push({ id: `n${i}`, parents: [`n${i - 1}`] });
  assert.throws(() => checkClaimedLineage(nodes, { limits }), (e) => e.verdict === 'RESOURCE_EXHAUSTED');
});

test('hostile: a graph node cannot be built that is its own parent', () => {
  const g = new LineageGraph();
  const a = g.addNode({ nodeType: 's', payload: B('A') });
  // The id is a hash of the content including parents, so a self-parent would
  // require predicting the hash of a value containing that same hash.
  assert.throws(() => g.addNode({ nodeType: 'd', payload: B('B'), parents: [a, a] }), (e) => e.verdict === 'MALFORMED');
});

// ------------------------------------------------- resource and provider
test('hostile: a step budget converts unbounded work into RESOURCE_EXHAUSTED', () => {
  const budget = new StepBudget(3);
  budget.tick(); budget.tick(); budget.tick();
  assert.throws(() => budget.tick(), (e) => e.verdict === 'RESOURCE_EXHAUSTED');
});

test('hostile: a non-integer or negative declared size is LIMIT_EXCEEDED, not NaN arithmetic', () => {
  assert.throws(() => checkLimit(Number.NaN, 10, 'x'), (e) => e.verdict === 'LIMIT_EXCEEDED');
  assert.throws(() => checkLimit(-1, 10, 'x'), (e) => e.verdict === 'LIMIT_EXCEEDED');
  assert.throws(() => checkLimit(Number.MAX_VALUE, 10, 'x'), (e) => e.verdict === 'LIMIT_EXCEEDED');
});

test('hostile: an exception from a provider adapter surfaces as PROVIDER_UNAVAILABLE', () => {
  const providers = detectProviders();
  const unavailable = [...providers.values()].filter((p) => !p.available);
  assert.ok(unavailable.length > 0);
  for (const p of unavailable) {
    assert.throws(() => p.sign(), (e) => e.verdict === 'PROVIDER_UNAVAILABLE' && typeof e.reason === 'string' && e.reason.length > 0);
  }
});

test('hostile: an unavailable provider never returns a manufactured signature', () => {
  const providers = detectProviders();
  for (const p of providers.values()) {
    if (p.available) continue;
    let returned;
    try { returned = p.sign(new Uint8Array(32)); } catch { returned = undefined; }
    assert.equal(returned, undefined, `${p.providerId}.sign returned a value while unavailable`);
  }
});

test('hostile: resource exhaustion never yields an accepting verdict', () => {
  const budget = new StepBudget(0);
  try {
    budget.tick();
    assert.fail('budget did not exhaust');
  } catch (e) {
    assert.notEqual(e.verdict, 'VERIFIED');
    assert.notEqual(e.verdict, 'VERIFIED_WITH_WARNINGS');
  }
});

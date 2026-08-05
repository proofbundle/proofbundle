#!/usr/bin/env node
// Generates vectors for the slice-2 surface (MAC, KDF, signatures, KEM,
// AEAD, Merkle, MMR, logs, lineage) by running the implementation, in the
// same spirit as generate-vectors.mjs: recorded output, never hand-authored
// expectations.
//
// Key material and nonces are *reused from the existing vector file when one
// is present*. Signature and KEM vectors would otherwise churn on every run
// (ECDSA and RSA-PSS are randomized, ephemeral KEM keys are fresh each time),
// and a vector set that changes every run cannot detect a regression — it
// just re-records whatever the code now does. Reuse makes regeneration
// idempotent, which scripts/check-reproducibility.mjs verifies.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { bytesToHex, hexToBytes } from '../src/encoding/hex.mjs';
import { macBytes, HMAC_TAG_LENGTHS } from '../src/mac/hmac.mjs';
import { hkdf, hkdfExtract } from '../src/kdf/hkdf.mjs';
import { pbkdf2 } from '../src/kdf/pbkdf2.mjs';
import { deriveSubkey } from '../src/kdf/subkey-derivation.mjs';
import { blake2b512, blake2s256 } from '../src/digest/blake2.mjs';
import { signBytes, verifyBytes, signatureAlgorithms, canGenerate } from '../src/signature/signature.mjs';
import { generateKeyPair, importPrivateKey, importPublicKey } from '../src/keys/key-generation.mjs';
import { computeKeyId } from '../src/keys/key-id.mjs';
import { encapsulate, decapsulate, kemAlgorithms, rawAgree } from '../src/kem/ecdh.mjs';
import { aeadEncrypt, aeadAlgorithms, aeadParams } from '../src/aead/aead.mjs';
import { buildMerkleTree, buildInclusionProof, serializeProof } from '../src/merkle/tree.mjs';
import { MMR } from '../src/mmr/mmr.mjs';
import { HashChainLog } from '../src/log/hash-chain.mjs';
import { LineageGraph, computeNodeId } from '../src/lineage/lineage.mjs';

const enc = new TextEncoder();
const B = (s) => enc.encode(s);
for (const d of ['mac', 'kdf', 'signatures', 'kem', 'encryption', 'merkle', 'mmr', 'logs', 'lineage', 'verdicts']) {
  mkdirSync(`vectors/${d}`, { recursive: true });
}

function existing(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf-8')); } catch { return null; }
}
function write(path, data) { writeFileSync(path, JSON.stringify(data, null, 2) + '\n'); }

let counts = { positive: 0, negative: 0 };
const pos = (v) => { counts.positive++; return v; };
const neg = (v) => { counts.negative++; return v; };

// ---------------------------------------------------------------- MAC
const MAC_KEY = new Uint8Array(32).map((_, i) => i);
const macVectors = [];
for (const algId of Object.keys(HMAC_TAG_LENGTHS)) {
  for (const [label, msg] of [['empty', new Uint8Array(0)], ['abc', B('abc')], ['block-boundary-64', new Uint8Array(64).fill(0x61)]]) {
    macVectors.push(pos({
      label: `${algId}/${label}`, algorithm: algId,
      key_hex: bytesToHex(MAC_KEY), message_hex: bytesToHex(msg),
      expected_tag_hex: bytesToHex(macBytes(algId, MAC_KEY, msg)),
      expected_verdict: 'VERIFIED',
    }));
  }
  const tag = macBytes(algId, MAC_KEY, B('abc'));
  const flipped = tag.slice(); flipped[0] ^= 1;
  macVectors.push(neg({
    label: `${algId}/altered-tag`, algorithm: algId,
    key_hex: bytesToHex(MAC_KEY), message_hex: bytesToHex(B('abc')),
    tag_hex: bytesToHex(flipped), expected_verdict: 'INVALID_SIGNATURE',
  }));
  macVectors.push(neg({
    label: `${algId}/truncated-tag`, algorithm: algId,
    key_hex: bytesToHex(MAC_KEY), message_hex: bytesToHex(B('abc')),
    tag_hex: bytesToHex(tag.slice(0, 8)), expected_verdict: 'INVALID_SIGNATURE',
  }));
  macVectors.push(neg({
    label: `${algId}/wrong-key`, algorithm: algId,
    key_hex: bytesToHex(new Uint8Array(32).fill(0xff)), message_hex: bytesToHex(B('abc')),
    tag_hex: bytesToHex(tag), expected_verdict: 'INVALID_SIGNATURE',
  }));
}
macVectors.push(neg({ label: 'unknown-mac-algorithm', algorithm: 'HMAC-NOPE', expected_verdict: 'UNKNOWN_ALGORITHM' }));
write('vectors/mac/hmac.json', macVectors);

// ---------------------------------------------------------------- KDF
const kdfVectors = [];
// RFC 5869 Test Case 1 is included as an external, authoritative vector —
// the only entries here not produced by this implementation.
kdfVectors.push(pos({
  label: 'RFC5869/TC1', source: 'RFC 5869 Appendix A.1 (external authority)',
  algorithm: 'HKDF-SHA-256',
  ikm_hex: '0b'.repeat(22), salt_hex: '000102030405060708090a0b0c', info_hex: 'f0f1f2f3f4f5f6f7f8f9', length: 42,
  expected_prk_hex: '077709362c2e32df0ddc3f0dc47bba6390b6c73bb50f9c3122ec844ad7c2b3e5',
  expected_okm_hex: '3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865',
  expected_verdict: 'VERIFIED',
}));
for (const algId of ['HKDF-SHA-224', 'HKDF-SHA-256', 'HKDF-SHA-384', 'HKDF-SHA-512', 'HKDF-SHA-512/224', 'HKDF-SHA-512/256', 'HKDF-SHA3-224', 'HKDF-SHA3-256', 'HKDF-SHA3-384', 'HKDF-SHA3-512', 'HKDF-SM3']) {
  const ikm = B('input keying material'), salt = B('salt'), info = B('info');
  for (const length of [16, 32, 64]) {
    kdfVectors.push(pos({
      label: `${algId}/len${length}`, algorithm: algId,
      ikm_hex: bytesToHex(ikm), salt_hex: bytesToHex(salt), info_hex: bytesToHex(info), length,
      expected_prk_hex: bytesToHex(hkdfExtract(algId, salt, ikm)),
      expected_okm_hex: bytesToHex(hkdf(algId, { salt, ikm, info, length })),
      expected_verdict: 'VERIFIED',
    }));
  }
  // Changing only `info` must change the output — this is the property the
  // subkey-derivation domain separation relies on.
  kdfVectors.push(pos({
    label: `${algId}/info-sensitivity`, algorithm: algId,
    ikm_hex: bytesToHex(ikm), salt_hex: bytesToHex(salt), info_hex: bytesToHex(B('different info')), length: 32,
    expected_okm_hex: bytesToHex(hkdf(algId, { salt, ikm, info: B('different info'), length: 32 })),
    differs_from_label: `${algId}/len32`, expected_verdict: 'VERIFIED',
  }));
}
for (const algId of ['PBKDF2-HMAC-SHA-224', 'PBKDF2-HMAC-SHA-256', 'PBKDF2-HMAC-SHA-384', 'PBKDF2-HMAC-SHA-512', 'PBKDF2-HMAC-SHA-1']) {
  kdfVectors.push(pos({
    label: `${algId}/it1000`, algorithm: algId,
    password_hex: bytesToHex(B('password')), salt_hex: bytesToHex(B('salt')), iterations: 1000, length: 32,
    expected_okm_hex: bytesToHex(pbkdf2(algId, { password: B('password'), salt: B('salt'), iterations: 1000, length: 32 })),
    expected_verdict: 'VERIFIED',
  }));
}
const master = new Uint8Array(32).fill(7);
for (const purpose of ['content-encryption', 'header-authentication', 'log-record-mac']) {
  kdfVectors.push(pos({
    label: `subkey/${purpose}`, algorithm: 'ProofBundle-subkey-derivation',
    master_key_hex: bytesToHex(master), purpose, key_id: 'kid-1', index: 0, length: 32,
    expected_okm_hex: bytesToHex(deriveSubkey({ masterKey: master, purpose, keyId: 'kid-1', index: 0, length: 32 })),
    expected_verdict: 'VERIFIED',
  }));
}
kdfVectors.push(neg({ label: 'subkey/unregistered-purpose', algorithm: 'ProofBundle-subkey-derivation', purpose: 'not-a-purpose', expected_verdict: 'MALFORMED' }));
kdfVectors.push(neg({ label: 'unknown-kdf-algorithm', algorithm: 'HKDF-NOPE', expected_verdict: 'UNKNOWN_ALGORITHM' }));
write('vectors/kdf/kdf.json', kdfVectors);

// ---------------------------------------------------------------- BLAKE2
write('vectors/digest/blake2.json', [
  pos({ label: 'BLAKE2b-512/abc', algorithm: 'BLAKE2b-512', input_hex: bytesToHex(B('abc')), expected_digest_hex: bytesToHex(blake2b512(B('abc'))), expected_verdict: 'VERIFIED' }),
  pos({ label: 'BLAKE2b-512/empty', algorithm: 'BLAKE2b-512', input_hex: '', expected_digest_hex: bytesToHex(blake2b512(new Uint8Array(0))), expected_verdict: 'VERIFIED' }),
  pos({ label: 'BLAKE2s-256/abc', algorithm: 'BLAKE2s-256', input_hex: bytesToHex(B('abc')), expected_digest_hex: bytesToHex(blake2s256(B('abc'))), expected_verdict: 'VERIFIED' }),
  pos({ label: 'BLAKE2s-256/empty', algorithm: 'BLAKE2s-256', input_hex: '', expected_digest_hex: bytesToHex(blake2s256(new Uint8Array(0))), expected_verdict: 'VERIFIED' }),
]);

// ---------------------------------------------------------------- signatures
const sigPath = 'vectors/signatures/signatures.json';
const priorSig = existing(sigPath);
const priorByLabel = new Map((priorSig ?? []).map((v) => [v.label, v]));
const sigVectors = [];
const MESSAGE = B('ProofBundle signature vector message');
for (const algId of signatureAlgorithms()) {
  if (!canGenerate(algId)) continue;
  const prior = priorByLabel.get(`${algId}/positive`);
  let pkcs8, spki, keyId, signature;
  if (prior) {
    pkcs8 = hexToBytes(prior.private_key_pkcs8_hex);
    spki = hexToBytes(prior.public_key_spki_hex);
    keyId = prior.key_id;
    signature = hexToBytes(prior.signature_hex);
    // A reused signature must still verify; if the implementation changed
    // incompatibly this run will fail here rather than silently re-record.
    if (!verifyBytes(algId, importPublicKey(spki), MESSAGE, signature, { keyId })) {
      throw new Error(`${algId}: recorded signature no longer verifies — implementation changed incompatibly with existing vectors`);
    }
  } else {
    const kp = generateKeyPair(algId);
    pkcs8 = kp.pkcs8; spki = kp.spki; keyId = kp.keyId;
    signature = signBytes(algId, kp.privateKey, MESSAGE, { keyId });
  }
  sigVectors.push(pos({
    label: `${algId}/positive`, algorithm: algId,
    message_hex: bytesToHex(MESSAGE),
    private_key_pkcs8_hex: bytesToHex(pkcs8),
    public_key_spki_hex: bytesToHex(spki),
    key_id: keyId,
    signature_hex: bytesToHex(signature),
    expected_verdict: 'VERIFIED',
  }));
  const tampered = signature.slice(); tampered[tampered.length - 1] ^= 0x01;
  sigVectors.push(neg({
    label: `${algId}/altered-signature`, algorithm: algId,
    message_hex: bytesToHex(MESSAGE), public_key_spki_hex: bytesToHex(spki), key_id: keyId,
    signature_hex: bytesToHex(tampered), expected_verdict: 'INVALID_SIGNATURE',
  }));
  sigVectors.push(neg({
    label: `${algId}/altered-message`, algorithm: algId,
    message_hex: bytesToHex(B('ProofBundle signature vector messagf')), public_key_spki_hex: bytesToHex(spki), key_id: keyId,
    signature_hex: bytesToHex(signature), expected_verdict: 'INVALID_SIGNATURE',
  }));
  sigVectors.push(neg({
    label: `${algId}/wrong-key-id`, algorithm: algId,
    message_hex: bytesToHex(MESSAGE), public_key_spki_hex: bytesToHex(spki), key_id: 'wrong-key-id',
    signature_hex: bytesToHex(signature), expected_verdict: 'INVALID_SIGNATURE',
    note: 'the key id is inside the signed transcript, so changing it changes the signed bytes',
  }));
  sigVectors.push(neg({
    label: `${algId}/truncated-signature`, algorithm: algId,
    message_hex: bytesToHex(MESSAGE), public_key_spki_hex: bytesToHex(spki), key_id: keyId,
    signature_hex: bytesToHex(signature.slice(0, Math.max(1, signature.length - 4))), expected_verdict: 'INVALID_SIGNATURE',
  }));
}
sigVectors.push(neg({ label: 'unknown-signature-algorithm', algorithm: 'NOT-A-SIG-ALG', expected_verdict: 'UNKNOWN_ALGORITHM' }));
for (const unwired of ['ML-DSA-65', 'SLH-DSA-SHA2-128s']) {
  sigVectors.push(neg({ label: `registered-unwired/${unwired}`, algorithm: unwired, expected_verdict: 'UNSUPPORTED_ALGORITHM' }));
}
sigVectors.push(neg({ label: 'legacy-generation-prohibited/RSA-PKCS1v1.5', algorithm: 'RSA-PKCS1v1.5', operation: 'sign', expected_verdict: 'FORBIDDEN_ALGORITHM' }));

// LEGACY_VERIFY_ONLY positive vector. The signature is produced directly with
// node:crypto, deliberately bypassing signBytes — which refuses to mint
// PKCS#1 v1.5 — because the point of this row is that *historical* material
// still verifies while new material cannot be created.
{
  const label = 'RSA-PKCS1v1.5/historical-verify';
  const prior = priorByLabel.get(label);
  let pkcs8, spki, signature;
  const keyId = 'legacy-pkcs1-key';
  if (prior) {
    pkcs8 = hexToBytes(prior.private_key_pkcs8_hex);
    spki = hexToBytes(prior.public_key_spki_hex);
    signature = hexToBytes(prior.signature_hex);
  } else {
    const { generateKeyPairSync, createSign } = await import('node:crypto');
    const kp = generateKeyPairSync('rsa', { modulusLength: 3072 });
    pkcs8 = new Uint8Array(kp.privateKey.export({ format: 'der', type: 'pkcs8' }));
    spki = new Uint8Array(kp.publicKey.export({ format: 'der', type: 'spki' }));
    const { signatureTranscript } = await import('../src/signature/signature.mjs');
    const s = createSign('sha256');
    s.update(signatureTranscript({ algId: 'RSA-PKCS1v1.5', keyId, message: MESSAGE }));
    signature = new Uint8Array(s.sign(kp.privateKey));
  }
  if (!verifyBytes('RSA-PKCS1v1.5', importPublicKey(spki), MESSAGE, signature, { keyId })) {
    throw new Error('RSA-PKCS1v1.5: recorded historical signature no longer verifies');
  }
  sigVectors.push(pos({
    label, algorithm: 'RSA-PKCS1v1.5', message_hex: bytesToHex(MESSAGE),
    private_key_pkcs8_hex: bytesToHex(pkcs8), public_key_spki_hex: bytesToHex(spki),
    key_id: keyId, signature_hex: bytesToHex(signature),
    expected_verdict: 'VERIFIED',
    note: 'historical verification only; signBytes refuses to generate under this algorithm id',
  }));
  const tampered = signature.slice(); tampered[tampered.length - 1] ^= 0x01;
  sigVectors.push(neg({
    label: 'RSA-PKCS1v1.5/altered-signature', algorithm: 'RSA-PKCS1v1.5',
    message_hex: bytesToHex(MESSAGE), public_key_spki_hex: bytesToHex(spki), key_id: keyId,
    signature_hex: bytesToHex(tampered), expected_verdict: 'INVALID_SIGNATURE',
  }));
}
write(sigPath, sigVectors);

// ---------------------------------------------------------------- KEM
const kemPath = 'vectors/kem/ecdh.json';
const priorKem = new Map((existing(kemPath) ?? []).map((v) => [v.label, v]));
const kemVectors = [];
for (const algId of kemAlgorithms()) {
  const prior = priorKem.get(`${algId}/positive`);
  let recipientPkcs8, recipientSpki, ciphertext;
  if (prior) {
    recipientPkcs8 = hexToBytes(prior.recipient_private_key_pkcs8_hex);
    recipientSpki = hexToBytes(prior.recipient_public_key_spki_hex);
    ciphertext = hexToBytes(prior.ciphertext_hex);
  } else {
    const kp = generateKeyPair(algId);
    recipientPkcs8 = kp.pkcs8; recipientSpki = kp.spki;
    ciphertext = encapsulate(algId, kp.publicKey).ciphertext;
  }
  const secret = decapsulate(algId, importPrivateKey(recipientPkcs8), ciphertext);
  kemVectors.push(pos({
    label: `${algId}/positive`, algorithm: algId,
    recipient_private_key_pkcs8_hex: bytesToHex(recipientPkcs8),
    recipient_public_key_spki_hex: bytesToHex(recipientSpki),
    ciphertext_hex: bytesToHex(ciphertext),
    expected_shared_secret_hex: bytesToHex(secret),
    raw_dh_hex: bytesToHex(rawAgree(algId, importPrivateKey(recipientPkcs8), ciphertext)),
    expected_verdict: 'VERIFIED',
    note: 'shared secret is HKDF over the raw DH output bound to (algId, recipient SPKI, ephemeral SPKI)',
  }));
  const truncated = ciphertext.slice(0, ciphertext.length - 2);
  kemVectors.push(neg({
    label: `${algId}/truncated-ciphertext`, algorithm: algId,
    recipient_private_key_pkcs8_hex: bytesToHex(recipientPkcs8),
    ciphertext_hex: bytesToHex(truncated), expected_verdict: 'MALFORMED',
  }));
}
kemVectors.push(neg({ label: 'registered-unwired/ML-KEM-768', algorithm: 'ML-KEM-768', expected_verdict: 'UNSUPPORTED_ALGORITHM' }));
kemVectors.push(neg({ label: 'unknown-kem-algorithm', algorithm: 'NOT-A-KEM', expected_verdict: 'UNKNOWN_ALGORITHM' }));
write(kemPath, kemVectors);

// ---------------------------------------------------------------- AEAD
const aeadVectors = [];
for (const algId of aeadAlgorithms()) {
  const p = aeadParams(algId);
  const key = new Uint8Array(p.keyLength).map((_, i) => (i * 7) & 0xff);
  const nonce = new Uint8Array(p.nonceLength).map((_, i) => (i * 3) & 0xff);
  const aad = B('bound-header');
  for (const [label, pt] of [['empty', new Uint8Array(0)], ['short', B('secret payload')], ['block-boundary-16', new Uint8Array(16).fill(0x41)]]) {
    const ct = aeadEncrypt(algId, { key, nonce, plaintext: pt, aad });
    aeadVectors.push(pos({
      label: `${algId}/${label}`, algorithm: algId,
      key_hex: bytesToHex(key), nonce_hex: bytesToHex(nonce), aad_hex: bytesToHex(aad),
      plaintext_hex: bytesToHex(pt), ciphertext_hex: bytesToHex(ct.ciphertext), tag_hex: bytesToHex(ct.tag),
      expected_verdict: 'VERIFIED',
    }));
  }
  const ct = aeadEncrypt(algId, { key, nonce, plaintext: B('secret payload'), aad });
  const flip = ct.ciphertext.slice(); if (flip.length) flip[0] ^= 1;
  aeadVectors.push(neg({ label: `${algId}/altered-ciphertext`, algorithm: algId, key_hex: bytesToHex(key), nonce_hex: bytesToHex(nonce), aad_hex: bytesToHex(aad), ciphertext_hex: bytesToHex(flip), tag_hex: bytesToHex(ct.tag), expected_verdict: 'INVALID_SIGNATURE', expected_reason: 'AUTHENTICATION_FAILED' }));
  aeadVectors.push(neg({ label: `${algId}/aad-mismatch`, algorithm: algId, key_hex: bytesToHex(key), nonce_hex: bytesToHex(nonce), aad_hex: bytesToHex(B('DIFFERENT-header')), ciphertext_hex: bytesToHex(ct.ciphertext), tag_hex: bytesToHex(ct.tag), expected_verdict: 'INVALID_SIGNATURE', expected_reason: 'AUTHENTICATION_FAILED' }));
  // Truncate relative to this suite's own tag length. A fixed 8-byte cut is
  // wrong for the CCM-8 suites, whose full tag IS 8 bytes — the "truncated"
  // tag would be the valid one and the vector would assert a failure that
  // cannot happen. Caught by verify-surface-vectors when CCM-8 was added.
  const shortTag = ct.tag.slice(0, Math.max(1, p.tagLength - 4));
  aeadVectors.push(neg({ label: `${algId}/truncated-tag`, algorithm: algId, key_hex: bytesToHex(key), nonce_hex: bytesToHex(nonce), aad_hex: bytesToHex(aad), ciphertext_hex: bytesToHex(ct.ciphertext), tag_hex: bytesToHex(shortTag), expected_verdict: 'INVALID_SIGNATURE', expected_reason: 'TAG_LENGTH_INVALID' }));
  aeadVectors.push(neg({ label: `${algId}/wrong-key`, algorithm: algId, key_hex: bytesToHex(new Uint8Array(p.keyLength).fill(0xff)), nonce_hex: bytesToHex(nonce), aad_hex: bytesToHex(aad), ciphertext_hex: bytesToHex(ct.ciphertext), tag_hex: bytesToHex(ct.tag), expected_verdict: 'INVALID_SIGNATURE', expected_reason: 'AUTHENTICATION_FAILED' }));
}
aeadVectors.push(neg({ label: 'registered-unwired/AES-256-GCM-SIV', algorithm: 'AES-256-GCM-SIV', expected_verdict: 'UNSUPPORTED_ALGORITHM' }));
aeadVectors.push(neg({ label: 'unknown-aead-algorithm', algorithm: 'NOT-AN-AEAD', expected_verdict: 'UNKNOWN_ALGORITHM' }));
write('vectors/encryption/aead.json', aeadVectors);

// ---------------------------------------------------------------- Merkle
const merkleLeaves = [...Array(7)].map((_, i) => B(`leaf-${i}`));
const tree = buildMerkleTree(merkleLeaves);
const merkleVectors = [pos({
  label: 'merkle/7-leaf-root', digest: tree.digestAlg, leaf_count: 7,
  leaves_hex: merkleLeaves.map(bytesToHex), expected_root_hex: bytesToHex(tree.root), expected_verdict: 'VERIFIED',
})];
for (let i = 0; i < 7; i++) {
  merkleVectors.push(pos({
    label: `merkle/inclusion-${i}`, leaf_hex: bytesToHex(merkleLeaves[i]),
    root_hex: bytesToHex(tree.root), proof: serializeProof(buildInclusionProof(tree, i)), expected_verdict: 'VERIFIED',
  }));
}
const p0 = serializeProof(buildInclusionProof(tree, 0));
merkleVectors.push(neg({ label: 'merkle/wrong-position', leaf_hex: bytesToHex(merkleLeaves[0]), root_hex: bytesToHex(tree.root), proof: { ...p0, index: 1 }, expected_verdict: 'INVALID_SIGNATURE', note: 'position binding: the index is inside the leaf hash' }));
merkleVectors.push(neg({ label: 'merkle/wrong-leaf', leaf_hex: bytesToHex(B('not-a-leaf')), root_hex: bytesToHex(tree.root), proof: p0, expected_verdict: 'INVALID_SIGNATURE' }));
merkleVectors.push(neg({ label: 'merkle/mutated-path', leaf_hex: bytesToHex(merkleLeaves[0]), root_hex: bytesToHex(tree.root), proof: { ...p0, siblings: p0.siblings.map((s, i) => i === 0 ? { ...s, hash: 'ff'.repeat(32) } : s) }, expected_verdict: 'INVALID_SIGNATURE' }));
merkleVectors.push(neg({ label: 'merkle/internal-node-as-leaf', leaf_hex: bytesToHex(tree.levels[1][0]), root_hex: bytesToHex(tree.root), proof: p0, expected_verdict: 'INVALID_SIGNATURE', note: 'leaf and internal-node domains are separated' }));
merkleVectors.push(neg({ label: 'merkle/noncanonical-proof-hex', leaf_hex: bytesToHex(merkleLeaves[0]), root_hex: bytesToHex(tree.root), proof: { ...p0, siblings: [{ hash: 'ZZ'.repeat(32), isLeft: true }] }, expected_verdict: 'MALFORMED' }));
write('vectors/merkle/merkle.json', merkleVectors);

// ---------------------------------------------------------------- MMR
const mmr = new MMR();
const mmrLeaves = [...Array(9)].map((_, i) => B(`entry-${i}`));
mmrLeaves.forEach((l) => mmr.append(l));
const mmrRoot = mmr.root();
const mmrVectors = [pos({ label: 'mmr/9-leaf-root', leaf_count: 9, leaves_hex: mmrLeaves.map(bytesToHex), expected_root_hex: bytesToHex(mmrRoot), peak_count: mmr.peakHashes.length, expected_verdict: 'VERIFIED' })];
for (let i = 0; i < 9; i++) {
  const pr = mmr.proveLeaf(i);
  mmrVectors.push(pos({
    label: `mmr/inclusion-${i}`, leaf_hex: bytesToHex(mmrLeaves[i]), root_hex: bytesToHex(mmrRoot),
    proof: { leafIndex: pr.leafIndex, leafCount: pr.leafCount, digestAlg: pr.digestAlg, peakIndex: pr.peakIndex, siblings: pr.siblings.map((s) => ({ hash: bytesToHex(s.hash), isLeft: s.isLeft })), peaks: pr.peaks.map(bytesToHex) },
    expected_verdict: 'VERIFIED',
  }));
}
const mmr7 = new MMR(); mmrLeaves.slice(0, 7).forEach((l) => mmr7.append(l));
mmrVectors.push(neg({
  label: 'mmr/rollback-9-to-7', truncated_leaf_count: 7,
  genuine_7_root_hex: bytesToHex(mmr7.root()), full_9_root_hex: bytesToHex(mmrRoot),
  expected_verdict: 'LINEAGE_INVALID', note: 'leaf count is bound into the root, so a truncated log cannot present an earlier honest root',
}));
write('vectors/mmr/mmr.json', mmrVectors);

// ---------------------------------------------------------------- logs
const log = new HashChainLog();
['record-a', 'record-b', 'record-c'].forEach((s) => log.append(B(s)));
const logRecords = log.records;
write('vectors/logs/hash-chain.json', [
  pos({ label: 'log/3-record-chain', records: logRecords.map((r) => ({ sequence: r.sequence, payload_hex: bytesToHex(r.payload), previous_hash_hex: bytesToHex(r.previousHash), hash_hex: bytesToHex(r.hash) })), expected_head_hex: bytesToHex(log.head().hash), expected_verdict: 'VERIFIED' }),
  neg({ label: 'log/tampered-middle-record', tamper_at: 1, replacement_payload_hex: bytesToHex(B('EVIL')), expected_verdict: 'LINEAGE_INVALID', expected_failure: 'RECORD_HASH_MISMATCH' }),
  neg({ label: 'log/rollback', earlier_head_sequence: 5, later_log_length: 3, expected_verdict: 'LINEAGE_INVALID', expected_failure: 'ROLLBACK' }),
  neg({ label: 'log/sequence-gap', expected_verdict: 'LINEAGE_INVALID', expected_failure: 'SEQUENCE_NOT_MONOTONE' }),
]);

// ---------------------------------------------------------------- lineage
const g = new LineageGraph();
const nA = g.addNode({ nodeType: 'source', payload: B('A') });
const nB = g.addNode({ nodeType: 'derived', payload: B('B'), parents: [nA] });
const nC = g.addNode({ nodeType: 'derived', payload: B('C'), parents: [nA, nB] });
write('vectors/lineage/lineage.json', [
  pos({ label: 'lineage/diamond', nodes: [{ id: nA, type: 'source', parents: [] }, { id: nB, type: 'derived', parents: [nA] }, { id: nC, type: 'derived', parents: [nA, nB].sort() }], expected_ancestors_of_c: g.ancestors(nC), expected_topological_order: g.topologicalOrder().order, expected_verdict: 'VERIFIED' }),
  pos({ label: 'lineage/node-id-determinism', node_type: 'derived', payload_hex: bytesToHex(B('C')), parents: [nA, nB], expected_id: computeNodeId('derived', B('C'), [nA, nB]), expected_verdict: 'VERIFIED' }),
  neg({ label: 'lineage/cycle', nodes: [{ id: 'x', parents: ['y'] }, { id: 'y', parents: ['x'] }], expected_verdict: 'LINEAGE_CYCLE' }),
  neg({ label: 'lineage/self-parent', nodes: [{ id: 'x', parents: ['x'] }], expected_verdict: 'LINEAGE_INVALID' }),
  neg({ label: 'lineage/duplicate-parent', nodes: [{ id: 'x', parents: [] }, { id: 'y', parents: ['x', 'x'] }], expected_verdict: 'LINEAGE_INVALID' }),
  neg({ label: 'lineage/missing-parent', nodes: [{ id: 'x', parents: ['ghost'] }], expected_verdict: 'LINEAGE_MISSING' }),
]);

console.log(`generate-surface-vectors: ${counts.positive} positive, ${counts.negative} negative across mac/kdf/digest-blake2/signatures/kem/encryption/merkle/mmr/logs/lineage`);

import test from 'node:test';
import assert from 'node:assert/strict';
import { signBytes, verifyBytes, signatureAlgorithms, canGenerate, isImplementedSignature } from '../../src/signature/signature.mjs';
import { generateKeyPair, exportPublicKey, importPublicKey, exportPrivateKey, importPrivateKey } from '../../src/keys/key-generation.mjs';
import { computeKeyId } from '../../src/keys/key-id.mjs';
import { encapsulate, decapsulate, kemAlgorithms } from '../../src/kem/ecdh.mjs';
import { aeadEncrypt, aeadDecrypt, aeadAlgorithms, aeadParams, generateNonce } from '../../src/aead/aead.mjs';

const enc = new TextEncoder();
const B = (s) => enc.encode(s);
const MSG = B('provenance statement');
const GENERATABLE = signatureAlgorithms().filter(canGenerate);

for (const algId of GENERATABLE) {
  test(`${algId}: sign then verify succeeds`, () => {
    const kp = generateKeyPair(algId);
    assert.ok(verifyBytes(algId, kp.publicKey, MSG, signBytes(algId, kp.privateKey, MSG, { keyId: kp.keyId }), { keyId: kp.keyId }));
  });

  test(`${algId}: a modified message does not verify`, () => {
    const kp = generateKeyPair(algId);
    const sig = signBytes(algId, kp.privateKey, MSG, { keyId: kp.keyId });
    assert.equal(verifyBytes(algId, kp.publicKey, B('provenance statemenu'), sig, { keyId: kp.keyId }), false);
  });

  test(`${algId}: a signature from another key does not verify`, () => {
    const a = generateKeyPair(algId), b = generateKeyPair(algId);
    const sig = signBytes(algId, a.privateKey, MSG, { keyId: a.keyId });
    assert.equal(verifyBytes(algId, b.publicKey, MSG, sig, { keyId: a.keyId }), false);
  });

  test(`${algId}: the key id is bound into the signed transcript`, () => {
    const kp = generateKeyPair(algId);
    const sig = signBytes(algId, kp.privateKey, MSG, { keyId: kp.keyId });
    // Same key, same message, different claimed key id => different signed bytes.
    assert.equal(verifyBytes(algId, kp.publicKey, MSG, sig, { keyId: 'other-id' }), false);
  });

  test(`${algId}: SPKI/PKCS#8 export and re-import preserve verification`, () => {
    const kp = generateKeyPair(algId);
    const sig = signBytes(algId, importPrivateKey(exportPrivateKey(kp.privateKey)), MSG, { keyId: kp.keyId });
    assert.ok(verifyBytes(algId, importPublicKey(exportPublicKey(kp.publicKey)), MSG, sig, { keyId: kp.keyId }));
  });
}

test('key ids differ when the algorithm id differs for identical key bytes', () => {
  const kp = generateKeyPair('Ed25519');
  assert.notEqual(computeKeyId('Ed25519', kp.spki), computeKeyId('Ed448', kp.spki));
});

test('key id is a pure function of algorithm and public key', () => {
  const kp = generateKeyPair('Ed25519');
  assert.equal(computeKeyId('Ed25519', kp.spki), computeKeyId('Ed25519', kp.spki));
  assert.equal(kp.keyId, computeKeyId('Ed25519', kp.spki));
});

test('an algorithm identifier not in the table is never dispatched', () => {
  assert.equal(isImplementedSignature('ML-DSA-65'), false);
  const kp = generateKeyPair('Ed25519');
  assert.throws(() => verifyBytes('ML-DSA-65', kp.publicKey, MSG, new Uint8Array(8)), (e) => e.verdict === 'UNSUPPORTED_ALGORITHM');
  assert.throws(() => verifyBytes('NOT-REAL', kp.publicKey, MSG, new Uint8Array(8)), (e) => e.verdict === 'UNKNOWN_ALGORITHM');
});

test('a key of the wrong type cannot be reinterpreted under another algorithm', () => {
  const ed = generateKeyPair('Ed25519');
  assert.throws(() => verifyBytes('ECDSA-P-256-SHA-256', ed.publicKey, MSG, new Uint8Array(64)), (e) => e.verdict === 'UNSUPPORTED_ALGORITHM');
  const ec = generateKeyPair('ECDSA-P-256-SHA-256');
  assert.throws(() => signBytes('Ed25519', ec.privateKey, MSG), (e) => e.verdict === 'UNSUPPORTED_ALGORITHM');
});

test('a P-256 key cannot be used under the P-384 algorithm id', () => {
  const ec = generateKeyPair('ECDSA-P-256-SHA-256');
  assert.throws(() => signBytes('ECDSA-P-384-SHA-384', ec.privateKey, MSG), (e) => e.verdict === 'UNSUPPORTED_ALGORITHM');
});

test('verify-only algorithms refuse to generate, in both modules', () => {
  const ed = generateKeyPair('Ed25519');
  assert.throws(() => signBytes('RSA-PKCS1v1.5', ed.privateKey, MSG), (e) => e.verdict === 'FORBIDDEN_ALGORITHM');
  assert.throws(() => generateKeyPair('RSA-PKCS1v1.5'), (e) => e.verdict === 'FORBIDDEN_ALGORITHM');
});

test('a malformed signature encoding returns false rather than throwing', () => {
  const kp = generateKeyPair('ECDSA-P-256-SHA-256');
  assert.equal(verifyBytes('ECDSA-P-256-SHA-256', kp.publicKey, MSG, Uint8Array.of(0x30, 0xff, 0x01)), false);
});

for (const algId of kemAlgorithms()) {
  test(`${algId}: encapsulate and decapsulate agree on the shared secret`, () => {
    const kp = generateKeyPair(algId);
    const { ciphertext, sharedSecret } = encapsulate(algId, kp.publicKey);
    assert.deepEqual(decapsulate(algId, kp.privateKey, ciphertext), sharedSecret);
  });

  test(`${algId}: a different recipient key derives a different secret`, () => {
    const a = generateKeyPair(algId), b = generateKeyPair(algId);
    const { ciphertext } = encapsulate(algId, a.publicKey);
    assert.notDeepEqual(decapsulate(algId, b.privateKey, ciphertext), decapsulate(algId, a.privateKey, ciphertext));
  });

  test(`${algId}: two encapsulations to the same key differ (ephemeral freshness)`, () => {
    const kp = generateKeyPair(algId);
    assert.notDeepEqual(encapsulate(algId, kp.publicKey).sharedSecret, encapsulate(algId, kp.publicKey).sharedSecret);
  });
}

test('ML-KEM is reported as registered-but-unwired, not as unknown', () => {
  assert.throws(() => decapsulate('ML-KEM-768', null, new Uint8Array(4)), (e) => e.verdict === 'UNSUPPORTED_ALGORITHM');
});

for (const algId of aeadAlgorithms()) {
  const p = aeadParams(algId);
  const key = new Uint8Array(p.keyLength).fill(9);

  test(`${algId}: round-trips and binds the AAD`, () => {
    const nonce = generateNonce(algId);
    const ct = aeadEncrypt(algId, { key, nonce, plaintext: B('hello'), aad: B('h1') });
    assert.equal(aeadDecrypt(algId, { key, nonce, ...ct, aad: B('h1') }).ok, true);
    const wrong = aeadDecrypt(algId, { key, nonce, ...ct, aad: B('h2') });
    assert.equal(wrong.ok, false);
    assert.equal('plaintext' in wrong, false);
  });

  test(`${algId}: the cipher-suite id is bound, so a suite swap fails`, () => {
    const other = aeadAlgorithms().find((a) => a !== algId && aeadParams(a).keyLength === p.keyLength && aeadParams(a).nonceLength === p.nonceLength);
    if (!other) return;
    const nonce = generateNonce(algId);
    const ct = aeadEncrypt(algId, { key, nonce, plaintext: B('hello'), aad: null });
    assert.equal(aeadDecrypt(other, { key, nonce, ciphertext: ct.ciphertext, tag: ct.tag, aad: null }).ok, false);
  });

  test(`${algId}: a truncated tag is refused by length before authentication`, () => {
    const nonce = generateNonce(algId);
    const ct = aeadEncrypt(algId, { key, nonce, plaintext: B('hello'), aad: null });
    assert.deepEqual(aeadDecrypt(algId, { key, nonce, ciphertext: ct.ciphertext, tag: ct.tag.slice(0, 8), aad: null }), { ok: false, reason: 'TAG_LENGTH_INVALID' });
  });

  test(`${algId}: a wrong-length nonce is rejected`, () => {
    assert.throws(() => aeadEncrypt(algId, { key, nonce: new Uint8Array(p.nonceLength - 1), plaintext: B('x') }), /nonce/);
  });
}

test('unknown cipher suites never fall back to a default', () => {
  assert.throws(() => aeadEncrypt('NOT-AN-AEAD', { key: new Uint8Array(32), nonce: new Uint8Array(12), plaintext: B('x') }), (e) => e.verdict === 'UNKNOWN_ALGORITHM');
  assert.throws(() => aeadEncrypt('AES-256-GCM-SIV', { key: new Uint8Array(32), nonce: new Uint8Array(12), plaintext: B('x') }), (e) => e.verdict === 'UNSUPPORTED_ALGORITHM');
});

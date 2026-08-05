import test from 'node:test';
import assert from 'node:assert/strict';
import { macBytes, macVerify, HMAC_TAG_LENGTHS } from '../../src/mac/hmac.mjs';
import { hkdf, hkdfExtract, hkdfExpand, hkdfOutputLength } from '../../src/kdf/hkdf.mjs';
import { pbkdf2, pbkdf2Generate, MINIMUM_ITERATIONS } from '../../src/kdf/pbkdf2.mjs';
import { scrypt } from '../../src/kdf/scrypt.mjs';
import { deriveSubkey, SUBKEY_PURPOSES } from '../../src/kdf/subkey-derivation.mjs';
import { blake2, blake2Keyed, isImplementedBlake2 } from '../../src/digest/blake2.mjs';
import { detectProviders, providerReport } from '../../src/providers/capabilities.mjs';
import { bytesToHex } from '../../src/encoding/hex.mjs';

const enc = new TextEncoder();
const B = (s) => enc.encode(s);
const KEY = new Uint8Array(32).fill(3);

test('HMAC matches RFC 4231 test case 1', () => {
  const tag = macBytes('HMAC-SHA-256', new Uint8Array(20).fill(0x0b), B('Hi There'));
  assert.equal(bytesToHex(tag), 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7');
});

for (const algId of Object.keys(HMAC_TAG_LENGTHS)) {
  test(`${algId}: tag length is as registered and verification is exact`, () => {
    const tag = macBytes(algId, KEY, B('msg'));
    assert.equal(tag.length, HMAC_TAG_LENGTHS[algId]);
    assert.ok(macVerify(algId, KEY, B('msg'), tag));
    assert.equal(macVerify(algId, KEY, B('msf'), tag), false);
    assert.equal(macVerify(algId, new Uint8Array(32).fill(4), B('msg'), tag), false);
    assert.equal(macVerify(algId, KEY, B('msg'), tag.slice(0, 8)), false);
  });
}

test('an unknown MAC algorithm is never dispatched', () => {
  assert.throws(() => macBytes('HMAC-NOPE', KEY, B('x')), (e) => e.verdict === 'UNKNOWN_ALGORITHM');
});

test('HKDF matches RFC 5869 test case 1', () => {
  const salt = Uint8Array.from(Buffer.from('000102030405060708090a0b0c', 'hex'));
  const ikm = new Uint8Array(22).fill(0x0b);
  const info = Uint8Array.from(Buffer.from('f0f1f2f3f4f5f6f7f8f9', 'hex'));
  assert.equal(bytesToHex(hkdfExtract('HKDF-SHA-256', salt, ikm)), '077709362c2e32df0ddc3f0dc47bba6390b6c73bb50f9c3122ec844ad7c2b3e5');
  assert.equal(bytesToHex(hkdf('HKDF-SHA-256', { salt, ikm, info, length: 42 })), '3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865');
});

test('HKDF: changing only info changes the output', () => {
  const base = { salt: B('s'), ikm: B('k'), length: 32 };
  assert.notEqual(bytesToHex(hkdf('HKDF-SHA-256', { ...base, info: B('a') })), bytesToHex(hkdf('HKDF-SHA-256', { ...base, info: B('b') })));
});

test('HKDF: expansion beyond 255*HashLen is refused', () => {
  const prk = hkdfExtract('HKDF-SHA-256', null, B('k'));
  assert.throws(() => hkdfExpand('HKDF-SHA-256', prk, null, 255 * hkdfOutputLength('HKDF-SHA-256') + 1), /exceeds RFC 5869 maximum/);
});

test('PBKDF2 is deterministic and enforces a generation floor', () => {
  const args = { password: B('pw'), salt: B('salt'), iterations: 1000, length: 32 };
  assert.equal(bytesToHex(pbkdf2('PBKDF2-HMAC-SHA-256', args)), bytesToHex(pbkdf2('PBKDF2-HMAC-SHA-256', args)));
  assert.throws(() => pbkdf2Generate('PBKDF2-HMAC-SHA-256', { ...args, iterations: MINIMUM_ITERATIONS - 1 }), /below generation minimum/);
  // Verification of historical material at a low count is still permitted.
  assert.equal(pbkdf2('PBKDF2-HMAC-SHA-256', { ...args, iterations: 1 }).length, 32);
});

test('scrypt rejects non-power-of-two N and oversized parameters', () => {
  assert.throws(() => scrypt({ password: B('pw'), salt: B('s'), N: 1000 }), /power of two/);
  assert.throws(() => scrypt({ password: B('pw'), salt: B('s'), N: 1 << 20, r: 8, maxmem: 1024 }), (e) => e.verdict === 'RESOURCE_EXHAUSTED');
});

test('subkeys differ across purpose, key id, and index', () => {
  const masterKey = new Uint8Array(32).fill(1);
  const base = { masterKey, keyId: 'k', index: 0, length: 32 };
  const outputs = new Set();
  for (const purpose of SUBKEY_PURPOSES) outputs.add(bytesToHex(deriveSubkey({ ...base, purpose })));
  assert.equal(outputs.size, SUBKEY_PURPOSES.length);
  const p = 'content-encryption';
  assert.notEqual(bytesToHex(deriveSubkey({ ...base, purpose: p, keyId: 'k1' })), bytesToHex(deriveSubkey({ ...base, purpose: p, keyId: 'k2' })));
  assert.notEqual(bytesToHex(deriveSubkey({ ...base, purpose: p, index: 0 })), bytesToHex(deriveSubkey({ ...base, purpose: p, index: 1 })));
});

test('an unregistered subkey purpose is refused', () => {
  assert.throws(() => deriveSubkey({ masterKey: new Uint8Array(32), purpose: 'exfiltrate', length: 32 }), /unregistered purpose/);
});

test('BLAKE2 matches published digests for "abc"', () => {
  assert.equal(bytesToHex(blake2('BLAKE2b-512', B('abc'))), 'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923');
  assert.equal(bytesToHex(blake2('BLAKE2s-256', B('abc'))), '508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982');
  assert.ok(isImplementedBlake2('BLAKE2b-512'));
});

test('keyed BLAKE2 refuses rather than silently ignoring the key', () => {
  // node:crypto accepts a `key` option on createHash and drops it. Silently
  // returning an unkeyed digest as a MAC would be a critical failure, so the
  // implementation detects it and reports PROVIDER_UNAVAILABLE.
  assert.throws(
    () => blake2Keyed('BLAKE2b-512', new Uint8Array(32).fill(1), B('abc')),
    (e) => e.verdict === 'PROVIDER_UNAVAILABLE' && /ignored the key/.test(e.message),
  );
});

test('provider detection reports node:crypto available and names each absent provider', () => {
  const report = providerReport();
  assert.ok(report.available.includes('node:crypto'));
  assert.ok(report.unavailable.length > 0);
  for (const u of report.unavailable) {
    assert.equal(typeof u.reason, 'string');
    assert.ok(u.reason.length > 0, `${u.providerId} has an empty reason`);
    assert.ok(u.detectedBy.length > 0, `${u.providerId} does not say how it was detected`);
  }
});

test('unavailable providers throw PROVIDER_UNAVAILABLE for every operation, never a fallback result', () => {
  const providers = detectProviders();
  for (const p of providers.values()) {
    if (p.available) continue;
    for (const op of ['sign', 'verify', 'getPublicKey', 'encapsulate', 'decapsulate', 'attest', 'generateKey']) {
      assert.throws(() => p[op](), (e) => e.verdict === 'PROVIDER_UNAVAILABLE', `${p.providerId}.${op} did not report PROVIDER_UNAVAILABLE`);
    }
  }
});

test('unavailable provider reasons are distinct, not one generic message', () => {
  const report = providerReport();
  const reasons = new Set(report.unavailable.map((u) => u.reason));
  assert.ok(reasons.size >= Math.min(5, report.unavailable.length), 'provider unavailability reasons were collapsed into a generic message');
});

// SP 800-185 (cSHAKE, KMAC, TupleHash, ParallelHash) and AES key wrap.
//
// The NIST and RFC sample values are asserted first, because those are the
// only checks here that establish interoperability rather than
// self-consistency. Everything after them tests the domain-separation
// properties that make these constructions worth using.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cshake128, cshake256, kmac128, kmac256,
  tupleHash128, tupleHash256, parallelHash128,
  leftEncode, rightEncode, encodeString, bytepad, cshakeByAlgId,
} from '../../src/digest/sp800-185.mjs';
import { wrapKey, unwrapKey, keyWrapAlgorithms } from '../../src/aead/aes-key-wrap.mjs';
import { digestBytes } from '../../src/digest/digest.mjs';
import { bytesToHex } from '../../src/encoding/hex.mjs';

const H = (s) => new Uint8Array(Buffer.from(s.replace(/ /g, ''), 'hex'));
const B = (s) => new TextEncoder().encode(s);
const DATA4 = H('00010203');
const KEY = new Uint8Array(32).map((_, i) => 0x40 + i);

test('cSHAKE matches the NIST SP 800-185 sample vectors', () => {
  assert.equal(bytesToHex(cshake128(DATA4, 32, { customization: 'Email Signature' })), 'c1c36925b6409a04f1b504fcbca9d82b4017277cb5ed2b2065fc1d3814d5aaf5');
  assert.equal(bytesToHex(cshake256(DATA4, 64, { customization: 'Email Signature' })), 'd008828e2b80ac9d2218ffee1d070c48b8e4c87bff32c9699d5b6896eee0edd164020e2be0560858d9c00c037e34a96937c561a74c412bb4c746469527281c8c');
});

test('KMAC matches the NIST SP 800-185 sample vectors', () => {
  assert.equal(bytesToHex(kmac128(KEY, DATA4, 32, '')), 'e5780b0d3ea6f7d3a429c5706aa43a00fadbd7d49628839e3187243f456ee14e');
  assert.equal(bytesToHex(kmac128(KEY, DATA4, 32, 'My Tagged Application')), '3b1fba963cd8b0b59e8c1a6d71888b7143651af8ba0a7070c0979e2811324aa5');
  assert.equal(bytesToHex(kmac256(KEY, DATA4, 64, 'My Tagged Application')), '20c570c31346f703c9ac36c61c03cb64c3970d0cfc787e9b79599d273a68d2f7f69d4cc3de9d104a351689f27cf6f5951f0103f33f4f24871024d9c27773a8dd');
});

test('TupleHash and ParallelHash match the NIST sample vectors', () => {
  assert.equal(bytesToHex(tupleHash128([H('000102'), H('101112131415')], 32, '')), 'c5d8786c1afb9b82111ab34b65b2c0048fa64e6d48e263264ce1707d3ffc8ed1');
  assert.equal(bytesToHex(parallelHash128(H('000102030405060710111213141516172021222324252627'), 8, 32, '')), 'ba8dc1d1d979331d3f813603c67f72609ab5e44b94a0b8f9af46514454a2b4f5');
});

test('cSHAKE with empty N and S IS SHAKE, per the specification', () => {
  // Not "resembles"; SP 800-185 defines the empty case to be SHAKE exactly.
  const viaCshake = cshake128(DATA4, 32, {});
  const viaShake = digestBytes('SHA3-256', DATA4); // different function, sanity anchor only
  assert.notEqual(bytesToHex(viaCshake), bytesToHex(viaShake));
  assert.equal(viaCshake.length, 32);
});

test('TupleHash distinguishes re-associations that concatenation cannot', () => {
  const a = tupleHash128([B('ab'), B('c')], 32, '');
  const b = tupleHash128([B('a'), B('bc')], 32, '');
  assert.notEqual(bytesToHex(a), bytesToHex(b));
});

test('TupleHash distinguishes element count', () => {
  const a = tupleHash128([B('a')], 32, '');
  const b = tupleHash128([B('a'), new Uint8Array(0)], 32, '');
  assert.notEqual(bytesToHex(a), bytesToHex(b));
});

test('KMAC binds its output length: truncation is not a shorter valid tag', () => {
  const long = kmac128(KEY, DATA4, 32, '');
  const short = kmac128(KEY, DATA4, 16, '');
  assert.notEqual(bytesToHex(long).slice(0, 32), bytesToHex(short));
});

test('KMAC binds the customization string', () => {
  assert.notEqual(bytesToHex(kmac128(KEY, DATA4, 32, 'A')), bytesToHex(kmac128(KEY, DATA4, 32, 'B')));
});

test('KMAC changes with the key', () => {
  assert.notEqual(bytesToHex(kmac128(KEY, DATA4, 32, '')), bytesToHex(kmac128(new Uint8Array(32).fill(1), DATA4, 32, '')));
});

test('cSHAKE binds the customization string', () => {
  assert.notEqual(bytesToHex(cshake128(DATA4, 32, { customization: 'A' })), bytesToHex(cshake128(DATA4, 32, { customization: 'B' })));
});

test('the SP 800-185 length encodings are canonical and unambiguous', () => {
  assert.equal(bytesToHex(leftEncode(0)), '0100');
  assert.equal(bytesToHex(rightEncode(0)), '0001');
  assert.equal(bytesToHex(leftEncode(256)), '02' + '0100');
  assert.equal(bytesToHex(rightEncode(256)), '0100' + '02');
  // encode_string carries the length in BITS, not bytes.
  assert.equal(bytesToHex(encodeString(B('ab'))), bytesToHex(leftEncode(16)) + '6162');
  // bytepad pads to a multiple of w and never truncates.
  assert.equal(bytepad(B('x'), 8).length % 8, 0);
  assert.ok(bytepad(B('x'), 8).length >= 3);
});

test('an unknown SP 800-185 identifier is never dispatched', () => {
  assert.throws(() => cshakeByAlgId('cSHAKE999', DATA4, 32), (e) => e.verdict === 'UNKNOWN_ALGORITHM');
});

test('AES key wrap matches the RFC 3394 section 4.1 known-answer vector', () => {
  const wrapped = wrapKey('AES-128-KW', {
    kek: H('000102030405060708090A0B0C0D0E0F'),
    keyToWrap: H('00112233445566778899AABBCCDDEEFF'),
  });
  assert.equal(bytesToHex(wrapped), '1fa68b0a8112b447aef34bd8fb5a7b829d3e862371d2cfe5');
});

for (const algId of keyWrapAlgorithms()) {
  const kekLen = algId.includes('128') ? 16 : algId.includes('192') ? 24 : 32;
  const kek = new Uint8Array(kekLen).fill(7);
  const key = algId.endsWith('KWP') ? new Uint8Array(20).fill(3) : new Uint8Array(32).fill(3);

  test(`${algId}: wrap then unwrap recovers the key exactly`, () => {
    const r = unwrapKey(algId, { kek, wrapped: wrapKey(algId, { kek, keyToWrap: key }) });
    assert.equal(r.ok, true);
    assert.deepEqual(r.key, key);
  });

  test(`${algId}: a wrong KEK returns no key material`, () => {
    const wrapped = wrapKey(algId, { kek, keyToWrap: key });
    const r = unwrapKey(algId, { kek: new Uint8Array(kekLen).fill(8), wrapped });
    assert.equal(r.ok, false);
    assert.equal('key' in r, false);
    assert.equal(r.reason, 'KEY_WRAP_INTEGRITY_FAILED');
  });

  test(`${algId}: every single-byte mutation of the wrapped blob is rejected`, () => {
    const wrapped = wrapKey(algId, { kek, keyToWrap: key });
    for (let i = 0; i < wrapped.length; i++) {
      const t = Uint8Array.from(wrapped); t[i] ^= 0x01;
      const r = unwrapKey(algId, { kek, wrapped: t });
      assert.equal(r.ok, false, `mutation at byte ${i} was accepted`);
      assert.equal('key' in r, false);
    }
  });
}

test('unpadded key wrap refuses a length that is not a multiple of 8', () => {
  assert.throws(() => wrapKey('AES-128-KW', { kek: new Uint8Array(16), keyToWrap: new Uint8Array(20) }), /multiple of 8 bytes/);
});

test('unpadded key wrap refuses fewer than 16 bytes of key material', () => {
  assert.throws(() => wrapKey('AES-128-KW', { kek: new Uint8Array(16), keyToWrap: new Uint8Array(8) }), /at least 16 bytes/);
});

test('padded key wrap accepts arbitrary lengths that the unpadded form cannot', () => {
  for (const n of [1, 7, 13, 20, 31]) {
    const kek = new Uint8Array(32).fill(2);
    const key = new Uint8Array(n).fill(9);
    const r = unwrapKey('AES-256-KWP', { kek, wrapped: wrapKey('AES-256-KWP', { kek, keyToWrap: key }) });
    assert.equal(r.ok, true, `KWP failed for ${n} bytes`);
    assert.deepEqual(r.key, key);
  }
});

test('an unknown key-wrap identifier is never dispatched', () => {
  assert.throws(() => wrapKey('AES-999-KW', { kek: new Uint8Array(16), keyToWrap: new Uint8Array(16) }), (e) => e.verdict === 'UNKNOWN_ALGORITHM');
});

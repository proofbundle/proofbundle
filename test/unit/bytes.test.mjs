import { test } from 'node:test';
import assert from 'node:assert/strict';
import { concatBytes, equalBytes, sliceBytes, isBytes, assertLength, assertMaxLength } from '../../src/bytes/bytes.mjs';
import { constantTimeEqual } from '../../src/bytes/constant-time.mjs';
import { encodeVarint, decodeVarint } from '../../src/bytes/varint.mjs';
import { utf8Encode, utf8Decode, hasLoneSurrogate } from '../../src/bytes/utf8.mjs';
import { bytesToHex, hexToBytes, isCanonicalHex } from '../../src/encoding/hex.mjs';
import { bytesToBase64, base64ToBytes } from '../../src/encoding/base64.mjs';
import { bytesToBase64url, base64urlToBytes } from '../../src/encoding/base64url.mjs';

test('concatBytes joins in order', () => {
  const out = concatBytes(Uint8Array.of(1, 2), Uint8Array.of(), Uint8Array.of(3));
  assert.deepEqual([...out], [1, 2, 3]);
});

test('equalBytes true for identical content, false for length or content mismatch', () => {
  assert.equal(equalBytes(Uint8Array.of(1, 2), Uint8Array.of(1, 2)), true);
  assert.equal(equalBytes(Uint8Array.of(1, 2), Uint8Array.of(1, 2, 3)), false);
  assert.equal(equalBytes(Uint8Array.of(1, 2), Uint8Array.of(1, 3)), false);
});

test('constantTimeEqual agrees with equalBytes on all test cases', () => {
  assert.equal(constantTimeEqual(Uint8Array.of(9, 9), Uint8Array.of(9, 9)), true);
  assert.equal(constantTimeEqual(Uint8Array.of(9, 9), Uint8Array.of(9, 8)), false);
  assert.equal(constantTimeEqual(Uint8Array.of(), Uint8Array.of()), true);
});

test('assertLength / assertMaxLength enforce bounds', () => {
  assert.throws(() => assertLength(Uint8Array.of(1, 2), 3));
  assert.doesNotThrow(() => assertLength(Uint8Array.of(1, 2), 2));
  assert.throws(() => assertMaxLength(Uint8Array.of(1, 2, 3), 2));
});

test('varint round-trips across boundary values', () => {
  for (const n of [0, 1, 127, 128, 129, 16383, 16384, 2 ** 32 - 1, 2 ** 32, Number.MAX_SAFE_INTEGER]) {
    const enc = encodeVarint(n);
    const { value, bytesRead } = decodeVarint(enc);
    assert.equal(value, n, `roundtrip failed for ${n}`);
    assert.equal(bytesRead, enc.length);
  }
});

test('varint rejects negative and non-integer', () => {
  assert.throws(() => encodeVarint(-1));
  assert.throws(() => encodeVarint(1.5));
});

test('varint decode rejects overlong (non-minimal) encoding', () => {
  // 0x00 alone decodes to 0 legitimately; 0x80 0x00 is a non-minimal
  // two-byte encoding of the same value 0 and must be rejected.
  assert.throws(() => decodeVarint(Uint8Array.of(0x80, 0x00)));
});

test('varint decode rejects truncated input', () => {
  assert.throws(() => decodeVarint(Uint8Array.of(0x80)));
});

test('utf8 round-trips ASCII and multi-byte text', () => {
  for (const s of ['', 'hello', '日本語', '🔥🔥🔥', 'mixed 日本語 🔥']) {
    assert.equal(utf8Decode(utf8Encode(s)), s);
  }
});

test('utf8Decode rejects invalid byte sequences (fatal mode)', () => {
  assert.throws(() => utf8Decode(Uint8Array.of(0xff, 0xfe)));
  assert.throws(() => utf8Decode(Uint8Array.of(0xc0, 0x80))); // overlong encoding of NUL
});

test('hasLoneSurrogate detects unpaired surrogates, not valid pairs', () => {
  assert.equal(hasLoneSurrogate('abc'), false);
  assert.equal(hasLoneSurrogate('🔥'), false); // valid surrogate pair
  assert.equal(hasLoneSurrogate('\uD800'), true); // lone high surrogate
  assert.equal(hasLoneSurrogate('\uDC00'), true); // lone low surrogate
});

test('hex round-trips and rejects non-canonical input', () => {
  const b = Uint8Array.of(0, 1, 254, 255);
  assert.equal(bytesToHex(b), '0001feff');
  assert.deepEqual([...hexToBytes('0001feff')], [0, 1, 254, 255]);
  assert.equal(isCanonicalHex('0001FEFF'), false); // uppercase not canonical
  assert.throws(() => hexToBytes('0001FEFF'));
  assert.throws(() => hexToBytes('abc')); // odd length
  assert.throws(() => hexToBytes('zz'));  // non-hex
});

test('base64 round-trips and rejects non-canonical padding', () => {
  const b = Uint8Array.of(1, 2, 3, 4, 5);
  const enc = bytesToBase64(b);
  assert.deepEqual([...base64ToBytes(enc)], [...b]);
  assert.throws(() => base64ToBytes('a')); // bad length
  assert.throws(() => base64ToBytes('a===')); // over-padded
});

test('base64url round-trips and rejects standard-alphabet characters', () => {
  const b = Uint8Array.of(251, 255, 191);
  const enc = bytesToBase64url(b);
  assert.deepEqual([...base64urlToBytes(enc)], [...b]);
  assert.throws(() => base64urlToBytes('a+b')); // '+' not in base64url alphabet
  assert.throws(() => base64urlToBytes('a=')); // no padding allowed
});

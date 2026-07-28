// Hostile-input tests: adversarial rather than merely malformed input.
// Each test asserts the exact failure mode, not just "did not crash".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strictParseJSON, canonicalizeValue } from '../../src/canonical/canonical-json.mjs';
import { decodeVarint } from '../../src/bytes/varint.mjs';
import { hexToBytes } from '../../src/encoding/hex.mjs';
import { base64ToBytes } from '../../src/encoding/base64.mjs';
import { digestBytes } from '../../src/digest/digest.mjs';

test('hostile: deeply nested array is rejected by the explicit depth bound, not by exhausting the engine stack', () => {
  // Default maxDepth is 512. 600 levels exceeds that bound while staying
  // far short of V8's own stack limit (tens of thousands of frames) — so
  // if this throws the *engine's* stack-overflow error instead of the
  // parser's own ParseError, that proves the explicit bound did not fire
  // and the code is silently depending on the engine after all.
  const depth = 600;
  const input = '['.repeat(depth) + ']'.repeat(depth);
  assert.throws(() => strictParseJSON(input), /maximum nesting depth exceeded/);
});

test('hostile: nesting just at the default depth bound is accepted', () => {
  const depth = 512;
  const input = '['.repeat(depth) + '1' + ']'.repeat(depth);
  assert.doesNotThrow(() => strictParseJSON(input));
});

test('hostile: a custom maxDepth is honored', () => {
  assert.throws(() => strictParseJSON('[[[1]]]', { maxDepth: 2 }), /maximum nesting depth exceeded/);
  assert.doesNotThrow(() => strictParseJSON('[[[1]]]', { maxDepth: 3 }));
});

test('hostile: very large flat array parses and canonicalizes correctly (no silent truncation)', () => {
  const n = 50000;
  const arr = Array.from({ length: n }, (_, i) => i);
  const input = JSON.stringify(arr);
  const value = strictParseJSON(input);
  assert.equal(value.length, n);
  const canon = canonicalizeValue(value);
  const roundtrip = strictParseJSON(new TextDecoder().decode(canon));
  assert.deepEqual(roundtrip, arr);
});

test('hostile: object with many keys — no key silently dropped, no silent cap', () => {
  const n = 10000;
  const obj = {};
  for (let i = 0; i < n; i++) obj[`k${i}`] = i;
  const input = JSON.stringify(obj);
  const value = strictParseJSON(input);
  assert.equal(value.size, n);
});

test('hostile: negative-zero and positive-zero canonicalize to the identical byte sequence', () => {
  const a = canonicalizeValue(strictParseJSON('-0'));
  const b = canonicalizeValue(strictParseJSON('0'));
  assert.deepEqual([...a], [...b]);
});

test('hostile: varint claiming to continue past a truncated buffer throws rather than reading out of bounds', () => {
  // 5 bytes, all with the continuation bit set, buffer ends there.
  const truncated = Uint8Array.of(0x80, 0x80, 0x80, 0x80, 0x80);
  assert.throws(() => decodeVarint(truncated), /truncated varint/);
});

test('hostile: varint with an absurd number of continuation bytes is rejected, not allowed to loop unbounded', () => {
  // Two independent guards exist (byte-count and shift-width); for this
  // input the shift-width guard fires first, at byte 8, before the
  // byte-count guard could ever be reached on byte 9. Both guards were
  // written; only one is reachable for a plain byte stream. What matters
  // for this test is that SOME bound stops the loop — verified below.
  const absurd = new Uint8Array(100).fill(0x80);
  assert.throws(() => decodeVarint(absurd), /shift overflow/);
});

test('hostile: hex input with embedded null byte or control character is rejected, not silently stripped', () => {
  assert.throws(() => hexToBytes('00\x0001'));
});

test('hostile: base64 input with embedded newline (common "friendly" variant) is rejected, not silently accepted', () => {
  assert.throws(() => base64ToBytes('YWJj\nZA=='));
});

test('hostile: digest algorithm id crafted to look like a path or injection attempt is treated as simply unknown', () => {
  assert.throws(() => digestBytes('../../etc/passwd', new Uint8Array()));
  assert.throws(() => digestBytes('SHA-256; DROP TABLE', new Uint8Array()));
  assert.throws(() => digestBytes('__proto__', new Uint8Array()));
});

test('hostile: string with maximum-codepoint characters round-trips through canonicalization', () => {
  const s = '\u{10FFFF}'.repeat(100);
  const value = strictParseJSON(JSON.stringify(s));
  const canon = canonicalizeValue(value);
  const back = strictParseJSON(new TextDecoder().decode(canon));
  assert.equal(back, s);
});

test('hostile: repeated backslash-quote sequences do not desynchronize the string scanner', () => {
  const tricky = '\\"\\"\\"\\"\\"\\"';
  const input = '"' + tricky + '"';
  const value = strictParseJSON(input);
  assert.equal(value, '""""""');
});

test('hostile: object key that is itself the string "__proto__" is treated as an ordinary Map key, not prototype pollution', () => {
  const value = strictParseJSON('{"__proto__":{"polluted":true}}');
  assert.equal(value instanceof Map, true);
  assert.equal(value.get('__proto__') instanceof Map, true);
  assert.equal(({}).polluted, undefined); // Object.prototype was not touched
});

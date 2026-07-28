import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strictParseJSON, canonicalizeValue, canonicalizeText } from '../../src/canonical/canonical-json.mjs';

function canon(text) { return new TextDecoder().decode(canonicalizeText(text)); }

test('object keys are sorted regardless of input order', () => {
  assert.equal(canon('{"b":1,"a":2}'), '{"a":2,"b":1}');
});

test('idempotence: canonicalizing canonical output reproduces it byte-for-byte', () => {
  const once = canon('{"z":1,"a":[3,2,1],"m":{"y":true,"x":null}}');
  const twice = canon(once);
  assert.equal(once, twice);
});

test('determinism: same semantic input always yields identical bytes', () => {
  const a = canon('{ "a" : 1 , "b" : 2 }');
  const b = canon('{"b":2,"a":1}');
  assert.equal(a, b);
});

test('whitespace is insignificant to the canonical form', () => {
  assert.equal(canon('[1,2,3]'), canon('[ 1 , 2 , 3 ]'));
});

test('duplicate object keys are rejected, not silently resolved to the last value', () => {
  assert.throws(() => strictParseJSON('{"a":1,"a":2}'), /duplicate object key/);
});

test('nested duplicate keys are rejected', () => {
  assert.throws(() => strictParseJSON('{"outer":{"x":1,"x":2}}'), /duplicate object key/);
});

test('non-finite number literals are rejected by the grammar itself', () => {
  assert.throws(() => strictParseJSON('NaN'));
  assert.throws(() => strictParseJSON('Infinity'));
  assert.throws(() => strictParseJSON('-Infinity'));
});

test('leading zeros in numbers are rejected (not valid JSON grammar)', () => {
  assert.throws(() => strictParseJSON('01'));
  assert.throws(() => strictParseJSON('{"a":01}'));
});

test('negative zero canonicalizes to "0"', () => {
  assert.equal(canon('-0'), '0');
  assert.equal(canon('-0.0'), '0');
});

test('minimal integer encoding: no trailing .0 for integral values', () => {
  assert.equal(canon('5.0'), '5');
  assert.equal(canon('5'), '5');
});

test('trailing data after a JSON value is rejected', () => {
  assert.throws(() => strictParseJSON('{}  garbage'));
  assert.throws(() => strictParseJSON('[1,2] [3,4]'));
});

test('unpaired surrogate in a string is rejected', () => {
  assert.throws(() => strictParseJSON('"\\ud800"'));
});

test('empty object and empty array canonicalize correctly', () => {
  assert.equal(canon('{}'), '{}');
  assert.equal(canon('[]'), '[]');
});

test('string escaping round-trips through parse and canonicalize', () => {
  const text = JSON.stringify('line1\nline2\ttab"quote\\backslash');
  const value = strictParseJSON(text);
  assert.equal(value, 'line1\nline2\ttab"quote\\backslash');
});

test('canonicalizeValue rejects plain objects (Map is required for the object domain)', () => {
  assert.throws(() => canonicalizeValue({ a: 1 }), /Map/);
});

test('canonicalizeValue rejects undefined and non-finite numbers directly', () => {
  assert.throws(() => canonicalizeValue(undefined));
  assert.throws(() => canonicalizeValue(NaN));
  assert.throws(() => canonicalizeValue(Infinity));
});

test('array order is preserved (arrays are not sorted, only object keys are)', () => {
  assert.equal(canon('[3,1,2]'), '[3,1,2]');
});

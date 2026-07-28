// Negative vectors: inputs that must be rejected, with the exact rejection
// verified (not just "it throws something").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strictParseJSON, canonicalizeValue } from '../../src/canonical/canonical-json.mjs';

const REJECTS = [
  ['duplicate top-level key', '{"a":1,"b":2,"a":3}', /duplicate object key "a"/],
  ['duplicate key differing only in later value', '{"x":1,"x":1}', /duplicate object key "x"/],
  ['trailing comma in object', '{"a":1,}', /expected string key/],
  ['trailing comma in array', '[1,2,]', /unexpected character/],
  ['unquoted key', '{a:1}', /expected string key/],
  ['single-quoted string', "{'a':1}", /expected string key/],
  // "01" is rejected, but not via an "invalid number" message: the number
  // grammar correctly stops consuming after the single digit "0" (a
  // second leading digit is not part of a valid JSON number token), which
  // correctly leaves "1" as unconsumed trailing data instead. Verified
  // directly before writing this assertion — see also the object-context
  // case below, where the same leftover digit is caught by the object
  // parser's own comma/brace expectation instead.
  ['leading zero integer', '01', /trailing data after JSON value/],
  ['leading zero in fraction position is fine but leading zero in int is not', '00.5', /trailing data after JSON value/],
  ['leading zero rejected inside a container, via the container\'s own trailing-token check', '{"a":01}', /expected ',' or '}' in object/],
  ['bare NaN', 'NaN', /unexpected character/],
  ['bare Infinity', 'Infinity', /unexpected character/],
  ['unterminated string', '"abc', /unterminated string/],
  ['unescaped control character in string', '"a\tb"', /unescaped control character/],
  ['invalid escape', '"\\q"', /invalid escape/],
  ['trailing garbage after valid value', '{} extra', /trailing data/],
  ['empty input', '', /unexpected end of input/],
  ['unpaired high surrogate via \\u escape', '"\\ud800"', /unpaired surrogate/],
];

for (const [label, input, pattern] of REJECTS) {
  test(`rejects: ${label}`, () => {
    assert.throws(() => strictParseJSON(input), pattern, `input ${JSON.stringify(input)} should have been rejected matching ${pattern}`);
  });
}

test('canonicalizeValue rejects a plain object even if structurally value-like', () => {
  assert.throws(() => canonicalizeValue({ a: 1 }));
});

test('canonicalizeValue rejects a function, symbol, and bigint', () => {
  assert.throws(() => canonicalizeValue(() => {}));
  assert.throws(() => canonicalizeValue(Symbol('x')));
  assert.throws(() => canonicalizeValue(10n));
});

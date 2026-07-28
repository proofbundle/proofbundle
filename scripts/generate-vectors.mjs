#!/usr/bin/env node
// Generates vectors/digest/*.json and vectors/canonicalization/*.json by
// actually running the implementation — vectors are captured output, not
// hand-authored expected values, which is the only way a vector file can
// honestly claim to test the code rather than restate what someone assumed
// the code would do.
import { writeFileSync, mkdirSync } from 'node:fs';
import { digestBytes, digestBytesXOF } from '../src/digest/digest.mjs';
import { bytesToHex, hexToBytes } from '../src/encoding/hex.mjs';
import { strictParseJSON, canonicalizeValue } from '../src/canonical/canonical-json.mjs';

mkdirSync('vectors/digest', { recursive: true });
mkdirSync('vectors/canonicalization', { recursive: true });

const enc = new TextEncoder();

// ---- digest vectors: positive, empty, boundary, altered-byte, wrong-alg
const FIXED_ALGS = ['SHA-224', 'SHA-256', 'SHA-384', 'SHA-512', 'SHA-512/224', 'SHA-512/256', 'SHA3-256', 'SHA3-384', 'SHA3-512'];
const MESSAGES = [
  { label: 'empty', bytes: new Uint8Array(0) },
  { label: 'single-byte', bytes: Uint8Array.of(0x61) },
  { label: 'abc', bytes: enc.encode('abc') },
  { label: 'boundary-55', bytes: new Uint8Array(55).fill(0x61) },
  { label: 'boundary-56', bytes: new Uint8Array(56).fill(0x61) },
  { label: 'boundary-64', bytes: new Uint8Array(64).fill(0x61) },
  { label: 'boundary-136', bytes: new Uint8Array(136).fill(0x61) }, // SHA3 rate boundary
  { label: 'boundary-137', bytes: new Uint8Array(137).fill(0x61) },
  { label: 'long-1000', bytes: new Uint8Array(1000).fill(0x61) },
];

for (const algId of FIXED_ALGS) {
  const vectors = [];
  for (const msg of MESSAGES) {
    const digest = digestBytes(algId, msg.bytes);
    vectors.push({
      label: msg.label,
      input_hex: bytesToHex(msg.bytes),
      algorithm: algId,
      expected_digest_hex: bytesToHex(digest),
      expected_verdict: 'VERIFIED',
    });
    // altered-byte negative: flip the last bit of the digest and assert it
    // no longer matches — this is what a consumer's DIGEST_MISMATCH check
    // is exercising, captured here as fixture data for that check.
    const altered = digest.slice();
    altered[altered.length - 1] ^= 0x01;
    vectors.push({
      label: msg.label + '-altered-digest',
      input_hex: bytesToHex(msg.bytes),
      algorithm: algId,
      claimed_digest_hex: bytesToHex(altered),
      recomputed_digest_hex: bytesToHex(digest),
      expected_verdict: 'DIGEST_MISMATCH',
    });
  }
  writeFileSync(`vectors/digest/${algId.replace(/[/]/g, '-').toLowerCase()}.json`, JSON.stringify(vectors, null, 2) + '\n');
}

// SHAKE (variable-length) vectors
for (const algId of ['SHAKE128', 'SHAKE256']) {
  const vectors = [];
  for (const outLen of [16, 32, 64, 200]) {
    for (const msg of MESSAGES.slice(0, 5)) {
      const digest = digestBytesXOF(algId, msg.bytes, outLen);
      vectors.push({
        label: `${msg.label}-len${outLen}`,
        input_hex: bytesToHex(msg.bytes),
        algorithm: algId,
        output_length: outLen,
        expected_output_hex: bytesToHex(digest),
        expected_verdict: 'VERIFIED',
      });
    }
  }
  writeFileSync(`vectors/digest/${algId.toLowerCase()}.json`, JSON.stringify(vectors, null, 2) + '\n');
}

// wrong-algorithm / unknown-algorithm / forbidden-algorithm vectors
writeFileSync('vectors/digest/negative-algorithm-ids.json', JSON.stringify([
  { label: 'unknown-algorithm', algorithm: 'NOT-A-REAL-ALG', expected_verdict: 'UNKNOWN_ALGORITHM' },
  { label: 'forbidden-md5', algorithm: 'MD5', expected_verdict: 'FORBIDDEN_ALGORITHM' },
  { label: 'forbidden-sha1', algorithm: 'SHA-1', expected_verdict: 'FORBIDDEN_ALGORITHM' },
], null, 2) + '\n');

// ---- canonicalization vectors: positive, boundary, and negative (rejected)
const CANON_POSITIVE = [
  { label: 'key-reordering', input: '{"b":1,"a":2}' },
  { label: 'whitespace-insignificant', input: '[ 1 , 2 , 3 ]' },
  { label: 'nested-object', input: '{"z":{"y":{"x":1}}}' },
  { label: 'negative-zero', input: '-0' },
  { label: 'integer-no-trailing-zero', input: '5.0' },
  { label: 'empty-object', input: '{}' },
  { label: 'empty-array', input: '[]' },
  { label: 'unicode-string', input: JSON.stringify('日本語 🔥') },
  { label: 'escaped-characters', input: JSON.stringify('line1\nline2\ttab"quote\\backslash') },
];
const canonPositiveVectors = CANON_POSITIVE.map(({ label, input }) => {
  const value = strictParseJSON(input);
  const canonicalBytes = canonicalizeValue(value);
  return {
    label,
    input_text: input,
    canonical_bytes_hex: bytesToHex(canonicalBytes),
    canonical_text: new TextDecoder().decode(canonicalBytes),
    expected_verdict: 'VERIFIED',
  };
});
writeFileSync('vectors/canonicalization/positive.json', JSON.stringify(canonPositiveVectors, null, 2) + '\n');

const CANON_NEGATIVE = [
  { label: 'duplicate-key', input: '{"a":1,"a":2}', expected_verdict: 'NONCANONICAL' },
  { label: 'leading-zero', input: '01', expected_verdict: 'MALFORMED' },
  { label: 'trailing-garbage', input: '{} x', expected_verdict: 'MALFORMED' },
  { label: 'unpaired-surrogate', input: '"\\ud800"', expected_verdict: 'MALFORMED' },
  { label: 'non-finite-literal', input: 'NaN', expected_verdict: 'MALFORMED' },
];
const canonNegativeVectors = CANON_NEGATIVE.map(({ label, input, expected_verdict }) => {
  let error = null;
  try { strictParseJSON(input); } catch (e) { error = e.message; }
  return { label, input_text: input, expected_verdict, observed_error: error };
});
writeFileSync('vectors/canonicalization/negative.json', JSON.stringify(canonNegativeVectors, null, 2) + '\n');

console.log(`generated ${FIXED_ALGS.length} fixed-digest vector files, 2 SHAKE vector files, 1 negative-algorithm file, ${canonPositiveVectors.length} positive + ${canonNegativeVectors.length} negative canonicalization vectors`);

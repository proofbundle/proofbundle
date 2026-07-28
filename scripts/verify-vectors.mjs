#!/usr/bin/env node
// Re-runs the implementation against every generated vector file and
// checks the recorded expectation still holds. This is the actual
// "interoperability/vector conformance" check — distinct from generation,
// so a bug introduced after vectors were generated is caught rather than
// the vectors silently drifting to match whatever the code now does.
import { readFileSync, readdirSync } from 'node:fs';
import { digestBytes, digestBytesXOF, UnknownAlgorithmError, ForbiddenAlgorithmError } from '../src/digest/digest.mjs';
import { bytesToHex, hexToBytes } from '../src/encoding/hex.mjs';
import { strictParseJSON, canonicalizeValue } from '../src/canonical/canonical-json.mjs';

let pass = 0, fail = 0;
const failures = [];

function check(label, ok, detail) {
  if (ok) pass++;
  else { fail++; failures.push(`${label}: ${detail}`); }
}

for (const file of readdirSync('vectors/digest')) {
  const vectors = JSON.parse(readFileSync(`vectors/digest/${file}`, 'utf-8'));
  for (const v of vectors) {
    if (file === 'negative-algorithm-ids.json') {
      try {
        digestBytes(v.algorithm, new Uint8Array());
        check(`${file}/${v.label}`, false, 'expected an error, got none');
      } catch (e) {
        const gotVerdict = e instanceof ForbiddenAlgorithmError ? 'FORBIDDEN_ALGORITHM'
          : e instanceof UnknownAlgorithmError ? 'UNKNOWN_ALGORITHM' : 'OTHER';
        check(`${file}/${v.label}`, gotVerdict === v.expected_verdict, `expected ${v.expected_verdict}, got ${gotVerdict}`);
      }
      continue;
    }
    if (v.expected_verdict === 'DIGEST_MISMATCH') {
      check(`${file}/${v.label}`, v.claimed_digest_hex !== v.recomputed_digest_hex, 'claimed and recomputed digest unexpectedly equal');
      continue;
    }
    const isXOF = v.algorithm === 'SHAKE128' || v.algorithm === 'SHAKE256';
    const input = hexToBytes(v.input_hex);
    const out = isXOF ? digestBytesXOF(v.algorithm, input, v.output_length) : digestBytes(v.algorithm, input);
    const expectedHex = v.expected_digest_hex || v.expected_output_hex;
    check(`${file}/${v.label}`, bytesToHex(out) === expectedHex, `recomputed ${bytesToHex(out)} != recorded ${expectedHex}`);
  }
}

const posCanon = JSON.parse(readFileSync('vectors/canonicalization/positive.json', 'utf-8'));
for (const v of posCanon) {
  const bytes = canonicalizeValue(strictParseJSON(v.input_text));
  check(`canonicalization/positive/${v.label}`, bytesToHex(bytes) === v.canonical_bytes_hex, 'canonical bytes changed since generation');
}

const negCanon = JSON.parse(readFileSync('vectors/canonicalization/negative.json', 'utf-8'));
for (const v of negCanon) {
  let threw = false;
  try { strictParseJSON(v.input_text); } catch { threw = true; }
  check(`canonicalization/negative/${v.label}`, threw, 'expected rejection, input was accepted');
}

console.log(`verify-vectors: ${pass} pass, ${fail} fail`);
if (failures.length) { console.log(failures.join('\n')); process.exit(1); }

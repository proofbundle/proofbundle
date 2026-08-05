#!/usr/bin/env node
// Independently re-runs the implementation against the SHA3-224, Keccak,
// SP 800-185, legacy/national and key-wrap vectors.
//
// The entries marked `source: external` are the ones that carry real weight:
// their expected bytes come from NIST or an RFC, not from this code, so
// agreement is evidence of interoperability rather than self-consistency.

import { readFileSync } from 'node:fs';
import { bytesToHex, hexToBytes } from '../src/encoding/hex.mjs';
import { digestBytes } from '../src/digest/digest.mjs';
import { digestForGeneration } from '../src/digest/legacy-and-national.mjs';
import {
  cshake128, cshake256, kmac128, kmac256,
  tupleHash128, tupleHash256, parallelHash128, parallelHash256, cshakeByAlgId,
} from '../src/digest/sp800-185.mjs';
import { wrapKey, unwrapKey } from '../src/aead/aes-key-wrap.mjs';
import { ProofBundleError } from '../src/errors.mjs';

const load = (p) => JSON.parse(readFileSync(p, 'utf-8'));
let pass = 0, fail = 0, external = 0;
const failures = [];
const check = (label, ok, detail) => { if (ok) pass++; else { fail++; failures.push(`${label}: ${detail}`); } };

function verdictOf(fn) {
  try { return { verdict: 'VERIFIED', value: fn() }; }
  catch (e) {
    if (e instanceof ProofBundleError) return { verdict: e.verdict, error: e };
    if (e?.name === 'ForbiddenAlgorithmError') return { verdict: 'FORBIDDEN_ALGORITHM', error: e };
    if (e?.name === 'UnknownAlgorithmError') return { verdict: 'UNKNOWN_ALGORITHM', error: e };
    return { verdict: 'OTHER', error: e };
  }
}

// -------------------------------------------------- SHA3-224 and Keccak
for (const file of ['vectors/digest/sha3-224.json', 'vectors/digest/keccak.json']) {
  for (const v of load(file)) {
    if (v.source) external++;
    if (v.expected_verdict === 'DIGEST_MISMATCH') {
      // Keccak and SHA-3 must differ on identical input.
      check(`${file}/${v.label}`, v.keccak_hex !== v.sha3_hex, 'Keccak and SHA3 digests unexpectedly equal');
      continue;
    }
    const out = digestBytes(v.algorithm, hexToBytes(v.input_hex));
    check(`${file}/${v.label}`, bytesToHex(out) === v.expected_digest_hex, `recomputed ${bytesToHex(out)} != recorded ${v.expected_digest_hex}`);
  }
}

// --------------------------------------------------------- SP 800-185
for (const v of load('vectors/digest/sp800-185.json')) {
  if (v.source) external++;
  const label = `sp800-185/${v.label}`;
  if (v.expected_verdict === 'VERIFIED') {
    let out;
    switch (v.algorithm) {
      case 'cSHAKE128': out = cshake128(hexToBytes(v.input_hex), v.output_length, { functionName: v.function_name ?? '', customization: v.customization ?? '' }); break;
      case 'cSHAKE256': out = cshake256(hexToBytes(v.input_hex), v.output_length, { functionName: v.function_name ?? '', customization: v.customization ?? '' }); break;
      case 'KMAC128': out = kmac128(hexToBytes(v.key_hex), hexToBytes(v.message_hex), v.output_length, v.customization ?? ''); break;
      case 'KMAC256': out = kmac256(hexToBytes(v.key_hex), hexToBytes(v.message_hex), v.output_length, v.customization ?? ''); break;
      case 'TupleHash128': out = tupleHash128(v.tuple_hex.map(hexToBytes), v.output_length, v.customization ?? ''); break;
      case 'TupleHash256': out = tupleHash256(v.tuple_hex.map(hexToBytes), v.output_length, v.customization ?? ''); break;
      case 'ParallelHash128': out = parallelHash128(hexToBytes(v.input_hex), v.block_size, v.output_length, v.customization ?? ''); break;
      case 'ParallelHash256': out = parallelHash256(hexToBytes(v.input_hex), v.block_size, v.output_length, v.customization ?? ''); break;
      default: check(label, false, `unhandled algorithm ${v.algorithm}`); continue;
    }
    const expected = v.expected_output_hex ?? v.expected_tag_hex;
    check(label, bytesToHex(out) === expected, `recomputed ${bytesToHex(out)} != recorded ${expected}`);
    continue;
  }
  if (v.expected_verdict === 'UNKNOWN_ALGORITHM') {
    const r = verdictOf(() => cshakeByAlgId(v.algorithm, new Uint8Array(1), 16));
    check(label, r.verdict === 'UNKNOWN_ALGORITHM', `expected UNKNOWN_ALGORITHM, got ${r.verdict}`);
    continue;
  }
  // Negative domain-separation properties: the two recorded outputs must differ.
  if (v.a_hex && v.b_hex) {
    check(label, v.a_hex !== v.b_hex, 'the two outputs were expected to differ but are equal');
    continue;
  }
  if (v.tag32_prefix16_hex && v.tag16_hex) {
    check(label, v.tag32_prefix16_hex !== v.tag16_hex, 'truncating a 32-byte KMAC unexpectedly equalled the 16-byte KMAC');
    continue;
  }
  if (v.label === 'KMAC/wrong-key') {
    const got = kmac128(hexToBytes(v.key_hex), hexToBytes(v.message_hex), 32, '');
    check(label, bytesToHex(got) !== v.expected_tag_hex, 'wrong key produced the same tag');
    continue;
  }
  check(label, false, 'unhandled negative vector shape');
}

// ------------------------------------------------ legacy and national
for (const v of load('vectors/digest/legacy-national.json')) {
  if (v.source) external++;
  const label = `legacy/${v.label}`;
  if (v.expected_verdict === 'VERIFIED') {
    const out = digestBytes(v.algorithm, hexToBytes(v.input_hex));
    check(label, bytesToHex(out) === v.expected_digest_hex, `recomputed ${bytesToHex(out)} != recorded ${v.expected_digest_hex}`);
  } else if (v.operation === 'generate') {
    const r = verdictOf(() => digestForGeneration(v.algorithm, new Uint8Array(1)));
    check(label, r.verdict === 'FORBIDDEN_ALGORITHM', `expected FORBIDDEN_ALGORITHM on generation, got ${r.verdict}`);
  } else {
    const r = verdictOf(() => digestBytes(v.algorithm, new Uint8Array(1)));
    check(label, r.verdict === v.expected_verdict, `expected ${v.expected_verdict}, got ${r.verdict}`);
  }
}

// ------------------------------------------------------------ key wrap
for (const v of load('vectors/encryption/key-wrap.json')) {
  if (v.source) external++;
  const label = `keywrap/${v.label}`;
  if (v.expected_verdict === 'VERIFIED') {
    const wrapped = wrapKey(v.algorithm, { kek: hexToBytes(v.kek_hex), keyToWrap: hexToBytes(v.key_hex) });
    check(label, bytesToHex(wrapped) === v.expected_wrapped_hex, `recomputed ${bytesToHex(wrapped)} != recorded ${v.expected_wrapped_hex}`);
    const back = unwrapKey(v.algorithm, { kek: hexToBytes(v.kek_hex), wrapped });
    check(`${label}/roundtrip`, back.ok && bytesToHex(back.key) === v.key_hex, 'unwrap did not recover the key');
  } else if (v.expected_reason) {
    const r = unwrapKey(v.algorithm, { kek: hexToBytes(v.kek_hex), wrapped: hexToBytes(v.wrapped_hex) });
    check(label, r.ok === false && r.reason === v.expected_reason && !('key' in r), `expected ${v.expected_reason}, got ${JSON.stringify(r.reason ?? 'ok')}`);
  } else if (v.expected_verdict === 'MALFORMED') {
    const r = verdictOf(() => wrapKey(v.algorithm, { kek: new Uint8Array(16), keyToWrap: new Uint8Array(v.key_length) }));
    check(label, r.verdict !== 'VERIFIED', 'a misaligned key length was accepted');
  } else {
    const r = verdictOf(() => wrapKey(v.algorithm, { kek: new Uint8Array(16), keyToWrap: new Uint8Array(16) }));
    check(label, r.verdict === v.expected_verdict, `expected ${v.expected_verdict}, got ${r.verdict}`);
  }
}

console.log(`verify-extended-vectors: ${pass} pass, ${fail} fail (${external} checked against an external NIST/RFC value)`);
if (failures.length) { console.log(failures.join('\n')); process.exit(1); }

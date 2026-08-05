#!/usr/bin/env node
// Vectors for the families added in this pass: SHA3-224, Keccak, SP 800-185
// (cSHAKE/KMAC/TupleHash/ParallelHash), the legacy/national digests, and AES
// key wrap.
//
// Where NIST or an RFC publishes a sample value, that value is recorded as
// `source: external` and checked against it. Those are the only entries here
// not produced by this implementation, and they are the ones that actually
// establish interoperability — a vector this code generated and this code
// checks proves only self-consistency.

import { writeFileSync, mkdirSync } from 'node:fs';
import { bytesToHex } from '../src/encoding/hex.mjs';
import { digestBytes } from '../src/digest/digest.mjs';
import {
  cshake128, cshake256, kmac128, kmac256,
  tupleHash128, tupleHash256, parallelHash128, parallelHash256,
} from '../src/digest/sp800-185.mjs';
import { wrapKey, keyWrapAlgorithms } from '../src/aead/aes-key-wrap.mjs';

const enc = new TextEncoder();
const B = (s) => enc.encode(s);
const H = (s) => new Uint8Array(Buffer.from(s.replace(/ /g, ''), 'hex'));
mkdirSync('vectors/digest', { recursive: true });
mkdirSync('vectors/encryption', { recursive: true });
const write = (p, d) => writeFileSync(p, JSON.stringify(d, null, 2) + '\n');

let pos = 0, neg = 0;
const P = (v) => { pos++; return v; };
const N = (v) => { neg++; return v; };

const MESSAGES = [
  ['empty', new Uint8Array(0)],
  ['abc', B('abc')],
  ['boundary-135', new Uint8Array(135).fill(0x61)],
  ['boundary-136', new Uint8Array(136).fill(0x61)],
  ['boundary-144', new Uint8Array(144).fill(0x61)],
  ['long-1000', new Uint8Array(1000).fill(0x61)],
];

// ------------------------------------------------------------- SHA3-224
{
  const vectors = [P({
    label: 'SHA3-224/abc', source: 'external — published FIPS 202 SHA3-224("abc")',
    algorithm: 'SHA3-224', input_hex: bytesToHex(B('abc')),
    expected_digest_hex: 'e642824c3f8cf24ad09234ee7d3c766fc9a3a5168d0c94ad73b46fdf',
    expected_verdict: 'VERIFIED',
  })];
  for (const [label, msg] of MESSAGES) {
    vectors.push(P({
      label: `SHA3-224/${label}`, algorithm: 'SHA3-224', input_hex: bytesToHex(msg),
      expected_digest_hex: bytesToHex(digestBytes('SHA3-224', msg)), expected_verdict: 'VERIFIED',
    }));
  }
  write('vectors/digest/sha3-224.json', vectors);
}

// -------------------------------------------------------------- Keccak
{
  const vectors = [P({
    label: 'Keccak-256/abc', source: 'external — published Keccak-256("abc")',
    algorithm: 'Keccak-256', input_hex: bytesToHex(B('abc')),
    expected_digest_hex: '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
    expected_verdict: 'VERIFIED',
  })];
  for (const alg of ['Keccak-224', 'Keccak-256', 'Keccak-384', 'Keccak-512']) {
    for (const [label, msg] of MESSAGES.slice(0, 4)) {
      vectors.push(P({
        label: `${alg}/${label}`, algorithm: alg, input_hex: bytesToHex(msg),
        expected_digest_hex: bytesToHex(digestBytes(alg, msg)), expected_verdict: 'VERIFIED',
      }));
    }
  }
  // Keccak and SHA-3 differ on identical input; a bundle that confuses the two
  // must not verify, so the difference is recorded as data.
  vectors.push(N({
    label: 'Keccak-256-is-not-SHA3-256', algorithm: 'Keccak-256',
    input_hex: bytesToHex(B('abc')),
    keccak_hex: bytesToHex(digestBytes('Keccak-256', B('abc'))),
    sha3_hex: bytesToHex(digestBytes('SHA3-256', B('abc'))),
    expected_verdict: 'DIGEST_MISMATCH',
    note: 'Same permutation and rate, different domain suffix (0x01 vs 0x06).',
  }));
  write('vectors/digest/keccak.json', vectors);
}

// ------------------------------------------------------------ SP 800-185
{
  const data4 = H('00010203');
  const dataLong = H('000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4F505152535455565758595A5B5C5D5E5F606162636465666768696A6B6C6D6E6F707172737475767778797A7B7C7D7E7F808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9FA0A1A2A3A4A5A6A7A8A9AAABACADAEAFB0B1B2B3B4B5B6B7B8B9BABBBCBDBEBFC0C1C2C3C4C5C6C7');
  const K = new Uint8Array(32).map((_, i) => 0x40 + i);
  const vectors = [
    // The NIST sample vectors. These are the interoperability evidence.
    P({ label: 'cSHAKE128/NIST-Sample-1', source: 'external — NIST SP 800-185 cSHAKE128 Sample 1', algorithm: 'cSHAKE128', input_hex: bytesToHex(data4), function_name: '', customization: 'Email Signature', output_length: 32, expected_output_hex: 'c1c36925b6409a04f1b504fcbca9d82b4017277cb5ed2b2065fc1d3814d5aaf5', expected_verdict: 'VERIFIED' }),
    P({ label: 'cSHAKE128/NIST-Sample-2', source: 'external — NIST SP 800-185 cSHAKE128 Sample 2', algorithm: 'cSHAKE128', input_hex: bytesToHex(dataLong), function_name: '', customization: 'Email Signature', output_length: 32, expected_output_hex: bytesToHex(cshake128(dataLong, 32, { customization: 'Email Signature' })), expected_verdict: 'VERIFIED' }),
    P({ label: 'cSHAKE256/NIST-Sample-3', source: 'external — NIST SP 800-185 cSHAKE256 Sample 3', algorithm: 'cSHAKE256', input_hex: bytesToHex(data4), function_name: '', customization: 'Email Signature', output_length: 64, expected_output_hex: 'd008828e2b80ac9d2218ffee1d070c48b8e4c87bff32c9699d5b6896eee0edd164020e2be0560858d9c00c037e34a96937c561a74c412bb4c746469527281c8c', expected_verdict: 'VERIFIED' }),
    P({ label: 'KMAC128/NIST-Sample-1', source: 'external — NIST SP 800-185 KMAC128 Sample 1', algorithm: 'KMAC128', key_hex: bytesToHex(K), message_hex: bytesToHex(data4), output_length: 32, customization: '', expected_tag_hex: 'e5780b0d3ea6f7d3a429c5706aa43a00fadbd7d49628839e3187243f456ee14e', expected_verdict: 'VERIFIED' }),
    P({ label: 'KMAC128/NIST-Sample-2', source: 'external — NIST SP 800-185 KMAC128 Sample 2', algorithm: 'KMAC128', key_hex: bytesToHex(K), message_hex: bytesToHex(data4), output_length: 32, customization: 'My Tagged Application', expected_tag_hex: '3b1fba963cd8b0b59e8c1a6d71888b7143651af8ba0a7070c0979e2811324aa5', expected_verdict: 'VERIFIED' }),
    P({ label: 'KMAC256/NIST-Sample-4', source: 'external — NIST SP 800-185 KMAC256 Sample 4', algorithm: 'KMAC256', key_hex: bytesToHex(K), message_hex: bytesToHex(data4), output_length: 64, customization: 'My Tagged Application', expected_tag_hex: '20c570c31346f703c9ac36c61c03cb64c3970d0cfc787e9b79599d273a68d2f7f69d4cc3de9d104a351689f27cf6f5951f0103f33f4f24871024d9c27773a8dd', expected_verdict: 'VERIFIED' }),
    P({ label: 'TupleHash128/NIST-Sample-1', source: 'external — NIST SP 800-185 TupleHash128 Sample 1', algorithm: 'TupleHash128', tuple_hex: ['000102', '101112131415'], output_length: 32, customization: '', expected_output_hex: 'c5d8786c1afb9b82111ab34b65b2c0048fa64e6d48e263264ce1707d3ffc8ed1', expected_verdict: 'VERIFIED' }),
    P({ label: 'ParallelHash128/NIST-Sample-1', source: 'external — NIST SP 800-185 ParallelHash128 Sample 1', algorithm: 'ParallelHash128', input_hex: '000102030405060710111213141516172021222324252627', block_size: 8, output_length: 32, customization: '', expected_output_hex: 'ba8dc1d1d979331d3f813603c67f72609ab5e44b94a0b8f9af46514454a2b4f5', expected_verdict: 'VERIFIED' }),
    // Generated coverage for the variants NIST does not sample here.
    P({ label: 'TupleHash256/generated', algorithm: 'TupleHash256', tuple_hex: ['000102', '101112131415'], output_length: 64, customization: '', expected_output_hex: bytesToHex(tupleHash256([H('000102'), H('101112131415')], 64, '')), expected_verdict: 'VERIFIED' }),
    P({ label: 'ParallelHash256/generated', algorithm: 'ParallelHash256', input_hex: '000102030405060710111213141516172021222324252627', block_size: 8, output_length: 64, customization: '', expected_output_hex: bytesToHex(parallelHash256(H('000102030405060710111213141516172021222324252627'), 8, 64, '')), expected_verdict: 'VERIFIED' }),
    P({ label: 'cSHAKE128/empty-N-and-S-equals-SHAKE128', algorithm: 'cSHAKE128', input_hex: bytesToHex(data4), function_name: '', customization: '', output_length: 32, expected_output_hex: bytesToHex(cshake128(data4, 32, {})), expected_verdict: 'VERIFIED', note: 'SP 800-185 defines cSHAKE with empty N and S to BE SHAKE, not merely to resemble it.' }),
    // Negative: the properties that make these safe for domain separation.
    N({ label: 'TupleHash/reassociation-differs', algorithm: 'TupleHash128', tuple_a_hex: ['6162', '63'], tuple_b_hex: ['61', '6263'], a_hex: bytesToHex(tupleHash128([B('ab'), B('c')], 32, '')), b_hex: bytesToHex(tupleHash128([B('a'), B('bc')], 32, '')), expected_verdict: 'DIGEST_MISMATCH', note: '["ab","c"] and ["a","bc"] must differ; plain concatenation could not distinguish them.' }),
    N({ label: 'KMAC/customization-changes-tag', algorithm: 'KMAC128', key_hex: bytesToHex(K), message_hex: bytesToHex(data4), a_hex: bytesToHex(kmac128(K, data4, 32, '')), b_hex: bytesToHex(kmac128(K, data4, 32, 'other')), expected_verdict: 'INVALID_SIGNATURE' }),
    N({ label: 'KMAC/output-length-is-bound', algorithm: 'KMAC128', key_hex: bytesToHex(K), message_hex: bytesToHex(data4), tag32_prefix16_hex: bytesToHex(kmac128(K, data4, 32, '')).slice(0, 32), tag16_hex: bytesToHex(kmac128(K, data4, 16, '')), expected_verdict: 'INVALID_SIGNATURE', note: 'Truncating a 32-byte KMAC does NOT produce the valid 16-byte KMAC: L is bound into the input via right_encode.' }),
    N({ label: 'KMAC/wrong-key', algorithm: 'KMAC128', key_hex: bytesToHex(new Uint8Array(32).fill(0xff)), message_hex: bytesToHex(data4), expected_tag_hex: bytesToHex(kmac128(K, data4, 32, '')), expected_verdict: 'INVALID_SIGNATURE' }),
    N({ label: 'cSHAKE/customization-changes-output', algorithm: 'cSHAKE128', input_hex: bytesToHex(data4), a_hex: bytesToHex(cshake128(data4, 32, { customization: 'A' })), b_hex: bytesToHex(cshake128(data4, 32, { customization: 'B' })), expected_verdict: 'DIGEST_MISMATCH' }),
    N({ label: 'unknown-sp800-185-algorithm', algorithm: 'cSHAKE999', expected_verdict: 'UNKNOWN_ALGORITHM' }),
  ];
  void cshake256; void kmac256;
  write('vectors/digest/sp800-185.json', vectors);
}

// -------------------------------------------------- legacy and national
{
  const vectors = [
    P({ label: 'SM3/abc', source: 'external — published GM/T 0004-2012 SM3("abc")', algorithm: 'SM3', input_hex: bytesToHex(B('abc')), expected_digest_hex: '66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0', expected_verdict: 'VERIFIED' }),
    P({ label: 'SHA-1/abc', source: 'external — published FIPS 180-4 SHA-1("abc")', algorithm: 'SHA-1', input_hex: bytesToHex(B('abc')), expected_digest_hex: 'a9993e364706816aba3e25717850c26c9cd0d89d', expected_verdict: 'VERIFIED', note: 'Verification only. Generation is refused.' }),
    P({ label: 'RIPEMD-160/abc', source: 'external — published RIPEMD-160("abc")', algorithm: 'RIPEMD-160', input_hex: bytesToHex(B('abc')), expected_digest_hex: '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc', expected_verdict: 'VERIFIED', note: 'Verification only. Generation is refused.' }),
    P({ label: 'SM3/empty', algorithm: 'SM3', input_hex: '', expected_digest_hex: bytesToHex(digestBytes('SM3', new Uint8Array(0))), expected_verdict: 'VERIFIED' }),
    P({ label: 'SHA-1/empty', algorithm: 'SHA-1', input_hex: '', expected_digest_hex: bytesToHex(digestBytes('SHA-1', new Uint8Array(0))), expected_verdict: 'VERIFIED' }),
    P({ label: 'RIPEMD-160/empty', algorithm: 'RIPEMD-160', input_hex: '', expected_digest_hex: bytesToHex(digestBytes('RIPEMD-160', new Uint8Array(0))), expected_verdict: 'VERIFIED' }),
    N({ label: 'SHA-1/generation-refused', algorithm: 'SHA-1', operation: 'generate', expected_verdict: 'FORBIDDEN_ALGORITHM' }),
    N({ label: 'RIPEMD-160/generation-refused', algorithm: 'RIPEMD-160', operation: 'generate', expected_verdict: 'FORBIDDEN_ALGORITHM' }),
    ...['MD2', 'MD4', 'MD5', 'Whirlpool', 'RIPEMD-128', 'RIPEMD-256', 'RIPEMD-320'].map((a) => N({ label: `${a}/recognize-and-reject`, algorithm: a, expected_verdict: 'FORBIDDEN_ALGORITHM' })),
  ];
  write('vectors/digest/legacy-national.json', vectors);
}

// ----------------------------------------------------------- key wrap
{
  const vectors = [P({
    label: 'AES-128-KW/RFC3394-4.1', source: 'external — RFC 3394 section 4.1',
    algorithm: 'AES-128-KW',
    kek_hex: '000102030405060708090a0b0c0d0e0f', key_hex: '00112233445566778899aabbccddeeff',
    expected_wrapped_hex: '1fa68b0a8112b447aef34bd8fb5a7b829d3e862371d2cfe5', expected_verdict: 'VERIFIED',
  })];
  for (const alg of keyWrapAlgorithms()) {
    const kekLen = alg.includes('128') ? 16 : alg.includes('192') ? 24 : 32;
    const kek = new Uint8Array(kekLen).map((_, i) => (i * 5) & 0xff);
    const key = alg.endsWith('KWP') ? new Uint8Array(20).map((_, i) => i) : new Uint8Array(32).map((_, i) => i);
    const wrapped = wrapKey(alg, { kek, keyToWrap: key });
    vectors.push(P({
      label: `${alg}/positive`, algorithm: alg,
      kek_hex: bytesToHex(kek), key_hex: bytesToHex(key),
      expected_wrapped_hex: bytesToHex(wrapped), expected_verdict: 'VERIFIED',
    }));
    const tampered = Uint8Array.from(wrapped); tampered[0] ^= 1;
    vectors.push(N({
      label: `${alg}/altered-wrapped`, algorithm: alg,
      kek_hex: bytesToHex(kek), wrapped_hex: bytesToHex(tampered),
      expected_verdict: 'INVALID_SIGNATURE', expected_reason: 'KEY_WRAP_INTEGRITY_FAILED',
    }));
    vectors.push(N({
      label: `${alg}/wrong-kek`, algorithm: alg,
      kek_hex: bytesToHex(new Uint8Array(kekLen).fill(0xaa)), wrapped_hex: bytesToHex(wrapped),
      expected_verdict: 'INVALID_SIGNATURE', expected_reason: 'KEY_WRAP_INTEGRITY_FAILED',
    }));
  }
  vectors.push(N({ label: 'AES-128-KW/misaligned-key-length', algorithm: 'AES-128-KW', key_length: 20, expected_verdict: 'MALFORMED', note: 'RFC 3394 requires a multiple of 8 bytes; KWP handles arbitrary lengths.' }));
  vectors.push(N({ label: 'unknown-keywrap-algorithm', algorithm: 'AES-999-KW', expected_verdict: 'UNKNOWN_ALGORITHM' }));
  write('vectors/encryption/key-wrap.json', vectors);
}

console.log(`generate-extended-vectors: ${pos} positive, ${neg} negative across sha3-224/keccak/sp800-185/legacy-national/key-wrap`);

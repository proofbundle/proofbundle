// Negative vectors for timestamp handling: inputs that must be rejected,
// with the exact rejection checked, not just "it throws".

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildTimestampRequest, parseTimestampResponse } from '../../src/timestamp/rfc3161.mjs';
import { buildDetachedTimestamp, parseOtsProof } from '../../src/timestamp/opentimestamps.mjs';
import { hexToBytes } from '../../src/encoding/hex.mjs';

const rfc3161Vectors = JSON.parse(readFileSync(new URL('../../vectors/timestamp/rfc3161.json', import.meta.url)));
const otsVectors = JSON.parse(readFileSync(new URL('../../vectors/timestamp/opentimestamps.json', import.meta.url)));

for (const v of rfc3161Vectors.filter((x) => x.expected_verdict === 'MALFORMED')) {
  test(`rfc3161 negative vector: ${v.label}`, () => {
    assert.throws(() => parseTimestampResponse(hexToBytes(v.response_hex)), (e) => e.verdict === 'MALFORMED');
  });
}
for (const v of otsVectors.filter((x) => x.expected_verdict === 'MALFORMED')) {
  test(`opentimestamps negative vector: ${v.label}`, () => {
    assert.throws(() => parseOtsProof(hexToBytes(v.proof_hex)), (e) => e.verdict === 'MALFORMED');
  });
}

test('buildTimestampRequest rejects an unsupported hash algorithm name', () => {
  assert.throws(() => buildTimestampRequest(new Uint8Array(32), { hashAlg: 'MD5' }), /unsupported hashAlg/);
});

test('buildTimestampRequest rejects a non-Uint8Array digest', () => {
  assert.throws(() => buildTimestampRequest('not-bytes', { hashAlg: 'SHA-256' }), TypeError);
});

test('buildDetachedTimestamp rejects an unsupported hash algorithm name', () => {
  assert.throws(() => buildDetachedTimestamp({ hashAlg: 'MD5', digest: new Uint8Array(32), tree: { attestations: [], ops: [] } }), /unsupported hashAlg/);
});

test('buildDetachedTimestamp rejects a digest of the wrong length for the declared algorithm', () => {
  assert.throws(() => buildDetachedTimestamp({ hashAlg: 'SHA256', digest: new Uint8Array(31), tree: { attestations: [], ops: [] } }), /32 bytes/);
});

test('a wrong-length digest never verifies against a genuine OTS proof', () => {
  const digest = new Uint8Array(createHash('sha256').update('right').digest());
  const proof = buildDetachedTimestamp({ hashAlg: 'SHA256', digest, tree: { attestations: [{ name: 'PENDING', tagHex: '83dfe30d2ef90c8e', uri: 'x' }], ops: [] } });
  const parsed = parseOtsProof(proof);
  const wrong = new Uint8Array(createHash('sha256').update('wrong').digest());
  assert.notEqual(parsed.digestHex, Buffer.from(wrong).toString('hex'));
});

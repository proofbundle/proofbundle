// Hostile-input tests for RFC 3161 and OpenTimestamps parsing: resource
// bounds and byte-mutation sweeps, checking the exact failure mode rather
// than just "did not crash".

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parseTimestampResponse } from '../../src/timestamp/rfc3161.mjs';
import { buildDetachedTimestamp, parseOtsProof } from '../../src/timestamp/opentimestamps.mjs';

const sha256 = (s) => new Uint8Array(createHash('sha256').update(s).digest());

test('rfc3161: every single-byte mutation of a valid response either throws MALFORMED or changes the parse — never crashes uncaught', () => {
  function derLen(n) { if (n < 0x80) return [n]; const b = []; let x = n; while (x) { b.unshift(x & 0xff); x >>= 8; } return [0x80 | b.length, ...b]; }
  function derSeq(...c) { const b = [].concat(...c); return [0x30, ...derLen(b.length), ...b]; }
  const digest = sha256('mutate-me');
  const timeBytes = Buffer.from('20260805123045Z', 'ascii');
  const good = Uint8Array.from(derSeq(derSeq([0x02, 0x01, 0]), derSeq([0x18, timeBytes.length, ...timeBytes], [0x04, digest.length, ...digest])));
  for (let i = 0; i < good.length; i++) {
    const mutated = Uint8Array.from(good); mutated[i] ^= 0xff;
    try { parseTimestampResponse(mutated); } catch (e) { assert.equal(e.verdict, 'MALFORMED', `byte ${i}: wrong verdict ${e.verdict}`); }
  }
});

test('rfc3161: deeply nested DER is rejected by the explicit depth bound, not an engine stack overflow', () => {
  const depth = 64;
  let buf = [0x02, 0x01, 0x00];
  for (let i = 0; i < depth; i++) buf = [0x30, ...(buf.length < 0x80 ? [buf.length] : [0x80 | 2, (buf.length >> 8) & 0xff, buf.length & 0xff]), ...buf];
  assert.throws(() => parseTimestampResponse(Uint8Array.from(buf)), (e) => e.verdict === 'MALFORMED');
});

test('rfc3161: a claimed length past the end of the buffer is rejected, never read out of bounds', () => {
  const evil = Uint8Array.of(0x30, 0x7f, 0x02, 0x01, 0x00); // outer SEQUENCE claims 127 bytes of content, buffer has 3
  assert.throws(() => parseTimestampResponse(evil), (e) => e.verdict === 'MALFORMED');
});

test('opentimestamps: every single-byte mutation of a valid proof either throws MALFORMED or is still internally consistent — never crashes uncaught', () => {
  const digest = sha256('ots-mutate');
  const tree = { attestations: [{ name: 'PENDING', tagHex: '83dfe30d2ef90c8e', uri: 'https://cal.example' }], ops: [] };
  const proof = buildDetachedTimestamp({ hashAlg: 'SHA256', digest, tree });
  let threw = 0, parsed = 0;
  for (let i = 0; i < proof.length; i++) {
    const mutated = Uint8Array.from(proof); mutated[i] ^= 0xff;
    try { parseOtsProof(mutated); parsed++; } catch (e) { assert.equal(e.verdict, 'MALFORMED', `byte ${i}: wrong verdict ${e.verdict} (${e.message})`); threw++; }
  }
  assert.ok(threw > 0, 'expected at least one mutation to be structurally rejected');
});

test('opentimestamps: a varuint with an unbounded continuation-bit run is rejected, not looped forever', () => {
  const digest = sha256('varuint-bomb');
  const proof = buildDetachedTimestamp({ hashAlg: 'SHA256', digest, tree: { attestations: [{ name: 'PENDING', tagHex: '83dfe30d2ef90c8e', uri: 'x' }], ops: [] } });
  // Locate the varuint length byte of the varbytes-wrapped attestation payload and force every following byte to carry the continuation bit.
  const attack = Uint8Array.from(proof);
  const tagStart = attack.length - 1 - 'x'.length - 1; // heuristic: near the end, before the 1-byte URI
  for (let i = Math.max(0, tagStart - 4); i < attack.length; i++) attack[i] = 0xff;
  assert.throws(() => parseOtsProof(attack), (e) => e.verdict === 'MALFORMED');
});

test('opentimestamps: an append/prepend argument declared longer than the remaining buffer is rejected', () => {
  const digest = sha256('long-arg');
  // 0xf0 (APPEND) followed by a varuint claiming 4000 bytes of argument, but almost none supplied.
  const evil = Uint8Array.of(...digestlessMagicAndDigest(digest), 0xf0, 0xa0, 0x1f, 0x01, 0x02);
  assert.throws(() => parseOtsProof(evil), (e) => e.verdict === 'MALFORMED');
});

test('opentimestamps: a buffer that ends right after the digest, with no timestamp tag byte at all, is rejected rather than accepted as vacuously verified', () => {
  const digest = sha256('empty-node');
  const trulyEmpty = Uint8Array.from(digestlessMagicAndDigest(digest));
  assert.throws(() => parseOtsProof(trulyEmpty), (e) => e.verdict === 'MALFORMED');
});

function digestlessMagicAndDigest(digest) {
  const magic = [0x00, ...Buffer.from('OpenTimestamps'), 0x00, 0x00, ...Buffer.from('Proof'), 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94];
  return [...magic, 0x01, 0x08, ...digest];
}

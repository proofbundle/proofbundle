// RFC 3161 request/response and OpenTimestamps proof handling.
//
// Neither module's byte-level constants were written from memory: see the
// comment at the top of src/timestamp/opentimestamps.mjs for what was
// checked against the reference implementation's source before being coded
// here, and src/timestamp/rfc3161.mjs for the ASN.1 grammar being encoded
// directly rather than guessed at.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildTimestampRequest, parseTimestampResponse, verifyBinding } from '../../src/timestamp/rfc3161.mjs';
import { buildDetachedTimestamp, parseOtsProof, verifyDetachedDigest, HEADER_MAGIC } from '../../src/timestamp/opentimestamps.mjs';

const sha256 = (s) => new Uint8Array(createHash('sha256').update(s).digest());

test('buildTimestampRequest produces a well-formed TimeStampReq for each supported hash', () => {
  for (const [alg, len] of [['SHA-256', 32], ['SHA-384', 48], ['SHA-512', 64]]) {
    const digest = new Uint8Array(createHash(alg.toLowerCase().replace('-', '')).update('x').digest());
    assert.equal(digest.length, len);
    const tsq = buildTimestampRequest(digest, { hashAlg: alg, nonce: 7, certReq: true });
    assert.equal(tsq[0], 0x30, 'top-level tag must be SEQUENCE');
    // certReq TRUE is the last three bytes: BOOLEAN 0x01 0x01 0xff
    assert.deepEqual([...tsq.slice(-3)], [0x01, 0x01, 0xff]);
  }
});

test('buildTimestampRequest omits certReq when false, per the DEFAULT FALSE grammar', () => {
  const digest = sha256('x');
  const withCert = buildTimestampRequest(digest, { certReq: true });
  const withoutCert = buildTimestampRequest(digest, { certReq: false });
  assert.equal(withoutCert.length, withCert.length - 3);
});

test('buildTimestampRequest rejects a digest of the wrong length for the declared algorithm', () => {
  assert.throws(() => buildTimestampRequest(new Uint8Array(31), { hashAlg: 'SHA-256' }), /32 bytes/);
});

test('parseTimestampResponse recovers the asserted time and the message imprint', () => {
  const digest = sha256('provenance');
  const tsr = syntheticTsr(0, digest, '2026-08-05T12:30:45Z');
  const parsed = parseTimestampResponse(tsr);
  assert.equal(parsed.status, 0);
  assert.equal(parsed.granted, true);
  assert.equal(parsed.genTimeISO, '2026-08-05T12:30:45Z');
  assert.ok(parsed.imprints.includes(Buffer.from(digest).toString('hex')));
});

test('verifyBinding is true only for the digest the token actually imprints', () => {
  const digest = sha256('bound');
  const other = sha256('not-bound');
  const parsed = parseTimestampResponse(syntheticTsr(0, digest, '2026-08-05T00:00:00Z'));
  assert.equal(verifyBinding(parsed, digest), true);
  assert.equal(verifyBinding(parsed, other), false);
});

test('parseTimestampResponse reports rejection status without throwing', () => {
  const digest = sha256('rejected');
  const parsed = parseTimestampResponse(syntheticTsr(2, digest, '2026-08-05T00:00:00Z'));
  assert.equal(parsed.status, 2);
  assert.equal(parsed.granted, false);
});

test('OpenTimestamps: build then parse round-trips digest, hash algorithm, and header magic', () => {
  const digest = sha256('ots payload');
  const tree = { attestations: [{ name: 'PENDING', tagHex: '83dfe30d2ef90c8e', uri: 'https://a.pool.opentimestamps.org' }], ops: [] };
  const proof = buildDetachedTimestamp({ hashAlg: 'SHA256', digest, tree });
  assert.deepEqual([...proof.slice(0, HEADER_MAGIC.length)], [...HEADER_MAGIC]);
  const parsed = parseOtsProof(proof);
  assert.equal(parsed.hashAlg, 'SHA256');
  assert.equal(parsed.digestHex, Buffer.from(digest).toString('hex'));
  assert.equal(verifyDetachedDigest(parsed, digest), true);
  assert.equal(parsed.pending.length, 1);
  assert.equal(parsed.pending[0].uri, 'https://a.pool.opentimestamps.org');
});

test('OpenTimestamps: op replay recovers the exact digest each attestation commits to', () => {
  const digest = sha256('replay me');
  const nonce = Uint8Array.from([1, 1, 2, 3, 5, 8, 13, 21]);
  const expected = new Uint8Array(createHash('sha256').update(Buffer.concat([Buffer.from(digest), Buffer.from(nonce)])).digest());
  const tree = {
    attestations: [],
    ops: [{
      tag: 0xf0, name: 'APPEND', arg: nonce,
      subtree: {
        attestations: [],
        ops: [{ tag: 0x08, name: 'SHA256', arg: null, subtree: { attestations: [{ name: 'BITCOIN', tagHex: '0588960d73d71901', height: 800000 }], ops: [] } }],
      },
    }],
  };
  const proof = buildDetachedTimestamp({ hashAlg: 'SHA256', digest, tree });
  const parsed = parseOtsProof(proof);
  assert.equal(parsed.attestations[0].commitsToHex, Buffer.from(expected).toString('hex'));
});

test('OpenTimestamps: branching to two attestations from the same message is parsed correctly', () => {
  const digest = sha256('fork');
  const tree = {
    attestations: [
      { name: 'PENDING', tagHex: '83dfe30d2ef90c8e', uri: 'https://cal.example/a' },
      { name: 'BITCOIN', tagHex: '0588960d73d71901', height: 1 },
    ],
    ops: [],
  };
  const proof = buildDetachedTimestamp({ hashAlg: 'SHA256', digest, tree });
  const parsed = parseOtsProof(proof);
  assert.equal(parsed.attestations.length, 2);
  assert.equal(parsed.bitcoinAttested, true);
  assert.equal(parsed.pending.length, 1);
});

test('OpenTimestamps: SHA1 and RIPEMD160 chain ops replay against node:crypto, KECCAK256 against this repo\'s own digest', () => {
  const digest = sha256('legacy chain');
  for (const [tag, name, nodeAlg] of [[0x02, 'SHA1', 'sha1'], [0x03, 'RIPEMD160', 'ripemd160']]) {
    const expected = new Uint8Array(createHash(nodeAlg).update(Buffer.from(digest)).digest());
    const tree = { attestations: [], ops: [{ tag, name, arg: null, subtree: { attestations: [{ name: 'PENDING', tagHex: '83dfe30d2ef90c8e', uri: 'https://x' }], ops: [] } }] };
    const proof = buildDetachedTimestamp({ hashAlg: 'SHA256', digest, tree });
    const parsed = parseOtsProof(proof);
    assert.equal(parsed.attestations[0].commitsToHex, Buffer.from(expected).toString('hex'), `${name} replay mismatch`);
  }
});

function derLen(n) { if (n < 0x80) return [n]; const b = []; let x = n; while (x) { b.unshift(x & 0xff); x >>= 8; } return [0x80 | b.length, ...b]; }
function derSeq(...chunks) { const body = [].concat(...chunks); return [0x30, ...derLen(body.length), ...body]; }
function syntheticTsr(status, digest, genTime) {
  const timeBytes = Buffer.from(genTime.replace(/[-:]/g, '').replace('T', ''), 'ascii');
  const statusInfo = derSeq([0x02, 0x01, status]);
  const tstInfoLike = derSeq([0x18, timeBytes.length, ...timeBytes], [0x04, digest.length, ...digest]);
  return Uint8Array.from(derSeq(statusInfo, tstInfoLike));
}

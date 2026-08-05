import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { digestBytes, digestBytesXOF, isImplementedDigest, isRejectedAlgorithm, UnknownAlgorithmError, ForbiddenAlgorithmError } from '../../src/digest/digest.mjs';
import { bytesToHex } from '../../src/encoding/hex.mjs';

const enc = new TextEncoder();

// FIPS 180-4 / FIPS 202 known-answer values for the empty string, generated
// programmatically into this file rather than hand-typed — a hand-typed
// 64-character hex literal produced a silent one-character transcription
// error twice in a row while this file was being written.
const KAT_EMPTY = {
  'SHA-224': 'd14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f',
  'SHA-256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'SHA3-256': 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
};

test('SHA-256 empty-string known-answer value matches FIPS 180-4', () => {
  assert.equal(bytesToHex(digestBytes('SHA-256', enc.encode(''))), KAT_EMPTY['SHA-256']);
});

test('SHA-224 empty-string known-answer value matches FIPS 180-4', () => {
  assert.equal(bytesToHex(digestBytes('SHA-224', enc.encode(''))), KAT_EMPTY['SHA-224']);
});

test('SHA3-256 empty-string known-answer value matches FIPS 202', () => {
  assert.equal(bytesToHex(digestBytes('SHA3-256', enc.encode(''))), KAT_EMPTY['SHA3-256']);
});

test('every wired SHA-2 variant agrees with node:crypto across message lengths', () => {
  const nodeNames = { 'SHA-224': 'sha224', 'SHA-256': 'sha256', 'SHA-384': 'sha384', 'SHA-512': 'sha512', 'SHA-512/224': 'sha512-224', 'SHA-512/256': 'sha512-256' };
  for (const [id, nodeName] of Object.entries(nodeNames)) {
    for (const len of [0, 1, 55, 56, 64, 1000]) {
      const msg = new Uint8Array(len).map((_, i) => i % 256);
      const ours = bytesToHex(digestBytes(id, msg));
      const theirs = createHash(nodeName).update(Buffer.from(msg)).digest('hex');
      assert.equal(ours, theirs, `${id} mismatch at length ${len}`);
    }
  }
});

test('SHA3-256/384/512 agree with node:crypto (independent SHA-3 implementation vs Node OpenSSL)', () => {
  for (const [id, nodeName] of [['SHA3-256', 'sha3-256'], ['SHA3-384', 'sha3-384'], ['SHA3-512', 'sha3-512']]) {
    for (const len of [0, 1, 135, 136, 137, 1000]) {
      const msg = new Uint8Array(len).map((_, i) => (i * 7) % 256);
      assert.equal(bytesToHex(digestBytes(id, msg)), createHash(nodeName).update(Buffer.from(msg)).digest('hex'), `${id} mismatch at length ${len}`);
    }
  }
});

test('SHAKE128/256 produce the requested output length and agree with node:crypto', () => {
  for (const [id, nodeName] of [['SHAKE128', 'shake128'], ['SHAKE256', 'shake256']]) {
    for (const outLen of [1, 32, 64, 200]) {
      const msg = enc.encode('shake test vector');
      const ours = digestBytesXOF(id, msg, outLen);
      assert.equal(ours.length, outLen);
      const theirs = createHash(nodeName, { outputLength: outLen }).update(Buffer.from(msg)).digest('hex');
      assert.equal(bytesToHex(ours), theirs);
    }
  }
});

test('digestBytes throws UnknownAlgorithmError for an unrecognized identifier — no fallback', () => {
  assert.throws(() => digestBytes('NOT-A-REAL-ALGORITHM', enc.encode('x')), UnknownAlgorithmError);
});

test('digestBytes refuses the recognize-and-reject digests, and never dispatches them', () => {
  // SHA-1 is deliberately NOT in this list. It moved to LEGACY_VERIFY_ONLY
  // when the legacy digest path landed: digestBytes() computes it so old
  // artifacts stay checkable, and digestForGeneration() refuses it. The
  // separate assertion below pins that split.
  for (const algId of ['MD5', 'MD4', 'MD2', 'Whirlpool', 'RIPEMD-128', 'RIPEMD-256', 'RIPEMD-320']) {
    assert.throws(() => digestBytes(algId, new Uint8Array(1)), (e) => e.name === 'ForbiddenAlgorithmError' || e.verdict === 'FORBIDDEN_ALGORITHM', `${algId} was not refused`);
  }
});

test('SHA-1 and RIPEMD-160 verify historical material but refuse generation', async () => {
  const { digestForGeneration } = await import('../../src/digest/legacy-and-national.mjs');
  const enc = new TextEncoder();
  // Verification path works and matches the published digest.
  assert.equal(bytesToHex(digestBytes('SHA-1', enc.encode('abc'))), 'a9993e364706816aba3e25717850c26c9cd0d89d');
  assert.equal(bytesToHex(digestBytes('RIPEMD-160', enc.encode('abc'))), '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc');
  // Generation path refuses both.
  for (const algId of ['SHA-1', 'RIPEMD-160']) {
    assert.throws(() => digestForGeneration(algId, new Uint8Array(1)), (e) => e.verdict === 'FORBIDDEN_ALGORITHM');
  }
});


test('isImplementedDigest correctly reports only the wired fixed-length algorithms', () => {
  assert.equal(isImplementedDigest('SHA-256'), true);
  assert.equal(isImplementedDigest('SHAKE128'), false); // XOF, different dispatch function
  assert.equal(isImplementedDigest('BLAKE3'), false); // registered but not implemented in this pass
});

test('digestBytes rejects non-Uint8Array input rather than coercing it', () => {
  assert.throws(() => digestBytes('SHA-256', 'not bytes'));
});

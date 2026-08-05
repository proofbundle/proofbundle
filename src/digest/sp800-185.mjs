// NIST SP 800-185: cSHAKE, KMAC, TupleHash, ParallelHash.
//
// These were previously unimplementable here because crypto/keccak.mjs did not
// export the raw sponge. It now does, so all four constructions are built on
// the same permutation rather than a second copy of Keccak.
//
// The encoding helpers below are the reason these constructions are safe for
// domain separation at all: left_encode/right_encode/bytepad make the
// (function-name, customization, key, data) tuple unambiguous, so KMAC with
// key K over data X cannot collide with KMAC over a different split of the
// same bytes. Verified against the published SP 800-185 sample vectors.

import { sponge } from '../../crypto/keccak.mjs';
import { concatBytes } from '../bytes/bytes.mjs';
import { utf8Encode } from '../bytes/utf8.mjs';
import { UnknownAlgorithmError } from '../errors.mjs';

// left_encode(x): [n, x big-endian in n bytes]
export function leftEncode(x) {
  if (!Number.isSafeInteger(x) || x < 0) throw new RangeError('leftEncode: expected a non-negative safe integer');
  const bytes = [];
  let v = x;
  do { bytes.unshift(v & 0xff); v = Math.floor(v / 256); } while (v > 0);
  return Uint8Array.from([bytes.length, ...bytes]);
}

// right_encode(x): [x big-endian in n bytes, n]
export function rightEncode(x) {
  if (!Number.isSafeInteger(x) || x < 0) throw new RangeError('rightEncode: expected a non-negative safe integer');
  const bytes = [];
  let v = x;
  do { bytes.unshift(v & 0xff); v = Math.floor(v / 256); } while (v > 0);
  return Uint8Array.from([...bytes, bytes.length]);
}

// encode_string(S): left_encode(bit length) || S
export function encodeString(s) {
  const b = s instanceof Uint8Array ? s : utf8Encode(String(s));
  return concatBytes(leftEncode(b.length * 8), b);
}

// bytepad(X, w): left_encode(w) || X, zero-padded to a multiple of w
export function bytepad(x, w) {
  const prefixed = concatBytes(leftEncode(w), x);
  const remainder = prefixed.length % w;
  if (remainder === 0) return prefixed;
  return concatBytes(prefixed, new Uint8Array(w - remainder));
}

const PARAMS = {
  128: { rate: 168, chainBytes: 32 },
  256: { rate: 136, chainBytes: 64 },
};

// cSHAKE. With empty N and S this is *defined* to be plain SHAKE — not merely
// similar to it — so the branch below is the specification, not a shortcut.
function cshake(variant, x, outputBytes, n, s) {
  const { rate } = PARAMS[variant];
  const nBytes = n instanceof Uint8Array ? n : utf8Encode(n ?? '');
  const sBytes = s instanceof Uint8Array ? s : utf8Encode(s ?? '');
  if (nBytes.length === 0 && sBytes.length === 0) {
    return sponge(rate, 0x1f, x, outputBytes); // SHAKE domain suffix
  }
  const prefix = bytepad(concatBytes(encodeString(nBytes), encodeString(sBytes)), rate);
  return sponge(rate, 0x04, concatBytes(prefix, x), outputBytes); // cSHAKE domain suffix
}

export function cshake128(x, outputBytes, { functionName = '', customization = '' } = {}) {
  return cshake(128, x, outputBytes, functionName, customization);
}
export function cshake256(x, outputBytes, { functionName = '', customization = '' } = {}) {
  return cshake(256, x, outputBytes, functionName, customization);
}

// KMAC. The output length is bound into the input via right_encode(L), so a
// KMAC tag truncated to a shorter length is not the KMAC of that shorter
// length — truncation does not yield a valid shorter tag.
function kmac(variant, key, message, outputBytes, customization) {
  const { rate } = PARAMS[variant];
  if (!(key instanceof Uint8Array)) throw new TypeError('kmac: key must be Uint8Array');
  if (!(message instanceof Uint8Array)) throw new TypeError('kmac: message must be Uint8Array');
  const newX = concatBytes(
    bytepad(encodeString(key), rate),
    message,
    rightEncode(outputBytes * 8),
  );
  return cshake(variant, newX, outputBytes, 'KMAC', customization ?? '');
}

export function kmac128(key, message, outputBytes = 32, customization = '') {
  return kmac(128, key, message, outputBytes, customization);
}
export function kmac256(key, message, outputBytes = 64, customization = '') {
  return kmac(256, key, message, outputBytes, customization);
}

// TupleHash: hashes a *sequence of strings* unambiguously. ["ab","c"] and
// ["a","bc"] produce different digests, which plain concatenation could not.
function tupleHash(variant, tuple, outputBytes, customization) {
  if (!Array.isArray(tuple)) throw new TypeError('tupleHash: expected an array of Uint8Array');
  const parts = tuple.map((t, i) => {
    if (!(t instanceof Uint8Array)) throw new TypeError(`tupleHash: element ${i} must be Uint8Array`);
    return encodeString(t);
  });
  const z = concatBytes(...parts, rightEncode(outputBytes * 8));
  return cshake(variant, z, outputBytes, 'TupleHash', customization ?? '');
}

export function tupleHash128(tuple, outputBytes = 32, customization = '') {
  return tupleHash(128, tuple, outputBytes, customization);
}
export function tupleHash256(tuple, outputBytes = 64, customization = '') {
  return tupleHash(256, tuple, outputBytes, customization);
}

// ParallelHash: block-parallel hashing. Implemented sequentially here — the
// output is identical either way; parallelism is a performance property, not a
// semantic one, and claiming parallel execution we do not perform would be a
// false statement about the implementation.
function parallelHash(variant, x, blockSize, outputBytes, customization) {
  const { rate, chainBytes } = PARAMS[variant];
  if (!(x instanceof Uint8Array)) throw new TypeError('parallelHash: input must be Uint8Array');
  if (!Number.isInteger(blockSize) || blockSize < 1) throw new RangeError('parallelHash: blockSize must be a positive integer');
  const n = Math.ceil(x.length / blockSize);
  const parts = [leftEncode(blockSize)];
  for (let i = 0; i < n; i++) {
    const block = x.subarray(i * blockSize, Math.min((i + 1) * blockSize, x.length));
    parts.push(sponge(rate, 0x1f, block, chainBytes)); // cSHAKE with empty N/S == SHAKE
  }
  parts.push(rightEncode(n), rightEncode(outputBytes * 8));
  return cshake(variant, concatBytes(...parts), outputBytes, 'ParallelHash', customization ?? '');
}

export function parallelHash128(x, blockSize, outputBytes = 32, customization = '') {
  return parallelHash(128, x, blockSize, outputBytes, customization);
}
export function parallelHash256(x, blockSize, outputBytes = 64, customization = '') {
  return parallelHash(256, x, blockSize, outputBytes, customization);
}

const XOF_TABLE = new Map([
  ['cSHAKE128', (x, len, o) => cshake128(x, len, o)],
  ['cSHAKE256', (x, len, o) => cshake256(x, len, o)],
]);

export const SP800_185_IDS = Object.freeze([
  'cSHAKE128', 'cSHAKE256', 'KMAC128', 'KMAC256',
  'TupleHash128', 'TupleHash256', 'ParallelHash128', 'ParallelHash256',
]);

export function isImplementedSp800185(algId) { return SP800_185_IDS.includes(algId); }

export function cshakeByAlgId(algId, x, outputBytes, opts = {}) {
  const fn = XOF_TABLE.get(algId);
  if (!fn) throw new UnknownAlgorithmError(algId, 'digest.algorithmKnown');
  return fn(x, outputBytes, opts);
}

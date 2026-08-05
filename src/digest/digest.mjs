// Central digest dispatcher. Every caller goes through `digestBytes(algId,
// bytes)` rather than importing sha2.mjs/sha3.mjs directly, so algorithm
// selection is always by the authenticated registry identifier — never by
// which module happened to get imported. This is what "no algorithm
// fallback" means at the code-structure level: there is exactly one place
// a string maps to an implementation, and an unrecognized string throws
// rather than falling through to a default.

import { sha224, sha256, sha384, sha512, sha512_224, sha512_256 } from './sha2.mjs';
import { sha3_224, sha3_256, sha3_384, sha3_512, keccak_224, keccak_256, keccak_384, keccak_512 } from './sha3.mjs';
import { shake128, shake256 } from './shake.mjs';
import { blake2b512, blake2s256 } from './blake2.mjs';
import { digestForVerification, isLegacyVerifyOnlyDigest, isCurrentNationalDigest, RECOGNIZE_AND_REJECT } from './legacy-and-national.mjs';

// Algorithm IDs recognized so a deterministic rejection can be issued, per
// the RECOGNIZE_AND_REJECT implementation class. Never dispatched to any
// implementation.
// SHA-1 is NOT here: it is LEGACY_VERIFY_ONLY, computable for historical
// verification through legacy-and-national.mjs and refused for generation.
// Everything below is recognized purely so a deterministic rejection issues.
const REJECTED = new Set([...RECOGNIZE_AND_REJECT]);

const TABLE = new Map([
  ['SHA-224', (b) => sha224(b)],
  ['SHA-256', (b) => sha256(b)],
  ['SHA-384', (b) => sha384(b)],
  ['SHA-512', (b) => sha512(b)],
  ['SHA-512/224', (b) => sha512_224(b)],
  ['SHA-512/256', (b) => sha512_256(b)],
  ['SHA3-224', (b) => sha3_224(b)],
  ['SHA3-256', (b) => sha3_256(b)],
  ['SHA3-384', (b) => sha3_384(b)],
  ['SHA3-512', (b) => sha3_512(b)],
  ['Keccak-224', (b) => keccak_224(b)],
  ['Keccak-256', (b) => keccak_256(b)],
  ['Keccak-384', (b) => keccak_384(b)],
  ['Keccak-512', (b) => keccak_512(b)],
  ['SM3', (b) => digestForVerification('SM3', b)],
  // Verify-only: computable so historical artifacts can be checked. Callers
  // that mint new material go through digestForGeneration(), which refuses it.
  ['SHA-1', (b) => digestForVerification('SHA-1', b)],
  ['RIPEMD-160', (b) => digestForVerification('RIPEMD-160', b)],
  ['BLAKE2b-512', (b) => blake2b512(b)],
  ['BLAKE2s-256', (b) => blake2s256(b)],
]);

export class UnknownAlgorithmError extends RangeError {
  constructor(algId) { super(`digestBytes: unknown or unimplemented digest algorithm ${JSON.stringify(algId)}`); this.name = 'UnknownAlgorithmError'; this.algId = algId; }
}
export class ForbiddenAlgorithmError extends RangeError {
  constructor(algId) { super(`digestBytes: ${JSON.stringify(algId)} is RECOGNIZE_AND_REJECT — no digest is ever produced`); this.name = 'ForbiddenAlgorithmError'; this.algId = algId; }
}

export function digestBytes(algId, bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('digestBytes: expected Uint8Array input');
  if (REJECTED.has(algId)) throw new ForbiddenAlgorithmError(algId);
  const fn = TABLE.get(algId);
  if (!fn) throw new UnknownAlgorithmError(algId);
  return fn(bytes);
}

// SHAKE takes an explicit output length, so it is not in the fixed-arity
// table above.
export function digestBytesXOF(algId, bytes, outputLength) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('digestBytesXOF: expected Uint8Array input');
  if (algId === 'SHAKE128') return shake128(bytes, outputLength);
  if (algId === 'SHAKE256') return shake256(bytes, outputLength);
  if (REJECTED.has(algId)) throw new ForbiddenAlgorithmError(algId);
  throw new UnknownAlgorithmError(algId);
}

export function isImplementedDigest(algId) {
  return TABLE.has(algId);
}

export function isRejectedAlgorithm(algId) {
  return REJECTED.has(algId);
}

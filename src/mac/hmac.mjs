// HMAC over the digests this build actually has. Dispatch is by the
// authenticated registry identifier only: the table is the single place a
// string becomes an implementation, and an unrecognized id throws instead of
// falling back to a default MAC.
//
// Verification uses a constant-time comparison. That protects the tag
// comparison itself; it is not a claim about the timing behaviour of the
// underlying OpenSSL HMAC, which is external (ASSUMPTION-NODE-CRYPTO-CORRECTNESS).

import { createHmac, timingSafeEqual } from 'node:crypto';
import { UnknownAlgorithmError, GenerationProhibitedError } from '../errors.mjs';

// registry id -> node:crypto digest name
const TABLE = new Map([
  ['HMAC-SHA-224', 'sha224'],
  ['HMAC-SHA-256', 'sha256'],
  ['HMAC-SHA-384', 'sha384'],
  ['HMAC-SHA-512', 'sha512'],
  ['HMAC-SHA-512/224', 'sha512-224'],
  ['HMAC-SHA-512/256', 'sha512-256'],
  ['HMAC-SHA3-224', 'sha3-224'],
  ['HMAC-SHA3-256', 'sha3-256'],
  ['HMAC-SHA3-384', 'sha3-384'],
  ['HMAC-SHA3-512', 'sha3-512'],
  ['HMAC-SM3', 'sm3'],
  // Verify-only: computable for historical material, refused for generation
  // by macGenerate() below.
  ['HMAC-SHA-1', 'sha1'],
  ['HMAC-RIPEMD-160', 'ripemd160'],
]);

// Accepted for checking old artifacts, never for producing new ones.
const VERIFY_ONLY = new Set(['HMAC-SHA-1', 'HMAC-RIPEMD-160']);

export const HMAC_TAG_LENGTHS = Object.freeze({
  'HMAC-SHA-224': 28, 'HMAC-SHA-256': 32, 'HMAC-SHA-384': 48, 'HMAC-SHA-512': 64,
  'HMAC-SHA-512/224': 28, 'HMAC-SHA-512/256': 32,
  'HMAC-SHA3-224': 28, 'HMAC-SHA3-256': 32, 'HMAC-SHA3-384': 48, 'HMAC-SHA3-512': 64,
  'HMAC-SM3': 32, 'HMAC-SHA-1': 20, 'HMAC-RIPEMD-160': 20,
});

export function isVerifyOnlyMac(algId) { return VERIFY_ONLY.has(algId); }

// Generation path. Refuses the verify-only algorithms, so historical material
// stays checkable while nothing new can be minted under a broken digest.
export function macGenerate(algId, key, message) {
  if (VERIFY_ONLY.has(algId)) throw new GenerationProhibitedError(algId);
  return macBytes(algId, key, message);
}

export function isImplementedMac(algId) { return TABLE.has(algId); }

export function macBytes(algId, key, message) {
  if (!(key instanceof Uint8Array)) throw new TypeError('macBytes: key must be Uint8Array');
  if (!(message instanceof Uint8Array)) throw new TypeError('macBytes: message must be Uint8Array');
  const digest = TABLE.get(algId);
  if (!digest) throw new UnknownAlgorithmError(algId, 'mac.algorithmKnown');
  const h = createHmac(digest, key);
  h.update(message);
  return new Uint8Array(h.digest());
}

// Returns a boolean, not a Result: this is the primitive layer. The verifier
// layer is what turns `false` into the INVALID_SIGNATURE terminal verdict.
export function macVerify(algId, key, message, tag) {
  if (!(tag instanceof Uint8Array)) throw new TypeError('macVerify: tag must be Uint8Array');
  const expected = macBytes(algId, key, message);
  if (expected.length !== tag.length) return false; // length mismatch is not a timing leak worth hiding: the tag length is public
  return timingSafeEqual(expected, tag);
}

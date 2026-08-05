// PBKDF2-HMAC-SHA-256/512 via node:crypto. Iteration count is a required
// argument with no default: a default here would be a silent security
// parameter, and the one thing worse than a low iteration count is one
// nobody chose.

import { pbkdf2Sync } from 'node:crypto';
import { UnknownAlgorithmError, GenerationProhibitedError } from '../errors.mjs';

const TABLE = new Map([
  ['PBKDF2-HMAC-SHA-224', 'sha224'],
  ['PBKDF2-HMAC-SHA-256', 'sha256'],
  ['PBKDF2-HMAC-SHA-384', 'sha384'],
  ['PBKDF2-HMAC-SHA-512', 'sha512'],
  // Verify-only: PBKDF2-HMAC-SHA-1 remains extremely common in existing
  // password databases, so it must stay computable for verification.
  // pbkdf2Generate() refuses it.
  ['PBKDF2-HMAC-SHA-1', 'sha1'],
]);

const VERIFY_ONLY = new Set(['PBKDF2-HMAC-SHA-1']);
export function isVerifyOnlyPbkdf2(algId) { return VERIFY_ONLY.has(algId); }

export const MINIMUM_ITERATIONS = 1000; // floor for *generation*; verification of historical material may use any recorded count

export function isImplementedPbkdf2(algId) { return TABLE.has(algId); }

export function pbkdf2(algId, { password, salt, iterations, length }) {
  const digest = TABLE.get(algId);
  if (!digest) throw new UnknownAlgorithmError(algId, 'kdf.algorithmKnown');
  if (!(password instanceof Uint8Array)) throw new TypeError('pbkdf2: password must be Uint8Array');
  if (!(salt instanceof Uint8Array)) throw new TypeError('pbkdf2: salt must be Uint8Array');
  if (!Number.isInteger(iterations) || iterations < 1) throw new RangeError('pbkdf2: iterations must be a positive integer');
  if (!Number.isInteger(length) || length < 1) throw new RangeError('pbkdf2: length must be a positive integer');
  return new Uint8Array(pbkdf2Sync(password, salt, iterations, length, digest));
}

// Separate entry point for producing new material, so the generation floor
// cannot be bypassed by a caller that only meant to verify something old.
export function pbkdf2Generate(algId, opts) {
  if (VERIFY_ONLY.has(algId)) throw new GenerationProhibitedError(algId);
  if (opts.iterations < MINIMUM_ITERATIONS) {
    throw new RangeError(`pbkdf2Generate: iterations ${opts.iterations} below generation minimum ${MINIMUM_ITERATIONS}`);
  }
  return pbkdf2(algId, opts);
}

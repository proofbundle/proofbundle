// Digests outside the SHA-2/SHA-3/BLAKE2 core: the legacy verify-only ones,
// the national-standard ones, and the recognize-and-reject list.
//
// The split matters for policy. RIPEMD-160 and SHA-1 still appear in real
// historical artifacts, so they must be *computable* to check old material
// while being refused for anything new. MD5 and friends are refused outright:
// recognized so the rejection is deterministic, never dispatched.

import { createHash, getHashes } from 'node:crypto';
import { UnknownAlgorithmError, ForbiddenAlgorithmError, GenerationProhibitedError, ProviderUnavailableError } from '../errors.mjs';

const AVAILABLE = new Set(getHashes());

// Computable, but only for verifying historical material.
const LEGACY_VERIFY_ONLY = new Map([
  ['SHA-1', { hash: 'sha1', len: 20 }],
  ['RIPEMD-160', { hash: 'ripemd160', len: 20 }],
]);

// National standards, current, permitted for generation.
const CURRENT = new Map([
  ['SM3', { hash: 'sm3', len: 32 }],
]);

// Recognized so a deterministic rejection can be issued. Never computed, even
// for historical material — these are broken badly enough that offering a
// verify-only path would itself be a liability.
export const RECOGNIZE_AND_REJECT = new Set([
  'MD2', 'MD4', 'MD5', 'Whirlpool',
  'RIPEMD-128', 'RIPEMD-256', 'RIPEMD-320',
]);

export function isLegacyVerifyOnlyDigest(algId) { return LEGACY_VERIFY_ONLY.has(algId); }
export function isCurrentNationalDigest(algId) { return CURRENT.has(algId); }
export function isRecognizeAndReject(algId) { return RECOGNIZE_AND_REJECT.has(algId); }

function entryFor(algId) {
  const e = LEGACY_VERIFY_ONLY.get(algId) ?? CURRENT.get(algId);
  if (!e) {
    if (RECOGNIZE_AND_REJECT.has(algId)) throw new ForbiddenAlgorithmError(algId);
    throw new UnknownAlgorithmError(algId, 'digest.algorithmKnown');
  }
  if (!AVAILABLE.has(e.hash)) {
    throw new ProviderUnavailableError('node:crypto', `this OpenSSL build does not expose ${e.hash}`, { algorithmId: algId });
  }
  return e;
}

// Verification path: computes the digest. Available for legacy and current.
export function digestForVerification(algId, bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('digestForVerification: expected Uint8Array');
  const e = entryFor(algId);
  const h = createHash(e.hash);
  h.update(bytes);
  return new Uint8Array(h.digest());
}

// Generation path: refuses the legacy algorithms. A separate entry point, so a
// caller that only meant to check old material cannot accidentally mint new
// material under a deprecated digest.
export function digestForGeneration(algId, bytes) {
  if (LEGACY_VERIFY_ONLY.has(algId)) throw new GenerationProhibitedError(algId);
  return digestForVerification(algId, bytes);
}

export const DIGEST_LENGTHS = Object.freeze({
  'SHA-1': 20, 'RIPEMD-160': 20, 'SM3': 32,
});

// BLAKE2b-512 and BLAKE2s-256 via node:crypto (OpenSSL), plus the keyed
// mode used by the MAC surface. Availability is probed once at module load:
// these are OpenSSL-provided and an OpenSSL build without them must produce
// a deterministic PROVIDER_UNAVAILABLE, not a crash halfway through a hash.

import { createHash, getHashes } from 'node:crypto';
import { ProviderUnavailableError, UnknownAlgorithmError } from '../errors.mjs';

const AVAILABLE = new Set(getHashes());

const TABLE = new Map([
  ['BLAKE2b-512', { hash: 'blake2b512', len: 64, maxKey: 64 }],
  ['BLAKE2s-256', { hash: 'blake2s256', len: 32, maxKey: 32 }],
]);

export function isImplementedBlake2(algId) {
  const e = TABLE.get(algId);
  return Boolean(e) && AVAILABLE.has(e.hash);
}

function entry(algId) {
  const e = TABLE.get(algId);
  if (!e) throw new UnknownAlgorithmError(algId, 'digest.algorithmKnown');
  if (!AVAILABLE.has(e.hash)) {
    throw new ProviderUnavailableError('node:crypto', `this OpenSSL build does not expose ${e.hash}`, { algorithmId: algId });
  }
  return e;
}

export function blake2(algId, bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('blake2: expected Uint8Array input');
  const e = entry(algId);
  const h = createHash(e.hash);
  h.update(bytes);
  return new Uint8Array(h.digest());
}

export function blake2b512(bytes) { return blake2('BLAKE2b-512', bytes); }
export function blake2s256(bytes) { return blake2('BLAKE2s-256', bytes); }

// Keyed BLAKE2 as a MAC. node:crypto exposes the key through createHash
// options on OpenSSL 3; where it does not, this raises PROVIDER_UNAVAILABLE
// rather than silently degrading to an unkeyed hash — which would be a
// catastrophic silent failure, so it is tested explicitly.
export function blake2Keyed(algId, key, message) {
  const e = entry(algId);
  if (!(key instanceof Uint8Array)) throw new TypeError('blake2Keyed: key must be Uint8Array');
  if (key.length === 0 || key.length > e.maxKey) {
    throw new RangeError(`blake2Keyed: key length ${key.length} outside 1..${e.maxKey} for ${algId}`);
  }
  let h;
  try {
    h = createHash(e.hash, { key });
  } catch (err) {
    throw new ProviderUnavailableError('node:crypto', `keyed ${e.hash} is not supported by this build: ${err.message}`, { algorithmId: algId });
  }
  // Guard against a build that accepts the option and ignores it: if the
  // keyed output equals the unkeyed output, the key was dropped.
  h.update(message);
  const out = new Uint8Array(h.digest());
  const unkeyed = blake2(algId, message);
  if (out.length === unkeyed.length && out.every((b, i) => b === unkeyed[i])) {
    throw new ProviderUnavailableError('node:crypto', `keyed ${e.hash} ignored the key (output identical to unkeyed)`, { algorithmId: algId });
  }
  return out;
}

export const BLAKE2_LENGTHS = Object.freeze({ 'BLAKE2b-512': 64, 'BLAKE2s-256': 32 });

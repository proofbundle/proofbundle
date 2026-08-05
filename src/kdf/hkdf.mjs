// HKDF (RFC 5869) as extract-then-expand, implemented on top of HMAC rather
// than node's one-shot hkdfSync, because ProofBundle needs the intermediate
// PRK for the hybrid-KEM combiner (see src/kem/secret-combiner.mjs) and
// needs `info` to be a domain-separated transcript, not a bare string.

import { createHmac } from 'node:crypto';
import { concatBytes } from '../bytes/bytes.mjs';
import { UnknownAlgorithmError } from '../errors.mjs';

const TABLE = new Map([
  ['HKDF-SHA-256', { digest: 'sha256', len: 32 }],
  ['HKDF-SHA-384', { digest: 'sha384', len: 48 }],
  ['HKDF-SHA-512', { digest: 'sha512', len: 64 }],
]);

export function isImplementedKdf(algId) { return TABLE.has(algId); }

function params(algId) {
  const p = TABLE.get(algId);
  if (!p) throw new UnknownAlgorithmError(algId, 'kdf.algorithmKnown');
  return p;
}

export function hkdfExtract(algId, salt, ikm) {
  const { digest, len } = params(algId);
  if (!(ikm instanceof Uint8Array)) throw new TypeError('hkdfExtract: ikm must be Uint8Array');
  const saltBytes = salt instanceof Uint8Array ? salt : new Uint8Array(len); // RFC 5869: absent salt is HashLen zero bytes
  const h = createHmac(digest, saltBytes);
  h.update(ikm);
  return new Uint8Array(h.digest());
}

export function hkdfExpand(algId, prk, info, length) {
  const { digest, len } = params(algId);
  if (!(prk instanceof Uint8Array)) throw new TypeError('hkdfExpand: prk must be Uint8Array');
  const infoBytes = info instanceof Uint8Array ? info : new Uint8Array(0);
  if (!Number.isInteger(length) || length < 0) throw new RangeError('hkdfExpand: length must be a non-negative integer');
  if (length > 255 * len) throw new RangeError(`hkdfExpand: length ${length} exceeds RFC 5869 maximum ${255 * len} for ${algId}`);
  const out = new Uint8Array(length);
  let t = new Uint8Array(0);
  let pos = 0;
  for (let counter = 1; pos < length; counter++) {
    const h = createHmac(digest, prk);
    h.update(concatBytes(t, infoBytes, Uint8Array.of(counter)));
    t = new Uint8Array(h.digest());
    const take = Math.min(t.length, length - pos);
    out.set(t.subarray(0, take), pos);
    pos += take;
  }
  return out;
}

export function hkdf(algId, { salt = null, ikm, info = null, length }) {
  return hkdfExpand(algId, hkdfExtract(algId, salt, ikm), info, length);
}

export function hkdfOutputLength(algId) { return params(algId).len; }

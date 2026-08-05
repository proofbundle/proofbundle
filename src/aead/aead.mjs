// Authenticated encryption dispatcher.
//
// Decryption returns a discriminated result, never a thrown-away plaintext:
// on tag failure it returns { ok: false } and no `plaintext` field exists at
// all. There is no code path in this module that produces plaintext without a
// verified tag, which is the executable form of "failed decryption cannot
// produce verified plaintext".
//
// The cipher-suite id and the AAD are bound together: the AAD actually passed
// to the cipher is a domain-separated transcript over (algId, nonce,
// callerAad), so the same ciphertext cannot be reinterpreted under a
// different suite id even if an attacker controls the header.

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { buildTranscript, DOMAIN_TAGS } from '../canonical/transcript.mjs';
import { UnknownAlgorithmError, UnsupportedAlgorithmError } from '../errors.mjs';

const TABLE = new Map([
  ['AES-128-GCM', { cipher: 'aes-128-gcm', keyLength: 16, nonceLength: 12, tagLength: 16 }],
  ['AES-192-GCM', { cipher: 'aes-192-gcm', keyLength: 24, nonceLength: 12, tagLength: 16 }],
  ['AES-256-GCM', { cipher: 'aes-256-gcm', keyLength: 32, nonceLength: 12, tagLength: 16 }],
  ['ChaCha20-Poly1305', { cipher: 'chacha20-poly1305', keyLength: 32, nonceLength: 12, tagLength: 16 }],
]);

// Registered, not wired in this build (needs a vetted provider).
const REGISTERED_UNWIRED = new Set(['AES-256-GCM-SIV', 'XChaCha20-Poly1305']);

export function isImplementedAead(algId) { return TABLE.has(algId); }
export function aeadAlgorithms() { return [...TABLE.keys()]; }
export function aeadParams(algId) { return { ...spec(algId) }; }

function spec(algId) {
  const s = TABLE.get(algId);
  if (s) return s;
  if (REGISTERED_UNWIRED.has(algId)) throw new UnsupportedAlgorithmError(algId, 'aead.implemented');
  throw new UnknownAlgorithmError(algId, 'aead.algorithmKnown');
}

export function generateNonce(algId) {
  return new Uint8Array(randomBytes(spec(algId).nonceLength));
}

function boundAad(algId, nonce, callerAad) {
  return buildTranscript(DOMAIN_TAGS.ENCRYPTED_HEADER, [algId, nonce, callerAad ?? new Uint8Array(0)]);
}

export function aeadEncrypt(algId, { key, nonce, plaintext, aad = null }) {
  const s = spec(algId);
  if (!(key instanceof Uint8Array) || key.length !== s.keyLength) throw new RangeError(`aeadEncrypt: ${algId} requires a ${s.keyLength}-byte key`);
  if (!(nonce instanceof Uint8Array) || nonce.length !== s.nonceLength) throw new RangeError(`aeadEncrypt: ${algId} requires a ${s.nonceLength}-byte nonce`);
  if (!(plaintext instanceof Uint8Array)) throw new TypeError('aeadEncrypt: plaintext must be Uint8Array');
  const c = createCipheriv(s.cipher, key, nonce, { authTagLength: s.tagLength });
  c.setAAD(boundAad(algId, nonce, aad));
  const body = Buffer.concat([c.update(plaintext), c.final()]);
  return { algId, nonce, ciphertext: new Uint8Array(body), tag: new Uint8Array(c.getAuthTag()) };
}

export function aeadDecrypt(algId, { key, nonce, ciphertext, tag, aad = null }) {
  const s = spec(algId);
  if (!(key instanceof Uint8Array) || key.length !== s.keyLength) throw new RangeError(`aeadDecrypt: ${algId} requires a ${s.keyLength}-byte key`);
  if (!(nonce instanceof Uint8Array) || nonce.length !== s.nonceLength) throw new RangeError(`aeadDecrypt: ${algId} requires a ${s.nonceLength}-byte nonce`);
  if (!(tag instanceof Uint8Array)) throw new TypeError('aeadDecrypt: tag must be Uint8Array');
  // A truncated tag is rejected before the cipher sees it. Accepting a short
  // tag would weaken authentication by exactly the bits removed.
  if (tag.length !== s.tagLength) return { ok: false, reason: 'TAG_LENGTH_INVALID' };
  try {
    const d = createDecipheriv(s.cipher, key, nonce, { authTagLength: s.tagLength });
    d.setAAD(boundAad(algId, nonce, aad));
    d.setAuthTag(tag);
    const out = Buffer.concat([d.update(ciphertext), d.final()]);
    return { ok: true, plaintext: new Uint8Array(out) };
  } catch {
    return { ok: false, reason: 'AUTHENTICATION_FAILED' };
  }
}

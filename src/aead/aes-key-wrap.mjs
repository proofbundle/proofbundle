// AES Key Wrap (RFC 3394) and Key Wrap with Padding (RFC 5649).
//
// Key wrap is not an AEAD and is deliberately not in the AEAD dispatcher: it
// has no nonce and no AAD, it takes a key as its plaintext, and its integrity
// check is a fixed initial value rather than a tag the caller supplies.
// Putting it behind the same interface would invite callers to pass a nonce
// that is silently ignored.
//
// Unwrapping returns a discriminated result. A wrong KEK produces
// { ok: false }, never key material — an unwrap that returned garbage bytes on
// failure would hand the caller a "key" that is not one.

import { createCipheriv, createDecipheriv, getCiphers } from 'node:crypto';
import { UnknownAlgorithmError, ProviderUnavailableError } from '../errors.mjs';

const AVAILABLE = new Set(getCiphers());

const TABLE = new Map([
  ['AES-128-KW', { cipher: 'id-aes128-wrap', keyLength: 16, padded: false }],
  ['AES-192-KW', { cipher: 'id-aes192-wrap', keyLength: 24, padded: false }],
  ['AES-256-KW', { cipher: 'id-aes256-wrap', keyLength: 32, padded: false }],
  ['AES-128-KWP', { cipher: 'id-aes128-wrap-pad', keyLength: 16, padded: true }],
  ['AES-192-KWP', { cipher: 'id-aes192-wrap-pad', keyLength: 24, padded: true }],
  ['AES-256-KWP', { cipher: 'id-aes256-wrap-pad', keyLength: 32, padded: true }],
]);

// RFC 3394 default initial value; RFC 5649 uses a length-carrying AIV.
const RFC3394_IV = Uint8Array.from([0xa6, 0xa6, 0xa6, 0xa6, 0xa6, 0xa6, 0xa6, 0xa6]);
const RFC5649_IV = Uint8Array.from([0xa6, 0x59, 0x59, 0xa6]);

export function isImplementedKeyWrap(algId) {
  const e = TABLE.get(algId);
  return Boolean(e) && AVAILABLE.has(e.cipher);
}
export function keyWrapAlgorithms() { return [...TABLE.keys()].filter(isImplementedKeyWrap); }

function spec(algId) {
  const e = TABLE.get(algId);
  if (!e) throw new UnknownAlgorithmError(algId, 'keywrap.algorithmKnown');
  if (!AVAILABLE.has(e.cipher)) {
    throw new ProviderUnavailableError('node:crypto', `this OpenSSL build does not expose ${e.cipher}`, { algorithmId: algId });
  }
  return e;
}

export function wrapKey(algId, { kek, keyToWrap }) {
  const s = spec(algId);
  if (!(kek instanceof Uint8Array) || kek.length !== s.keyLength) throw new RangeError(`wrapKey: ${algId} requires a ${s.keyLength}-byte KEK`);
  if (!(keyToWrap instanceof Uint8Array)) throw new TypeError('wrapKey: keyToWrap must be Uint8Array');
  if (!s.padded) {
    // RFC 3394 wraps whole 64-bit blocks only, minimum two.
    if (keyToWrap.length % 8 !== 0) throw new RangeError(`wrapKey: ${algId} requires a key length that is a multiple of 8 bytes; use the KWP variant for arbitrary lengths`);
    if (keyToWrap.length < 16) throw new RangeError(`wrapKey: ${algId} requires at least 16 bytes of key material`);
  } else if (keyToWrap.length < 1) {
    throw new RangeError(`wrapKey: ${algId} requires at least 1 byte of key material`);
  }
  const c = createCipheriv(s.cipher, kek, s.padded ? RFC5649_IV : RFC3394_IV);
  return new Uint8Array(Buffer.concat([c.update(keyToWrap), c.final()]));
}

export function unwrapKey(algId, { kek, wrapped }) {
  const s = spec(algId);
  if (!(kek instanceof Uint8Array) || kek.length !== s.keyLength) throw new RangeError(`unwrapKey: ${algId} requires a ${s.keyLength}-byte KEK`);
  if (!(wrapped instanceof Uint8Array)) throw new TypeError('unwrapKey: wrapped must be Uint8Array');
  try {
    const d = createDecipheriv(s.cipher, kek, s.padded ? RFC5649_IV : RFC3394_IV);
    const out = Buffer.concat([d.update(wrapped), d.final()]);
    return { ok: true, key: new Uint8Array(out) };
  } catch {
    // The integrity check failed: wrong KEK, or the wrapped blob was altered.
    return { ok: false, reason: 'KEY_WRAP_INTEGRITY_FAILED' };
  }
}

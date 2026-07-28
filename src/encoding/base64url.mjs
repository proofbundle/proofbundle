// Base64url (RFC 4648 §5), unpadded — the form used in JWS/JWK-style
// identifiers throughout this project. Rejects standard-alphabet
// characters ('+', '/') and any '=' padding, since accepting both
// alphabets for the same value would again make the encoding non-unique.

const B64URL_RE = /^[A-Za-z0-9_-]*$/;

export function bytesToBase64url(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('bytesToBase64url: expected Uint8Array');
  return Buffer.from(bytes).toString('base64url');
}

export function base64urlToBytes(str) {
  if (typeof str !== 'string') throw new TypeError('base64urlToBytes: expected a string');
  if (!B64URL_RE.test(str)) throw new RangeError('base64urlToBytes: invalid base64url alphabet or padding present');
  const decoded = Buffer.from(str, 'base64url');
  if (decoded.toString('base64url') !== str) {
    throw new RangeError('base64urlToBytes: non-canonical encoding');
  }
  return new Uint8Array(decoded);
}

// Strict standard Base64 (RFC 4648 §4), padded. Decoding rejects
// non-alphabet characters, wrong padding, and non-canonical padding bits
// (trailing bits that should be zero but aren't) — Node's Buffer decoder is
// lenient about all three, so this wraps it with explicit checks rather
// than trusting it to reject malformed input the way a canonical decoder
// must.

const B64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

export function bytesToBase64(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('bytesToBase64: expected Uint8Array');
  return Buffer.from(bytes).toString('base64');
}

export function base64ToBytes(str) {
  if (typeof str !== 'string') throw new TypeError('base64ToBytes: expected a string');
  if (str.length % 4 !== 0) throw new RangeError('base64ToBytes: length must be a multiple of 4');
  if (!B64_RE.test(str)) throw new RangeError('base64ToBytes: invalid base64 alphabet or padding');
  const padIdx = str.indexOf('=');
  if (padIdx !== -1 && padIdx < str.length - 2) {
    throw new RangeError('base64ToBytes: padding character before final two positions');
  }
  const decoded = Buffer.from(str, 'base64');
  // Re-encode and compare: catches non-canonical trailing bits Buffer accepts silently.
  if (decoded.toString('base64') !== str) {
    throw new RangeError('base64ToBytes: non-canonical encoding (non-zero padding bits)');
  }
  return new Uint8Array(decoded);
}

// Strict lowercase hex. Encoding always produces lowercase; decoding
// accepts only lowercase and rejects uppercase, odd length, and non-hex
// characters rather than silently tolerating them — a canonical encoding
// with more than one valid spelling per value is not canonical.

const HEX_RE = /^[0-9a-f]*$/;

export function bytesToHex(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('bytesToHex: expected Uint8Array');
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

export function hexToBytes(hex) {
  if (typeof hex !== 'string') throw new TypeError('hexToBytes: expected a string');
  if (hex.length % 2 !== 0) throw new RangeError('hexToBytes: odd-length hex string');
  if (!HEX_RE.test(hex)) throw new RangeError('hexToBytes: non-canonical hex (must be lowercase 0-9a-f)');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

export function isCanonicalHex(hex) {
  return typeof hex === 'string' && hex.length % 2 === 0 && HEX_RE.test(hex);
}

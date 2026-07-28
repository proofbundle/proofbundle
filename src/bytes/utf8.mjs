// Strict UTF-8. TextEncoder is already lossless-in (JS strings are UTF-16
// and TextEncoder.encode never fails), so the encode side needs no
// validation. The decode side is where hostile input lives: TextDecoder in
// non-fatal mode silently replaces invalid sequences with U+FFFD, which
// would let malformed bytes parse as if they were valid text. `fatal: true`
// makes it throw instead.

const encoder = new TextEncoder();

export function utf8Encode(str) {
  if (typeof str !== 'string') throw new TypeError('utf8Encode: expected a string');
  return encoder.encode(str);
}

export function utf8Decode(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('utf8Decode: expected Uint8Array');
  const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
  try {
    return decoder.decode(bytes);
  } catch {
    throw new RangeError('utf8Decode: invalid UTF-8 byte sequence');
  }
}

// Lone surrogates (U+D800-U+DFFF) cannot occur in valid UTF-8 — TextDecoder
// with fatal:true already rejects the byte sequences that would produce
// them. This checks a JS string directly, for values that arrived as
// strings (e.g. from JSON.parse, which is UTF-16-native and permits lone
// surrogates JSON's own grammar does not exclude).
export function hasLoneSurrogate(str) {
  if (typeof str !== 'string') throw new TypeError('hasLoneSurrogate: expected a string');
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = str.charCodeAt(i + 1);
      if (Number.isNaN(next) || next < 0xdc00 || next > 0xdfff) return true;
      i++;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

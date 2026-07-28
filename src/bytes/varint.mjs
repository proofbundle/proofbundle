// Unsigned LEB128 varints, used for length prefixes in framing. Encoding is
// canonical: the shortest possible encoding is required, so decode rejects
// non-minimal (overlong) encodings — otherwise two different byte strings
// could decode to the same integer, breaking any transcript that depends on
// varint-prefixed fields being unambiguous.

const MAX_SAFE_BITS = 53; // Number.MAX_SAFE_INTEGER

export function encodeVarint(n) {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
    throw new RangeError('encodeVarint: expected a non-negative integer');
  }
  if (n > Number.MAX_SAFE_INTEGER) {
    throw new RangeError('encodeVarint: exceeds Number.MAX_SAFE_INTEGER');
  }
  const out = [];
  let v = n;
  do {
    let byte = v % 128;
    v = Math.floor(v / 128);
    if (v > 0) byte |= 0x80;
    out.push(byte);
  } while (v > 0);
  return Uint8Array.from(out);
}

export function decodeVarint(bytes, offset = 0) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('decodeVarint: expected Uint8Array');
  let result = 0;
  let shift = 0;
  let pos = offset;
  let byteCount = 0;
  for (;;) {
    if (pos >= bytes.length) throw new RangeError('decodeVarint: truncated varint');
    const byte = bytes[pos++];
    byteCount++;
    // Unreachable for a plain byte stream in practice: the shift-width
    // guard below fires at byte 8 (shift becomes 56 > 53) before this
    // could ever see a 9th byte. Kept as a second, independent bound in
    // case the shift-width guard is ever changed without this one being
    // revisited at the same time.
    if (byteCount > 8) throw new RangeError('decodeVarint: varint exceeds 8 bytes (overflow guard)');
    result += (byte & 0x7f) * Math.pow(2, shift);
    if ((byte & 0x80) === 0) {
      if (byteCount > 1 && (byte & 0x7f) === 0) {
        throw new RangeError('decodeVarint: non-minimal (overlong) encoding');
      }
      if (result > Number.MAX_SAFE_INTEGER) {
        throw new RangeError('decodeVarint: decoded value exceeds Number.MAX_SAFE_INTEGER');
      }
      return { value: result, bytesRead: pos - offset };
    }
    shift += 7;
    if (shift > MAX_SAFE_BITS) throw new RangeError('decodeVarint: shift overflow');
  }
}

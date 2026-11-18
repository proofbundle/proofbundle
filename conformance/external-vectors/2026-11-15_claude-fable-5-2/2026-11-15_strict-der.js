function decode_der(bytes) {
  // Strict DER (X.690 sections 8.1.3, 8.3.2, 10.1): definite short- or minimal long-form lengths, minimal
  // positive INTEGERs, and no bytes after the SEQUENCE. Any other encoding of (r, s) is refused.
  const len_at = (o) => {
    if (o >= bytes.length) throw new Error('DER truncated');
    const first = bytes[o];
    if (first < 0x80) return { len: first, next: o + 1 };
    const n = first & 0x7f;
    if (n === 0 || n > 2 || o + 1 + n > bytes.length) throw new Error('DER length form');
    let len = 0; for (let i = 0; i < n; i++) len = len * 256 + bytes[o + 1 + i];
    if (len < 0x80 || (n === 2 && len < 0x100)) throw new Error('DER non-minimal length');
    return { len, next: o + 1 + n };
  };
  const int_at = (o) => {
    if (bytes[o] !== 0x02) throw new Error('DER expected INTEGER');
    const { len, next } = len_at(o + 1);
    if (len === 0 || next + len > bytes.length) throw new Error('DER INTEGER length');
    const v = bytes.slice(next, next + len);
    if (v[0] & 0x80) throw new Error('DER negative INTEGER');
    if (len > 1 && v[0] === 0 && !(v[1] & 0x80)) throw new Error('DER non-minimal INTEGER');
    return { v, next: next + len };
  };
  if (bytes[0] !== 0x30) throw new Error('not a DER SEQUENCE');
  const seq = len_at(1);
  if (seq.next + seq.len !== bytes.length) throw new Error('DER SEQUENCE length mismatch');
  const r = int_at(seq.next), s = int_at(r.next);
  if (s.next !== bytes.length) throw new Error('DER trailing data in SEQUENCE');
  return { r: bytes_to_big(r.v), s: bytes_to_big(s.v) };
}
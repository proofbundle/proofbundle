// Pure-mjs ChaCha20 (RFC 8439), HChaCha20 (draft-irtf-cfrg-xchacha), and
// Poly1305 (RFC 8439 section 2.5). Validated against published vectors.

const SIGMA = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574];

function rotl(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0; }

function quarterRound(s, a, b, c, d) {
  s[a] = (s[a] + s[b]) >>> 0; s[d] = rotl(s[d] ^ s[a], 16);
  s[c] = (s[c] + s[d]) >>> 0; s[b] = rotl(s[b] ^ s[c], 12);
  s[a] = (s[a] + s[b]) >>> 0; s[d] = rotl(s[d] ^ s[a], 8);
  s[c] = (s[c] + s[d]) >>> 0; s[b] = rotl(s[b] ^ s[c], 7);
}

function readU32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }

function keyWords(key) {
  const w = new Uint32Array(8);
  for (let i = 0; i < 8; i++) w[i] = readU32(key, i * 4);
  return w;
}

function chachaBlock(kw, counter, nonceWords) {
  const s = new Uint32Array(16);
  s[0] = SIGMA[0]; s[1] = SIGMA[1]; s[2] = SIGMA[2]; s[3] = SIGMA[3];
  s.set(kw, 4);
  s[12] = counter >>> 0;
  s[13] = nonceWords[0]; s[14] = nonceWords[1]; s[15] = nonceWords[2];
  const init = Uint32Array.from(s);
  for (let i = 0; i < 10; i++) {
    quarterRound(s, 0, 4, 8, 12);
    quarterRound(s, 1, 5, 9, 13);
    quarterRound(s, 2, 6, 10, 14);
    quarterRound(s, 3, 7, 11, 15);
    quarterRound(s, 0, 5, 10, 15);
    quarterRound(s, 1, 6, 11, 12);
    quarterRound(s, 2, 7, 8, 13);
    quarterRound(s, 3, 4, 9, 14);
  }
  const out = new Uint8Array(64);
  for (let i = 0; i < 16; i++) {
    const v = (s[i] + init[i]) >>> 0;
    out[i * 4] = v & 0xff; out[i * 4 + 1] = (v >>> 8) & 0xff;
    out[i * 4 + 2] = (v >>> 16) & 0xff; out[i * 4 + 3] = (v >>> 24) & 0xff;
  }
  return out;
}

/** HChaCha20(key[32], nonce16[16]) -> subkey[32] */
export function hchacha20(key, nonce16) {
  const s = new Uint32Array(16);
  s[0] = SIGMA[0]; s[1] = SIGMA[1]; s[2] = SIGMA[2]; s[3] = SIGMA[3];
  s.set(keyWords(key), 4);
  for (let i = 0; i < 4; i++) s[12 + i] = readU32(nonce16, i * 4);
  for (let i = 0; i < 10; i++) {
    quarterRound(s, 0, 4, 8, 12);
    quarterRound(s, 1, 5, 9, 13);
    quarterRound(s, 2, 6, 10, 14);
    quarterRound(s, 3, 7, 11, 15);
    quarterRound(s, 0, 5, 10, 15);
    quarterRound(s, 1, 6, 11, 12);
    quarterRound(s, 2, 7, 8, 13);
    quarterRound(s, 3, 4, 9, 14);
  }
  const out = new Uint8Array(32);
  const idx = [0, 1, 2, 3, 12, 13, 14, 15];
  for (let i = 0; i < 8; i++) {
    const v = s[idx[i]];
    out[i * 4] = v & 0xff; out[i * 4 + 1] = (v >>> 8) & 0xff;
    out[i * 4 + 2] = (v >>> 16) & 0xff; out[i * 4 + 3] = (v >>> 24) & 0xff;
  }
  return out;
}

/** ChaCha20 stream XOR. nonce is 12 bytes, initialCounter 32-bit. */
export function chacha20Xor(key, nonce12, initialCounter, data) {
  const kw = keyWords(key);
  const nw = [readU32(nonce12, 0), readU32(nonce12, 4), readU32(nonce12, 8)];
  const out = new Uint8Array(data.length);
  let counter = initialCounter >>> 0;
  for (let off = 0; off < data.length; off += 64) {
    const ks = chachaBlock(kw, counter, nw);
    const take = Math.min(64, data.length - off);
    for (let i = 0; i < take; i++) out[off + i] = data[off + i] ^ ks[i];
    counter = (counter + 1) >>> 0;
  }
  return out;
}

// ---- Poly1305 ----
// Arithmetic mod 2^130-5 using BigInt limbs; one-shot, auditable.
const P = (1n << 130n) - 5n;

export function poly1305Mac(msg, key32) {
  const rBytes = key32.subarray(0, 16);
  const sBytes = key32.subarray(16, 32);
  // clamp r
  const rb = Uint8Array.from(rBytes);
  rb[3] &= 15; rb[7] &= 15; rb[11] &= 15; rb[15] &= 15;
  rb[4] &= 252; rb[8] &= 252; rb[12] &= 252;
  const r = leBytesToBigInt(rb);
  const s = leBytesToBigInt(sBytes);
  let acc = 0n;
  for (let off = 0; off < msg.length; off += 16) {
    const take = Math.min(16, msg.length - off);
    const block = new Uint8Array(17);
    block.set(msg.subarray(off, off + take));
    block[take] = 1;
    acc = ((acc + leBytesToBigInt(block)) * r) % P;
  }
  const tag = (acc + s) % (1n << 128n);
  return bigIntToLeBytes(tag, 16);
}

function leBytesToBigInt(b) {
  let v = 0n;
  for (let i = b.length - 1; i >= 0; i--) v = (v << 8n) | BigInt(b[i]);
  return v;
}
function bigIntToLeBytes(v, len) {
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) { out[i] = Number(v & 0xffn); v >>= 8n; }
  return out;
}

function pad16(b) {
  if (b.length % 16 === 0) return new Uint8Array(0);
  return new Uint8Array(16 - (b.length % 16));
}

function le64(n) {
  const out = new Uint8Array(8);
  let v = BigInt(n);
  for (let i = 0; i < 8; i++) { out[i] = Number(v & 0xffn); v >>= 8n; }
  return out;
}

/** RFC 8439 AEAD construction over the pure chacha20 (12-byte nonce). */
export function chacha20Poly1305Seal(key, nonce12, plaintext, aad = new Uint8Array(0)) {
  const otk = chachaBlock(keyWords(key), 0, [readU32(nonce12, 0), readU32(nonce12, 4), readU32(nonce12, 8)]).subarray(0, 32);
  const ciphertext = chacha20Xor(key, nonce12, 1, plaintext);
  const macData = concatAll(aad, pad16(aad), ciphertext, pad16(ciphertext), le64(aad.length), le64(ciphertext.length));
  const tag = poly1305Mac(macData, otk);
  return { ciphertext, tag };
}

export function chacha20Poly1305Open(key, nonce12, ciphertext, tag, aad = new Uint8Array(0)) {
  const otk = chachaBlock(keyWords(key), 0, [readU32(nonce12, 0), readU32(nonce12, 4), readU32(nonce12, 8)]).subarray(0, 32);
  const macData = concatAll(aad, pad16(aad), ciphertext, pad16(ciphertext), le64(aad.length), le64(ciphertext.length));
  const expected = poly1305Mac(macData, otk);
  let diff = 0;
  if (expected.length !== tag.length) return null;
  for (let i = 0; i < 16; i++) diff |= expected[i] ^ tag[i];
  if (diff !== 0) return null; // never release plaintext on auth failure
  return chacha20Xor(key, nonce12, 1, ciphertext);
}

function concatAll(...parts) {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

// ChaCha20, HChaCha20, Poly1305, and the two AEAD constructions built on them:
// AEAD_CHACHA20_POLY1305 (RFC 8439) and XChaCha20-Poly1305 (draft-irtf-cfrg-
// xchacha20poly1305, as shipped by libsodium).
//
// From scratch: no node:crypto, no WebCrypto. 32-bit words are kept with >>> 0
// after every add and rotate so V8's int32 assumptions cannot leak into the
// arithmetic; Poly1305 uses BigInt for the 130-bit multiply, which is slower
// than a 26-bit limb implementation but far easier to check line by line.
//
// Spec references:
//   RFC 8439 section 2.1   -- quarter round and permutation
//   RFC 8439 section 2.3   -- block function and 32-bit block counter
//   RFC 8439 section 2.4   -- encryption as XOR of keystream
//   RFC 8439 section 2.5   -- Poly1305 one-time authenticator
//   RFC 8439 section 2.8   -- AEAD construction and MAC data layout
//   draft-irtf-cfrg-xchacha section 2.2 -- HChaCha20
//   draft-irtf-cfrg-xchacha section 2.3 -- XChaCha20 (4 zero bytes || last 8)

const SIGMA = Uint32Array.from([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]); // "expand 32-byte k"

const rotl = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
const add = (a, b) => (a + b) >>> 0;

function quarterRound(s, a, b, c, d) {
  s[a] = add(s[a], s[b]); s[d] = rotl(s[d] ^ s[a], 16);
  s[c] = add(s[c], s[d]); s[b] = rotl(s[b] ^ s[c], 12);
  s[a] = add(s[a], s[b]); s[d] = rotl(s[d] ^ s[a], 8);
  s[c] = add(s[c], s[d]); s[b] = rotl(s[b] ^ s[c], 7);
}

const le32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
function st32(v) {
  const out = new Uint8Array(4);
  out[0] = v & 255; out[1] = (v >>> 8) & 255; out[2] = (v >>> 16) & 255; out[3] = (v >>> 24) & 255;
  return out;
}

function initialWords(key, counterWords, nonceWords) {
  if (key.length !== 32) throw new RangeError('ChaCha key must be 32 bytes');
  const s = new Uint32Array(16);
  s[0] = SIGMA[0]; s[1] = SIGMA[1]; s[2] = SIGMA[2]; s[3] = SIGMA[3];
  for (let i = 0; i < 8; i++) s[4 + i] = le32(key, 4 * i);
  for (let i = 0; i < 4; i++) s[12 + i] = counterWords[i];
  for (let i = 0; i < nonceWords.length; i++) s[12 + counterWords.length + i] = nonceWords[i];
  return s;
}

function permute(s) {
  const x = Uint32Array.from(s);
  for (let i = 0; i < 10; i++) {              // 20 rounds = 10 column + 10 diagonal
    quarterRound(x, 0, 4, 8, 12);
    quarterRound(x, 1, 5, 9, 13);
    quarterRound(x, 2, 6, 10, 14);
    quarterRound(x, 3, 7, 11, 15);
    quarterRound(x, 0, 5, 10, 15);
    quarterRound(x, 1, 6, 11, 12);
    quarterRound(x, 2, 7, 8, 13);
    quarterRound(x, 3, 4, 9, 14);
  }
  for (let i = 0; i < 16; i++) x[i] = add(x[i], s[i]);
  return x;
}

// One 64-byte block: key, 32-bit block counter, 96-bit nonce (RFC 8439 2.3).
export function chacha20Block(key, counter, nonce) {
  if (nonce.length !== 12) throw new RangeError('ChaCha20 nonce must be 12 bytes');
  const s = initialWords(key, [counter >>> 0], [le32(nonce, 0), le32(nonce, 4), le32(nonce, 8)]);
  const x = permute(s);
  const out = new Uint8Array(64);
  for (let i = 0; i < 16; i++) out.set(st32(x[i]), 4 * i);
  return out;
}

// XOR with the keystream from block counter `counter` (default 1 for AEAD).
export function chacha20Xor(key, nonce, input, counter = 1) {
  const out = new Uint8Array(input.length);
  const blocks = Math.ceil(input.length / 64);
  for (let b = 0; b < blocks; b++) {
    const ks = chacha20Block(key, counter + b, nonce);
    const off = b * 64;
    const n = Math.min(64, input.length - off);
    for (let i = 0; i < n; i++) out[off + i] = input[off + i] ^ ks[i];
  }
  return out;
}

// HChaCha20: key + 16-byte nonce placed in words 12..15, no counter, and the
// output is words 0..3 || 12..15 (draft 2.2).
export function hchacha20(key, nonce16) {
  if (nonce16.length !== 16) throw new RangeError('HChaCha20 nonce must be 16 bytes');
  const s = initialWords(key, [], [le32(nonce16, 0), le32(nonce16, 4), le32(nonce16, 8), le32(nonce16, 12)]);
  // permute() adds the input state back, so call the rounds directly here.
  const x = Uint32Array.from(s);
  for (let i = 0; i < 10; i++) {
    quarterRound(x, 0, 4, 8, 12);
    quarterRound(x, 1, 5, 9, 13);
    quarterRound(x, 2, 6, 10, 14);
    quarterRound(x, 3, 7, 11, 15);
    quarterRound(x, 0, 5, 10, 15);
    quarterRound(x, 1, 6, 11, 12);
    quarterRound(x, 2, 7, 8, 13);
    quarterRound(x, 3, 4, 9, 14);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 4; i++) out.set(st32(x[i]), 4 * i);
  for (let i = 0; i < 4; i++) out.set(st32(x[12 + i]), 16 + 4 * i);
  return out;
}

// ---- Poly1305 (RFC 8439 2.5) ----------------------------------------------
const P1305 = (1n << 130n) - 5n;

function leBig(bytes) {
  let v = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) v = (v << 8n) | BigInt(bytes[i]);
  return v;
}

// One-time authenticator over `msg` under a 32-byte one-time key.
export function poly1305(key, msg) {
  if (key.length !== 32) throw new RangeError('Poly1305 key must be 32 bytes');
  const r = leBig(key.subarray(0, 16)) & 0x0ffffffc0ffffffc0ffffffc0fffffffn;
  const s = leBig(key.subarray(16, 32));
  let acc = 0n;
  for (let i = 0; i < msg.length; i += 16) {
    const chunk = msg.subarray(i, Math.min(i + 16, msg.length));
    // 1 bit appended above the block: 2^(8*len)
    const n = leBig(chunk) + (1n << BigInt(8 * chunk.length));
    acc = ((acc + n) * r) % P1305;
  }
  acc = (acc + s) & ((1n << 128n) - 1n);
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) { out[i] = Number(acc & 255n); acc >>= 8n; }
  return out;
}

const pad16 = (n) => (n % 16 === 0 ? new Uint8Array(0) : new Uint8Array(16 - (n % 16)));
function le64(n) {
  const b = new Uint8Array(8);
  let v = BigInt(n);
  for (let i = 0; i < 8; i++) { b[i] = Number(v & 255n); v >>= 8n; }
  return b;
}
function aeadMacData(aad, ct) {
  const la = le64(aad.length);
  const lc = le64(ct.length);
  const aadPad = pad16(aad.length), ctPad = pad16(ct.length);
  const out = new Uint8Array(aad.length + aadPad.length + ct.length + ctPad.length + 16);
  let o = 0;
  out.set(aad, o); o += aad.length;
  out.set(aadPad, o); o += aadPad.length;
  out.set(ct, o); o += ct.length;
  out.set(ctPad, o); o += ctPad.length;
  out.set(la, o); o += 8;
  out.set(lc, o);
  return out;
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

// AEAD_CHACHA20_POLY1305 (RFC 8439 2.8). Returns ciphertext || 16-byte tag.
export function aeadSeal(key, nonce, plaintext, aad = new Uint8Array(0)) {
  if (key.length !== 32) throw new RangeError('key must be 32 bytes');
  if (nonce.length !== 12) throw new RangeError('nonce must be 12 bytes');
  const polyKey = chacha20Block(key, 0, nonce).subarray(0, 32);
  const ct = chacha20Xor(key, nonce, plaintext, 1);
  const tag = poly1305(polyKey, aeadMacData(aad, ct));
  const out = new Uint8Array(ct.length + 16);
  out.set(ct, 0); out.set(tag, ct.length);
  return out;
}

export function aeadOpen(key, nonce, sealed, aad = new Uint8Array(0)) {
  if (key.length !== 32) throw new RangeError('key must be 32 bytes');
  if (nonce.length !== 12) throw new RangeError('nonce must be 12 bytes');
  if (sealed.length < 16) return null;
  const ct = sealed.subarray(0, sealed.length - 16);
  const tag = sealed.subarray(sealed.length - 16);
  const polyKey = chacha20Block(key, 0, nonce).subarray(0, 32);
  const expect = poly1305(polyKey, aeadMacData(aad, ct));
  if (!constantTimeEqual(tag, expect)) return null;
  return chacha20Xor(key, nonce, ct, 1);
}

// XChaCha20-Poly1305. 24-byte nonce: subkey = HChaCha20(key, nonce[0:16]),
// inner nonce = 4 zero bytes || nonce[16:24] (draft 2.3).
export function xchacha20Poly1305Seal(key, nonce24, plaintext, aad = new Uint8Array(0)) {
  if (nonce24.length !== 24) throw new RangeError('XChaCha nonce must be 24 bytes');
  const subkey = hchacha20(key, nonce24.subarray(0, 16));
  const inner = new Uint8Array(12);
  inner.set(nonce24.subarray(16, 24), 4);
  return aeadSeal(subkey, inner, plaintext, aad);
}

export function xchacha20Poly1305Open(key, nonce24, sealed, aad = new Uint8Array(0)) {
  if (nonce24.length !== 24) throw new RangeError('XChaCha nonce must be 24 bytes');
  const subkey = hchacha20(key, nonce24.subarray(0, 16));
  const inner = new Uint8Array(12);
  inner.set(nonce24.subarray(16, 24), 4);
  return aeadOpen(subkey, inner, sealed, aad);
}

export const _internals = { SIGMA, quarterRound, permute, initialWords, leBig, aeadMacData };

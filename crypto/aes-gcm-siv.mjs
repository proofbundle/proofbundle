// AES-GCM-SIV (RFC 8452), 128- and 256-bit keys.
//
// From scratch on top of ./aes.mjs. No node:crypto, no WebCrypto.
//
// Spec references:
//   RFC 8452 section 3   -- POLYVAL: S_j = dot(S_{j-1} + X_j, H), field
//                           x^128 + x^127 + x^126 + x^121 + 1, coefficients
//                           taken LSB-first within each byte
//   RFC 8452 section 4   -- key derivation, length block, tag, CTR keystream
//   RFC 8452 section 5   -- decryption
//
// Two details that are easy to get backwards, so they are stated here:
//   * POLYVAL is NOT GHASH. GHASH is MSB-first; POLYVAL is the byte-reversed
//     twin. Reading the 16 bytes little-endian gives the LSB-first coefficient
//     order directly, which is what the code below does.
//   * The message-authentication key authenticates the PLAINTEXT, not the
//     ciphertext (RFC 8452 section 4, the paragraph after the tag step).
import { expandKey, encryptBlock } from './aes.mjs';

// POLYVAL is implemented through Appendix A's transform rather than the
// section 3 recurrence directly. Appendix A: POLYVAL(H, X...) equals
// ByteReverse(GHASH(mulX_GHASH(ByteReverse(H)), ByteReverse(X)...)), where
// GHASH's field is x^128 + x^7 + x^2 + x + 1 -- the bit-reverse of POLYVAL's
// polynomial -- and its bit convention is the mirror of POLYVAL's. The two
// worked examples in Appendix A and every Appendix C vector below are the
// gate: a direct LSB-first implementation of the section 3 text agreed with
// neither, so the text is followed by its own stated equivalence.
const GHASH_R = (1n << 127n) | (1n << 126n) | (1n << 125n) | (1n << 120n);

function mulX_g(v) {
  const carry = v & 1n;
  v >>= 1n;
  return carry ? v ^ GHASH_R : v;
}

function ghashMul(a, b) {
  let z = 0n, v = a;
  for (let i = 0; i < 128; i++) {
    if ((b >> BigInt(127 - i)) & 1n) z ^= v;
    v = mulX_g(v);
  }
  return z;
}

const beBig = (u) => { let v = 0n; for (const x of u) v = (v << 8n) | BigInt(x); return v; };
function beBytes(v) {
  const o = new Uint8Array(16);
  for (let i = 15; i >= 0; i--) { o[i] = Number(v & 0xffn); v >>= 8n; }
  return o;
}
const reverseBytes = (u) => Uint8Array.from(u).reverse();

// POLYVAL(H, X_1, ..., X_s) over whole 16-byte blocks.
export function polyval(hBytes, blocks) {
  const h = mulX_g(beBig(reverseBytes(hBytes)));
  let y = 0n;
  for (const blk of blocks) y = ghashMul(y ^ beBig(reverseBytes(blk)), h);
  return reverseBytes(beBytes(y));
}

const le32 = (n) => Uint8Array.from([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
const le64 = (n) => {
  const b = new Uint8Array(8);
  let v = BigInt(n);
  for (let i = 0; i < 8; i++) { b[i] = Number(v & 255n); v >>= 8n; }
  return b;
};

const pad16 = (n) => (n.length % 16 === 0 ? new Uint8Array(0) : new Uint8Array(16 - (n.length % 16)));
const cat = (...xs) => {
  const out = new Uint8Array(xs.reduce((s, x) => s + x.length, 0));
  let o = 0;
  for (const x of xs) { out.set(x, o); o += x.length; }
  return out;
};

// RFC 8452 section 4, derive_keys().
export function deriveKeys(kek, nonce) {
  if (nonce.length !== 12) throw new RangeError('GCM-SIV nonce must be 12 bytes');
  const expanded = expandKey(kek);
  const block = (c) => encryptBlock(expanded, cat(le32(c), nonce));
  const macKey = cat(block(0).subarray(0, 8), block(1).subarray(0, 8));
  let encKey = cat(block(2).subarray(0, 8), block(3).subarray(0, 8));
  if (kek.length === 32) encKey = cat(encKey, block(4).subarray(0, 8), block(5).subarray(0, 8));
  return { macKey, encKey, kekExpanded: expanded };
}

function tagFor(kek, nonce, plaintext, aad) {
  const { macKey, encKey } = deriveKeys(kek, nonce);
  const lenBlock = cat(le64(aad.length * 8), le64(plaintext.length * 8));
  const data = cat(aad, pad16(aad), plaintext, pad16(plaintext), lenBlock);
  const blocks = [];
  for (let i = 0; i < data.length; i += 16) blocks.push(data.subarray(i, i + 16));
  const S = polyval(macKey, blocks);
  // XOR the nonce into the first twelve bytes, clear the top bit of the last.
  const counter = Uint8Array.from(S);
  for (let i = 0; i < 12; i++) counter[i] ^= nonce[i];
  counter[15] &= 0x7f;
  const tag = encryptBlock(expandKey(encKey), counter);
  return { tag, encKey };
}

// CTR where the counter block is the tag (top bit of last byte set) and the
// counter is its own first 32 bits, little-endian.
function ctrWithTag(encKey, tag, input) {
  const expanded = expandKey(encKey);
  const out = new Uint8Array(input.length);
  let counter = (tag[0] | (tag[1] << 8) | (tag[2] << 16) | (tag[3] << 24)) >>> 0;
  for (let off = 0; off < input.length; off += 16) {
    const blk = Uint8Array.from(tag);
    blk[0] = counter & 255; blk[1] = (counter >>> 8) & 255;
    blk[2] = (counter >>> 16) & 255; blk[3] = (counter >>> 24) & 255;
    const ks = encryptBlock(expanded, blk);
    const n = Math.min(16, input.length - off);
    for (let i = 0; i < n; i++) out[off + i] = input[off + i] ^ ks[i];
    counter = (counter + 1) >>> 0;
  }
  return out;
}

// Returns ciphertext || 16-byte tag.
export function aeadSeal(kek, nonce, plaintext, aad = new Uint8Array(0)) {
  const { tag, encKey } = tagFor(kek, nonce, plaintext, aad);
  const ctr = Uint8Array.from(tag);
  ctr[15] |= 0x80;
  const ct = ctrWithTag(encKey, ctr, plaintext);
  const out = new Uint8Array(ct.length + 16);
  out.set(ct, 0); out.set(tag, ct.length);
  return out;
}

export function aeadOpen(kek, nonce, sealed, aad = new Uint8Array(0)) {
  if (sealed.length < 16) return null;
  const ct = sealed.subarray(0, sealed.length - 16);
  const tag = sealed.subarray(sealed.length - 16);
  // RFC 8452 section 5: the received tag is the initial counter block, so the
  // plaintext can be recovered first; authenticity is then checked by
  // re-deriving the tag over that plaintext.
  const { encKey } = deriveKeys(kek, nonce);
  const ctr = Uint8Array.from(tag);
  ctr[15] |= 0x80;
  const pt = ctrWithTag(encKey, ctr, ct);
  const { tag: check } = tagFor(kek, nonce, pt, aad);
  let diff = 0;
  for (let i = 0; i < 16; i++) diff |= tag[i] ^ check[i];
  return diff === 0 ? pt : null;
}

export const _internals = { GHASH_R, mulX_g, ghashMul, polyval };

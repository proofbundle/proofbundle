// otsverify.mjs — OpenTimestamps detached-timestamp (.ots) parser and verifier.
// From scratch: no dependencies, no node:crypto, no crypto.subtle, no WebAssembly.
// Single ES module. Inputs and outputs are Uint8Array.
//
// Layout (python-opentimestamps DetachedTimestampFile):
//   31-byte magic, varuint version 1, file hash op tag, digest with NO length
//   prefix (32 for sha256/keccak256, 20 for sha1/ripemd160), then the timestamp.
// Timestamp: read a tag. 0xff = another branch follows: parse one branch and
// loop. Any other tag is the last branch. A branch is either 0x00 (attestation:
// 8-byte type, then varbytes payload) or an op followed by a child timestamp.
// Binary ops 0xf0/0xf1 take a varbytes argument; 0xf2/0xf3/0x02/0x03/0x08/0x67
// take none. varuint is little-endian base-128.
//
// Library-safe: the CLI runs only when this file is the process entry point and
// never calls process.exit (it sets process.exitCode).
//
// Hash functions are branch-free with respect to data.

const MAGIC = Uint8Array.from([
  0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73,
  0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94,
]);

const TYPE_PENDING = '83dfe30d2ef90c8e';
const TYPE_BITCOIN = '0588960d73d71901';

const MAX_DEPTH = 256;
const MAX_NODES = 100000;
const MAX_ARG = 1 << 20;
const MAX_URI = 1 << 16;
const MAX_ATT_PAYLOAD = 1 << 16;

export class OtsError extends Error {
  constructor(msg) { super(msg); this.name = 'OtsError'; }
}

const toU8 = (x) => (x instanceof Uint8Array ? x : new Uint8Array(x));

const toHex = (b) => {
  let s = '';
  for (let i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
  return s;
};

class Digest extends Uint8Array {
  toString() { return toHex(this); }
}

const toDigest = (u8) => { const d = new Digest(u8.length); d.set(u8); return d; };

const fromHex = (h) => {
  if (h.length & 1) throw new OtsError('odd hex length');
  const o = new Uint8Array(h.length >> 1);
  for (let i = 0; i < o.length; i++) {
    const v = parseInt(h.substr(i * 2, 2), 16);
    if (Number.isNaN(v)) throw new OtsError('bad hex');
    o[i] = v;
  }
  return o;
};

const utf8Decode = (b) => {
  let s = '';
  for (let i = 0; i < b.length; i++) {
    const c = b[i];
    if (c < 0x80) s += String.fromCharCode(c);
    else if (c < 0xe0) s += String.fromCharCode(((c & 0x1f) << 6) | (b[++i] & 0x3f));
    else if (c < 0xf0) s += String.fromCharCode(((c & 0x0f) << 12) | ((b[++i] & 0x3f) << 6) | (b[++i] & 0x3f));
    else {
      const cp = ((c & 0x07) << 18) | ((b[++i] & 0x3f) << 12) | ((b[++i] & 0x3f) << 6) | (b[++i] & 0x3f);
      const v = cp - 0x10000;
      s += String.fromCharCode(0xd800 + (v >> 10), 0xdc00 + (v & 0x3ff));
    }
  }
  return s;
};

const utf8Encode = (s) => {
  const o = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      c = 0x10000 + ((c - 0xd800) << 10) + (s.charCodeAt(++i) - 0xdc00);
    }
    if (c < 0x80) o.push(c);
    else if (c < 0x800) o.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c < 0x10000) o.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    else o.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return Uint8Array.from(o);
};

// ---------------------------------------------------------------- padding
function mdPad(msg, blockSize, littleEndian) {
  const len = msg.length;
  const total = Math.ceil((len + 9) / blockSize) * blockSize;
  const out = new Uint8Array(total);
  out.set(msg);
  out[len] = 0x80;
  const bits = len * 8;
  const hi = Math.floor(bits / 4294967296);
  const lo = bits >>> 0;
  const o = total - 8;
  if (littleEndian) {
    out[o] = lo & 0xff; out[o + 1] = (lo >>> 8) & 0xff; out[o + 2] = (lo >>> 16) & 0xff; out[o + 3] = lo >>> 24;
    out[o + 4] = hi & 0xff; out[o + 5] = (hi >>> 8) & 0xff; out[o + 6] = (hi >>> 16) & 0xff; out[o + 7] = hi >>> 24;
  } else {
    out[o] = hi >>> 24; out[o + 1] = (hi >>> 16) & 0xff; out[o + 2] = (hi >>> 8) & 0xff; out[o + 3] = hi & 0xff;
    out[o + 4] = lo >>> 24; out[o + 5] = (lo >>> 16) & 0xff; out[o + 6] = (lo >>> 8) & 0xff; out[o + 7] = lo & 0xff;
  }
  return out;
}

const rotr = (x, n) => (x >>> n) | (x << (32 - n));
const rotl = (x, n) => (x << n) | (x >>> (32 - n));

// ------------------------------------------------------------------- SHA-256
const K256 = Uint32Array.from([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

export function sha256(msg) {
  msg = toU8(msg);
  const H = Uint32Array.from([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const p = mdPad(msg, 64, false);
  const w = new Int32Array(64);
  for (let o = 0; o < p.length; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = (p[o + i * 4] << 24) | (p[o + i * 4 + 1] << 16) | (p[o + i * 4 + 2] << 8) | p[o + i * 4 + 3];
    for (let i = 16; i < 64; i++) {
      const a1 = w[i - 15], a2 = w[i - 2];
      const s0 = rotr(a1, 7) ^ rotr(a1, 18) ^ (a1 >>> 3);
      const s1 = rotr(a2, 17) ^ rotr(a2, 19) ^ (a2 >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K256[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    out[i * 4] = H[i] >>> 24; out[i * 4 + 1] = (H[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (H[i] >>> 8) & 0xff; out[i * 4 + 3] = H[i] & 0xff;
  }
  return out;
}

// --------------------------------------------------------------------- SHA-1
export function sha1(msg) {
  msg = toU8(msg);
  const H = Uint32Array.from([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]);
  const p = mdPad(msg, 64, false);
  const w = new Int32Array(80);
  for (let o = 0; o < p.length; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = (p[o + i * 4] << 24) | (p[o + i * 4 + 1] << 16) | (p[o + i * 4 + 2] << 8) | p[o + i * 4 + 3];
    for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4];
    for (let i = 0; i < 80; i++) {
      const q = (i / 20) | 0;
      let f, k;
      if (q === 0) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (q === 1) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (q === 2) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const t = (rotl(a, 5) + f + e + k + w[i]) | 0;
      e = d; d = c; c = rotl(b, 30); b = a; a = t;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0;
  }
  const out = new Uint8Array(20);
  for (let i = 0; i < 5; i++) {
    out[i * 4] = H[i] >>> 24; out[i * 4 + 1] = (H[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (H[i] >>> 8) & 0xff; out[i * 4 + 3] = H[i] & 0xff;
  }
  return out;
}

// ---------------------------------------------------------------- RIPEMD-160
const R1 = Uint8Array.from([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
  1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
]);
const R2 = Uint8Array.from([
  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
  6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
  8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
]);
const S1 = Uint8Array.from([
  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
  7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
  11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6,
]);
const S2 = Uint8Array.from([
  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
  9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
  15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11,
]);
const K1 = Uint32Array.from([0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e]);
const K2 = Uint32Array.from([0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000]);

function rf(j, x, y, z) {
  if (j < 16) return x ^ y ^ z;
  if (j < 32) return (x & y) | (~x & z);
  if (j < 48) return (x | ~y) ^ z;
  if (j < 64) return (x & z) | (y & ~z);
  return x ^ (y | ~z);
}

export function ripemd160(msg) {
  msg = toU8(msg);
  const H = Uint32Array.from([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]);
  const p = mdPad(msg, 64, true);
  const X = new Int32Array(16);
  for (let o = 0; o < p.length; o += 64) {
    for (let i = 0; i < 16; i++) X[i] = p[o + i * 4] | (p[o + i * 4 + 1] << 8) | (p[o + i * 4 + 2] << 16) | (p[o + i * 4 + 3] << 24);
    let al = H[0], bl = H[1], cl = H[2], dl = H[3], el = H[4];
    let ar = H[0], br = H[1], cr = H[2], dr = H[3], er = H[4];
    for (let j = 0; j < 80; j++) {
      let t = (rotl((al + rf(j, bl, cl, dl) + X[R1[j]] + K1[(j / 16) | 0]) | 0, S1[j]) + el) | 0;
      al = el; el = dl; dl = rotl(cl, 10); cl = bl; bl = t;
      t = (rotl((ar + rf(79 - j, br, cr, dr) + X[R2[j]] + K2[(j / 16) | 0]) | 0, S2[j]) + er) | 0;
      ar = er; er = dr; dr = rotl(cr, 10); cr = br; br = t;
    }
    const t = (H[1] + cl + dr) | 0;
    H[1] = (H[2] + dl + er) | 0;
    H[2] = (H[3] + el + ar) | 0;
    H[3] = (H[4] + al + br) | 0;
    H[4] = (H[0] + bl + cr) | 0;
    H[0] = t;
  }
  const out = new Uint8Array(20);
  for (let i = 0; i < 5; i++) {
    out[i * 4] = H[i] & 0xff; out[i * 4 + 1] = (H[i] >>> 8) & 0xff;
    out[i * 4 + 2] = (H[i] >>> 16) & 0xff; out[i * 4 + 3] = H[i] >>> 24;
  }
  return out;
}

// ---------------------------------------------------------------- Keccak-256
const ROT = Uint8Array.from([
  0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14,
]);
const RCL = Uint32Array.from([
  0x00000001, 0x00008082, 0x0000808a, 0x80008000, 0x0000808b, 0x80000001, 0x80008081, 0x00008009,
  0x0000008a, 0x00000088, 0x80008009, 0x8000000a, 0x8000808b, 0x8000008b, 0x80008089, 0x80008003,
  0x80008002, 0x00000080, 0x0000800a, 0x8000000a, 0x80008081, 0x80000080, 0x80000001, 0x80008008,
]);
const RCH = Uint32Array.from([
  0, 0x80000000, 0x80000000, 0x80000000, 0, 0, 0x80000000, 0x80000000,
  0, 0, 0, 0, 0, 0x80000000, 0x80000000, 0x80000000,
  0x80000000, 0x80000000, 0, 0x80000000, 0x80000000, 0x80000000, 0, 0x80000000,
]);

function keccakF(S) {
  const C = new Uint32Array(10);
  const B = new Uint32Array(50);
  for (let round = 0; round < 24; round++) {
    for (let x = 0; x < 5; x++) {
      C[2 * x] = S[2 * x] ^ S[2 * (x + 5)] ^ S[2 * (x + 10)] ^ S[2 * (x + 15)] ^ S[2 * (x + 20)];
      C[2 * x + 1] = S[2 * x + 1] ^ S[2 * (x + 5) + 1] ^ S[2 * (x + 10) + 1] ^ S[2 * (x + 15) + 1] ^ S[2 * (x + 20) + 1];
    }
    for (let x = 0; x < 5; x++) {
      const pm = ((x + 4) % 5), qm = ((x + 1) % 5);
      const dlo = C[2 * pm] ^ ((C[2 * qm] << 1) | (C[2 * qm + 1] >>> 31));
      const dhi = C[2 * pm + 1] ^ ((C[2 * qm + 1] << 1) | (C[2 * qm] >>> 31));
      for (let y = 0; y < 5; y++) { S[2 * (x + 5 * y)] ^= dlo; S[2 * (x + 5 * y) + 1] ^= dhi; }
    }
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        const src = x + 5 * y;
        const dst = y + 5 * ((2 * x + 3 * y) % 5);
        const n = ROT[src];
        const lo = S[2 * src], hi = S[2 * src + 1];
        let nlo, nhi;
        if (n === 0) { nlo = lo; nhi = hi; }
        else if (n < 32) { nlo = (lo << n) | (hi >>> (32 - n)); nhi = (hi << n) | (lo >>> (32 - n)); }
        else if (n === 32) { nlo = hi; nhi = lo; }
        else { const m = n - 32; nlo = (hi << m) | (lo >>> (32 - m)); nhi = (lo << m) | (hi >>> (32 - m)); }
        B[2 * dst] = nlo; B[2 * dst + 1] = nhi;
      }
    }
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const a = 2 * (x + 5 * y);
        const b = 2 * (((x + 1) % 5) + 5 * y);
        const c = 2 * (((x + 2) % 5) + 5 * y);
        S[a] = B[a] ^ (~B[b] & B[c]);
        S[a + 1] = B[a + 1] ^ (~B[b + 1] & B[c + 1]);
      }
    }
    S[0] ^= RCL[round];
    S[1] ^= RCH[round];
  }
}

export function keccak256(msg) {
  msg = toU8(msg);
  const rate = 136;
  const len = msg.length;
  const total = len + (rate - (len % rate));
  const buf = new Uint8Array(total);
  buf.set(msg);
  buf[len] ^= 0x01;
  buf[total - 1] ^= 0x80;
  const S = new Uint32Array(50);
  for (let o = 0; o < total; o += rate) {
    for (let i = 0; i < rate; i++) {
      const lane = i >> 3, off = i & 7;
      if (off < 4) S[2 * lane] ^= buf[o + i] << (8 * off);
      else S[2 * lane + 1] ^= buf[o + i] << (8 * (off - 4));
    }
    keccakF(S);
  }
  const out = new Uint8Array(32);
  for (let j = 0; j < 4; j++) {
    const lo = S[2 * j], hi = S[2 * j + 1];
    out[j * 4] = lo & 0xff; out[j * 4 + 1] = (lo >>> 8) & 0xff;
    out[j * 4 + 2] = (lo >>> 16) & 0xff; out[j * 4 + 3] = lo >>> 24;
    out[16 + j * 4] = hi & 0xff; out[16 + j * 4 + 1] = (hi >>> 8) & 0xff;
    out[16 + j * 4 + 2] = (hi >>> 16) & 0xff; out[16 + j * 4 + 3] = hi >>> 24;
  }
  return out;
}

export const hashes = { sha1, ripemd160, sha256, keccak256 };

// --------------------------------------------------------------------- ops
const OPS = new Map([
  [0x02, { name: 'sha1', kind: 'hash', len: 20 }],
  [0x03, { name: 'ripemd160', kind: 'hash', len: 20 }],
  [0x08, { name: 'sha256', kind: 'hash', len: 32 }],
  [0x67, { name: 'keccak256', kind: 'hash', len: 32 }],
  [0xf0, { name: 'append', kind: 'arg' }],
  [0xf1, { name: 'prepend', kind: 'arg' }],
  [0xf2, { name: 'reverse', kind: 'none' }],
  [0xf3, { name: 'hexlify', kind: 'none' }],
]);

const OP_TAG = new Map([...OPS].map(([t, s]) => [s.name, t]));

// Attestation types are 8 raw bytes. Anything not listed parses as 'unknown'.
const ATT_KIND = new Map([[TYPE_PENDING, 'pending'], [TYPE_BITCOIN, 'bitcoin']]);
const ATT_TYPE = new Map([['pending', TYPE_PENDING], ['bitcoin', TYPE_BITCOIN]]);

export function registerAttestationType(typeHex, kind) {
  ATT_KIND.set(typeHex, kind);
  ATT_TYPE.set(kind, typeHex);
}

function applyOp(name, arg, msg) {
  switch (name) {
    case 'sha1': return sha1(msg);
    case 'ripemd160': return ripemd160(msg);
    case 'sha256': return sha256(msg);
    case 'keccak256': return keccak256(msg);
    case 'append': {
      const o = new Uint8Array(msg.length + arg.length);
      o.set(msg); o.set(arg, msg.length);
      return o;
    }
    case 'prepend': {
      const o = new Uint8Array(msg.length + arg.length);
      o.set(arg); o.set(msg, arg.length);
      return o;
    }
    case 'reverse': return msg.slice().reverse();
    case 'hexlify': return utf8Encode(toHex(msg));
    default: throw new OtsError(`bad op ${name}`);
  }
}

// ------------------------------------------------------------------- reader
class Reader {
  constructor(b) { this.b = b; this.i = 0; }
  get remaining() { return this.b.length - this.i; }
  u8() { if (this.i >= this.b.length) throw new OtsError('truncated'); return this.b[this.i++]; }
  take(n) {
    if (n > this.remaining) throw new OtsError('truncated');
    const s = this.b.subarray(this.i, this.i + n);
    this.i += n;
    return s;
  }
  varuint() {
    let v = 0, shift = 0, count = 0;
    for (;;) {
      const byte = this.u8();
      if (++count > 9) throw new OtsError('varuint too long');
      v += (byte & 0x7f) * 2 ** shift;
      if (!(byte & 0x80)) return v;
      shift += 7;
    }
  }
  varbytes(max) {
    const n = this.varuint();
    if (n > max) throw new OtsError('varbytes too long');
    return this.take(n);
  }
}

function readOp(r, tag) {
  const spec = OPS.get(tag);
  if (!spec) throw new OtsError(`unknown op tag 0x${tag.toString(16).padStart(2, '0')}`);
  const arg = spec.kind === 'arg' ? r.varbytes(MAX_ARG).slice() : null;
  return { name: spec.name, arg };
}

// ------------------------------------------------------------------- parser
function readAttestation(r, node) {
  const typeHex = toHex(r.take(8));
  const payload = r.varbytes(MAX_ATT_PAYLOAD);
  const kind = ATT_KIND.get(typeHex);
  if (kind === 'pending') node.attestations.push({ attestation: 'pending', uri: utf8Decode(payload) });
  else if (kind === 'bitcoin' || kind === 'litecoin') {
    node.attestations.push({ attestation: kind, height: new Reader(payload).varuint() });
  } else node.attestations.push({ attestation: 'unknown', type: typeHex, raw: payload.slice() });
}

function parseTimestamp(r, msg, depth, budget) {
  if (depth > MAX_DEPTH) throw new OtsError('nesting too deep');
  const node = { msg, attestations: [], children: [] };
  for (;;) {
    if (++budget.n > MAX_NODES) throw new OtsError('too many nodes');
    const tag = r.u8();
    const more = tag === 0xff;
    const branch = more ? r.u8() : tag;
    if (branch === 0x00) {
      readAttestation(r, node);
    } else {
      const op = readOp(r, branch);
      const child = parseTimestamp(r, applyOp(op.name, op.arg, msg), depth + 1, budget);
      node.children.push({ op: op.name, arg: op.arg, next: child });
    }
    if (!more) return node;
  }
}

export function parseOts(bytes) {
  const r = new Reader(toU8(bytes));
  const magic = r.take(MAGIC.length);
  for (let i = 0; i < MAGIC.length; i++) if (magic[i] !== MAGIC[i]) throw new OtsError('bad magic');
  const version = r.varuint();
  if (version !== 1) throw new OtsError(`unsupported version ${version}`);
  const tag = r.u8();
  const spec = OPS.get(tag);
  if (!spec) throw new OtsError(`unknown file hash op tag 0x${tag.toString(16).padStart(2, '0')}`);
  if (spec.kind !== 'hash') throw new OtsError('file hash op is not a hash');
  const fileDigest = toDigest(r.take(spec.len));
  const timestamp = parseTimestamp(r, fileDigest, 0, { n: 0 });
  if (r.remaining !== 0) throw new OtsError(`${r.remaining} trailing bytes`);
  return { fileHashOp: spec.name, fileDigest, fileDigestHex: toHex(fileDigest), timestamp, tree: timestamp };
}

// ------------------------------------------------------------------- walker
export function evaluate(timestamp) {
  const out = [];
  const stack = [timestamp];
  let seen = 0;
  while (stack.length) {
    const node = stack.pop();
    if (++seen > MAX_NODES) throw new OtsError('too many nodes');
    for (const a of node.attestations) {
      const e = { attestation: a.attestation, commitment: node.msg };
      if (a.attestation === 'pending') e.uri = a.uri;
      else if (a.attestation === 'bitcoin' || a.attestation === 'litecoin') e.height = a.height;
      else if (a.attestation === 'unknown') { e.type = a.type; e.raw = a.raw; }
      out.push(e);
    }
    for (const c of node.children) stack.push(c.next);
  }
  return out;
}

export function bitcoinRoots(timestamp) {
  return evaluate(timestamp)
    .filter((e) => e.attestation === 'bitcoin' && e.commitment.length === 32)
    .map((e) => ({ height: e.height, root: e.commitment }));
}

// ---------------------------------------------------------------- serializer
function writeVaruint(out, v) {
  if (!Number.isSafeInteger(v) || v < 0) throw new OtsError('bad varuint');
  do {
    let byte = v % 128;
    v = Math.floor(v / 128);
    if (v > 0) byte |= 0x80;
    out.push(byte);
  } while (v > 0);
}

function writeTimestamp(out, node) {
  const branches = [];
  for (const a of node.attestations) branches.push({ att: a });
  for (const c of node.children) branches.push({ op: c });
  for (let i = 0; i < branches.length; i++) {
    if (i < branches.length - 1) out.push(0xff);
    const b = branches[i];
    if (b.att) {
      out.push(0x00);
      const typeHex = ATT_TYPE.get(b.att.attestation);
      if (!typeHex) throw new OtsError(`cannot serialize attestation ${b.att.attestation}`);
      for (const byte of fromHex(typeHex)) out.push(byte);
      let payload;
      if (b.att.attestation === 'pending') payload = utf8Encode(b.att.uri);
      else if (b.att.attestation === 'unknown') payload = b.att.raw;
      else { payload = []; writeVaruint(payload, b.att.height); }
      writeVaruint(out, payload.length);
      for (const byte of payload) out.push(byte);
    } else {
      out.push(OP_TAG.get(b.op.op));
      if (b.op.arg) { writeVaruint(out, b.op.arg.length); for (const byte of b.op.arg) out.push(byte); }
      writeTimestamp(out, b.op.next);
    }
  }
}

export function serializeOts(parsed) {
  const out = [];
  for (const b of MAGIC) out.push(b);
  writeVaruint(out, 1);
  out.push(OP_TAG.get(parsed.fileHashOp));
  for (const b of parsed.fileDigest) out.push(b);
  writeTimestamp(out, parsed.timestamp ?? parsed.tree);
  return Uint8Array.from(out);
}

// ------------------------------------------------------------------ self test
export function selfTest() {
  const H = (name, inp, want) => {
    const got = toHex(hashes[name](utf8Encode(inp)));
    return { name: `${name}("${inp.slice(0, 24)}")`, ok: got === want, got, want };
  };
  const cases = [
    H('sha256', '', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
    H('sha256', 'abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'),
    H('sha256', 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq', '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'),
    H('sha256', 'abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu', 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0'),
    H('sha1', '', 'da39a3ee5e6b4b0d3255bfef95601890afd80709'),
    H('sha1', 'abc', 'a9993e364706816aba3e25717850c26c9cd0d89d'),
    H('ripemd160', '', '9c1185a5c5e9fc54612808977ee8f548b2258d31'),
    H('ripemd160', 'abc', '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc'),
    H('ripemd160', 'message digest', '5d0689ef49d2fae572b881b123a85ffa21595f36'),
    H('keccak256', '', 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'),
    H('keccak256', 'abc', '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45'),
  ];

  const digest = fromHex('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
  const att = (kind, v) => ({ attestation: kind, uri: v });
  const leaf = (msg, a) => ({ msg, attestations: [a], children: [] });

  const pend = { fileHashOp: 'sha256', fileDigest: digest, timestamp: leaf(digest, att('pending', 'https://a.pool.opentimestamps.org')) };
  try {
    const re = parseOts(serializeOts(pend));
    const ev = evaluate(re.timestamp);
    cases.push({ name: 'pending round-trip', ok: ev.length === 1 && ev[0].attestation === 'pending' && ev[0].uri === 'https://a.pool.opentimestamps.org' && toHex(ev[0].commitment) === toHex(digest) });
  } catch (e) { cases.push({ name: 'pending round-trip', ok: false, got: e.message }); }

  const leafMsg = sha256(applyOp('append', utf8Encode('x'), digest));
  const bt = { fileHashOp: 'sha256', fileDigest: digest, timestamp: { msg: digest, attestations: [], children: [{ op: 'append', arg: utf8Encode('x'), next: leaf(leafMsg, { attestation: 'bitcoin', height: 800000 }) }] } };
  try {
    const re = parseOts(serializeOts(bt));
    const roots = bitcoinRoots(re.timestamp);
    cases.push({ name: 'bitcoin root extraction', ok: roots.length === 1 && roots[0].height === 800000 && toHex(roots[0].root) === toHex(leafMsg) });
  } catch (e) { cases.push({ name: 'bitcoin root extraction', ok: false, got: e.message }); }

  const d1 = sha256(digest), d2 = sha256(sha256(digest));
  const fk = { fileHashOp: 'sha256', fileDigest: digest, timestamp: { msg: digest, attestations: [], children: [
    { op: 'sha256', arg: null, next: leaf(d1, att('pending', 'u1')) },
    { op: 'sha256', arg: null, next: leaf(d2, att('pending', 'u2')) },
  ] } };
  try {
    const re = parseOts(serializeOts(fk));
    const ev = evaluate(re.timestamp);
    cases.push({ name: 'two branches', ok: ev.length === 2 && ev.map((e) => e.uri).sort().join() === 'u1,u2' });
  } catch (e) { cases.push({ name: 'two branches', ok: false, got: e.message }); }

  const two = { fileHashOp: 'sha256', fileDigest: digest, timestamp: { msg: digest, attestations: [att('pending', 'p1'), att('pending', 'p2')], children: [] } };
  try {
    const re = parseOts(serializeOts(two));
    const ev = evaluate(re.timestamp);
    cases.push({ name: 'two attestations on one node', ok: ev.length === 2 && ev.map((e) => e.uri).sort().join() === 'p1,p2' });
  } catch (e) { cases.push({ name: 'two attestations on one node', ok: false, got: e.message }); }

  const hx = utf8Encode(toHex(digest));
  const tr = { fileHashOp: 'sha256', fileDigest: digest, timestamp: { msg: digest, attestations: [], children: [{ op: 'hexlify', arg: null, next: { msg: hx, attestations: [], children: [{ op: 'reverse', arg: null, next: leaf(hx.slice().reverse(), att('pending', 'h')) }] } }] } };
  try {
    const re = parseOts(serializeOts(tr));
    const ev = evaluate(re.timestamp);
    cases.push({ name: 'hexlify + reverse', ok: ev.length === 1 && toHex(ev[0].commitment) === toHex(hx.slice().reverse()) });
  } catch (e) { cases.push({ name: 'hexlify + reverse', ok: false, got: e.message }); }

  const unk = { fileHashOp: 'sha256', fileDigest: digest, timestamp: { msg: digest, attestations: [{ attestation: 'unknown', type: 'deadbeefdeadbeef', raw: Uint8Array.from([1, 2, 3]) }], children: [] } };
  try {
    const re = parseOts(serializeOts(unk));
    const ev = evaluate(re.timestamp);
    cases.push({ name: 'unknown attestation type', ok: ev.length === 1 && ev[0].attestation === 'unknown' && ev[0].type === 'deadbeefdeadbeef' && toHex(ev[0].raw) === '010203' });
  } catch (e) { cases.push({ name: 'unknown attestation type', ok: false, got: e.message }); }

  // sha1 file hash op, 20-byte digest
  const s1 = sha1(utf8Encode('f'));
  try {
    const re = parseOts(Uint8Array.from([...MAGIC, 1, 0x02, ...s1, 0x00, ...fromHex(TYPE_PENDING), 0x01, 0x75]));
    cases.push({ name: 'sha1 file op 20-byte digest', ok: re.fileHashOp === 'sha1' && re.fileDigest.length === 20 && evaluate(re.timestamp)[0].uri === 'u' });
  } catch (e) { cases.push({ name: 'sha1 file op 20-byte digest', ok: false, got: e.message }); }

  const bad = (name, bytes) => {
    try { parseOts(bytes); cases.push({ name, ok: false, got: 'accepted' }); }
    catch { cases.push({ name, ok: true }); }
  };
  bad('bad magic rejected', Uint8Array.from([1, 2, 3]));
  bad('bad version rejected', Uint8Array.from([...MAGIC, 2, 0x08, ...digest]));
  bad('truncated digest rejected', Uint8Array.from([...MAGIC, 1, 0x08, 1, 2, 3]));
  bad('unknown op rejected', Uint8Array.from([...MAGIC, 1, 0x08, ...digest, 0x99]));
  bad('truncated attestation rejected', Uint8Array.from([...MAGIC, 1, 0x08, ...digest, 0x00, 1, 2]));
  bad('dangling 0xff rejected', Uint8Array.from([...MAGIC, 1, 0x08, ...digest, 0xff]));

  const pass = cases.filter((c) => c.ok).length;
  return { pass, fail: cases.length - pass, total: cases.length, cases };
}

// ----------------------------------------------------------------------- CLI
async function isEntryPoint() {
  if (typeof process === 'undefined' || !process.argv || typeof process.argv[1] !== 'string') return false;
  if (typeof import.meta.url !== 'string' || !import.meta.url.startsWith('file:')) return false;
  const { pathToFileURL } = await import('node:url');
  const self = import.meta.url;
  if (self === pathToFileURL(process.argv[1]).href) return true;
  try {
    const { realpathSync } = await import('node:fs');
    return self === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch { return false; }
}

if (await isEntryPoint()) {
  const { readFileSync } = await import('node:fs');
  const args = process.argv.slice(2);
  const mode = args[0];
  const print = (s) => process.stdout.write(s + '\n');
  process.exitCode = 0;
  try {
    if (mode === '--selftest') {
      const r = selfTest();
      for (const c of r.cases) print(`${c.ok ? 'pass' : 'FAIL'}  ${c.name}${c.ok ? '' : `  got=${c.got} want=${c.want}`}`);
      print(`\n${r.pass}/${r.total} passed, ${r.fail} failed`);
      process.exitCode = r.fail === 0 ? 0 : 1;
    } else if (mode === '--info') {
      const p = parseOts(readFileSync(args[1]));
      print(JSON.stringify({ fileHashOp: p.fileHashOp, fileDigest: p.fileDigestHex, attestations: evaluate(p.timestamp).map((e) => ({ ...e, commitment: toHex(e.commitment) })) }, null, 2));
    } else if (mode === '--digest') {
      print(toHex(hashes[args[2] ?? 'sha256'](readFileSync(args[1]))));
    } else if (mode === '--selfdigest') {
      const src = readFileSync(new URL(import.meta.url));
      print(`sha256=${toHex(sha256(src))} bytes=${src.length}`);
    } else {
      print('usage: otsverify.mjs --selftest | --info FILE.ots | --digest FILE [algo] | --selfdigest');
      process.exitCode = 2;
    }
  } catch (e) {
    print(`${e.name}: ${e.message}`);
    process.exitCode = 2;
  }
}

export default { parseOts, evaluate, serializeOts, bitcoinRoots, selfTest, hashes, OtsError, MAGIC };
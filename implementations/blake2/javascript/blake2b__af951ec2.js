/**
 * @fileoverview blake2b.js — Pure JavaScript BLAKE2b implementation.
 * Standalone, zero dependencies. Uses Uint32Array for 64-bit words.
 * Reference: RFC 7693
 */

/** @type {Uint32Array} BLAKE2b IV — 16 32-bit words (8 64-bit halves) */
const BLAKE2B_IV = new Uint32Array([
  0xf3bcc908, 0x6a09e667, 0x84caa73b, 0xbb67ae85,
  0xfe94f82b, 0x3c6ef372, 0x5f1d36f1, 0xa54ff53a,
  0xade682d1, 0x510e527f, 0x2b3e6c1f, 0x9b05688c,
  0xfb41bd6b, 0x1f83d9ab, 0x137e2179, 0x5be0cd19
]);

/** @type {number[][]} BLAKE2b sigma permutation (12 rounds) */
const BLAKE2B_SIGMA = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3]
];

/** 64-bit addition: v[idx..idx+1] += x0..x1 */
function blake2bAdd64(v, idx, x0, x1) {
  const lo = (v[idx] >>> 0) + (x0 >>> 0);
  v[idx] = lo >>> 0;
  v[idx + 1] = (v[idx + 1] + x1 + (lo > 0xffffffff ? 1 : 0)) >>> 0;
}

/** 64-bit right rotation: v[idx..idx+1] >>>= n */
function blake2bRotr64(v, idx, n) {
  const a = v[idx + 1], b = v[idx];
  let lo, hi;
  if (n === 32) { lo = a; hi = b; }
  else if (n < 32) {
    lo = (b >>> n) | (a << (32 - n));
    hi = (a >>> n) | (b << (32 - n));
  } else {
    const m = n - 32;
    lo = (a >>> m) | (b << (32 - m));
    hi = (b >>> m) | (a << (32 - m));
  }
  v[idx] = lo >>> 0;
  v[idx + 1] = hi >>> 0;
}

/** BLAKE2b G function: quarter-round on columns a,b,c,d with message words x,y */
function blake2bG(v, a, b, c, d, x0, x1, y0, y1) {
  blake2bAdd64(v, a, v[b], v[b + 1]); blake2bAdd64(v, a, x0, x1);
  v[d] ^= v[a]; v[d + 1] ^= v[a + 1]; blake2bRotr64(v, d, 32);
  blake2bAdd64(v, c, v[d], v[d + 1]);
  v[b] ^= v[c]; v[b + 1] ^= v[c + 1]; blake2bRotr64(v, b, 24);
  blake2bAdd64(v, a, v[b], v[b + 1]); blake2bAdd64(v, a, y0, y1);
  v[d] ^= v[a]; v[d + 1] ^= v[a + 1]; blake2bRotr64(v, d, 16);
  blake2bAdd64(v, c, v[d], v[d + 1]);
  v[b] ^= v[c]; v[b + 1] ^= v[c + 1]; blake2bRotr64(v, b, 63);
}

/** BLAKE2b F function: compress a single 128-byte block */
function blake2bCompress(ctx, last) {
  const v = new Uint32Array(32);
  for (let i = 0; i < 16; i++) { v[i] = ctx.h[i]; v[i + 16] = BLAKE2B_IV[i]; }
  v[24] ^= ctx.tLo; v[25] ^= ctx.tHi;
  if (last) { v[28] ^= 0xffffffff; v[29] ^= 0xffffffff; }
  const m = new Uint32Array(32);
  for (let i = 0; i < 32; i++) {
    m[i] = ctx.b[i * 4] | (ctx.b[i * 4 + 1] << 8) | (ctx.b[i * 4 + 2] << 16) | (ctx.b[i * 4 + 3] << 24);
  }
  for (let r = 0; r < 12; r++) {
    const s = BLAKE2B_SIGMA[r];
    blake2bG(v, 0, 8, 16, 24, m[s[0] * 2], m[s[0] * 2 + 1], m[s[1] * 2], m[s[1] * 2 + 1]);
    blake2bG(v, 2, 10, 18, 26, m[s[2] * 2], m[s[2] * 2 + 1], m[s[3] * 2], m[s[3] * 2 + 1]);
    blake2bG(v, 4, 12, 20, 28, m[s[4] * 2], m[s[4] * 2 + 1], m[s[5] * 2], m[s[5] * 2 + 1]);
    blake2bG(v, 6, 14, 22, 30, m[s[6] * 2], m[s[6] * 2 + 1], m[s[7] * 2], m[s[7] * 2 + 1]);
    blake2bG(v, 0, 10, 20, 30, m[s[8] * 2], m[s[8] * 2 + 1], m[s[9] * 2], m[s[9] * 2 + 1]);
    blake2bG(v, 2, 12, 22, 24, m[s[10] * 2], m[s[10] * 2 + 1], m[s[11] * 2], m[s[11] * 2 + 1]);
    blake2bG(v, 4, 14, 16, 26, m[s[12] * 2], m[s[12] * 2 + 1], m[s[13] * 2], m[s[13] * 2 + 1]);
    blake2bG(v, 6, 8, 18, 28, m[s[14] * 2], m[s[14] * 2 + 1], m[s[15] * 2], m[s[15] * 2 + 1]);
  }
  for (let i = 0; i < 16; i++) ctx.h[i] ^= v[i] ^ v[i + 16];
}

/**
 * Compute BLAKE2b digest of input bytes.
 * @param {Uint8Array} input
 * @param {number} [outLen=64] — Output length in bytes (1..64)
 * @returns {Uint8Array}
 */
export function blake2b(input, outLen) {
  outLen = outLen || 64;
  const ctx = {
    b: new Uint8Array(128),
    h: new Uint32Array(16),
    tLo: 0, tHi: 0, c: 0, outLen: outLen
  };
  for (let i = 0; i < 16; i++) ctx.h[i] = BLAKE2B_IV[i];
  ctx.h[0] ^= 0x01010000 ^ outLen;
  for (let i = 0; i < input.length; i++) {
    if (ctx.c === 128) {
      ctx.tLo = (ctx.tLo + ctx.c) >>> 0;
      if (ctx.tLo < ctx.c) ctx.tHi = (ctx.tHi + 1) >>> 0;
      blake2bCompress(ctx, false); ctx.c = 0;
    }
    ctx.b[ctx.c++] = input[i];
  }
  ctx.tLo = (ctx.tLo + ctx.c) >>> 0;
  if (ctx.tLo < ctx.c) ctx.tHi = (ctx.tHi + 1) >>> 0;
  while (ctx.c < 128) ctx.b[ctx.c++] = 0;
  blake2bCompress(ctx, true);
  const out = new Uint8Array(outLen);
  for (let i = 0; i < outLen; i++) {
    out[i] = (ctx.h[i >> 2] >>> (8 * (i & 3))) & 0xff;
  }
  return out;
}

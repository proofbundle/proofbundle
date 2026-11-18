// From-scratch BLAKE2b and BLAKE2s (RFC 7693), no external crypto library.
// No WebCrypto, no noble-*, no node:crypto (that's for the *.test.mjs files
// only, as an independent yardstick).
//
// BLAKE2b: 64-bit words, BigInt with a 64-bit mask (as crypto-core/keccak.mjs
//          uses for Keccak-f[1600]'s 64-bit lanes), 128-byte blocks, up to
//          64-byte output, up to 64-byte key. IV equals SHA-512's H0.
// BLAKE2s: 32-bit words, Uint32Array with `>>> 0` (as crypto-core/sha256.mjs
//          uses for SHA-256), 64-byte blocks, up to 32-byte output, up to
//          32-byte key. IV equals SHA-256's H0 (RFC 7693 section 2.6).

const MASK64 = (1n << 64n) - 1n;

// Message word permutation schedule, shared by both variants (RFC 7693
// section 2.7). BLAKE2b runs 12 rounds indexed by `round % 10` (rounds 10-11
// reuse SIGMA[0..1]); BLAKE2s runs exactly 10 rounds, SIGMA[0..9] in order.
const SIGMA = [
  [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [ 7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [ 9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [ 2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [ 6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
];

// Split (key || message) into zero-padded `bb`-byte blocks per RFC 7693
// section 3.3: a padded key block (if any) comes first, then the message
// split into full blocks with the last one zero-padded. An unkeyed empty
// message still yields exactly one all-zero block.
function buildBlocks(msg, key, bb) {
  const kk = key ? key.length : 0;
  const ll = msg.length;
  const blocks = [];
  if (kk > 0) {
    const kb = new Uint8Array(bb);
    kb.set(key);
    blocks.push(kb);
  }
  if (ll > 0) {
    for (let off = 0; off < ll; off += bb) {
      const blk = new Uint8Array(bb);
      blk.set(msg.subarray(off, Math.min(off + bb, ll)));
      blocks.push(blk);
    }
  } else if (kk === 0) {
    blocks.push(new Uint8Array(bb));
  }
  return blocks;
}

/* --------------------------- BLAKE2b (64-bit) --------------------------- */

const IV_B = [
  0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
];

function rotr64(x, n) {
  const bn = BigInt(n);
  return ((x >> bn) | (x << (64n - bn))) & MASK64;
}

// Mixing function G (RFC 7693 section 3.1) with BLAKE2b's rotation
// constants (R1,R2,R3,R4) = (32,24,16,63) (section 2.1).
function gB(v, a, b, c, d, x, y) {
  v[a] = (v[a] + v[b] + x) & MASK64;
  v[d] = rotr64(v[d] ^ v[a], 32);
  v[c] = (v[c] + v[d]) & MASK64;
  v[b] = rotr64(v[b] ^ v[c], 24);
  v[a] = (v[a] + v[b] + y) & MASK64;
  v[d] = rotr64(v[d] ^ v[a], 16);
  v[c] = (v[c] + v[d]) & MASK64;
  v[b] = rotr64(v[b] ^ v[c], 63);
}

function bytesToWordsLE64(block) {
  const dv = new DataView(block.buffer, block.byteOffset, block.byteLength);
  const words = new Array(16);
  for (let i = 0; i < 16; i++) words[i] = dv.getBigUint64(i * 8, true);
  return words;
}

// Compression function F (RFC 7693 section 3.2), 12 rounds for BLAKE2b.
function fB(h, m, t, isLast) {
  const v = new Array(16);
  for (let i = 0; i < 8; i++) v[i] = h[i];
  for (let i = 0; i < 8; i++) v[8 + i] = IV_B[i];
  v[12] ^= t & MASK64;
  v[13] ^= (t >> 64n) & MASK64;
  if (isLast) v[14] ^= MASK64;

  for (let round = 0; round < 12; round++) {
    const s = SIGMA[round % 10];
    gB(v, 0, 4, 8, 12, m[s[0]], m[s[1]]);
    gB(v, 1, 5, 9, 13, m[s[2]], m[s[3]]);
    gB(v, 2, 6, 10, 14, m[s[4]], m[s[5]]);
    gB(v, 3, 7, 11, 15, m[s[6]], m[s[7]]);
    gB(v, 0, 5, 10, 15, m[s[8]], m[s[9]]);
    gB(v, 1, 6, 11, 12, m[s[10]], m[s[11]]);
    gB(v, 2, 7, 8, 13, m[s[12]], m[s[13]]);
    gB(v, 3, 4, 9, 14, m[s[14]], m[s[15]]);
  }
  for (let i = 0; i < 8; i++) h[i] = (h[i] ^ v[i] ^ v[8 + i]) & MASK64;
}

function blake2bCore(msg, key, outLen) {
  if (typeof msg === 'string') msg = new TextEncoder().encode(msg);
  if (!Number.isInteger(outLen) || outLen < 1 || outLen > 64) {
    throw new RangeError('blake2b outLen must be an integer in 1..64');
  }
  if (key && key.length > 64) throw new RangeError('blake2b key must be <= 64 bytes');

  const bb = 128;
  const kk = key ? key.length : 0;
  const ll = msg.length;
  const blocks = buildBlocks(msg, key, bb);

  const h = IV_B.slice();
  // Parameter block p[0] (RFC 7693 section 2.5): digest length, key length,
  // fanout=1, depth=1, mixed into h[0] as a little-endian 64-bit word.
  h[0] ^= 0x01010000n ^ (BigInt(kk) << 8n) ^ BigInt(outLen);

  const dd = blocks.length;
  for (let i = 0; i < dd - 1; i++) {
    fB(h, bytesToWordsLE64(blocks[i]), BigInt((i + 1) * bb), false);
  }
  const t = kk === 0 ? BigInt(ll) : BigInt(ll) + BigInt(bb);
  fB(h, bytesToWordsLE64(blocks[dd - 1]), t, true);

  const out = new Uint8Array(64);
  const dv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) dv.setBigUint64(i * 8, h[i], true);
  return out.slice(0, outLen);
}

/* --------------------------- BLAKE2s (32-bit) --------------------------- */

const IV_S = Uint32Array.from([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

function rotr32(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }

// Mixing function G with BLAKE2s's rotation constants (R1,R2,R3,R4) =
// (16,12,8,7) (RFC 7693 section 2.1).
function gS(v, a, b, c, d, x, y) {
  v[a] = (v[a] + v[b] + x) >>> 0;
  v[d] = rotr32(v[d] ^ v[a], 16);
  v[c] = (v[c] + v[d]) >>> 0;
  v[b] = rotr32(v[b] ^ v[c], 12);
  v[a] = (v[a] + v[b] + y) >>> 0;
  v[d] = rotr32(v[d] ^ v[a], 8);
  v[c] = (v[c] + v[d]) >>> 0;
  v[b] = rotr32(v[b] ^ v[c], 7);
}

function bytesToWordsLE32(block) {
  const dv = new DataView(block.buffer, block.byteOffset, block.byteLength);
  const words = new Uint32Array(16);
  for (let i = 0; i < 16; i++) words[i] = dv.getUint32(i * 4, true);
  return words;
}

// Compression function F, 10 rounds for BLAKE2s. The byte counter t is kept
// as a BigInt (RFC 7693 allows input lengths up to 2**64 even for BLAKE2s)
// and narrowed to two 32-bit words only when mixed into the state.
function fS(h, m, t, isLast) {
  const v = new Uint32Array(16);
  for (let i = 0; i < 8; i++) v[i] = h[i];
  for (let i = 0; i < 8; i++) v[8 + i] = IV_S[i];
  const t0 = Number(t & 0xffffffffn) >>> 0;
  const t1 = Number((t >> 32n) & 0xffffffffn) >>> 0;
  v[12] = (v[12] ^ t0) >>> 0;
  v[13] = (v[13] ^ t1) >>> 0;
  if (isLast) v[14] = ~v[14] >>> 0;

  for (let round = 0; round < 10; round++) {
    const s = SIGMA[round % 10];
    gS(v, 0, 4, 8, 12, m[s[0]], m[s[1]]);
    gS(v, 1, 5, 9, 13, m[s[2]], m[s[3]]);
    gS(v, 2, 6, 10, 14, m[s[4]], m[s[5]]);
    gS(v, 3, 7, 11, 15, m[s[6]], m[s[7]]);
    gS(v, 0, 5, 10, 15, m[s[8]], m[s[9]]);
    gS(v, 1, 6, 11, 12, m[s[10]], m[s[11]]);
    gS(v, 2, 7, 8, 13, m[s[12]], m[s[13]]);
    gS(v, 3, 4, 9, 14, m[s[14]], m[s[15]]);
  }
  for (let i = 0; i < 8; i++) h[i] = (h[i] ^ v[i] ^ v[8 + i]) >>> 0;
}

function blake2sCore(msg, key, outLen) {
  if (typeof msg === 'string') msg = new TextEncoder().encode(msg);
  if (!Number.isInteger(outLen) || outLen < 1 || outLen > 32) {
    throw new RangeError('blake2s outLen must be an integer in 1..32');
  }
  if (key && key.length > 32) throw new RangeError('blake2s key must be <= 32 bytes');

  const bb = 64;
  const kk = key ? key.length : 0;
  const ll = msg.length;
  const blocks = buildBlocks(msg, key, bb);

  const h = IV_S.slice();
  h[0] = (h[0] ^ 0x01010000 ^ (kk << 8) ^ outLen) >>> 0;

  const dd = blocks.length;
  for (let i = 0; i < dd - 1; i++) {
    fS(h, bytesToWordsLE32(blocks[i]), BigInt((i + 1) * bb), false);
  }
  const t = kk === 0 ? BigInt(ll) : BigInt(ll) + BigInt(bb);
  fS(h, bytesToWordsLE32(blocks[dd - 1]), t, true);

  const out = new Uint8Array(32);
  const dv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) dv.setUint32(i * 4, h[i], true);
  return out.slice(0, outLen);
}

/* -------------------------------- Exports -------------------------------- */

export function blake2b(msg, outLen = 64) {
  return blake2bCore(msg, null, outLen);
}
export function blake2bKeyed(msg, key, outLen = 64) {
  if (typeof key === 'string') key = new TextEncoder().encode(key);
  return blake2bCore(msg, key, outLen);
}
export function blake2s(msg, outLen = 32) {
  return blake2sCore(msg, null, outLen);
}
export function blake2sKeyed(msg, key, outLen = 32) {
  if (typeof key === 'string') key = new TextEncoder().encode(key);
  return blake2sCore(msg, key, outLen);
}

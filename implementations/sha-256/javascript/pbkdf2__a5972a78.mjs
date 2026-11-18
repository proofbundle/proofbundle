// pbkdf2.mjs -- PBKDF2 (RFC 8018 section 5.2) with HMAC-SHA256 / HMAC-SHA512.
// SHA-256 and SHA-512 implemented from scratch per FIPS 180-4.
// No dependencies, no crypto.subtle, no node:crypto, no WebAssembly.
// Inputs and outputs are Uint8Array.  HMAC inner/outer pad-block states are
// compressed exactly once up front; each PBKDF2 iteration clones the midstate.
// Constant-time w.r.t. secret material: the password influences only data
// values (XOR into pads, hash input), never control flow or table indexes.
// Export: pbkdf2(hashName, password, salt, iterations, dkLen) -> Uint8Array.
// hashName accepts "sha256" / "sha-256" / "sha512" / "sha-512" (case-insensitive).

const TWO32 = 4294967296;

// ------------------------------ SHA-256 ------------------------------------

const H256_IV = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

// K: first 32 bits of the fractional parts of the cube roots of the first
// 64 primes (FIPS 180-4 section 4.2.2).
const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const W256 = new Uint32Array(64); // scratch schedule

function sha256Compress(h, p, off) {
  for (let i = 0; i < 16; i++) {
    const j = off + (i << 2);
    W256[i] = ((p[j] << 24) | (p[j + 1] << 16) | (p[j + 2] << 8) | p[j + 3]) >>> 0;
  }
  for (let i = 16; i < 64; i++) {
    const x = W256[i - 15], y = W256[i - 2];
    const s0 = (((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3));
    const s1 = (((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10));
    W256[i] = (W256[i - 16] + s0 + W256[i - 7] + s1) | 0;
  }
  let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
  for (let i = 0; i < 64; i++) {
    const S1 = (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7)));
    const ch = (e & f) ^ (~e & g);
    const t1 = (hh + S1 + ch + K256[i] + W256[i]) | 0;
    const S0 = (((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10)));
    const maj = (a & b) ^ (a & c) ^ (b & c);
    const t2 = (S0 + maj) | 0;
    hh = g; g = f; f = e; e = (d + t1) | 0;
    d = c; c = b; b = a; a = (t1 + t2) | 0;
  }
  h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
  h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
}

class Sha256Ctx {
  constructor(midstate = null, bytesCompressed = 0) {
    this.h = new Uint32Array(8);
    if (midstate !== null) this.h.set(midstate); else this.h.set(H256_IV);
    this.buf = new Uint8Array(64);
    this.bufLen = 0;
    this.done = bytesCompressed;
  }
  update(bytes) {
    let off = 0;
    const len = bytes.length;
    if (this.bufLen > 0) {
      const take = Math.min(64 - this.bufLen, len);
      this.buf.set(bytes.subarray(0, take), this.bufLen);
      this.bufLen += take; off = take;
      if (this.bufLen === 64) {
        sha256Compress(this.h, this.buf, 0);
        this.bufLen = 0; this.done += 64;
      }
    }
    while (off + 64 <= len) {
      sha256Compress(this.h, bytes, off);
      off += 64; this.done += 64;
    }
    if (off < len) {
      this.buf.set(bytes.subarray(off), 0);
      this.bufLen = len - off;
    }
    return this;
  }
  digest() {
    const totalBytes = this.done + this.bufLen;
    this.buf[this.bufLen++] = 0x80;
    if (this.bufLen > 56) {
      this.buf.fill(0, this.bufLen, 64);
      sha256Compress(this.h, this.buf, 0);
      this.bufLen = 0;
    }
    this.buf.fill(0, this.bufLen, 56);
    const bits = totalBytes * 8;
    const lo = bits % TWO32, hi = Math.floor(bits / TWO32);
    this.buf[56] = (hi >>> 24) & 255; this.buf[57] = (hi >>> 16) & 255;
    this.buf[58] = (hi >>> 8) & 255;  this.buf[59] = hi & 255;
    this.buf[60] = (lo >>> 24) & 255; this.buf[61] = (lo >>> 16) & 255;
    this.buf[62] = (lo >>> 8) & 255;  this.buf[63] = lo & 255;
    sha256Compress(this.h, this.buf, 0);
    const out = new Uint8Array(32);
    for (let i = 0; i < 8; i++) {
      out[(i << 2)] = (this.h[i] >>> 24) & 255;
      out[(i << 2) + 1] = (this.h[i] >>> 16) & 255;
      out[(i << 2) + 2] = (this.h[i] >>> 8) & 255;
      out[(i << 2) + 3] = this.h[i] & 255;
    }
    return out;
  }
}

// ------------------------------ SHA-512 ------------------------------------
// 64-bit words carried as (hi, lo) uint32 pairs; 64-bit addition done in
// exact double arithmetic with an explicit carry: sum of k values < 2^32 is
// < 2^37, well inside the 2^53 exact-integer range.

const H512_IV = new Uint32Array([
  0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b,
  0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1,
  0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f,
  0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179,
]);

// K: first 64 bits of the fractional parts of the square roots of the first
// 80 primes (FIPS 180-4 section 4.2.3), as (hi, lo) pairs.
const K512 = new Uint32Array([
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd, 0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019, 0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe, 0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1, 0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3, 0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483, 0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210, 0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725, 0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926, 0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8, 0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001, 0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910, 0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53, 0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb, 0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60, 0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9, 0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207, 0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6, 0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493, 0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a, 0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817,
]);

const Wh = new Uint32Array(80); // scratch schedule (high words)
const Wl = new Uint32Array(80); // scratch schedule (low words)

function sha512Compress(h, p, off) {
  for (let i = 0; i < 16; i++) {
    const j = off + (i << 3);
    Wh[i] = ((p[j] << 24) | (p[j + 1] << 16) | (p[j + 2] << 8) | p[j + 3]) >>> 0;
    Wl[i] = ((p[j + 4] << 24) | (p[j + 5] << 16) | (p[j + 6] << 8) | p[j + 7]) >>> 0;
  }
  for (let i = 16; i < 80; i++) {
    // sigma1(x) = ROTR19(x) ^ ROTR61(x) ^ SHR6(x)
    const xh = Wh[i - 2], xl = Wl[i - 2];
    const s1h = (((xh >>> 19) | (xl << 13)) ^ ((xl >>> 29) | (xh << 3)) ^ (xh >>> 6)) >>> 0;
    const s1l = (((xl >>> 19) | (xh << 13)) ^ ((xh >>> 29) | (xl << 3)) ^ ((xl >>> 6) | (xh << 26))) >>> 0;
    // sigma0(x) = ROTR1(x) ^ ROTR8(x) ^ SHR7(x)
    const yh = Wh[i - 15], yl = Wl[i - 15];
    const s0h = (((yh >>> 1) | (yl << 31)) ^ ((yh >>> 8) | (yl << 24)) ^ (yh >>> 7)) >>> 0;
    const s0l = (((yl >>> 1) | (yh << 31)) ^ ((yl >>> 8) | (yh << 24)) ^ ((yl >>> 7) | (yh << 25))) >>> 0;
    // W[i] = sigma1(W[i-2]) + W[i-7] + sigma0(W[i-15]) + W[i-16]
    let lo = Wl[i - 16] + s0l + Wl[i - 7] + s1l;
    let hi = Wh[i - 16] + s0h + Wh[i - 7] + s1h + Math.floor(lo / TWO32);
    Wh[i] = hi % TWO32;
    Wl[i] = lo % TWO32;
  }
  let aH = h[0], aL = h[1], bH = h[2], bL = h[3], cH = h[4], cL = h[5], dH = h[6], dL = h[7];
  let eH = h[8], eL = h[9], fH = h[10], fL = h[11], gH = h[12], gL = h[13], hH = h[14], hL = h[15];
  for (let i = 0; i < 80; i++) {
    // Sigma1(e) = ROTR14(e) ^ ROTR18(e) ^ ROTR41(e)
    const S1h = (((eH >>> 14) | (eL << 18)) ^ ((eH >>> 18) | (eL << 14)) ^ ((eL >>> 9) | (eH << 23))) >>> 0;
    const S1l = (((eL >>> 14) | (eH << 18)) ^ ((eL >>> 18) | (eH << 14)) ^ ((eH >>> 9) | (eL << 23))) >>> 0;
    // Ch(e, f, g)
    const chH = ((eH & fH) ^ (~eH & gH)) >>> 0;
    const chL = ((eL & fL) ^ (~eL & gL)) >>> 0;
    // T1 = h + Sigma1(e) + Ch(e,f,g) + K[i] + W[i]
    let t1L = hL + S1l + chL + K512[(i << 1) + 1] + Wl[i];
    let t1H = hH + S1h + chH + K512[i << 1] + Wh[i] + Math.floor(t1L / TWO32);
    t1L = t1L % TWO32; t1H = t1H % TWO32;
    // Sigma0(a) = ROTR28(a) ^ ROTR34(a) ^ ROTR39(a)
    const S0h = (((aH >>> 28) | (aL << 4)) ^ ((aL >>> 2) | (aH << 30)) ^ ((aL >>> 7) | (aH << 25))) >>> 0;
    const S0l = (((aL >>> 28) | (aH << 4)) ^ ((aH >>> 2) | (aL << 30)) ^ ((aH >>> 7) | (aL << 25))) >>> 0;
    // Maj(a, b, c)
    const majH = ((aH & bH) ^ (aH & cH) ^ (bH & cH)) >>> 0;
    const majL = ((aL & bL) ^ (aL & cL) ^ (bL & cL)) >>> 0;
    // T2 = Sigma0(a) + Maj(a,b,c)
    let t2L = S0l + majL;
    let t2H = S0h + majH + Math.floor(t2L / TWO32);
    t2L = t2L % TWO32; t2H = t2H % TWO32;
    // new e = d + T1 ; new a = T1 + T2
    let sL = dL + t1L, sH = dH + t1H + Math.floor(sL / TWO32);
    const nEH = sH % TWO32, nEL = sL % TWO32;
    sL = t1L + t2L; sH = t1H + t2H + Math.floor(sL / TWO32);
    const nAH = sH % TWO32, nAL = sL % TWO32;
    const oldEH = eH, oldEL = eL;
    hH = gH; hL = gL;
    gH = fH; gL = fL;
    fH = oldEH; fL = oldEL;
    eH = nEH; eL = nEL;
    dH = cH; dL = cL;
    cH = bH; cL = bL;
    bH = aH; bL = aL;
    aH = nAH; aL = nAL;
  }
  let sL = h[1] + aL, sH = h[0] + aH + Math.floor(sL / TWO32);
  h[0] = sH % TWO32; h[1] = sL % TWO32;
  sL = h[3] + bL; sH = h[2] + bH + Math.floor(sL / TWO32);
  h[2] = sH % TWO32; h[3] = sL % TWO32;
  sL = h[5] + cL; sH = h[4] + cH + Math.floor(sL / TWO32);
  h[4] = sH % TWO32; h[5] = sL % TWO32;
  sL = h[7] + dL; sH = h[6] + dH + Math.floor(sL / TWO32);
  h[6] = sH % TWO32; h[7] = sL % TWO32;
  sL = h[9] + eL; sH = h[8] + eH + Math.floor(sL / TWO32);
  h[8] = sH % TWO32; h[9] = sL % TWO32;
  sL = h[11] + fL; sH = h[10] + fH + Math.floor(sL / TWO32);
  h[10] = sH % TWO32; h[11] = sL % TWO32;
  sL = h[13] + gL; sH = h[12] + gH + Math.floor(sL / TWO32);
  h[12] = sH % TWO32; h[13] = sL % TWO32;
  sL = h[15] + hL; sH = h[14] + hH + Math.floor(sL / TWO32);
  h[14] = sH % TWO32; h[15] = sL % TWO32;
}

class Sha512Ctx {
  constructor(midstate = null, bytesCompressed = 0) {
    this.h = new Uint32Array(16); // (hi, lo) pairs
    if (midstate !== null) this.h.set(midstate); else this.h.set(H512_IV);
    this.buf = new Uint8Array(128);
    this.bufLen = 0;
    this.done = bytesCompressed;
  }
  update(bytes) {
    let off = 0;
    const len = bytes.length;
    if (this.bufLen > 0) {
      const take = Math.min(128 - this.bufLen, len);
      this.buf.set(bytes.subarray(0, take), this.bufLen);
      this.bufLen += take; off = take;
      if (this.bufLen === 128) {
        sha512Compress(this.h, this.buf, 0);
        this.bufLen = 0; this.done += 128;
      }
    }
    while (off + 128 <= len) {
      sha512Compress(this.h, bytes, off);
      off += 128; this.done += 128;
    }
    if (off < len) {
      this.buf.set(bytes.subarray(off), 0);
      this.bufLen = len - off;
    }
    return this;
  }
  digest() {
    const totalBytes = this.done + this.bufLen;
    this.buf[this.bufLen++] = 0x80;
    if (this.bufLen > 112) {
      this.buf.fill(0, this.bufLen, 128);
      sha512Compress(this.h, this.buf, 0);
      this.bufLen = 0;
    }
    this.buf.fill(0, this.bufLen, 112);
    // 128-bit big-endian message length in bits; JS-exact totals are < 2^53,
    // so the top 8 bytes are always zero.
    const bits = totalBytes * 8;
    const lo = bits % TWO32, hi = Math.floor(bits / TWO32);
    this.buf[120] = (hi >>> 24) & 255; this.buf[121] = (hi >>> 16) & 255;
    this.buf[122] = (hi >>> 8) & 255;  this.buf[123] = hi & 255;
    this.buf[124] = (lo >>> 24) & 255; this.buf[125] = (lo >>> 16) & 255;
    this.buf[126] = (lo >>> 8) & 255;  this.buf[127] = lo & 255;
    sha512Compress(this.h, this.buf, 0);
    const out = new Uint8Array(64);
    for (let i = 0; i < 8; i++) {
      const hiW = this.h[i << 1], loW = this.h[(i << 1) + 1], base = i << 3;
      out[base] = (hiW >>> 24) & 255;     out[base + 1] = (hiW >>> 16) & 255;
      out[base + 2] = (hiW >>> 8) & 255;  out[base + 3] = hiW & 255;
      out[base + 4] = (loW >>> 24) & 255; out[base + 5] = (loW >>> 16) & 255;
      out[base + 6] = (loW >>> 8) & 255;  out[base + 7] = loW & 255;
    }
    return out;
  }
}

// ------------------------------ PBKDF2 -------------------------------------

const ALGS = {
  sha256: { blockSize: 64, hashLen: 32, create: (ms, done) => new Sha256Ctx(ms, done) },
  sha512: { blockSize: 128, hashLen: 64, create: (ms, done) => new Sha512Ctx(ms, done) },
};

function normalizeHashName(name) {
  const key = String(name).toLowerCase().replace(/-/g, "");
  if (key in ALGS) return key;
  throw new RangeError("unsupported hash: " + name + " (use sha256 or sha512)");
}

function assertBytes(v, what) {
  if (!(v instanceof Uint8Array)) {
    throw new TypeError(what + " must be a Uint8Array");
  }
}

// One HMAC invocation starting from precomputed inner/outer midstates.
// data is the full inner payload after the ipad block.
function hmacFromMidstates(alg, innerCtx, outerCtx, data) {
  const ih = alg.create(innerCtx.h, innerCtx.done);
  ih.update(data);
  const innerDigest = ih.digest();
  const oh = alg.create(outerCtx.h, outerCtx.done);
  oh.update(innerDigest);
  return oh.digest();
}

export function pbkdf2(hashName, password, salt, iterations, dkLen) {
  const alg = ALGS[normalizeHashName(hashName)];
  assertBytes(password, "password");
  assertBytes(salt, "salt");
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new RangeError("iterations must be an integer >= 1");
  }
  if (!Number.isInteger(dkLen) || dkLen < 1) {
    throw new RangeError("dkLen must be an integer >= 1");
  }

  const blockSize = alg.blockSize;
  const hLen = alg.hashLen;

  // RFC 8018 5.2 step 1: derive the HMAC key (hash if longer than the block).
  // The length comparison here depends only on input metadata, not secret bytes.
  let key = password;
  if (key.length > blockSize) {
    const kh = alg.create(null, 0);
    kh.update(key);
    key = kh.digest();
  }

  // Steps 2-3: build ipad/opad and compress each pad block exactly ONCE;
  // the resulting midstates are cloned for every subsequent hash call.
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    const kb = i < key.length ? key[i] : 0;
    ipad[i] = kb ^ 0x36;
    opad[i] = kb ^ 0x5c;
  }
  const inner = alg.create(null, 0);
  inner.update(ipad);
  const outer = alg.create(null, 0);
  outer.update(opad);

  // Steps 4-5: F(P, S, c, i) = U1 ^ ... ^ Uc, U1 = PRF(P, S || INT(i)).
  const numBlocks = Math.ceil(dkLen / hLen);
  const dk = new Uint8Array(numBlocks * hLen);
  const msg = new Uint8Array(salt.length + 4);
  msg.set(salt);
  const T = new Uint8Array(hLen);
  for (let block = 1; block <= numBlocks; block++) {
    msg[salt.length] = (block >>> 24) & 255;
    msg[salt.length + 1] = (block >>> 16) & 255;
    msg[salt.length + 2] = (block >>> 8) & 255;
    msg[salt.length + 3] = block & 255;
    let u = hmacFromMidstates(alg, inner, outer, msg); // U1
    T.set(u);
    for (let c = 1; c < iterations; c++) {
      u = hmacFromMidstates(alg, inner, outer, u);     // U2 .. Uc
      for (let j = 0; j < hLen; j++) T[j] ^= u[j];
    }
    dk.set(T, (block - 1) * hLen);
  }
  return dkLen === dk.length ? dk : dk.slice(0, dkLen);
}
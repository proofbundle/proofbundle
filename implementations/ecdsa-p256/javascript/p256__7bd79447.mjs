// p256.mjs - ECDSA P-256 / SHA-256 verification (FIPS 186-5), from scratch.
// No dependencies, no crypto.subtle, no node:crypto, no WebAssembly.

const SHA_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

// SHA-256 (FIPS 180-4). Accepts any indexable byte source.
function sha256(msg) {
  const ml = msg.length;
  const total = ((((ml + 8) >> 6) + 1) << 6);
  const buf = new Uint8Array(total);
  for (let i = 0; i < ml; i++) buf[i] = msg[i];
  buf[ml] = 0x80;
  const dv = new DataView(buf.buffer);
  const bits = ml * 8;
  dv.setUint32(total - 8, Math.floor(bits / 4294967296));
  dv.setUint32(total - 4, bits >>> 0);
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const W = new Uint32Array(64);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const w15 = W[i - 15], w2 = W[i - 2];
      const s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
      const s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const t1 = (h + S1 + ((e & f) ^ (~e & g)) + SHA_K[i] + W[i]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) odv.setUint32(i * 4, H[i] >>> 0);
  return out;
}

// --- domain parameters (NIST P-256) -------------------------------------
const P = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;
const N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
const CB = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn;
const GX = 0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296n;
const GY = 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5n;
const SQRT_E = (P + 1n) >> 2n; // p = 3 mod 4

const fp = (x) => { const r = x % P; return r < 0n ? r + P : r; };
const inf = () => ({ x: 0n, y: 1n, z: 0n }); // Jacobian infinity is Z = 0

// --- Jacobian arithmetic, a = -3 ---------------------------------------
// doubling: EFD dbl-2001-b
function pdouble(p) {
  if (p.z === 0n || p.y === 0n) return inf();
  const delta = fp(p.z * p.z);
  const gamma = fp(p.y * p.y);
  const beta = fp(p.x * gamma);
  const alpha = fp(3n * fp((p.x - delta) * (p.x + delta)));
  const x3 = fp(fp(alpha * alpha) - 8n * beta);
  const y3 = fp(alpha * fp(4n * beta - x3) - 8n * fp(gamma * gamma));
  const zs = fp(p.y + p.z);
  const z3 = fp(fp(zs * zs) - gamma - delta);
  return { x: x3, y: y3, z: z3 };
}

// addition: EFD add-2007-bl, with explicit equal/inverse detection
function padd(p, q) {
  if (p.z === 0n) return q;
  if (q.z === 0n) return p;
  const z1z1 = fp(p.z * p.z);
  const z2z2 = fp(q.z * q.z);
  const u1 = fp(p.x * z2z2);
  const u2 = fp(q.x * z1z1);
  const s1 = fp(p.y * q.z * z2z2);
  const s2 = fp(q.y * p.z * z1z1);
  if (u1 === u2) return s1 === s2 ? pdouble(p) : inf();
  const hh = fp(u2 - u1);
  const two_h = fp(2n * hh);
  const i = fp(two_h * two_h);
  const j = fp(hh * i);
  const rr = fp(2n * (s2 - s1));
  const v = fp(u1 * i);
  const x3 = fp(fp(rr * rr) - j - 2n * v);
  const y3 = fp(rr * fp(v - x3) - 2n * s1 * j);
  const zs = fp(p.z + q.z);
  const z3 = fp(fp(fp(zs * zs) - z1z1 - z2z2) * hh);
  return { x: x3, y: y3, z: z3 };
}

// modular inverse (extended Euclid); m prime, a != 0
function modinv(a, m) {
  let r0 = ((a % m) + m) % m, r1 = m, s0 = 1n, s1 = 0n;
  while (r1 !== 0n) {
    const q = r0 / r1;
    const tr = r0 - q * r1; r0 = r1; r1 = tr;
    const ts = s0 - q * s1; s0 = s1; s1 = ts;
  }
  return ((s0 % m) + m) % m;
}

function powmod(b, e, m) {
  let acc = 1n;
  b %= m;
  while (e > 0n) {
    if (e & 1n) acc = (acc * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return acc;
}

function b2i(b, off, len) {
  let v = 0n;
  for (let i = 0; i < len; i++) v = (v << 8n) | BigInt(b[off + i]);
  return v;
}

function onCurve(x, y) {
  return fp(y * y) === fp(x * x * x - 3n * x + CB);
}

// --- public key decoding: 65-byte 0x04||X||Y, 33-byte 0x02/0x03||X ------
function parsePub(pub) {
  if (pub.length === 65 && pub[0] === 0x04) {
    const x = b2i(pub, 1, 32), y = b2i(pub, 33, 32);
    if (x >= P || y >= P || !onCurve(x, y)) return null;
    return { x, y, z: 1n };
  }
  if (pub.length === 33 && (pub[0] === 0x02 || pub[0] === 0x03)) {
    const x = b2i(pub, 1, 32);
    if (x >= P) return null;
    const rhs = fp(x * x * x - 3n * x + CB);
    let y = powmod(rhs, SQRT_E, P);
    if (fp(y * y) !== rhs) return null;
    const wantOdd = (pub[0] & 1) === 1;
    if (((y & 1n) === 1n) !== wantOdd) y = P - y;
    if (y === 0n && wantOdd) return null;
    return { x, y, z: 1n };
  }
  return null;
}

// --- 4-bit fixed-window Shamir double-scalar multiply -------------------
// table[i * 16 + j] = i*G + j*Q
function shamir(u1, u2, Q) {
  const T = new Array(256);
  T[0] = inf();
  for (let j = 1; j < 16; j++) T[j] = padd(T[j - 1], Q);
  const g = { x: GX, y: GY, z: 1n };
  for (let i = 1; i < 16; i++) {
    const base = i * 16;
    T[base] = padd(T[base - 16], g);
    for (let j = 1; j < 16; j++) T[base + j] = padd(T[base + j - 1], Q);
  }
  let R = inf();
  for (let k = 63; k >= 0; k--) {
    R = pdouble(pdouble(pdouble(pdouble(R))));
    const a = Number((u1 >> BigInt(k * 4)) & 0xfn);
    const b = Number((u2 >> BigInt(k * 4)) & 0xfn);
    R = padd(R, T[a * 16 + b]);
  }
  return R;
}

function core(pub, msg, r, s) {
  if (r <= 0n || r >= N || s <= 0n || s >= N) return false;
  const Q = parsePub(pub);
  if (Q === null) return false;
  const e = b2i(sha256(msg), 0, 32) % N;
  const w = modinv(s, N);
  if (w === 0n) return false;
  const u1 = (e * w) % N;
  const u2 = (r * w) % N;
  const R = shamir(u1, u2, Q);
  if (R.z === 0n) return false;
  const zi = modinv(R.z, P);
  const x = fp(R.x * fp(zi * zi)); // affine X = Xj * Zj^-2
  return (x % N) === r;
}

// --- strict DER ---------------------------------------------------------
function rdLen(b, i) {
  if (i >= b.length) return null;
  const first = b[i++];
  if (first < 0x80) return { n: first, i };
  const k = first & 0x7f;
  if (k === 0 || k > 4 || i + k > b.length) return null;
  if (b[i] === 0x00) return null; // non-minimal length
  let v = 0;
  for (let j = 0; j < k; j++) v = v * 256 + b[i + j];
  if (v < 0x80) return null; // should have used the short form
  return { n: v, i: i + k };
}

function rdInt(b, i) {
  if (i >= b.length || b[i] !== 0x02) return null;
  const L = rdLen(b, i + 1);
  if (L === null || L.n === 0) return null;
  const st = L.i;
  if (st + L.n > b.length) return null;
  if (b[st] & 0x80) return null; // negative
  if (L.n > 1 && b[st] === 0x00 && (b[st + 1] & 0x80) === 0) return null; // non-minimal
  return { v: b2i(b, st, L.n), i: st + L.n };
}

function parseDer(sig) {
  if (sig.length < 2 || sig[0] !== 0x30) return null;
  const L = rdLen(sig, 1);
  if (L === null || L.i + L.n !== sig.length) return null;
  const r = rdInt(sig, L.i);
  if (r === null) return null;
  const s = rdInt(sig, r.i);
  if (s === null || s.i !== sig.length) return null;
  return { r: r.v, s: s.v };
}

export function verifyDer(pub, msg, derSig) {
  if (pub == null || msg == null || derSig == null) return false;
  const rs = parseDer(derSig);
  return rs === null ? false : core(pub, msg, rs.r, rs.s);
}

export function verifyP1363(pub, msg, sig64) {
  if (pub == null || msg == null || sig64 == null) return false;
  if (sig64.length !== 64) return false;
  return core(pub, msg, b2i(sig64, 0, 32), b2i(sig64, 32, 32));
}
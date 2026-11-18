// secp256k1.mjs — ECDSA verification over secp256k1 with SHA-256 (SEC 1 v2 §4.1.4).
// From scratch: SHA-256, field/scalar arithmetic, group law, DER. No deps.

const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const GX = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
const GY = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
const SQRT_EXP = (P + 1n) >> 2n;

const RC = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

const rotr = (x, n) => (x >>> n) | (x << (32 - n));

function sha256(msg) {
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const len = msg.length;
  const total = (((len + 8) >> 6) + 1) << 6;
  const buf = new Uint8Array(total);
  buf.set(msg);
  buf[len] = 0x80;
  const bl = len * 8;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, Math.floor(bl / 4294967296));
  dv.setUint32(total - 4, bl >>> 0);
  const w = new Uint32Array(64);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const a15 = w[i - 15], a2 = w[i - 2];
      const s0 = rotr(a15, 7) ^ rotr(a15, 18) ^ (a15 >>> 3);
      const s1 = rotr(a2, 17) ^ rotr(a2, 19) ^ (a2 >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], k = h[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (k + S1 + ch + RC[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      k = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + k) | 0;
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) odv.setUint32(i * 4, h[i]);
  return out;
}

const mod = (a, m) => { const r = a % m; return r < 0n ? r + m : r; };

function powMod(b, e, m) {
  let r = 1n;
  b = mod(b, m);
  while (e > 0n) {
    if (e & 1n) r = (r * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return r;
}

function bytesToBig(b) {
  let v = 0n;
  for (let i = 0; i < b.length; i++) v = (v << 8n) | BigInt(b[i]);
  return v;
}

function jDouble(p) {
  if (!p) return null;
  const X = p[0], Y = p[1], Z = p[2];
  if (Y === 0n) return null;
  const Y2 = mod(Y * Y, P);
  const S = mod(4n * X * Y2, P);
  const M = mod(3n * X * X, P);
  const X3 = mod(M * M - 2n * S, P);
  const Y3 = mod(M * (S - X3) - 8n * Y2 * Y2, P);
  const Z3 = mod(2n * Y * Z, P);
  return [X3, Y3, Z3];
}

function jAddMixed(p, x2, y2) {
  if (!p) return [x2, y2, 1n];
  const X1 = p[0], Y1 = p[1], Z1 = p[2];
  if (Z1 === 0n) return [x2, y2, 1n];
  const Z1Z1 = mod(Z1 * Z1, P);
  const U2 = mod(x2 * Z1Z1, P);
  const S2 = mod(y2 * Z1 * Z1Z1, P);
  const H = mod(U2 - X1, P);
  const R = mod(S2 - Y1, P);
  if (H === 0n) return R === 0n ? jDouble(p) : null;
  const HH = mod(H * H, P);
  const HHH = mod(H * HH, P);
  const V = mod(X1 * HH, P);
  const X3 = mod(R * R - HHH - 2n * V, P);
  const Y3 = mod(R * (V - X3) - Y1 * HHH, P);
  const Z3 = mod(Z1 * H, P);
  return [X3, Y3, Z3];
}

function jToAffine(p) {
  if (!p) return null;
  const Z = p[2];
  if (Z === 0n) return null;
  const zi = powMod(Z, P - 2n, P);
  const zi2 = mod(zi * zi, P);
  return [mod(p[0] * zi2, P), mod(p[1] * zi2 * zi, P)];
}

function shamir(k1, k2, qx, qy) {
  let R = null;
  for (let i = 255; i >= 0; i--) {
    R = jDouble(R);
    const bit = 1n << BigInt(i);
    if (k1 & bit) R = jAddMixed(R, GX, GY);
    if (k2 & bit) R = jAddMixed(R, qx, qy);
  }
  return jToAffine(R);
}

function decodePub(pub) {
  if (!(pub instanceof Uint8Array)) return null;
  if (pub.length === 33) {
    if (pub[0] !== 2 && pub[0] !== 3) return null;
    const x = bytesToBig(pub.subarray(1));
    if (x >= P) return null;
    const y2 = mod(x * x * x + 7n, P);
    let y = powMod(y2, SQRT_EXP, P);
    if (mod(y * y, P) !== y2) return null;
    if ((y & 1n) !== BigInt(pub[0] & 1)) y = P - y;
    if (y >= P) return null;
    return [x, y];
  }
  if (pub.length === 65) {
    if (pub[0] !== 4) return null;
    const x = bytesToBig(pub.subarray(1, 33));
    const y = bytesToBig(pub.subarray(33, 65));
    if (x >= P || y >= P) return null;
    if (mod(y * y - (x * x * x + 7n), P) !== 0n) return null;
    return [x, y];
  }
  return null;
}

function readLen(buf, off, end) {
  if (off >= end) return null;
  const b = buf[off];
  if (b < 0x80) return [b, off + 1];
  const n = b & 0x7f;
  if (n === 0 || n > 2) return null;
  if (off + 1 + n > end) return null;
  if (buf[off + 1] === 0) return null;
  let v = 0;
  for (let i = 0; i < n; i++) v = (v << 8) | buf[off + 1 + i];
  if (v < 0x80) return null;
  return [v, off + 1 + n];
}

function readInt(buf, off, end) {
  if (off >= end || buf[off] !== 0x02) return null;
  const L = readLen(buf, off + 1, end);
  if (!L) return null;
  const l = L[0], v = L[1];
  if (l === 0 || v + l > end) return null;
  const first = buf[v];
  if (first & 0x80) return null;
  if (l > 1 && first === 0 && (buf[v + 1] & 0x80) === 0) return null;
  return [buf.subarray(v, v + l), v + l];
}

function parseDer(sig) {
  if (!(sig instanceof Uint8Array) || sig.length < 8) return null;
  if (sig[0] !== 0x30) return null;
  const L = readLen(sig, 1, sig.length);
  if (!L) return null;
  if (L[1] + L[0] !== sig.length) return null;
  const r = readInt(sig, L[1], sig.length);
  if (!r) return null;
  const s = readInt(sig, r[1], sig.length);
  if (!s) return null;
  if (s[1] !== sig.length) return null;
  return [r[0], s[0]];
}

function core(pub, msg, rBytes, sBytes) {
  const r = bytesToBig(rBytes);
  const s = bytesToBig(sBytes);
  if (r < 1n || r >= N || s < 1n || s >= N) return false;
  const Q = decodePub(pub);
  if (!Q) return false;
  const e = bytesToBig(sha256(msg)) % N;
  const w = powMod(s, N - 2n, N);
  const R = shamir((e * w) % N, (r * w) % N, Q[0], Q[1]);
  if (!R) return false;
  return mod(R[0], N) === r;
}

export function verifyDer(pub65or33, msg, derSig) {
  try {
    const p = parseDer(derSig);
    if (!p) return false;
    return core(pub65or33, msg, p[0], p[1]);
  } catch { return false; }
}

export function verifyP1363(pub, msg, sig64) {
  try {
    if (!(sig64 instanceof Uint8Array) || sig64.length !== 64) return false;
    return core(pub, msg, sig64.subarray(0, 32), sig64.subarray(32, 64));
  } catch { return false; }
}
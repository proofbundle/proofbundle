// p521.mjs - ECDSA P-521 / SHA-512 verification (FIPS 186-5), from scratch.
// No dependencies, no crypto.subtle, no node:crypto, no WebAssembly.

const M64 = (1n << 64n) - 1n;
const rotr = (x, n) => ((x >> n) | (x << (64n - n))) & M64;

const SHA_K = [
  0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbbcn,
  0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
  0xd807aa98a3030242n, 0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
  0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n, 0xc19bf174cf692694n,
  0xe49b69c19ef14ad2n, 0xefbe4786384f25e3n, 0x0fc19dc68b8cd5b5n, 0x240ca1cc77ac9c65n,
  0x2de92c6f592b0275n, 0x4a7484aa6ea6e483n, 0x5cb0a9dcbd41fbd4n, 0x76f988da831153b5n,
  0x983e5152ee66dfabn, 0xa831c66d2db43210n, 0xb00327c898fb213fn, 0xbf597fc7beef0ee4n,
  0xc6e00bf33da88fc2n, 0xd5a79147930aa725n, 0x06ca6351e003826fn, 0x142929670a0e6e70n,
  0x27b70a8546d22ffcn, 0x2e1b21385c26c926n, 0x4d2c6dfc5ac42aedn, 0x53380d139d95b3dfn,
  0x650a73548baf63den, 0x766a0abb3c77b2a8n, 0x81c2c92e47edaee6n, 0x92722c851482353bn,
  0xa2bfe8a14cf10364n, 0xa81a664bbc423001n, 0xc24b8b70d0f89791n, 0xc76c51a30654be30n,
  0xd192e819d6ef5218n, 0xd69906245565a910n, 0xf40e35855771202an, 0x106aa07032bbd1b8n,
  0x19a4c116b8d2d0c8n, 0x1e376c085141ab53n, 0x2748774cdf8eeb99n, 0x34b0bcb5e19b48a8n,
  0x391c0cb3c5c95a63n, 0x4ed8aa4ae3418acbn, 0x5b9cca4f7763e373n, 0x682e6ff3d6b2b8a3n,
  0x748f82ee5defb2fcn, 0x78a5636f43172f60n, 0x84c87814a1f0ab72n, 0x8cc702081a6439ecn,
  0x90befffa23631e28n, 0xa4506cebde82bde9n, 0xbef9a3f7b2c67915n, 0xc67178f2e372532bn,
  0xca273eceea26619cn, 0xd186b8c721c0c207n, 0xeada7dd6cde0eb1en, 0xf57d4f7fee6ed178n,
  0x06f067aa72176fban, 0x0a637dc5a2c898a6n, 0x113f9804bef90daen, 0x1b710b35131c471bn,
  0x28db77f523047d84n, 0x32caab7b40c72493n, 0x3c9ebe0a15c9bebcn, 0x431d67c49c100d4cn,
  0x4cc5d4becb3e42b6n, 0x597f299cfc657e2an, 0x5fcb6fab3ad6faecn, 0x6c44198c4a475817n,
];

// SHA-512 (FIPS 180-4): 1024-bit blocks, 128-bit length field, 512-bit digest.
export function sha512(m) {
  const ml = m.length;
  const total = ((((ml + 16) >> 7) + 1) << 7);
  const buf = new Uint8Array(total);
  for (let i = 0; i < ml; i++) buf[i] = m[i];
  buf[ml] = 0x80;
  const dv = new DataView(buf.buffer);
  const bits = BigInt(ml) * 8n;
  dv.setBigUint64(total - 16, bits >> 64n);
  dv.setBigUint64(total - 8, bits & M64);
  const H = [
    0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
    0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
  ];
  const W = new Array(80);
  for (let off = 0; off < total; off += 128) {
    for (let i = 0; i < 16; i++) W[i] = dv.getBigUint64(off + i * 8);
    for (let i = 16; i < 80; i++) {
      const w15 = W[i - 15], w2 = W[i - 2];
      const s0 = rotr(w15, 1n) ^ rotr(w15, 8n) ^ (w15 >> 7n);
      const s1 = rotr(w2, 19n) ^ rotr(w2, 61n) ^ (w2 >> 6n);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) & M64;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 80; i++) {
      const S1 = rotr(e, 14n) ^ rotr(e, 18n) ^ rotr(e, 41n);
      const t1 = (h + S1 + ((e & f) ^ (~e & M64 & g)) + SHA_K[i] + W[i]) & M64;
      const S0 = rotr(a, 28n) ^ rotr(a, 34n) ^ rotr(a, 39n);
      const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) & M64;
      h = g; g = f; f = e; e = (d + t1) & M64; d = c; c = b; b = a; a = (t1 + t2) & M64;
    }
    H[0] = (H[0] + a) & M64; H[1] = (H[1] + b) & M64;
    H[2] = (H[2] + c) & M64; H[3] = (H[3] + d) & M64;
    H[4] = (H[4] + e) & M64; H[5] = (H[5] + f) & M64;
    H[6] = (H[6] + g) & M64; H[7] = (H[7] + h) & M64;
  }
  const out = new Uint8Array(64);
  const odv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) odv.setBigUint64(i * 8, H[i] & M64);
  return out;
}

// --- domain parameters (NIST P-521), 66-byte field elements -------------
const P = 0x1ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
const N = 0x1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa51868783bf2f966b7fcc0148f709a5d03bb5c9b8899c47aebb6fb71e91386409n;
const CB = 0x0051953eb9618e1c9a1f929a21a0b68540eea2da725b99b315f3b8b489918ef109e156193951ec7e937b1652c0bd3bb1bf073573df883d2c34f1ef451fd46b503f00n;
const GX = 0x00c6858e06b70404e9cd9e3ecb662395b4429c648139053fb521f828af606b4d3dbaa14b5e77efe75928fe1dc127a2ffa8de3348b3c1856a429bf97e7e31c2e5bd66n;
const GY = 0x011839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650n;
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

// --- public key decoding: 133-byte 0x04||X||Y, 67-byte 0x02/0x03||X ----
function parsePub(pub) {
  if (pub.length === 133 && pub[0] === 0x04) {
    const x = b2i(pub, 1, 66), y = b2i(pub, 67, 66);
    if (x >= P || y >= P || !onCurve(x, y)) return null;
    return { x, y, z: 1n };
  }
  if (pub.length === 67 && (pub[0] === 0x02 || pub[0] === 0x03)) {
    const x = b2i(pub, 1, 66);
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
// table[i * 16 + j] = i*G + j*Q ; n is 521 bits -> 131 nibbles
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
  for (let k = 130; k >= 0; k--) {
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
  const e = b2i(sha512(msg), 0, 64) % N; // 512-bit hash < n: used whole
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

export function verifyP1363(pub, msg, sig132) {
  if (pub == null || msg == null || sig132 == null) return false;
  if (sig132.length !== 132) return false;
  return core(pub, msg, b2i(sig132, 0, 66), b2i(sig132, 66, 66));
}
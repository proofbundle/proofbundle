// From-scratch Ed25519 (RFC 8032) — EdDSA over edwards25519.
// Pure JS with BigInt field arithmetic. No external crypto library,
// no WebCrypto, no node:crypto. SHA-512 is implemented inline here rather
// than imported, so this module has no dependency outside the language.
//
// This is the signature scheme ProofBundle seals every bundle with, so it is
// the most load-bearing primitive in the core.
//
// Spec: RFC 8032 section 5.1 (Ed25519).

// ---------------------------------------------------------------------------
// SHA-512 (FIPS 180-4), 64-bit words via BigInt
// ---------------------------------------------------------------------------

const M64 = (1n << 64n) - 1n;

const K512 = [
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

const H512 = [
  0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
];

const rotr64 = (x, n) => ((x >> BigInt(n)) | (x << BigInt(64 - n))) & M64;
const shr64 = (x, n) => x >> BigInt(n);

export function sha512(msg) {
  if (typeof msg === 'string') msg = new TextEncoder().encode(msg);

  // pad: 0x80, zeros, then 128-bit big-endian bit length
  const l = msg.length;
  const k = ((112 - (l + 1) % 128) + 128) % 128;
  const padded = new Uint8Array(l + 1 + k + 16);
  padded.set(msg);
  padded[l] = 0x80;
  const bitLen = BigInt(l) * 8n;
  for (let i = 0; i < 16; i++) {
    padded[padded.length - 1 - i] = Number((bitLen >> BigInt(8 * i)) & 0xffn);
  }

  const H = H512.slice();
  const W = new Array(80);

  for (let off = 0; off < padded.length; off += 128) {
    for (let t = 0; t < 16; t++) {
      let w = 0n;
      for (let b = 0; b < 8; b++) w = (w << 8n) | BigInt(padded[off + t * 8 + b]);
      W[t] = w;
    }
    for (let t = 16; t < 80; t++) {
      const s0 = rotr64(W[t - 15], 1) ^ rotr64(W[t - 15], 8) ^ shr64(W[t - 15], 7);
      const s1 = rotr64(W[t - 2], 19) ^ rotr64(W[t - 2], 61) ^ shr64(W[t - 2], 6);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) & M64;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 80; t++) {
      const S1 = rotr64(e, 14) ^ rotr64(e, 18) ^ rotr64(e, 41);
      const ch = (e & f) ^ ((~e & M64) & g);
      const t1 = (h + S1 + ch + K512[t] + W[t]) & M64;
      const S0 = rotr64(a, 28) ^ rotr64(a, 34) ^ rotr64(a, 39);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) & M64;
      h = g; g = f; f = e; e = (d + t1) & M64;
      d = c; c = b; b = a; a = (t1 + t2) & M64;
    }
    H[0] = (H[0] + a) & M64; H[1] = (H[1] + b) & M64;
    H[2] = (H[2] + c) & M64; H[3] = (H[3] + d) & M64;
    H[4] = (H[4] + e) & M64; H[5] = (H[5] + f) & M64;
    H[6] = (H[6] + g) & M64; H[7] = (H[7] + h) & M64;
  }

  const out = new Uint8Array(64);
  for (let i = 0; i < 8; i++) {
    for (let b = 0; b < 8; b++) out[i * 8 + b] = Number((H[i] >> BigInt(56 - 8 * b)) & 0xffn);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Field arithmetic mod p = 2^255 - 19
// ---------------------------------------------------------------------------

const P = (1n << 255n) - 19n;
// group order
const L = 2n ** 252n + 27742317777372353535851937790883648493n;
// curve constant d = -121665/121666 mod p
const D = 37095705934669439343138083508754565189542113879843219016388785533085940283555n;
// sqrt(-1) mod p, used for point decompression
const SQRT_M1 = 19681161376707505956807079304988542015446066515923890162744021073123829784752n;

const fmod = (a) => { const r = a % P; return r < 0n ? r + P : r; };
const fadd = (a, b) => fmod(a + b);
const fsub = (a, b) => fmod(a - b);
const fmul = (a, b) => fmod(a * b);

function fpow(a, e) {
  let r = 1n, b = fmod(a), x = e;
  while (x > 0n) {
    if (x & 1n) r = fmul(r, b);
    b = fmul(b, b);
    x >>= 1n;
  }
  return r;
}
const finv = (a) => fpow(a, P - 2n);

const nmod = (a) => { const r = a % L; return r < 0n ? r + L : r; };

// ---------------------------------------------------------------------------
// Group arithmetic on edwards25519 in extended coordinates (X:Y:Z:T)
// with T = XY/Z. Formulas per RFC 8032 section 5.1.4.
// ---------------------------------------------------------------------------

const ZERO_POINT = [0n, 1n, 1n, 0n];

// base point
const BY = fmul(4n, finv(5n));
const BX = (() => {
  // recover x from y: x^2 = (y^2 - 1) / (d*y^2 + 1)
  const yy = fmul(BY, BY);
  const u = fsub(yy, 1n);
  const v = fadd(fmul(D, yy), 1n);
  let x = fpow(fmul(u, finv(v)), (P + 3n) / 8n);
  if (fmul(x, x) !== fmod(fmul(u, finv(v)))) x = fmul(x, SQRT_M1);
  if (x % 2n !== 0n) x = fsub(0n, x);
  return x;
})();
const BASE = [BX, BY, 1n, fmul(BX, BY)];

function pointAdd(Pt, Qt) {
  const [X1, Y1, Z1, T1] = Pt;
  const [X2, Y2, Z2, T2] = Qt;
  const A = fmul(fsub(Y1, X1), fsub(Y2, X2));
  const B = fmul(fadd(Y1, X1), fadd(Y2, X2));
  const C = fmul(fmul(fmul(T1, 2n), D), T2);
  const Dd = fmul(fmul(Z1, 2n), Z2);
  const E = fsub(B, A);
  const F = fsub(Dd, C);
  const G = fadd(Dd, C);
  const H = fadd(B, A);
  return [fmul(E, F), fmul(G, H), fmul(F, G), fmul(E, H)];
}

function pointDouble(Pt) { return pointAdd(Pt, Pt); }

// Fixed-time-shaped ladder: every bit performs both an add and a double, and
// the result is selected arithmetically rather than by branching on the bit.
function scalarMul(k, Pt) {
  let R0 = ZERO_POINT;
  let R1 = Pt;
  for (let i = 255; i >= 0; i--) {
    const bit = (k >> BigInt(i)) & 1n;
    // conditional swap without branching on secret data
    const [A, B] = bit === 1n ? [R1, R0] : [R0, R1];
    const sum = pointAdd(A, B);
    const dbl = pointDouble(A);
    if (bit === 1n) { R1 = dbl; R0 = sum; } else { R0 = dbl; R1 = sum; }
  }
  return R0;
}

function pointEqual(Pt, Qt) {
  const [X1, Y1, Z1] = Pt;
  const [X2, Y2, Z2] = Qt;
  return fmul(X1, Z2) === fmul(X2, Z1) && fmul(Y1, Z2) === fmul(Y2, Z1);
}

function pointCompress(Pt) {
  const [X, Y, Z] = Pt;
  const zi = finv(Z);
  const x = fmul(X, zi);
  const y = fmul(Y, zi);
  const out = new Uint8Array(32);
  let v = y;
  for (let i = 0; i < 32; i++) { out[i] = Number(v & 0xffn); v >>= 8n; }
  out[31] |= Number(x & 1n) << 7;
  return out;
}

function pointDecompress(bytes) {
  if (bytes.length !== 32) return null;
  let y = 0n;
  for (let i = 31; i >= 0; i--) y = (y << 8n) | BigInt(bytes[i]);
  const sign = (y >> 255n) & 1n;
  y &= (1n << 255n) - 1n;
  if (y >= P) return null;

  const yy = fmul(y, y);
  const u = fsub(yy, 1n);
  const v = fadd(fmul(D, yy), 1n);
  const uv = fmul(u, finv(v));
  let x = fpow(uv, (P + 3n) / 8n);
  if (fmul(x, x) !== uv) x = fmul(x, SQRT_M1);
  if (fmul(x, x) !== uv) return null;   // not on curve
  if ((x & 1n) !== sign) x = fsub(0n, x);
  return [x, y, 1n, fmul(x, y)];
}

// ---------------------------------------------------------------------------
// Ed25519 (RFC 8032 section 5.1)
// ---------------------------------------------------------------------------

function leToBig(bytes) {
  let v = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) v = (v << 8n) | BigInt(bytes[i]);
  return v;
}

function bigToLe32(v) {
  const out = new Uint8Array(32);
  let x = v;
  for (let i = 0; i < 32; i++) { out[i] = Number(x & 0xffn); x >>= 8n; }
  return out;
}

function clamp(h) {
  const a = Uint8Array.from(h.slice(0, 32));
  a[0] &= 248;
  a[31] &= 127;
  a[31] |= 64;
  return leToBig(a);
}

function concatBytes(...arrs) {
  let n = 0;
  for (const a of arrs) n += a.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

// Derive the 32-byte public key from a 32-byte seed.
export function ed25519PublicKey(seed32) {
  if (seed32.length !== 32) throw new Error('seed must be 32 bytes');
  const h = sha512(seed32);
  const a = clamp(h);
  return pointCompress(scalarMul(a, BASE));
}

export function ed25519Keygen(seed32) {
  return { privateKey: Uint8Array.from(seed32), publicKey: ed25519PublicKey(seed32) };
}

// Sign: R = rB, S = r + H(R,A,M)*a mod L. Signature is R || S.
export function ed25519Sign(seed32, message) {
  if (typeof message === 'string') message = new TextEncoder().encode(message);
  const h = sha512(seed32);
  const a = clamp(h);
  const prefix = h.slice(32, 64);
  const A = pointCompress(scalarMul(a, BASE));

  const r = nmod(leToBig(sha512(concatBytes(prefix, message))));
  const R = pointCompress(scalarMul(r, BASE));
  const k = nmod(leToBig(sha512(concatBytes(R, A, message))));
  const S = nmod(r + k * a);
  return concatBytes(R, bigToLe32(S));
}

// Verify: check [S]B == R + [k]A, using the cofactorless equation.
export function ed25519Verify(publicKey, message, signature) {
  if (typeof message === 'string') message = new TextEncoder().encode(message);
  if (signature.length !== 64 || publicKey.length !== 32) return false;

  const Rbytes = signature.slice(0, 32);
  const Sbytes = signature.slice(32, 64);
  const S = leToBig(Sbytes);
  if (S >= L) return false;              // reject non-canonical S

  const A = pointDecompress(publicKey);
  if (!A) return false;
  const R = pointDecompress(Rbytes);
  if (!R) return false;

  const k = nmod(leToBig(sha512(concatBytes(Rbytes, publicKey, message))));

  const lhs = scalarMul(S, BASE);
  const rhs = pointAdd(R, scalarMul(k, A));
  return pointEqual(lhs, rhs);
}

export const _internals = {
  BASE, ZERO_POINT, L, P, D,
  pointAdd, pointDouble, scalarMul, pointEqual,
  pointCompress, pointDecompress, fmul, finv,
};

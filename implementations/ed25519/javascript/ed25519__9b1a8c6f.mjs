/**
 * Ed25519 — from scratch (RFC 8032 §5.1), strict verification profile.
 *
 * No external elliptic-curve library. Field arithmetic is plain BigInt
 * modular arithmetic over p = 2^255 - 19. Point arithmetic uses extended
 * twisted Edwards coordinates (Hisil–Wong–Carter–Dawson); the unified
 * addition formula is complete on this curve because d is a non-square
 * mod p. Hashing is the from-scratch `sha512` (crypto/sha512.mjs).
 *
 * Curve: twisted Edwards  -x^2 + y^2 = 1 + d x^2 y^2  over F_p,
 *   p = 2^255 - 19,  d = -121665/121666 mod p.
 * Base point B, prime order L = 2^252 + 27742317777372353535851937790883648493,
 * cofactor h = 8.
 *
 * Verification policy (2026-11-14):
 *   1. signature is exactly 64 bytes, public key exactly 32 bytes;
 *   2. S is canonical: 0 <= S < L;
 *   3. A and R decode canonically (RFC 8032 §5.1.3): y < p, a square root
 *      exists, and x = 0 with the sign bit set ("-0") is rejected;
 *   4. A and R are not of small order: [8]A != identity and [8]R != identity;
 *   5. cofactored equation  [8]([S]B) == [8](R + [k]A),  k = SHA-512(R||A||M)
 *      mod L. The factor 8 is applied to POINTS by three doublings; 8k and 8S
 *      are never reduced mod L (reducing 8k mod L is wrong when A carries a
 *      torsion component — Chalkias et al. case 5). Reducing k itself mod L
 *      is sound: [8][k]A depends on k only mod L once the torsion is killed.
 *   The hash input uses the caller's original R and A bytes (copied first).
 *
 * Side channels: signing uses a fixed-length (256-step) Montgomery ladder
 * with an arithmetic conditional swap, so there is no secret-dependent
 * branch or secret-dependent property access at the JavaScript level.
 * LIMIT: JavaScript BigInt arithmetic is not constant-time (operand-length-
 * dependent multiplication/division in the engine, garbage collection,
 * JIT). This is constant-time-ORIENTED, not a constant-time guarantee.
 * Verification handles only public data and uses variable-time code.
 */
import { sha512 } from './sha512.mjs';

const p = (1n << 255n) - 19n;
const L = (1n << 252n) + 27742317777372353535851937790883648493n;

const mod = (a, m = p) => ((a % m) + m) % m;

function powMod(base, exp, m) {
  base = mod(base, m);
  let result = 1n;
  while (exp > 0n) {
    if (exp & 1n) result = mod(result * base, m);
    base = mod(base * base, m);
    exp >>= 1n;
  }
  return result;
}
// Fermat inverse; p and L are prime.
const invMod = (a, m = p) => powMod(mod(a, m), m - 2n, m);

const d = mod(-121665n * invMod(121666n));
const d2 = mod(2n * d);
const SQRT_M1 = powMod(2n, (p - 1n) / 4n, p);

// Extended coordinates (X, Y, Z, T): affine (X/Z, Y/Z), T = XY/Z.
const IDENTITY = Object.freeze({ X: 0n, Y: 1n, Z: 1n, T: 0n });

/** Unified (complete) addition, a = -1 (add-2008-hwcd-3). */
function pointAdd(P, Q) {
  const A = mod((P.Y - P.X) * (Q.Y - Q.X));
  const B = mod((P.Y + P.X) * (Q.Y + Q.X));
  const C = mod(mod(P.T * d2) * Q.T);
  const D = mod(2n * P.Z * Q.Z);
  const E = mod(B - A), F = mod(D - C), G = mod(D + C), H = mod(B + A);
  return { X: mod(E * F), Y: mod(G * H), Z: mod(F * G), T: mod(E * H) };
}

/** Dedicated doubling, a = -1 (dbl-2008-hwcd). Complete for this curve. */
function pointDouble(P) {
  const A = mod(P.X * P.X);
  const B = mod(P.Y * P.Y);
  const C = mod(2n * P.Z * P.Z);
  const D = mod(-A);
  const E = mod((P.X + P.Y) * (P.X + P.Y) - A - B);
  const G = mod(D + B), F = mod(G - C), H = mod(D - B);
  return { X: mod(E * F), Y: mod(G * H), Z: mod(F * G), T: mod(E * H) };
}

/** [8]P by three doublings (no scalar arithmetic mod L involved). */
const mulBy8 = (P) => pointDouble(pointDouble(pointDouble(P)));

/** Projective equality: X1 Z2 == X2 Z1 and Y1 Z2 == Y2 Z1. */
function pointEqual(P, Q) {
  return mod(P.X * Q.Z) === mod(Q.X * P.Z) && mod(P.Y * Q.Z) === mod(Q.Y * P.Z);
}
const isIdentity = (P) => pointEqual(P, IDENTITY);

/** Small order <=> [8]P == identity (the torsion subgroup has order 8). */
const isSmallOrder = (P) => isIdentity(mulBy8(P));

/** Variable-time double-and-add. PUBLIC scalars only (verification). */
function scalarMul(scalar, P) {
  if (scalar < 0n) throw new RangeError('ed25519: negative scalar');
  let result = IDENTITY, addend = P, k = scalar;
  while (k > 0n) {
    if (k & 1n) result = pointAdd(result, addend);
    addend = pointDouble(addend);
    k >>= 1n;
  }
  return result;
}

const LADDER_BITS = 256;
const MASK256 = (1n << 256n) - 1n;
/** Conditional swap without a branch: mask is 0n or all-ones (two's complement -1n). */
function cswap(P, Q, bit) {
  const m = -bit; // bit ∈ {0n,1n} -> 0n or -1n
  const sx = m & (P.X ^ Q.X), sy = m & (P.Y ^ Q.Y), sz = m & (P.Z ^ Q.Z), st = m & (P.T ^ Q.T);
  return [
    { X: P.X ^ sx, Y: P.Y ^ sy, Z: P.Z ^ sz, T: P.T ^ st },
    { X: Q.X ^ sx, Y: Q.Y ^ sy, Z: Q.Z ^ sz, T: Q.T ^ st },
  ];
}
/**
 * Montgomery ladder for SECRET scalars (signing): always 256 iterations,
 * one complete addition and one doubling per step, swap by mask. Requires
 * 0 <= scalar < 2^256 (clamped scalars and r mod L both qualify).
 */
function scalarMulLadder(scalar, P) {
  if (scalar < 0n || scalar > MASK256) throw new RangeError('ed25519: ladder scalar out of range');
  let R0 = IDENTITY, R1 = P, swap = 0n;
  for (let i = LADDER_BITS - 1; i >= 0; i--) {
    const bit = (scalar >> BigInt(i)) & 1n;
    [R0, R1] = cswap(R0, R1, swap ^ bit);
    swap = bit;
    R1 = pointAdd(R0, R1);
    R0 = pointDouble(R0);
  }
  [R0, R1] = cswap(R0, R1, swap);
  return R0;
}

// ── encode / decode ──
function bytesToLE(bytes) {
  let v = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) v = (v << 8n) | BigInt(bytes[i]);
  return v;
}
function leToBytes(v, len) {
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) { out[i] = Number(v & 0xffn); v >>= 8n; }
  return out;
}
function pointToAffine(P) {
  const zInv = invMod(P.Z);
  return { x: mod(P.X * zInv), y: mod(P.Y * zInv) };
}
function encodePoint(P) {
  const { x, y } = pointToAffine(P);
  const bytes = leToBytes(y, 32);
  if (x & 1n) bytes[31] |= 0x80;
  return bytes;
}

/**
 * RFC 8032 §5.1.3 point decoding, strict.
 * Step 1: y < p (non-canonical y rejected). Steps 2-3: x^2 = (y^2-1)/(d y^2+1)
 * must have a root. Step 4: x = 0 with sign bit 1 ("-0") rejected.
 */
function decodePoint(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 32) throw new Error('ed25519: point must be 32 bytes');
  // Copy: on a Node Buffer slice() is a view; never mutate caller bytes.
  const yBytes = Uint8Array.from(bytes);
  const signBit = (yBytes[31] & 0x80) !== 0;
  yBytes[31] &= 0x7f;
  const y = bytesToLE(yBytes);
  if (y >= p) throw new Error('ed25519: invalid point (y >= p)');               // step 1
  const y2 = mod(y * y);
  const u = mod(y2 - 1n), v = mod(d * y2 + 1n);                                  // v != 0: -1/d is a non-square
  const x2 = mod(u * invMod(v));
  let x = powMod(x2, (p + 3n) / 8n, p);                                          // step 3, p ≡ 5 (mod 8)
  if (mod(x * x) !== x2) x = mod(x * SQRT_M1);
  if (mod(x * x) !== x2) throw new Error('ed25519: invalid point (no square root)');
  if (x === 0n && signBit) throw new Error('ed25519: invalid point (x = 0 with sign bit set)'); // step 4
  if ((x & 1n) !== (signBit ? 1n : 0n)) x = mod(p - x);
  return { X: x, Y: y, Z: 1n, T: mod(x * y) };
}

const By = mod(4n * invMod(5n));
const BASE = Object.freeze(decodePoint(leToBytes(By, 32))); // RFC 8032 B has even x (sign bit 0)

// ── RFC 8032 §5.1.5 key generation ──
function clampScalar(bytes32) {
  const b = Uint8Array.from(bytes32);
  b[0] &= 0xf8;
  b[31] &= 0x7f;
  b[31] |= 0x40;
  return bytesToLE(b);
}
function concatBytes(...arrs) {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}
function checkSeed(seed) {
  if (!(seed instanceof Uint8Array) || seed.length !== 32) throw new Error('ed25519: seed must be 32 bytes');
}

/** @param {Uint8Array} seed 32-byte secret seed. @returns {{publicKey:Uint8Array, secretKey:Uint8Array}} secretKey is the 32-byte seed (RFC 8032 convention). */
export function keyPairFromSeed(seed) {
  checkSeed(seed);
  const h = sha512(seed);
  const a = clampScalar(h.subarray(0, 32));
  return { publicKey: encodePoint(scalarMulLadder(a, BASE)), secretKey: seed };
}

/** RFC 8032 §5.1.6 sign. @returns {Uint8Array} 64-byte signature (R || S). */
export function sign(message, seed) {
  checkSeed(seed);
  if (!(message instanceof Uint8Array)) message = new TextEncoder().encode(message);
  const h = sha512(Uint8Array.from(seed));
  const a = clampScalar(h.subarray(0, 32));
  const prefix = h.slice(32, 64);
  const A = encodePoint(scalarMulLadder(a, BASE));
  const r = mod(bytesToLE(sha512(concatBytes(prefix, message))), L);
  const Renc = encodePoint(scalarMulLadder(r, BASE));
  const k = mod(bytesToLE(sha512(concatBytes(Renc, A, message))), L);
  const S = mod(r + k * a, L);
  return concatBytes(Renc, leToBytes(S, 32));
}

/** RFC 8032 §5.1.7 verify, strict cofactored profile (see header). @returns {boolean} */
export function verify(signature, message, publicKey) {
  if (!(signature instanceof Uint8Array) || !(publicKey instanceof Uint8Array)) return false;
  if (typeof message === 'string') message = new TextEncoder().encode(message);
  else if (!(message instanceof Uint8Array)) return false;
  if (signature.length !== 64 || publicKey.length !== 32) return false;
  const sig = Uint8Array.from(signature), Aenc = Uint8Array.from(publicKey);
  const Renc = sig.subarray(0, 32);
  const S = bytesToLE(sig.subarray(32, 64));
  if (S >= L) return false;                                   // canonical S
  let A, R;
  try { A = decodePoint(Aenc); R = decodePoint(Renc); }       // canonical A, R
  catch { return false; }
  if (isSmallOrder(A) || isSmallOrder(R)) return false;       // small-order A or R
  const k = mod(bytesToLE(sha512(concatBytes(Renc, Aenc, message))), L);
  const lhs = mulBy8(scalarMul(S, BASE));
  const rhs = mulBy8(pointAdd(R, scalarMul(k, A)));
  return pointEqual(lhs, rhs);                                // [8]SB == [8](R + kA)
}

export const _internal = {
  p, L, d, BASE, IDENTITY, encodePoint, decodePoint, scalarMul, scalarMulLadder,
  pointAdd, pointDouble, pointEqual, mulBy8, isSmallOrder,
};

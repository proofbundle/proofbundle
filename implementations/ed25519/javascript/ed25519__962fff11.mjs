/**
 * Ed25519 — Executable Specification, from scratch (RFC 8032 §5.1).
 *
 * No external elliptic-curve library. Field arithmetic is plain BigInt
 * modular arithmetic over p = 2^255 - 19. Point arithmetic uses extended
 * twisted Edwards coordinates (Hisil–Wong–Carter–Dawson, unified add
 * formula, complete for this curve since d is a non-square mod p — no
 * exceptional cases to special-case). Hashing is our own from-scratch
 * `sha512` (crypto/sha512.mjs) — no node:crypto, no @noble.
 *
 * Curve: twisted Edwards  -x^2 + y^2 = 1 + d x^2 y^2  over F_p,
 *   p = 2^255 - 19,  d = -121665/121666 mod p.
 * Base point B, order L = 2^252 + 27742317777372353535851937790883648493.
 */
import { sha512 } from './sha512.mjs';

const p = (1n << 255n) - 19n;
const L = (1n << 252n) + 27742317777372353535851937790883648493n;

const mod = (a, m = p) => ((a % m) + m) % m;

function invMod(a, m = p) {
  // Fermat's little theorem: a^(m-2) mod m, since p and L are prime.
  return powMod(mod(a, m), m - 2n, m);
}

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

const d = mod(-121665n * invMod(121666n));
const d2 = mod(2n * d);

// Extended coordinates: (X, Y, Z, T) represents affine (X/Z, Y/Z), T = XY/Z.
const IDENTITY = { X: 0n, Y: 1n, Z: 1n, T: 0n };

function pointAdd(P, Q) {
  // Unified addition formula (RFC 8032 / Hisil et al.), complete on this curve.
  const A = mod((P.Y - P.X) * (Q.Y - Q.X));
  const B = mod((P.Y + P.X) * (Q.Y + Q.X));
  const C = mod(P.T * d2 % p * Q.T);
  const Dd = mod(2n * P.Z * Q.Z);
  const E = mod(B - A);
  const F = mod(Dd - C);
  const G = mod(Dd + C);
  const H = mod(B + A);
  return { X: mod(E * F), Y: mod(G * H), Z: mod(F * G), T: mod(E * H) };
}

function pointDouble(P) {
  return pointAdd(P, P);
}

function scalarMul(scalar, P) {
  let result = IDENTITY;
  let addend = P;
  let k = scalar;
  while (k > 0n) {
    if (k & 1n) result = pointAdd(result, addend);
    addend = pointDouble(addend);
    k >>= 1n;
  }
  return result;
}

// Recover x from y using the curve equation: x^2 = (y^2-1) / (d y^2 + 1).
function xRecover(y) {
  const y2 = mod(y * y);
  const u = mod(y2 - 1n);
  const v = mod(d * y2 + 1n);
  const vInv = invMod(v);
  const x2 = mod(u * vInv);
  // p ≡ 5 (mod 8): candidate sqrt is x2^((p+3)/8).
  let x = powMod(x2, (p + 3n) / 8n, p);
  if (mod(x * x) !== mod(x2)) {
    // multiply by sqrt(-1) mod p
    const sqrtM1 = powMod(2n, (p - 1n) / 4n, p);
    x = mod(x * sqrtM1);
  }
  if (mod(x * x) !== mod(x2)) throw new Error('ed25519: no square root — invalid point');
  if (x === 0n && (y2 !== 1n || v === 0n)) throw new Error('ed25519: invalid point (x=0 disallowed here)');
  return x;
}

const By = mod(4n * invMod(5n));
const Bx = xRecoverPositive(By);
function xRecoverPositive(y) {
  let x = xRecover(y);
  if ((x & 1n) !== 0n) x = mod(p - x); // RFC 8032 base point has even x
  return x;
}
const BASE = { X: Bx, Y: By, Z: 1n, T: mod(Bx * By) };

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

function decodePoint(bytes) {
  if (bytes.length !== 32) throw new Error('ed25519: point must be 32 bytes');
  const signBit = (bytes[31] & 0x80) !== 0;
  const yBytes = bytes.slice();
  yBytes[31] &= 0x7f;
  const y = bytesToLE(yBytes);
  if (y >= p) throw new Error('ed25519: invalid point (y >= p)');
  let x = xRecover(y);
  if ((x & 1n) !== BigInt(signBit ? 1 : 0)) x = mod(p - x);
  return { X: x, Y: y, Z: 1n, T: mod(x * y) };
}

// ── RFC 8032 §5.1.5 key generation ──
function clampScalar(bytes32) {
  const b = bytes32.slice();
  b[0] &= 0xf8;
  b[31] &= 0x7f;
  b[31] |= 0x40;
  return bytesToLE(b);
}

/** @param {Uint8Array} seed 32-byte secret seed. @returns {{publicKey:Uint8Array, secretKey:Uint8Array}} secretKey is the 32-byte seed (RFC 8032 convention). */
export function keyPairFromSeed(seed) {
  if (!(seed instanceof Uint8Array) || seed.length !== 32) throw new Error('ed25519: seed must be 32 bytes');
  const h = sha512(seed);
  const scalar = clampScalar(h.slice(0, 32));
  const A = scalarMul(scalar, BASE);
  return { publicKey: encodePoint(A), secretKey: seed };
}

function concatBytes(...arrs) {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}

/** RFC 8032 §5.1.6 sign. @returns {Uint8Array} 64-byte signature (R || S). */
export function sign(message, seed) {
  if (!(message instanceof Uint8Array)) message = new TextEncoder().encode(message);
  const h = sha512(seed);
  const scalar = clampScalar(h.slice(0, 32));
  const prefix = h.slice(32, 64);
  const A = encodePoint(scalarMul(scalar, BASE));

  const rHash = sha512(concatBytes(prefix, message));
  const r = mod(bytesToLE(rHash), L);
  const R = scalarMul(r, BASE);
  const Renc = encodePoint(R);

  const kHash = sha512(concatBytes(Renc, A, message));
  const k = mod(bytesToLE(kHash), L);
  const S = mod(r + k * scalar, L);

  return concatBytes(Renc, leToBytes(S, 32));
}

/** RFC 8032 §5.1.7 verify. @returns {boolean} */
export function verify(signature, message, publicKey) {
  if (!(message instanceof Uint8Array)) message = new TextEncoder().encode(message);
  if (signature.length !== 64) return false;
  const Renc = signature.slice(0, 32);
  const Sbytes = signature.slice(32, 64);
  const S = bytesToLE(Sbytes);
  if (S >= L) return false; // reject non-canonical S (RFC 8032 malleability guard)

  let A, R;
  try {
    A = decodePoint(publicKey);
    R = decodePoint(Renc);
  } catch {
    return false;
  }

  const kHash = sha512(concatBytes(Renc, publicKey, message));
  const k = mod(bytesToLE(kHash), L);

  // Check S*B == R + k*A, via the equivalent 8*S*B == 8*R + 8*k*A (cofactor-safe,
  // matches RFC 8032's recommended batch-safe verification equation).
  const lhs = scalarMul(mod(8n * S, L), BASE);
  const rhs = pointAdd(scalarMul(8n, R), scalarMul(mod(8n * k, L), A));
  const la = pointToAffine(lhs), ra = pointToAffine(rhs);
  return la.x === ra.x && la.y === ra.y;
}

export const _internal = { p, L, BASE, encodePoint, decodePoint, scalarMul, pointAdd };

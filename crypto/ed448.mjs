/**
 * Ed448 — Executable Specification, from scratch (RFC 8032 §5.2).
 *
 * No external elliptic-curve library and no node:crypto. Field arithmetic is
 * plain BigInt modular arithmetic over
 *   p = 2^448 - 2^224 - 1.
 * Point arithmetic uses extended coordinates on the untwisted Edwards curve
 *   x^2 + y^2 = 1 + d x^2 y^2,  d = -39081 mod p,
 * with the unified addition formula from RFC 8032 §5.2.4 (no exceptional
 * cases for this curve). Hashing is our own from-scratch SHAKE256
 * (crypto/keccak.mjs).
 *
 * Keys are 57 bytes, signatures 114 bytes. The sign bit of x is the top bit
 * of the last byte of an encoding.
 *
 * Spec: RFC 8032 "Edwards-Curve Digital Signature Algorithm (EdDSA)"
 *
 * TEST RESULT: cross-checked against node:crypto (OpenSSL 3.5.7) for key
 * derivation, signature bytes and verification, against the Ed448 ground
 * truth vector on disk, and for rejection of altered signatures.
 */
import { shake256 } from './keccak.mjs';

const p = (1n << 448n) - (1n << 224n) - 1n;
const d = p - 39081n;
const L = (1n << 446n) -
  13818066809895115352007386748515426880336692474882178609894547503885n;

const mod = (a, m = p) => ((a % m) + m) % m;

function powMod(base, exp, m) {
  base = mod(base, m);
  let result = 1n;
  while (exp > 0n) {
    if (exp & 1n) result = mod(result * base, m);
    exp >>= 1n;
    base = mod(base * base, m);
  }
  return result;
}

function invMod(a, m = p) {
  return powMod(mod(a, m), m - 2n, m);
}

// Square root mod p. p = 3 mod 4, so a^((p+1)/4) is a root when one exists.
function sqrtMod(a) {
  const r = powMod(a, (p + 1n) / 4n, p);
  return mod(r * r) === mod(a) ? r : null;
}

function bytesToLE(bytes) {
  let v = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) v = (v << 8n) | BigInt(bytes[i]);
  return v;
}

function leToBytes(v, len) {
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function concat(...arrays) {
  let n = 0;
  for (const a of arrays) n += a.length;
  const out = new Uint8Array(n);
  let at = 0;
  for (const a of arrays) { out.set(a, at); at += a.length; }
  return out;
}

// ── curve points (extended coordinates X:Y:Z) ──
const IDENTITY = { X: 0n, Y: 1n, Z: 1n };

// Unified addition for a = 1 (extended coordinates, X:Y:Z standing for x/y).
// Derived from the affine law in RFC 8032 §5.2.4:
//   x3 = (x1y2 + x2y1)/(1 + d x1x2y1y2),  y3 = (y1y2 - x1x2)/(1 - d x1x2y1y2)
// The a = -1 formula used for Ed25519 does not apply here; the B*G / B*F
// pairing below was checked against the affine formula and against
// [L]B = identity.
function pointAdd(P, Q) {
  const A = mod(P.Z * Q.Z);
  const B = mod(A * A);
  const C = mod(P.X * Q.X);
  const D = mod(P.Y * Q.Y);
  const E = mod(d * C * D);
  const F = mod(B + E);
  const G = mod(B - E);
  const H = mod((P.X + P.Y) * (Q.X + Q.Y));
  return {
    X: mod(B * G * mod(H - C - D)),
    Y: mod(B * F * mod(D - C)),
    Z: mod(A * F * G),
  };
}

function scalarMul(k, P) {
  let result = IDENTITY;
  let addend = P;
  let n = mod(k, L);
  while (n > 0n) {
    if (n & 1n) result = pointAdd(result, addend);
    addend = pointAdd(addend, addend);
    n >>= 1n;
  }
  return result;
}

function pointToAffine(P) {
  const zInv = invMod(P.Z);
  return { x: mod(P.X * zInv), y: mod(P.Y * zInv) };
}

function encodePoint(P) {
  const { x, y } = pointToAffine(P);
  const bytes = leToBytes(y, 57);
  if (x & 1n) bytes[56] |= 0x80;
  return bytes;
}

// x^2 = (y^2 - 1) / (d y^2 - 1)
function decodePoint(bytes) {
  if (bytes.length !== 57) throw new Error('ed448: point must be 57 bytes');
  const sign = (bytes[56] & 0x80) !== 0;
  const yBytes = Uint8Array.from(bytes);
  yBytes[56] &= 0x7f;
  const y = bytesToLE(yBytes);
  if (y >= p) throw new Error('ed448: invalid point encoding (y >= p)');
  const y2 = mod(y * y);
  const num = mod(y2 - 1n);
  const den = mod(d * y2 - 1n);
  const x2 = mod(num * invMod(den));
  let x = sqrtMod(x2);
  if (x === null) throw new Error('ed448: invalid point encoding (not on curve)');
  if (x === 0n && sign) throw new Error('ed448: invalid point encoding (x = 0)');
  if ((x & 1n) !== BigInt(sign ? 1 : 0)) x = mod(p - x);
  return { X: x, Y: y, Z: 1n };
}

// Base point from RFC 8032 §5.2.
const BASE = {
  X: 224580040295924300187604334099896036246789641632564134246125461686950415467406032909029192869357953282578032075146446173674602635247710n,
  Y: 298819210078481492676017930443930673437544040154080242095928241372331506189835876003536878655418784733982303233503462500531545062832660n,
  Z: 1n,
};

// ── RFC 8032 §5.2.5 key generation ──
// h = SHAKE256(seed, 114); s = h[0..57) pruned; prefix = h[57..114).
function expandSeed(seed) {
  if (!(seed instanceof Uint8Array) || seed.length !== 57) {
    throw new Error('ed448: seed must be 57 bytes');
  }
  const h = shake256(seed, 114);
  const s = h.slice(0, 57);
  s[0] &= 252;
  s[55] |= 128;
  s[56] = 0;
  return { scalar: bytesToLE(s), prefix: h.slice(57, 114) };
}

/** @returns {{publicKey: Uint8Array, secretKey: Uint8Array}} secretKey is the 57-byte seed. */
export function keyPairFromSeed(seed) {
  const { scalar } = expandSeed(seed);
  const publicKey = encodePoint(scalarMul(scalar, BASE));
  return { publicKey, secretKey: Uint8Array.from(seed) };
}

// dom4(x, context) = "SigEd448" || octet(x) || octet(len(context)) || context
function dom4(prehash, context) {
  if (!(context instanceof Uint8Array)) throw new TypeError('ed448: context must be a Uint8Array');
  if (context.length > 255) throw new RangeError('ed448: context must be at most 255 bytes');
  return concat(
    Uint8Array.from([0x53, 0x69, 0x67, 0x45, 0x64, 0x34, 0x34, 0x38]), // "SigEd448"
    Uint8Array.from([prehash ? 1 : 0, context.length]),
    context,
  );
}

function hashToScalar(...parts) {
  return mod(bytesToLE(shake256(concat(...parts), 114)), L);
}

/** @param {Uint8Array} message @param {Uint8Array} seed 57-byte seed @param {Uint8Array} [context] */
export function sign(message, seed, context = new Uint8Array(0)) {
  const { scalar, prefix } = expandSeed(seed);
  const A = encodePoint(scalarMul(scalar, BASE));
  const dom = dom4(false, context);
  const r = hashToScalar(dom, prefix, message);
  const R = encodePoint(scalarMul(r, BASE));
  const k = hashToScalar(dom, R, A, message);
  const S = mod(r + k * scalar, L);
  return concat(R, leToBytes(S, 57));
}

/** @returns {boolean} */
export function verify(signature, message, publicKey, context = new Uint8Array(0)) {
  try {
    if (!(signature instanceof Uint8Array) || signature.length !== 114) return false;
    if (!(publicKey instanceof Uint8Array) || publicKey.length !== 57) return false;
    const Renc = signature.slice(0, 57);
    const S = bytesToLE(signature.slice(57));
    if (S >= L) return false;
    const A = decodePoint(publicKey);
    const R = decodePoint(Renc);
    const k = hashToScalar(dom4(false, context), Renc, publicKey, message);
    const lhs = scalarMul(S, BASE);
    const rhs = pointAdd(R, scalarMul(k, A));
    return mod(lhs.X * rhs.Z) === mod(rhs.X * lhs.Z) &&
           mod(lhs.Y * rhs.Z) === mod(rhs.Y * lhs.Z);
  } catch {
    return false;
  }
}

export const _internal = { p, d, L, BASE, encodePoint, decodePoint, pointAdd, scalarMul };

// ---- added 2026-11-24 by claude-opus-5-5: rfc 8032 §5.2 ed448ph ----
// ed448ph signs SHAKE256(M, 64) under dom4(1, ctx). the pure ed448 functions above are unchanged.
export function signPh(message, seed, context = new Uint8Array(0)) { return signDom4(shake256(message, 64), seed, context, true); }
export function verifyPh(signature, message, publicKey, context = new Uint8Array(0)) { return verifyDom4(signature, shake256(message, 64), publicKey, context, true); }
function signDom4(message, seed, context, ph) {
  const { scalar, prefix } = expandSeed(seed);
  const A = encodePoint(scalarMul(scalar, BASE)), dom = dom4(ph, context);
  const r = hashToScalar(dom, prefix, message), R = encodePoint(scalarMul(r, BASE));
  const k = hashToScalar(dom, R, A, message);
  return concat(R, leToBytes(mod(r + k * scalar, L), 57));
}
function verifyDom4(signature, message, publicKey, context, ph) {
  try {
    if (!(signature instanceof Uint8Array) || signature.length !== 114 || !(publicKey instanceof Uint8Array) || publicKey.length !== 57) return false;
    const Renc = signature.slice(0, 57), S = bytesToLE(signature.slice(57)); if (S >= L) return false;
    const A = decodePoint(publicKey), R = decodePoint(Renc), k = hashToScalar(dom4(ph, context), Renc, publicKey, message);
    const lhs = scalarMul(S, BASE), rhs = pointAdd(R, scalarMul(k, A));
    return mod(lhs.X * rhs.Z) === mod(rhs.X * lhs.Z) && mod(lhs.Y * rhs.Z) === mod(rhs.Y * lhs.Z);
  } catch { return false; }
}

// From-scratch ML-DSA (FIPS 204) — Module-Lattice-Based Digital Signature Algorithm
// (the Dilithium-based signature scheme). Pure JS. No external crypto library.
// Hashing comes entirely from our own keccak.mjs (SHAKE128 / SHAKE256).
//
// Implements ML-DSA-44, ML-DSA-65 and ML-DSA-87.
//
// Spec: FIPS 204, https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf
// Algorithm names in comments refer to that document (Power2Round, Decompose,
// MakeHint/UseHint, ExpandA/ExpandS/ExpandMask, SampleInBall, pkEncode/skEncode/
// sigEncode and their inverses, KeyGen/Sign/Verify internal algorithms).
//
// Unlike ML-KEM (q=3329, 7-layer *incomplete* NTT leaving 128 irreducible
// quadratic factors), ML-DSA's modulus q=8380417 satisfies q ≡ 1 (mod 512),
// so X^256+1 splits completely into 256 linear factors mod q. That means a
// full 8-layer NTT is possible, and multiplication in the NTT domain is
// literally coordinatewise (no 2x2 base-case multiply as in ML-KEM).

import { shake128, shake256 } from './keccak.mjs';

const N = 256;              // polynomial degree
const Q = 8380417;          // modulus, 2^23 - 2^13 + 1
const ZETA = 1753;          // primitive 512th root of unity mod Q (full NTT)
const D = 13;                // Power2Round / t0 bit-dropping parameter (fixed by spec)

// ---------------------------------------------------------------------------
// Modular arithmetic helpers
// ---------------------------------------------------------------------------

function mod(a, m) { const r = a % m; return r < 0 ? r + m : r; }

// Centered representative: mod±(a, m) in (-m/2, m/2].
function modPM(a, m) {
  const r = mod(a, m);
  return r > Math.floor(m / 2) ? r - m : r;
}

function powMod(base, exp, m) {
  let result = 1, b = mod(base, m), e = exp;
  while (e > 0) {
    if (e & 1) result = (result * b) % m;
    b = (b * b) % m;
    e >>>= 1;
  }
  return result;
}

// Number of bits needed to represent integer x >= 0 (0 -> 0).
function bitlen(x) {
  let n = 0;
  while (x > 0) { n++; x = Math.floor(x / 2); }
  return n;
}

function concat(...arrays) {
  let total = 0;
  for (const a of arrays) total += a.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

function eqBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function toBytes(x) {
  return typeof x === 'string' ? new TextEncoder().encode(x) : x;
}

// ---------------------------------------------------------------------------
// Number-Theoretic Transform — full 8-layer NTT (Algorithms "NTT"/"NTT^-1").
// Derived from first principles (bit-reversed powers of zeta), not transcribed
// from a table, so a typo cannot silently corrupt the transform.
// ---------------------------------------------------------------------------

function bitRev8(i) {
  let r = 0;
  for (let b = 0; b < 8; b++) if (i & (1 << b)) r |= 1 << (7 - b);
  return r;
}

const ZETAS = new Int32Array(256);
for (let i = 0; i < 256; i++) ZETAS[i] = powMod(ZETA, bitRev8(i), Q);

export function ntt(f) {
  const a = Int32Array.from(f);
  let k = 0;
  for (let len = 128; len >= 1; len >>= 1) {
    for (let start = 0; start < N; start += 2 * len) {
      const z = ZETAS[++k];
      for (let j = start; j < start + len; j++) {
        const t = mod(z * a[j + len], Q);
        a[j + len] = mod(a[j] - t, Q);
        a[j] = mod(a[j] + t, Q);
      }
    }
  }
  return a;
}

export function nttInverse(fHat) {
  const a = Int32Array.from(fHat);
  let k = 256;
  for (let len = 1; len <= 128; len <<= 1) {
    for (let start = 0; start < N; start += 2 * len) {
      const z = ZETAS[--k];
      for (let j = start; j < start + len; j++) {
        const t = a[j];
        a[j] = mod(t + a[j + len], Q);
        a[j + len] = mod(z * mod(a[j + len] - t, Q), Q);
      }
    }
  }
  const invN = powMod(N, Q - 2, Q); // N^-1 mod Q
  for (let j = 0; j < N; j++) a[j] = mod(a[j] * invN, Q);
  return a;
}

// MultiplyNTT: since X^256+1 splits completely (256 distinct linear factors),
// the NTT domain is literally 256 field evaluations, so multiplication there
// is plain coordinatewise product — no base-case 2x2 multiply needed.
export function multiplyNTTs(aHat, bHat) {
  const c = new Int32Array(N);
  for (let i = 0; i < N; i++) c[i] = mod(aHat[i] * bHat[i], Q);
  return c;
}

function polyAdd(a, b) {
  const c = new Int32Array(N);
  for (let i = 0; i < N; i++) c[i] = (a[i] + b[i]) % Q;
  return c;
}

function polySub(a, b) {
  const c = new Int32Array(N);
  for (let i = 0; i < N; i++) c[i] = mod(a[i] - b[i], Q);
  return c;
}

// Schoolbook multiplication in Z_q[X]/(X^256+1). Not used by ML-DSA itself;
// exported so tests can check the NTT path against a direct computation.
export function polyMulSchoolbook(a, b) {
  const c = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const prod = (a[i] * b[j]) % Q;
      const k = i + j;
      if (k < N) c[k] = (c[k] + prod) % Q;
      else c[k - N] = mod(c[k - N] - prod, Q);   // X^256 = -1
    }
  }
  return c;
}

// ---------------------------------------------------------------------------
// Vector helpers (arrays of polynomials)
// ---------------------------------------------------------------------------

const vecNTT = (v) => v.map(ntt);
const vecNTTInverse = (v) => v.map(nttInverse);
const vecAdd = (a, b) => a.map((p, i) => polyAdd(p, b[i]));
const vecSub = (a, b) => a.map((p, i) => polySub(p, b[i]));
const vecNeg = (v) => v.map((p) => { const r = new Int32Array(N); for (let i = 0; i < N; i++) r[i] = mod(-p[i], Q); return r; });

// (k x l) matrix (NTT domain) times l-vector (NTT domain) -> k-vector (NTT domain)
function matVecMulNTT(A, vHat, k, l) {
  const out = [];
  for (let i = 0; i < k; i++) {
    let acc = new Int32Array(N);
    for (let j = 0; j < l; j++) acc = polyAdd(acc, multiplyNTTs(A[i][j], vHat[j]));
    out.push(acc);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Rounding: Power2Round, Decompose, HighBits/LowBits, MakeHint/UseHint
// ---------------------------------------------------------------------------

// Power2Round(r): r = r1*2^D + r0, r0 in (-2^(D-1), 2^(D-1)]. Exact integer
// reconstruction always holds (no boundary special-case, unlike Decompose).
export function power2round(r) {
  const rPlus = mod(r, Q);
  const r0 = modPM(rPlus, 1 << D);
  const r1 = (rPlus - r0) / (1 << D);
  return [r1, r0];
}

// Decompose(r, gamma2): r = r1*(2*gamma2) + r0 (mod q) — boundary case wraps.
export function decompose(r, gamma2) {
  const rPlus = mod(r, Q);
  let r0 = modPM(rPlus, 2 * gamma2);
  let r1;
  if (rPlus - r0 === Q - 1) { r1 = 0; r0 = r0 - 1; }
  else { r1 = (rPlus - r0) / (2 * gamma2); }
  return [r1, r0];
}

function highBits(r, gamma2) { return decompose(r, gamma2)[0]; }
function lowBits(r, gamma2) { return decompose(r, gamma2)[1]; }

function makeHint(z, r, gamma2) {
  const r1 = highBits(r, gamma2);
  const v1 = highBits(mod(r + z, Q), gamma2);
  return r1 !== v1 ? 1 : 0;
}

function useHint(h, r, gamma2) {
  const m = (Q - 1) / (2 * gamma2);
  const [r1, r0] = decompose(r, gamma2);
  if (h === 1) {
    if (r0 > 0) return mod(r1 + 1, m);
    return mod(r1 - 1, m);
  }
  return r1;
}

function highBitsVec(v, gamma2) {
  return v.map((p) => { const r = new Int32Array(N); for (let i = 0; i < N; i++) r[i] = highBits(p[i], gamma2); return r; });
}
function lowBitsVec(v, gamma2) {
  return v.map((p) => { const r = new Int32Array(N); for (let i = 0; i < N; i++) r[i] = lowBits(p[i], gamma2); return r; });
}
function makeHintVec(zv, rv, gamma2) {
  return zv.map((zp, idx) => {
    const rp = rv[idx];
    const h = new Int32Array(N);
    for (let i = 0; i < N; i++) h[i] = makeHint(zp[i], rp[i], gamma2);
    return h;
  });
}
function useHintVec(hv, rv, gamma2) {
  return hv.map((hp, idx) => {
    const rp = rv[idx];
    const r = new Int32Array(N);
    for (let i = 0; i < N; i++) r[i] = useHint(hp[i], rp[i], gamma2);
    return r;
  });
}

function normInfPoly(p) {
  let m = 0;
  for (let i = 0; i < N; i++) { const c = Math.abs(modPM(p[i], Q)); if (c > m) m = c; }
  return m;
}
function normInfVec(v) {
  let m = 0;
  for (const p of v) { const n = normInfPoly(p); if (n > m) m = n; }
  return m;
}
function countOnesVec(v) {
  let c = 0;
  for (const p of v) for (let i = 0; i < N; i++) if (p[i]) c++;
  return c;
}

// ---------------------------------------------------------------------------
// Bit packing (Algorithms SimpleBitPack/BitPack and their inverses)
// ---------------------------------------------------------------------------

// Pack N coefficients, each in [0, 2^bits - 1], `bits` bits apiece, LSB first.
function simpleBitPack(f, bits) {
  const out = new Uint8Array(32 * bits); // 256*bits/8, always exact since 256/8=32
  let bitPos = 0;
  for (let i = 0; i < N; i++) {
    const v = f[i];
    for (let b = 0; b < bits; b++) {
      if ((v >> b) & 1) out[bitPos >> 3] |= 1 << (bitPos & 7);
      bitPos++;
    }
  }
  return out;
}

function simpleBitUnpack(bytes, bits) {
  const f = new Int32Array(N);
  let bitPos = 0;
  for (let i = 0; i < N; i++) {
    let v = 0;
    for (let b = 0; b < bits; b++) {
      const bit = (bytes[bitPos >> 3] >> (bitPos & 7)) & 1;
      v |= bit << b;
      bitPos++;
    }
    f[i] = v;
  }
  return f;
}

// Signed packing: coefficient w in [-(bound-off) .. off]-style ranges are
// encoded as (offset - w) in [0, 2^bits - 1], the standard ML-DSA convention
// for s1/s2 (offset=eta), t0 (offset=2^(D-1)) and z (offset=gamma1).
function bitPackSigned(f, bits, offset) {
  const shifted = new Int32Array(N);
  for (let i = 0; i < N; i++) shifted[i] = offset - f[i];
  return simpleBitPack(shifted, bits);
}
function bitUnpackSigned(bytes, bits, offset) {
  const v = simpleBitUnpack(bytes, bits);
  const f = new Int32Array(N);
  for (let i = 0; i < N; i++) f[i] = offset - v[i];
  return f;
}

// HintEncode/HintDecode: omega positions (one byte each, run-length grouped
// per polynomial) + k cumulative counts.
function hintEncode(hVecs, k, omega) {
  const enc = new Uint8Array(omega + k);
  let index = 0;
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < N; j++) {
      if (hVecs[i][j] !== 0) { enc[index] = j; index++; }
    }
    enc[omega + i] = index;
  }
  return enc;
}
function hintDecode(enc, k, omega) {
  if (enc.length !== omega + k) return null;
  const h = [];
  for (let i = 0; i < k; i++) h.push(new Int32Array(N));
  let index = 0;
  for (let i = 0; i < k; i++) {
    const yi = enc[omega + i];
    if (yi < index || yi > omega) return null;
    for (let j = index; j < yi; j++) {
      if (j > index && enc[j] <= enc[j - 1]) return null;
      h[i][enc[j]] = 1;
    }
    index = yi;
  }
  for (let j = index; j < omega; j++) if (enc[j] !== 0) return null;
  return h;
}

function w1Bits(gamma2) { return bitlen(Math.floor((Q - 1) / (2 * gamma2)) - 1); }
function w1Encode(w1, gamma2) {
  const bits = w1Bits(gamma2);
  return concat(...w1.map((p) => simpleBitPack(p, bits)));
}

// ---------------------------------------------------------------------------
// Sampling (ExpandA / ExpandS / ExpandMask / SampleInBall)
// ---------------------------------------------------------------------------

// RejNTTPoly: uniform rejection sampling of an NTT-domain polynomial from a
// 34-byte seed via SHAKE128 — reads 3 bytes (24 bits) at a time, keeps a
// 23-bit candidate if it is < Q. Mirrors ML-KEM's sampleNTT structure.
function rejNTTPoly(rho, r, s) {
  const seed = new Uint8Array(34);
  seed.set(rho);
  seed[32] = s;
  seed[33] = r;

  const a = new Int32Array(N);
  let count = 0;
  let need = 168 * 3;
  let bytes = shake128(seed, need);
  let pos = 0;

  while (count < N) {
    if (pos + 3 > bytes.length) {
      need += 168 * 3;
      bytes = shake128(seed, need); // prefix-stable stream
    }
    const cand = bytes[pos] | (bytes[pos + 1] << 8) | ((bytes[pos + 2] & 0x7F) << 16);
    pos += 3;
    if (cand < Q) a[count++] = cand;
  }
  return a;
}

function expandA(rho, k, l) {
  const A = [];
  for (let r = 0; r < k; r++) {
    const row = [];
    for (let s = 0; s < l; s++) row.push(rejNTTPoly(rho, r, s));
    A.push(row);
  }
  return A;
}

// RejBoundedPoly: sample coefficients uniformly in [-eta, eta] from a SHAKE256
// stream keyed on a 64-byte seed plus a 2-byte little-endian nonce.
function rejBoundedPoly(seed64, nonce, eta) {
  const input = new Uint8Array(66);
  input.set(seed64);
  input[64] = nonce & 0xFF;
  input[65] = (nonce >> 8) & 0xFF;

  const a = new Int32Array(N);
  let count = 0;
  let need = 136 * 2;
  let bytes = shake256(input, need);
  let pos = 0;

  while (count < N) {
    if (pos >= bytes.length) {
      need += 136 * 2;
      bytes = shake256(input, need);
    }
    const byte = bytes[pos++];
    const t0 = byte & 0x0F, t1 = byte >> 4;
    if (eta === 2) {
      if (t0 < 15 && count < N) a[count++] = 2 - (t0 % 5);
      if (t1 < 15 && count < N) a[count++] = 2 - (t1 % 5);
    } else { // eta === 4
      if (t0 < 9 && count < N) a[count++] = 4 - t0;
      if (t1 < 9 && count < N) a[count++] = 4 - t1;
    }
  }
  return a;
}

function expandS(rhoPrime, k, l, eta) {
  const s1 = [], s2 = [];
  let nonce = 0;
  for (let i = 0; i < l; i++) s1.push(rejBoundedPoly(rhoPrime, nonce++, eta));
  for (let i = 0; i < k; i++) s2.push(rejBoundedPoly(rhoPrime, nonce++, eta));
  return { s1, s2 };
}

// ExpandMask: sample y coefficients in (-gamma1, gamma1] directly (2*gamma1
// is a power of 2, so this is a direct bit-unpack, no rejection needed).
function expandMaskPoly(rhoDoublePrime, nonce, gamma1, bits) {
  const input = new Uint8Array(66);
  input.set(rhoDoublePrime);
  input[64] = nonce & 0xFF;
  input[65] = (nonce >> 8) & 0xFF;
  const need = 32 * bits;
  const bytes = shake256(input, need);
  const v = simpleBitUnpack(bytes, bits);
  const f = new Int32Array(N);
  for (let i = 0; i < N; i++) f[i] = gamma1 - v[i];
  return f;
}
function expandMask(rhoDoublePrime, kappa, l, gamma1) {
  const bits = bitlen(2 * gamma1 - 1);
  const y = [];
  for (let i = 0; i < l; i++) y.push(expandMaskPoly(rhoDoublePrime, kappa + i, gamma1, bits));
  return y;
}

// SampleInBall: challenge polynomial with exactly tau coefficients in {-1,1},
// the rest 0, derived via a Fisher-Yates-style shuffle seeded from cTilde.
function sampleInBall(cTilde, tau) {
  const c = new Int32Array(N);
  let need = 8 + 136;
  let bytes = shake256(cTilde, need);
  let signs = 0n;
  for (let i = 0; i < 8; i++) signs |= BigInt(bytes[i]) << BigInt(8 * i);
  let pos = 8;

  for (let i = N - tau; i < N; i++) {
    let b;
    for (;;) {
      if (pos >= bytes.length) { need += 136; bytes = shake256(cTilde, need); }
      b = bytes[pos++];
      if (b <= i) break;
    }
    c[i] = c[b];
    c[b] = (signs & 1n) ? -1 : 1;
    signs >>= 1n;
  }
  return c;
}

// ---------------------------------------------------------------------------
// Parameter sets (FIPS 204 Table 1) with a self-check that beta == tau*eta,
// so a transcription typo cannot silently corrupt the rejection bound.
// ---------------------------------------------------------------------------

export const PARAMS = {
  'ML-DSA-44': { k: 4, l: 4, eta: 2, tau: 39, lambda: 128, gamma1: 1 << 17, gamma2: Math.floor((Q - 1) / 88), omega: 80, beta: 78 },
  'ML-DSA-65': { k: 6, l: 5, eta: 4, tau: 49, lambda: 192, gamma1: 1 << 19, gamma2: Math.floor((Q - 1) / 32), omega: 55, beta: 196 },
  'ML-DSA-87': { k: 8, l: 7, eta: 2, tau: 60, lambda: 256, gamma1: 1 << 19, gamma2: Math.floor((Q - 1) / 32), omega: 75, beta: 120 },
};
for (const [name, p] of Object.entries(PARAMS)) {
  if (p.beta !== p.tau * p.eta) throw new Error(`${name}: beta != tau*eta`);
}

function polyBytes(bits) { return 32 * bits; }

function pkLength(prm) { return 32 + prm.k * polyBytes(10); }
function skLength(prm) {
  const etaBits = bitlen(2 * prm.eta);
  return 32 + 32 + 64 + (prm.l + prm.k) * polyBytes(etaBits) + prm.k * polyBytes(D);
}
function sigLength(prm) {
  const zBits = bitlen(2 * prm.gamma1 - 1);
  return (prm.lambda / 4) + prm.l * polyBytes(zBits) + prm.omega + prm.k;
}

// ---------------------------------------------------------------------------
// Encoding: pk = rho || t1 ; sk = rho || K || tr || s1 || s2 || t0 ;
// sig = cTilde || z || h
// ---------------------------------------------------------------------------

function pkEncode(rho, t1, prm) {
  return concat(rho, ...t1.map((p) => simpleBitPack(p, 10)));
}
function pkDecode(pk, prm) {
  if (pk.length !== pkLength(prm)) throw new Error('pkDecode: bad length');
  const rho = pk.slice(0, 32);
  const t1 = [];
  let off = 32;
  const pb = polyBytes(10);
  for (let i = 0; i < prm.k; i++) { t1.push(simpleBitUnpack(pk.slice(off, off + pb), 10)); off += pb; }
  return { rho, t1 };
}

function skEncode(rho, K, tr, s1, s2, t0, prm) {
  const etaBits = bitlen(2 * prm.eta);
  const s1b = s1.map((p) => bitPackSigned(p, etaBits, prm.eta));
  const s2b = s2.map((p) => bitPackSigned(p, etaBits, prm.eta));
  const t0b = t0.map((p) => bitPackSigned(p, D, 1 << (D - 1)));
  return concat(rho, K, tr, ...s1b, ...s2b, ...t0b);
}
function skDecode(sk, prm) {
  if (sk.length !== skLength(prm)) throw new Error('skDecode: bad length');
  const etaBits = bitlen(2 * prm.eta);
  const etaPB = polyBytes(etaBits);
  const t0PB = polyBytes(D);
  let off = 0;
  const rho = sk.slice(0, 32); off += 32;
  const K = sk.slice(off, off + 32); off += 32;
  const tr = sk.slice(off, off + 64); off += 64;
  const s1 = [];
  for (let i = 0; i < prm.l; i++) { s1.push(bitUnpackSigned(sk.slice(off, off + etaPB), etaBits, prm.eta)); off += etaPB; }
  const s2 = [];
  for (let i = 0; i < prm.k; i++) { s2.push(bitUnpackSigned(sk.slice(off, off + etaPB), etaBits, prm.eta)); off += etaPB; }
  const t0 = [];
  for (let i = 0; i < prm.k; i++) { t0.push(bitUnpackSigned(sk.slice(off, off + t0PB), D, 1 << (D - 1))); off += t0PB; }
  return { rho, K, tr, s1, s2, t0 };
}

function sigEncode(cTilde, z, h, prm) {
  const zBits = bitlen(2 * prm.gamma1 - 1);
  const zb = z.map((p) => bitPackSigned(p, zBits, prm.gamma1));
  const hb = hintEncode(h, prm.k, prm.omega);
  return concat(cTilde, ...zb, hb);
}
function sigDecode(sig, prm) {
  if (sig.length !== sigLength(prm)) return null;
  const zBits = bitlen(2 * prm.gamma1 - 1);
  const zPB = polyBytes(zBits);
  const ctLen = prm.lambda / 4;
  let off = 0;
  const cTilde = sig.slice(0, ctLen); off = ctLen;
  const z = [];
  for (let i = 0; i < prm.l; i++) { z.push(bitUnpackSigned(sig.slice(off, off + zPB), zBits, prm.gamma1)); off += zPB; }
  const hb = sig.slice(off, off + prm.omega + prm.k);
  const h = hintDecode(hb, prm.k, prm.omega);
  if (h === null) return null;
  return { cTilde, z, h };
}

// ---------------------------------------------------------------------------
// ML-DSA internal algorithms (KeyGen_internal, Sign_internal, Verify_internal)
// ---------------------------------------------------------------------------

function keygenInternal(xi, paramName) {
  const prm = PARAMS[paramName];
  // Domain-separate by (k,l) so the same seed under different parameter sets
  // cannot yield related keys — mirrors ML-KEM's kpkeKeyGen appending k.
  const expanded = shake256(concat(xi, new Uint8Array([prm.k, prm.l])), 128);
  const rho = expanded.slice(0, 32);
  const rhoPrime = expanded.slice(32, 96);
  const K = expanded.slice(96, 128);

  const A = expandA(rho, prm.k, prm.l);
  const { s1, s2 } = expandS(rhoPrime, prm.k, prm.l, prm.eta);
  const s1Hat = vecNTT(s1);

  const t = vecAdd(vecNTTInverse(matVecMulNTT(A, s1Hat, prm.k, prm.l)), s2);
  const t1 = [], t0 = [];
  for (const p of t) {
    const p1 = new Int32Array(N), p0 = new Int32Array(N);
    for (let i = 0; i < N; i++) { const [hi, lo] = power2round(p[i]); p1[i] = hi; p0[i] = lo; }
    t1.push(p1); t0.push(p0);
  }

  const pk = pkEncode(rho, t1, prm);
  const tr = shake256(pk, 64);
  const sk = skEncode(rho, K, tr, s1, s2, t0, prm);
  return { publicKey: pk, privateKey: sk };
}

function signInternal(sk, message, rnd, paramName) {
  const prm = PARAMS[paramName];
  const { rho, K, tr, s1, s2, t0 } = skDecode(sk, prm);
  const s1Hat = vecNTT(s1), s2Hat = vecNTT(s2), t0Hat = vecNTT(t0);

  const Mprime = concat(new Uint8Array([0, 0]), message); // domain=0 (pure), ctx-len=0 (empty ctx)
  const mu = shake256(concat(tr, Mprime), 64);
  const rhoDoublePrime = shake256(concat(K, rnd, mu), 64);
  const A = expandA(rho, prm.k, prm.l);

  let kappa = 0;
  let result = null;
  const MAX_ATTEMPTS = 1000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS && !result; attempt++) {
    const y = expandMask(rhoDoublePrime, kappa, prm.l, prm.gamma1);
    const w = vecNTTInverse(matVecMulNTT(A, vecNTT(y), prm.k, prm.l));
    const w1 = highBitsVec(w, prm.gamma2);
    const cTilde = shake256(concat(mu, w1Encode(w1, prm.gamma2)), prm.lambda / 4);
    const c = sampleInBall(cTilde, prm.tau);
    const cHat = ntt(c);

    const cs1 = vecNTTInverse(s1Hat.map((p) => multiplyNTTs(cHat, p)));
    const cs2 = vecNTTInverse(s2Hat.map((p) => multiplyNTTs(cHat, p)));

    const zCand = vecAdd(y, cs1);
    const wMinusCs2 = vecSub(w, cs2);
    const r0 = lowBitsVec(wMinusCs2, prm.gamma2);

    kappa += prm.l;

    if (normInfVec(zCand) >= prm.gamma1 - prm.beta) continue;
    if (normInfVec(r0) >= prm.gamma2 - prm.beta) continue;

    const ct0 = vecNTTInverse(t0Hat.map((p) => multiplyNTTs(cHat, p)));
    if (normInfVec(ct0) >= prm.gamma2) continue;

    const hCand = makeHintVec(vecNeg(ct0), vecAdd(wMinusCs2, ct0), prm.gamma2);
    if (countOnesVec(hCand) > prm.omega) continue;

    const z = zCand.map((p) => { const r = new Int32Array(N); for (let i = 0; i < N; i++) r[i] = modPM(p[i], Q); return r; });
    result = sigEncode(cTilde, z, hCand, prm);
  }

  if (!result) throw new Error('ML-DSA sign: exceeded max rejection attempts');
  return result;
}

function verifyInternal(pk, message, sig, paramName) {
  const prm = PARAMS[paramName];
  if (pk.length !== pkLength(prm)) return false;
  if (sig.length !== sigLength(prm)) return false;

  const { rho, t1 } = pkDecode(pk, prm);
  const parsedSig = sigDecode(sig, prm);
  if (parsedSig === null) return false;
  const { cTilde, z, h } = parsedSig;

  if (normInfVec(z) >= prm.gamma1 - prm.beta) return false;
  if (countOnesVec(h) > prm.omega) return false;

  const tr = shake256(pk, 64);
  const Mprime = concat(new Uint8Array([0, 0]), message);
  const mu = shake256(concat(tr, Mprime), 64);

  const A = expandA(rho, prm.k, prm.l);
  const c = sampleInBall(cTilde, prm.tau);
  const cHat = ntt(c);

  const AzHat = matVecMulNTT(A, vecNTT(z), prm.k, prm.l);
  const t1Shifted = t1.map((p) => { const r = new Int32Array(N); for (let i = 0; i < N; i++) r[i] = mod(p[i] * (1 << D), Q); return r; });
  const ct1Hat = vecNTT(t1Shifted).map((p) => multiplyNTTs(cHat, p));

  const wApprox = vecNTTInverse(AzHat.map((p, i) => polySub(p, ct1Hat[i])));
  const w1p = useHintVec(h, wApprox, prm.gamma2);
  const cTildePrime = shake256(concat(mu, w1Encode(w1p, prm.gamma2)), prm.lambda / 4);

  return eqBytes(cTilde, cTildePrime);
}

// ---------------------------------------------------------------------------
// Public API. Randomness is supplied entirely by the caller — nothing here
// reaches for an ambient entropy source — so every operation is reproducible.
// ---------------------------------------------------------------------------

export function mldsaKeygen(seed32, paramName = 'ML-DSA-44') {
  if (!PARAMS[paramName]) throw new Error(`unknown parameter set "${paramName}"`);
  if (seed32.length !== 32) throw new Error('keygen requires a 32-byte seed');
  return keygenInternal(seed32, paramName);
}

export function mldsaSign(privateKey, message, rnd32, paramName = 'ML-DSA-44') {
  if (!PARAMS[paramName]) throw new Error(`unknown parameter set "${paramName}"`);
  if (rnd32.length !== 32) throw new Error('sign requires a 32-byte rnd');
  return signInternal(privateKey, toBytes(message), rnd32, paramName);
}

export function mldsaVerify(publicKey, message, signature, paramName = 'ML-DSA-44') {
  if (!PARAMS[paramName]) throw new Error(`unknown parameter set "${paramName}"`);
  try {
    return verifyInternal(publicKey, toBytes(message), signature, paramName);
  } catch {
    return false;
  }
}

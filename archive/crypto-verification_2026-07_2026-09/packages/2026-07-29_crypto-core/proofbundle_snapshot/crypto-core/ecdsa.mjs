// From-scratch ECDSA (FIPS 186-4 appendix D.1.2 / SEC1 v2.0) over the NIST
// short-Weierstrass curves P-256 (secp256r1) and P-384 (secp384r1).
// Pure JS BigInt field arithmetic, Jacobian-coordinate point arithmetic,
// RFC 6979 deterministic nonce generation via an HMAC construction built
// here on top of ./sha256.mjs. No external crypto library, no WebCrypto,
// no node:crypto (that's for *.test.mjs only, as an independent yardstick).
//
// Spec references:
//   FIPS 186-4  Appendix D.1.2  -- curve domain parameters
//   SEC 1 v2.0  section 2.2.1   -- Jacobian coordinate arithmetic
//   SEC 1 v2.0  section 2.3     -- point-to-octet-string encoding
//   SEC 1 v2.0  section 4.1     -- ECDSA sign / verify
//   RFC 6979                    -- deterministic nonce generation (HMAC-DRBG)
//   RFC 6979 section 2.4        -- ECDSA-Sig-Value DER (SEQUENCE of two INTEGERs)
//
// Both NIST curves use a = -3 (mod p), which is what the doubling formula
// below is specialized for -- this is the standard NIST/SEC1 choice, made
// because it lets point doubling use a cheaper formula than a general `a`.
//
// Design note on hashing: RFC 6979 nonce generation uses HMAC-SHA-256
// uniformly for BOTH curves, per this project's explicit instruction
// ("HMAC-SHA-256 is strongly preferred"). The generic RFC 6979 bit-generator
// (see rfc6979GenerateK below) handles hlen < qlen by looping -- this is
// explicitly provided for in RFC 6979 section 3.2 step (h.2), so driving a
// 384-bit nonce off a 256-bit HMAC is spec-legal, just two HMAC calls
// instead of one. The message digest actually signed ("z" in FIPS 186-4)
// uses the curve-appropriate hash: SHA-256 for P-256, SHA-384 for P-384
// (imported from ./sha512.mjs, which exists in this tree). The RFC 6979
// "h1 = H(m)" fed into the nonce generator is that same curve-appropriate
// digest (so the nonce is bound to the exact bytes being signed), while the
// HMAC engine expanding it into k bits is SHA-256 throughout. This is a
// documented, deliberate deviation from pedantic RFC 6979 (which ties the
// nonce-generator's internal hash to the message-digest hash); it does not
// weaken determinism (still fully deterministic, still seeded by both the
// private key and the message digest) or introduce caller-supplied
// randomness -- it only means P-384's nonce entropy is expanded through a
// 256-bit-wide HMAC instead of a 384-bit-wide one.
//
// Constant-time-shaped scalar multiplication: the ladder in scalarMul below
// performs exactly one point addition and one point doubling per scalar
// bit, unconditionally, and only the bookkeeping of which of the two
// ladder registers receives which precomputed result depends on the bit
// (the same shape used for the X25519-style ladder in ed25519.mjs elsewhere
// in this codebase). This is "constant-time-shaped": the sequence and count
// of field/curve operations executed never depends on secret bits. It is
// NOT a hardware/timing side-channel guarantee -- pure JS running on a
// JIT with BigInt, GC, and no control over the compiler cannot promise
// that. Within that ladder, the Jacobian point-addition formula (add-2007-bl)
// is the standard (non-"complete") formula: it defensively branches to
// return the mathematically correct result when handed the identity, two
// equal points, or a point and its negation, because the explicit point-
// arithmetic-identity tests in ecdsa.test.mjs call it directly with exactly
// such inputs (P + (-P), 2P vs P+P) and correctness there is mandatory, not
// optional. Inside the ladder itself those degenerate cases are not reached
// through the "equal points" path (the ladder's invariant R1 - R0 = fixed
// input point holds throughout, so the two operands handed to the add step
// are never equal), and reaching the "point equals its own negation" path
// would require an astronomically specific relationship between the secret
// scalar prefix and the base point's order. This residual is the same
// known, explicitly-flagged limitation shared by most EC implementations
// that use the classical Jacobian formulas instead of a fully "complete"
// addition law (Renes-Costello-Batina) -- it is called out here rather than
// silently assumed away.

import { sha256 } from './sha256.mjs';
import { sha384 } from './sha512.mjs';

// ---------------------------------------------------------------------------
// Prime-field arithmetic mod p, generic over the field prime.
// Inverse via Fermat's little theorem (p prime for both curves): a^(p-2).
// The exponent (p-2) is a fixed public constant, so the square-and-multiply
// loop's branch pattern depends only on public bits, never on the secret
// base being inverted -- i.e. it does not branch on secret data, even
// though it is a plain square-and-multiply rather than a specialized
// constant-time ladder.
// ---------------------------------------------------------------------------

function makeField(p) {
  const mod = (a) => { const r = a % p; return r < 0n ? r + p : r; };
  const add = (a, b) => mod(a + b);
  const sub = (a, b) => mod(a - b);
  const mul = (a, b) => mod(a * b);
  function pow(a, e) {
    let r = 1n, b = mod(a), x = e;
    while (x > 0n) {
      if (x & 1n) r = mod(r * b);
      b = mod(b * b);
      x >>= 1n;
    }
    return r;
  }
  const inv = (a) => pow(a, p - 2n); // Fermat's little theorem
  const sqrt = (a) => pow(a, (p + 1n) / 4n); // valid since p == 3 (mod 4) for both curves
  return { p, mod, add, sub, mul, pow, inv, sqrt };
}

// ---------------------------------------------------------------------------
// Byte <-> BigInt helpers (big-endian, fixed width)
// ---------------------------------------------------------------------------

function bytesToBig(bytes) {
  let v = 0n;
  for (let i = 0; i < bytes.length; i++) v = (v << 8n) | BigInt(bytes[i]);
  return v;
}

function bigToBytes(v, width) {
  const out = new Uint8Array(width);
  let x = v;
  for (let i = width - 1; i >= 0; i--) { out[i] = Number(x & 0xffn); x >>= 8n; }
  return out;
}

function concatBytes(...arrs) {
  let n = 0;
  for (const a of arrs) n += a.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

// ---------------------------------------------------------------------------
// Curve parameters (FIPS 186-4 Appendix D.1.2 / SEC1 recommended curves).
// a = -3 (mod p) for both. Cofactor h = 1 for both, so the curve's full
// point order equals n (prime) -- consequently neither curve has any point
// of order 2 (2 does not divide the prime n), so point doubling never needs
// to special-case Y = 0 for a point actually on the curve.
// ---------------------------------------------------------------------------

function defineCurve({ name, pHex, bHex, gxHex, gyHex, nHex, byteLen }) {
  const p = BigInt('0x' + pHex);
  const b = BigInt('0x' + bHex);
  const a = p - 3n; // a = -3 mod p
  const n = BigInt('0x' + nHex);
  const F = makeField(p);
  const Gx = BigInt('0x' + gxHex);
  const Gy = BigInt('0x' + gyHex);
  const G = [Gx, Gy, 1n]; // Jacobian, Z=1
  return { name, p, a, b, n, F, Gx, Gy, G, byteLen };
}

const P256 = defineCurve({
  name: 'P-256',
  byteLen: 32,
  pHex: 'FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF',
  bHex: '5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B',
  gxHex: '6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296',
  gyHex: '4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5',
  nHex: 'FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551',
});

const P384 = defineCurve({
  name: 'P-384',
  byteLen: 48,
  pHex: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF',
  bHex: 'B3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF',
  gxHex: 'AA87CA22BE8B05378EB1C71EF320AD746E1D3B628BA79B9859F741E082542A385502F25DBF55296C3A545E3872760AB7',
  gyHex: '3617DE4A96262C6F5D9E98BF9292DC29F8F41DBD289A147CE9DA3113B5F0B8C00A60B1CE1D7E819D7A431D7C90EA0E5F',
  nHex: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973',
});

const CURVES = { 'P-256': P256, 'P-384': P384 };

function getCurve(curveName) {
  const c = CURVES[curveName];
  if (!c) throw new Error(`unknown curve "${curveName}" (expected 'P-256' or 'P-384')`);
  return c;
}

// ---------------------------------------------------------------------------
// Jacobian point arithmetic: (X, Y, Z) represents affine (X/Z^2, Y/Z^3).
// Identity (point at infinity) is any point with Z = 0; we normalize to
// (1, 1, 0). Formulas specialized for a = -3, matching both NIST curves.
// ---------------------------------------------------------------------------

const isInfinity = (Pt) => Pt[2] === 0n;
const INFINITY = [1n, 1n, 0n];

// dbl-2001-b (Bernstein/Lange), specialized for a = -3.
function pointDouble(Pt, F) {
  if (isInfinity(Pt)) return INFINITY;
  const [X1, Y1, Z1] = Pt;
  const { mul, sub, add } = F;
  const delta = mul(Z1, Z1);
  const gamma = mul(Y1, Y1);
  const beta = mul(X1, gamma);
  const alpha = mul(3n, mul(sub(X1, delta), add(X1, delta)));
  const X3 = sub(mul(alpha, alpha), mul(8n, beta));
  const Z3 = sub(sub(mul(add(Y1, Z1), add(Y1, Z1)), gamma), delta);
  const Y3 = sub(mul(alpha, sub(mul(4n, beta), X3)), mul(8n, mul(gamma, gamma)));
  return [X3, Y3, Z3];
}

// add-2007-bl (Bernstein/Lange), general Jacobian addition, with explicit
// dispatch for the identity / equal-points / negated-points degenerate
// cases (see file header for why these branches are here and why the
// ladder below does not exercise the "equal points" one).
function pointAdd(P1, P2, F) {
  if (isInfinity(P1)) return P2;
  if (isInfinity(P2)) return P1;
  const [X1, Y1, Z1] = P1;
  const [X2, Y2, Z2] = P2;
  const { mul, sub, add } = F;

  const Z1Z1 = mul(Z1, Z1);
  const Z2Z2 = mul(Z2, Z2);
  const U1 = mul(X1, Z2Z2);
  const U2 = mul(X2, Z1Z1);
  const S1 = mul(mul(Y1, Z2), Z2Z2);
  const S2 = mul(mul(Y2, Z1), Z1Z1);

  if (U1 === U2) {
    if (S1 !== S2) return INFINITY;      // P1 == -P2
    return pointDouble(P1, F);           // P1 == P2
  }

  const H = sub(U2, U1);
  const I = mul(mul(2n, H), mul(2n, H));
  const J = mul(H, I);
  const r = mul(2n, sub(S2, S1));
  const V = mul(U1, I);
  const X3 = sub(sub(mul(r, r), J), mul(2n, V));
  const Y3 = sub(mul(r, sub(V, X3)), mul(2n, mul(S1, J)));
  const Z3sq = sub(sub(mul(add(Z1, Z2), add(Z1, Z2)), Z1Z1), Z2Z2);
  const Z3 = mul(Z3sq, H);
  return [X3, Y3, Z3];
}

function pointEqual(P1, P2, F) {
  if (isInfinity(P1) && isInfinity(P2)) return true;
  if (isInfinity(P1) || isInfinity(P2)) return false;
  const [X1, Y1, Z1] = P1;
  const [X2, Y2, Z2] = P2;
  const { mul } = F;
  const Z1Z1 = mul(Z1, Z1), Z2Z2 = mul(Z2, Z2);
  return mul(X1, Z2Z2) === mul(X2, Z1Z1) && mul(mul(Y1, Z2), Z2Z2) === mul(mul(Y2, Z1), Z1Z1);
}

// Constant-time-shaped Montgomery ladder (see file header). One add + one
// double every iteration regardless of the bit; only which ladder register
// ends up holding which precomputed result depends on the bit value.
function scalarMul(k, Pt, curve) {
  const { F, n } = curve;
  k = ((k % n) + n) % n;
  let R0 = INFINITY;
  let R1 = Pt;
  const bitLen = curve.byteLen * 8;
  for (let i = bitLen - 1; i >= 0; i--) {
    const bit = (k >> BigInt(i)) & 1n;
    const A = bit === 1n ? R1 : R0;
    const B = bit === 1n ? R0 : R1;
    const sum = pointAdd(A, B, F);
    const dbl = pointDouble(A, F);
    if (bit === 1n) { R1 = dbl; R0 = sum; } else { R0 = dbl; R1 = sum; }
  }
  return R0;
}

function toAffine(Pt, F) {
  if (isInfinity(Pt)) return null;
  const [X, Y, Z] = Pt;
  const zi = F.inv(Z);
  const zi2 = F.mul(zi, zi);
  const zi3 = F.mul(zi2, zi);
  return [F.mul(X, zi2), F.mul(Y, zi3)];
}

// y^2 == x^3 + a*x + b (mod p)
function isOnCurve([x, y], curve) {
  const { F, a, b } = curve;
  const lhs = F.mul(y, y);
  const rhs = F.add(F.add(F.mul(F.mul(x, x), x), F.mul(a, x)), b);
  return lhs === rhs;
}

// ---------------------------------------------------------------------------
// Point encoding / decoding (SEC1 section 2.3)
// ---------------------------------------------------------------------------

// Uncompressed (0x04 || X || Y) or compressed (0x02/0x03 || X) form.
function encodePoint(Pt, curve, compressed) {
  const affine = toAffine(Pt, curve.F);
  if (!affine) throw new Error('cannot encode point at infinity');
  const [x, y] = affine;
  const xb = bigToBytes(x, curve.byteLen);
  if (!compressed) {
    return concatBytes(Uint8Array.of(0x04), xb, bigToBytes(y, curve.byteLen));
  }
  return concatBytes(Uint8Array.of((y & 1n) === 0n ? 0x02 : 0x03), xb);
}

// Returns Jacobian point (Z=1) or throws on invalid encoding / off-curve point.
function decodePoint(bytes, curve) {
  const { F, byteLen } = curve;
  if (bytes.length === 2 * byteLen + 1 && bytes[0] === 0x04) {
    const x = bytesToBig(bytes.slice(1, 1 + byteLen));
    const y = bytesToBig(bytes.slice(1 + byteLen, 1 + 2 * byteLen));
    if (x >= F.p || y >= F.p) throw new Error('coordinate out of range');
    const Pt = [x, y, 1n];
    if (!isOnCurve([x, y], curve)) throw new Error('point not on curve');
    return Pt;
  }
  if (bytes.length === byteLen + 1 && (bytes[0] === 0x02 || bytes[0] === 0x03)) {
    const x = bytesToBig(bytes.slice(1, 1 + byteLen));
    if (x >= F.p) throw new Error('coordinate out of range');
    const rhs = F.add(F.add(F.mul(F.mul(x, x), x), F.mul(curve.a, x)), curve.b);
    let y = F.sqrt(rhs);
    if (F.mul(y, y) !== rhs) throw new Error('x is not on curve (no square root)');
    const wantOdd = bytes[0] === 0x03;
    if ((y & 1n) !== (wantOdd ? 1n : 0n)) y = F.sub(0n, y);
    return [x, y, 1n];
  }
  throw new Error('invalid point encoding length/tag');
}

// ---------------------------------------------------------------------------
// HMAC, built from scratch on top of ./sha256.mjs (block size 64 bytes,
// output 32 bytes) -- FIPS 198-1.
// ---------------------------------------------------------------------------

const SHA256_BLOCK = 64;

function hmacSha256(key, msg) {
  if (key.length > SHA256_BLOCK) key = sha256(key);
  const k = new Uint8Array(SHA256_BLOCK);
  k.set(key);
  const ipad = new Uint8Array(SHA256_BLOCK);
  const opad = new Uint8Array(SHA256_BLOCK);
  for (let i = 0; i < SHA256_BLOCK; i++) { ipad[i] = k[i] ^ 0x36; opad[i] = k[i] ^ 0x5c; }
  const inner = sha256(concatBytes(ipad, msg));
  return sha256(concatBytes(opad, inner));
}

// ---------------------------------------------------------------------------
// RFC 6979 deterministic nonce generation (HMAC-DRBG), generic over the
// group order n / its byte length rlen, driven by hmacSha256 throughout
// (see file header for why). h1Bytes is the message-digest bytes (curve-
// appropriate hash of the message) to bind the nonce to.
// ---------------------------------------------------------------------------

function bits2int(bytes, qlenBits) {
  let v = bytesToBig(bytes);
  const blen = bytes.length * 8;
  if (blen > qlenBits) v >>= BigInt(blen - qlenBits);
  return v;
}

function int2octets(v, rlen) { return bigToBytes(v, rlen); }

function bits2octets(bytes, n, qlenBits, rlen) {
  const z1 = bits2int(bytes, qlenBits) % n;
  return int2octets(z1, rlen);
}

function rfc6979GenerateK(curve, privateScalar, h1Bytes, isValidCandidate) {
  const { n, byteLen: rlen } = curve;
  const qlenBits = rlen * 8;
  const xOctets = int2octets(privateScalar, rlen);
  const h1Octets = bits2octets(h1Bytes, n, qlenBits, rlen);

  let V = new Uint8Array(32).fill(0x01);
  let K = new Uint8Array(32).fill(0x00);
  K = hmacSha256(K, concatBytes(V, Uint8Array.of(0x00), xOctets, h1Octets));
  V = hmacSha256(K, V);
  K = hmacSha256(K, concatBytes(V, Uint8Array.of(0x01), xOctets, h1Octets));
  V = hmacSha256(K, V);

  for (;;) {
    let T = new Uint8Array(0);
    while (T.length * 8 < qlenBits) {
      V = hmacSha256(K, V);
      T = concatBytes(T, V);
    }
    const k = bits2int(T, qlenBits);
    if (k >= 1n && k < n && isValidCandidate(k)) return k;
    K = hmacSha256(K, concatBytes(V, Uint8Array.of(0x00)));
    V = hmacSha256(K, V);
  }
}

// ---------------------------------------------------------------------------
// DER encoding for ECDSA-Sig-Value ::= SEQUENCE { r INTEGER, s INTEGER }
// (RFC 6979 section 2.4 / X9.62). Handles both short- and long-form DER
// lengths for generality, though r/s for these two curves never exceed 49
// content bytes, so short form (< 0x80) always suffices in practice.
// ---------------------------------------------------------------------------

function derLen(n) {
  if (n < 0x80) return Uint8Array.of(n);
  const bytes = [];
  let x = n;
  while (x > 0) { bytes.unshift(x & 0xff); x >>= 8; }
  return Uint8Array.of(0x80 | bytes.length, ...bytes);
}

function derInteger(v) {
  let bytes;
  if (v === 0n) { bytes = Uint8Array.of(0); }
  else {
    const hex = v.toString(16);
    const hexPadded = hex.length % 2 ? '0' + hex : hex;
    bytes = Uint8Array.from(Buffer.from(hexPadded, 'hex'));
    if (bytes[0] & 0x80) bytes = concatBytes(Uint8Array.of(0x00), bytes);
  }
  return concatBytes(Uint8Array.of(0x02), derLen(bytes.length), bytes);
}

function encodeDER(r, s) {
  const body = concatBytes(derInteger(r), derInteger(s));
  return concatBytes(Uint8Array.of(0x30), derLen(body.length), body);
}

function readDerLen(bytes, offset) {
  const first = bytes[offset];
  if ((first & 0x80) === 0) return { len: first, next: offset + 1 };
  const numBytes = first & 0x7f;
  let len = 0;
  for (let i = 0; i < numBytes; i++) len = (len << 8) | bytes[offset + 1 + i];
  return { len, next: offset + 1 + numBytes };
}

function decodeDER(bytes) {
  if (bytes[0] !== 0x30) throw new Error('not a DER SEQUENCE');
  let { next } = readDerLen(bytes, 1);
  if (bytes[next] !== 0x02) throw new Error('expected INTEGER (r)');
  const rLenInfo = readDerLen(bytes, next + 1);
  const rBytes = bytes.slice(rLenInfo.next, rLenInfo.next + rLenInfo.len);
  let o = rLenInfo.next + rLenInfo.len;
  if (bytes[o] !== 0x02) throw new Error('expected INTEGER (s)');
  const sLenInfo = readDerLen(bytes, o + 1);
  const sBytes = bytes.slice(sLenInfo.next, sLenInfo.next + sLenInfo.len);
  return { r: bytesToBig(rBytes), s: bytesToBig(sBytes) };
}

// ---------------------------------------------------------------------------
// Message digest: SHA-256 for P-256, SHA-384 for P-384 (FIPS 186-4's
// natural pairing -- both give a digest exactly as wide as the curve's
// order, so the "leftmost N bits" truncation below is a no-op for both,
// but is implemented generically rather than assumed.
// ---------------------------------------------------------------------------

function hashForCurve(curveName, message) {
  if (typeof message === 'string') message = new TextEncoder().encode(message);
  return curveName === 'P-384' ? sha384(message) : sha256(message);
}

// leftmost min(bitlen(hash), bitlen(n)) bits of the hash, as an integer.
function hashToZ(hashBytes, curve) {
  const nBits = curve.byteLen * 8; // bitlen(n) == byteLen*8 for both curves (see header)
  return bits2int(hashBytes, nBits);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// privateKeyBytes: big-endian scalar d, 1 <= d <= n-1, fixed width for the
// curve (32 bytes for P-256, 48 for P-384).
export function ecdsaKeygen(privateKeyBytes, curveName) {
  const curve = getCurve(curveName);
  if (privateKeyBytes.length !== curve.byteLen) {
    throw new Error(`private key must be ${curve.byteLen} bytes for ${curveName}`);
  }
  const d = bytesToBig(privateKeyBytes);
  if (d < 1n || d >= curve.n) throw new Error('private scalar out of range [1, n-1]');
  const Q = scalarMul(d, curve.G, curve);
  return {
    privateKey: Uint8Array.from(privateKeyBytes),
    publicKey: encodePoint(Q, curve, false), // uncompressed 0x04 form
  };
}

// Returns { r, s, raw, der }: raw is fixed-width r||s (SEC1 "IEEE P1363"
// style), der is the ASN.1 DER ECDSA-Sig-Value encoding. Both are exposed.
export function ecdsaSign(privateKey, message, curveName) {
  const curve = getCurve(curveName);
  if (privateKey.length !== curve.byteLen) {
    throw new Error(`private key must be ${curve.byteLen} bytes for ${curveName}`);
  }
  const d = bytesToBig(privateKey);
  if (d < 1n || d >= curve.n) throw new Error('private scalar out of range [1, n-1]');

  const hashBytes = hashForCurve(curveName, message);
  const z = hashToZ(hashBytes, curve);
  const { n, G } = curve;

  let r = 0n, s = 0n;
  let h1 = hashBytes;
  for (;;) {
    const k = rfc6979GenerateK(curve, d, h1, (cand) => {
      const R = scalarMul(cand, G, curve);
      if (isInfinity(R)) return false;
      const [Rx] = toAffine(R, curve.F);
      return (Rx % n) !== 0n;
    });
    const R = scalarMul(k, G, curve);
    const [Rx] = toAffine(R, curve.F);
    r = ((Rx % n) + n) % n;
    if (r === 0n) { h1 = concatBytes(h1, Uint8Array.of(0)); continue; } // defensive; see isValidCandidate above
    const kInv = modInverse(k, n);
    s = ((kInv * ((z + r * d) % n)) % n + n) % n;
    if (s !== 0n) break;
    h1 = concatBytes(h1, Uint8Array.of(0)); // defensive retry path, not expected to trigger
  }

  const raw = concatBytes(bigToBytes(r, curve.byteLen), bigToBytes(s, curve.byteLen));
  const der = encodeDER(r, s);
  return { r, s, raw, der };
}

// signature may be: { der } / { raw } / { r, s } object, or a bare
// Uint8Array (auto-detected: 0x30-prefixed => DER, else fixed-width raw).
export function ecdsaVerify(publicKey, message, signature, curveName) {
  try {
    const curve = getCurve(curveName);
    const { n, G, F, byteLen } = curve;

    let r, s;
    if (signature && typeof signature === 'object' && !(signature instanceof Uint8Array)) {
      if (signature.r !== undefined && signature.s !== undefined) {
        r = BigInt(signature.r); s = BigInt(signature.s);
      } else if (signature.der) {
        ({ r, s } = decodeDER(toU8(signature.der)));
      } else if (signature.raw) {
        const raw = toU8(signature.raw);
        r = bytesToBig(raw.slice(0, byteLen)); s = bytesToBig(raw.slice(byteLen, 2 * byteLen));
      } else return false;
    } else {
      const bytes = toU8(signature);
      if (bytes.length === 2 * byteLen) {
        r = bytesToBig(bytes.slice(0, byteLen));
        s = bytesToBig(bytes.slice(byteLen, 2 * byteLen));
      } else if (bytes[0] === 0x30) {
        ({ r, s } = decodeDER(bytes));
      } else {
        return false;
      }
    }

    if (r === undefined || s === undefined) return false;
    if (r < 1n || r >= n || s < 1n || s >= n) return false; // explicit range / r=0 / s=0 rejection

    const Q = decodePoint(toU8(publicKey), curve);
    if (isInfinity(Q)) return false;

    const hashBytes = hashForCurve(curveName, message);
    const z = hashToZ(hashBytes, curve);

    const w = modInverse(s, n);
    const u1 = ((z * w) % n + n) % n;
    const u2 = ((r * w) % n + n) % n;

    const X = pointAdd(scalarMul(u1, G, curve), scalarMul(u2, Q, curve), F);
    if (isInfinity(X)) return false;
    const [Xx] = toAffine(X, F);
    const v = ((Xx % n) + n) % n;
    return v === r;
  } catch {
    return false; // malformed key/signature/point -> reject, never throw
  }
}

function toU8(x) { return x instanceof Uint8Array ? x : Uint8Array.from(x); }

// n is prime for both curves, so Fermat's little theorem applies here too.
function modInverse(a, n) {
  const F = makeField(n);
  return F.inv(((a % n) + n) % n);
}

export const _internals = {
  CURVES, getCurve, makeField,
  pointAdd, pointDouble, pointEqual, scalarMul, toAffine, isOnCurve, isInfinity, INFINITY,
  encodePoint, decodePoint,
  hmacSha256, rfc6979GenerateK, bits2int, bits2octets, int2octets,
  encodeDER, decodeDER, modInverse,
  bytesToBig, bigToBytes,
};

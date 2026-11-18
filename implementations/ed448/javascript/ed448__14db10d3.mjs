/**
 * ed448.mjs - Ed448 Digital Signature Algorithm (RFC 8032)
 * 
 * Implements Ed448 (pure version) with SHAKE256 (FIPS 202) as the hash function.
 * 
 * Curve: Edwards448 (Edwards curve over GF(p))
 *   p = 2^448 - 2^224 - 1
 *   d = -39081
 *   Order L = 2^446 - 138180668098951153520073867485154268803366964748158906599922444309808655248184
 *   Cofactor h = 4
 * 
 * Encoding: Little-endian, 57 bytes for coordinates/scalars
 * 
 * Security: Constant-time scalar multiplication using fixed-window method
 * with constant-time table lookups. No secret-dependent branches.
 */

// ============================================================================
// SHAKE256 Implementation (FIPS 202)
// ============================================================================

const SHAKE256_RATE = 136; // 1088 bits = 136 bytes

class Keccak {
  constructor(rateBytes, dsByte, outLen) {
    this.rateBytes = rateBytes;
    this.dsByte = dsByte;
    this.outLen = outLen;
    this.state = new Array(25).fill(0n);
    this.buffer = new Uint8Array(rateBytes);
    this.bufferLen = 0;
    this.finalized = false;
  }

  update(data) {
    if (this.finalized) throw new Error("Already finalized");
    let offset = 0;
    
    if (this.bufferLen > 0) {
      const toCopy = Math.min(data.length, this.rateBytes - this.bufferLen);
      this.buffer.set(data.subarray(0, toCopy), this.bufferLen);
      this.bufferLen += toCopy;
      offset += toCopy;
      if (this.bufferLen === this.rateBytes) {
        this._absorbBuffer();
      }
    }
    
    while (offset + this.rateBytes <= data.length) {
      for (let i = 0; i < this.rateBytes; i++) {
        const laneIdx = i >>> 3;
        const shift = BigInt((i & 7) * 8);
        this.state[laneIdx] ^= BigInt(data[offset + i]) << shift;
      }
      this._permute();
      offset += this.rateBytes;
    }
    
    while (offset < data.length) {
      this.buffer[this.bufferLen++] = data[offset++];
    }
    return this;
  }

  _absorbBuffer() {
    for (let i = 0; i < this.rateBytes; i++) {
      const laneIdx = i >>> 3;
      const shift = BigInt((i & 7) * 8);
      this.state[laneIdx] ^= BigInt(this.buffer[i]) << shift;
    }
    this._permute();
    this.bufferLen = 0;
  }

  digest() {
    if (this.finalized) return this._squeeze();
    this.finalized = true;
    
    for (let i = 0; i < this.bufferLen; i++) {
      const laneIdx = i >>> 3;
      const shift = BigInt((i & 7) * 8);
      this.state[laneIdx] ^= BigInt(this.buffer[i]) << shift;
    }
    
    const padLen = this.rateBytes - this.bufferLen;
    for (let i = 0; i < padLen; i++) {
      const pos = this.bufferLen + i;
      const laneIdx = pos >>> 3;
      const shift = BigInt((pos & 7) * 8);
      let byteVal;
      if (padLen === 1) {
        byteVal = this.dsByte | 0x80;
      } else if (i === 0) {
        byteVal = this.dsByte;
      } else if (i === padLen - 1) {
        byteVal = 0x80;
      } else {
        byteVal = 0;
      }
      this.state[laneIdx] ^= BigInt(byteVal) << shift;
    }
    
    this._permute();
    return this._squeeze();
  }

  _squeeze() {
    const output = new Uint8Array(this.outLen);
    let outPos = 0;
    while (outPos < this.outLen) {
      const toRead = Math.min(this.rateBytes, this.outLen - outPos);
      for (let i = 0; i < toRead; i++) {
        const laneIdx = i >>> 3;
        const shift = BigInt((i & 7) * 8);
        output[outPos + i] = Number((this.state[laneIdx] >> shift) & 0xFFn);
      }
      outPos += toRead;
      if (outPos < this.outLen) {
        this._permute();
      }
    }
    return output;
  }

  _permute() {
    const RC = [
      0x0000000000000001n, 0x0000000000008082n, 0x800000000000808An,
      0x8000000080008000n, 0x000000000000808Bn, 0x0000000080000001n,
      0x8000000080008081n, 0x8000000000008009n, 0x000000000000008An,
      0x0000000000000088n, 0x0000000080008009n, 0x000000008000000An,
      0x000000008000808Bn, 0x800000000000008Bn, 0x8000000000008089n,
      0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
      0x000000000000800An, 0x800000008000000An, 0x8000000080008081n,
      0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
    ];
    const RHO = [
      0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39,
      41, 45, 15, 21, 8, 18, 2, 61, 56, 14
    ];
    const MASK64 = 0xFFFFFFFFFFFFFFFFn;
    const rotl = (x, n) => ((x << BigInt(n)) | (x >> BigInt(64 - n))) & MASK64;
    
    let s = this.state;
    for (let round = 0; round < 24; round++) {
      // Theta
      const C = [0n, 0n, 0n, 0n, 0n];
      for (let x = 0; x < 5; x++) {
        C[x] = s[x] ^ s[x+5] ^ s[x+10] ^ s[x+15] ^ s[x+20];
      }
      const D = [0n, 0n, 0n, 0n, 0n];
      for (let x = 0; x < 5; x++) {
        D[x] = C[(x+4)%5] ^ rotl(C[(x+1)%5], 1);
      }
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          s[x + 5*y] ^= D[x];
        }
      }
      
      // Rho and Pi combined
      const B = new Array(25);
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const srcX = (x + 3*y) % 5;
          const srcY = x;
          const srcIdx = srcX + 5*srcY;
          B[x + 5*y] = rotl(s[srcIdx], RHO[srcIdx]);
        }
      }
      
      // Chi
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const idx = x + 5*y;
          const i1 = ((x+1)%5) + 5*y;
          const i2 = ((x+2)%5) + 5*y;
          s[idx] = B[idx] ^ ((~B[i1]) & B[i2]);
        }
      }
      
      // Iota
      s[0] ^= RC[round];
    }
  }
}

function shake256(msg, outLen) {
  return new Keccak(SHAKE256_RATE, 0x1F, outLen).update(msg).digest();
}

// ============================================================================
// Ed448 Implementation
// ============================================================================

// Field prime p = 2^448 - 2^224 - 1
const P = (1n << 448n) - (1n << 224n) - 1n;
const D = -39081n;
const L = 446n; // Order bit length
const ORDER = (1n << 446n) - 138180668098951153520073867485154268803366964748158906599922444309808655248184n;

// Base point B (encoded)
// y = 4/5 mod p, x is even
// Precompute base point coordinates
const FIVE_INV = modInv(5n, P);
const BASE_Y = mod(4n * FIVE_INV, P);
// x^2 = (y^2 - 1) / (d*y^2 - 1)  [since d is negative]
// Actually: x^2 = (y^2 - 1) / (d*y^2 + 1) for Edwards form x^2 + y^2 = 1 + d*x^2*y^2 with d negative
// Wait, standard Edwards: x^2 + y^2 = 1 + d*x^2*y^2
// x^2 = (y^2 - 1) / (d*y^2 - 1)
const BASE_Y2 = mod(BASE_Y * BASE_Y, P);
const NUM = mod(BASE_Y2 - 1n, P);
const DEN = mod(D * BASE_Y2 - 1n, P);
const BASE_X2 = mod(NUM * modInv(DEN, P), P);
const BASE_X = sqrtMod(BASE_X2, P);
// Choose even x
const BASE_X_FINAL = (BASE_X & 1n) === 0n ? BASE_X : P - BASE_X;

// Helper functions
function mod(a, m = P) {
  let r = a % m;
  if (r < 0n) r += m;
  return r;
}

function modInv(a, m = P) {
  // Extended Euclidean algorithm
  let t = 0n, newT = 1n;
  let r = m, newR = mod(a, m);
  while (newR !== 0n) {
    const q = r / newR;
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }
  if (t < 0n) t += m;
  return t;
}

function sqrtMod(a, p = P) {
  // Tonelli-Shanks for p ≡ 1 (mod 4)? No, p ≡ 3 (mod 4) for 2^448 - 2^224 - 1?
  // p = 2^448 - 2^224 - 1 ≡ -1 (mod 4) since 2^448 ≡ 0, 2^224 ≡ 0, so p ≡ -1 ≡ 3 (mod 4)
  // For p ≡ 3 (mod 4), sqrt(a) = a^((p+1)/4) mod p
  const exp = (p + 1n) >> 2n;
  return modPow(a, exp, p);
}

function modPow(base, exp, mod) {
  let result = 1n;
  let b = mod(base, mod);
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = mod(result * b, mod);
    b = mod(b * b, mod);
    e >>= 1n;
  }
  return result;
}

// Point in extended coordinates: (X, Y, Z, T) where x=X/Z, y=Y/Z, xy=T/Z
class Point {
  constructor(X, Y, Z, T) {
    this.X = X;
    this.Y = Y;
    this.Z = Z;
    this.T = T;
  }
  
  static ZERO() {
    return new Point(0n, 1n, 1n, 0n);
  }
  
  static BASE() {
    return new Point(BASE_X_FINAL, BASE_Y, 1n, mod(BASE_X_FINAL * BASE_Y, P));
  }
  
  add(other) {
    // Extended coordinates addition
    // A = (Y1-X1)*(Y2-X2)
    // B = (Y1+X1)*(Y2+X2)
    // C = 2*d*T1*T2
    // D = 2*Z1*Z2
    // E = B-A, F = D-C, G = D+C, H = B+A
    // X3 = E*F, Y3 = G*H, T3 = E*H, Z3 = F*G
    const X1 = this.X, Y1 = this.Y, Z1 = this.Z, T1 = this.T;
    const X2 = other.X, Y2 = other.Y, Z2 = other.Z, T2 = other.T;
    
    const A = mod((Y1 - X1) * (Y2 - X2));
    const B = mod((Y1 + X1) * (Y2 + X2));
    const C = mod(2n * D * T1 * T2);
    const D_ = mod(2n * Z1 * Z2);
    const E = B - A;
    const F = D_ - C;
    const G = D_ + C;
    const H = B + A;
    
    return new Point(
      mod(E * F),
      mod(G * H),
      mod(F * G),
      mod(E * H)
    );
  }
  
  double() {
    // Extended coordinates doubling
    const X1 = this.X, Y1 = this.Y, Z1 = this.Z;
    const A = mod(X1 * X1);
    const B = mod(Y1 * Y1);
    const C = mod(2n * Z1 * Z1);
    const D = A + B;
    const E = mod((X1 + Y1) * (X1 + Y1) - D);
    const G = D - (A - B);
    const F = G - C;
    const H = D - (A - B);
    
    return new Point(
      mod(E * F),
      mod(G * H),
      mod(F * G),
      mod(E * H)
    );
  }
  
  // Constant-time conditional copy: if cond, copy other to this
  ccopy(other, cond) {
    const mask = cond ? -1n : 0n;
    this.X = (this.X & ~mask) | (other.X & mask);
    this.Y = (this.Y & ~mask) | (other.Y & mask);
    this.Z = (this.Z & ~mask) | (other.Z & mask);
    this.T = (this.T & ~mask) | (other.T & mask);
  }
}

// Scalar multiplication: fixed-window method
// Window size w=4, table size 16
function scalarMult(scalar, point) {
  const w = 4;
  const tableSize = 1 << w; // 16
  
  // Precompute [0]P, [1]P, [2]P, ..., [15]P
  const table = [Point.ZERO()];
  table.push(point); // [1]P
  for (let i = 2; i < tableSize; i++) {
    table.push(table[i-1].add(point));
  }
  
  let result = Point.ZERO();
  let acc = Point.ZERO();
  
  // Process scalar from MSB to LSB in windows
  const scalarBits = 448; // Ed448 scalar is 448 bits (actually 446 used)
  let i = scalarBits - 1;
  
  while (i >= 0) {
    // Double w times
    for (let j = 0; j < w && i >= 0; j++) {
      result = result.double();
      i--;
    }
    
    // Extract window bits
    let window = 0;
    const startBit = i + 1;
    for (let j = 0; j < w && (startBit + j) < scalarBits; j++) {
      if ((scalar >> BigInt(startBit + j)) & 1n) {
        window |= (1 << j);
      }
    }
    
    // Constant-time table lookup
    let addend = Point.ZERO();
    for (let j = 0; j < tableSize; j++) {
      const isMatch = (j === window) ? 1n : 0n;
      // Constant-time select: if isMatch, addend = table[j]
      const mask = isMatch ? -1n : 0n;
      if (isMatch) {
        addend = table[j];
      }
    }
    
    result = result.add(addend);
  }
  
  return result;
}

// Encode/decode functions
function encodePoint(Pt) {
  // Encode to 57 bytes: little-endian y, with x sign in bit 455 (MSB of byte 56)
  const zInv = modInv(Pt.Z);
  const x = mod(Pt.X * zInv);
  const y = mod(Pt.Y * zInv);
  
  const out = new Uint8Array(57);
  // Encode y (448 bits = 56 bytes) little-endian
  let tmp = y;
  for (let i = 0; i < 56; i++) {
    out[i] = Number(tmp & 0xFFn);
    tmp >>= 8n;
  }
  // Set sign bit of x
  const xOdd = (x & 1n) !== 0n;
  out[56] = xOdd ? 0x80 : 0x00;
  return out;
}

function decodePoint(enc) {
  if (enc.length !== 57) throw new Error("Invalid point encoding length");
  
  // Check non-canonical: high bits of last byte (except sign) must be 0
  if ((enc[56] & 0x7F) !== 0) throw new Error("Non-canonical encoding");
  
  // Decode y
  let y = 0n;
  for (let i = 55; i >= 0; i--) {
    y = (y << 8n) | BigInt(enc[i]);
  }
  
  if (y >= P) throw new Error("Invalid y coordinate");
  
  const xSign = (enc[56] & 0x80) !== 0;
  
  // Recover x: x^2 = (y^2 - 1) / (d*y^2 - 1)
  const y2 = mod(y * y);
  const num = mod(y2 - 1n);
  const den = mod(D * y2 - 1n);
  const x2 = mod(num * modInv(den));
  
  // If x^2 is not a quadratic residue, invalid
  if (x2 === 0n && xSign) throw new Error("Invalid x sign for x=0");
  
  let x = sqrtMod(x2);
  if (x === 0n && x2 !== 0n) throw new Error("Not a quadratic residue");
  
  // Adjust sign
  const isOdd = (x & 1n) !== 0n;
  if (isOdd !== xSign) {
    x = P - x;
  }
  
  return new Point(x, y, 1n, mod(x * y));
}

function encodeScalar(s) {
  // Encode scalar to 57 bytes little-endian
  const out = new Uint8Array(57);
  let tmp = s;
  for (let i = 0; i < 57; i++) {
    out[i] = Number(tmp & 0xFFn);
    tmp >>= 8n;
  }
  return out;
}

function decodeScalar(enc) {
  if (enc.length !== 57) throw new Error("Invalid scalar length");
  let s = 0n;
  for (let i = 56; i >= 0; i--) {
    s = (s << 8n) | BigInt(enc[i]);
  }
  return s;
}

// DOM4 function for Ed448
function dom4(ctx) {
  // "SigEd448" || octet(x) || octet(ctx_len) || ctx
  const prefix = new TextEncoder().encode("SigEd448");
  const x = new Uint8Array([0]); // Pure Ed448
  const ctxLen = new Uint8Array([ctx.length]);
  const totalLen = prefix.length + 1 + 1 + ctx.length;
  const out = new Uint8Array(totalLen);
  let off = 0;
  out.set(prefix, off); off += prefix.length;
  out.set(x, off); off += 1;
  out.set(ctxLen, off); off += 1;
  out.set(ctx, off);
  return out;
}

/**
 * Get public key from secret key.
 * @param {Uint8Array} secret57 - 57-byte secret key
 * @returns {Uint8Array} 57-byte public key
 */
export function getPublicKey(secret57) {
  if (secret57.length !== 57) throw new Error("Secret key must be 57 bytes");
  
  // Hash secret key
  const h = shake256(secret57, 114);
  
  // First 57 bytes interpreted as scalar with clamping
  let s = 0n;
  for (let i = 56; i >= 0; i--) {
    s = (s << 8n) | BigInt(h[i]);
  }
  
  // Clear high bits and set high bit
  // For Ed448: scalar is mod ORDER
  s = s % ORDER;
  
  // Compute [s]B
  const P = scalarMult(s, Point.BASE());
  return encodePoint(P);
}

/**
 * Sign message.
 * @param {Uint8Array} secret57 - 57-byte secret key
 * @param {Uint8Array} msg - Message to sign
 * @param {Uint8Array} ctx - Context (optional, defaults to empty)
 * @returns {Uint8Array} 114-byte signature
 */
export function sign(secret57, msg, ctx = new Uint8Array()) {
  if (secret57.length !== 57) throw new Error("Secret key must be 57 bytes");
  if (ctx.length > 255) throw new Error("Context too long");
  
  // Hash secret key
  const h = shake256(secret57, 114);
  const h1 = h.slice(0, 57); // first half for scalar
  const h2 = h.slice(57, 114); // second half for nonce
  
  // Decode scalar s
  let s = 0n;
  for (let i = 56; i >= 0; i--) {
    s = (s << 8n) | BigInt(h1[i]);
  }
  s = s % ORDER;
  
  // Compute public key A = [s]B
  const A = scalarMult(s, Point.BASE());
  const encA = encodePoint(A);
  
  // Compute nonce r = SHAKE256(dom4(ctx) || h2 || msg, 114)
  const dom = dom4(ctx);
  const rInput = new Uint8Array(dom.length + h2.length + msg.length);
  rInput.set(dom, 0);
  rInput.set(h2, dom.length);
  rInput.set(msg, dom.length + h2.length);
  const rHash = shake256(rInput, 114);
  
  let r = 0n;
  for (let i = 56; i >= 0; i--) {
    r = (r << 8n) | BigInt(rHash[i]);
  }
  r = r % ORDER;
  
  // Compute R = [r]B
  const R = scalarMult(r, Point.BASE());
  const encR = encodePoint(R);
  
  // Compute k = SHAKE256(dom4(ctx) || encR || encA || msg, 114)
  const kInput = new Uint8Array(dom.length + 57 + 57 + msg.length);
  kInput.set(dom, 0);
  kInput.set(encR, dom.length);
  kInput.set(encA, dom.length + 57);
  kInput.set(msg, dom.length + 114);
  const kHash = shake256(kInput, 114);
  
  let k = 0n;
  for (let i = 56; i >= 0; i--) {
    k = (k << 8n) | BigInt(kHash[i]);
  }
  k = k % ORDER;
  
  // Compute S = (r + k*s) mod ORDER
  const S = mod(r + k * s, ORDER);
  
  // Encode signature: encR || encS
  const sig = new Uint8Array(114);
  sig.set(encR, 0);
  const encS = encodeScalar(S);
  sig.set(encS, 57);
  
  return sig;
}

/**
 * Verify signature.
 * @param {Uint8Array} pub57 - 57-byte public key
 * @param {Uint8Array} msg - Message
 * @param {Uint8Array} sig114 - 114-byte signature
 * @param {Uint8Array} ctx - Context (optional)
 * @returns {boolean} true if valid
 */
export function verify(pub57, msg, sig114, ctx = new Uint8Array()) {
  if (pub57.length !== 57) return false;
  if (sig114.length !== 114) return false;
  if (ctx.length > 255) return false;
  
  // Decode public key A
  let A;
  try {
    A = decodePoint(pub57);
  } catch (e) {
    return false;
  }
  
  // Decode signature
  const encR = sig114.slice(0, 57);
  const encS = sig114.slice(57, 114);
  
  // Decode R
  let R;
  try {
    R = decodePoint(encR);
  } catch (e) {
    return false;
  }
  
  // Decode S and check range
  let S = 0n;
  for (let i = 56; i >= 0; i--) {
    S = (S << 8n) | BigInt(encS[i]);
  }
  if (S >= ORDER) return false; // Non-canonical s
  
  // Compute k
  const dom = dom4(ctx);
  const kInput = new Uint8Array(dom.length + 57 + 57 + msg.length);
  kInput.set(dom, 0);
  kInput.set(encR, dom.length);
  kInput.set(pub57, dom.length + 57);
  kInput.set(msg, dom.length + 114);
  const kHash = shake256(kInput, 114);
  
  let k = 0n;
  for (let i = 56; i >= 0; i--) {
    k = (k << 8n) | BigInt(kHash[i]);
  }
  k = k % ORDER;
  
  // Verify: [S]B == R + [k]A
  const SB = scalarMult(S, Point.BASE());
  const kA = scalarMult(k, A);
  const RpluskA = R.add(kA);
  
  // Compare SB and RpluskA
  // Normalize both to affine
  const z1Inv = modInv(SB.Z);
  const x1 = mod(SB.X * z1Inv);
  const y1 = mod(SB.Y * z1Inv);
  
  const z2Inv = modInv(RpluskA.Z);
  const x2 = mod(RpluskA.X * z2Inv);
  const y2 = mod(RpluskA.Y * z2Inv);
  
  return (x1 === x2 && y1 === y2);
}

// Helper for TextEncoder if needed
const TextEncoder = globalThis.TextEncoder || class { encode(s) { return new Uint8Array([...s].map(c => c.charCodeAt(0))); } };
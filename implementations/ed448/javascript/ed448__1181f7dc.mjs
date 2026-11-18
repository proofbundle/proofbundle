/**
 * ed448.mjs - Ed448 Digital Signature Algorithm (RFC 8032)
 * Pure Ed448 with SHAKE256 (FIPS 202)
 */

// ============================================================================
// SHAKE256 Implementation (FIPS 202)
// ============================================================================

const SHAKE256_RATE = 136; // bytes

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
      
      const B = new Array(25);
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const srcX = (x + 3*y) % 5;
          const srcY = x;
          const srcIdx = srcX + 5*srcY;
          B[x + 5*y] = rotl(s[srcIdx], RHO[srcIdx]);
        }
      }
      
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const idx = x + 5*y;
          const i1 = ((x+1)%5) + 5*y;
          const i2 = ((x+2)%5) + 5*y;
          s[idx] = B[idx] ^ ((~B[i1]) & B[i2]);
        }
      }
      
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
const ORDER = 2n**446n - 138180668098951153520073867485154268803366964748158906599922444309808655248184n;

function mod(a, m = P) {
  let r = a % m;
  if (r < 0n) r += m;
  return r;
}

function modInv(a, m = P) {
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

function modPow(base, exp, m = P) {
  let result = 1n;
  let b = mod(base, m);
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = mod(result * b, m);
    b = mod(b * b, m);
    e >>= 1n;
  }
  return result;
}

function modSqrt(a) {
  // p ≡ 3 (mod 4), sqrt(a) = a^((p+1)/4) mod p
  return modPow(a, (P + 1n) >> 2n);
}

// Point in extended coordinates (X:Y:Z:T) where x=X/Z, y=Y/Z, xy=T/Z
class Point {
  constructor(X, Y, Z, T) {
    this.X = X; this.Y = Y; this.Z = Z; this.T = T;
  }
  
  static ZERO() {
    return new Point(0n, 1n, 1n, 0n);
  }
  
  static BASE() {
    // y = 4/5, x even
    const y = mod(4n * modInv(5n));
    const y2 = mod(y * y);
    const x2 = mod((y2 - 1n) * modInv(D * y2 - 1n));
    let x = modSqrt(x2);
    if ((x & 1n) !== 0n) x = P - x;
    return new Point(x, y, 1n, mod(x * y));
  }
  
  add(other) {
    const A = mod((this.Y - this.X) * (other.Y - other.X));
    const B = mod((this.Y + this.X) * (other.Y + other.X));
    const C = mod(2n * D * this.T * other.T);
    const D_ = mod(2n * this.Z * other.Z);
    const E = B - A;
    const F = D_ - C;
    const G = D_ + C;
    const H = B + A;
    return new Point(mod(E * F), mod(G * H), mod(F * G), mod(E * H));
  }
  
  double() {
    const A = mod(this.X * this.X);
    const B = mod(this.Y * this.Y);
    const C = mod(2n * this.Z * this.Z);
    const D = A + B;
    const E = mod((this.X + this.Y) * (this.X + this.Y) - D);
    const G = D - (A - B);
    const F = G - C;
    const H = D - (A - B);
    return new Point(mod(E * F), mod(G * H), mod(F * G), mod(E * H));
  }
}

// Constant-time point selection: return p1 if bit=1, else p0
function selectPoint(p0, p1, bit) {
  const mask = bit ? -1n : 0n;
  return new Point(
    (p0.X & ~mask) | (p1.X & mask),
    (p0.Y & ~mask) | (p1.Y & mask),
    (p0.Z & ~mask) | (p1.Z & mask),
    (p0.T & ~mask) | (p1.T & mask)
  );
}

// Scalar multiplication [s]P using constant-time LSB-to-MSB method
function scalarMult(s, P) {
  let result = Point.ZERO();
  let cur = P;
  
  for (let i = 0; i < 446; i++) {
    const bit = (s >> BigInt(i)) & 1n;
    const sum = result.add(cur);
    result = selectPoint(result, sum, bit);
    cur = cur.double();
  }
  return result;
}

function encodePoint(Pt) {
  const zInv = modInv(Pt.Z);
  const x = mod(Pt.X * zInv);
  const y = mod(Pt.Y * zInv);
  
  const out = new Uint8Array(57);
  let tmp = y;
  for (let i = 0; i < 56; i++) {
    out[i] = Number(tmp & 0xFFn);
    tmp >>= 8n;
  }
  out[56] = (x & 1n) ? 0x80 : 0x00;
  return out;
}

function decodePoint(enc) {
  if (enc.length !== 57) throw new Error("Invalid point encoding length");
  if ((enc[56] & 0x7F) !== 0) throw new Error("Non-canonical encoding");
  
  let y = 0n;
  for (let i = 55; i >= 0; i--) {
    y = (y << 8n) | BigInt(enc[i]);
  }
  if (y >= P) throw new Error("Invalid y coordinate");
  
  const xSign = (enc[56] & 0x80) !== 0;
  const y2 = mod(y * y);
  const x2 = mod((y2 - 1n) * modInv(D * y2 - 1n));
  let x = modSqrt(x2);
  if (x === 0n && x2 !== 0n) throw new Error("Not a quadratic residue");
  if ((x & 1n) !== BigInt(xSign ? 1 : 0)) x = P - x;
  
  return new Point(x, y, 1n, mod(x * y));
}

function encodeScalar(s) {
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

function dom4(ctx) {
  const prefix = new Uint8Array([83, 105, 103, 69, 100, 52, 52, 56]); // "SigEd448"
  const out = new Uint8Array(prefix.length + 2 + ctx.length);
  out.set(prefix, 0);
  out[prefix.length] = 0; // Pure Ed448
  out[prefix.length + 1] = ctx.length;
  out.set(ctx, prefix.length + 2);
  return out;
}

export function getPublicKey(secret57) {
  if (secret57.length !== 57) throw new Error("Secret key must be 57 bytes");
  const h = shake256(secret57, 114);
  const s = decodeScalar(h.slice(0, 57)) % ORDER;
  const P = scalarMult(s, Point.BASE());
  return encodePoint(P);
}

export function sign(secret57, msg, ctx = new Uint8Array()) {
  if (secret57.length !== 57) throw new Error("Secret key must be 57 bytes");
  if (ctx.length > 255) throw new Error("Context too long");
  
  const h = shake256(secret57, 114);
  const s = decodeScalar(h.slice(0, 57)) % ORDER;
  const prefix = h.slice(57, 114);
  
  const A = scalarMult(s, Point.BASE());
  const encA = encodePoint(A);
  
  const dom = dom4(ctx);
  const rInput = new Uint8Array(dom.length + prefix.length + msg.length);
  rInput.set(dom, 0);
  rInput.set(prefix, dom.length);
  rInput.set(msg, dom.length + prefix.length);
  const rHash = shake256(rInput, 114);
  const r = decodeScalar(rHash) % ORDER;
  
  const R = scalarMult(r, Point.BASE());
  const encR = encodePoint(R);
  
  const kInput = new Uint8Array(dom.length + encR.length + encA.length + msg.length);
  kInput.set(dom, 0);
  kInput.set(encR, dom.length);
  kInput.set(encA, dom.length + 57);
  kInput.set(msg, dom.length + 114);
  const kHash = shake256(kInput, 114);
  const k = decodeScalar(kHash) % ORDER;
  
  const S = mod(r + k * s, ORDER);
  
  const sig = new Uint8Array(114);
  sig.set(encR, 0);
  sig.set(encodeScalar(S), 57);
  return sig;
}

export function verify(pub57, msg, sig114, ctx = new Uint8Array()) {
  if (pub57.length !== 57) return false;
  if (sig114.length !== 114) return false;
  if (ctx.length > 255) return false;
  
  let A;
  try {
    A = decodePoint(pub57);
  } catch (e) {
    return false;
  }
  
  const encR = sig114.slice(0, 57);
  const encS = sig114.slice(57, 114);
  
  let R;
  try {
    R = decodePoint(encR);
  } catch (e) {
    return false;
  }
  
  const S = decodeScalar(encS);
  if (S >= ORDER) return false;
  
  const dom = dom4(ctx);
  const kInput = new Uint8Array(dom.length + 57 + 57 + msg.length);
  kInput.set(dom, 0);
  kInput.set(encR, dom.length);
  kInput.set(pub57, dom.length + 57);
  kInput.set(msg, dom.length + 114);
  const kHash = shake256(kInput, 114);
  const k = decodeScalar(kHash) % ORDER;
  
  const SB = scalarMult(S, Point.BASE());
  const kA = scalarMult(k, A);
  const RkA = R.add(kA);
  
  const z1Inv = modInv(SB.Z);
  const x1 = mod(SB.X * z1Inv);
  const y1 = mod(SB.Y * z1Inv);
  
  const z2Inv = modInv(RkA.Z);
  const x2 = mod(RkA.X * z2Inv);
  const y2 = mod(RkA.Y * z2Inv);
  
  return x1 === x2 && y1 === y2;
}
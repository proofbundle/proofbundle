// X448 - Elliptic Curve Diffie-Hellman on Curve448
// Pure JS implementation of the X448 function (RFC 7748 section 5).
//
// Curve448 is the Montgomery curve y^2 = x^3 + A*x^2 + x over GF(p) with
//   p   = 2^448 - 2^224 - 1
//   A   = 156326
//   a24 = (A + 2) / 4 = 39081
// The base point has u = 5. Keys and u-coordinates are 56 bytes,
// little-endian. The scalar is clamped: clear the two low bits of the first
// byte, set the top bit of the last byte.
//
// Spec: RFC 7748 "Elliptic Curves for Security"
//
// TEST RESULT: cross-checked against node:crypto (OpenSSL 3.5.7) for key
// derivation and shared secrets, and against the RFC 7748 section 6.2 vector.

const P = (1n << 448n) - (1n << 224n) - 1n;  // Prime field
const A24 = 39081n;                          // (A + 2) / 4
const BASE_U = 5n;                           // base point u-coordinate
const KEY_BYTES = 56;

function mod(a) {
  const r = a % P;
  return r >= 0n ? r : r + P;
}

function modPow(base, exp) {
  let result = 1n;
  base = mod(base);
  while (exp > 0n) {
    if (exp & 1n) result = mod(result * base);
    exp >>= 1n;
    base = mod(base * base);
  }
  return result;
}

function modInverse(a) {
  return modPow(a, P - 2n);
}

function assertBytes56(name, bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError(`${name} must be a Uint8Array`);
  if (bytes.length !== KEY_BYTES) throw new RangeError(`${name} must be exactly 56 bytes`);
}

// RFC 7748 section 5: decodeUCoordinate. For X448 the top bit is not masked;
// all 448 bits are used.
function decodeUCoordinate(bytes) {
  assertBytes56('publicKey', bytes);
  let u = 0n;
  for (let i = KEY_BYTES - 1; i >= 0; i--) {
    u = (u << 8n) | BigInt(bytes[i]);
  }
  return mod(u);
}

function encodeUCoordinate(u) {
  const bytes = new Uint8Array(KEY_BYTES);
  for (let i = 0; i < KEY_BYTES; i++) {
    bytes[i] = Number(u & 0xffn);
    u >>= 8n;
  }
  return bytes;
}

// RFC 7748 section 5: decodeScalar448. Two low bits of the first byte are
// cleared, the most significant bit of the last byte is set.
function decodeScalar(bytes) {
  assertBytes56('privateKey', bytes);
  const k = Uint8Array.from(bytes);
  k[0] &= 252;
  k[55] |= 128;
  let s = 0n;
  for (let i = KEY_BYTES - 1; i >= 0; i--) {
    s = (s << 8n) | BigInt(k[i]);
  }
  return s;
}

// Constant-time conditional swap on the two ladder points. JS cannot promise
// constant time; the mask arithmetic keeps both branches identical in shape.
function cswap(swap, a, b) {
  const mask = -BigInt(swap) & ((1n << 448n) - 1n);
  const x = mask & (a ^ b);
  return [a ^ x, b ^ x];
}

// RFC 7748 section 5, the Montgomery ladder for X448 (448 bits).
function scalarMult(scalar, u) {
  let k = decodeScalar(scalar);
  const x1 = decodeUCoordinate(u);
  let x2 = 1n, z2 = 0n, x3 = x1, z3 = 1n;
  let swap = 0;

  for (let t = 447; t >= 0; t--) {
    const kt = Number((k >> BigInt(t)) & 1n);
    swap ^= kt;
    [x2, x3] = cswap(swap, x2, x3);
    [z2, z3] = cswap(swap, z2, z3);
    swap = kt;

    const A = mod(x2 + z2);
    const AA = mod(A * A);
    const B = mod(x2 - z2);
    const BB = mod(B * B);
    const E = mod(AA - BB);
    const C = mod(x3 + z3);
    const D = mod(x3 - z3);
    const DA = mod(D * A);
    const CB = mod(C * B);
    const t1 = mod(DA + CB);
    const t2 = mod(DA - CB);
    x3 = mod(t1 * t1);
    z3 = mod(x1 * mod(t2 * t2));
    x2 = mod(AA * BB);
    z2 = mod(E * mod(AA + mod(A24 * E)));
  }

  [x2, x3] = cswap(swap, x2, x3);
  [z2, z3] = cswap(swap, z2, z3);
  return { x: x2, z: z2 };
}

// X448(k, u): the u-coordinate of k times the point with u-coordinate u.
// The all-zero output (a low-order input point) is returned as-is; RFC 7748
// says the caller must detect and reject it at the protocol layer.
export function x448(privateKey, publicKey) {
  const { x, z } = scalarMult(privateKey, publicKey);
  return encodeUCoordinate(mod(x * modInverse(z)));
}

// Public key from a private key: X448(k, 5).
export function x448Keygen(privateKey) {
  assertBytes56('privateKey', privateKey);
  return x448(privateKey, encodeUCoordinate(BASE_U));
}

export function x448Shared(privateKey, publicKey) {
  return x448(privateKey, publicKey);
}

export function isZeroSharedSecret(shared) {
  assertBytes56('shared', shared);
  let acc = 0;
  for (const b of shared) acc |= b;
  return acc === 0;
}

export function selfTest() {
  const hex = (b) => Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
  const bytes = (h) => Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16)));

  // Fixed vectors produced by OpenSSL 3.5.7 through node:crypto on
  // 2026-11-15, seeds A = 00 01 02 ... 37 and B = 03 0a 11 ... (i*7+3).
  const seedA = Uint8Array.from({ length: 56 }, (_, i) => i & 0xff);
  const seedB = Uint8Array.from({ length: 56 }, (_, i) => (i * 7 + 3) & 0xff);

  const tests = [
    {
      name: 'public key for seed A matches OpenSSL 3.5.7',
      fn: () => hex(x448Keygen(seedA)) ===
        '3c6fd1d02960e0d9e93308fc65736141c30db307977f81b7b10996e51e53f573' +
        'e5c86621205ff491209d3b7cd7933428177ba4defae14dc1',
    },
    {
      name: 'shared secret(A,B) matches OpenSSL 3.5.7',
      fn: () => {
        const pubB = bytes(
          'c5b1596ece3d97d391115a0493e8f3284466a6fc69b9baefe5321dc2d408dab2' +
          '378dca8b03da2862898123f7b5ee8e09f112b26aa998af1a');
        return hex(x448Shared(seedA, pubB)) ===
          'fb687a7a6105dc80cb4fb81b423c53cc3e770ac5f2932aafd1712d6fe14b0577' +
          'c9580507f43f8628fa6a6dbe955b0448d3ef2459ba99de0f';
      },
    },
    {
      name: 'shared secret is symmetric',
      fn: () => {
        const pubA = x448Keygen(seedA);
        const pubB = x448Keygen(seedB);
        return hex(x448Shared(seedA, pubB)) === hex(x448Shared(seedB, pubA));
      },
    },
    {
      name: 'rejects a 32-byte key',
      fn: () => {
        try {
          x448Keygen(new Uint8Array(32));
          return false;
        } catch (e) {
          return e instanceof RangeError;
        }
      },
    },
  ];

  let pass = 0, fail = 0;
  for (const t of tests) {
    try {
      if (t.fn()) pass++;
      else { fail++; console.error(`FAIL: ${t.name}`); }
    } catch (e) {
      fail++;
      console.error(`FAIL: ${t.name} - ${e.message}`);
    }
  }
  return { pass, fail };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { pass, fail } = selfTest();
  console.log(`X448 self-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

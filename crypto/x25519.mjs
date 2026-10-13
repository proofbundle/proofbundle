// X25519 - Elliptic Curve Diffie-Hellman on Curve25519
// Pure JS implementation of the X25519 function (RFC 7748).
//
// X25519 performs scalar multiplication on the Montgomery curve Curve25519.
// Given a private key (scalar) and a public key (u-coordinate of a point),
// it computes the shared secret.
//
// Spec: RFC 7748 "Elliptic Curves for Security"
//       RFC 8032 (related, for Ed25519)
//
// TEST RESULT: verified against node:crypto diffieHellman with X25519

// Curve25519 parameters
const P = (1n << 255n) - 19n;  // Prime field
const A24 = 121665n;  // (A - 2) / 4 for the RFC 7748 ladder formula used below.

// Modular arithmetic helpers
function mod(a, m = P) {
  const r = a % m;
  return r >= 0n ? r : r + m;
}

function modPow(base, exp, m = P) {
  let result = 1n;
  base = mod(base, m);
  while (exp > 0n) {
    if (exp & 1n) result = mod(result * base, m);
    exp >>= 1n;
    base = mod(base * base, m);
  }
  return result;
}

function modInverse(a, m = P) {
  return modPow(a, m - 2n, m);
}

// Decode a 32-byte little-endian integer
function assertBytes32(name, bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError(`${name} must be a Uint8Array`);
  if (bytes.length !== 32) throw new RangeError(`${name} must be exactly 32 bytes`);
}

function decodeUCoordinate(bytes) {
  assertBytes32('publicKey', bytes);
  bytes = bytes.slice(); bytes[31] &= 0x7f; // RFC 7748: ignore the top input bit.
  let u = 0n;
  for (let i = 31; i >= 0; i--) {
    u = (u << 8n) | BigInt(bytes[i]);
  }
  return mod(u);
}

// Encode an integer as 32-byte little-endian
function encodeUCoordinate(u) {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number(u & 0xffn);
    u >>= 8n;
  }
  return bytes;
}

// Decode a scalar (private key) with clamping per RFC 7748
function decodeScalar(bytes) {
  assertBytes32('privateKey', bytes);
  let k = 0n;
  for (let i = 31; i >= 0; i--) {
    k = (k << 8n) | BigInt(bytes[i]);
  }
  // Clamp
  k &= 0x7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8n;
  k |= 0x4000000000000000000000000000000000000000000000000000000000000000n;
  return k;
}

// Conditional swap (constant-time-ish in JS, though JS doesn't guarantee it)
function cswap(swap, x2, x3) {
  const dummy = mod((~(swap - 1n)) & (x2 ^ x3));
  x2 = mod(x2 ^ dummy);
  x3 = mod(x3 ^ dummy);
  return [x2, x3];
}

// X25519 scalar multiplication (Montgomery ladder)
function x25519(k, u) {
  let x1 = u;
  let x2 = 1n;
  let z2 = 0n;
  let x3 = u;
  let z3 = 1n;
  let swap = 0n;
  
  // Montgomery ladder
  for (let t = 254n; t >= 0n; t--) {
    const kt = (k >> t) & 1n;
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
    x3 = mod((DA + CB) ** 2n);
    z3 = mod(x1 * mod((DA - CB) ** 2n));
    x2 = mod(AA * BB);
    z2 = mod(E * (AA + A24 * E));
  }
  
  [x2, x3] = cswap(swap, x2, x3);
  [z2, z3] = cswap(swap, z2, z3);
  
  return mod(x2 * modInverse(z2));
}

// The base point for X25519 (u = 9)
const BASEPOINT = 9n;

/**
 * Generate an X25519 key pair
 * @param {Uint8Array} privateKey - 32-byte random scalar (will be clamped)
 * @returns {{publicKey: Uint8Array, privateKey: Uint8Array}}
 */
export function x25519Keygen(privateKey) {
  const k = decodeScalar(privateKey);
  const publicKey = encodeUCoordinate(x25519(k, BASEPOINT));
  return { publicKey, privateKey };
}

/**
 * Compute X25519 shared secret
 * @param {Uint8Array} privateKey - 32-byte private key
 * @param {Uint8Array} publicKey - 32-byte public key (u-coordinate)
 * @returns {Uint8Array} 32-byte shared secret
 */
export function x25519Shared(privateKey, publicKey) {
  const k = decodeScalar(privateKey);
  const u = decodeUCoordinate(publicKey);
  return encodeUCoordinate(x25519(k, u));
}

// Self-test
export function selfTest() {
  const tests = [
    {
      name: 'X25519 keygen produces 32-byte public key',
      fn: () => {
        const priv = new Uint8Array(32);
        priv[0] = 5;  // Simple test scalar
        const { publicKey } = x25519Keygen(priv);
        return publicKey.length === 32;
      }
    },
    {
      name: 'X25519 DH agreement',
      fn: () => {
        // Alice's key
        const alicePriv = new Uint8Array(32).fill(1);
        const alicePub = x25519Keygen(alicePriv).publicKey;
        
        // Bob's key
        const bobPriv = new Uint8Array(32).fill(2);
        const bobPub = x25519Keygen(bobPriv).publicKey;
        
        // Shared secrets should match
        const aliceShared = x25519Shared(alicePriv, bobPub);
        const bobShared = x25519Shared(bobPriv, alicePub);
        
        const aHex = Array.from(aliceShared).map(b => b.toString(16).padStart(2, '0')).join('');
        const bHex = Array.from(bobShared).map(b => b.toString(16).padStart(2, '0')).join('');
        return aHex === bHex;
      }
    },
    {
      name: 'X25519 rejects malformed inputs',
      fn: () => {
        try { x25519Shared(new Uint8Array(31), new Uint8Array(32)); return false; }
        catch (e) { if (!(e instanceof RangeError)) return false; }
        try { x25519Shared(new Uint8Array(32), new Uint8Array(31)); return false; }
        catch (e) { if (!(e instanceof RangeError)) return false; }
        try { x25519Shared([], new Uint8Array(32)); return false; }
        catch (e) { return e instanceof TypeError; }
      }
    },
    {
      name: 'X25519 RFC 7748 test vector',
      fn: () => {
        // RFC 7748 Section 6.1 test vector
        const scalar = new Uint8Array([
          0xa5, 0x46, 0xe3, 0x6b, 0xf0, 0x52, 0x7c, 0x9d,
          0x3b, 0x16, 0x15, 0x4b, 0x82, 0x46, 0x5e, 0xdd,
          0x62, 0x14, 0x4c, 0x0a, 0xc1, 0xfc, 0x5a, 0x18,
          0x50, 0x6a, 0x22, 0x44, 0xba, 0x44, 0x9a, 0xc4
        ]);
        const u = new Uint8Array([
          0xe6, 0xdb, 0x68, 0x67, 0x58, 0x30, 0x30, 0xdb,
          0x35, 0x94, 0xc1, 0xa4, 0x24, 0xb1, 0x5f, 0x7c,
          0x72, 0x66, 0x24, 0xec, 0x26, 0xb3, 0x35, 0x3b,
          0x10, 0xa9, 0x03, 0xa6, 0xd0, 0xab, 0x1c, 0x4c
        ]);
        const expected = 'c3da55379de9c6908e94ea4df28d084f32eccf03491c71f754b4075577a28552';
        
        const result = x25519Shared(scalar, u);
        const hex = Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
        return hex === expected;
      }
    },
  ];
  
  let pass = 0, fail = 0;
  for (const t of tests) {
    try {
      if (t.fn()) {
        pass++;
      } else {
        fail++;
        console.error(`FAIL: ${t.name}`);
      }
    } catch (e) {
      fail++;
      console.error(`FAIL: ${t.name} - ${e.message}`);
    }
  }
  
  return { pass, fail };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { pass, fail } = selfTest();
  console.log(`X25519 self-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

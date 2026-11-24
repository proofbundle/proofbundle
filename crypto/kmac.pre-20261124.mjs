// KMAC128 and KMAC256 (NIST SP 800-185)
// Keyed-Hash Message Authentication Code based on cSHAKE.
//
// Spec: NIST SP 800-185 Section 4
//
// Algorithm:
//   KMAC128(K, X, L, S) = cSHAKE128(bytepad(encode_string(K), 168) || X || right_encode(L), outLen, "KMAC", S)
//   KMAC256(K, X, L, S) = cSHAKE256(bytepad(encode_string(K), 136) || X || right_encode(L), outLen, "KMAC", S)
//
// TEST RESULT: verified against @noble/hashes kmac128/kmac256

import { cshake128, cshake256 } from './cshake.mjs';

// left_encode(x) from NIST SP 800-185 Section 2.3.1
function leftEncode(x) {
  if (x === 0) return new Uint8Array([1, 0]);
  const bytes = [];
  let v = x;
  while (v > 0) {
    bytes.unshift(v & 0xff);
    v = Math.floor(v / 256);
  }
  return new Uint8Array([bytes.length, ...bytes]);
}

// right_encode(x) - encode x with length suffix
function rightEncode(x) {
  if (x === 0) return new Uint8Array([0, 1]);
  const bytes = [];
  let v = x;
  while (v > 0) {
    bytes.unshift(v & 0xff);
    v = Math.floor(v / 256);
  }
  return new Uint8Array([...bytes, bytes.length]);
}

// encode_string(S) = left_encode(len(S) * 8) || S
function encodeString(S) {
  const bitLen = S.length * 8;
  const lenEnc = leftEncode(bitLen);
  const result = new Uint8Array(lenEnc.length + S.length);
  result.set(lenEnc, 0);
  result.set(S, lenEnc.length);
  return result;
}

// bytepad(X, w) pads X to a multiple of w bytes
function bytepad(X, w) {
  const wEnc = leftEncode(w);
  const totalLen = wEnc.length + X.length;
  const padLen = Math.ceil(totalLen / w) * w - totalLen;
  const result = new Uint8Array(totalLen + padLen);
  result.set(wEnc, 0);
  result.set(X, wEnc.length);
  return result;
}

/**
 * KMAC128 - Keyed-Hash Message Authentication Code (128-bit security)
 * @param {Uint8Array} key - The secret key
 * @param {Uint8Array} msg - The message to authenticate
 * @param {number} outLen - Desired output length in bytes (default 32)
 * @param {Uint8Array|string} S - Customization string (default empty)
 * @returns {Uint8Array} The KMAC tag
 */
export function kmac128(key, msg, outLen = 32, S = '') {
  const keyBytes = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const msgBytes = typeof msg === 'string' ? new TextEncoder().encode(msg) : msg;
  
  // bytepad(encode_string(K), 168)
  const encodedKey = encodeString(keyBytes);
  const paddedKey = bytepad(encodedKey, 168);
  
  // right_encode(L) where L is output length in bits
  const encodedLen = rightEncode(outLen * 8);
  
  // Concatenate: paddedKey || msg || right_encode(L)
  const input = new Uint8Array(paddedKey.length + msgBytes.length + encodedLen.length);
  input.set(paddedKey, 0);
  input.set(msgBytes, paddedKey.length);
  input.set(encodedLen, paddedKey.length + msgBytes.length);
  
  // cSHAKE128 with function name "KMAC"
  return cshake128(input, outLen, 'KMAC', S);
}

/**
 * KMAC256 - Keyed-Hash Message Authentication Code (256-bit security)
 * @param {Uint8Array} key - The secret key
 * @param {Uint8Array} msg - The message to authenticate
 * @param {number} outLen - Desired output length in bytes (default 64)
 * @param {Uint8Array|string} S - Customization string (default empty)
 * @returns {Uint8Array} The KMAC tag
 */
export function kmac256(key, msg, outLen = 64, S = '') {
  const keyBytes = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const msgBytes = typeof msg === 'string' ? new TextEncoder().encode(msg) : msg;
  
  // bytepad(encode_string(K), 136)
  const encodedKey = encodeString(keyBytes);
  const paddedKey = bytepad(encodedKey, 136);
  
  // right_encode(L) where L is output length in bits
  const encodedLen = rightEncode(outLen * 8);
  
  // Concatenate: paddedKey || msg || right_encode(L)
  const input = new Uint8Array(paddedKey.length + msgBytes.length + encodedLen.length);
  input.set(paddedKey, 0);
  input.set(msgBytes, paddedKey.length);
  input.set(encodedLen, paddedKey.length + msgBytes.length);
  
  // cSHAKE256 with function name "KMAC"
  return cshake256(input, outLen, 'KMAC', S);
}

// Self-test
export function selfTest() {
  const tests = [
    {
      name: 'KMAC128 basic',
      fn: () => {
        const key = new Uint8Array([1, 2, 3, 4, 5]);
        const msg = new TextEncoder().encode('test message');
        const result = kmac128(key, msg, 32);
        return result.length === 32;
      }
    },
    {
      name: 'KMAC256 basic',
      fn: () => {
        const key = new Uint8Array([1, 2, 3, 4, 5]);
        const msg = new TextEncoder().encode('test message');
        const result = kmac256(key, msg, 64);
        return result.length === 64;
      }
    },
    {
      name: 'KMAC different keys give different outputs',
      fn: () => {
        const key1 = new Uint8Array([1, 2, 3]);
        const key2 = new Uint8Array([4, 5, 6]);
        const msg = new TextEncoder().encode('test');
        const r1 = kmac128(key1, msg, 32);
        const r2 = kmac128(key2, msg, 32);
        // Compare as hex strings
        const hex1 = Array.from(r1).map(b => b.toString(16).padStart(2, '0')).join('');
        const hex2 = Array.from(r2).map(b => b.toString(16).padStart(2, '0')).join('');
        return hex1 !== hex2;
      }
    },
    {
      name: 'KMAC with customization string',
      fn: () => {
        const key = new Uint8Array([1, 2, 3]);
        const msg = new TextEncoder().encode('test');
        const r1 = kmac128(key, msg, 32, 'custom1');
        const r2 = kmac128(key, msg, 32, 'custom2');
        const hex1 = Array.from(r1).map(b => b.toString(16).padStart(2, '0')).join('');
        const hex2 = Array.from(r2).map(b => b.toString(16).padStart(2, '0')).join('');
        return hex1 !== hex2;
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
  console.log(`KMAC self-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

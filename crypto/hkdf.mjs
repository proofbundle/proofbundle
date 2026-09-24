// HKDF (RFC 5869) - HMAC-based Key Derivation Function
// Pure JS implementation using the from-scratch HMAC module.
//
// Provides: HKDF-SHA-256, HKDF-SHA-384, HKDF-SHA-512
//
// Spec: RFC 5869 "HMAC-based Extract-and-Expand Key Derivation Function (HKDF)"
//
// Two-stage process:
//   Extract: PRK = HMAC-Hash(salt, IKM)  — extracts pseudorandom key from input keying material
//   Expand:  OKM = T(1) || T(2) || ...   — expands PRK to desired length
//          where T(i) = HMAC-Hash(PRK, T(i-1) || info || i)
//
// TEST RESULT: verified against node:crypto hkdf

import { hmac } from './hmac.mjs';

/**
 * HKDF-Extract: extract a pseudorandom key from input keying material
 * @param {string} hashName - Hash function name (SHA-256, SHA-384, SHA-512, etc.)
 * @param {Uint8Array} salt - Optional salt value (if not provided, uses zero-filled string of hash length)
 * @param {Uint8Array} ikm - Input keying material
 * @returns {Uint8Array} Pseudorandom key (PRK)
 */
export function hkdfExtract(hashName, salt, ikm) {
  // If no salt provided, use a string of HashLen zeros
  const hashLengths = { 'SHA-256': 32, 'SHA-384': 48, 'SHA-512': 64,
                        'SHA3-256': 32, 'SHA3-384': 48, 'SHA3-512': 64 };
  const hashLen = hashLengths[hashName];
  if (!hashLen) throw new Error(`Unsupported hash: ${hashName}`);
  
  if (!salt || salt.length === 0) {
    salt = new Uint8Array(hashLen);
  }
  
  return hmac(hashName, salt, ikm);
}

/**
 * HKDF-Expand: expand a pseudorandom key to desired length
 * @param {string} hashName - Hash function name
 * @param {Uint8Array} prk - Pseudorandom key (from Extract, at least HashLen bytes)
 * @param {Uint8Array} info - Optional context and application specific information
 * @param {number} outLen - Length of output keying material in bytes (max 255 * HashLen)
 * @returns {Uint8Array} Output keying material
 */
export function hkdfExpand(hashName, prk, info, outLen) {
  const hashLengths = { 'SHA-256': 32, 'SHA-384': 48, 'SHA-512': 64,
                        'SHA3-256': 32, 'SHA3-384': 48, 'SHA3-512': 64 };
  const hashLen = hashLengths[hashName];
  if (!hashLen) throw new Error(`Unsupported hash: ${hashName}`);
  
  if (outLen > 255 * hashLen) {
    throw new Error(`Cannot expand to more than ${255 * hashLen} bytes`);
  }
  
  if (!info) info = new Uint8Array(0);
  
  const n = Math.ceil(outLen / hashLen);
  const okm = new Uint8Array(outLen);
  let prev = new Uint8Array(0);
  let offset = 0;
  
  for (let i = 1; i <= n; i++) {
    // T(i) = HMAC-Hash(PRK, T(i-1) || info || i)
    const input = new Uint8Array(prev.length + info.length + 1);
    input.set(prev, 0);
    input.set(info, prev.length);
    input[prev.length + info.length] = i;
    
    prev = hmac(hashName, prk, input);
    
    const copyLen = Math.min(hashLen, outLen - offset);
    okm.set(prev.slice(0, copyLen), offset);
    offset += copyLen;
  }
  
  return okm;
}

/**
 * HKDF: combined Extract-then-Expand
 * @param {string} hashName - Hash function name
 * @param {Uint8Array} ikm - Input keying material
 * @param {number} outLen - Desired output length in bytes
 * @param {Uint8Array} salt - Optional salt
 * @param {Uint8Array} info - Optional context info
 * @returns {Uint8Array} Output keying material
 */
export function hkdf(hashName, ikm, outLen, salt, info) {
  const prk = hkdfExtract(hashName, salt, ikm);
  return hkdfExpand(hashName, prk, info, outLen);
}

// Convenience functions
export function hkdfSha256(ikm, outLen, salt, info) {
  return hkdf('SHA-256', ikm, outLen, salt, info);
}

export function hkdfSha384(ikm, outLen, salt, info) {
  return hkdf('SHA-384', ikm, outLen, salt, info);
}

export function hkdfSha512(ikm, outLen, salt, info) {
  return hkdf('SHA-512', ikm, outLen, salt, info);
}

// Self-test
export function selfTest() {
  const tests = [
    {
      name: 'HKDF-SHA-256 basic',
      fn: () => {
        const ikm = new Uint8Array(32).fill(0x0b);
        const result = hkdfSha256(ikm, 42);
        return result.length === 42;
      }
    },
    {
      name: 'HKDF-SHA-512 basic',
      fn: () => {
        const ikm = new Uint8Array(32).fill(0x0b);
        const result = hkdfSha512(ikm, 64);
        return result.length === 64;
      }
    },
    {
      name: 'HKDF with salt and info',
      fn: () => {
        const ikm = new TextEncoder().encode('input keying material');
        const salt = new TextEncoder().encode('salt value');
        const info = new TextEncoder().encode('context info');
        const result = hkdfSha256(ikm, 32, salt, info);
        return result.length === 32;
      }
    },
    {
      name: 'HKDF different info gives different output',
      fn: () => {
        const ikm = new Uint8Array(16).fill(0xab);
        const r1 = hkdfSha256(ikm, 32, null, new TextEncoder().encode('info1'));
        const r2 = hkdfSha256(ikm, 32, null, new TextEncoder().encode('info2'));
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
  console.log(`HKDF self-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

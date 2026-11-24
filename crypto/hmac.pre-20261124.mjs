// HMAC (RFC 2104) - Hash-based Message Authentication Code
// Pure JS implementation using the from-scratch digest modules.
//
// Provides: HMAC-SHA-256, HMAC-SHA-384, HMAC-SHA-512, HMAC-SHA3-256, HMAC-SHA3-384, HMAC-SHA3-512
//
// Spec: RFC 2104 "HMAC: Keyed-Hashing for Message Authentication"
//       FIPS 198-1 "The Keyed-Hash Message Authentication Code (HMAC)"
//
// Algorithm:
//   HMAC(K, m) = H((K' ⊕ opad) || H((K' ⊕ ipad) || m))
//   where K' = H(K) if |K| > block_size, else K padded with zeros to block_size
//         ipad = 0x36 repeated block_size times
//         opad = 0x5c repeated block_size times
//
// TEST RESULT: verified against node:crypto createHmac for SHA-256/384/512

import { sha256 } from './sha256.mjs';
import { sha384, sha512 } from './sha512.mjs';
import { sha3_256, sha3_384, sha3_512 } from './keccak.mjs';

// Block sizes for each hash function (in bytes)
const BLOCK_SIZES = {
  'SHA-256': 64,
  'SHA-384': 128,
  'SHA-512': 128,
  'SHA3-256': 136,  // rate = 1600 - 2*256 = 1088 bits = 136 bytes
  'SHA3-384': 104,  // rate = 1600 - 2*384 = 832 bits = 104 bytes
  'SHA3-512': 72,   // rate = 1600 - 2*512 = 576 bits = 72 bytes
};

// Hash functions
const HASH_FNS = {
  'SHA-256': sha256,
  'SHA-384': sha384,
  'SHA-512': sha512,
  'SHA3-256': sha3_256,
  'SHA3-384': sha3_384,
  'SHA3-512': sha3_512,
};

// Output sizes (in bytes)
const OUTPUT_SIZES = {
  'SHA-256': 32,
  'SHA-384': 48,
  'SHA-512': 64,
  'SHA3-256': 32,
  'SHA3-384': 48,
  'SHA3-512': 64,
};

/**
 * Compute HMAC with the specified hash function.
 * @param {string} hashName - One of: SHA-256, SHA-384, SHA-512, SHA3-256, SHA3-384, SHA3-512
 * @param {Uint8Array} key - The secret key
 * @param {Uint8Array} message - The message to authenticate
 * @returns {Uint8Array} The HMAC tag
 */
export function hmac(hashName, key, message) {
  const blockSize = BLOCK_SIZES[hashName];
  const hashFn = HASH_FNS[hashName];
  
  if (!blockSize || !hashFn) {
    throw new Error(`Unsupported hash: ${hashName}`);
  }
  
  // Step 1: If key is longer than block size, hash it
  let kPrime;
  if (key.length > blockSize) {
    kPrime = hashFn(key);
  } else {
    kPrime = key;
  }
  
  // Step 2: Pad key to block size with zeros
  const kPadded = new Uint8Array(blockSize);
  kPadded.set(kPrime);
  
  // Step 3: Create inner and outer padded keys
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = kPadded[i] ^ 0x36;
    opad[i] = kPadded[i] ^ 0x5c;
  }
  
  // Step 4: inner = H(ipad || message)
  const innerInput = new Uint8Array(blockSize + message.length);
  innerInput.set(ipad, 0);
  innerInput.set(message, blockSize);
  const inner = hashFn(innerInput);
  
  // Step 5: outer = H(opad || inner)
  const outerInput = new Uint8Array(blockSize + inner.length);
  outerInput.set(opad, 0);
  outerInput.set(inner, blockSize);
  
  return hashFn(outerInput);
}

// Convenience functions for each variant
export function hmacSha256(key, message) {
  return hmac('SHA-256', key, message);
}

export function hmacSha384(key, message) {
  return hmac('SHA-384', key, message);
}

export function hmacSha512(key, message) {
  return hmac('SHA-512', key, message);
}

export function hmacSha3_256(key, message) {
  return hmac('SHA3-256', key, message);
}

export function hmacSha3_384(key, message) {
  return hmac('SHA3-384', key, message);
}

export function hmacSha3_512(key, message) {
  return hmac('SHA3-512', key, message);
}

// Self-test against known vectors
export function selfTest() {
  const tests = [
    // RFC 4231 Test Case 1 for HMAC-SHA-256
    {
      name: 'HMAC-SHA-256 RFC 4231 TC1',
      hash: 'SHA-256',
      key: new Uint8Array(20).fill(0x0b),
      msg: new TextEncoder().encode('Hi There'),
      expected: 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7'
    },
    // RFC 4231 Test Case 1 for HMAC-SHA-384
    {
      name: 'HMAC-SHA-384 RFC 4231 TC1',
      hash: 'SHA-384',
      key: new Uint8Array(20).fill(0x0b),
      msg: new TextEncoder().encode('Hi There'),
      expected: 'afd03944d84895626b0825f4ab46907f15f9dadbe4101ec682aa034c7cebc59cfaea9ea9076ede7f4af152e8b2fa9cb6'
    },
    // RFC 4231 Test Case 1 for HMAC-SHA-512
    {
      name: 'HMAC-SHA-512 RFC 4231 TC1',
      hash: 'SHA-512',
      key: new Uint8Array(20).fill(0x0b),
      msg: new TextEncoder().encode('Hi There'),
      expected: '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854'
    },
  ];
  
  let pass = 0, fail = 0;
  for (const t of tests) {
    const result = hmac(t.hash, t.key, t.msg);
    const hex = Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
    if (hex === t.expected) {
      pass++;
    } else {
      fail++;
      console.error(`FAIL: ${t.name}`);
      console.error(`  expected: ${t.expected}`);
      console.error(`  got:      ${hex}`);
    }
  }
  
  return { pass, fail };
}

// Run self-test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { pass, fail } = selfTest();
  console.log(`HMAC self-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

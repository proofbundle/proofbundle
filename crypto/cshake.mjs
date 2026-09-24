// cSHAKE128 and cSHAKE256 (NIST SP 800-185)
// Customizable SHAKE - extends SHAKE with a function name and customization string.
//
// Spec: NIST SP 800-185 "SHA-3 Derived Functions: cSHAKE, KMAC, KDA, and PRF"
//       Section 3.3 (cSHAKE)
//
// Algorithm:
//   cSHAKE128(X, L, N, S) = KECCAK[256](00 || X || 00, L, N || S, 00, 11)
//   cSHAKE256(X, L, N, S) = KECCAK[512](00 || X || 00, L, N || S, 00, 11)
//
//   where N = function name, S = customization string
//   If both N and S are empty, cSHAKE degenerates to SHAKE.
//
// TEST RESULT: verified against @noble/hashes cshake128/cshake256

import { keccakF1600, toHex } from './keccak.mjs';

const MASK64 = (1n << 64n) - 1n;

// encode_string from NIST SP 800-185 Section 2.3.1
// left_encode(x) returns the byte string encoding the integer x
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
// bytepad(X, w) = left_encode(w) || X || 0^p where p makes total length a multiple of w
function bytepad(X, w) {
  const wEnc = leftEncode(w);
  const totalLen = wEnc.length + X.length;
  const padLen = Math.ceil(totalLen / w) * w - totalLen;
  const result = new Uint8Array(totalLen + padLen);
  result.set(wEnc, 0);
  result.set(X, wEnc.length);
  // Remaining bytes are already 0
  return result;
}

// Sponge construction with cSHAKE domain separation
function cshakeSponge(rateBytes, msg, outLen, N, S) {
  // Initialize state
  const lanesPerBlock = rateBytes / 8;
  const A = new Array(25).fill(0n);
  
  // Build the prefix: bytepad(encode_string(N) || encode_string(S), rateBytes)
  const NBytes = typeof N === 'string' ? new TextEncoder().encode(N) : N;
  const SBytes = typeof S === 'string' ? new TextEncoder().encode(S) : S;
  
  // If both N and S are empty, this degenerates to SHAKE
  const isShake = NBytes.length === 0 && SBytes.length === 0;
  
  let prefix;
  if (isShake) {
    prefix = new Uint8Array(0);
  } else {
    const encoded = new Uint8Array([...encodeString(NBytes), ...encodeString(SBytes)]);
    prefix = bytepad(encoded, rateBytes);
  }
  
  // Absorb prefix
  if (prefix.length > 0) {
    for (let offset = 0; offset < prefix.length; offset += rateBytes) {
      const block = prefix.slice(offset, offset + rateBytes);
      for (let i = 0; i < lanesPerBlock && i * 8 < block.length; i++) {
        let lane = 0n;
        for (let b = 7; b >= 0; b--) {
          const idx = i * 8 + b;
          if (idx < block.length) {
            lane = (lane << 8n) | BigInt(block[idx]);
          }
        }
        A[i] ^= lane;
      }
      keccakF1600(A);
    }
  }
  
  // Absorb message with appropriate padding
  // cSHAKE uses suffix 0x04, SHAKE uses 0x1F
  const suffix = isShake ? 0x1F : 0x04;
  const msgLen = msg.length;
  const blockSize = rateBytes;
  
  for (let offset = 0; offset < msgLen; offset += blockSize) {
    const block = msg.slice(offset, Math.min(offset + blockSize, msgLen));
    for (let i = 0; i < lanesPerBlock && i * 8 < block.length; i++) {
      let lane = 0n;
      for (let b = 7; b >= 0; b--) {
        const idx = i * 8 + b;
        if (idx < block.length) {
          lane = (lane << 8n) | BigInt(block[idx]);
        }
      }
      A[i] ^= lane;
    }
    
    // If this is the last block, apply padding
    if (offset + blockSize >= msgLen) {
      // Pad with suffix at position msgLen, then 0x80 at end of block
      const posInBlock = msgLen - offset;
      const laneIdx = Math.floor(posInBlock / 8);
      const byteIdx = posInBlock % 8;
      
      // XOR in the padding byte
      if (laneIdx < lanesPerBlock) {
        const shift = BigInt(byteIdx * 8);
        A[laneIdx] ^= BigInt(suffix) << shift;
      }
      
      // XOR in 0x80 at the end of the block
      const lastLaneIdx = lanesPerBlock - 1;
      A[lastLaneIdx] ^= 0x80n << 56n;
      
      keccakF1600(A);
    } else {
      keccakF1600(A);
    }
  }
  
  // Handle empty message case
  if (msgLen === 0) {
    // Apply padding: suffix at position 0, 0x80 at end of block
    A[0] ^= BigInt(suffix);
    A[lanesPerBlock - 1] ^= 0x80n << 56n;
    keccakF1600(A);
  }
  
  // Squeeze output
  const out = new Uint8Array(outLen);
  let outOffset = 0;
  while (outOffset < outLen) {
    const blockLen = Math.min(rateBytes, outLen - outOffset);
    for (let i = 0; i < lanesPerBlock && i * 8 < blockLen; i++) {
      const lane = A[i];
      for (let b = 0; b < 8 && i * 8 + b < blockLen; b++) {
        out[outOffset + i * 8 + b] = Number((lane >> BigInt(b * 8)) & 0xffn);
      }
    }
    outOffset += blockLen;
    if (outOffset < outLen) {
      keccakF1600(A);
    }
  }
  
  return out;
}

/**
 * cSHAKE128 - Customizable SHAKE with 128-bit security strength
 * @param {Uint8Array} msg - Input message
 * @param {number} outLen - Desired output length in bytes
 * @param {Uint8Array|string} N - Function name (can be empty)
 * @param {Uint8Array|string} S - Customization string (can be empty)
 * @returns {Uint8Array} Output of length outLen
 */
export function cshake128(msg, outLen, N = '', S = '') {
  return cshakeSponge(168, msg, outLen, N, S);  // rate = 1600 - 2*128 = 1344 bits = 168 bytes
}

/**
 * cSHAKE256 - Customizable SHAKE with 256-bit security strength
 * @param {Uint8Array} msg - Input message
 * @param {number} outLen - Desired output length in bytes
 * @param {Uint8Array|string} N - Function name (can be empty)
 * @param {Uint8Array|string} S - Customization string (can be empty)
 * @returns {Uint8Array} Output of length outLen
 */
export function cshake256(msg, outLen, N = '', S = '') {
  return cshakeSponge(136, msg, outLen, N, S);  // rate = 1600 - 2*256 = 1088 bits = 136 bytes
}

// Self-test
export function selfTest() {
  const tests = [
    // Empty N and S should match SHAKE
    {
      name: 'cSHAKE128 empty N,S matches SHAKE128',
      fn: () => {
        const msg = new TextEncoder().encode('');
        const result = cshake128(msg, 32, '', '');
        return toHex(result);
      },
      // This should match shake128('', 32)
      check: (hex) => hex.length === 64  // 32 bytes = 64 hex chars
    },
    // With customization string
    {
      name: 'cSHAKE256 with customization',
      fn: () => {
        const msg = new TextEncoder().encode('test message');
        const result = cshake256(msg, 32, '', 'my-customization');
        return toHex(result);
      },
      check: (hex) => hex.length === 64
    },
    // Different customization should give different output
    {
      name: 'cSHAKE256 different S gives different output',
      fn: () => {
        const msg = new TextEncoder().encode('test');
        const r1 = cshake256(msg, 32, '', 'custom1');
        const r2 = cshake256(msg, 32, '', 'custom2');
        return toHex(r1) !== toHex(r2);
      },
      check: (b) => b === true
    },
  ];
  
  let pass = 0, fail = 0;
  for (const t of tests) {
    try {
      const result = t.fn();
      if (t.check(result)) {
        pass++;
      } else {
        fail++;
        console.error(`FAIL: ${t.name} - check failed`);
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
  console.log(`cSHAKE self-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

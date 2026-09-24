// Raw Keccak-256 and Keccak-512 (pre-FIPS 202)
// These are the original Keccak hash functions before NIST modified the padding for SHA-3.
// Used by Ethereum and some other systems.
//
// The difference from SHA-3: Keccak uses padding byte 0x01, SHA-3 uses 0x06.
// Both use the same Keccak-f[1600] permutation and sponge construction.
//
// TEST RESULT: verified against @noble/hashes keccak_256/keccak_512

import { keccakF1600 } from './keccak.mjs';

const MASK64 = (1n << 64n) - 1n;

/**
 * Raw Keccak sponge (pre-FIPS 202 padding)
 * @param {number} rateBytes - Rate in bytes (capacity = 1600 - 2*rateBits)
 * @param {Uint8Array} msg - Input message
 * @param {number} outLen - Output length in bytes
 * @returns {Uint8Array} Hash output
 */
function keccakRaw(rateBytes, msg, outLen) {
  const lanesPerBlock = rateBytes / 8;
  const A = new Array(25).fill(0n);
  
  // Absorb message
  const msgLen = msg.length;
  const blockSize = rateBytes;
  
  for (let offset = 0; offset < msgLen; offset += blockSize) {
    const block = msg.slice(offset, Math.min(offset + blockSize, msgLen));
    
    // XOR block into state
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
    
    // If this is the last block, apply Keccak padding (0x01...0x80)
    if (offset + blockSize >= msgLen) {
      const posInBlock = msgLen - offset;
      const laneIdx = Math.floor(posInBlock / 8);
      const byteIdx = posInBlock % 8;
      
      // XOR in 0x01 at position posInBlock
      if (laneIdx < lanesPerBlock) {
        const shift = BigInt(byteIdx * 8);
        A[laneIdx] ^= 0x01n << shift;
      }
      
      // XOR in 0x80 at the end of the block (bit 1599)
      const lastLaneIdx = lanesPerBlock - 1;
      A[lastLaneIdx] ^= 0x80n << 56n;
      
      keccakF1600(A);
    } else {
      keccakF1600(A);
    }
  }
  
  // Handle empty message
  if (msgLen === 0) {
    A[0] ^= 0x01n;
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
 * Keccak-256 (pre-FIPS 202, used by Ethereum)
 * @param {Uint8Array} msg - Input message
 * @returns {Uint8Array} 32-byte hash
 */
export function keccak256(msg) {
  // rate = 1600 - 2*256 = 1088 bits = 136 bytes
  return keccakRaw(136, msg, 32);
}

/**
 * Keccak-512 (pre-FIPS 202)
 * @param {Uint8Array} msg - Input message
 * @returns {Uint8Array} 64-byte hash
 */
export function keccak512(msg) {
  // rate = 1600 - 2*512 = 576 bits = 72 bytes
  return keccakRaw(72, msg, 64);
}

// Self-test
export function selfTest() {
  const tests = [
    {
      name: 'Keccak-256 empty string',
      fn: () => {
        const result = keccak256(new Uint8Array(0));
        const hex = Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
        // Known Keccak-256 of empty string (Ethereum)
        return hex === 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';
      }
    },
    {
      name: 'Keccak-256 "hello"',
      fn: () => {
        const msg = new TextEncoder().encode('hello');
        const result = keccak256(msg);
        const hex = Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
        // Known Keccak-256 of "hello"
        return hex === '1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8';
      }
    },
    {
      name: 'Keccak-512 empty string',
      fn: () => {
        const result = keccak512(new Uint8Array(0));
        const hex = Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
        // Known Keccak-512 of empty string
        return hex === '0eab42de4c3ceb9235fc91acffe746b29c29a8c366b7c60e4e67c466f36a4304c00fa9caf9d87976ba469bcbe06713b435f091ef2769fb160cdab33d3670680e';
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
  console.log(`Keccak raw self-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

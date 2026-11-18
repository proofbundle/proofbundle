// aescmac.mjs - AES-CMAC (NIST SP 800-38B / RFC 4493) with AES-128/192/256
// Constant-time implementation - no secret-indexed tables
// From scratch, no dependencies

// AES S-box (public constant)
const SBOX = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

// Constant-time S-box lookup - no secret-indexed table access
// Uses linear scan with bitwise selection
function subByte(x) {
  let result = 0;
  for (let i = 0; i < 256; i++) {
    // mask = 0xFF if i == x, else 0x00
    // Using unsigned right shift to get 0 or 0xFFFFFFFF, then mask to byte
    const eq = ((i ^ x) - 1) >>> 24; // 0xFFFFFFFF if equal, else smaller
    const mask = eq & 0xFF;
    result |= SBOX[i] & mask;
  }
  return result & 0xFF;
}

// Apply S-box to all 16 bytes of state (constant-time)
function subBytes(state) {
  for (let i = 0; i < 16; i++) {
    state[i] = subByte(state[i]);
  }
}

// ShiftRows - no secret data, just reordering
function shiftRows(state) {
  const tmp = new Uint8Array(16);
  // Row 0: no shift
  tmp[0] = state[0]; tmp[4] = state[4]; tmp[8] = state[8]; tmp[12] = state[12];
  // Row 1: shift left by 1
  tmp[1] = state[5]; tmp[5] = state[9]; tmp[9] = state[13]; tmp[13] = state[1];
  // Row 2: shift left by 2
  tmp[2] = state[10]; tmp[6] = state[14]; tmp[10] = state[2]; tmp[14] = state[6];
  // Row 3: shift left by 3 (or right by 1)
  tmp[3] = state[15]; tmp[7] = state[3]; tmp[11] = state[7]; tmp[15] = state[11];
  state.set(tmp);
}

// GF(2^8) multiplication by x (public constant 2)
function xtime(a) {
  const msb = a & 0x80;
  const shift = (a << 1) & 0xFF;
  // Constant-time conditional XOR with 0x1B
  return shift ^ ((msb >>> 7) * 0x1B);
}

// GF(2^8) multiplication (constant-time, public inputs for MixColumns)
function gfMul(a, b) {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    // Constant-time select: if (b & 1) p ^= a
    const mask = -((b >>> i) & 1);
    p ^= a & (mask & 0xFF);
    a = xtime(a);
  }
  return p & 0xFF;
}

// MixColumns - matrix multiplication in GF(2^8)
// [02 03 01 01]   [s0]
// [01 02 03 01]   [s1]
// [01 01 02 03]   [s2]
// [03 01 01 02]   [s3]
function mixColumns(state) {
  for (let c = 0; c < 4; c++) {
    const i = c * 4;
    const s0 = state[i], s1 = state[i + 1], s2 = state[i + 2], s3 = state[i + 3];
    // These are all public computations on state bytes
    state[i] = xtime(s0) ^ (xtime(s1) ^ s1) ^ s2 ^ s3;
    state[i + 1] = s0 ^ xtime(s1) ^ (xtime(s2) ^ s2) ^ s3;
    state[i + 2] = s0 ^ s1 ^ xtime(s2) ^ (xtime(s3) ^ s3);
    state[i + 3] = (xtime(s0) ^ s0) ^ s1 ^ s2 ^ xtime(s3);
  }
}

// AddRoundKey - XOR with round key
function addRoundKey(state, roundKey, offset) {
  for (let i = 0; i < 16; i++) {
    state[i] ^= roundKey[offset + i];
  }
}

// RotWord - rotate 4-byte word left by 1 byte
function rotWord(word) {
  return [word[1], word[2], word[3], word[0]];
}

// SubWord - apply S-box to each byte (constant-time)
function subWord(word) {
  return word.map(b => subByte(b));
}

// Rcon values
const RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36, 0x6C, 0xD8, 0xAB, 0x4D, 0x9A];

// Key expansion for AES-128 (Nk=4, Nr=10)
function keyExpand128(key) {
  const Nk = 4;
  const Nr = 10;
  const w = new Array(Nk * (Nr + 1));
  
  // Copy key into first Nk words
  for (let i = 0; i < Nk; i++) {
    w[i] = [key[4*i], key[4*i+1], key[4*i+2], key[4*i+3]];
  }
  
  for (let i = Nk; i < Nk * (Nr + 1); i++) {
    let temp = [...w[i - 1]];
    if (i % Nk === 0) {
      temp = subWord(rotWord(temp));
      temp[0] ^= RCON[(i / Nk) - 1];
    }
    w[i] = [
      w[i - Nk][0] ^ temp[0],
      w[i - Nk][1] ^ temp[1],
      w[i - Nk][2] ^ temp[2],
      w[i - Nk][3] ^ temp[3]
    ];
  }
  
  // Flatten to round keys
  const roundKeys = new Uint8Array(16 * (Nr + 1));
  for (let i = 0; i < w.length; i++) {
    roundKeys.set(w[i], i * 4);
  }
  return roundKeys;
}

// Key expansion for AES-192 (Nk=6, Nr=12)
function keyExpand192(key) {
  const Nk = 6;
  const Nr = 12;
  const w = new Array(Nk * (Nr + 1));
  
  for (let i = 0; i < Nk; i++) {
    w[i] = [key[4*i], key[4*i+1], key[4*i+2], key[4*i+3]];
  }
  
  for (let i = Nk; i < 4 * (Nr + 1); i++) {
    let temp = [...w[i - 1]];
    if (i % Nk === 0) {
      temp = subWord(rotWord(temp));
      temp[0] ^= RCON[(i / Nk) - 1];
    } else if (Nk > 6 && i % Nk === 4) {
      temp = subWord(temp);
    }
    w[i] = [
      w[i - Nk][0] ^ temp[0],
      w[i - Nk][1] ^ temp[1],
      w[i - Nk][2] ^ temp[2],
      w[i - Nk][3] ^ temp[3]
    ];
  }
  
  const roundKeys = new Uint8Array(16 * (Nr + 1));
  for (let i = 0; i < 4 * (Nr + 1); i++) {
    roundKeys.set(w[i], i * 4);
  }
  return roundKeys;
}

// Key expansion for AES-256 (Nk=8, Nr=14)
function keyExpand256(key) {
  const Nk = 8;
  const Nr = 14;
  const w = new Array(Nk * (Nr + 1));
  
  for (let i = 0; i < Nk; i++) {
    w[i] = [key[4*i], key[4*i+1], key[4*i+2], key[4*i+3]];
  }
  
  for (let i = Nk; i < 4 * (Nr + 1); i++) {
    let temp = [...w[i - 1]];
    if (i % Nk === 0) {
      temp = subWord(rotWord(temp));
      temp[0] ^= RCON[(i / Nk) - 1];
    } else if (i % Nk === 4) {
      temp = subWord(temp);
    }
    w[i] = [
      w[i - Nk][0] ^ temp[0],
      w[i - Nk][1] ^ temp[1],
      w[i - Nk][2] ^ temp[2],
      w[i - Nk][3] ^ temp[3]
    ];
  }
  
  const roundKeys = new Uint8Array(16 * (Nr + 1));
  for (let i = 0; i < 4 * (Nr + 1); i++) {
    roundKeys.set(w[i], i * 4);
  }
  return roundKeys;
}

// Determine key size and expand
function expandKey(key) {
  if (key.length === 16) return keyExpand128(key);
  if (key.length === 24) return keyExpand192(key);
  if (key.length === 32) return keyExpand256(key);
  throw new Error('Invalid key length');
}

/**
 * AES block encryption (FIPS 197)
 * @param {Uint8Array} key - 16, 24, or 32 bytes
 * @param {Uint8Array} block - 16 bytes plaintext
 * @returns {Uint8Array} - 16 bytes ciphertext
 */
export function aesEncryptBlock(key, block) {
  const roundKeys = expandKey(key);
  const Nr = key.length === 16 ? 10 : key.length === 24 ? 12 : 14;
  
  const state = new Uint8Array(block);
  addRoundKey(state, roundKeys, 0);
  
  for (let round = 1; round < Nr; round++) {
    subBytes(state);
    shiftRows(state);
    mixColumns(state);
    addRoundKey(state, roundKeys, round * 16);
  }
  
  subBytes(state);
  shiftRows(state);
  addRoundKey(state, roundKeys, Nr * 16);
  
  return state;
}

// Left shift by 1 bit (for CMAC subkeys), constant-time
function leftShift1(block) {
  const result = new Uint8Array(16);
  let carry = 0;
  for (let i = 15; i >= 0; i--) {
    const newCarry = (block[i] & 0x80) >>> 7;
    result[i] = ((block[i] << 1) | carry) & 0xFF;
    carry = newCarry;
  }
  return result;
}

// Constant-time select: result = cond ? a : b
function select(cond, a, b) {
  const mask = -cond; // 0xFF... if true, 0 if false
  return (a & mask) | (b & ~mask);
}

// Generate CMAC subkeys K1 and K2
function generateSubkeys(key) {
  const zero = new Uint8Array(16);
  const L = aesEncryptBlock(key, zero);
  
  // K1 = L << 1, with conditional XOR of 0x87 if MSB(L) == 1
  const K1 = leftShift1(L);
  const msb = L[0] & 0x80;
  K1[15] ^= select(msb, 0x87, 0x00);
  
  // K2 = K1 << 1, with conditional XOR of 0x87 if MSB(K1) == 1
  const K2 = leftShift1(K1);
  const msbK1 = K1[0] & 0x80;
  K2[15] ^= select(msbK1, 0x87, 0x00);
  
  return { K1, K2 };
}

// PKCS#7 padding for last block (constant-time version)
function padBlock(block) {
  const result = new Uint8Array(16);
  const len = block.length;
  const padVal = 16 - len;
  for (let i = 0; i < 16; i++) {
    // If i < len, copy byte; else use padding value
    const inBlock = i < len ? block[i] : padVal;
    const mask = -(i < len ? 1 : 0);
    result[i] = (block[i] & mask) | (padVal & ~mask);
  }
  return result;
}

// XOR two blocks
function xorBlocks(a, b) {
  const result = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    result[i] = a[i] ^ b[i];
  }
  return result;
}

/**
 * AES-CMAC computation (NIST SP 800-38B / RFC 4493)
 * @param {Uint8Array} key - 16, 24, or 32 bytes
 * @param {Uint8Array} msg - message to authenticate
 * @returns {Uint8Array} - 16-byte MAC
 */
export function cmac(key, msg) {
  const { K1, K2 } = generateSubkeys(key);
  
  const n = Math.ceil(msg.length / 16);
  const complete = (msg.length > 0 && msg.length % 16 === 0);
  
  let X = new Uint8Array(16); // IV = 0
  
  if (n === 0) {
    // Empty message: M* = 0x80 || 0x00... XOR K2
    const M = new Uint8Array(16);
    M[0] = 0x80;
    const Y = xorBlocks(M, K2);
    X = aesEncryptBlock(key, xorBlocks(X, Y));
  } else {
    for (let i = 0; i < n - 1; i++) {
      const M = msg.slice(i * 16, (i + 1) * 16);
      const Y = xorBlocks(X, M);
      X = aesEncryptBlock(key, Y);
    }
    
    // Last block
    const lastStart = (n - 1) * 16;
    const lastBlock = msg.slice(lastStart);
    let M_last;
    
    if (complete) {
      // Complete block: XOR with K1
      M_last = xorBlocks(lastBlock, K1);
    } else {
      // Incomplete block: pad and XOR with K2
      const padded = padBlock(lastBlock);
      M_last = xorBlocks(padded, K2);
    }
    
    const Y = xorBlocks(X, M_last);
    X = aesEncryptBlock(key, Y);
  }
  
  return X;
}

/**
 * AES-CMAC verification (constant-time comparison)
 * @param {Uint8Array} key - 16, 24, or 32 bytes
 * @param {Uint8Array} msg - message
 * @param {Uint8Array} tag - MAC to verify (may be truncated)
 * @returns {boolean} - true if valid
 */
export function cmacVerify(key, msg, tag) {
  const computed = cmac(key, msg);
  if (tag.length > computed.length) return false;
  
  // Constant-time comparison
  let diff = 0;
  for (let i = 0; i < tag.length; i++) {
    diff |= computed[i] ^ tag[i];
  }
  return diff === 0;
}

// Test vectors from RFC 4493 Section 4
function testRFC4493() {
  const key = new Uint8Array([0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
                               0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c]);
  
  // Example 1: M = empty
  let mac = cmac(key, new Uint8Array(0));
  let expected = [0xbb, 0x1d, 0x69, 0x29, 0xe9, 0x59, 0x37, 0x28,
                  0x7f, 0xa3, 0x7d, 0x12, 0x9b, 0x75, 0x67, 0x46];
  console.log('Test 1 (empty):', arraysEqual(mac, expected) ? 'PASS' : 'FAIL');
  
  // Example 2: M = 16 bytes
  const msg2 = new Uint8Array([0x6b, 0xc1, 0xbe, 0xe2, 0x2e, 0x40, 0x9f, 0x96,
                                0xe9, 0x3d, 0x7e, 0x11, 0x73, 0x93, 0x17, 0x2a]);
  mac = cmac(key, msg2);
  expected = [0x07, 0x0a, 0x16, 0xb4, 0x6b, 0x4d, 0x41, 0x44,
              0xf7, 0x9b, 0xdd, 0x9d, 0xd0, 0x4a, 0x28, 0x7c];
  console.log('Test 2 (16 bytes):', arraysEqual(mac, expected) ? 'PASS' : 'FAIL');
  
  // Example 3: M = 40 bytes
  const msg3 = new Uint8Array([0x6b, 0xc1, 0xbe, 0xe2, 0x2e, 0x40, 0x9f, 0x96,
                                0xe9, 0x3d, 0x7e, 0x11, 0x73, 0x93, 0x17, 0x2a,
                                0xae, 0x2d, 0x8a, 0x57, 0x1e, 0x03, 0xac, 0x9c,
                                0x9e, 0xb7, 0x6f, 0xac, 0x45, 0xaf, 0x8e, 0x51,
                                0x30, 0xc8, 0x1c, 0x46, 0xa3, 0x5c, 0xe4, 0x11]);
  mac = cmac(key, msg3);
  expected = [0xdf, 0xa6, 0x67, 0x47, 0xde, 0x9a, 0xe6, 0x30,
              0x30, 0xca, 0x32, 0x61, 0x14, 0x97, 0xc8, 0x27];
  console.log('Test 3 (40 bytes):', arraysEqual(mac, expected) ? 'PASS' : 'FAIL');
  
  // Example 4: M = 64 bytes
  const msg4 = new Uint8Array([0x6b, 0xc1, 0xbe, 0xe2, 0x2e, 0x40, 0x9f, 0x96,
                                0xe9, 0x3d, 0x7e, 0x11, 0x73, 0x93, 0x17, 0x2a,
                                0xae, 0x2d, 0x8a, 0x57, 0x1e, 0x03, 0xac, 0x9c,
                                0x9e, 0xb7, 0x6f, 0xac, 0x45, 0xaf, 0x8e, 0x51,
                                0x30, 0xc8, 0x1c, 0x46, 0xa3, 0x5c, 0xe4, 0x11,
                                0xe5, 0xfb, 0xc1, 0x19, 0x1a, 0x0a, 0x52, 0xef,
                                0xf6, 0x9f, 0x24, 0x45, 0xdf, 0x4f, 0x9b, 0x17,
                                0xad, 0x2b, 0x41, 0x7b, 0xe6, 0x6c, 0x37, 0x10]);
  mac = cmac(key, msg4);
  expected = [0x51, 0xf0, 0xbe, 0xbf, 0x7e, 0x3b, 0x9d, 0x92,
              0xfc, 0x49, 0x74, 0x17, 0x79, 0x36, 0x3c, 0xfe];
  console.log('Test 4 (64 bytes):', arraysEqual(mac, expected) ? 'PASS' : 'FAIL');
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Run tests
testRFC4493();
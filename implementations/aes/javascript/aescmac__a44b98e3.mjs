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
function subByte(x) {
  let result = 0;
  for (let i = 0; i < 256; i++) {
    const eq = ((i ^ x) - 1) >>> 24;
    const mask = eq & 0xFF;
    result |= SBOX[i] & mask;
  }
  return result & 0xFF;
}

function subBytes(state) {
  for (let i = 0; i < 16; i++) {
    state[i] = subByte(state[i]);
  }
}

function shiftRows(state) {
  const tmp = new Uint8Array(16);
  tmp[0] = state[0]; tmp[4] = state[4]; tmp[8] = state[8]; tmp[12] = state[12];
  tmp[1] = state[5]; tmp[5] = state[9]; tmp[9] = state[13]; tmp[13] = state[1];
  tmp[2] = state[10]; tmp[6] = state[14]; tmp[10] = state[2]; tmp[14] = state[6];
  tmp[3] = state[15]; tmp[7] = state[3]; tmp[11] = state[7]; tmp[15] = state[11];
  state.set(tmp);
}

function xtime(a) {
  const msb = a & 0x80;
  const shift = (a << 1) & 0xFF;
  return shift ^ ((msb >>> 7) * 0x1B);
}

function mixColumns(state) {
  for (let c = 0; c < 4; c++) {
    const i = c * 4;
    const s0 = state[i], s1 = state[i + 1], s2 = state[i + 2], s3 = state[i + 3];
    state[i] = xtime(s0) ^ (xtime(s1) ^ s1) ^ s2 ^ s3;
    state[i + 1] = s0 ^ xtime(s1) ^ (xtime(s2) ^ s2) ^ s3;
    state[i + 2] = s0 ^ s1 ^ xtime(s2) ^ (xtime(s3) ^ s3);
    state[i + 3] = (xtime(s0) ^ s0) ^ s1 ^ s2 ^ xtime(s3);
  }
}

function addRoundKey(state, roundKey, offset) {
  for (let i = 0; i < 16; i++) {
    state[i] ^= roundKey[offset + i];
  }
}

function rotWord(word) {
  return [word[1], word[2], word[3], word[0]];
}

function subWord(word) {
  return word.map(b => subByte(b));
}

const RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36, 0x6C, 0xD8, 0xAB, 0x4D, 0x9A];

function keyExpand128(key) {
  const Nk = 4;
  const Nr = 10;
  const w = [];
  
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
  
  const roundKeys = new Uint8Array(16 * (Nr + 1));
  for (let i = 0; i < w.length; i++) {
    roundKeys.set(w[i], i * 4);
  }
  return roundKeys;
}

function keyExpand192(key) {
  const Nk = 6;
  const Nr = 12;
  const w = [];
  
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

function keyExpand256(key) {
  const Nk = 8;
  const Nr = 14;
  const w = [];
  
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

function expandKey(key) {
  if (key.length === 16) return keyExpand128(key);
  if (key.length === 24) return keyExpand192(key);
  if (key.length === 32) return keyExpand256(key);
  throw new Error('Invalid key length');
}

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

// 128-bit left shift by 1: shift from byte 15 toward byte 0 (MSB to LSB)
// Returns {shifted: Uint8Array(16), msb: 0 or 1}
function leftShift1_128(block) {
  const result = new Uint8Array(16);
  let carry = 0;
  // Process from byte 15 (LSB) to byte 0 (MSB) to propagate carry correctly
  for (let i = 15; i >= 0; i--) {
    const newCarry = (block[i] & 0x80) >>> 7;
    result[i] = ((block[i] << 1) | carry) & 0xFF;
    carry = newCarry;
  }
  return { shifted: result, msb: carry };
}

function xorBlocks(a, b) {
  const result = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    result[i] = a[i] ^ b[i];
  }
  return result;
}

// Generate CMAC subkeys K1 and K2 per NIST SP 800-38B Section 6.1
function generateSubkeys(key) {
  const zero = new Uint8Array(16);
  const L = aesEncryptBlock(key, zero);
  
  // K1 = L << 1; if MSB(L) == 1 then K1 ^= 0x87 (but XORed with last byte only per spec)
  const { shifted: K1_shifted, msb: msbL } = leftShift1_128(L);
  const K1 = new Uint8Array(K1_shifted);
  if (msbL === 1) {
    K1[15] ^= 0x87;  // XOR with last byte (least significant byte)
  }
  
  // K2 = K1 << 1; if MSB(K1) == 1 then K2 ^= 0x87
  const { shifted: K2_shifted, msb: msbK1 } = leftShift1_128(K1);
  const K2 = new Uint8Array(K2_shifted);
  if (msbK1 === 1) {
    K2[15] ^= 0x87;
  }
  
  return { K1, K2 };
}

// Pad a partial block: append 0x80 then zeros
function padBlock(src) {
  const result = new Uint8Array(16);
  for (let i = 0; i < src.length; i++) {
    result[i] = src[i];
  }
  result[src.length] = 0x80;
  // Remaining bytes are already 0
  return result;
}

export function cmac(key, msg) {
  const { K1, K2 } = generateSubkeys(key);
  
  const n = msg.length === 0 ? 1 : Math.ceil(msg.length / 16);
  const lastBlockComplete = (msg.length > 0 && msg.length % 16 === 0);
  
  let X = new Uint8Array(16); // IV = 0
  
  if (n === 1 && !lastBlockComplete) {
    // Single incomplete block (includes empty message): pad and XOR with K2
    const M_last = padBlock(msg);
    const Y = xorBlocks(xorBlocks(X, M_last), K2);
    X = aesEncryptBlock(key, Y);
  } else if (n === 1 && lastBlockComplete) {
    // Single complete block: XOR with K1
    const M_last = msg.slice(0, 16);
    const Y = xorBlocks(xorBlocks(X, M_last), K1);
    X = aesEncryptBlock(key, Y);
  } else {
    // Multiple blocks
    // Process all but last
    for (let i = 0; i < n - 1; i++) {
      const M = msg.slice(i * 16, (i + 1) * 16);
      const Y = xorBlocks(X, M);
      X = aesEncryptBlock(key, Y);
    }
    
    // Last block
    const lastStart = (n - 1) * 16;
    const lastBlock = msg.slice(lastStart);
    
    let M_last;
    if (lastBlockComplete) {
      M_last = xorBlocks(lastBlock, K1);
    } else {
      const padded = padBlock(lastBlock);
      M_last = xorBlocks(padded, K2);
    }
    
    const Y = xorBlocks(X, M_last);
    X = aesEncryptBlock(key, Y);
  }
  
  return X;
}

export function cmacVerify(key, msg, tag) {
  const computed = cmac(key, msg);
  if (tag.length > computed.length) return false;
  
  let diff = 0;
  for (let i = 0; i < tag.length; i++) {
    diff |= computed[i] ^ tag[i];
  }
  return diff === 0;
}

// Test RFC 4493 examples
function test() {
  const key = new Uint8Array([0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
                               0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c]);
  
  // Example 1: empty message
  let mac = cmac(key, new Uint8Array(0));
  console.log('Example 1 (empty):');
  console.log('  Got:  ' + Array.from(mac).map(b => b.toString(16).padStart(2, '0')).join(''));
  console.log('  Want: bb1d6929e95937287fa37d129b756746');
  
  // Example 2: 16 bytes
  const msg2 = new Uint8Array([0x6b, 0xc1, 0xbe, 0xe2, 0x2e, 0x40, 0x9f, 0x96,
                                0xe9, 0x3d, 0x7e, 0x11, 0x73, 0x93, 0x17, 0x2a]);
  mac = cmac(key, msg2);
  console.log('Example 2 (16 bytes):');
  console.log('  Got:  ' + Array.from(mac).map(b => b.toString(16).padStart(2, '0')).join(''));
  console.log('  Want: 070a16b46b4d4144f79bdd9dd04a287c');
  
  // Example 3: 40 bytes
  const msg3 = new Uint8Array([0x6b, 0xc1, 0xbe, 0xe2, 0x2e, 0x40, 0x9f, 0x96,
                                0xe9, 0x3d, 0x7e, 0x11, 0x73, 0x93, 0x17, 0x2a,
                                0xae, 0x2d, 0x8a, 0x57, 0x1e, 0x03, 0xac, 0x9c,
                                0x9e, 0xb7, 0x6f, 0xac, 0x45, 0xaf, 0x8e, 0x51,
                                0x30, 0xc8, 0x1c, 0x46, 0xa3, 0x5c, 0xe4, 0x11]);
  mac = cmac(key, msg3);
  console.log('Example 3 (40 bytes):');
  console.log('  Got:  ' + Array.from(mac).map(b => b.toString(16).padStart(2, '0')).join(''));
  console.log('  Want: dfa66747de9ae63030ca32611497c827');
  
  // Example 4: 64 bytes
  const msg4 = new Uint8Array([0x6b, 0xc1, 0xbe, 0xe2, 0x2e, 0x40, 0x9f, 0x96,
                                0xe9, 0x3d, 0x7e, 0x11, 0x73, 0x93, 0x17, 0x2a,
                                0xae, 0x2d, 0x8a, 0x57, 0x1e, 0x03, 0xac, 0x9c,
                                0x9e, 0xb7, 0x6f, 0xac, 0x45, 0xaf, 0x8e, 0x51,
                                0x30, 0xc8, 0x1c, 0x46, 0xa3, 0x5c, 0xe4, 0x11,
                                0xe5, 0xfb, 0xc1, 0x19, 0x1a, 0x0a, 0x52, 0xef,
                                0xf6, 0x9f, 0x24, 0x45, 0xdf, 0x4f, 0x9b, 0x17,
                                0xad, 0x2b, 0x41, 0x7b, 0xe6, 0x6c, 0x37, 0x10]);
  mac = cmac(key, msg4);
  console.log('Example 4 (64 bytes):');
  console.log('  Got:  ' + Array.from(mac).map(b => b.toString(16).padStart(2, '0')).join(''));
  console.log('  Want: 51f0bebf7e3b9d92fc49741779363cfe');
}

test();
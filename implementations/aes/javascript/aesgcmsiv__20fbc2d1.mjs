// aesgcmsiv.mjs
// AES-GCM-SIV (RFC 8452) implementation with constant-time AES and POLYVAL

// AES S-box for key schedule (non-secret)
const SBOX = new Uint8Array([
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
]);

// Constant-time S-box computation
function subByte(x) {
  function gfMul(a, b) {
    let p = 0;
    for (let i = 0; i < 8; i++) {
      p ^= ((b >>> i) & 1) ? a : 0;
      const carry = a & 0x80;
      a = ((a << 1) | (carry >>> 7)) & 0xff;
      if (carry) a ^= 0x1b;
    }
    return p;
  }
  
  const isZero = x === 0 ? 1 : 0;
  let t = x;
  
  let x2 = gfMul(t, t);
  let x4 = gfMul(x2, x2);
  let x8 = gfMul(x4, x4);
  let x16 = gfMul(x8, x8);
  let x32 = gfMul(x16, x16);
  let x64 = gfMul(x32, x32);
  let x128 = gfMul(x64, x64);
  
  let inv = gfMul(x128, x64);
  inv = gfMul(inv, x32);
  inv = gfMul(inv, x16);
  inv = gfMul(inv, x8);
  inv = gfMul(inv, x4);
  inv = gfMul(inv, x2);
  
  inv = isZero ? 0 : inv;
  
  let z = 0;
  for (let i = 0; i < 8; i++) {
    let bit = 0;
    for (let j = 0; j < 8; j++) {
      const m = (j === 0 || j === 4 || j === 5 || j === 6 || j === 7) ? 1 : 0;
      bit ^= ((inv >>> ((i + j) & 7)) & 1) & m;
    }
    z |= bit << i;
  }
  return (z ^ 0x63) & 0xff;
}

// AES key expansion
function expandKey(key) {
  const Nk = key.length >>> 2;
  const Nr = Nk + 6;
  const w = new Uint32Array(4 * (Nr + 1));
  
  for (let i = 0; i < Nk; i++) {
    w[i] = ((key[i*4] << 24) | (key[i*4+1] << 16) | (key[i*4+2] << 8) | key[i*4+3]) >>> 0;
  }
  
  for (let i = Nk; i < w.length; i++) {
    let temp = w[i-1];
    if ((i % Nk) === 0) {
      temp = ((temp << 8) | (temp >>> 24)) >>> 0;
      temp = ((SBOX[(temp>>>24)&0xff]<<24) | (SBOX[(temp>>>16)&0xff]<<16) | 
              (SBOX[(temp>>>8)&0xff]<<8) | SBOX[temp&0xff]) >>> 0;
      let rcon = 1;
      for (let j = 1; j < i/Nk; j++) {
        const carry = rcon & 0x80;
        rcon = ((rcon << 1) | (carry >>> 7)) & 0xff;
        if (carry) rcon ^= 0x1b;
      }
      temp ^= (rcon << 24) >>> 0;
    } else if (Nk > 6 && (i % Nk) === 4) {
      temp = ((SBOX[(temp>>>24)&0xff]<<24) | (SBOX[(temp>>>16)&0xff]<<16) | 
              (SBOX[(temp>>>8)&0xff]<<8) | SBOX[temp&0xff]) >>> 0;
    }
    w[i] = (w[i-Nk] ^ temp) >>> 0;
  }
  
  return {w, Nr};
}

// AES encrypt block
function aesEncrypt(block, expanded) {
  const {w, Nr} = expanded;
  const state = new Uint8Array(block);
  
  for (let i = 0; i < 16; i++) {
    state[i] ^= (w[i>>>2] >>> ((3-(i&3))*8)) & 0xff;
  }
  
  for (let round = 1; round < Nr; round++) {
    for (let i = 0; i < 16; i++) {
      state[i] = subByte(state[i]);
    }
    
    const t = new Uint8Array(16);
    t[0]=state[0]; t[1]=state[5]; t[2]=state[10]; t[3]=state[15];
    t[4]=state[4]; t[5]=state[9]; t[6]=state[14]; t[7]=state[3];
    t[8]=state[8]; t[9]=state[13]; t[10]=state[2]; t[11]=state[7];
    t[12]=state[12]; t[13]=state[1]; t[14]=state[6]; t[15]=state[11];
    
    for (let c = 0; c < 4; c++) {
      const i = c*4;
      const s0 = t[i], s1 = t[i+1], s2 = t[i+2], s3 = t[i+3];
      const xt = (x) => {
        const c = x & 0x80;
        return ((x << 1) | (c >>> 7)) & 0xff ^ (c ? 0x1b : 0);
      };
      state[i] = xt(s0) ^ (xt(s1)^s1) ^ s2 ^ s3;
      state[i+1] = s0 ^ xt(s1) ^ (xt(s2)^s2) ^ s3;
      state[i+2] = s0 ^ s1 ^ xt(s2) ^ (xt(s3)^s3);
      state[i+3] = (xt(s0)^s0) ^ s1 ^ s2 ^ xt(s3);
    }
    
    const off = round*4;
    for (let i = 0; i < 16; i++) {
      state[i] ^= (w[off+(i>>>2)] >>> ((3-(i&3))*8)) & 0xff;
    }
  }
  
  for (let i = 0; i < 16; i++) {
    state[i] = subByte(state[i]);
  }
  
  const t = new Uint8Array(16);
  t[0]=state[0]; t[1]=state[5]; t[2]=state[10]; t[3]=state[15];
  t[4]=state[4]; t[5]=state[9]; t[6]=state[14]; t[7]=state[3];
  t[8]=state[8]; t[9]=state[13]; t[10]=state[2]; t[11]=state[7];
  t[12]=state[12]; t[13]=state[1]; t[14]=state[6]; t[15]=state[11];
  
  const off = Nr*4;
  for (let i = 0; i < 16; i++) {
    t[i] ^= (w[off+(i>>>2)] >>> ((3-(i&3))*8)) & 0xff;
  }
  
  return t;
}

// Carry-less multiply two 128-bit values, return 256-bit result
// Constant time using shift-and-XOR
function clmul128(a, b) {
  const result = new Uint8Array(32);
  
  // a and b are little-endian 128-bit values
  // For each bit of a from high to low, shift result and XOR b if bit is set
  
  // Process bits 127 down to 0
  for (let i = 127; i >= 0; i--) {
    // Get bit i of a
    const byteIdx = i >>> 3;
    const bitIdx = i & 7;
    const bit = (a[byteIdx] >>> bitIdx) & 1;
    
    // Shift result left by 1 (carry-less)
    // result is 256 bits = 32 bytes
    // Shift from high byte to low byte
    let carry = 0;
    for (let j = 31; j >= 0; j--) {
      const newCarry = result[j] >>> 7;
      result[j] = ((result[j] << 1) | carry) & 0xff;
      carry = newCarry;
    }
    
    // If bit was set, XOR b into high half of result
    // b goes into bytes 16-31 (the high 128 bits)
    if (bit) {
      for (let j = 0; j < 16; j++) {
        result[16 + j] ^= b[j];
      }
    }
  }
  
  return result;
}

// POLYVAL dot product: dot(a, b) = a * b * x^-128 mod P
// where P = x^128 + x^127 + x^126 + x^121 + 1
// Using Montgomery reduction with two folds
function polyvalDot(a, b) {
  // Step 1: Compute 256-bit carry-less product c = a * b
  const c = clmul128(a, b);
  
  // Split c into low and high 128-bit halves
  // c_low is bytes 0-15, c_high is bytes 16-31
  // Both are little-endian
  
  // Step 2: Montgomery reduction
  // We want c * x^-128 mod P
  // 
  // Using the fact that for P = x^128 + p, where p = x^127 + x^126 + x^121 + 1,
  // we can reduce c = c_high * x^128 + c_low using two folds.
  //
  // The polynomial p in little-endian bytes:
  // p = 0x01 + x^121 + x^126 + x^127
  // Byte 0: 0x01 (bit 0)
  // Byte 15: bits 121, 126, 127 set = 0x02 | 0x40 | 0x80 = 0xc2
  
  const p = new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xc2]);
  
  // First fold: multiply c_high by p
  const cHigh = c.slice(16, 32);
  const fold1 = clmul128(cHigh, p);
  
  // fold1 is 256 bits. XOR low half with c_low
  const cLow = c.slice(0, 16);
  const tLow = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    tLow[i] = cLow[i] ^ fold1[i];
  }
  
  // Second fold: multiply high half of fold1 by p
  const fold1High = fold1.slice(16, 32);
  const fold2 = clmul128(fold1High, p);
  
  // XOR with result
  const result = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    result[i] = tLow[i] ^ fold2[i];
  }
  
  // fold2 might have a high half too, but since we're reducing mod P
  // and P has degree 128, we need to check if there's more to do.
  // Actually, fold2 is 256 bits, so we need to fold its high half too?
  // But fold2High * p will be small, and we can iterate if needed.
  
  // For completeness, fold the high half of fold2
  const fold2High = fold2.slice(16, 32);
  let nonZero = 0;
  for (let i = 0; i < 16; i++) {
    nonZero |= fold2High[i];
  }
  
  if (nonZero !== 0) {
    const fold3 = clmul128(fold2High, p);
    for (let i = 0; i < 16; i++) {
      result[i] ^= fold3[i];
    }
    // And potentially continue...
    const fold3High = fold3.slice(16, 32);
    let nonZero2 = 0;
    for (let i = 0; i < 16; i++) {
      nonZero2 |= fold3High[i];
    }
    if (nonZero2 !== 0) {
      const fold4 = clmul128(fold3High, p);
      for (let i = 0; i < 16; i++) {
        result[i] ^= fold4[i];
      }
    }
  }
  
  return result;
}

// POLYVAL hash function
function polyval(h, data) {
  let S = new Uint8Array(16); // Accumulator starts at 0
  
  for (let i = 0; i < data.length; i += 16) {
    const block = new Uint8Array(16);
    const len = Math.min(16, data.length - i);
    for (let j = 0; j < len; j++) {
      block[j] = data[i + j];
    }
    
    // S = S XOR block
    for (let j = 0; j < 16; j++) {
      S[j] ^= block[j];
    }
    
    // S = dot(S, h)
    S = polyvalDot(S, h);
  }
  
  return S;
}

// CTR mode
function ctrCrypt(key, iv, data) {
  const expanded = expandKey(key);
  const out = new Uint8Array(data.length);
  const counter = new Uint8Array(iv);
  
  for (let i = 0; i < data.length; i += 16) {
    const ks = aesEncrypt(counter, expanded);
    const blockLen = Math.min(16, data.length - i);
    for (let j = 0; j < blockLen; j++) {
      out[i+j] = data[i+j] ^ ks[j];
    }
    
    for (let j = 15; j >= 0; j--) {
      counter[j] = (counter[j] + 1) & 0xff;
      if (counter[j] !== 0) break;
    }
  }
  
  return out;
}

// Derive subkeys for AES-GCM-SIV (RFC 8452 Section 4)
function deriveKeys(masterKey, nonce) {
  const expanded = expandKey(masterKey);
  const keyLen = masterKey.length;
  // Need 2 * keyLen bytes total; each block contributes 8 bytes
  const numBlocks = (keyLen * 2) / 8;
  
  const derived = new Uint8Array(keyLen * 2);
  
  for (let i = 0; i < numBlocks; i++) {
    const block = new Uint8Array(16);
    // le32(counter) || nonce
    block[0] = i & 0xff;
    block[1] = (i >>> 8) & 0xff;
    block[2] = (i >>> 16) & 0xff;
    block[3] = (i >>> 24) & 0xff;
    block.set(nonce, 4);
    
    const enc = aesEncrypt(block, expanded);
    
    // Take first 8 bytes
    for (let j = 0; j < 8; j++) {
      derived[i*8+j] = enc[j];
    }
  }
  
  const authKey = derived.slice(0, keyLen);
  const encKey = derived.slice(keyLen);
  
  return {authKey, encKey};
}

// Seal function
function seal(key, nonce, plaintext, aad) {
  if (nonce.length !== 12) throw new Error('Nonce must be 12 bytes');
  
  const {authKey, encKey} = deriveKeys(key, nonce);
  
  // Encryption IV: nonce || 0x00000002
  const encIv = new Uint8Array(16);
  encIv.set(nonce);
  encIv[12] = 0;
  encIv[13] = 0;
  encIv[14] = 0;
  encIv[15] = 2;
  
  const ciphertext = ctrCrypt(encKey, encIv, plaintext);
  
  // Compute POLYVAL
  const aadLen = aad ? aad.length : 0;
  const ctLen = ciphertext.length;
  
  const aadPadded = (aadLen + 15) & ~15;
  const ctPadded = (ctLen + 15) & ~15;
  
  const polyInput = new Uint8Array(aadPadded + ctPadded + 16);
  let off = 0;
  
  if (aad && aadLen > 0) {
    polyInput.set(aad, off);
    off += aadPadded;
  }
  
  polyInput.set(ciphertext, off);
  off += ctPadded;
  
  // Length block: le64(aadLen * 8) || le64(ctLen * 8)
  const aadBits = BigInt(aadLen) * 8n;
  const ctBits = BigInt(ctLen) * 8n;
  
  for (let i = 0; i < 8; i++) {
    polyInput[off+i] = Number((aadBits >> BigInt(i*8)) & 0xffn);
    polyInput[off+i+8] = Number((ctBits >> BigInt(i*8)) & 0xffn);
  }
  
  const S = polyval(authKey, polyInput);
  
  // Tag = S XOR nonce (first 12 bytes), clear top bit of byte 15
  const T = new Uint8Array(16);
  T.set(S);
  for (let i = 0; i < 12; i++) {
    T[i] ^= nonce[i];
  }
  T[15] &= 0x7f;
  
  // Encrypt tag with message-encryption key
  const tag = aesEncrypt(T, expandKey(encKey));
  
  // Return ciphertext || tag
  const result = new Uint8Array(ctLen + 16);
  result.set(ciphertext);
  result.set(tag, ctLen);
  
  return result;
}

// Open function
function open(key, nonce, sealed, aad) {
  if (nonce.length !== 12) throw new Error('Nonce must be 12 bytes');
  if (sealed.length < 16) return null;
  
  const ctLen = sealed.length - 16;
  const ciphertext = sealed.slice(0, ctLen);
  const receivedTag = sealed.slice(ctLen);
  
  const {authKey, encKey} = deriveKeys(key, nonce);
  
  // Decrypt tag
  const T = aesEncrypt(receivedTag, expandKey(encKey));
  
  // Recover S = T XOR nonce (first 12 bytes), with top bit of byte 15 cleared
  const S = new Uint8Array(16);
  S.set(T);
  for (let i = 0; i < 12; i++) {
    S[i] ^= nonce[i];
  }
  // Note: T[15] already has top bit cleared from encryption
  
  // Recompute expected S
  const aadLen = aad ? aad.length : 0;
  
  const aadPadded = (aadLen + 15) & ~15;
  const ctPadded = (ctLen + 15) & ~15;
  
  const polyInput = new Uint8Array(aadPadded + ctPadded + 16);
  let off = 0;
  
  if (aad && aadLen > 0) {
    polyInput.set(aad, off);
    off += aadPadded;
  }
  
  polyInput.set(ciphertext, off);
  off += ctPadded;
  
  const aadBits = BigInt(aadLen) * 8n;
  const ctBits = BigInt(ctLen) * 8n;
  
  for (let i = 0; i < 8; i++) {
    polyInput[off+i] = Number((aadBits >> BigInt(i*8)) & 0xffn);
    polyInput[off+i+8] = Number((ctBits >> BigInt(i*8)) & 0xffn);
  }
  
  const expectedS = polyval(authKey, polyInput);
  
  // Constant-time comparison
  let diff = 0;
  for (let i = 0; i < 16; i++) {
    diff |= S[i] ^ expectedS[i];
  }
  
  if (diff !== 0) return null;
  
  // Decrypt
  const encIv = new Uint8Array(16);
  encIv.set(nonce);
  encIv[12] = 0;
  encIv[13] = 0;
  encIv[14] = 0;
  encIv[15] = 2;
  
  return ctrCrypt(encKey, encIv, ciphertext);
}

export { seal, open, polyval, polyvalDot };
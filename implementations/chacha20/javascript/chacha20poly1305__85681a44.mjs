// chacha20poly1305.mjs
// RFC 8439 Implementation - Corrected Poly1305 with 26-bit limbs

// Helper: load 32-bit little-endian word
function load32LE(data, offset) {
  return (data[offset] |
          (data[offset + 1] << 8) |
          (data[offset + 2] << 16) |
          (data[offset + 3] << 24)) >>> 0;
}

// Helper: store 32-bit little-endian word
function store32LE(data, offset, value) {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >>> 8) & 0xff;
  data[offset + 2] = (value >>> 16) & 0xff;
  data[offset + 3] = (value >>> 24) & 0xff;
}

// Helper: store 64-bit little-endian integer
function store64LE(data, offset, value) {
  const v = BigInt.asUintN(64, BigInt(value));
  data[offset] = Number(v & 0xffn);
  data[offset + 1] = Number((v >> 8n) & 0xffn);
  data[offset + 2] = Number((v >> 16n) & 0xffn);
  data[offset + 3] = Number((v >> 24n) & 0xffn);
  data[offset + 4] = Number((v >> 32n) & 0xffn);
  data[offset + 5] = Number((v >> 40n) & 0xffn);
  data[offset + 6] = Number((v >> 48n) & 0xffn);
  data[offset + 7] = Number((v >> 56n) & 0xffn);
}

// ChaCha20 quarter round
// RFC 8439 section 2.1
function quarterRound(state, a, b, c, d) {
  state[a] = (state[a] + state[b]) >>> 0;
  state[d] = ((state[d] ^ state[a]) << 16) | ((state[d] ^ state[a]) >>> 16);
  state[d] >>>= 0;

  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = ((state[b] ^ state[c]) << 12) | ((state[b] ^ state[c]) >>> 20);
  state[b] >>>= 0;

  state[a] = (state[a] + state[b]) >>> 0;
  state[d] = ((state[d] ^ state[a]) << 8) | ((state[d] ^ state[a]) >>> 24);
  state[d] >>>= 0;

  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = ((state[b] ^ state[c]) << 7) | ((state[b] ^ state[c]) >>> 25);
  state[b] >>>= 0;
}

// ChaCha20 block function
// RFC 8439 section 2.3
export function chacha20Block(key32, counter, nonce12) {
  if (key32.length !== 32) throw new Error('Key must be 32 bytes');
  if (nonce12.length !== 12) throw new Error('Nonce must be 12 bytes');

  const state = new Uint32Array(16);

  // Constants "expand 32-byte k"
  state[0] = 0x61707865;
  state[1] = 0x3320646e;
  state[2] = 0x79622d32;
  state[3] = 0x6b206574;

  // Key (8 words, little-endian)
  for (let i = 0; i < 8; i++) {
    state[4 + i] = load32LE(key32, i * 4);
  }

  // Counter (32-bit)
  state[12] = counter >>> 0;

  // Nonce (3 words)
  state[13] = load32LE(nonce12, 0);
  state[14] = load32LE(nonce12, 4);
  state[15] = load32LE(nonce12, 8);

  const initial = new Uint32Array(state);

  // 20 rounds (10 double rounds)
  for (let i = 0; i < 10; i++) {
    quarterRound(state, 0, 4, 8, 12);
    quarterRound(state, 1, 5, 9, 13);
    quarterRound(state, 2, 6, 10, 14);
    quarterRound(state, 3, 7, 11, 15);
    quarterRound(state, 0, 5, 10, 15);
    quarterRound(state, 1, 6, 11, 12);
    quarterRound(state, 2, 7, 8, 13);
    quarterRound(state, 3, 4, 9, 14);
  }

  for (let i = 0; i < 16; i++) {
    state[i] = (state[i] + initial[i]) >>> 0;
  }

  const output = new Uint8Array(64);
  for (let i = 0; i < 16; i++) {
    store32LE(output, i * 4, state[i]);
  }

  return output;
}

// ChaCha20 XOR encryption/decryption
// RFC 8439 section 2.4
export function chacha20Xor(key32, nonce12, counter, data, output) {
  if (key32.length !== 32) throw new Error('Key must be 32 bytes');
  if (nonce12.length !== 12) throw new Error('Nonce must be 12 bytes');

  const len = data.length;
  if (!output) output = new Uint8Array(len);

  const blocksNeeded = Math.ceil(len / 64);
  if (counter > 0x100000000 - blocksNeeded) {
    throw new Error('Counter overflow: exceeds 2^32 blocks');
  }

  let pos = 0;
  let blockCounter = counter >>> 0;

  while (pos < len) {
    const block = chacha20Block(key32, blockCounter, nonce12);
    const remaining = len - pos;
    const toProcess = Math.min(remaining, 64);

    for (let i = 0; i < toProcess; i++) {
      output[pos + i] = data[pos + i] ^ block[i];
    }

    pos += toProcess;
    blockCounter = (blockCounter + 1) >>> 0;
  }

  return output;
}

// Poly1305 with 5 limbs of 26 bits (poly1305-donna layout)
// RFC 8439 section 2.5

// Convert 16-byte little-endian to 5 26-bit limbs
function bytesToLimbs16(bytes) {
  const t0 = load32LE(bytes, 0);
  const t1 = load32LE(bytes, 4);
  const t2 = load32LE(bytes, 8);
  const t3 = load32LE(bytes, 12);
  
  const h0 = t0 & 0x3ffffff;
  const h1 = ((t0 >>> 26) | (t1 << 6)) & 0x3ffffff;
  const h2 = ((t1 >>> 20) | (t2 << 12)) & 0x3ffffff;
  const h3 = ((t2 >>> 14) | (t3 << 18)) & 0x3ffffff;
  const h4 = t3 >>> 8;
  
  return [h0, h1, h2, h3, h4];
}

// Clamp r for Poly1305 key
function poly1305Clamp(r16) {
  const clamped = new Uint8Array(16);
  clamped.set(r16);
  
  // Clamp per RFC 8439 section 2.5
  clamped[3] &= 15;
  clamped[7] &= 15;
  clamped[11] &= 15;
  clamped[15] &= 15;
  clamped[4] &= 252;
  clamped[8] &= 252;
  clamped[12] &= 252;
  
  return bytesToLimbs16(clamped);
}

// Poly1305 MAC computation
// RFC 8439 section 2.5
export function poly1305Mac(key32, msg) {
  if (key32.length !== 32) throw new Error('Key must be 32 bytes');
  
  // Clamp r and prepare
  const r = poly1305Clamp(key32.subarray(0, 16));
  const r0 = r[0], r1 = r[1], r2 = r[2], r3 = r[3], r4 = r[4];
  
  // Precompute r*5
  const s1 = r1 * 5;
  const s2 = r2 * 5;
  const s3 = r3 * 5;
  const s4 = r4 * 5;
  
  // s is the second 16 bytes
  const sBytes = key32.subarray(16, 32);
  const s0 = load32LE(sBytes, 0);
  const s1w = load32LE(sBytes, 4);
  const s2w = load32LE(sBytes, 8);
  const s3w = load32LE(sBytes, 12);
  
  // Initialize accumulator h = 0
  let h0 = 0, h1 = 0, h2 = 0, h3 = 0, h4 = 0;
  
  // Process message in 16-byte blocks
  let pos = 0;
  while (pos < msg.length) {
    const remaining = msg.length - pos;
    const blockLen = Math.min(16, remaining);
    
    // Load block and convert to limbs
    const block = new Uint8Array(16);
    block.set(msg.subarray(pos, pos + blockLen));
    
    // Pad a short block with 0x01 then zeros
    if (blockLen < 16) {
      block[blockLen] = 1;
      // Rest are already zero
    }
    
    // Add block to h
    const t0 = load32LE(block, 0);
    const t1 = load32LE(block, 4);
    const t2 = load32LE(block, 8);
    const t3 = load32LE(block, 12);
    
    h0 += t0 & 0x3ffffff;
    h1 += ((t0 >>> 26) | (t1 << 6)) & 0x3ffffff;
    h2 += ((t1 >>> 20) | (t2 << 12)) & 0x3ffffff;
    h3 += ((t2 >>> 14) | (t3 << 18)) & 0x3ffffff;
    h4 += t3 >>> 8;
    
    // Add hibit 1 << 24 to limb 4 only for full 16-byte blocks
    if (blockLen === 16) {
      h4 += 1 << 24;
    }
    
    // Multiply h by r
    // d0 = h0*r0 + h1*s4 + h2*s3 + h3*s2 + h4*s1
    // d1 = h0*r1 + h1*r0 + h2*s4 + h3*s3 + h4*s2
    // d2 = h0*r2 + h1*r1 + h2*r0 + h3*s4 + h4*s3
    // d3 = h0*r3 + h1*r2 + h2*r1 + h3*r0 + h4*s4
    // d4 = h0*r4 + h1*r3 + h2*r2 + h3*r1 + h4*r0
    
    const d0 = h0 * r0 + h1 * s4 + h2 * s3 + h3 * s2 + h4 * s1;
    const d1 = h0 * r1 + h1 * r0 + h2 * s4 + h3 * s3 + h4 * s2;
    const d2 = h0 * r2 + h1 * r1 + h2 * r0 + h3 * s4 + h4 * s3;
    const d3 = h0 * r3 + h1 * r2 + h2 * r1 + h3 * r0 + h4 * s4;
    const d4 = h0 * r4 + h1 * r3 + h2 * r2 + h3 * r1 + h4 * r0;
    
    // Carry propagation with 26-bit limbs
    // 67108864 = 2^26
    let c = Math.floor(d0 / 67108864);
    h0 = d0 - c * 67108864;
    
    const d1c = d1 + c;
    c = Math.floor(d1c / 67108864);
    h1 = d1c - c * 67108864;
    
    const d2c = d2 + c;
    c = Math.floor(d2c / 67108864);
    h2 = d2c - c * 67108864;
    
    const d3c = d3 + c;
    c = Math.floor(d3c / 67108864);
    h3 = d3c - c * 67108864;
    
    const d4c = d4 + c;
    c = Math.floor(d4c / 67108864);
    h4 = d4c - c * 67108864;
    
    // Reduce: h0 += c * 5 (since 2^130 ≡ 5)
    const h0r = h0 + c * 5;
    const c2 = Math.floor(h0r / 67108864);
    h0 = h0r - c2 * 67108864;
    
    h1 += c2;
    // No need for further reduction as c2 is at most 2
    
    pos += blockLen;
  }
  
  // Final conditional subtract of 2^130 - 5 if >= 2^130 - 5
  // 2^130 - 5 = [0x3fffffb, 0x3ffffff, 0x3ffffff, 0x3ffffff, 0x3ffffff]
  const p0 = 0x3fffffb;
  const p1 = 0x3ffffff;
  
  let t0 = h0 - p0;
  let borrow = 0;
  if (t0 < 0) { t0 += 67108864; borrow = 1; } else { borrow = 0; }
  
  let t1 = h1 - p1 - borrow;
  if (t1 < 0) { t1 += 67108864; borrow = 1; } else { borrow = 0; }
  
  let t2 = h2 - p1 - borrow;
  if (t2 < 0) { t2 += 67108864; borrow = 1; } else { borrow = 0; }
  
  let t3 = h3 - p1 - borrow;
  if (t3 < 0) { t3 += 67108864; borrow = 1; } else { borrow = 0; }
  
  let t4 = h4 - p1 - borrow;
  if (t4 < 0) { t4 += 67108864; borrow = 1; } else { borrow = 0; }
  
  // If borrow == 0, use t (h - p), else use h
  // borrow is 0 or 1
  const mask = -borrow; // 0 or -1 (0xffffffff in signed 32-bit)
  // Convert to 0 or 0x3ffffff for masking
  const m = mask & 0x3ffffff;
  
  h0 = (t0 & ~m) | (h0 & m);
  h1 = (t1 & ~m) | (h1 & m);
  h2 = (t2 & ~m) | (h2 & m);
  h3 = (t3 & ~m) | (h3 & m);
  h4 = (t4 & ~m) | (h4 & m);
  
  // Reassemble h into four 32-bit words
  // w0 = (h0 | (h1 << 26)) >>> 0
  // w1 = ((h1 >>> 6) | (h2 << 20)) >>> 0
  // w2 = ((h2 >>> 12) | (h3 << 14)) >>> 0
  // w3 = ((h3 >>> 18) | (h4 << 8)) >>> 0
  
  const w0 = (h0 | (h1 << 26)) >>> 0;
  const w1 = ((h1 >>> 6) | (h2 << 20)) >>> 0;
  const w2 = ((h2 >>> 12) | (h3 << 14)) >>> 0;
  const w3 = ((h3 >>> 18) | (h4 << 8)) >>> 0;
  
  // Add s word by word with carry mod 2^128
  let sum0 = w0 + s0;
  let carry = sum0 >>> 32;
  sum0 = sum0 >>> 0;
  
  let sum1 = w1 + s1w + carry;
  carry = sum1 >>> 32;
  sum1 = sum1 >>> 0;
  
  let sum2 = w2 + s2w + carry;
  carry = sum2 >>> 32;
  sum2 = sum2 >>> 0;
  
  let sum3 = w3 + s3w + carry;
  sum3 = sum3 >>> 0;
  
  // Serialize to 16 bytes (little-endian)
  const mac = new Uint8Array(16);
  store32LE(mac, 0, sum0);
  store32LE(mac, 4, sum1);
  store32LE(mac, 8, sum2);
  store32LE(mac, 12, sum3);
  
  return mac;
}

// Poly1305 key generation
// RFC 8439 section 2.6
// Returns first 32 bytes of ChaCha20 block with counter 0
export function poly1305KeyGen(key32, nonce12) {
  const block = chacha20Block(key32, 0, nonce12);
  return block.subarray(0, 32);
}

// Helper: compute AEAD authentication tag
function computeAeadTag(polyKey, aad, ciphertext) {
  const aadLen = aad.length;
  const ctLen = ciphertext.length;
  const aadPaddedLen = (aadLen + 15) & ~15;
  const ctPaddedLen = (ctLen + 15) & ~15;
  const macInputLen = aadPaddedLen + ctPaddedLen + 16;
  const macInput = new Uint8Array(macInputLen);

  let pos = 0;
  macInput.set(aad, pos);
  pos = aadPaddedLen;
  macInput.set(ciphertext, pos);
  pos = ctPaddedLen;

  store64LE(macInput, pos, BigInt(aadLen));
  pos += 8;
  store64LE(macInput, pos, BigInt(ctLen));

  return poly1305Mac(polyKey, macInput);
}

// AEAD ChaCha20-Poly1305 seal
// RFC 8439 section 2.8
export function aeadSeal(key32, nonce12, plaintext, aad) {
  if (key32.length !== 32) throw new Error('Key must be 32 bytes');
  if (nonce12.length !== 12) throw new Error('Nonce must be 12 bytes');

  const polyKey = poly1305KeyGen(key32, nonce12);
  const ciphertext = chacha20Xor(key32, nonce12, 1, plaintext);
  const tag = computeAeadTag(polyKey, aad, ciphertext);

  const sealed = new Uint8Array(ciphertext.length + 16);
  sealed.set(ciphertext, 0);
  sealed.set(tag, ciphertext.length);

  return sealed;
}

// AEAD ChaCha20-Poly1305 open
// RFC 8439 section 2.8
export function aeadOpen(key32, nonce12, sealed, aad) {
  if (key32.length !== 32) throw new Error('Key must be 32 bytes');
  if (nonce12.length !== 12) throw new Error('Nonce must be 12 bytes');
  if (sealed.length < 16) return null;

  const ciphertext = sealed.slice(0, -16);
  const receivedTag = sealed.slice(-16);

  const polyKey = poly1305KeyGen(key32, nonce12);
  const expectedTag = computeAeadTag(polyKey, aad, ciphertext);

  // Constant-time comparison
  let diff = 0;
  for (let i = 0; i < 16; i++) {
    diff |= receivedTag[i] ^ expectedTag[i];
  }
  const equal = ((diff - 1) >>> 31) ^ 1;

  if (equal) {
    return chacha20Xor(key32, nonce12, 1, ciphertext);
  }
  return null;
}
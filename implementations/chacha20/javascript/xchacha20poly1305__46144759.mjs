// xchacha20poly1305.mjs - XChaCha20-Poly1305 AEAD
// Per draft-irtf-cfrg-xchacha-03

function load32le(buf, off) {
    return buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24);
}

function store32le(buf, off, val) {
    buf[off] = val & 0xff;
    buf[off + 1] = (val >>> 8) & 0xff;
    buf[off + 2] = (val >>> 16) & 0xff;
    buf[off + 3] = (val >>> 24) & 0xff;
}

// Read little-endian bigint from Uint8Array
function leBig(u8, off, len) {
    let v = 0n;
    for (let i = len - 1; i >= 0; i--) v = (v << 8n) | BigInt(u8[off + i]);
    return v;
}

// Write little-endian bigint to Uint8Array
function leBytes(v, len) {
    const o = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        o[i] = Number(v & 0xffn);
        v >>= 8n;
    }
    return o;
}

// ChaCha20 quarter round
function quarterRound(state, a, b, c, d) {
    let sa = state[a], sb = state[b], sc = state[c], sd = state[d];
    
    sa = (sa + sb) >>> 0; sd = sd ^ sa; sd = ((sd << 16) | (sd >>> 16)) >>> 0;
    sc = (sc + sd) >>> 0; sb = sb ^ sc; sb = ((sb << 12) | (sb >>> 20)) >>> 0;
    sa = (sa + sb) >>> 0; sd = sd ^ sa; sd = ((sd << 8) | (sd >>> 24)) >>> 0;
    sc = (sc + sd) >>> 0; sb = sb ^ sc; sb = ((sb << 7) | (sb >>> 25)) >>> 0;
    
    state[a] = sa; state[b] = sb; state[c] = sc; state[d] = sd;
}

// ChaCha20 block function
function chacha20Block(key, nonce, counter, out) {
    const state = new Uint32Array([
        0x61707865, 0x3320646e, 0x79622d32, 0x6b206574,
        load32le(key, 0), load32le(key, 4), load32le(key, 8), load32le(key, 12),
        load32le(key, 16), load32le(key, 20), load32le(key, 24), load32le(key, 28),
        counter, load32le(nonce, 0), load32le(nonce, 4), load32le(nonce, 8)
    ]);
    
    const working = new Uint32Array(state);
    
    for (let i = 0; i < 10; i++) {
        quarterRound(working, 0, 4, 8, 12);
        quarterRound(working, 1, 5, 9, 13);
        quarterRound(working, 2, 6, 10, 14);
        quarterRound(working, 3, 7, 11, 15);
        quarterRound(working, 0, 5, 10, 15);
        quarterRound(working, 1, 6, 11, 12);
        quarterRound(working, 2, 7, 8, 13);
        quarterRound(working, 3, 4, 9, 14);
    }
    
    for (let i = 0; i < 16; i++) {
        working[i] = (working[i] + state[i]) >>> 0;
    }
    
    for (let i = 0; i < 16; i++) {
        store32le(out, i * 4, working[i]);
    }
}

// HChaCha20 per draft-irtf-cfrg-xchacha-03 section 2.2
export function hchacha20(key, nonce) {
    const state = new Uint32Array([
        0x61707865, 0x3320646e, 0x79622d32, 0x6b206574,
        load32le(key, 0), load32le(key, 4), load32le(key, 8), load32le(key, 12),
        load32le(key, 16), load32le(key, 20), load32le(key, 24), load32le(key, 28),
        load32le(nonce, 0), load32le(nonce, 4), load32le(nonce, 8), load32le(nonce, 12)
    ]);
    
    const working = new Uint32Array(state);
    
    for (let i = 0; i < 10; i++) {
        quarterRound(working, 0, 4, 8, 12);
        quarterRound(working, 1, 5, 9, 13);
        quarterRound(working, 2, 6, 10, 14);
        quarterRound(working, 3, 7, 11, 15);
        quarterRound(working, 0, 5, 10, 15);
        quarterRound(working, 1, 6, 11, 12);
        quarterRound(working, 2, 7, 8, 13);
        quarterRound(working, 3, 4, 9, 14);
    }
    
    const out = new Uint8Array(32);
    store32le(out, 0, working[0]);
    store32le(out, 4, working[1]);
    store32le(out, 8, working[2]);
    store32le(out, 12, working[3]);
    store32le(out, 16, working[12]);
    store32le(out, 20, working[13]);
    store32le(out, 24, working[14]);
    store32le(out, 28, working[15]);
    return out;
}

// Reference Poly1305 (BigInt allowed)
function poly1305(key, msg) {
    // key is 32 bytes: r (16 bytes) || s (16 bytes)
    // Load r and clamp
    let r = leBig(key, 0, 16);
    r &= 0x0ffffffc0ffffffc0ffffffc0fffffffn;
    
    // Load s
    const s = leBig(key, 16, 16);
    
    let a = 0n;
    const p = 0x3fffffffffffffffffffffffffffffffbn; // 2^130 - 5
    
    // Process full 16-byte blocks
    let i = 0;
    for (; i + 16 <= msg.length; i += 16) {
        let n = leBig(msg, i, 16);
        n |= 1n << 128n; // Add 2^128
        a = ((a + n) * r) % p;
    }
    
    // Process final partial block
    if (msg.length % 16 !== 0) {
        const remaining = msg.length % 16;
        let n = leBig(msg, i, remaining);
        n |= 1n << BigInt(8 * remaining);
        a = ((a + n) * r) % p;
    }
    
    // Add s
    a = (a + s) % (1n << 128n);
    
    // Serialize to 16 bytes little-endian
    return leBytes(a, 16);
}

// XChaCha20-Poly1305 seal
export function xaeadSeal(key, nonce, plaintext, aad) {
    // Derive subkey using HChaCha20
    const subkey = hchacha20(key, nonce.subarray(0, 16));
    
    // Construct ChaCha20 nonce: 4 zero bytes || nonce[16..24]
    const chachaNonce = new Uint8Array(16);
    chachaNonce.set(nonce.subarray(16, 24), 4);
    
    // Generate Poly1305 key using counter 0
    const polyKeyBlock = new Uint8Array(64);
    chacha20Block(subkey, chachaNonce, 0, polyKeyBlock);
    const polyKey = polyKeyBlock.subarray(0, 32);
    
    // Encrypt plaintext using counters 1, 2, ...
    const ciphertext = new Uint8Array(plaintext.length);
    let counter = 1;
    const keystream = new Uint8Array(64);
    for (let i = 0; i < plaintext.length; ) {
        chacha20Block(subkey, chachaNonce, counter, keystream);
        for (let j = 0; j < 64 && i < plaintext.length; j++, i++) {
            ciphertext[i] = plaintext[i] ^ keystream[j];
        }
        counter++;
    }
    
    // Build MAC input: aad || pad16(aad) || ct || pad16(ct) || le64(aad.length) || le64(ct.length)
    const aadLen = aad.length;
    const ctLen = ciphertext.length;
    const pad16Aad = (16 - (aadLen % 16)) % 16;
    const pad16Ct = (16 - (ctLen % 16)) % 16;
    const macInputLen = aadLen + pad16Aad + ctLen + pad16Ct + 16;
    const macInput = new Uint8Array(macInputLen);
    
    let off = 0;
    macInput.set(aad, off);
    off += aadLen;
    // Padding is already zeros in new Uint8Array
    off += pad16Aad;
    macInput.set(ciphertext, off);
    off += ctLen;
    off += pad16Ct;
    // Lengths as little-endian 64-bit
    const view = new DataView(macInput.buffer, off);
    view.setBigUint64(0, BigInt(aadLen), true);
    view.setBigUint64(8, BigInt(ctLen), true);
    
    const tag = poly1305(polyKey, macInput);
    
    // Return ct || tag
    const result = new Uint8Array(ctLen + 16);
    result.set(ciphertext);
    result.set(tag, ctLen);
    return result;
}

// XChaCha20-Poly1305 open
export function xaeadOpen(key, nonce, sealed, aad) {
    if (sealed.length < 16) return null;
    
    const ctLen = sealed.length - 16;
    const ciphertext = sealed.subarray(0, ctLen);
    const tag = sealed.subarray(ctLen);
    
    // Derive subkey
    const subkey = hchacha20(key, nonce.subarray(0, 16));
    
    // Construct ChaCha20 nonce
    const chachaNonce = new Uint8Array(16);
    chachaNonce.set(nonce.subarray(16, 24), 4);
    
    // Generate Poly1305 key
    const polyKeyBlock = new Uint8Array(64);
    chacha20Block(subkey, chachaNonce, 0, polyKeyBlock);
    const polyKey = polyKeyBlock.subarray(0, 32);
    
    // Build MAC input
    const aadLen = aad.length;
    const pad16Aad = (16 - (aadLen % 16)) % 16;
    const pad16Ct = (16 - (ctLen % 16)) % 16;
    const macInputLen = aadLen + pad16Aad + ctLen + pad16Ct + 16;
    const macInput = new Uint8Array(macInputLen);
    
    let off = 0;
    macInput.set(aad, off);
    off += aadLen;
    off += pad16Aad;
    macInput.set(ciphertext, off);
    off += ctLen;
    off += pad16Ct;
    const view = new DataView(macInput.buffer, off);
    view.setBigUint64(0, BigInt
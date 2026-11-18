// xchacha20poly1305.mjs - XChaCha20-Poly1305 AEAD
// Per draft-irtf-cfrg-xchacha-03
// Pure JavaScript implementation, no dependencies

function load32le(buf, off) {
    return buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24);
}

function store32le(buf, off, val) {
    buf[off] = val & 0xff;
    buf[off + 1] = (val >>> 8) & 0xff;
    buf[off + 2] = (val >>> 16) & 0xff;
    buf[off + 3] = (val >>> 24) & 0xff;
}

// 32x32->64 bit multiplication, returns [hi, lo]
function mul32(a, b) {
    const a00 = a & 0xffff;
    const a16 = a >>> 16;
    const b00 = b & 0xffff;
    const b16 = b >>> 16;
    
    const c00 = a00 * b00;
    const c16 = (c00 >>> 16) + (a00 * b16) + (a16 * b00);
    const c32 = (c16 >>> 16) + (a16 * b16);
    
    return [(c32 >>> 0), ((c16 << 16) | (c00 & 0xffff)) >>> 0];
}

// 64-bit addition of two [hi, lo] pairs
function add64(hi1, lo1, hi2, lo2) {
    const lo = (lo1 + lo2) >>> 0;
    const carry = (lo1 + lo2) > 0xffffffff ? 1 : 0;
    const hi = ((hi1 + hi2 + carry) >>> 0);
    return [hi, lo];
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

// Poly1305 with 5x26-bit limbs per RFC 8439
class Poly1305 {
    constructor(key) {
        this.r = new Uint32Array(5);
        this.h = new Uint32Array(5);
        this.pad = new Uint32Array(4);
        
        const t0 = load32le(key, 0);
        const t1 = load32le(key, 4);
        const t2 = load32le(key, 8);
        const t3 = load32le(key, 12);
        
        this.r[0] = t0 & 0x3ffffff;
        this.r[1] = ((t0 >>> 26) | (t1 << 6)) & 0x3ffff03;
        this.r[2] = ((t1 >>> 20) | (t2 << 12)) & 0x3ffc0ff;
        this.r[3] = ((t2 >>> 14) | (t3 << 18)) & 0x3f03fff;
        this.r[4] = (t3 >>> 8) & 0x00fffff;
        
        this.pad[0] = load32le(key, 16);
        this.pad[1] = load32le(key, 20);
        this.pad[2] = load32le(key, 24);
        this.pad[3] = load32le(key, 28);
        
        this.h[0] = this.h[1] = this.h[2] = this.h[3] = this.h[4] = 0;
        
        this.s = new Uint32Array(5);
        this.s[0] = this.r[0];
        this.s[1] = this.r[1] * 5;
        this.s[2] = this.r[2] * 5;
        this.s[3] = this.r[3] * 5;
        this.s[4] = this.r[4] * 5;
    }
    
    blocks(m, final) {
        const hibit = final ? 0 : (1 << 24);
        const r = this.r;
        const h = this.h;
        const s = this.s;
        
        let i = 0;
        while (i + 16 <= m.length) {
            const t0 = load32le(m, i);
            const t1 = load32le(m, i + 4);
            const t2 = load32le(m, i + 8);
            const t3 = load32le(m, i + 12);
            
            h[0] += t0 & 0x3ffffff;
            h[1] += ((t0 >>> 26) | (t1 << 6)) & 0x3ffffff;
            h[2] += ((t1 >>> 20) | (t2 << 12)) & 0x3ffffff;
            h[3] += ((t2 >>> 14) | (t3 << 18)) & 0x3ffffff;
            h[4] += (t3 >>> 8) | hibit;
            
            // Multiply h by r using 64-bit arithmetic via 32x32->64 mul
            // d0 = h0*r0 + h1*s4 + h2*s3 + h3*s2 + h4*s1
            let d0 = mul32(h[0], r[0]);
            let t = mul32(h[1], s[4]); d0 = add64(d0[0], d0[1], t[0], t[1]);
            t = mul32(h[2], s[3]); d0 = add64(d0[0], d0[1], t[0], t[1]);
            t = mul32(h[3], s[2]); d0 = add64(d0[0], d0[1], t[0], t[1]);
            t = mul32(h[4], s[1]); d0 = add64(d0[0], d0[1], t[0], t[1]);
            
            // d1 = h0*r1 + h1*r0 + h2*s4 + h3*s3 + h4*s2
            let d1 = mul32(h[0], r[1]);
            t = mul32(h[1], r[0]); d1 = add64(d1[0], d1[1], t[0], t[1]);
            t = mul32(h[2], s[4]); d1 = add64(d1[0], d1[1], t[0], t[1]);
            t = mul32(h[3], s[3]); d1 = add64(d1[0], d1[1], t[0], t[1]);
            t = mul32(h[4], s[2]); d1 = add64(d1[0], d1[1], t[0], t[1]);
            
            // d2 = h0*r2 + h1*r1 + h2*r0 + h3*s4 + h4*s3
            let d2 = mul32(h[0], r[2]);
            t = mul32(h[1], r[1]); d2 = add64(d2[0], d2[1], t[0], t[1]);
            t = mul32(h[2], r[0]); d2 = add64(d2[0], d2[1], t[0], t[1]);
            t = mul32(h[3], s[4]); d2 = add64(d2[0], d2[1], t[0], t[1]);
            t = mul32(h[4], s[3]); d2 = add64(d2[0], d2[1], t[0], t[1]);
            
            // d3 = h0*r3 + h1*r2 + h2*r1 + h3*r0 + h4*s4
            let d3 = mul32(h[0], r[3]);
            t = mul32(h[1], r[2]); d3 = add64(d3[0], d3[1], t[0], t[1]);
            t = mul32(h[2], r[1]); d3 = add64(d3[0], d3[1], t[0], t[1]);
            t = mul32(h[3], r[0]); d3 = add64(d3[0], d3[1], t[0], t[1]);
            t = mul32(h[4], s[4]); d3 = add64(d3[0], d3[1], t[0], t[1]);
            
            // d4 = h0*r4 + h1*r3 + h2*r2 + h3*r1 + h4*r0
            let d4 = mul32(h[0], r[4]);
            t = mul32(h[1], r[3]); d4 = add64(d4[0], d4[1], t[0], t[1]);
            t = mul32(h[2], r[2]); d4 = add64(d4[0], d4[1], t[0], t[1]);
            t = mul32(h[3], r[1]); d4 = add64(d4[0], d4[1], t[0], t[1]);
            t = mul32(h[4], r[0]); d4 = add64(d4[0], d4[1], t[0], t[1]);
            
            // Carry propagation using 64-bit values
            const d0_val = (BigInt(d0[0]) << 32n) | BigInt(d0[1]);
            let c = Number(d0_val >> 26n);
            h[0] = Number(d0_val & 0x3ffffffn);
            
            const d1_val = (BigInt(d1[0]) << 32n) | BigInt(d1[1]) | BigInt(c);
            c = Number(d1_val >> 26n);
            h[1] = Number(d1_val & 0x3ffffffn);
            
            const d2_val = (BigInt(d2[0]) << 32n) | BigInt(d2[1]) | BigInt(c);
            c = Number(d2_val >> 26n);
            h[2] = Number(d2_val & 0x3ffffffn);
            
            const d3_val = (BigInt(d3[0]) << 32n) | BigInt(d3[1]) | BigInt(c);
            c = Number(d3_val >> 26n);
            h[3] = Number(d3_val & 0x3ffffffn);
            
            const d4_val = (BigInt(d4[0]) << 32n) | BigInt(d4[1]) | BigInt(c);
            c = Number(d4_val >> 26n);
            h[4] = Number(d4_val & 0x3ffffffn);
            
            h[0] += c * 5;
            c = h[0] >>> 26;
            h[0] &= 0x3ffffff;
            h[1] += c;
            
            i += 16;
        }
    }
    
    finish() {
        let c = this.h[1] >>> 26;
        this.h[1] &= 0x3ffffff;
        this.h[2] += c; c = this.h[2] >>> 26; this.h[2] &= 0x3ffffff;
        this.h[3] += c; c = this.h[3] >>> 26; this.h[3] &= 0x3ffffff;
        this.h[4] += c; c = this.h[4] >>> 26; this.h[4] &= 0x3ffffff;
        this.h[0] += c * 5; c = this.h[0] >>> 26; this.h[0] &= 0x3ffffff;
        this.h[1] += c;
        
        let g0 = this.h[0] + 5;
        c = g0 >>> 26; g0 &= 0x3ffffff;
        let g1 = this.h[1] + c; c = g1 >>> 26; g1 &= 0x3ffffff;
        let g2 = this.h[2] + c; c = g2 >>> 26; g2 &= 0x3ffffff;
        let g3 = this.h[3] + c; c = g3 >>> 26; g3 &= 0x3ffffff;
        let g4 = this.h[4] + c - (1 << 26);
        
        const mask = (g4 >>> 31) - 1;
        this.h[0] = (this.h[0] & ~mask) | (g0 & mask);
        this.h[1] = (this.h[1] & ~mask) | (g1 & mask);
        this.h[2] = (this.h[2] & ~mask) | (g2 & mask);
        this.h[3] = (this.h[3] & ~mask) | (g3 & mask);
        this.h[4] = (this.h[4] & ~mask) | (g4 & mask);
        
        let f0 = (this.h[0] | (this.h[1] << 26)) >>> 0;
        let f1 = ((this.h[1] >>> 6) | (this.h[2] << 20)) >>> 0;
        let f2 = ((this.h[2] >>> 12) | (this.h[3] << 14)) >>> 0;
        let f3 = ((this.h[3] >>> 18) | (this.h[4] << 8)) >>> 0;
        
        f0 = (f0 + this.pad[0]) >>> 0;
        const carry1 = (f0 < this.pad[0]) ? 1 : 0;
        f1 = (f1 + this.pad[1] + carry1) >>> 0;
        const carry2 = (f1 < this.pad[1] || (f1 === this.pad[1] && carry1)) ? 1 : 0;
        f2 = (f2 + this.pad[2] + carry2) >>> 0;
        const carry3 = (f2 < this.pad[2] || (f2 === this.pad[2] && carry2)) ? 1 : 0;
        f3 = (f3 + this.pad[3] + carry3) >>> 0;
        
        const out = new Uint8Array(16);
        store32le(out, 0, f0);
        store32le(out, 4, f1);
        store32le(out, 8, f2);
        store32le(out, 12, f3);
        return out;
    }
}

// XChaCha20-Poly1305 seal
export function xaeadSeal(key, nonce, plaintext, aad) {
    const subkey = hchacha20(key, nonce.subarray(0, 16));
    const chachaNonce = new Uint8Array(16);
    chachaNonce.set(nonce.subarray(16, 24), 4);
    
    const polyKey = new Uint8Array(64);
    chacha20Block(subkey, chachaNonce, 0, polyKey);
    
    const ciphertext = new Uint8Array(plaintext.length);
    let counter = 1;
    const keystream = new Uint8Array(64);
    
    for (let i = 0; i < plaintext.length; ) {
        chacha20Block(subkey, chachaNonce, counter, keystream);
        for (let j = 0; i < plaintext.length && j < 64; i++, j++) {
            ciphertext[i] = plaintext[i] ^ keystream[j];
        }
        counter++;
    }
    
    const poly = new Poly1305(polyKey.subarray(0, 32));
    
    if (aad.length > 0) {
        const aadPaddedLen = (aad.length + 15) & ~15;
        const aadPadded = new Uint8Array(aadPaddedLen);
        aadPadded.set(aad);
        aadPadded[aad.length] = 1;
        poly.blocks(aadPadded, false);
    }
    
    if (ciphertext.length > 0) {
        const ctPaddedLen = (ciphertext.length + 15) & ~15;
        const ctPadded = new Uint8Array(ctPaddedLen);
        ctPadded.set(ciphertext);
        ctPadded[ciphertext.length] = 1;
        poly.blocks(ctPadded, false);
    }
    
    const lenBlock = new Uint8Array(16);
    const aadLen = BigInt(aad.length);
    const ctLen = BigInt(ciphertext.length);
    for (let j = 0; j < 8; j++) {
        lenBlock[j] = Number((aadLen >> BigInt(j * 8)) & 0xffn);
        lenBlock[j + 8] = Number((ctLen >> BigInt(j * 8)) & 0xffn);
    }
    poly.blocks(lenBlock, true);
    
    const tag = poly.finish();
    
    const result = new Uint8Array(ciphertext.length + 16);
    result.set(ciphertext);
    result.set(tag, ciphertext.length);
    return result;
}

// XChaCha20-Poly1305 open
export function xaeadOpen(key, nonce, sealed, aad) {
    if (sealed.length < 16) return null;
    
    const ciphertext = sealed.subarray(0, sealed.length - 16);
    const tag = sealed.subarray(sealed.length - 16);
    
    const subkey = hchacha20(key, nonce.subarray(0, 16));
    const chachaNonce = new Uint8Array(16);
    chachaNonce.set(nonce.subarray(16, 24), 4);
    
    const polyKey = new Uint8Array(64);
    chacha20Block(subkey, chachaNonce, 0, polyKey);
    
    const poly = new Poly1305(polyKey.subarray(0, 32));
    
    if (aad.length > 0) {
        const aadPaddedLen = (aad.length + 15) & ~15;
        const aadPadded = new Uint8Array(aadPaddedLen);
        aadPadded.set(aad);
        aadPadded[aad.length] = 1;
        poly.blocks(aadPadded, false);
    }
    
    if (ciphertext.length > 0) {
        const ctPaddedLen = (ciphertext.length + 15) & ~15;
        const ctPadded = new Uint8Array(ctPaddedLen);
        ctPadded.set(ciphertext);
        ctPadded[ciphertext.length] = 1;
        poly.blocks(ctPadded, false);
    }
    
    const lenBlock = new Uint8Array(16);
    const aadLen = BigInt(aad.length);
    const ctLen = BigInt(ciphertext.length);
    for (let j = 0; j < 8; j++) {
        lenBlock[j] = Number((aadLen >> BigInt(j * 8)) & 0xffn);
        lenBlock[j + 8] = Number((ctLen >> BigInt(j * 8)) & 0xffn);
    }
    poly.blocks(lenBlock, true);
    
    const computedTag = poly.finish();
    
    let diff = 0;
    for (let i = 0; i < 16; i++) {
        diff |= tag[i] ^ computedTag[i];
    }
    if (diff !== 0) return null;
    
    const plaintext = new Uint8Array(ciphertext.length);
    let counter = 1;
    const keystream = new Uint8Array(64);
    
    for (let i = 0; i < ciphertext.length; ) {
        chacha20Block(subkey, chachaNonce, counter, keystream);
        for (let j = 0; i < ciphertext.length && j < 64; i++, j++) {
            plaintext[i] = ciphertext[i] ^ keystream[j];
        }
        counter++;
    }
    
    return plaintext;
}
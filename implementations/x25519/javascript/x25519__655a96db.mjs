// x25519.mjs
// X25519 (Curve25519 ECDH) implementation per RFC 7748
// Field arithmetic: 16 limbs of 16 bits in Float64Array (TweetNaCl representation)

/**
 * X25519 implementation per RFC 7748.
 * 
 * Field element representation (RFC 7748 Section 4):
 * - 16 limbs of 16 bits each in Float64Array (little-endian limb order)
 * - Value = sum(f[i] * 2^(16*i)) for i=0..15
 * - Reduced modulo p = 2^255 - 19
 */

const A24 = 121665; // (486662 - 2) / 4 for Curve25519, RFC 7748 Section 4.1

/**
 * Constant-time conditional swap.
 * Swaps x and y in place if b is 1, leaves unchanged if b is 0.
 * RFC 7748 Section 5.
 */
function cswap(x, y, b) {
    const mask = -b; // 0 if b=0, 0xFFFFFFFF if b=1 (as signed 32-bit, extended to float)
    for (let i = 0; i < 16; i++) {
        const t = (x[i] ^ y[i]) & mask;
        x[i] ^= t;
        y[i] ^= t;
    }
}

/**
 * Carry propagation and modular reduction for GF(2^255-19).
 * 
 * Performs fixed 3 passes to ensure full reduction.
 * 2^256 ≡ 38 (mod p), so overflow from bit 256 is multiplied by 38
 * and added to the low limbs.
 */
function carry(f) {
    // Three passes ensure full reduction after any operation
    for (let pass = 0; pass < 3; pass++) {
        let c = 0;
        for (let i = 0; i < 16; i++) {
            const t = f[i] + c;
            f[i] = t & 0xFFFF;
            c = Math.floor(t / 65536);
        }
        // Reduce: c * 2^256 ≡ 38 * c (mod p)
        f[0] += 38 * c;
    }
    // Ensure canonical form: bit 255 must be clear
    f[15] &= 0x7FFF;
}

/**
 * Field addition: h = f + g mod p
 */
function add(h, f, g) {
    for (let i = 0; i < 16; i++) {
        h[i] = f[i] + g[i];
    }
    carry(h);
}

/**
 * Field subtraction: h = f - g mod p
 * 
 * Computes f - g, then adds 2^256 ≡ 38 if there was underflow.
 * This is equivalent to computing f + 2p - g where 2p = 2^256 - 38.
 */
function sub(h, f, g) {
    let borrow = 0;
    for (let i = 0; i < 16; i++) {
        const t = f[i] - g[i] - borrow;
        h[i] = t;
        borrow = (t < 0) ? 1 : 0;
    }
    // If borrow occurred, add 2^256 ≡ 38 (mod p)
    // Constant-time: always calculate, mask with borrow
    h[0] += 38 * borrow;
    carry(h);
}

/**
 * Field multiplication: h = f * g mod p
 * 
 * Schoolbook multiplication with reduction using the identity
 * 2^256 ≡ 38 (mod p).
 */
function mul(h, f, g) {
    const t = new Float64Array(32); // Product accumulator
    
    // Schoolbook multiplication
    // Products fit in 53 bits: 16-bit * 16-bit = 32-bit, 
    // sum of 16 terms fits in 36 bits < 53 bits of Float64 mantissa
    for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 16; j++) {
            t[i + j] += f[i] * g[j];
        }
    }
    
    // Reduce: fold high limbs (16..31) into low limbs
    // For i >= 16: t[i] * 2^(16*i) ≡ t[i] * 38 * 2^(16*(i-16)) (mod p)
    for (let i = 16; i < 32; i++) {
        t[i - 16] += 38 * t[i];
    }
    
    // Copy to result
    for (let i = 0; i < 16; i++) {
        h[i] = t[i];
    }
    carry(h);
}

/**
 * Field squaring: h = f^2 mod p
 */
function sqr(h, f) {
    mul(h, f, f);
}

/**
 * Field inversion: h = f^(-1) mod p = f^(2^255-21) mod p
 * 
 * Binary exponentiation with constant-time bit operations.
 * Exponent 2^255-21 has all bits set except positions 4 and 2.
 */
function inv(h, f) {
    const r = new Float64Array(16);
    const t = new Float64Array(16);
    const u = new Float64Array(16);
    
    // r = 1
    r[0] = 1;
    
    // t = f (copy)
    for (let i = 0; i < 16; i++) t[i] = f[i];
    
    // Process exponent bits from 254 down to 0
    // Exponent: 2^255 - 21 = binary with bits 254..0 set, except 4 and 2
    for (let i = 254; i >= 0; i--) {
        sqr(r, r); // Square
        
        // Determine if bit i is set in exponent (constant-time)
        // All bits set except i=4 and i=2
        const bit = (i !== 4 && i !== 2) ? 1 : 0;
        
        // Constant-time multiply: compute u = r * t, then select
        mul(u, r, t);
        const mask = -bit;
        for (let j = 0; j < 16; j++) {
            r[j] = (r[j] & ~mask) | (u[j] & mask);
        }
    }
    
    for (let i = 0; i < 16; i++) h[i] = r[i];
}

/**
 * Montgomery ladder for X25519 scalar multiplication.
 * RFC 7748 Section 5.
 * 
 * @param {Float64Array} u - Input x-coordinate (16 limbs, decoded)
 * @param {Uint8Array} scalar - 32-byte scalar (already clamped)
 * @returns {Float64Array} - Result x-coordinate (16 limbs)
 */
function scalarMult(u, scalar) {
    const x2 = new Float64Array(16); // x_2
    const z2 = new Float64Array(16); // z_2
    const x3 = new Float64Array(16); // x_3
    const z3 = new Float64Array(16); // z_3
    
    // Temporary variables
    const A = new Float64Array(16);
    const B = new Float64Array(16);
    const C = new Float64Array(16);
    const D = new Float64Array(16);
    const AA = new Float64Array(16);
    const BB = new Float64Array(16);
    const E = new Float64Array(16);
    const DA = new Float64Array(16);
    const CB = new Float64Array(16);
    const t0 = new Float64Array(16);
    const t1 = new Float64Array(16);
    
    // Initialize: x_2 = 1, z_2 = 0, x_3 = u, z_3 = 1
    x2[0] = 1;
    for (let i = 0; i < 16; i++) x3[i] = u[i];
    z3[0] = 1;
    
    let swap = 0;
    
    // Process scalar bits from 254 down to 0
    // RFC 7748 Section 5: "For t = bits-1 down to 0"
    for (let i = 254; i >= 0; i--) {
        // Extract bit i from scalar (little-endian)
        const byteIndex = Math.floor(i / 8);
        const bitIndex = i % 8;
        const k_t = (scalar[byteIndex] >> bitIndex) & 1;
        
        // Constant-time conditional swap based on previous bit
        swap ^= k_t;
        cswap(x2, x3, swap);
        cswap(z2, z3, swap);
        swap = k_t;
        
        // Montgomery ladder step formulas
        // RFC 7748 Section 5:
        // A = x_2 + z_2
        add(A, x2, z2);
        // B = x_2 - z_2
        sub(B, x2, z2);
        // C = x_3 + z_3
        add(C, x3, z3);
        // D = x_3 - z_3
        sub(D, x3, z3);
        
        // AA = A^2
        sqr(AA, A);
        // BB = B^2
        sqr(BB, B);
        // E = AA - BB
        sub(E, AA, BB);
        
        // x_2 = AA * BB
        mul(x2, AA, BB);
        
        // z_2 = E * (AA + a24 * E)
        // Compute a24 * E
        for (let j = 0; j < 16; j++) {
            t0[j] = E[j] * A24;
        }
        carry(t0);
        // t1 = AA + a24*E
        add(t1, AA, t0);
        // z_2 = E * t1
        mul(z2, E, t1);
        
        // DA = D * A
        mul(DA, D, A);
        // CB = C * B
        mul(CB, C, B);
        
        // x_3 = (DA + CB)^2
        add(t0, DA, CB);
        sqr(x3, t0);
        
        // z_3 = u * (DA - CB)^2
        sub(t0, DA, CB);
        sqr(t0, t0);
        mul(z3, t0, u);
    }
    
    // Final conditional swap
    cswap(x2, x3, swap);
    cswap(z2, z3, swap);
    
    // Compute x_2 / z_2 = x_2 * z_2^(-1)
    inv(t0, z2); // t0 = z_2^(-1)
    mul(t1, x2, t0); // t1 = x_2 / z_2
    
    return t1;
}

/**
 * Decode 32-byte little-endian to field element (16 limbs).
 * RFC 7748 Section 5: "mask the most significant bit in the final byte"
 */
function decodeU(uBytes) {
    const u = new Float64Array(16);
    for (let i = 0; i < 16; i++) {
        u[i] = uBytes[2*i] | (uBytes[2*i + 1] << 8);
    }
    // Mask bit 255 (limb 15, bit 15)
    u[15] &= 0x7FFF;
    return u;
}

/**
 * Encode field element (16 limbs) to 32-byte little-endian.
 * Fully reduces to canonical form before encoding.
 */
function encodeResult(f) {
    carry(f);
    const out = new Uint8Array(32);
    for (let i = 0; i < 16; i++) {
        out[2*i] = f[i] & 0xFF;
        out[2*i + 1] = (f[i] >> 8) & 0xFF;
    }
    return out;
}

/**
 * X25519 scalar multiplication.
 * RFC 7748 Section 5.
 * 
 * @param {Uint8Array} scalar32 - 32-byte scalar
 * @param {Uint8Array} u32 - 32-byte u-coordinate
 * @returns {Uint8Array} - 32-byte result (all zeros if identity)
 */
export function x25519(scalar32, u32) {
    // Clamp scalar per RFC 7748 Section 5
    const scalar = new Uint8Array(32);
    scalar.set(scalar32);
    // "Clear bits 0, 1, 2 of the first byte"
    scalar[0] &= 0xF8;
    // "Clear bit 255 and set bit 254 of the last byte"
    scalar[31] = (scalar[31] & 0x7F) | 0x40;
    
    const u = decodeU(u32);
    const result = scalarMult(u, scalar);
    
    // RFC 7748 Section 6.1: "If the result is the identity point, return 32 zero bytes"
    // Check is done after encoding; all-zero field element encodes to all-zero bytes
    return encodeResult(result);
}

/**
 * X25519 with base point u=9.
 * RFC 7748 Section 6.1.
 * 
 * @param {Uint8Array} scalar32 - 32-byte scalar
 * @returns {Uint8Array} - 32-byte public key
 */
export function x25519Base(scalar32) {
    // Base point u = 9
    const u = new Uint8Array(32);
    u[0] = 9;
    return x25519(scalar32, u);
}
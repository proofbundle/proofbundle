/**
 * X448 Diffie-Hellman (RFC 7748 section 5)
 * Constant-time Montgomery ladder over GF(2^448 - 2^224 - 1)
 * 16 limbs of 28 bits in Float64Array
 */

const LIMB_BITS = 28;
const LIMB_MASK = (1 << LIMB_BITS) - 1; // 0xfffffff
const NUM_LIMBS = 16;

// A24 = (A - 2) / 4 where A = 156326 for Curve448
const A24 = 39081;

// Constant-time conditional swap
function cswap(swap, a, b) {
    const mask = -swap;
    for (let i = 0; i < NUM_LIMBS; i++) {
        const t = mask & ((a[i] | 0) ^ (b[i] | 0));
        a[i] = (a[i] | 0) ^ t;
        b[i] = (b[i] | 0) ^ t;
    }
}

// Convert 56 bytes to 16 limbs of 28 bits (little-endian)
function fe_fromBytes(b) {
    const fe = new Float64Array(NUM_LIMBS);
    let buffer = 0;
    let bufBits = 0;
    let idx = 0;
    
    for (let i = 0; i < 56 && idx < NUM_LIMBS; i++) {
        buffer += b[i] * (2 ** bufBits);
        bufBits += 8;
        
        while (bufBits >= LIMB_BITS && idx < NUM_LIMBS) {
            fe[idx++] = buffer & LIMB_MASK;
            buffer = Math.floor(buffer / (2 ** LIMB_BITS));
            bufBits -= LIMB_BITS;
        }
    }
    
    if (idx < NUM_LIMBS && bufBits > 0) {
        fe[idx] = buffer;
    }
    
    return fe;
}

// Convert 16 limbs to 56 bytes (little-endian)
function fe_toBytes(fe) {
    const b = new Uint8Array(56);
    let buffer = 0;
    let bufBits = 0;
    let idx = 0;
    
    for (let i = 0; i < NUM_LIMBS && idx < 56; i++) {
        buffer += fe[i] * (2 ** bufBits);
        bufBits += LIMB_BITS;
        
        while (bufBits >= 8 && idx < 56) {
            b[idx++] = buffer & 0xff;
            buffer = Math.floor(buffer / 256);
            bufBits -= 8;
        }
    }
    
    while (idx < 56 && bufBits > 0) {
        b[idx++] = buffer & 0xff;
        buffer = Math.floor(buffer / 256);
        bufBits -= 8;
    }
    
    return b;
}

// Carry propagation for field elements
function fe_carry(fe) {
    let carry = 0;
    for (let i = 0; i < NUM_LIMBS; i++) {
        const val = fe[i] + carry;
        fe[i] = val & LIMB_MASK;
        carry = Math.floor(val / (2 ** LIMB_BITS));
    }
    
    // Reduce overflow using 2^448 ≡ 2^224 + 1
    if (carry > 0) {
        fe[0] += carry;
        fe[8] += carry;
    }
    
    // Propagate any new carries
    for (let i = 0; i < NUM_LIMBS; i++) {
        if (fe[i] >= (2 ** LIMB_BITS)) {
            const c = Math.floor(fe[i] / (2 ** LIMB_BITS));
            fe[i] &= LIMB_MASK;
            if (i + 1 < NUM_LIMBS) {
                fe[i + 1] += c;
            } else {
                fe[0] += c;
                fe[8] += c;
            }
        }
    }
}

// Field addition
function fe_add(a, b) {
    const c = new Float64Array(NUM_LIMBS);
    for (let i = 0; i < NUM_LIMBS; i++) {
        c[i] = a[i] + b[i];
    }
    fe_carry(c);
    return c;
}

// Field subtraction
function fe_sub(a, b) {
    const c = new Float64Array(NUM_LIMBS);
    let borrow = 0;
    
    for (let i = 0; i < NUM_LIMBS; i++) {
        let val = a[i] - b[i] - borrow;
        if (val < 0) {
            val += (2 ** LIMB_BITS);
            borrow = 1;
        } else {
            borrow = 0;
        }
        c[i] = val;
    }
    
    // If we borrowed from position 16, add p
    if (borrow) {
        // p = 2^448 - 2^224 - 1
        // In 28-bit limbs: limbs 0-7 are 0xfffffff, limb 8 is 0xffffffe, limbs 9-15 are 0xfffffff
        let addCarry = 0;
        for (let i = 0; i < NUM_LIMBS; i++) {
            let addVal = LIMB_MASK;
            if (i === 8) addVal = LIMB_MASK - 1;
            
            let val = c[i] + addVal + addCarry;
            c[i] = val & LIMB_MASK;
            addCarry = Math.floor(val / (2 ** LIMB_BITS));
        }
    }
    
    return c;
}

// Field multiplication with modular reduction
function fe_mul(a, b) {
    const t = new Float64Array(2 * NUM_LIMBS);
    
    // Schoolbook multiplication
    for (let i = 0; i < NUM_LIMBS; i++) {
        for (let j = 0; j < NUM_LIMBS; j++) {
            t[i + j] += a[i] * b[j];
        }
    }
    
    // Reduce: for i >= 16, fold t[i] into lower limbs
    // t[i] * 2^(28*i) ≡ t[i] * 2^(28*(i-16)) * (2^224 + 1)
    //                 = t[i] at position i-16 + t[i] at position i-8
    
    // Process high limbs first (31 down to 24)
    for (let i = 31; i >= 24; i--) {
        const val = t[i];
        if (val !== 0) {
            t[i - 16] += val;  // Position i-16
            t[i - 8] += val;   // Position i-8
            t[i] = 0;
        }
    }
    
    // Process limbs 23 down to 16
    for (let i = 23; i >= 16; i--) {
        const val = t[i];
        if (val !== 0) {
            t[i - 16] += val;
            t[i - 8] += val;
            t[i] = 0;
        }
    }
    
    // Carry propagate to get final result
    const r = new Float64Array(NUM_LIMBS);
    let carry = 0;
    for (let i = 0; i < NUM_LIMBS; i++) {
        const val = t[i] + carry;
        r[i] = val & LIMB_MASK;
        carry = Math.floor(val / (2 ** LIMB_BITS));
    }
    
    // Handle final overflow
    if (carry > 0) {
        r[0] += carry;
        r[8] += carry;
    }
    
    fe_carry(r);
    return r;
}

// Field squaring
function fe_sqr(a) {
    return fe_mul(a, a);
}

// Field inversion using Fermat's little theorem: a^(p-2) mod p
// p-2 = 2^448 - 2^224 - 3
// Binary: bits 447-225 set, bit 224 clear, bits 223-2 set, bit 1 clear, bit 0 set
function fe_inv(a) {
    // Start with result = 1
    const one = new Float64Array(NUM_LIMBS);
    one[0] = 1;
    let result = one;
    let base = new Float64Array(a);
    
    // Exponentiate by p-2
    for (let i = 447; i >= 0; i--) {
        result = fe_sqr(result);
        
        // Determine bit of (p-2) at position i
        let bit;
        if (i >= 225) bit = 1;
        else if (i === 224) bit = 0;
        else if (i >= 2) bit = 1;
        else if (i === 1) bit = 0;
        else bit = 1;
        
        if (bit) {
            result = fe_mul(result, base);
        }
        
        base = fe_sqr(base);
    }
    
    return result;
}

// Montgomery ladder step (constant time)
function ladder_step(x2, z2, x3, z3, x1, bit) {
    cswap(bit, x2, x3);
    cswap(bit, z2, z3);
    
    const A = fe_add(x2, z2);
    const AA = fe_sqr(A);
    const B = fe_sub(x2, z2);
    const BB = fe_sqr(B);
    const E = fe_sub(AA, BB);
    
    const C = fe_add(x3, z3);
    const D = fe_sub(x3, z3);
    const DA = fe_mul(D, A);
    const CB = fe_mul(C, B);
    
    const DA_plus_CB = fe_add(DA, CB);
    const x3_new = fe_sqr(DA_plus_CB);
    
    const DA_minus_CB = fe_sub(DA, CB);
    const DA_minus_CB_sq = fe_sqr(DA_minus_CB);
    const z3_new = fe_mul(x1, DA_minus_CB_sq);
    
    const x2_new = fe_mul(AA, BB);
    
    // z2_new = E * (AA + A24 * E)
    const A24_E = new Float64Array(NUM_LIMBS);
    for (let i = 0; i < NUM_LIMBS; i++) {
        A24_E[i] = E[i] * A24;
    }
    fe_carry(A24_E);
    
    const AA_plus_A24E = fe_add(AA, A24_E);
    const z2_new = fe_mul(E, AA_plus_A24E);
    
    for (let i = 0; i < NUM_LIMBS; i++) {
        x2[i] = x2_new[i];
        z2[i] = z2_new[i];
        x3[i] = x3_new[i];
        z3[i] = z3_new[i];
    }
    
    cswap(bit, x2, x3);
    cswap(bit, z2, z3);
}

// X448 scalar multiplication
// scalar: 56 bytes
// u: 56 bytes
export function x448(scalar, u) {
    // Decode and clamp scalar per RFC 7748 section 5:
    // - Clear bit 447 (MSB)
    // - Clear bits 0, 1, 2 (three LSB)
    const k = new Uint8Array(scalar);
    k[55] &= 0x7f; // Clear bit 447 (bit 7 of byte 55)
    k[0] &= 0xf8;  // Clear bits 0, 1, 2
    
    const u_fe = fe_fromBytes(u);
    fe_carry(u_fe);
    
    // Initialize ladder state
    const x2 = new Float64Array(NUM_LIMBS);
    x2[0] = 1;  // x2 = 1
    const z2 = new Float64Array(NUM_LIMBS);  // z2 = 0
    const x3 = new Float64Array(u_fe);  // x3 = u
    const z3 = new Float64Array(NUM_LIMBS);
    z3[0] = 1;  // z3 = 1
    
    // Montgomery ladder
    for (let i = 447; i >= 0; i--) {
        const byteIdx = Math.floor(i / 8);
        const bitIdx = i % 8;
        const bit = (k[byteIdx] >> bitIdx) & 1;
        ladder_step(x2, z2, x3, z3, u_fe, bit);
    }
    
    // Compute x2 / z2 = x2 * z2^(-1)
    const z2_inv = fe_inv(z2);
    const result = fe_mul(x2, z2_inv);
    
    return fe_toBytes(result);
}

// X448 base point multiplication (u = 5)
export function x448Base(scalar) {
    const base = new Uint8Array(56);
    base[0] = 5;
    return x448(scalar, base);
}
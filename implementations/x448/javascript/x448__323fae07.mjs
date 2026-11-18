/**
 * X448 Diffie-Hellman (RFC 7748 section 5)
 * REFERENCE implementation using BigInt field arithmetic
 * Field: GF(2^448 - 2^224 - 1)
 */

const P = (1n << 448n) - (1n << 224n) - 1n;
const A24 = 39081n;

function fe_add(a, b) {
    const c = a + b;
    return c >= P ? c - P : c;
}

function fe_sub(a, b) {
    const c = a - b;
    return c < 0n ? c + P : c;
}

function fe_mul(a, b) {
    return (a * b) % P;
}

function fe_sqr(a) {
    return (a * a) % P;
}

// Fermat's little theorem: a^(p-2) mod p
function fe_inv(a) {
    // p - 2 = 2^448 - 2^224 - 3
    // Binary exponentiation
    let result = 1n;
    let base = a;
    const exp = P - 2n;
    
    for (let i = 0n; i < 448n; i++) {
        if ((exp >> i) & 1n) {
            result = (result * base) % P;
        }
        base = (base * base) % P;
    }
    
    return result;
}

// Constant-time conditional swap
function cswap(swap, a, b) {
    const mask = swap ? P - 1n : 0n;
    const t = (a ^ b) & mask;
    return [a ^ t, b ^ t];
}

// Decode 56 little-endian bytes to field element
function fe_fromBytes(b) {
    let x = 0n;
    for (let i = 55; i >= 0; i--) {
        x = (x << 8n) | BigInt(b[i]);
    }
    return x % P;
}

// Encode field element to 56 little-endian bytes
function fe_toBytes(x) {
    const b = new Uint8Array(56);
    let t = x;
    for (let i = 0; i < 56; i++) {
        b[i] = Number(t & 0xffn);
        t >>= 8n;
    }
    return b;
}

// Decode scalar per RFC 7748: clear 2 low bits, set bit 447
function decodeScalar(k) {
    const s = new Uint8Array(k);
    s[0] &= 252;      // Clear bits 0 and 1
    s[55] |= 128;     // Set bit 447 (bit 7 of byte 55)
    return s;
}

// X448 scalar multiplication
export function x448(scalar, u) {
    const k = decodeScalar(scalar);
    
    // Decode u and reduce mod p
    const x1 = fe_fromBytes(u);
    
    // Initialize ladder state
    let x2 = 1n;
    let z2 = 0n;
    let x3 = x1;
    let z3 = 1n;
    
    // Montgomery ladder
    for (let t = 447; t >= 0; t--) {
        const byteIdx = Math.floor(t / 8);
        const bitIdx = t % 8;
        const kt = (k[byteIdx] >> bitIdx) & 1;
        const swap = kt === 1;
        
        [x2, x3] = cswap(swap, x2, x3);
        [z2, z3] = cswap(swap, z2, z3);
        
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
        x3 = fe_sqr(DA_plus_CB);
        const DA_minus_CB = fe_sub(DA, CB);
        const DA_minus_CB_sq = fe_sqr(DA_minus_CB);
        z3 = fe_mul(x1, DA_minus_CB_sq);
        x2 = fe_mul(AA, BB);
        const A24_E = fe_mul(A24, E);
        const AA_plus_A24E = fe_add(AA, A24_E);
        z2 = fe_mul(E, AA_plus_A24E);
        
        [x2, x3] = cswap(swap, x2, x3);
        [z2, z3] = cswap(swap, z2, z3);
    }
    
    // Compute x2 / z2 = x2 * z2^(p-2)
    const z2_inv = fe_inv(z2);
    const result = fe_mul(x2, z2_inv);
    
    return fe_toBytes(result);
}

// X448 with base point u = 5
export function x448Base(scalar) {
    const base = new Uint8Array(56);
    base[0] = 5;
    return x448(scalar, base);
}
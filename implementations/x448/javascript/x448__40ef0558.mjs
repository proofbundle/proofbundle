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

function fe_inv(a) {
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

function cswap(swap, a, b) {
    const mask = swap ? (1n << 448n) - 1n : 0n;
    const t = (a ^ b) & mask;
    return [a ^ t, b ^ t];
}

function fe_fromBytes(b) {
    let x = 0n;
    for (let i = 55; i >= 0; i--) {
        x = (x << 8n) | BigInt(b[i]);
    }
    return x % P;
}

function fe_toBytes(x) {
    const b = new Uint8Array(56);
    let t = x;
    for (let i = 0; i < 56; i++) {
        b[i] = Number(t & 0xffn);
        t >>= 8n;
    }
    return b;
}

function decodeScalar(k) {
    const s = new Uint8Array(k);
    s[0] &= 252;
    s[55] |= 128;
    return s;
}

export function x448(scalar, u) {
    const k = decodeScalar(scalar);
    const x1 = fe_fromBytes(u);
    
    let x2 = 1n;
    let z2 = 0n;
    let x3 = x1;
    let z3 = 1n;
    
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
    
    const z2_inv = fe_inv(z2);
    const result = fe_mul(x2, z2_inv);
    
    return fe_toBytes(result);
}

export function x448Base(scalar) {
    const base = new Uint8Array(56);
    base[0] = 5;
    return x448(scalar, base);
}
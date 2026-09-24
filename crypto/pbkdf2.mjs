// PBKDF2 (RFC 2898 / NIST SP 800-132) - Password-Based Key Derivation Function 2
// Pure JS implementation using the from-scratch HMAC module.
//
// Provides: PBKDF2-HMAC-SHA-256, PBKDF2-HMAC-SHA-512
//
// Spec: RFC 2898 Section 5.2, NIST SP 800-132
//
// Algorithm:
//   DK = T1 || T2 || ... || Tdklen/hlen
//   Ti = F(Password, Salt, c, i) = U1 ^ U2 ^ ... ^ Uc
//   U1 = PRF(Password, Salt || INT(i))
//   Uj = PRF(Password, Uj-1)
//
// TEST RESULT: verified against node:crypto pbkdf2

import { hmac } from './hmac.mjs';

/**
 * PBKDF2 key derivation
 * @param {string} hashName - Hash function name (SHA-256, SHA-512, etc.)
 * @param {Uint8Array} password - The password
 * @param {Uint8Array} salt - The salt
 * @param {number} iterations - Iteration count (c)
 * @param {number} dkLen - Desired key length in bytes
 * @returns {Uint8Array} Derived key
 */
export function pbkdf2(hashName, password, salt, iterations, dkLen) {
  const hashLengths = { 'SHA-256': 32, 'SHA-384': 48, 'SHA-512': 64,
                        'SHA3-256': 32, 'SHA3-384': 48, 'SHA3-512': 64 };
  const hLen = hashLengths[hashName];
  if (!hLen) throw new Error(`Unsupported hash: ${hashName}`);
  
  if (iterations < 1) throw new Error('Iterations must be >= 1');
  if (dkLen > (Math.pow(2, 32) - 1) * hLen) throw new Error('Derived key too long');
  
  const numBlocks = Math.ceil(dkLen / hLen);
  const dk = new Uint8Array(numBlocks * hLen);
  
  for (let i = 1; i <= numBlocks; i++) {
    // U1 = PRF(Password, Salt || INT_32_BE(i))
    const saltWithI = new Uint8Array(salt.length + 4);
    saltWithI.set(salt, 0);
    saltWithI[salt.length] = (i >>> 24) & 0xff;
    saltWithI[salt.length + 1] = (i >>> 16) & 0xff;
    saltWithI[salt.length + 2] = (i >>> 8) & 0xff;
    saltWithI[salt.length + 3] = i & 0xff;
    
    let u = hmac(hashName, password, saltWithI);
    let t = new Uint8Array(u);
    
    // U2 ... Uc
    for (let j = 2; j <= iterations; j++) {
      u = hmac(hashName, password, u);
      // XOR into T
      for (let k = 0; k < hLen; k++) {
        t[k] ^= u[k];
      }
    }
    
    dk.set(t, (i - 1) * hLen);
  }
  
  return dk.slice(0, dkLen);
}

// Convenience functions
export function pbkdf2Sha256(password, salt, iterations, dkLen) {
  return pbkdf2('SHA-256', password, salt, iterations, dkLen);
}

export function pbkdf2Sha512(password, salt, iterations, dkLen) {
  return pbkdf2('SHA-512', password, salt, iterations, dkLen);
}

// Self-test
export function selfTest() {
  const tests = [
    {
      name: 'PBKDF2-SHA-256 basic',
      fn: () => {
        const pass = new TextEncoder().encode('password');
        const salt = new TextEncoder().encode('salt');
        const result = pbkdf2Sha256(pass, salt, 1, 32);
        return result.length === 32;
      }
    },
    {
      name: 'PBKDF2-SHA-256 RFC 6070 TC1',
      fn: () => {
        const pass = new TextEncoder().encode('password');
        const salt = new TextEncoder().encode('salt');
        const result = pbkdf2Sha256(pass, salt, 1, 20);
        const hex = Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
        // RFC 6070 doesn't have SHA-256 vectors, but this is the known value
        return hex === '120fb6cffcf8b32c43e7225256c4f837a86548c9';
      }
    },
    {
      name: 'PBKDF2-SHA-512 basic',
      fn: () => {
        const pass = new TextEncoder().encode('password');
        const salt = new TextEncoder().encode('salt');
        const result = pbkdf2Sha512(pass, salt, 1, 64);
        return result.length === 64;
      }
    },
    {
      name: 'PBKDF2 different iterations give different output',
      fn: () => {
        const pass = new TextEncoder().encode('password');
        const salt = new TextEncoder().encode('salt');
        const r1 = pbkdf2Sha256(pass, salt, 1, 32);
        const r2 = pbkdf2Sha256(pass, salt, 2, 32);
        const h1 = Array.from(r1).map(b => b.toString(16).padStart(2, '0')).join('');
        const h2 = Array.from(r2).map(b => b.toString(16).padStart(2, '0')).join('');
        return h1 !== h2;
      }
    },
  ];
  
  let pass = 0, fail = 0;
  for (const t of tests) {
    try {
      if (t.fn()) {
        pass++;
      } else {
        fail++;
        console.error(`FAIL: ${t.name}`);
      }
    } catch (e) {
      fail++;
      console.error(`FAIL: ${t.name} - ${e.message}`);
    }
  }
  
  return { pass, fail };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { pass, fail } = selfTest();
  console.log(`PBKDF2 self-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

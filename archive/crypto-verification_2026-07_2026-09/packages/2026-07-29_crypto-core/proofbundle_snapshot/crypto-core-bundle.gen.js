// ===========================================================================
// PB_HOMEGROWN — from-scratch crypto core, bundled for the browser.
// Source: crypto-core/*.mjs — no cryptographic library dependency in any
// implementation file there. This bundle mechanically inlines those files
// (import/export stripped, Buffer replaced with a manual hex encoder) so
// they run as plain browser JS with no bundler and no module loader.
// Committed source of truth remains crypto-core/*.mjs — this block is
// generated from it, not hand-edited.
// ===========================================================================
var PB_HOMEGROWN = (function() {
  var exportsMap = {};
  // ---- keccak.mjs ----
  var mod_keccak = (function() {
    // From-scratch Keccak-f[1600] and the FIPS 202 sponge functions.
    // Pure JS, no external crypto library, no WebCrypto, no noble-*.
    //
    // Provides: SHA3-256, SHA3-384, SHA3-512, SHAKE128, SHAKE256.
    // ML-KEM (FIPS 203) requires SHAKE128, SHAKE256, SHA3-256 and SHA3-512
    // internally, so this module is a prerequisite for building that from scratch.
    //
    // Spec: FIPS 202 (SHA-3 Standard: Permutation-Based Hash and Extendable-Output
    // Functions), sections 3.2 (step mappings), 5.1 (padding), 6.1/6.2 (SHA-3, SHAKE).
    
    const MASK64 = (1n << 64n) - 1n;
    
    // Round constants RC[i] for the iota step (FIPS 202 section 3.2.5).
    const RC = [
      0x0000000000000001n, 0x0000000000008082n, 0x800000000000808An, 0x8000000080008000n,
      0x000000000000808Bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
      0x000000000000008An, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000An,
      0x000000008000808Bn, 0x800000000000008Bn, 0x8000000000008089n, 0x8000000000008003n,
      0x8000000000008002n, 0x8000000000000080n, 0x000000000000800An, 0x800000008000000An,
      0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
    ];
    
    // Rotation offsets for rho, flattened as index = x + 5*y (FIPS 202 section 3.2.2).
    const ROT = [
       0,  1, 62, 28, 27,
      36, 44,  6, 55, 20,
       3, 10, 43, 25, 39,
      41, 45, 15, 21,  8,
      18,  2, 61, 56, 14,
    ];
    
    function rotl64(x, n) {
      if (n === 0) return x;
      const b = BigInt(n);
      return ((x << b) | (x >> (64n - b))) & MASK64;
    }
    
    // The Keccak-f[1600] permutation: 24 rounds of theta, rho, pi, chi, iota.
    // Operates in place on a 25-lane state (each lane a 64-bit BigInt).
    function keccakF1600(A) {
      const C = new Array(5);
      const D = new Array(5);
      const B = new Array(25);
    
      for (let round = 0; round < 24; round++) {
        // theta
        for (let x = 0; x < 5; x++) {
          C[x] = A[x] ^ A[x + 5] ^ A[x + 10] ^ A[x + 15] ^ A[x + 20];
        }
        for (let x = 0; x < 5; x++) {
          D[x] = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1);
        }
        for (let y = 0; y < 5; y++) {
          for (let x = 0; x < 5; x++) A[x + 5 * y] ^= D[x];
        }
    
        // rho (rotate each lane) and pi (permute lane positions), combined
        for (let y = 0; y < 5; y++) {
          for (let x = 0; x < 5; x++) {
            B[y + 5 * ((2 * x + 3 * y) % 5)] = rotl64(A[x + 5 * y], ROT[x + 5 * y]);
          }
        }
    
        // chi
        for (let y = 0; y < 5; y++) {
          for (let x = 0; x < 5; x++) {
            A[x + 5 * y] = B[x + 5 * y] ^
              ((~B[((x + 1) % 5) + 5 * y] & MASK64) & B[((x + 2) % 5) + 5 * y]);
          }
        }
    
        // iota
        A[0] ^= RC[round];
      }
      return A;
    }
    
    // Sponge construction (FIPS 202 section 4) with multi-rate padding (section 5.1).
    //   rateBytes - block size in bytes (1600 bits minus capacity, over 8)
    //   suffix    - domain separation byte: 0x06 for SHA-3, 0x1F for SHAKE
    //   outLen    - requested output length in bytes
    function sponge(rateBytes, suffix, msg, outLen) {
      if (typeof msg === 'string') msg = new TextEncoder().encode(msg);
    
      const A = new Array(25).fill(0n);
    
      // pad10*1 with domain suffix: suffix byte, zeros, then high bit of final byte
      const padLen = rateBytes - (msg.length % rateBytes);
      const padded = new Uint8Array(msg.length + padLen);
      padded.set(msg);
      padded[msg.length] = suffix;
      padded[padded.length - 1] |= 0x80;
    
      // absorb: XOR each rate-sized block into the state as little-endian lanes
      const lanesPerBlock = rateBytes / 8;
      for (let off = 0; off < padded.length; off += rateBytes) {
        for (let i = 0; i < lanesPerBlock; i++) {
          let lane = 0n;
          for (let b = 7; b >= 0; b--) {
            lane = (lane << 8n) | BigInt(padded[off + i * 8 + b]);
          }
          A[i] ^= lane;
        }
        keccakF1600(A);
      }
    
      // squeeze
      const out = new Uint8Array(outLen);
      let produced = 0;
      while (produced < outLen) {
        for (let i = 0; i < lanesPerBlock && produced < outLen; i++) {
          const lane = A[i];
          for (let b = 0; b < 8 && produced < outLen; b++) {
            out[produced++] = Number((lane >> BigInt(8 * b)) & 0xFFn);
          }
        }
        if (produced < outLen) keccakF1600(A);
      }
      return out;
    }
    
    // Rate = (1600 - 2*outputBits) / 8 for SHA-3; SHAKE uses its security level.
    function sha3_256(msg) { return sponge(136, 0x06, msg, 32); }
    function sha3_384(msg) { return sponge(104, 0x06, msg, 48); }
    function sha3_512(msg) { return sponge(72,  0x06, msg, 64); }
    function shake128(msg, outLen) { return sponge(168, 0x1F, msg, outLen); }
    function shake256(msg, outLen) { return sponge(136, 0x1F, msg, outLen); }
    
    function toHex(bytes) {
      let s = '';
      for (const b of bytes) s += b.toString(16).padStart(2, '0');
      return s;
    }
    
    return { keccakF1600: keccakF1600, sha3_256: sha3_256, sha3_384: sha3_384, sha3_512: sha3_512, shake128: shake128, shake256: shake256, toHex: toHex };
  })();
  exportsMap["keccakF1600"] = mod_keccak.keccakF1600;
  exportsMap["sha3_256"] = mod_keccak.sha3_256;
  exportsMap["sha3_384"] = mod_keccak.sha3_384;
  exportsMap["sha3_512"] = mod_keccak.sha3_512;
  exportsMap["shake128"] = mod_keccak.shake128;
  exportsMap["shake256"] = mod_keccak.shake256;
  exportsMap["toHex"] = mod_keccak.toHex;
  // ---- sha256.mjs ----
  var mod_sha256 = (function() {
    // From-scratch SHA-256 (FIPS 180-4 section 6.2), no external crypto library.
    // Pure JS, 32-bit lane arithmetic via >>> 0 / Math.imul, no WebCrypto, no noble-*.
    
    const K = new Uint32Array([
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
    ]);
    
    const H0 = Uint32Array.from([
      0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19,
    ]);
    
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    
    function pad(msg) {
      const l = msg.length;
      const bitLenHi = Math.floor(l / 0x20000000) >>> 0;
      const bitLenLo = (l * 8) >>> 0;
      const withOne = l + 1;
      const k = ((448 - (withOne * 8) % 512) + 512) % 512;
      const totalBytes = withOne + k / 8 + 8;
      const out = new Uint8Array(totalBytes);
      out.set(msg);
      out[l] = 0x80;
      const dv = new DataView(out.buffer);
      dv.setUint32(totalBytes - 8, bitLenHi, false);
      dv.setUint32(totalBytes - 4, bitLenLo >>> 0, false);
      return out;
    }
    
    function sha256(msg) {
      if (typeof msg === 'string') msg = new TextEncoder().encode(msg);
      const padded = pad(msg);
      const H = H0.slice();
      const W = new Uint32Array(64);
      const dv = new DataView(padded.buffer);
    
      for (let chunk = 0; chunk < padded.length; chunk += 64) {
        for (let t = 0; t < 16; t++) W[t] = dv.getUint32(chunk + t * 4, false);
        for (let t = 16; t < 64; t++) {
          const s0 = rotr(W[t-15], 7) ^ rotr(W[t-15], 18) ^ (W[t-15] >>> 3);
          const s1 = rotr(W[t-2], 17) ^ rotr(W[t-2], 19) ^ (W[t-2] >>> 10);
          W[t] = (W[t-16] + s0 + W[t-7] + s1) >>> 0;
        }
    
        let [a,b,c,d,e,f,g,h] = H;
        for (let t = 0; t < 64; t++) {
          const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
          const ch = (e & f) ^ ((~e) & g);
          const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
          const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
          const maj = (a & b) ^ (a & c) ^ (b & c);
          const temp2 = (S0 + maj) >>> 0;
          h = g; g = f; f = e; e = (d + temp1) >>> 0;
          d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
        }
        H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
        H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
      }
    
      const out = new Uint8Array(32);
      const outDv = new DataView(out.buffer);
      for (let i = 0; i < 8; i++) outDv.setUint32(i * 4, H[i], false);
      return out;
    }
    
    function sha256Hex(msgOrBytes) {
      return Buffer.from(sha256(msgOrBytes)).toString('hex');
    }
    
    return { sha256: sha256, sha256Hex: sha256Hex };
  })();
  exportsMap["sha256"] = mod_sha256.sha256;
  exportsMap["sha256Hex"] = mod_sha256.sha256Hex;
  // ---- sha512.mjs ----
  var mod_sha512 = (function() {
    // From-scratch SHA-512 and SHA-384 (FIPS 180-4 sections 4.2.3, 5.3.4, 5.3.5,
    // 6.4, 6.5), no external crypto library.
    // Pure JS, 64-bit lane arithmetic via BigInt with a 64-bit mask -- the same
    // technique crypto-core/keccak.mjs uses for Keccak-f[1600]'s 64-bit lanes.
    // No WebCrypto, no noble-*, no node:crypto (that's for the *.test.mjs files
    // only, as an independent yardstick).
    //
    // SHA-384 is identical to SHA-512 except for its initial hash values (FIPS
    // 180-4 5.3.4 vs 5.3.5) and truncating the 512-bit result to the first 384
    // bits (48 bytes) -- see FIPS 180-4 section 6.5.
    
    const MASK64 = (1n << 64n) - 1n;
    
    // K[0..79]: first 64 bits of the fractional parts of the cube roots of the
    // first eighty prime numbers (FIPS 180-4 section 4.2.3). Derived from first
    // principles with exact BigInt arithmetic (not transcribed) and cross-checked
    // structurally against crypto-core/sha256.mjs's K table: the high 32 bits of
    // each of the first 64 of these words equals the corresponding SHA-256 K
    // word, since both are truncations of the same cube-root expansion.
    const K = [
      0x428a2f98d728ae22n,0x7137449123ef65cdn,0xb5c0fbcfec4d3b2fn,0xe9b5dba58189dbbcn,
      0x3956c25bf348b538n,0x59f111f1b605d019n,0x923f82a4af194f9bn,0xab1c5ed5da6d8118n,
      0xd807aa98a3030242n,0x12835b0145706fben,0x243185be4ee4b28cn,0x550c7dc3d5ffb4e2n,
      0x72be5d74f27b896fn,0x80deb1fe3b1696b1n,0x9bdc06a725c71235n,0xc19bf174cf692694n,
      0xe49b69c19ef14ad2n,0xefbe4786384f25e3n,0x0fc19dc68b8cd5b5n,0x240ca1cc77ac9c65n,
      0x2de92c6f592b0275n,0x4a7484aa6ea6e483n,0x5cb0a9dcbd41fbd4n,0x76f988da831153b5n,
      0x983e5152ee66dfabn,0xa831c66d2db43210n,0xb00327c898fb213fn,0xbf597fc7beef0ee4n,
      0xc6e00bf33da88fc2n,0xd5a79147930aa725n,0x06ca6351e003826fn,0x142929670a0e6e70n,
      0x27b70a8546d22ffcn,0x2e1b21385c26c926n,0x4d2c6dfc5ac42aedn,0x53380d139d95b3dfn,
      0x650a73548baf63den,0x766a0abb3c77b2a8n,0x81c2c92e47edaee6n,0x92722c851482353bn,
      0xa2bfe8a14cf10364n,0xa81a664bbc423001n,0xc24b8b70d0f89791n,0xc76c51a30654be30n,
      0xd192e819d6ef5218n,0xd69906245565a910n,0xf40e35855771202an,0x106aa07032bbd1b8n,
      0x19a4c116b8d2d0c8n,0x1e376c085141ab53n,0x2748774cdf8eeb99n,0x34b0bcb5e19b48a8n,
      0x391c0cb3c5c95a63n,0x4ed8aa4ae3418acbn,0x5b9cca4f7763e373n,0x682e6ff3d6b2b8a3n,
      0x748f82ee5defb2fcn,0x78a5636f43172f60n,0x84c87814a1f0ab72n,0x8cc702081a6439ecn,
      0x90befffa23631e28n,0xa4506cebde82bde9n,0xbef9a3f7b2c67915n,0xc67178f2e372532bn,
      0xca273eceea26619cn,0xd186b8c721c0c207n,0xeada7dd6cde0eb1en,0xf57d4f7fee6ed178n,
      0x06f067aa72176fban,0x0a637dc5a2c898a6n,0x113f9804bef90daen,0x1b710b35131c471bn,
      0x28db77f523047d84n,0x32caab7b40c72493n,0x3c9ebe0a15c9bebcn,0x431d67c49c100d4cn,
      0x4cc5d4becb3e42b6n,0x597f299cfc657e2an,0x5fcb6fab3ad6faecn,0x6c44198c4a475817n,
    ];
    
    // SHA-512 initial hash values: first 64 bits of the fractional parts of the
    // square roots of the 1st through 8th primes (FIPS 180-4 section 5.3.4).
    // These are also, not coincidentally, BLAKE2b's IV (RFC 7693 section 2.6).
    const H0_512 = [
      0x6a09e667f3bcc908n,0xbb67ae8584caa73bn,0x3c6ef372fe94f82bn,0xa54ff53a5f1d36f1n,
      0x510e527fade682d1n,0x9b05688c2b3e6c1fn,0x1f83d9abfb41bd6bn,0x5be0cd19137e2179n,
    ];
    
    // SHA-384 initial hash values: first 64 bits of the fractional parts of the
    // square roots of the 9th through 16th primes (FIPS 180-4 section 5.3.5).
    const H0_384 = [
      0xcbbb9d5dc1059ed8n,0x629a292a367cd507n,0x9159015a3070dd17n,0x152fecd8f70e5939n,
      0x67332667ffc00b31n,0x8eb44a8768581511n,0xdb0c2e0d64f98fa7n,0x47b5481dbefa4fa4n,
    ];
    
    function rotr(x, n) {
      const bn = BigInt(n);
      return ((x >> bn) | (x << (64n - bn))) & MASK64;
    }
    function shr(x, n) { return x >> BigInt(n); }
    
    // Pad to a multiple of 128 bytes: a 0x80 byte, zeros until length is 112 mod
    // 128 bytes, then the original bit length as a 128-bit big-endian integer
    // (FIPS 180-4 section 5.1.2).
    function pad(msg) {
      const l = msg.length;
      const withOne = l + 1;
      const k = ((112 - (withOne % 128)) + 128) % 128;
      const totalBytes = withOne + k + 16;
      const out = new Uint8Array(totalBytes);
      out.set(msg);
      out[l] = 0x80;
      const bitLen = BigInt(l) * 8n;
      const dv = new DataView(out.buffer);
      dv.setBigUint64(totalBytes - 16, (bitLen >> 64n) & MASK64, false);
      dv.setBigUint64(totalBytes - 8, bitLen & MASK64, false);
      return out;
    }
    
    // Shared compression loop for SHA-512 and SHA-384 (FIPS 180-4 section 6.4.2);
    // the two differ only in H0 and in how many of the 8 output words are kept.
    function hashCore(msg, H0, outWords) {
      if (typeof msg === 'string') msg = new TextEncoder().encode(msg);
      const padded = pad(msg);
      const H = H0.slice();
      const W = new Array(80);
      const dv = new DataView(padded.buffer);
    
      for (let chunk = 0; chunk < padded.length; chunk += 128) {
        for (let t = 0; t < 16; t++) W[t] = dv.getBigUint64(chunk + t * 8, false);
        for (let t = 16; t < 80; t++) {
          const s0 = rotr(W[t - 15], 1) ^ rotr(W[t - 15], 8) ^ shr(W[t - 15], 7);
          const s1 = rotr(W[t - 2], 19) ^ rotr(W[t - 2], 61) ^ shr(W[t - 2], 6);
          W[t] = (W[t - 16] + s0 + W[t - 7] + s1) & MASK64;
        }
    
        let [a, b, c, d, e, f, g, h] = H;
        for (let t = 0; t < 80; t++) {
          const S1 = rotr(e, 14) ^ rotr(e, 18) ^ rotr(e, 41);
          const ch = (e & f) ^ ((~e & MASK64) & g);
          const temp1 = (h + S1 + ch + K[t] + W[t]) & MASK64;
          const S0 = rotr(a, 28) ^ rotr(a, 34) ^ rotr(a, 39);
          const maj = (a & b) ^ (a & c) ^ (b & c);
          const temp2 = (S0 + maj) & MASK64;
          h = g; g = f; f = e; e = (d + temp1) & MASK64;
          d = c; c = b; b = a; a = (temp1 + temp2) & MASK64;
        }
        H[0] = (H[0] + a) & MASK64; H[1] = (H[1] + b) & MASK64;
        H[2] = (H[2] + c) & MASK64; H[3] = (H[3] + d) & MASK64;
        H[4] = (H[4] + e) & MASK64; H[5] = (H[5] + f) & MASK64;
        H[6] = (H[6] + g) & MASK64; H[7] = (H[7] + h) & MASK64;
      }
    
      const out = new Uint8Array(outWords * 8);
      const outDv = new DataView(out.buffer);
      for (let i = 0; i < outWords; i++) outDv.setBigUint64(i * 8, H[i], false);
      return out;
    }
    
    function sha512(msg) { return hashCore(msg, H0_512, 8); }
    function sha384(msg) { return hashCore(msg, H0_384, 6); }
    
    function sha512Hex(msgOrBytes) {
      return Buffer.from(sha512(msgOrBytes)).toString('hex');
    }
    function sha384Hex(msgOrBytes) {
      return Buffer.from(sha384(msgOrBytes)).toString('hex');
    }
    
    return { sha512: sha512, sha384: sha384, sha512Hex: sha512Hex, sha384Hex: sha384Hex };
  })();
  exportsMap["sha512"] = mod_sha512.sha512;
  exportsMap["sha384"] = mod_sha512.sha384;
  exportsMap["sha512Hex"] = mod_sha512.sha512Hex;
  exportsMap["sha384Hex"] = mod_sha512.sha384Hex;
  // ---- ed25519.mjs ----
  var mod_ed25519 = (function() {
    // From-scratch Ed25519 (RFC 8032) — EdDSA over edwards25519.
    // Pure JS with BigInt field arithmetic. No external crypto library,
    // no WebCrypto, no node:crypto. SHA-512 is implemented inline here rather
    // than imported, so this module has no dependency outside the language.
    //
    // This is the signature scheme ProofBundle seals every bundle with, so it is
    // the most load-bearing primitive in the core.
    //
    // Spec: RFC 8032 section 5.1 (Ed25519).
    
    // ---------------------------------------------------------------------------
    // SHA-512 (FIPS 180-4), 64-bit words via BigInt
    // ---------------------------------------------------------------------------
    
    const M64 = (1n << 64n) - 1n;
    
    const K512 = [
      0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbbcn,
      0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
      0xd807aa98a3030242n, 0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
      0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n, 0xc19bf174cf692694n,
      0xe49b69c19ef14ad2n, 0xefbe4786384f25e3n, 0x0fc19dc68b8cd5b5n, 0x240ca1cc77ac9c65n,
      0x2de92c6f592b0275n, 0x4a7484aa6ea6e483n, 0x5cb0a9dcbd41fbd4n, 0x76f988da831153b5n,
      0x983e5152ee66dfabn, 0xa831c66d2db43210n, 0xb00327c898fb213fn, 0xbf597fc7beef0ee4n,
      0xc6e00bf33da88fc2n, 0xd5a79147930aa725n, 0x06ca6351e003826fn, 0x142929670a0e6e70n,
      0x27b70a8546d22ffcn, 0x2e1b21385c26c926n, 0x4d2c6dfc5ac42aedn, 0x53380d139d95b3dfn,
      0x650a73548baf63den, 0x766a0abb3c77b2a8n, 0x81c2c92e47edaee6n, 0x92722c851482353bn,
      0xa2bfe8a14cf10364n, 0xa81a664bbc423001n, 0xc24b8b70d0f89791n, 0xc76c51a30654be30n,
      0xd192e819d6ef5218n, 0xd69906245565a910n, 0xf40e35855771202an, 0x106aa07032bbd1b8n,
      0x19a4c116b8d2d0c8n, 0x1e376c085141ab53n, 0x2748774cdf8eeb99n, 0x34b0bcb5e19b48a8n,
      0x391c0cb3c5c95a63n, 0x4ed8aa4ae3418acbn, 0x5b9cca4f7763e373n, 0x682e6ff3d6b2b8a3n,
      0x748f82ee5defb2fcn, 0x78a5636f43172f60n, 0x84c87814a1f0ab72n, 0x8cc702081a6439ecn,
      0x90befffa23631e28n, 0xa4506cebde82bde9n, 0xbef9a3f7b2c67915n, 0xc67178f2e372532bn,
      0xca273eceea26619cn, 0xd186b8c721c0c207n, 0xeada7dd6cde0eb1en, 0xf57d4f7fee6ed178n,
      0x06f067aa72176fban, 0x0a637dc5a2c898a6n, 0x113f9804bef90daen, 0x1b710b35131c471bn,
      0x28db77f523047d84n, 0x32caab7b40c72493n, 0x3c9ebe0a15c9bebcn, 0x431d67c49c100d4cn,
      0x4cc5d4becb3e42b6n, 0x597f299cfc657e2an, 0x5fcb6fab3ad6faecn, 0x6c44198c4a475817n,
    ];
    
    const H512 = [
      0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
      0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
    ];
    
    const rotr64 = (x, n) => ((x >> BigInt(n)) | (x << BigInt(64 - n))) & M64;
    const shr64 = (x, n) => x >> BigInt(n);
    
    function sha512(msg) {
      if (typeof msg === 'string') msg = new TextEncoder().encode(msg);
    
      // pad: 0x80, zeros, then 128-bit big-endian bit length
      const l = msg.length;
      const k = ((112 - (l + 1) % 128) + 128) % 128;
      const padded = new Uint8Array(l + 1 + k + 16);
      padded.set(msg);
      padded[l] = 0x80;
      const bitLen = BigInt(l) * 8n;
      for (let i = 0; i < 16; i++) {
        padded[padded.length - 1 - i] = Number((bitLen >> BigInt(8 * i)) & 0xffn);
      }
    
      const H = H512.slice();
      const W = new Array(80);
    
      for (let off = 0; off < padded.length; off += 128) {
        for (let t = 0; t < 16; t++) {
          let w = 0n;
          for (let b = 0; b < 8; b++) w = (w << 8n) | BigInt(padded[off + t * 8 + b]);
          W[t] = w;
        }
        for (let t = 16; t < 80; t++) {
          const s0 = rotr64(W[t - 15], 1) ^ rotr64(W[t - 15], 8) ^ shr64(W[t - 15], 7);
          const s1 = rotr64(W[t - 2], 19) ^ rotr64(W[t - 2], 61) ^ shr64(W[t - 2], 6);
          W[t] = (W[t - 16] + s0 + W[t - 7] + s1) & M64;
        }
    
        let [a, b, c, d, e, f, g, h] = H;
        for (let t = 0; t < 80; t++) {
          const S1 = rotr64(e, 14) ^ rotr64(e, 18) ^ rotr64(e, 41);
          const ch = (e & f) ^ ((~e & M64) & g);
          const t1 = (h + S1 + ch + K512[t] + W[t]) & M64;
          const S0 = rotr64(a, 28) ^ rotr64(a, 34) ^ rotr64(a, 39);
          const maj = (a & b) ^ (a & c) ^ (b & c);
          const t2 = (S0 + maj) & M64;
          h = g; g = f; f = e; e = (d + t1) & M64;
          d = c; c = b; b = a; a = (t1 + t2) & M64;
        }
        H[0] = (H[0] + a) & M64; H[1] = (H[1] + b) & M64;
        H[2] = (H[2] + c) & M64; H[3] = (H[3] + d) & M64;
        H[4] = (H[4] + e) & M64; H[5] = (H[5] + f) & M64;
        H[6] = (H[6] + g) & M64; H[7] = (H[7] + h) & M64;
      }
    
      const out = new Uint8Array(64);
      for (let i = 0; i < 8; i++) {
        for (let b = 0; b < 8; b++) out[i * 8 + b] = Number((H[i] >> BigInt(56 - 8 * b)) & 0xffn);
      }
      return out;
    }
    
    // ---------------------------------------------------------------------------
    // Field arithmetic mod p = 2^255 - 19
    // ---------------------------------------------------------------------------
    
    const P = (1n << 255n) - 19n;
    // group order
    const L = 2n ** 252n + 27742317777372353535851937790883648493n;
    // curve constant d = -121665/121666 mod p
    const D = 37095705934669439343138083508754565189542113879843219016388785533085940283555n;
    // sqrt(-1) mod p, used for point decompression
    const SQRT_M1 = 19681161376707505956807079304988542015446066515923890162744021073123829784752n;
    
    const fmod = (a) => { const r = a % P; return r < 0n ? r + P : r; };
    const fadd = (a, b) => fmod(a + b);
    const fsub = (a, b) => fmod(a - b);
    const fmul = (a, b) => fmod(a * b);
    
    function fpow(a, e) {
      let r = 1n, b = fmod(a), x = e;
      while (x > 0n) {
        if (x & 1n) r = fmul(r, b);
        b = fmul(b, b);
        x >>= 1n;
      }
      return r;
    }
    const finv = (a) => fpow(a, P - 2n);
    
    const nmod = (a) => { const r = a % L; return r < 0n ? r + L : r; };
    
    // ---------------------------------------------------------------------------
    // Group arithmetic on edwards25519 in extended coordinates (X:Y:Z:T)
    // with T = XY/Z. Formulas per RFC 8032 section 5.1.4.
    // ---------------------------------------------------------------------------
    
    const ZERO_POINT = [0n, 1n, 1n, 0n];
    
    // base point
    const BY = fmul(4n, finv(5n));
    const BX = (() => {
      // recover x from y: x^2 = (y^2 - 1) / (d*y^2 + 1)
      const yy = fmul(BY, BY);
      const u = fsub(yy, 1n);
      const v = fadd(fmul(D, yy), 1n);
      let x = fpow(fmul(u, finv(v)), (P + 3n) / 8n);
      if (fmul(x, x) !== fmod(fmul(u, finv(v)))) x = fmul(x, SQRT_M1);
      if (x % 2n !== 0n) x = fsub(0n, x);
      return x;
    })();
    const BASE = [BX, BY, 1n, fmul(BX, BY)];
    
    function pointAdd(Pt, Qt) {
      const [X1, Y1, Z1, T1] = Pt;
      const [X2, Y2, Z2, T2] = Qt;
      const A = fmul(fsub(Y1, X1), fsub(Y2, X2));
      const B = fmul(fadd(Y1, X1), fadd(Y2, X2));
      const C = fmul(fmul(fmul(T1, 2n), D), T2);
      const Dd = fmul(fmul(Z1, 2n), Z2);
      const E = fsub(B, A);
      const F = fsub(Dd, C);
      const G = fadd(Dd, C);
      const H = fadd(B, A);
      return [fmul(E, F), fmul(G, H), fmul(F, G), fmul(E, H)];
    }
    
    function pointDouble(Pt) { return pointAdd(Pt, Pt); }
    
    // Fixed-time-shaped ladder: every bit performs both an add and a double, and
    // the result is selected arithmetically rather than by branching on the bit.
    function scalarMul(k, Pt) {
      let R0 = ZERO_POINT;
      let R1 = Pt;
      for (let i = 255; i >= 0; i--) {
        const bit = (k >> BigInt(i)) & 1n;
        // conditional swap without branching on secret data
        const [A, B] = bit === 1n ? [R1, R0] : [R0, R1];
        const sum = pointAdd(A, B);
        const dbl = pointDouble(A);
        if (bit === 1n) { R1 = dbl; R0 = sum; } else { R0 = dbl; R1 = sum; }
      }
      return R0;
    }
    
    function pointEqual(Pt, Qt) {
      const [X1, Y1, Z1] = Pt;
      const [X2, Y2, Z2] = Qt;
      return fmul(X1, Z2) === fmul(X2, Z1) && fmul(Y1, Z2) === fmul(Y2, Z1);
    }
    
    function pointCompress(Pt) {
      const [X, Y, Z] = Pt;
      const zi = finv(Z);
      const x = fmul(X, zi);
      const y = fmul(Y, zi);
      const out = new Uint8Array(32);
      let v = y;
      for (let i = 0; i < 32; i++) { out[i] = Number(v & 0xffn); v >>= 8n; }
      out[31] |= Number(x & 1n) << 7;
      return out;
    }
    
    function pointDecompress(bytes) {
      if (bytes.length !== 32) return null;
      let y = 0n;
      for (let i = 31; i >= 0; i--) y = (y << 8n) | BigInt(bytes[i]);
      const sign = (y >> 255n) & 1n;
      y &= (1n << 255n) - 1n;
      if (y >= P) return null;
    
      const yy = fmul(y, y);
      const u = fsub(yy, 1n);
      const v = fadd(fmul(D, yy), 1n);
      const uv = fmul(u, finv(v));
      let x = fpow(uv, (P + 3n) / 8n);
      if (fmul(x, x) !== uv) x = fmul(x, SQRT_M1);
      if (fmul(x, x) !== uv) return null;   // not on curve
      if ((x & 1n) !== sign) x = fsub(0n, x);
      return [x, y, 1n, fmul(x, y)];
    }
    
    // ---------------------------------------------------------------------------
    // Ed25519 (RFC 8032 section 5.1)
    // ---------------------------------------------------------------------------
    
    function leToBig(bytes) {
      let v = 0n;
      for (let i = bytes.length - 1; i >= 0; i--) v = (v << 8n) | BigInt(bytes[i]);
      return v;
    }
    
    function bigToLe32(v) {
      const out = new Uint8Array(32);
      let x = v;
      for (let i = 0; i < 32; i++) { out[i] = Number(x & 0xffn); x >>= 8n; }
      return out;
    }
    
    function clamp(h) {
      const a = Uint8Array.from(h.slice(0, 32));
      a[0] &= 248;
      a[31] &= 127;
      a[31] |= 64;
      return leToBig(a);
    }
    
    function concatBytes(...arrs) {
      let n = 0;
      for (const a of arrs) n += a.length;
      const out = new Uint8Array(n);
      let o = 0;
      for (const a of arrs) { out.set(a, o); o += a.length; }
      return out;
    }
    
    // Derive the 32-byte public key from a 32-byte seed.
    function ed25519PublicKey(seed32) {
      if (seed32.length !== 32) throw new Error('seed must be 32 bytes');
      const h = sha512(seed32);
      const a = clamp(h);
      return pointCompress(scalarMul(a, BASE));
    }
    
    function ed25519Keygen(seed32) {
      return { privateKey: Uint8Array.from(seed32), publicKey: ed25519PublicKey(seed32) };
    }
    
    // Sign: R = rB, S = r + H(R,A,M)*a mod L. Signature is R || S.
    function ed25519Sign(seed32, message) {
      if (typeof message === 'string') message = new TextEncoder().encode(message);
      const h = sha512(seed32);
      const a = clamp(h);
      const prefix = h.slice(32, 64);
      const A = pointCompress(scalarMul(a, BASE));
    
      const r = nmod(leToBig(sha512(concatBytes(prefix, message))));
      const R = pointCompress(scalarMul(r, BASE));
      const k = nmod(leToBig(sha512(concatBytes(R, A, message))));
      const S = nmod(r + k * a);
      return concatBytes(R, bigToLe32(S));
    }
    
    // Verify: check [S]B == R + [k]A, using the cofactorless equation.
    function ed25519Verify(publicKey, message, signature) {
      if (typeof message === 'string') message = new TextEncoder().encode(message);
      if (signature.length !== 64 || publicKey.length !== 32) return false;
    
      const Rbytes = signature.slice(0, 32);
      const Sbytes = signature.slice(32, 64);
      const S = leToBig(Sbytes);
      if (S >= L) return false;              // reject non-canonical S
    
      const A = pointDecompress(publicKey);
      if (!A) return false;
      const R = pointDecompress(Rbytes);
      if (!R) return false;
    
      const k = nmod(leToBig(sha512(concatBytes(Rbytes, publicKey, message))));
    
      const lhs = scalarMul(S, BASE);
      const rhs = pointAdd(R, scalarMul(k, A));
      return pointEqual(lhs, rhs);
    }
    
    const _internals = {
      BASE, ZERO_POINT, L, P, D,
      pointAdd, pointDouble, scalarMul, pointEqual,
      pointCompress, pointDecompress, fmul, finv,
    };
    
    return { sha512: sha512, ed25519PublicKey: ed25519PublicKey, ed25519Keygen: ed25519Keygen, ed25519Sign: ed25519Sign, ed25519Verify: ed25519Verify, _internals: _internals };
  })();
  exportsMap["sha512"] = mod_ed25519.sha512;
  exportsMap["ed25519PublicKey"] = mod_ed25519.ed25519PublicKey;
  exportsMap["ed25519Keygen"] = mod_ed25519.ed25519Keygen;
  exportsMap["ed25519Sign"] = mod_ed25519.ed25519Sign;
  exportsMap["ed25519Verify"] = mod_ed25519.ed25519Verify;
  exportsMap["_internals"] = mod_ed25519._internals;
  // ---- blake2.mjs ----
  var mod_blake2 = (function() {
    // From-scratch BLAKE2b and BLAKE2s (RFC 7693), no external crypto library.
    // No WebCrypto, no noble-*, no node:crypto (that's for the *.test.mjs files
    // only, as an independent yardstick).
    //
    // BLAKE2b: 64-bit words, BigInt with a 64-bit mask (as crypto-core/keccak.mjs
    //          uses for Keccak-f[1600]'s 64-bit lanes), 128-byte blocks, up to
    //          64-byte output, up to 64-byte key. IV equals SHA-512's H0.
    // BLAKE2s: 32-bit words, Uint32Array with `>>> 0` (as crypto-core/sha256.mjs
    //          uses for SHA-256), 64-byte blocks, up to 32-byte output, up to
    //          32-byte key. IV equals SHA-256's H0 (RFC 7693 section 2.6).
    
    const MASK64 = (1n << 64n) - 1n;
    
    // Message word permutation schedule, shared by both variants (RFC 7693
    // section 2.7). BLAKE2b runs 12 rounds indexed by `round % 10` (rounds 10-11
    // reuse SIGMA[0..1]); BLAKE2s runs exactly 10 rounds, SIGMA[0..9] in order.
    const SIGMA = [
      [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
      [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
      [ 7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
      [ 9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
      [ 2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
      [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
      [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
      [ 6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
      [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
    ];
    
    // Split (key || message) into zero-padded `bb`-byte blocks per RFC 7693
    // section 3.3: a padded key block (if any) comes first, then the message
    // split into full blocks with the last one zero-padded. An unkeyed empty
    // message still yields exactly one all-zero block.
    function buildBlocks(msg, key, bb) {
      const kk = key ? key.length : 0;
      const ll = msg.length;
      const blocks = [];
      if (kk > 0) {
        const kb = new Uint8Array(bb);
        kb.set(key);
        blocks.push(kb);
      }
      if (ll > 0) {
        for (let off = 0; off < ll; off += bb) {
          const blk = new Uint8Array(bb);
          blk.set(msg.subarray(off, Math.min(off + bb, ll)));
          blocks.push(blk);
        }
      } else if (kk === 0) {
        blocks.push(new Uint8Array(bb));
      }
      return blocks;
    }
    
    /* --------------------------- BLAKE2b (64-bit) --------------------------- */
    
    const IV_B = [
      0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
      0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n,
    ];
    
    function rotr64(x, n) {
      const bn = BigInt(n);
      return ((x >> bn) | (x << (64n - bn))) & MASK64;
    }
    
    // Mixing function G (RFC 7693 section 3.1) with BLAKE2b's rotation
    // constants (R1,R2,R3,R4) = (32,24,16,63) (section 2.1).
    function gB(v, a, b, c, d, x, y) {
      v[a] = (v[a] + v[b] + x) & MASK64;
      v[d] = rotr64(v[d] ^ v[a], 32);
      v[c] = (v[c] + v[d]) & MASK64;
      v[b] = rotr64(v[b] ^ v[c], 24);
      v[a] = (v[a] + v[b] + y) & MASK64;
      v[d] = rotr64(v[d] ^ v[a], 16);
      v[c] = (v[c] + v[d]) & MASK64;
      v[b] = rotr64(v[b] ^ v[c], 63);
    }
    
    function bytesToWordsLE64(block) {
      const dv = new DataView(block.buffer, block.byteOffset, block.byteLength);
      const words = new Array(16);
      for (let i = 0; i < 16; i++) words[i] = dv.getBigUint64(i * 8, true);
      return words;
    }
    
    // Compression function F (RFC 7693 section 3.2), 12 rounds for BLAKE2b.
    function fB(h, m, t, isLast) {
      const v = new Array(16);
      for (let i = 0; i < 8; i++) v[i] = h[i];
      for (let i = 0; i < 8; i++) v[8 + i] = IV_B[i];
      v[12] ^= t & MASK64;
      v[13] ^= (t >> 64n) & MASK64;
      if (isLast) v[14] ^= MASK64;
    
      for (let round = 0; round < 12; round++) {
        const s = SIGMA[round % 10];
        gB(v, 0, 4, 8, 12, m[s[0]], m[s[1]]);
        gB(v, 1, 5, 9, 13, m[s[2]], m[s[3]]);
        gB(v, 2, 6, 10, 14, m[s[4]], m[s[5]]);
        gB(v, 3, 7, 11, 15, m[s[6]], m[s[7]]);
        gB(v, 0, 5, 10, 15, m[s[8]], m[s[9]]);
        gB(v, 1, 6, 11, 12, m[s[10]], m[s[11]]);
        gB(v, 2, 7, 8, 13, m[s[12]], m[s[13]]);
        gB(v, 3, 4, 9, 14, m[s[14]], m[s[15]]);
      }
      for (let i = 0; i < 8; i++) h[i] = (h[i] ^ v[i] ^ v[8 + i]) & MASK64;
    }
    
    function blake2bCore(msg, key, outLen) {
      if (typeof msg === 'string') msg = new TextEncoder().encode(msg);
      if (!Number.isInteger(outLen) || outLen < 1 || outLen > 64) {
        throw new RangeError('blake2b outLen must be an integer in 1..64');
      }
      if (key && key.length > 64) throw new RangeError('blake2b key must be <= 64 bytes');
    
      const bb = 128;
      const kk = key ? key.length : 0;
      const ll = msg.length;
      const blocks = buildBlocks(msg, key, bb);
    
      const h = IV_B.slice();
      // Parameter block p[0] (RFC 7693 section 2.5): digest length, key length,
      // fanout=1, depth=1, mixed into h[0] as a little-endian 64-bit word.
      h[0] ^= 0x01010000n ^ (BigInt(kk) << 8n) ^ BigInt(outLen);
    
      const dd = blocks.length;
      for (let i = 0; i < dd - 1; i++) {
        fB(h, bytesToWordsLE64(blocks[i]), BigInt((i + 1) * bb), false);
      }
      const t = kk === 0 ? BigInt(ll) : BigInt(ll) + BigInt(bb);
      fB(h, bytesToWordsLE64(blocks[dd - 1]), t, true);
    
      const out = new Uint8Array(64);
      const dv = new DataView(out.buffer);
      for (let i = 0; i < 8; i++) dv.setBigUint64(i * 8, h[i], true);
      return out.slice(0, outLen);
    }
    
    /* --------------------------- BLAKE2s (32-bit) --------------------------- */
    
    const IV_S = Uint32Array.from([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ]);
    
    function rotr32(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }
    
    // Mixing function G with BLAKE2s's rotation constants (R1,R2,R3,R4) =
    // (16,12,8,7) (RFC 7693 section 2.1).
    function gS(v, a, b, c, d, x, y) {
      v[a] = (v[a] + v[b] + x) >>> 0;
      v[d] = rotr32(v[d] ^ v[a], 16);
      v[c] = (v[c] + v[d]) >>> 0;
      v[b] = rotr32(v[b] ^ v[c], 12);
      v[a] = (v[a] + v[b] + y) >>> 0;
      v[d] = rotr32(v[d] ^ v[a], 8);
      v[c] = (v[c] + v[d]) >>> 0;
      v[b] = rotr32(v[b] ^ v[c], 7);
    }
    
    function bytesToWordsLE32(block) {
      const dv = new DataView(block.buffer, block.byteOffset, block.byteLength);
      const words = new Uint32Array(16);
      for (let i = 0; i < 16; i++) words[i] = dv.getUint32(i * 4, true);
      return words;
    }
    
    // Compression function F, 10 rounds for BLAKE2s. The byte counter t is kept
    // as a BigInt (RFC 7693 allows input lengths up to 2**64 even for BLAKE2s)
    // and narrowed to two 32-bit words only when mixed into the state.
    function fS(h, m, t, isLast) {
      const v = new Uint32Array(16);
      for (let i = 0; i < 8; i++) v[i] = h[i];
      for (let i = 0; i < 8; i++) v[8 + i] = IV_S[i];
      const t0 = Number(t & 0xffffffffn) >>> 0;
      const t1 = Number((t >> 32n) & 0xffffffffn) >>> 0;
      v[12] = (v[12] ^ t0) >>> 0;
      v[13] = (v[13] ^ t1) >>> 0;
      if (isLast) v[14] = ~v[14] >>> 0;
    
      for (let round = 0; round < 10; round++) {
        const s = SIGMA[round % 10];
        gS(v, 0, 4, 8, 12, m[s[0]], m[s[1]]);
        gS(v, 1, 5, 9, 13, m[s[2]], m[s[3]]);
        gS(v, 2, 6, 10, 14, m[s[4]], m[s[5]]);
        gS(v, 3, 7, 11, 15, m[s[6]], m[s[7]]);
        gS(v, 0, 5, 10, 15, m[s[8]], m[s[9]]);
        gS(v, 1, 6, 11, 12, m[s[10]], m[s[11]]);
        gS(v, 2, 7, 8, 13, m[s[12]], m[s[13]]);
        gS(v, 3, 4, 9, 14, m[s[14]], m[s[15]]);
      }
      for (let i = 0; i < 8; i++) h[i] = (h[i] ^ v[i] ^ v[8 + i]) >>> 0;
    }
    
    function blake2sCore(msg, key, outLen) {
      if (typeof msg === 'string') msg = new TextEncoder().encode(msg);
      if (!Number.isInteger(outLen) || outLen < 1 || outLen > 32) {
        throw new RangeError('blake2s outLen must be an integer in 1..32');
      }
      if (key && key.length > 32) throw new RangeError('blake2s key must be <= 32 bytes');
    
      const bb = 64;
      const kk = key ? key.length : 0;
      const ll = msg.length;
      const blocks = buildBlocks(msg, key, bb);
    
      const h = IV_S.slice();
      h[0] = (h[0] ^ 0x01010000 ^ (kk << 8) ^ outLen) >>> 0;
    
      const dd = blocks.length;
      for (let i = 0; i < dd - 1; i++) {
        fS(h, bytesToWordsLE32(blocks[i]), BigInt((i + 1) * bb), false);
      }
      const t = kk === 0 ? BigInt(ll) : BigInt(ll) + BigInt(bb);
      fS(h, bytesToWordsLE32(blocks[dd - 1]), t, true);
    
      const out = new Uint8Array(32);
      const dv = new DataView(out.buffer);
      for (let i = 0; i < 8; i++) dv.setUint32(i * 4, h[i], true);
      return out.slice(0, outLen);
    }
    
    /* -------------------------------- Exports -------------------------------- */
    
    function blake2b(msg, outLen = 64) {
      return blake2bCore(msg, null, outLen);
    }
    function blake2bKeyed(msg, key, outLen = 64) {
      if (typeof key === 'string') key = new TextEncoder().encode(key);
      return blake2bCore(msg, key, outLen);
    }
    function blake2s(msg, outLen = 32) {
      return blake2sCore(msg, null, outLen);
    }
    function blake2sKeyed(msg, key, outLen = 32) {
      if (typeof key === 'string') key = new TextEncoder().encode(key);
      return blake2sCore(msg, key, outLen);
    }
    
    return { blake2b: blake2b, blake2bKeyed: blake2bKeyed, blake2s: blake2s, blake2sKeyed: blake2sKeyed };
  })();
  exportsMap["blake2b"] = mod_blake2.blake2b;
  exportsMap["blake2bKeyed"] = mod_blake2.blake2bKeyed;
  exportsMap["blake2s"] = mod_blake2.blake2s;
  exportsMap["blake2sKeyed"] = mod_blake2.blake2sKeyed;
  // ---- blake3.mjs ----
  var mod_blake3 = (function() {
    // From-scratch BLAKE3, per the official BLAKE3 specification
    // (github.com/BLAKE3-team/BLAKE3-specs, "BLAKE3" paper, and the project's
    // reference_impl.rs pseudocode). Pure JS, 32-bit lane arithmetic via >>> 0,
    // no external crypto library, no WebCrypto, no noble-*, no node:crypto
    // (that's for blake3.test.mjs only, as an independent yardstick where
    // possible -- Node has no native BLAKE3, so that file leans on hardcoded
    // known-answer vectors plus structural checks instead).
    //
    // BLAKE3 reuses the BLAKE2s/ChaCha quarter-round "G" function over a 16-word
    // (32-bit lanes) compression state, run for 7 rounds with a fixed message
    // permutation between rounds -- see crypto-core/sha256.mjs for the same
    // 32-bit rotate/add-mod-2^32 style, and crypto-core/keccak.mjs for how this
    // codebase handles the *other* lane width (64-bit, via BigInt) when a spec
    // calls for it. BLAKE3 only ever needs 32-bit lanes.
    //
    // Tree shape: input is split into 1024-byte chunks; each chunk is hashed
    // chunk-internally (chained CHUNK_START..CHUNK_END blocks of 64 bytes) to a
    // single 32-byte chaining value; chaining values are combined pairwise by
    // PARENT nodes into a binary tree that is *left-complete* -- built
    // incrementally with a stack, merging two adjacent equal-size subtrees
    // whenever the running chunk count's low bits allow it (spec section 5.1.2).
    // The final node (a lone chunk if the whole input is one chunk, otherwise
    // the root parent) gets the ROOT flag and is the only node ever asked for
    // more than 32 bytes of output -- extendable output (XOF) works by
    // re-invoking the compression function on that same fixed input with an
    // increasing output-block counter standing in for the chunk/parent counter.
    
    const CHUNK_START = 1 << 0;
    const CHUNK_END = 1 << 1;
    const PARENT = 1 << 2;
    const ROOT = 1 << 3;
    const KEYED_HASH = 1 << 4;
    const DERIVE_KEY_CONTEXT = 1 << 5;
    const DERIVE_KEY_MATERIAL = 1 << 6;
    
    const BLOCK_LEN = 64;   // bytes per compression block (16 words)
    const CHUNK_LEN = 1024; // bytes per chunk (16 blocks)
    const OUT_LEN = 32;     // default/inner (chaining value and context-key) length
    
    // IV: identical to SHA-256's initial hash values (FIPS 180-4 section 5.3.3).
    const IV = Uint32Array.from([
      0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
      0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
    ]);
    
    // Message-word permutation applied to the block between rounds (spec section 2.3).
    const MSG_PERMUTATION = [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8];
    
    function rotr32(x, n) { return (x >>> n) | (x << (32 - n)); }
    
    // The G mixing function (spec section 2.2): mixes message words mx, my into
    // four state positions a, b, c, d.
    function g(state, a, b, c, d, mx, my) {
      state[a] = (state[a] + state[b] + mx) >>> 0;
      state[d] = rotr32(state[d] ^ state[a], 16);
      state[c] = (state[c] + state[d]) >>> 0;
      state[b] = rotr32(state[b] ^ state[c], 12);
      state[a] = (state[a] + state[b] + my) >>> 0;
      state[d] = rotr32(state[d] ^ state[a], 8);
      state[c] = (state[c] + state[d]) >>> 0;
      state[b] = rotr32(state[b] ^ state[c], 7);
    }
    
    // One round: mix the four columns, then the four diagonals.
    function round(state, m) {
      g(state, 0, 4, 8, 12, m[0], m[1]);
      g(state, 1, 5, 9, 13, m[2], m[3]);
      g(state, 2, 6, 10, 14, m[4], m[5]);
      g(state, 3, 7, 11, 15, m[6], m[7]);
      g(state, 0, 5, 10, 15, m[8], m[9]);
      g(state, 1, 6, 11, 12, m[10], m[11]);
      g(state, 2, 7, 8, 13, m[12], m[13]);
      g(state, 3, 4, 9, 14, m[14], m[15]);
    }
    
    function permute(m) {
      const t = new Uint32Array(16);
      for (let i = 0; i < 16; i++) t[i] = m[MSG_PERMUTATION[i]];
      m.set(t);
    }
    
    // The compression function (spec section 2.4): 8-word chaining value + 16-word
    // message block + counter + block length + flags -> 16-word output. Words
    // 0..7 of the output are the new chaining value; the full 16 words are used
    // as a 64-byte XOF keystream block when this call is the root.
    //
    // counter is a plain JS number (safe integer, up to 2^53), split into low/high
    // 32-bit halves the same way sha256.mjs's pad() splits a >32-bit bit-length:
    // `>>> 0` performs the spec's mod-2^32 truncation even on the full-size number.
    function compress(cv, blockWords, counter, blockLen, flags) {
      const state = new Uint32Array(16);
      state.set(cv, 0);
      state.set(IV.subarray(0, 4), 8);
      state[12] = counter >>> 0;
      state[13] = Math.floor(counter / 0x100000000) >>> 0;
      state[14] = blockLen >>> 0;
      state[15] = flags >>> 0;
    
      const m = Uint32Array.from(blockWords);
      for (let r = 0; r < 7; r++) {
        round(state, m);
        if (r < 6) permute(m);
      }
    
      const out = new Uint32Array(16);
      for (let i = 0; i < 8; i++) {
        out[i] = state[i] ^ state[i + 8];
        out[i + 8] = state[i + 8] ^ cv[i];
      }
      return out;
    }
    
    // Reads up to wordCount*4 bytes of `bytes` as little-endian u32 words,
    // zero-padding any remainder -- covers both the 64-byte message block case
    // and the 32-byte key/context-key case. Copies into a fresh zero-filled
    // buffer first so a DataView over it never has to worry about the source's
    // byteOffset (matters when `bytes` is a Buffer/subarray view).
    function wordsFromBytesLE(bytes, wordCount) {
      const buf = new Uint8Array(wordCount * 4);
      buf.set(bytes.subarray(0, Math.min(bytes.length, buf.length)));
      const dv = new DataView(buf.buffer);
      const words = new Uint32Array(wordCount);
      for (let i = 0; i < wordCount; i++) words[i] = dv.getUint32(i * 4, true);
      return words;
    }
    
    function toBytes(x) {
      if (typeof x === 'string') return new TextEncoder().encode(x);
      if (x instanceof Uint8Array) return x;
      return Uint8Array.from(x);
    }
    
    // An "Output" -- the deferred final compression of a chunk or parent node.
    // Kept unevaluated (spec section 2.5) so the same inputs can be turned into
    // either a chaining value (chainingValue, no ROOT flag) or, only for the
    // single overall root node, an arbitrary-length XOF byte stream
    // (rootOutputBytes, ROOT flag set on every block).
    function chainingValue(output) {
      const words = compress(output.cv, output.blockWords, output.counter, output.blockLen, output.flags);
      return words.slice(0, 8);
    }
    
    function rootOutputBytes(output, outLen) {
      const out = new Uint8Array(outLen);
      const blockBuf = new Uint8Array(BLOCK_LEN);
      const dv = new DataView(blockBuf.buffer);
      let counter = 0;
      let offset = 0;
      while (offset < outLen) {
        const words = compress(output.cv, output.blockWords, counter, output.blockLen, output.flags | ROOT);
        for (let i = 0; i < 16; i++) dv.setUint32(i * 4, words[i], true);
        const take = Math.min(BLOCK_LEN, outLen - offset);
        out.set(blockBuf.subarray(0, take), offset);
        offset += take;
        counter++;
      }
      return out;
    }
    
    // Chains the (up to 16) 64-byte blocks of one chunk, returning the deferred
    // Output for the *last* block -- CHUNK_START is set only on block 0,
    // CHUNK_END only on the last block (spec section 2.5's ChunkState).
    function chunkOutput(chunkBytes, chunkCounter, keyWords, baseFlags) {
      const numBlocks = chunkBytes.length === 0 ? 1 : Math.ceil(chunkBytes.length / BLOCK_LEN);
      let cv = keyWords;
      let result = null;
      for (let b = 0; b < numBlocks; b++) {
        const start = b * BLOCK_LEN;
        const blockLen = Math.min(BLOCK_LEN, chunkBytes.length - start);
        const blockWords = wordsFromBytesLE(chunkBytes.subarray(start, start + blockLen), 16);
        let flags = baseFlags;
        if (b === 0) flags |= CHUNK_START;
        if (b === numBlocks - 1) flags |= CHUNK_END;
        if (b === numBlocks - 1) {
          result = { cv, blockWords, counter: chunkCounter, blockLen, flags };
        } else {
          cv = chainingValue({ cv, blockWords, counter: chunkCounter, blockLen, flags });
        }
      }
      return result;
    }
    
    // A PARENT node's "message" is just its two children's chaining values
    // concatenated; counter is always 0 and blockLen is always BLOCK_LEN (spec
    // section 2.5, parent_output).
    function parentOutput(leftCv, rightCv, keyWords, baseFlags) {
      const blockWords = new Uint32Array(16);
      blockWords.set(leftCv, 0);
      blockWords.set(rightCv, 8);
      return { cv: keyWords, blockWords, counter: 0, blockLen: BLOCK_LEN, flags: baseFlags | PARENT };
    }
    
    function parentCv(leftCv, rightCv, keyWords, baseFlags) {
      return chainingValue(parentOutput(leftCv, rightCv, keyWords, baseFlags));
    }
    
    // Core one-shot hasher shared by blake3/blake3Keyed/the two derive_key
    // passes: splits input into chunks, folds completed chunk chaining values
    // into a stack of subtree CVs (spec section 5.1.2's "add_chunk_chaining_value"
    // merge-on-trailing-zero-bits algorithm, which is what makes the tree shape
    // canonical for a given input length), then unwinds the stack against the
    // still-deferred last chunk's Output to reach the root, and finally expands
    // that root to outLen bytes.
    function blake3Core(inputBytes, keyWords, baseFlags, outLen) {
      const numChunks = inputBytes.length === 0 ? 1 : Math.ceil(inputBytes.length / CHUNK_LEN);
      const stack = [];
      let output;
    
      for (let i = 0; i < numChunks; i++) {
        const start = i * CHUNK_LEN;
        const end = Math.min(start + CHUNK_LEN, inputBytes.length);
        const out = chunkOutput(inputBytes.subarray(start, end), i, keyWords, baseFlags);
    
        if (i === numChunks - 1) {
          output = out;
        } else {
          let newCv = chainingValue(out);
          let totalChunks = i + 1;
          while (totalChunks % 2 === 0) {
            const left = stack.pop();
            newCv = parentCv(left, newCv, keyWords, baseFlags);
            totalChunks = Math.floor(totalChunks / 2);
          }
          stack.push(newCv);
        }
      }
    
      while (stack.length > 0) {
        const left = stack.pop();
        output = parentOutput(left, chainingValue(output), keyWords, baseFlags);
      }
    
      return rootOutputBytes(output, outLen);
    }
    
    function blake3(input, outLen = 32) {
      return blake3Core(toBytes(input), IV, 0, outLen);
    }
    
    function blake3Keyed(input, key32, outLen = 32) {
      const keyBytes = toBytes(key32);
      if (keyBytes.length !== 32) throw new Error('blake3Keyed: key must be exactly 32 bytes');
      const keyWords = wordsFromBytesLE(keyBytes, 8);
      return blake3Core(toBytes(input), keyWords, KEYED_HASH, outLen);
    }
    
    // Key derivation (spec section 5.4): hash the context string under
    // DERIVE_KEY_CONTEXT to get a 32-byte context key, then use that as the key
    // for hashing key_material under DERIVE_KEY_MATERIAL.
    function blake3DeriveKey(context, keyMaterial, outLen = 32) {
      const contextKeyBytes = blake3Core(toBytes(context), IV, DERIVE_KEY_CONTEXT, OUT_LEN);
      const contextKeyWords = wordsFromBytesLE(contextKeyBytes, 8);
      return blake3Core(toBytes(keyMaterial), contextKeyWords, DERIVE_KEY_MATERIAL, outLen);
    }
    
    function blake3Hex(input, outLen = 32) {
      return Buffer.from(blake3(input, outLen)).toString('hex');
    }
    
    return { blake3: blake3, blake3Keyed: blake3Keyed, blake3DeriveKey: blake3DeriveKey, blake3Hex: blake3Hex };
  })();
  exportsMap["blake3"] = mod_blake3.blake3;
  exportsMap["blake3Keyed"] = mod_blake3.blake3Keyed;
  exportsMap["blake3DeriveKey"] = mod_blake3.blake3DeriveKey;
  exportsMap["blake3Hex"] = mod_blake3.blake3Hex;
  // ---- mlkem.mjs ----
  var mod_mlkem = (function() {
    // From-scratch ML-KEM (FIPS 203) — Module-Lattice-Based Key-Encapsulation Mechanism.
    // Pure JS. No external crypto library. Hashing comes from our own keccak.mjs.
    //
    // Implements ML-KEM-512, ML-KEM-768 and ML-KEM-1024.
    //
    // Spec: FIPS 203, https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf
    // Algorithm numbers in comments refer to that document.
    
    
    const N = 256;          // polynomial degree
    const Q = 3329;         // modulus
    const ZETA = 17;        // primitive 256th root of unity mod Q
    
    // ---------------------------------------------------------------------------
    // Modular arithmetic helpers
    // ---------------------------------------------------------------------------
    
    function mod(a, m) { const r = a % m; return r < 0 ? r + m : r; }
    
    function powMod(base, exp, m) {
      let result = 1, b = mod(base, m), e = exp;
      while (e > 0) {
        if (e & 1) result = (result * b) % m;
        b = (b * b) % m;
        e >>>= 1;
      }
      return result;
    }
    
    // Bit-reversal of a 7-bit value, per FIPS 203 (BitRev7).
    function bitRev7(i) {
      let r = 0;
      for (let b = 0; b < 7; b++) if (i & (1 << b)) r |= 1 << (6 - b);
      return r;
    }
    
    // Derived from first principles rather than transcribed, so a typo in a
    // hardcoded table cannot silently corrupt the transform.
    const ZETAS = new Int32Array(128);
    const GAMMAS = new Int32Array(128);
    for (let i = 0; i < 128; i++) {
      ZETAS[i] = powMod(ZETA, bitRev7(i), Q);
      GAMMAS[i] = powMod(ZETA, 2 * bitRev7(i) + 1, Q);
    }
    
    // ---------------------------------------------------------------------------
    // Number-Theoretic Transform (Algorithms 9, 10, 11, 12)
    // ML-KEM uses a 7-layer "incomplete" NTT, leaving 128 degree-1 polynomials.
    // ---------------------------------------------------------------------------
    
    function ntt(f) {
      const a = Int32Array.from(f);
      let i = 1;
      for (let len = 128; len >= 2; len >>= 1) {
        for (let start = 0; start < N; start += 2 * len) {
          const z = ZETAS[i++];
          for (let j = start; j < start + len; j++) {
            const t = (z * a[j + len]) % Q;
            a[j + len] = mod(a[j] - t, Q);
            a[j] = (a[j] + t) % Q;
          }
        }
      }
      return a;
    }
    
    function nttInverse(fHat) {
      const a = Int32Array.from(fHat);
      let i = 127;
      for (let len = 2; len <= 128; len <<= 1) {
        for (let start = 0; start < N; start += 2 * len) {
          const z = ZETAS[i--];
          for (let j = start; j < start + len; j++) {
            const t = a[j];
            a[j] = (t + a[j + len]) % Q;
            a[j + len] = mod(z * mod(a[j + len] - t, Q), Q);
          }
        }
      }
      const inv128 = powMod(128, Q - 2, Q);   // 128^-1 mod Q
      for (let j = 0; j < N; j++) a[j] = (a[j] * inv128) % Q;
      return a;
    }
    
    // BaseCaseMultiply (Algorithm 12): product of two degree-1 polys mod (X^2 - gamma).
    function baseCaseMultiply(a0, a1, b0, b1, gamma) {
      const c0 = (a0 * b0 + ((a1 * b1) % Q) * gamma) % Q;
      const c1 = (a0 * b1 + a1 * b0) % Q;
      return [c0, c1];
    }
    
    // MultiplyNTTs (Algorithm 11): pointwise product in the NTT domain.
    function multiplyNTTs(aHat, bHat) {
      const c = new Int32Array(N);
      for (let i = 0; i < 128; i++) {
        const [c0, c1] = baseCaseMultiply(
          aHat[2 * i], aHat[2 * i + 1],
          bHat[2 * i], bHat[2 * i + 1],
          GAMMAS[i]
        );
        c[2 * i] = c0;
        c[2 * i + 1] = c1;
      }
      return c;
    }
    
    function polyAdd(a, b) {
      const c = new Int32Array(N);
      for (let i = 0; i < N; i++) c[i] = (a[i] + b[i]) % Q;
      return c;
    }
    
    function polySub(a, b) {
      const c = new Int32Array(N);
      for (let i = 0; i < N; i++) c[i] = mod(a[i] - b[i], Q);
      return c;
    }
    
    // Schoolbook multiplication in Z_q[X]/(X^256 + 1). Not used by ML-KEM itself;
    // exported so tests can check the NTT path against a direct computation.
    function polyMulSchoolbook(a, b) {
      const c = new Int32Array(N);
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const prod = (a[i] * b[j]) % Q;
          const k = i + j;
          if (k < N) c[k] = (c[k] + prod) % Q;
          else c[k - N] = mod(c[k - N] - prod, Q);   // X^256 = -1
        }
      }
      return c;
    }
    
    // ---------------------------------------------------------------------------
    // Sampling (Algorithms 7, 8)
    // ---------------------------------------------------------------------------
    
    // SampleNTT: uniform rejection sampling of an NTT-domain polynomial from a
    // 34-byte seed, reading 3 bytes at a time as two 12-bit candidates.
    function sampleNTT(seed32, i, j) {
      const input = new Uint8Array(34);
      input.set(seed32);
      input[32] = i;
      input[33] = j;
    
      const a = new Int32Array(N);
      let count = 0;
      let need = 504;                       // three 168-byte SHAKE128 blocks
      let bytes = shake128(input, need);
      let pos = 0;
    
      while (count < N) {
        if (pos + 3 > bytes.length) {
          need += 504;
          bytes = shake128(input, need);    // SHAKE output is a prefix-stable stream
        }
        const b0 = bytes[pos], b1 = bytes[pos + 1], b2 = bytes[pos + 2];
        pos += 3;
        const d1 = b0 | ((b1 & 0x0F) << 8);
        const d2 = (b1 >> 4) | (b2 << 4);
        if (d1 < Q && count < N) a[count++] = d1;
        if (d2 < Q && count < N) a[count++] = d2;
      }
      return a;
    }
    
    // SamplePolyCBD_eta: centered binomial distribution from 64*eta bytes.
    function samplePolyCBD(bytes, eta) {
      const f = new Int32Array(N);
      const bit = (idx) => (bytes[idx >> 3] >> (idx & 7)) & 1;
      for (let i = 0; i < N; i++) {
        let x = 0, y = 0;
        for (let j = 0; j < eta; j++) {
          x += bit(2 * i * eta + j);
          y += bit(2 * i * eta + eta + j);
        }
        f[i] = mod(x - y, Q);
      }
      return f;
    }
    
    // PRF: SHAKE256(s || b), producing 64*eta bytes.
    function prf(eta, s32, b) {
      const input = new Uint8Array(33);
      input.set(s32);
      input[32] = b;
      return shake256(input, 64 * eta);
    }
    
    // ---------------------------------------------------------------------------
    // Encoding / compression (Algorithms 4, 5, 6)
    // ---------------------------------------------------------------------------
    
    function byteEncode(f, d) {
      const out = new Uint8Array(32 * d);
      let bitPos = 0;
      for (let i = 0; i < N; i++) {
        const v = f[i];
        for (let b = 0; b < d; b++) {
          if ((v >> b) & 1) out[bitPos >> 3] |= 1 << (bitPos & 7);
          bitPos++;
        }
      }
      return out;
    }
    
    function byteDecode(bytes, d) {
      const f = new Int32Array(N);
      let bitPos = 0;
      for (let i = 0; i < N; i++) {
        let v = 0;
        for (let b = 0; b < d; b++) {
          const bit = (bytes[bitPos >> 3] >> (bitPos & 7)) & 1;
          v |= bit << b;
          bitPos++;
        }
        f[i] = d === 12 ? v % Q : v;
      }
      return f;
    }
    
    // Compress_d / Decompress_d with round-half-up, in exact integer arithmetic.
    function compress(f, d) {
      const out = new Int32Array(N);
      const twoD = 1 << d;
      for (let i = 0; i < N; i++) {
        out[i] = Math.floor((f[i] * twoD * 2 + Q) / (2 * Q)) % twoD;
      }
      return out;
    }
    
    function decompress(f, d) {
      const out = new Int32Array(N);
      const twoD = 1 << d;
      for (let i = 0; i < N; i++) {
        out[i] = Math.floor((f[i] * Q * 2 + twoD) / (2 * twoD));
      }
      return out;
    }
    
    // ---------------------------------------------------------------------------
    // Parameter sets (FIPS 203 Table 2)
    // ---------------------------------------------------------------------------
    
    const PARAMS = {
      'ML-KEM-512':  { k: 2, eta1: 3, eta2: 2, du: 10, dv: 4 },
      'ML-KEM-768':  { k: 3, eta1: 2, eta2: 2, du: 10, dv: 4 },
      'ML-KEM-1024': { k: 4, eta1: 2, eta2: 2, du: 11, dv: 5 },
    };
    
    function concat(...arrays) {
      let total = 0;
      for (const a of arrays) total += a.length;
      const out = new Uint8Array(total);
      let off = 0;
      for (const a of arrays) { out.set(a, off); off += a.length; }
      return out;
    }
    
    // ---------------------------------------------------------------------------
    // K-PKE (Algorithms 13, 14, 15) — the internal public-key encryption scheme
    // ---------------------------------------------------------------------------
    
    function kpkeKeyGen(d, p) {
      const { k, eta1 } = p;
      const g = sha3_512(concat(d, new Uint8Array([k])));
      const rho = g.slice(0, 32);
      const sigma = g.slice(32, 64);
    
      const AHat = [];
      for (let i = 0; i < k; i++) {
        const row = [];
        for (let j = 0; j < k; j++) row.push(sampleNTT(rho, j, i));
        AHat.push(row);
      }
    
      let nonce = 0;
      const s = [], e = [];
      for (let i = 0; i < k; i++) s.push(samplePolyCBD(prf(eta1, sigma, nonce++), eta1));
      for (let i = 0; i < k; i++) e.push(samplePolyCBD(prf(eta1, sigma, nonce++), eta1));
    
      const sHat = s.map(ntt);
      const eHat = e.map(ntt);
    
      // t_hat = A_hat . s_hat + e_hat
      const tHat = [];
      for (let i = 0; i < k; i++) {
        let acc = new Int32Array(N);
        for (let j = 0; j < k; j++) acc = polyAdd(acc, multiplyNTTs(AHat[i][j], sHat[j]));
        tHat.push(polyAdd(acc, eHat[i]));
      }
    
      const ek = concat(...tHat.map((t) => byteEncode(t, 12)), rho);
      const dk = concat(...sHat.map((sv) => byteEncode(sv, 12)));
      return { ek, dk };
    }
    
    function kpkeEncrypt(ek, m32, r32, p) {
      const { k, eta1, eta2, du, dv } = p;
    
      const tHat = [];
      for (let i = 0; i < k; i++) tHat.push(byteDecode(ek.slice(384 * i, 384 * (i + 1)), 12));
      const rho = ek.slice(384 * k, 384 * k + 32);
    
      const AHat = [];
      for (let i = 0; i < k; i++) {
        const row = [];
        for (let j = 0; j < k; j++) row.push(sampleNTT(rho, j, i));
        AHat.push(row);
      }
    
      let nonce = 0;
      const y = [], e1 = [];
      for (let i = 0; i < k; i++) y.push(samplePolyCBD(prf(eta1, r32, nonce++), eta1));
      for (let i = 0; i < k; i++) e1.push(samplePolyCBD(prf(eta2, r32, nonce++), eta2));
      const e2 = samplePolyCBD(prf(eta2, r32, nonce++), eta2);
    
      const yHat = y.map(ntt);
    
      // u = NTT^-1(A_hat^T . y_hat) + e1
      const u = [];
      for (let i = 0; i < k; i++) {
        let acc = new Int32Array(N);
        for (let j = 0; j < k; j++) acc = polyAdd(acc, multiplyNTTs(AHat[j][i], yHat[j]));
        u.push(polyAdd(nttInverse(acc), e1[i]));
      }
    
      // v = NTT^-1(t_hat^T . y_hat) + e2 + Decompress_1(m)
      let vAcc = new Int32Array(N);
      for (let j = 0; j < k; j++) vAcc = polyAdd(vAcc, multiplyNTTs(tHat[j], yHat[j]));
      const mu = decompress(byteDecode(m32, 1), 1);
      const v = polyAdd(polyAdd(nttInverse(vAcc), e2), mu);
    
      const c1 = concat(...u.map((uv) => byteEncode(compress(uv, du), du)));
      const c2 = byteEncode(compress(v, dv), dv);
      return concat(c1, c2);
    }
    
    function kpkeDecrypt(dk, c, p) {
      const { k, du, dv } = p;
      const c1Len = 32 * du * k;
    
      const u = [];
      for (let i = 0; i < k; i++) {
        const chunk = c.slice(32 * du * i, 32 * du * (i + 1));
        u.push(decompress(byteDecode(chunk, du), du));
      }
      const v = decompress(byteDecode(c.slice(c1Len, c1Len + 32 * dv), dv), dv);
    
      const sHat = [];
      for (let i = 0; i < k; i++) sHat.push(byteDecode(dk.slice(384 * i, 384 * (i + 1)), 12));
    
      // w = v - NTT^-1(s_hat^T . NTT(u))
      let acc = new Int32Array(N);
      for (let i = 0; i < k; i++) acc = polyAdd(acc, multiplyNTTs(sHat[i], ntt(u[i])));
      const w = polySub(v, nttInverse(acc));
    
      return byteEncode(compress(w, 1), 1);
    }
    
    // ---------------------------------------------------------------------------
    // ML-KEM (Algorithms 16, 17, 18)
    // ---------------------------------------------------------------------------
    
    // KeyGen_internal. d and z are 32 bytes of randomness each.
    function keyGenInternal(d, z, paramName = 'ML-KEM-768') {
      const p = PARAMS[paramName];
      const { ek, dk: dkPke } = kpkeKeyGen(d, p);
      const dk = concat(dkPke, ek, sha3_256(ek), z);
      return { encapsKey: ek, decapsKey: dk };
    }
    
    // Encaps_internal. m is 32 bytes of randomness.
    function encapsInternal(ek, m, paramName = 'ML-KEM-768') {
      const p = PARAMS[paramName];
      const g = sha3_512(concat(m, sha3_256(ek)));
      const K = g.slice(0, 32);
      const r = g.slice(32, 64);
      const c = kpkeEncrypt(ek, m, r, p);
      return { sharedSecret: K, ciphertext: c };
    }
    
    // Decaps_internal, including the implicit-rejection branch.
    function decapsInternal(dk, c, paramName = 'ML-KEM-768') {
      const p = PARAMS[paramName];
      const { k } = p;
      const dkPkeLen = 384 * k;
      const ekLen = 384 * k + 32;
    
      const dkPke = dk.slice(0, dkPkeLen);
      const ek = dk.slice(dkPkeLen, dkPkeLen + ekLen);
      const h = dk.slice(dkPkeLen + ekLen, dkPkeLen + ekLen + 32);
      const z = dk.slice(dkPkeLen + ekLen + 32, dkPkeLen + ekLen + 64);
    
      const mPrime = kpkeDecrypt(dkPke, c, p);
      const g = sha3_512(concat(mPrime, h));
      const KPrime = g.slice(0, 32);
      const rPrime = g.slice(32, 64);
    
      // K_bar = J(z || c), the rejection secret, computed unconditionally
      const KBar = shake256(concat(z, c), 32);
    
      const cPrime = kpkeEncrypt(ek, mPrime, rPrime, p);
    
      // difference accumulated without early exit
      let diff = 0;
      if (cPrime.length !== c.length) diff = 1;
      else for (let i = 0; i < c.length; i++) diff |= cPrime[i] ^ c[i];
    
      return diff === 0 ? KPrime : KBar;
    }
    
    // ---------------------------------------------------------------------------
    // Public API. Randomness is supplied by the caller so every operation is
    // reproducible and testable; nothing here reaches for an ambient entropy source.
    // ---------------------------------------------------------------------------
    
    function mlkemKeygen(seed64, paramName = 'ML-KEM-768') {
      if (seed64.length !== 64) throw new Error('keygen requires 64 bytes (d || z)');
      return keyGenInternal(seed64.slice(0, 32), seed64.slice(32, 64), paramName);
    }
    
    function mlkemEncapsulate(encapsKey, seed32, paramName = 'ML-KEM-768') {
      if (seed32.length !== 32) throw new Error('encapsulate requires a 32-byte seed');
      return encapsInternal(encapsKey, seed32, paramName);
    }
    
    function mlkemDecapsulate(decapsKey, ciphertext, paramName = 'ML-KEM-768') {
      return decapsInternal(decapsKey, ciphertext, paramName);
    }
    
    return { ntt: ntt, nttInverse: nttInverse, multiplyNTTs: multiplyNTTs, polyMulSchoolbook: polyMulSchoolbook, keyGenInternal: keyGenInternal, encapsInternal: encapsInternal, decapsInternal: decapsInternal, mlkemKeygen: mlkemKeygen, mlkemEncapsulate: mlkemEncapsulate, mlkemDecapsulate: mlkemDecapsulate, PARAMS: PARAMS };
  })();
  exportsMap["ntt"] = mod_mlkem.ntt;
  exportsMap["nttInverse"] = mod_mlkem.nttInverse;
  exportsMap["multiplyNTTs"] = mod_mlkem.multiplyNTTs;
  exportsMap["polyMulSchoolbook"] = mod_mlkem.polyMulSchoolbook;
  exportsMap["keyGenInternal"] = mod_mlkem.keyGenInternal;
  exportsMap["encapsInternal"] = mod_mlkem.encapsInternal;
  exportsMap["decapsInternal"] = mod_mlkem.decapsInternal;
  exportsMap["mlkemKeygen"] = mod_mlkem.mlkemKeygen;
  exportsMap["mlkemEncapsulate"] = mod_mlkem.mlkemEncapsulate;
  exportsMap["mlkemDecapsulate"] = mod_mlkem.mlkemDecapsulate;
  exportsMap["PARAMS"] = mod_mlkem.PARAMS;
  // ---- mldsa.mjs ----
  var mod_mldsa = (function() {
    // From-scratch ML-DSA (FIPS 204) — Module-Lattice-Based Digital Signature Algorithm
    // (the Dilithium-based signature scheme). Pure JS. No external crypto library.
    // Hashing comes entirely from our own keccak.mjs (SHAKE128 / SHAKE256).
    //
    // Implements ML-DSA-44, ML-DSA-65 and ML-DSA-87.
    //
    // Spec: FIPS 204, https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf
    // Algorithm names in comments refer to that document (Power2Round, Decompose,
    // MakeHint/UseHint, ExpandA/ExpandS/ExpandMask, SampleInBall, pkEncode/skEncode/
    // sigEncode and their inverses, KeyGen/Sign/Verify internal algorithms).
    //
    // Unlike ML-KEM (q=3329, 7-layer *incomplete* NTT leaving 128 irreducible
    // quadratic factors), ML-DSA's modulus q=8380417 satisfies q ≡ 1 (mod 512),
    // so X^256+1 splits completely into 256 linear factors mod q. That means a
    // full 8-layer NTT is possible, and multiplication in the NTT domain is
    // literally coordinatewise (no 2x2 base-case multiply as in ML-KEM).
    
    
    const N = 256;              // polynomial degree
    const Q = 8380417;          // modulus, 2^23 - 2^13 + 1
    const ZETA = 1753;          // primitive 512th root of unity mod Q (full NTT)
    const D = 13;                // Power2Round / t0 bit-dropping parameter (fixed by spec)
    
    // ---------------------------------------------------------------------------
    // Modular arithmetic helpers
    // ---------------------------------------------------------------------------
    
    function mod(a, m) { const r = a % m; return r < 0 ? r + m : r; }
    
    // Centered representative: mod±(a, m) in (-m/2, m/2].
    function modPM(a, m) {
      const r = mod(a, m);
      return r > Math.floor(m / 2) ? r - m : r;
    }
    
    function powMod(base, exp, m) {
      let result = 1, b = mod(base, m), e = exp;
      while (e > 0) {
        if (e & 1) result = (result * b) % m;
        b = (b * b) % m;
        e >>>= 1;
      }
      return result;
    }
    
    // Number of bits needed to represent integer x >= 0 (0 -> 0).
    function bitlen(x) {
      let n = 0;
      while (x > 0) { n++; x = Math.floor(x / 2); }
      return n;
    }
    
    function concat(...arrays) {
      let total = 0;
      for (const a of arrays) total += a.length;
      const out = new Uint8Array(total);
      let off = 0;
      for (const a of arrays) { out.set(a, off); off += a.length; }
      return out;
    }
    
    function eqBytes(a, b) {
      if (a.length !== b.length) return false;
      let diff = 0;
      for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
      return diff === 0;
    }
    
    function toBytes(x) {
      return typeof x === 'string' ? new TextEncoder().encode(x) : x;
    }
    
    // ---------------------------------------------------------------------------
    // Number-Theoretic Transform — full 8-layer NTT (Algorithms "NTT"/"NTT^-1").
    // Derived from first principles (bit-reversed powers of zeta), not transcribed
    // from a table, so a typo cannot silently corrupt the transform.
    // ---------------------------------------------------------------------------
    
    function bitRev8(i) {
      let r = 0;
      for (let b = 0; b < 8; b++) if (i & (1 << b)) r |= 1 << (7 - b);
      return r;
    }
    
    const ZETAS = new Int32Array(256);
    for (let i = 0; i < 256; i++) ZETAS[i] = powMod(ZETA, bitRev8(i), Q);
    
    function ntt(f) {
      const a = Int32Array.from(f);
      let k = 0;
      for (let len = 128; len >= 1; len >>= 1) {
        for (let start = 0; start < N; start += 2 * len) {
          const z = ZETAS[++k];
          for (let j = start; j < start + len; j++) {
            const t = mod(z * a[j + len], Q);
            a[j + len] = mod(a[j] - t, Q);
            a[j] = mod(a[j] + t, Q);
          }
        }
      }
      return a;
    }
    
    function nttInverse(fHat) {
      const a = Int32Array.from(fHat);
      let k = 256;
      for (let len = 1; len <= 128; len <<= 1) {
        for (let start = 0; start < N; start += 2 * len) {
          const z = ZETAS[--k];
          for (let j = start; j < start + len; j++) {
            const t = a[j];
            a[j] = mod(t + a[j + len], Q);
            a[j + len] = mod(z * mod(a[j + len] - t, Q), Q);
          }
        }
      }
      const invN = powMod(N, Q - 2, Q); // N^-1 mod Q
      for (let j = 0; j < N; j++) a[j] = mod(a[j] * invN, Q);
      return a;
    }
    
    // MultiplyNTT: since X^256+1 splits completely (256 distinct linear factors),
    // the NTT domain is literally 256 field evaluations, so multiplication there
    // is plain coordinatewise product — no base-case 2x2 multiply needed.
    function multiplyNTTs(aHat, bHat) {
      const c = new Int32Array(N);
      for (let i = 0; i < N; i++) c[i] = mod(aHat[i] * bHat[i], Q);
      return c;
    }
    
    function polyAdd(a, b) {
      const c = new Int32Array(N);
      for (let i = 0; i < N; i++) c[i] = (a[i] + b[i]) % Q;
      return c;
    }
    
    function polySub(a, b) {
      const c = new Int32Array(N);
      for (let i = 0; i < N; i++) c[i] = mod(a[i] - b[i], Q);
      return c;
    }
    
    // Schoolbook multiplication in Z_q[X]/(X^256+1). Not used by ML-DSA itself;
    // exported so tests can check the NTT path against a direct computation.
    function polyMulSchoolbook(a, b) {
      const c = new Int32Array(N);
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const prod = (a[i] * b[j]) % Q;
          const k = i + j;
          if (k < N) c[k] = (c[k] + prod) % Q;
          else c[k - N] = mod(c[k - N] - prod, Q);   // X^256 = -1
        }
      }
      return c;
    }
    
    // ---------------------------------------------------------------------------
    // Vector helpers (arrays of polynomials)
    // ---------------------------------------------------------------------------
    
    const vecNTT = (v) => v.map(ntt);
    const vecNTTInverse = (v) => v.map(nttInverse);
    const vecAdd = (a, b) => a.map((p, i) => polyAdd(p, b[i]));
    const vecSub = (a, b) => a.map((p, i) => polySub(p, b[i]));
    const vecNeg = (v) => v.map((p) => { const r = new Int32Array(N); for (let i = 0; i < N; i++) r[i] = mod(-p[i], Q); return r; });
    
    // (k x l) matrix (NTT domain) times l-vector (NTT domain) -> k-vector (NTT domain)
    function matVecMulNTT(A, vHat, k, l) {
      const out = [];
      for (let i = 0; i < k; i++) {
        let acc = new Int32Array(N);
        for (let j = 0; j < l; j++) acc = polyAdd(acc, multiplyNTTs(A[i][j], vHat[j]));
        out.push(acc);
      }
      return out;
    }
    
    // ---------------------------------------------------------------------------
    // Rounding: Power2Round, Decompose, HighBits/LowBits, MakeHint/UseHint
    // ---------------------------------------------------------------------------
    
    // Power2Round(r): r = r1*2^D + r0, r0 in (-2^(D-1), 2^(D-1)]. Exact integer
    // reconstruction always holds (no boundary special-case, unlike Decompose).
    function power2round(r) {
      const rPlus = mod(r, Q);
      const r0 = modPM(rPlus, 1 << D);
      const r1 = (rPlus - r0) / (1 << D);
      return [r1, r0];
    }
    
    // Decompose(r, gamma2): r = r1*(2*gamma2) + r0 (mod q) — boundary case wraps.
    function decompose(r, gamma2) {
      const rPlus = mod(r, Q);
      let r0 = modPM(rPlus, 2 * gamma2);
      let r1;
      if (rPlus - r0 === Q - 1) { r1 = 0; r0 = r0 - 1; }
      else { r1 = (rPlus - r0) / (2 * gamma2); }
      return [r1, r0];
    }
    
    function highBits(r, gamma2) { return decompose(r, gamma2)[0]; }
    function lowBits(r, gamma2) { return decompose(r, gamma2)[1]; }
    
    function makeHint(z, r, gamma2) {
      const r1 = highBits(r, gamma2);
      const v1 = highBits(mod(r + z, Q), gamma2);
      return r1 !== v1 ? 1 : 0;
    }
    
    function useHint(h, r, gamma2) {
      const m = (Q - 1) / (2 * gamma2);
      const [r1, r0] = decompose(r, gamma2);
      if (h === 1) {
        if (r0 > 0) return mod(r1 + 1, m);
        return mod(r1 - 1, m);
      }
      return r1;
    }
    
    function highBitsVec(v, gamma2) {
      return v.map((p) => { const r = new Int32Array(N); for (let i = 0; i < N; i++) r[i] = highBits(p[i], gamma2); return r; });
    }
    function lowBitsVec(v, gamma2) {
      return v.map((p) => { const r = new Int32Array(N); for (let i = 0; i < N; i++) r[i] = lowBits(p[i], gamma2); return r; });
    }
    function makeHintVec(zv, rv, gamma2) {
      return zv.map((zp, idx) => {
        const rp = rv[idx];
        const h = new Int32Array(N);
        for (let i = 0; i < N; i++) h[i] = makeHint(zp[i], rp[i], gamma2);
        return h;
      });
    }
    function useHintVec(hv, rv, gamma2) {
      return hv.map((hp, idx) => {
        const rp = rv[idx];
        const r = new Int32Array(N);
        for (let i = 0; i < N; i++) r[i] = useHint(hp[i], rp[i], gamma2);
        return r;
      });
    }
    
    function normInfPoly(p) {
      let m = 0;
      for (let i = 0; i < N; i++) { const c = Math.abs(modPM(p[i], Q)); if (c > m) m = c; }
      return m;
    }
    function normInfVec(v) {
      let m = 0;
      for (const p of v) { const n = normInfPoly(p); if (n > m) m = n; }
      return m;
    }
    function countOnesVec(v) {
      let c = 0;
      for (const p of v) for (let i = 0; i < N; i++) if (p[i]) c++;
      return c;
    }
    
    // ---------------------------------------------------------------------------
    // Bit packing (Algorithms SimpleBitPack/BitPack and their inverses)
    // ---------------------------------------------------------------------------
    
    // Pack N coefficients, each in [0, 2^bits - 1], `bits` bits apiece, LSB first.
    function simpleBitPack(f, bits) {
      const out = new Uint8Array(32 * bits); // 256*bits/8, always exact since 256/8=32
      let bitPos = 0;
      for (let i = 0; i < N; i++) {
        const v = f[i];
        for (let b = 0; b < bits; b++) {
          if ((v >> b) & 1) out[bitPos >> 3] |= 1 << (bitPos & 7);
          bitPos++;
        }
      }
      return out;
    }
    
    function simpleBitUnpack(bytes, bits) {
      const f = new Int32Array(N);
      let bitPos = 0;
      for (let i = 0; i < N; i++) {
        let v = 0;
        for (let b = 0; b < bits; b++) {
          const bit = (bytes[bitPos >> 3] >> (bitPos & 7)) & 1;
          v |= bit << b;
          bitPos++;
        }
        f[i] = v;
      }
      return f;
    }
    
    // Signed packing: coefficient w in [-(bound-off) .. off]-style ranges are
    // encoded as (offset - w) in [0, 2^bits - 1], the standard ML-DSA convention
    // for s1/s2 (offset=eta), t0 (offset=2^(D-1)) and z (offset=gamma1).
    function bitPackSigned(f, bits, offset) {
      const shifted = new Int32Array(N);
      for (let i = 0; i < N; i++) shifted[i] = offset - f[i];
      return simpleBitPack(shifted, bits);
    }
    function bitUnpackSigned(bytes, bits, offset) {
      const v = simpleBitUnpack(bytes, bits);
      const f = new Int32Array(N);
      for (let i = 0; i < N; i++) f[i] = offset - v[i];
      return f;
    }
    
    // HintEncode/HintDecode: omega positions (one byte each, run-length grouped
    // per polynomial) + k cumulative counts.
    function hintEncode(hVecs, k, omega) {
      const enc = new Uint8Array(omega + k);
      let index = 0;
      for (let i = 0; i < k; i++) {
        for (let j = 0; j < N; j++) {
          if (hVecs[i][j] !== 0) { enc[index] = j; index++; }
        }
        enc[omega + i] = index;
      }
      return enc;
    }
    function hintDecode(enc, k, omega) {
      if (enc.length !== omega + k) return null;
      const h = [];
      for (let i = 0; i < k; i++) h.push(new Int32Array(N));
      let index = 0;
      for (let i = 0; i < k; i++) {
        const yi = enc[omega + i];
        if (yi < index || yi > omega) return null;
        for (let j = index; j < yi; j++) {
          if (j > index && enc[j] <= enc[j - 1]) return null;
          h[i][enc[j]] = 1;
        }
        index = yi;
      }
      for (let j = index; j < omega; j++) if (enc[j] !== 0) return null;
      return h;
    }
    
    function w1Bits(gamma2) { return bitlen(Math.floor((Q - 1) / (2 * gamma2)) - 1); }
    function w1Encode(w1, gamma2) {
      const bits = w1Bits(gamma2);
      return concat(...w1.map((p) => simpleBitPack(p, bits)));
    }
    
    // ---------------------------------------------------------------------------
    // Sampling (ExpandA / ExpandS / ExpandMask / SampleInBall)
    // ---------------------------------------------------------------------------
    
    // RejNTTPoly: uniform rejection sampling of an NTT-domain polynomial from a
    // 34-byte seed via SHAKE128 — reads 3 bytes (24 bits) at a time, keeps a
    // 23-bit candidate if it is < Q. Mirrors ML-KEM's sampleNTT structure.
    function rejNTTPoly(rho, r, s) {
      const seed = new Uint8Array(34);
      seed.set(rho);
      seed[32] = s;
      seed[33] = r;
    
      const a = new Int32Array(N);
      let count = 0;
      let need = 168 * 3;
      let bytes = shake128(seed, need);
      let pos = 0;
    
      while (count < N) {
        if (pos + 3 > bytes.length) {
          need += 168 * 3;
          bytes = shake128(seed, need); // prefix-stable stream
        }
        const cand = bytes[pos] | (bytes[pos + 1] << 8) | ((bytes[pos + 2] & 0x7F) << 16);
        pos += 3;
        if (cand < Q) a[count++] = cand;
      }
      return a;
    }
    
    function expandA(rho, k, l) {
      const A = [];
      for (let r = 0; r < k; r++) {
        const row = [];
        for (let s = 0; s < l; s++) row.push(rejNTTPoly(rho, r, s));
        A.push(row);
      }
      return A;
    }
    
    // RejBoundedPoly: sample coefficients uniformly in [-eta, eta] from a SHAKE256
    // stream keyed on a 64-byte seed plus a 2-byte little-endian nonce.
    function rejBoundedPoly(seed64, nonce, eta) {
      const input = new Uint8Array(66);
      input.set(seed64);
      input[64] = nonce & 0xFF;
      input[65] = (nonce >> 8) & 0xFF;
    
      const a = new Int32Array(N);
      let count = 0;
      let need = 136 * 2;
      let bytes = shake256(input, need);
      let pos = 0;
    
      while (count < N) {
        if (pos >= bytes.length) {
          need += 136 * 2;
          bytes = shake256(input, need);
        }
        const byte = bytes[pos++];
        const t0 = byte & 0x0F, t1 = byte >> 4;
        if (eta === 2) {
          if (t0 < 15 && count < N) a[count++] = 2 - (t0 % 5);
          if (t1 < 15 && count < N) a[count++] = 2 - (t1 % 5);
        } else { // eta === 4
          if (t0 < 9 && count < N) a[count++] = 4 - t0;
          if (t1 < 9 && count < N) a[count++] = 4 - t1;
        }
      }
      return a;
    }
    
    function expandS(rhoPrime, k, l, eta) {
      const s1 = [], s2 = [];
      let nonce = 0;
      for (let i = 0; i < l; i++) s1.push(rejBoundedPoly(rhoPrime, nonce++, eta));
      for (let i = 0; i < k; i++) s2.push(rejBoundedPoly(rhoPrime, nonce++, eta));
      return { s1, s2 };
    }
    
    // ExpandMask: sample y coefficients in (-gamma1, gamma1] directly (2*gamma1
    // is a power of 2, so this is a direct bit-unpack, no rejection needed).
    function expandMaskPoly(rhoDoublePrime, nonce, gamma1, bits) {
      const input = new Uint8Array(66);
      input.set(rhoDoublePrime);
      input[64] = nonce & 0xFF;
      input[65] = (nonce >> 8) & 0xFF;
      const need = 32 * bits;
      const bytes = shake256(input, need);
      const v = simpleBitUnpack(bytes, bits);
      const f = new Int32Array(N);
      for (let i = 0; i < N; i++) f[i] = gamma1 - v[i];
      return f;
    }
    function expandMask(rhoDoublePrime, kappa, l, gamma1) {
      const bits = bitlen(2 * gamma1 - 1);
      const y = [];
      for (let i = 0; i < l; i++) y.push(expandMaskPoly(rhoDoublePrime, kappa + i, gamma1, bits));
      return y;
    }
    
    // SampleInBall: challenge polynomial with exactly tau coefficients in {-1,1},
    // the rest 0, derived via a Fisher-Yates-style shuffle seeded from cTilde.
    function sampleInBall(cTilde, tau) {
      const c = new Int32Array(N);
      let need = 8 + 136;
      let bytes = shake256(cTilde, need);
      let signs = 0n;
      for (let i = 0; i < 8; i++) signs |= BigInt(bytes[i]) << BigInt(8 * i);
      let pos = 8;
    
      for (let i = N - tau; i < N; i++) {
        let b;
        for (;;) {
          if (pos >= bytes.length) { need += 136; bytes = shake256(cTilde, need); }
          b = bytes[pos++];
          if (b <= i) break;
        }
        c[i] = c[b];
        c[b] = (signs & 1n) ? -1 : 1;
        signs >>= 1n;
      }
      return c;
    }
    
    // ---------------------------------------------------------------------------
    // Parameter sets (FIPS 204 Table 1) with a self-check that beta == tau*eta,
    // so a transcription typo cannot silently corrupt the rejection bound.
    // ---------------------------------------------------------------------------
    
    const PARAMS = {
      'ML-DSA-44': { k: 4, l: 4, eta: 2, tau: 39, lambda: 128, gamma1: 1 << 17, gamma2: Math.floor((Q - 1) / 88), omega: 80, beta: 78 },
      'ML-DSA-65': { k: 6, l: 5, eta: 4, tau: 49, lambda: 192, gamma1: 1 << 19, gamma2: Math.floor((Q - 1) / 32), omega: 55, beta: 196 },
      'ML-DSA-87': { k: 8, l: 7, eta: 2, tau: 60, lambda: 256, gamma1: 1 << 19, gamma2: Math.floor((Q - 1) / 32), omega: 75, beta: 120 },
    };
    for (const [name, p] of Object.entries(PARAMS)) {
      if (p.beta !== p.tau * p.eta) throw new Error(`${name}: beta != tau*eta`);
    }
    
    function polyBytes(bits) { return 32 * bits; }
    
    function pkLength(prm) { return 32 + prm.k * polyBytes(10); }
    function skLength(prm) {
      const etaBits = bitlen(2 * prm.eta);
      return 32 + 32 + 64 + (prm.l + prm.k) * polyBytes(etaBits) + prm.k * polyBytes(D);
    }
    function sigLength(prm) {
      const zBits = bitlen(2 * prm.gamma1 - 1);
      return (prm.lambda / 4) + prm.l * polyBytes(zBits) + prm.omega + prm.k;
    }
    
    // ---------------------------------------------------------------------------
    // Encoding: pk = rho || t1 ; sk = rho || K || tr || s1 || s2 || t0 ;
    // sig = cTilde || z || h
    // ---------------------------------------------------------------------------
    
    function pkEncode(rho, t1, prm) {
      return concat(rho, ...t1.map((p) => simpleBitPack(p, 10)));
    }
    function pkDecode(pk, prm) {
      if (pk.length !== pkLength(prm)) throw new Error('pkDecode: bad length');
      const rho = pk.slice(0, 32);
      const t1 = [];
      let off = 32;
      const pb = polyBytes(10);
      for (let i = 0; i < prm.k; i++) { t1.push(simpleBitUnpack(pk.slice(off, off + pb), 10)); off += pb; }
      return { rho, t1 };
    }
    
    function skEncode(rho, K, tr, s1, s2, t0, prm) {
      const etaBits = bitlen(2 * prm.eta);
      const s1b = s1.map((p) => bitPackSigned(p, etaBits, prm.eta));
      const s2b = s2.map((p) => bitPackSigned(p, etaBits, prm.eta));
      const t0b = t0.map((p) => bitPackSigned(p, D, 1 << (D - 1)));
      return concat(rho, K, tr, ...s1b, ...s2b, ...t0b);
    }
    function skDecode(sk, prm) {
      if (sk.length !== skLength(prm)) throw new Error('skDecode: bad length');
      const etaBits = bitlen(2 * prm.eta);
      const etaPB = polyBytes(etaBits);
      const t0PB = polyBytes(D);
      let off = 0;
      const rho = sk.slice(0, 32); off += 32;
      const K = sk.slice(off, off + 32); off += 32;
      const tr = sk.slice(off, off + 64); off += 64;
      const s1 = [];
      for (let i = 0; i < prm.l; i++) { s1.push(bitUnpackSigned(sk.slice(off, off + etaPB), etaBits, prm.eta)); off += etaPB; }
      const s2 = [];
      for (let i = 0; i < prm.k; i++) { s2.push(bitUnpackSigned(sk.slice(off, off + etaPB), etaBits, prm.eta)); off += etaPB; }
      const t0 = [];
      for (let i = 0; i < prm.k; i++) { t0.push(bitUnpackSigned(sk.slice(off, off + t0PB), D, 1 << (D - 1))); off += t0PB; }
      return { rho, K, tr, s1, s2, t0 };
    }
    
    function sigEncode(cTilde, z, h, prm) {
      const zBits = bitlen(2 * prm.gamma1 - 1);
      const zb = z.map((p) => bitPackSigned(p, zBits, prm.gamma1));
      const hb = hintEncode(h, prm.k, prm.omega);
      return concat(cTilde, ...zb, hb);
    }
    function sigDecode(sig, prm) {
      if (sig.length !== sigLength(prm)) return null;
      const zBits = bitlen(2 * prm.gamma1 - 1);
      const zPB = polyBytes(zBits);
      const ctLen = prm.lambda / 4;
      let off = 0;
      const cTilde = sig.slice(0, ctLen); off = ctLen;
      const z = [];
      for (let i = 0; i < prm.l; i++) { z.push(bitUnpackSigned(sig.slice(off, off + zPB), zBits, prm.gamma1)); off += zPB; }
      const hb = sig.slice(off, off + prm.omega + prm.k);
      const h = hintDecode(hb, prm.k, prm.omega);
      if (h === null) return null;
      return { cTilde, z, h };
    }
    
    // ---------------------------------------------------------------------------
    // ML-DSA internal algorithms (KeyGen_internal, Sign_internal, Verify_internal)
    // ---------------------------------------------------------------------------
    
    function keygenInternal(xi, paramName) {
      const prm = PARAMS[paramName];
      // Domain-separate by (k,l) so the same seed under different parameter sets
      // cannot yield related keys — mirrors ML-KEM's kpkeKeyGen appending k.
      const expanded = shake256(concat(xi, new Uint8Array([prm.k, prm.l])), 128);
      const rho = expanded.slice(0, 32);
      const rhoPrime = expanded.slice(32, 96);
      const K = expanded.slice(96, 128);
    
      const A = expandA(rho, prm.k, prm.l);
      const { s1, s2 } = expandS(rhoPrime, prm.k, prm.l, prm.eta);
      const s1Hat = vecNTT(s1);
    
      const t = vecAdd(vecNTTInverse(matVecMulNTT(A, s1Hat, prm.k, prm.l)), s2);
      const t1 = [], t0 = [];
      for (const p of t) {
        const p1 = new Int32Array(N), p0 = new Int32Array(N);
        for (let i = 0; i < N; i++) { const [hi, lo] = power2round(p[i]); p1[i] = hi; p0[i] = lo; }
        t1.push(p1); t0.push(p0);
      }
    
      const pk = pkEncode(rho, t1, prm);
      const tr = shake256(pk, 64);
      const sk = skEncode(rho, K, tr, s1, s2, t0, prm);
      return { publicKey: pk, privateKey: sk };
    }
    
    function signInternal(sk, message, rnd, paramName) {
      const prm = PARAMS[paramName];
      const { rho, K, tr, s1, s2, t0 } = skDecode(sk, prm);
      const s1Hat = vecNTT(s1), s2Hat = vecNTT(s2), t0Hat = vecNTT(t0);
    
      const Mprime = concat(new Uint8Array([0, 0]), message); // domain=0 (pure), ctx-len=0 (empty ctx)
      const mu = shake256(concat(tr, Mprime), 64);
      const rhoDoublePrime = shake256(concat(K, rnd, mu), 64);
      const A = expandA(rho, prm.k, prm.l);
    
      let kappa = 0;
      let result = null;
      const MAX_ATTEMPTS = 1000;
    
      for (let attempt = 0; attempt < MAX_ATTEMPTS && !result; attempt++) {
        const y = expandMask(rhoDoublePrime, kappa, prm.l, prm.gamma1);
        const w = vecNTTInverse(matVecMulNTT(A, vecNTT(y), prm.k, prm.l));
        const w1 = highBitsVec(w, prm.gamma2);
        const cTilde = shake256(concat(mu, w1Encode(w1, prm.gamma2)), prm.lambda / 4);
        const c = sampleInBall(cTilde, prm.tau);
        const cHat = ntt(c);
    
        const cs1 = vecNTTInverse(s1Hat.map((p) => multiplyNTTs(cHat, p)));
        const cs2 = vecNTTInverse(s2Hat.map((p) => multiplyNTTs(cHat, p)));
    
        const zCand = vecAdd(y, cs1);
        const wMinusCs2 = vecSub(w, cs2);
        const r0 = lowBitsVec(wMinusCs2, prm.gamma2);
    
        kappa += prm.l;
    
        if (normInfVec(zCand) >= prm.gamma1 - prm.beta) continue;
        if (normInfVec(r0) >= prm.gamma2 - prm.beta) continue;
    
        const ct0 = vecNTTInverse(t0Hat.map((p) => multiplyNTTs(cHat, p)));
        if (normInfVec(ct0) >= prm.gamma2) continue;
    
        const hCand = makeHintVec(vecNeg(ct0), vecAdd(wMinusCs2, ct0), prm.gamma2);
        if (countOnesVec(hCand) > prm.omega) continue;
    
        const z = zCand.map((p) => { const r = new Int32Array(N); for (let i = 0; i < N; i++) r[i] = modPM(p[i], Q); return r; });
        result = sigEncode(cTilde, z, hCand, prm);
      }
    
      if (!result) throw new Error('ML-DSA sign: exceeded max rejection attempts');
      return result;
    }
    
    function verifyInternal(pk, message, sig, paramName) {
      const prm = PARAMS[paramName];
      if (pk.length !== pkLength(prm)) return false;
      if (sig.length !== sigLength(prm)) return false;
    
      const { rho, t1 } = pkDecode(pk, prm);
      const parsedSig = sigDecode(sig, prm);
      if (parsedSig === null) return false;
      const { cTilde, z, h } = parsedSig;
    
      if (normInfVec(z) >= prm.gamma1 - prm.beta) return false;
      if (countOnesVec(h) > prm.omega) return false;
    
      const tr = shake256(pk, 64);
      const Mprime = concat(new Uint8Array([0, 0]), message);
      const mu = shake256(concat(tr, Mprime), 64);
    
      const A = expandA(rho, prm.k, prm.l);
      const c = sampleInBall(cTilde, prm.tau);
      const cHat = ntt(c);
    
      const AzHat = matVecMulNTT(A, vecNTT(z), prm.k, prm.l);
      const t1Shifted = t1.map((p) => { const r = new Int32Array(N); for (let i = 0; i < N; i++) r[i] = mod(p[i] * (1 << D), Q); return r; });
      const ct1Hat = vecNTT(t1Shifted).map((p) => multiplyNTTs(cHat, p));
    
      const wApprox = vecNTTInverse(AzHat.map((p, i) => polySub(p, ct1Hat[i])));
      const w1p = useHintVec(h, wApprox, prm.gamma2);
      const cTildePrime = shake256(concat(mu, w1Encode(w1p, prm.gamma2)), prm.lambda / 4);
    
      return eqBytes(cTilde, cTildePrime);
    }
    
    // ---------------------------------------------------------------------------
    // Public API. Randomness is supplied entirely by the caller — nothing here
    // reaches for an ambient entropy source — so every operation is reproducible.
    // ---------------------------------------------------------------------------
    
    function mldsaKeygen(seed32, paramName = 'ML-DSA-44') {
      if (!PARAMS[paramName]) throw new Error(`unknown parameter set "${paramName}"`);
      if (seed32.length !== 32) throw new Error('keygen requires a 32-byte seed');
      return keygenInternal(seed32, paramName);
    }
    
    function mldsaSign(privateKey, message, rnd32, paramName = 'ML-DSA-44') {
      if (!PARAMS[paramName]) throw new Error(`unknown parameter set "${paramName}"`);
      if (rnd32.length !== 32) throw new Error('sign requires a 32-byte rnd');
      return signInternal(privateKey, toBytes(message), rnd32, paramName);
    }
    
    function mldsaVerify(publicKey, message, signature, paramName = 'ML-DSA-44') {
      if (!PARAMS[paramName]) throw new Error(`unknown parameter set "${paramName}"`);
      try {
        return verifyInternal(publicKey, toBytes(message), signature, paramName);
      } catch {
        return false;
      }
    }
    
    return { ntt: ntt, nttInverse: nttInverse, multiplyNTTs: multiplyNTTs, polyMulSchoolbook: polyMulSchoolbook, power2round: power2round, decompose: decompose, mldsaKeygen: mldsaKeygen, mldsaSign: mldsaSign, mldsaVerify: mldsaVerify, PARAMS: PARAMS };
  })();
  exportsMap["ntt"] = mod_mldsa.ntt;
  exportsMap["nttInverse"] = mod_mldsa.nttInverse;
  exportsMap["multiplyNTTs"] = mod_mldsa.multiplyNTTs;
  exportsMap["polyMulSchoolbook"] = mod_mldsa.polyMulSchoolbook;
  exportsMap["power2round"] = mod_mldsa.power2round;
  exportsMap["decompose"] = mod_mldsa.decompose;
  exportsMap["mldsaKeygen"] = mod_mldsa.mldsaKeygen;
  exportsMap["mldsaSign"] = mod_mldsa.mldsaSign;
  exportsMap["mldsaVerify"] = mod_mldsa.mldsaVerify;
  exportsMap["PARAMS"] = mod_mldsa.PARAMS;
  // ---- ecdsa.mjs ----
  var mod_ecdsa = (function() {
    // From-scratch ECDSA (FIPS 186-4 appendix D.1.2 / SEC1 v2.0) over the NIST
    // short-Weierstrass curves P-256 (secp256r1) and P-384 (secp384r1).
    // Pure JS BigInt field arithmetic, Jacobian-coordinate point arithmetic,
    // RFC 6979 deterministic nonce generation via an HMAC construction built
    // here on top of ./sha256.mjs. No external crypto library, no WebCrypto,
    // no node:crypto (that's for *.test.mjs only, as an independent yardstick).
    //
    // Spec references:
    //   FIPS 186-4  Appendix D.1.2  -- curve domain parameters
    //   SEC 1 v2.0  section 2.2.1   -- Jacobian coordinate arithmetic
    //   SEC 1 v2.0  section 2.3     -- point-to-octet-string encoding
    //   SEC 1 v2.0  section 4.1     -- ECDSA sign / verify
    //   RFC 6979                    -- deterministic nonce generation (HMAC-DRBG)
    //   RFC 6979 section 2.4        -- ECDSA-Sig-Value DER (SEQUENCE of two INTEGERs)
    //
    // Both NIST curves use a = -3 (mod p), which is what the doubling formula
    // below is specialized for -- this is the standard NIST/SEC1 choice, made
    // because it lets point doubling use a cheaper formula than a general `a`.
    //
    // Design note on hashing: RFC 6979 nonce generation uses HMAC-SHA-256
    // uniformly for BOTH curves, per this project's explicit instruction
    // ("HMAC-SHA-256 is strongly preferred"). The generic RFC 6979 bit-generator
    // (see rfc6979GenerateK below) handles hlen < qlen by looping -- this is
    // explicitly provided for in RFC 6979 section 3.2 step (h.2), so driving a
    // 384-bit nonce off a 256-bit HMAC is spec-legal, just two HMAC calls
    // instead of one. The message digest actually signed ("z" in FIPS 186-4)
    // uses the curve-appropriate hash: SHA-256 for P-256, SHA-384 for P-384
    // (imported from ./sha512.mjs, which exists in this tree). The RFC 6979
    // "h1 = H(m)" fed into the nonce generator is that same curve-appropriate
    // digest (so the nonce is bound to the exact bytes being signed), while the
    // HMAC engine expanding it into k bits is SHA-256 throughout. This is a
    // documented, deliberate deviation from pedantic RFC 6979 (which ties the
    // nonce-generator's internal hash to the message-digest hash); it does not
    // weaken determinism (still fully deterministic, still seeded by both the
    // private key and the message digest) or introduce caller-supplied
    // randomness -- it only means P-384's nonce entropy is expanded through a
    // 256-bit-wide HMAC instead of a 384-bit-wide one.
    //
    // Constant-time-shaped scalar multiplication: the ladder in scalarMul below
    // performs exactly one point addition and one point doubling per scalar
    // bit, unconditionally, and only the bookkeeping of which of the two
    // ladder registers receives which precomputed result depends on the bit
    // (the same shape used for the X25519-style ladder in ed25519.mjs elsewhere
    // in this codebase). This is "constant-time-shaped": the sequence and count
    // of field/curve operations executed never depends on secret bits. It is
    // NOT a hardware/timing side-channel guarantee -- pure JS running on a
    // JIT with BigInt, GC, and no control over the compiler cannot promise
    // that. Within that ladder, the Jacobian point-addition formula (add-2007-bl)
    // is the standard (non-"complete") formula: it defensively branches to
    // return the mathematically correct result when handed the identity, two
    // equal points, or a point and its negation, because the explicit point-
    // arithmetic-identity tests in ecdsa.test.mjs call it directly with exactly
    // such inputs (P + (-P), 2P vs P+P) and correctness there is mandatory, not
    // optional. Inside the ladder itself those degenerate cases are not reached
    // through the "equal points" path (the ladder's invariant R1 - R0 = fixed
    // input point holds throughout, so the two operands handed to the add step
    // are never equal), and reaching the "point equals its own negation" path
    // would require an astronomically specific relationship between the secret
    // scalar prefix and the base point's order. This residual is the same
    // known, explicitly-flagged limitation shared by most EC implementations
    // that use the classical Jacobian formulas instead of a fully "complete"
    // addition law (Renes-Costello-Batina) -- it is called out here rather than
    // silently assumed away.
    
    
    
    // ---------------------------------------------------------------------------
    // Prime-field arithmetic mod p, generic over the field prime.
    // Inverse via Fermat's little theorem (p prime for both curves): a^(p-2).
    // The exponent (p-2) is a fixed public constant, so the square-and-multiply
    // loop's branch pattern depends only on public bits, never on the secret
    // base being inverted -- i.e. it does not branch on secret data, even
    // though it is a plain square-and-multiply rather than a specialized
    // constant-time ladder.
    // ---------------------------------------------------------------------------
    
    function makeField(p) {
      const mod = (a) => { const r = a % p; return r < 0n ? r + p : r; };
      const add = (a, b) => mod(a + b);
      const sub = (a, b) => mod(a - b);
      const mul = (a, b) => mod(a * b);
      function pow(a, e) {
        let r = 1n, b = mod(a), x = e;
        while (x > 0n) {
          if (x & 1n) r = mod(r * b);
          b = mod(b * b);
          x >>= 1n;
        }
        return r;
      }
      const inv = (a) => pow(a, p - 2n); // Fermat's little theorem
      const sqrt = (a) => pow(a, (p + 1n) / 4n); // valid since p == 3 (mod 4) for both curves
      return { p, mod, add, sub, mul, pow, inv, sqrt };
    }
    
    // ---------------------------------------------------------------------------
    // Byte <-> BigInt helpers (big-endian, fixed width)
    // ---------------------------------------------------------------------------
    
    function bytesToBig(bytes) {
      let v = 0n;
      for (let i = 0; i < bytes.length; i++) v = (v << 8n) | BigInt(bytes[i]);
      return v;
    }
    
    function bigToBytes(v, width) {
      const out = new Uint8Array(width);
      let x = v;
      for (let i = width - 1; i >= 0; i--) { out[i] = Number(x & 0xffn); x >>= 8n; }
      return out;
    }
    
    function concatBytes(...arrs) {
      let n = 0;
      for (const a of arrs) n += a.length;
      const out = new Uint8Array(n);
      let o = 0;
      for (const a of arrs) { out.set(a, o); o += a.length; }
      return out;
    }
    
    // ---------------------------------------------------------------------------
    // Curve parameters (FIPS 186-4 Appendix D.1.2 / SEC1 recommended curves).
    // a = -3 (mod p) for both. Cofactor h = 1 for both, so the curve's full
    // point order equals n (prime) -- consequently neither curve has any point
    // of order 2 (2 does not divide the prime n), so point doubling never needs
    // to special-case Y = 0 for a point actually on the curve.
    // ---------------------------------------------------------------------------
    
    function defineCurve({ name, pHex, bHex, gxHex, gyHex, nHex, byteLen }) {
      const p = BigInt('0x' + pHex);
      const b = BigInt('0x' + bHex);
      const a = p - 3n; // a = -3 mod p
      const n = BigInt('0x' + nHex);
      const F = makeField(p);
      const Gx = BigInt('0x' + gxHex);
      const Gy = BigInt('0x' + gyHex);
      const G = [Gx, Gy, 1n]; // Jacobian, Z=1
      return { name, p, a, b, n, F, Gx, Gy, G, byteLen };
    }
    
    const P256 = defineCurve({
      name: 'P-256',
      byteLen: 32,
      pHex: 'FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF',
      bHex: '5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B',
      gxHex: '6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296',
      gyHex: '4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5',
      nHex: 'FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551',
    });
    
    const P384 = defineCurve({
      name: 'P-384',
      byteLen: 48,
      pHex: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF',
      bHex: 'B3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF',
      gxHex: 'AA87CA22BE8B05378EB1C71EF320AD746E1D3B628BA79B9859F741E082542A385502F25DBF55296C3A545E3872760AB7',
      gyHex: '3617DE4A96262C6F5D9E98BF9292DC29F8F41DBD289A147CE9DA3113B5F0B8C00A60B1CE1D7E819D7A431D7C90EA0E5F',
      nHex: 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973',
    });
    
    const CURVES = { 'P-256': P256, 'P-384': P384 };
    
    function getCurve(curveName) {
      const c = CURVES[curveName];
      if (!c) throw new Error(`unknown curve "${curveName}" (expected 'P-256' or 'P-384')`);
      return c;
    }
    
    // ---------------------------------------------------------------------------
    // Jacobian point arithmetic: (X, Y, Z) represents affine (X/Z^2, Y/Z^3).
    // Identity (point at infinity) is any point with Z = 0; we normalize to
    // (1, 1, 0). Formulas specialized for a = -3, matching both NIST curves.
    // ---------------------------------------------------------------------------
    
    const isInfinity = (Pt) => Pt[2] === 0n;
    const INFINITY = [1n, 1n, 0n];
    
    // dbl-2001-b (Bernstein/Lange), specialized for a = -3.
    function pointDouble(Pt, F) {
      if (isInfinity(Pt)) return INFINITY;
      const [X1, Y1, Z1] = Pt;
      const { mul, sub, add } = F;
      const delta = mul(Z1, Z1);
      const gamma = mul(Y1, Y1);
      const beta = mul(X1, gamma);
      const alpha = mul(3n, mul(sub(X1, delta), add(X1, delta)));
      const X3 = sub(mul(alpha, alpha), mul(8n, beta));
      const Z3 = sub(sub(mul(add(Y1, Z1), add(Y1, Z1)), gamma), delta);
      const Y3 = sub(mul(alpha, sub(mul(4n, beta), X3)), mul(8n, mul(gamma, gamma)));
      return [X3, Y3, Z3];
    }
    
    // add-2007-bl (Bernstein/Lange), general Jacobian addition, with explicit
    // dispatch for the identity / equal-points / negated-points degenerate
    // cases (see file header for why these branches are here and why the
    // ladder below does not exercise the "equal points" one).
    function pointAdd(P1, P2, F) {
      if (isInfinity(P1)) return P2;
      if (isInfinity(P2)) return P1;
      const [X1, Y1, Z1] = P1;
      const [X2, Y2, Z2] = P2;
      const { mul, sub, add } = F;
    
      const Z1Z1 = mul(Z1, Z1);
      const Z2Z2 = mul(Z2, Z2);
      const U1 = mul(X1, Z2Z2);
      const U2 = mul(X2, Z1Z1);
      const S1 = mul(mul(Y1, Z2), Z2Z2);
      const S2 = mul(mul(Y2, Z1), Z1Z1);
    
      if (U1 === U2) {
        if (S1 !== S2) return INFINITY;      // P1 == -P2
        return pointDouble(P1, F);           // P1 == P2
      }
    
      const H = sub(U2, U1);
      const I = mul(mul(2n, H), mul(2n, H));
      const J = mul(H, I);
      const r = mul(2n, sub(S2, S1));
      const V = mul(U1, I);
      const X3 = sub(sub(mul(r, r), J), mul(2n, V));
      const Y3 = sub(mul(r, sub(V, X3)), mul(2n, mul(S1, J)));
      const Z3sq = sub(sub(mul(add(Z1, Z2), add(Z1, Z2)), Z1Z1), Z2Z2);
      const Z3 = mul(Z3sq, H);
      return [X3, Y3, Z3];
    }
    
    function pointEqual(P1, P2, F) {
      if (isInfinity(P1) && isInfinity(P2)) return true;
      if (isInfinity(P1) || isInfinity(P2)) return false;
      const [X1, Y1, Z1] = P1;
      const [X2, Y2, Z2] = P2;
      const { mul } = F;
      const Z1Z1 = mul(Z1, Z1), Z2Z2 = mul(Z2, Z2);
      return mul(X1, Z2Z2) === mul(X2, Z1Z1) && mul(mul(Y1, Z2), Z2Z2) === mul(mul(Y2, Z1), Z1Z1);
    }
    
    // Constant-time-shaped Montgomery ladder (see file header). One add + one
    // double every iteration regardless of the bit; only which ladder register
    // ends up holding which precomputed result depends on the bit value.
    function scalarMul(k, Pt, curve) {
      const { F, n } = curve;
      k = ((k % n) + n) % n;
      let R0 = INFINITY;
      let R1 = Pt;
      const bitLen = curve.byteLen * 8;
      for (let i = bitLen - 1; i >= 0; i--) {
        const bit = (k >> BigInt(i)) & 1n;
        const A = bit === 1n ? R1 : R0;
        const B = bit === 1n ? R0 : R1;
        const sum = pointAdd(A, B, F);
        const dbl = pointDouble(A, F);
        if (bit === 1n) { R1 = dbl; R0 = sum; } else { R0 = dbl; R1 = sum; }
      }
      return R0;
    }
    
    function toAffine(Pt, F) {
      if (isInfinity(Pt)) return null;
      const [X, Y, Z] = Pt;
      const zi = F.inv(Z);
      const zi2 = F.mul(zi, zi);
      const zi3 = F.mul(zi2, zi);
      return [F.mul(X, zi2), F.mul(Y, zi3)];
    }
    
    // y^2 == x^3 + a*x + b (mod p)
    function isOnCurve([x, y], curve) {
      const { F, a, b } = curve;
      const lhs = F.mul(y, y);
      const rhs = F.add(F.add(F.mul(F.mul(x, x), x), F.mul(a, x)), b);
      return lhs === rhs;
    }
    
    // ---------------------------------------------------------------------------
    // Point encoding / decoding (SEC1 section 2.3)
    // ---------------------------------------------------------------------------
    
    // Uncompressed (0x04 || X || Y) or compressed (0x02/0x03 || X) form.
    function encodePoint(Pt, curve, compressed) {
      const affine = toAffine(Pt, curve.F);
      if (!affine) throw new Error('cannot encode point at infinity');
      const [x, y] = affine;
      const xb = bigToBytes(x, curve.byteLen);
      if (!compressed) {
        return concatBytes(Uint8Array.of(0x04), xb, bigToBytes(y, curve.byteLen));
      }
      return concatBytes(Uint8Array.of((y & 1n) === 0n ? 0x02 : 0x03), xb);
    }
    
    // Returns Jacobian point (Z=1) or throws on invalid encoding / off-curve point.
    function decodePoint(bytes, curve) {
      const { F, byteLen } = curve;
      if (bytes.length === 2 * byteLen + 1 && bytes[0] === 0x04) {
        const x = bytesToBig(bytes.slice(1, 1 + byteLen));
        const y = bytesToBig(bytes.slice(1 + byteLen, 1 + 2 * byteLen));
        if (x >= F.p || y >= F.p) throw new Error('coordinate out of range');
        const Pt = [x, y, 1n];
        if (!isOnCurve([x, y], curve)) throw new Error('point not on curve');
        return Pt;
      }
      if (bytes.length === byteLen + 1 && (bytes[0] === 0x02 || bytes[0] === 0x03)) {
        const x = bytesToBig(bytes.slice(1, 1 + byteLen));
        if (x >= F.p) throw new Error('coordinate out of range');
        const rhs = F.add(F.add(F.mul(F.mul(x, x), x), F.mul(curve.a, x)), curve.b);
        let y = F.sqrt(rhs);
        if (F.mul(y, y) !== rhs) throw new Error('x is not on curve (no square root)');
        const wantOdd = bytes[0] === 0x03;
        if ((y & 1n) !== (wantOdd ? 1n : 0n)) y = F.sub(0n, y);
        return [x, y, 1n];
      }
      throw new Error('invalid point encoding length/tag');
    }
    
    // ---------------------------------------------------------------------------
    // HMAC, built from scratch on top of ./sha256.mjs (block size 64 bytes,
    // output 32 bytes) -- FIPS 198-1.
    // ---------------------------------------------------------------------------
    
    const SHA256_BLOCK = 64;
    
    function hmacSha256(key, msg) {
      if (key.length > SHA256_BLOCK) key = sha256(key);
      const k = new Uint8Array(SHA256_BLOCK);
      k.set(key);
      const ipad = new Uint8Array(SHA256_BLOCK);
      const opad = new Uint8Array(SHA256_BLOCK);
      for (let i = 0; i < SHA256_BLOCK; i++) { ipad[i] = k[i] ^ 0x36; opad[i] = k[i] ^ 0x5c; }
      const inner = sha256(concatBytes(ipad, msg));
      return sha256(concatBytes(opad, inner));
    }
    
    // ---------------------------------------------------------------------------
    // RFC 6979 deterministic nonce generation (HMAC-DRBG), generic over the
    // group order n / its byte length rlen, driven by hmacSha256 throughout
    // (see file header for why). h1Bytes is the message-digest bytes (curve-
    // appropriate hash of the message) to bind the nonce to.
    // ---------------------------------------------------------------------------
    
    function bits2int(bytes, qlenBits) {
      let v = bytesToBig(bytes);
      const blen = bytes.length * 8;
      if (blen > qlenBits) v >>= BigInt(blen - qlenBits);
      return v;
    }
    
    function int2octets(v, rlen) { return bigToBytes(v, rlen); }
    
    function bits2octets(bytes, n, qlenBits, rlen) {
      const z1 = bits2int(bytes, qlenBits) % n;
      return int2octets(z1, rlen);
    }
    
    function rfc6979GenerateK(curve, privateScalar, h1Bytes, isValidCandidate) {
      const { n, byteLen: rlen } = curve;
      const qlenBits = rlen * 8;
      const xOctets = int2octets(privateScalar, rlen);
      const h1Octets = bits2octets(h1Bytes, n, qlenBits, rlen);
    
      let V = new Uint8Array(32).fill(0x01);
      let K = new Uint8Array(32).fill(0x00);
      K = hmacSha256(K, concatBytes(V, Uint8Array.of(0x00), xOctets, h1Octets));
      V = hmacSha256(K, V);
      K = hmacSha256(K, concatBytes(V, Uint8Array.of(0x01), xOctets, h1Octets));
      V = hmacSha256(K, V);
    
      for (;;) {
        let T = new Uint8Array(0);
        while (T.length * 8 < qlenBits) {
          V = hmacSha256(K, V);
          T = concatBytes(T, V);
        }
        const k = bits2int(T, qlenBits);
        if (k >= 1n && k < n && isValidCandidate(k)) return k;
        K = hmacSha256(K, concatBytes(V, Uint8Array.of(0x00)));
        V = hmacSha256(K, V);
      }
    }
    
    // ---------------------------------------------------------------------------
    // DER encoding for ECDSA-Sig-Value ::= SEQUENCE { r INTEGER, s INTEGER }
    // (RFC 6979 section 2.4 / X9.62). Handles both short- and long-form DER
    // lengths for generality, though r/s for these two curves never exceed 49
    // content bytes, so short form (< 0x80) always suffices in practice.
    // ---------------------------------------------------------------------------
    
    function derLen(n) {
      if (n < 0x80) return Uint8Array.of(n);
      const bytes = [];
      let x = n;
      while (x > 0) { bytes.unshift(x & 0xff); x >>= 8; }
      return Uint8Array.of(0x80 | bytes.length, ...bytes);
    }
    
    function derInteger(v) {
      let bytes;
      if (v === 0n) { bytes = Uint8Array.of(0); }
      else {
        const hex = v.toString(16);
        const hexPadded = hex.length % 2 ? '0' + hex : hex;
        bytes = new Uint8Array(().match(/.{2}/g).map(function(h){return parseInt(h,16);}));
        if (bytes[0] & 0x80) bytes = concatBytes(Uint8Array.of(0x00), bytes);
      }
      return concatBytes(Uint8Array.of(0x02), derLen(bytes.length), bytes);
    }
    
    function encodeDER(r, s) {
      const body = concatBytes(derInteger(r), derInteger(s));
      return concatBytes(Uint8Array.of(0x30), derLen(body.length), body);
    }
    
    function readDerLen(bytes, offset) {
      const first = bytes[offset];
      if ((first & 0x80) === 0) return { len: first, next: offset + 1 };
      const numBytes = first & 0x7f;
      let len = 0;
      for (let i = 0; i < numBytes; i++) len = (len << 8) | bytes[offset + 1 + i];
      return { len, next: offset + 1 + numBytes };
    }
    
    function decodeDER(bytes) {
      if (bytes[0] !== 0x30) throw new Error('not a DER SEQUENCE');
      let { next } = readDerLen(bytes, 1);
      if (bytes[next] !== 0x02) throw new Error('expected INTEGER (r)');
      const rLenInfo = readDerLen(bytes, next + 1);
      const rBytes = bytes.slice(rLenInfo.next, rLenInfo.next + rLenInfo.len);
      let o = rLenInfo.next + rLenInfo.len;
      if (bytes[o] !== 0x02) throw new Error('expected INTEGER (s)');
      const sLenInfo = readDerLen(bytes, o + 1);
      const sBytes = bytes.slice(sLenInfo.next, sLenInfo.next + sLenInfo.len);
      return { r: bytesToBig(rBytes), s: bytesToBig(sBytes) };
    }
    
    // ---------------------------------------------------------------------------
    // Message digest: SHA-256 for P-256, SHA-384 for P-384 (FIPS 186-4's
    // natural pairing -- both give a digest exactly as wide as the curve's
    // order, so the "leftmost N bits" truncation below is a no-op for both,
    // but is implemented generically rather than assumed.
    // ---------------------------------------------------------------------------
    
    function hashForCurve(curveName, message) {
      if (typeof message === 'string') message = new TextEncoder().encode(message);
      return curveName === 'P-384' ? sha384(message) : sha256(message);
    }
    
    // leftmost min(bitlen(hash), bitlen(n)) bits of the hash, as an integer.
    function hashToZ(hashBytes, curve) {
      const nBits = curve.byteLen * 8; // bitlen(n) == byteLen*8 for both curves (see header)
      return bits2int(hashBytes, nBits);
    }
    
    // ---------------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------------
    
    // privateKeyBytes: big-endian scalar d, 1 <= d <= n-1, fixed width for the
    // curve (32 bytes for P-256, 48 for P-384).
    function ecdsaKeygen(privateKeyBytes, curveName) {
      const curve = getCurve(curveName);
      if (privateKeyBytes.length !== curve.byteLen) {
        throw new Error(`private key must be ${curve.byteLen} bytes for ${curveName}`);
      }
      const d = bytesToBig(privateKeyBytes);
      if (d < 1n || d >= curve.n) throw new Error('private scalar out of range [1, n-1]');
      const Q = scalarMul(d, curve.G, curve);
      return {
        privateKey: Uint8Array.from(privateKeyBytes),
        publicKey: encodePoint(Q, curve, false), // uncompressed 0x04 form
      };
    }
    
    // Returns { r, s, raw, der }: raw is fixed-width r||s (SEC1 "IEEE P1363"
    // style), der is the ASN.1 DER ECDSA-Sig-Value encoding. Both are exposed.
    function ecdsaSign(privateKey, message, curveName) {
      const curve = getCurve(curveName);
      if (privateKey.length !== curve.byteLen) {
        throw new Error(`private key must be ${curve.byteLen} bytes for ${curveName}`);
      }
      const d = bytesToBig(privateKey);
      if (d < 1n || d >= curve.n) throw new Error('private scalar out of range [1, n-1]');
    
      const hashBytes = hashForCurve(curveName, message);
      const z = hashToZ(hashBytes, curve);
      const { n, G } = curve;
    
      let r = 0n, s = 0n;
      let h1 = hashBytes;
      for (;;) {
        const k = rfc6979GenerateK(curve, d, h1, (cand) => {
          const R = scalarMul(cand, G, curve);
          if (isInfinity(R)) return false;
          const [Rx] = toAffine(R, curve.F);
          return (Rx % n) !== 0n;
        });
        const R = scalarMul(k, G, curve);
        const [Rx] = toAffine(R, curve.F);
        r = ((Rx % n) + n) % n;
        if (r === 0n) { h1 = concatBytes(h1, Uint8Array.of(0)); continue; } // defensive; see isValidCandidate above
        const kInv = modInverse(k, n);
        s = ((kInv * ((z + r * d) % n)) % n + n) % n;
        if (s !== 0n) break;
        h1 = concatBytes(h1, Uint8Array.of(0)); // defensive retry path, not expected to trigger
      }
    
      const raw = concatBytes(bigToBytes(r, curve.byteLen), bigToBytes(s, curve.byteLen));
      const der = encodeDER(r, s);
      return { r, s, raw, der };
    }
    
    // signature may be: { der } / { raw } / { r, s } object, or a bare
    // Uint8Array (auto-detected: 0x30-prefixed => DER, else fixed-width raw).
    function ecdsaVerify(publicKey, message, signature, curveName) {
      try {
        const curve = getCurve(curveName);
        const { n, G, F, byteLen } = curve;
    
        let r, s;
        if (signature && typeof signature === 'object' && !(signature instanceof Uint8Array)) {
          if (signature.r !== undefined && signature.s !== undefined) {
            r = BigInt(signature.r); s = BigInt(signature.s);
          } else if (signature.der) {
            ({ r, s } = decodeDER(toU8(signature.der)));
          } else if (signature.raw) {
            const raw = toU8(signature.raw);
            r = bytesToBig(raw.slice(0, byteLen)); s = bytesToBig(raw.slice(byteLen, 2 * byteLen));
          } else return false;
        } else {
          const bytes = toU8(signature);
          if (bytes.length === 2 * byteLen) {
            r = bytesToBig(bytes.slice(0, byteLen));
            s = bytesToBig(bytes.slice(byteLen, 2 * byteLen));
          } else if (bytes[0] === 0x30) {
            ({ r, s } = decodeDER(bytes));
          } else {
            return false;
          }
        }
    
        if (r === undefined || s === undefined) return false;
        if (r < 1n || r >= n || s < 1n || s >= n) return false; // explicit range / r=0 / s=0 rejection
    
        const Q = decodePoint(toU8(publicKey), curve);
        if (isInfinity(Q)) return false;
    
        const hashBytes = hashForCurve(curveName, message);
        const z = hashToZ(hashBytes, curve);
    
        const w = modInverse(s, n);
        const u1 = ((z * w) % n + n) % n;
        const u2 = ((r * w) % n + n) % n;
    
        const X = pointAdd(scalarMul(u1, G, curve), scalarMul(u2, Q, curve), F);
        if (isInfinity(X)) return false;
        const [Xx] = toAffine(X, F);
        const v = ((Xx % n) + n) % n;
        return v === r;
      } catch {
        return false; // malformed key/signature/point -> reject, never throw
      }
    }
    
    function toU8(x) { return x instanceof Uint8Array ? x : Uint8Array.from(x); }
    
    // n is prime for both curves, so Fermat's little theorem applies here too.
    function modInverse(a, n) {
      const F = makeField(n);
      return F.inv(((a % n) + n) % n);
    }
    
    const _internals = {
      CURVES, getCurve, makeField,
      pointAdd, pointDouble, pointEqual, scalarMul, toAffine, isOnCurve, isInfinity, INFINITY,
      encodePoint, decodePoint,
      hmacSha256, rfc6979GenerateK, bits2int, bits2octets, int2octets,
      encodeDER, decodeDER, modInverse,
      bytesToBig, bigToBytes,
    };
    
    return { ecdsaKeygen: ecdsaKeygen, ecdsaSign: ecdsaSign, ecdsaVerify: ecdsaVerify, _internals: _internals };
  })();
  exportsMap["ecdsaKeygen"] = mod_ecdsa.ecdsaKeygen;
  exportsMap["ecdsaSign"] = mod_ecdsa.ecdsaSign;
  exportsMap["ecdsaVerify"] = mod_ecdsa.ecdsaVerify;
  exportsMap["_internals"] = mod_ecdsa._internals;
  return exportsMap;
})();
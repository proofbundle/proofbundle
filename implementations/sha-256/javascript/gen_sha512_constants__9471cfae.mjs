// Derive SHA-512/SHA-384 constants (H0, K) from first principles using BigInt
// arbitrary-precision arithmetic, per FIPS 180-4 section 5.3.4/5.3.5:
//   - K[i] = first 64 bits of the fractional part of the cube root of the
//            i-th prime (i = 1..80)
//   - SHA-512 H0 = first 64 bits of the fractional part of the square root
//            of the 1st through 8th primes
//   - SHA-384 H0 = first 64 bits of the fractional part of the square root
//            of the 9th through 16th primes
//
// Cross-validated below by reproducing SHA-256's K/H0 (32-bit truncation of
// the same construction) and diffing against the literal arrays already
// hardcoded and trusted in crypto-core/sha256.mjs.

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

function firstNPrimes(n) {
  const out = [];
  let candidate = 2;
  while (out.length < n) {
    if (isPrime(candidate)) out.push(candidate);
    candidate++;
  }
  return out;
}

function isqrt(n) {
  if (n < 0n) throw new Error('negative');
  if (n < 2n) return n;
  let x = n, y = (x + 1n) >> 1n;
  while (y < x) { x = y; y = (x + n / x) >> 1n; }
  return x;
}

function icbrt(n) {
  if (n < 0n) throw new Error('negative');
  let lo = 0n, hi = 1n;
  while (hi * hi * hi <= n) hi <<= 1n;
  while (lo < hi) {
    const mid = (lo + hi + 1n) >> 1n;
    if (mid * mid * mid <= n) lo = mid; else hi = mid - 1n;
  }
  return lo;
}

function fracSqrtHex(p, bits) {
  const N = BigInt(p) * (1n << (2n * BigInt(bits)));
  const v = isqrt(N) & ((1n << BigInt(bits)) - 1n);
  return v.toString(16).padStart(bits / 4, '0');
}

function fracCbrtHex(p, bits) {
  const N = BigInt(p) * (1n << (3n * BigInt(bits)));
  const v = icbrt(N) & ((1n << BigInt(bits)) - 1n);
  return v.toString(16).padStart(bits / 4, '0');
}

const primes80 = firstNPrimes(80);

// ---- Cross-validation against already-trusted sha256.mjs constants ----
const sha256_K_trusted = [
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
];
const sha256_H0_trusted = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];

let ok = true;
for (let i = 0; i < 64; i++) {
  const got = fracCbrtHex(primes80[i], 32);
  const want = sha256_K_trusted[i].toString(16).padStart(8, '0');
  if (got !== want) { ok = false; console.log(`K MISMATCH i=${i} prime=${primes80[i]} got=${got} want=${want}`); }
}
for (let i = 0; i < 8; i++) {
  const got = fracSqrtHex(primes80[i], 32);
  const want = sha256_H0_trusted[i].toString(16).padStart(8, '0');
  if (got !== want) { ok = false; console.log(`H0 MISMATCH i=${i} prime=${primes80[i]} got=${got} want=${want}`); }
}
console.log('Cross-validation of derivation method against sha256.mjs:', ok ? 'PASS (method proven correct)' : 'FAIL');
if (!ok) process.exit(1);

// ---- Now derive the real target: SHA-512 K (80 words), SHA-512 H0 (8 words), SHA-384 H0 (8 words) ----
const K512 = primes80.map(p => fracCbrtHex(p, 64));
const H0_512 = primes80.slice(0, 8).map(p => fracSqrtHex(p, 64));
const H0_384 = primes80.slice(8, 16).map(p => fracSqrtHex(p, 64));

function formatRows(arr, perRow) {
  let out = '';
  for (let i = 0; i < arr.length; i += perRow) {
    out += '  ' + arr.slice(i, i + perRow).map(h => `0x${h}n`).join(',') + ',\n';
  }
  return out;
}

console.log('\n// SHA-512 K[80] (first 64 bits of fractional cube roots of first 80 primes)');
console.log(formatRows(K512, 4));
console.log('// SHA-512 H0[8]');
console.log(formatRows(H0_512, 4));
console.log('// SHA-384 H0[8]');
console.log(formatRows(H0_384, 4));

// Sanity: high 32 bits of each of the first 64 SHA-512 K words must equal the
// corresponding SHA-256 K word (both are truncations of the same cube-root
// fractional expansion) -- an independent structural check.
let structOk = true;
for (let i = 0; i < 64; i++) {
  const hi32 = K512[i].slice(0, 8);
  const want = sha256_K_trusted[i].toString(16).padStart(8, '0');
  if (hi32 !== want) { structOk = false; console.log(`structural mismatch at ${i}: ${hi32} vs ${want}`); }
}
console.log('Structural cross-check (SHA-512 K hi32 == SHA-256 K):', structOk ? 'PASS' : 'FAIL');

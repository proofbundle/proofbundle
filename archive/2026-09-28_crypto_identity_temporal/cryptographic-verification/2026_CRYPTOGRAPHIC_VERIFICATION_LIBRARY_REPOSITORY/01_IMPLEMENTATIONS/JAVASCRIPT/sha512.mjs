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

export function sha512(msg) { return hashCore(msg, H0_512, 8); }
export function sha384(msg) { return hashCore(msg, H0_384, 6); }

export function sha512Hex(msgOrBytes) {
  return Buffer.from(sha512(msgOrBytes)).toString('hex');
}
export function sha384Hex(msgOrBytes) {
  return Buffer.from(sha384(msgOrBytes)).toString('hex');
}

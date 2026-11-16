// scrypt (RFC 7914) on top of the repo's PBKDF2-HMAC-SHA256.
//
// From scratch: no node:crypto, no WebCrypto.
//
// Spec references:
//   RFC 7914 section 3 -- scrypt(P, S, N, r, p, dkLen)
//   RFC 7914 section 4 -- ROMix and BlockMix
//   RFC 7914 section 5 -- the Salsa20/8 core (8 rounds, not 20)
//   RFC 7914 section 2 -- PBKDF2-HMAC-SHA256 is the PRF throughout
//
// N must be a power of two greater than one; r and p are positive. Memory use
// is 128*r*N bytes, which for the RFC's own example (N=16384, r=8) is 16 MiB.
import { pbkdf2Sha256 } from './pbkdf2.mjs';

const le32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24));
function st32(out, o, v) {
  out[o] = v & 255; out[o + 1] = (v >>> 8) & 255;
  out[o + 2] = (v >>> 16) & 255; out[o + 3] = (v >>> 24) & 255;
}

const rotl = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;

// Salsa20/8 core (RFC 7914 section 5): 16 little-endian words, 8 rounds.
export function salsa208(input) {
  if (input.length !== 64) throw new RangeError('Salsa20/8 takes a 64-byte block');
  const x = new Uint32Array(16);
  for (let i = 0; i < 16; i++) x[i] = le32(input, 4 * i);
  const z = Uint32Array.from(x);
  for (let i = 0; i < 4; i++) {          // 8 rounds = 4 double rounds
    z[4] ^= rotl((z[0] + z[12]) >>> 0, 7);
    z[8] ^= rotl((z[4] + z[0]) >>> 0, 9);
    z[12] ^= rotl((z[8] + z[4]) >>> 0, 13);
    z[0] ^= rotl((z[12] + z[8]) >>> 0, 18);
    z[9] ^= rotl((z[5] + z[1]) >>> 0, 7);
    z[13] ^= rotl((z[9] + z[5]) >>> 0, 9);
    z[1] ^= rotl((z[13] + z[9]) >>> 0, 13);
    z[5] ^= rotl((z[1] + z[13]) >>> 0, 18);
    z[14] ^= rotl((z[10] + z[6]) >>> 0, 7);
    z[2] ^= rotl((z[14] + z[10]) >>> 0, 9);
    z[6] ^= rotl((z[2] + z[14]) >>> 0, 13);
    z[10] ^= rotl((z[6] + z[2]) >>> 0, 18);
    z[3] ^= rotl((z[15] + z[11]) >>> 0, 7);
    z[7] ^= rotl((z[3] + z[15]) >>> 0, 9);
    z[11] ^= rotl((z[7] + z[3]) >>> 0, 13);
    z[15] ^= rotl((z[11] + z[7]) >>> 0, 18);
    z[1] ^= rotl((z[0] + z[3]) >>> 0, 7);
    z[2] ^= rotl((z[1] + z[0]) >>> 0, 9);
    z[3] ^= rotl((z[2] + z[1]) >>> 0, 13);
    z[0] ^= rotl((z[3] + z[2]) >>> 0, 18);
    z[6] ^= rotl((z[5] + z[4]) >>> 0, 7);
    z[7] ^= rotl((z[6] + z[5]) >>> 0, 9);
    z[4] ^= rotl((z[7] + z[6]) >>> 0, 13);
    z[5] ^= rotl((z[4] + z[7]) >>> 0, 18);
    z[11] ^= rotl((z[10] + z[9]) >>> 0, 7);
    z[8] ^= rotl((z[11] + z[10]) >>> 0, 9);
    z[9] ^= rotl((z[8] + z[11]) >>> 0, 13);
    z[10] ^= rotl((z[9] + z[8]) >>> 0, 18);
    z[12] ^= rotl((z[15] + z[14]) >>> 0, 7);
    z[13] ^= rotl((z[12] + z[15]) >>> 0, 9);
    z[14] ^= rotl((z[13] + z[12]) >>> 0, 13);
    z[15] ^= rotl((z[14] + z[13]) >>> 0, 18);
  }
  const out = new Uint8Array(64);
  for (let i = 0; i < 16; i++) st32(out, 4 * i, (z[i] + x[i]) >>> 0);
  return out;
}

// BlockMix (RFC 7914 section 4) over 2r 64-byte blocks.
function blockMix(B, r) {
  const n = 2 * r;
  let X = Uint8Array.from(B.subarray((2 * r - 1) * 64, 2 * r * 64));
  const Y = new Uint8Array(B.length);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 64; k++) X[k] ^= B[i * 64 + k];
    X = salsa208(X);
    // even-indexed outputs go to the first half, odd to the second
    const dest = (i % 2 === 0) ? (i / 2) : (r + (i - 1) / 2);
    Y.set(X, dest * 64);
  }
  return Y;
}

function romix(B, N, r) {
  const block = 128 * r;
  const X = Uint8Array.from(B);
  const V = new Uint8Array(N * block);
  for (let i = 0; i < N; i++) {
    V.set(X, i * block);
    X.set(blockMix(X, r));
  }
  for (let i = 0; i < N; i++) {
    const j = le32(X, (2 * r - 1) * 64) & (N - 1);   // Integerify(X) mod N
    const off = j * block;
    for (let k = 0; k < block; k++) X[k] ^= V[off + k];
    X.set(blockMix(X, r));
  }
  return X;
}

export function scrypt(password, salt, N, r, p, dkLen) {
  if (!Number.isInteger(N) || N <= 1 || (N & (N - 1)) !== 0) {
    throw new RangeError('scrypt: N must be a power of two greater than 1');
  }
  if (!Number.isInteger(r) || r < 1 || !Number.isInteger(p) || p < 1) {
    throw new RangeError('scrypt: r and p must be positive integers');
  }
  if (typeof password === 'string') password = new TextEncoder().encode(password);
  if (typeof salt === 'string') salt = new TextEncoder().encode(salt);
  const block = 128 * r;
  const B = pbkdf2Sha256(password, salt, 1, p * block);
  for (let i = 0; i < p; i++) {
    const mixed = romix(B.subarray(i * block, (i + 1) * block), N, r);
    B.set(mixed, i * block);
  }
  return pbkdf2Sha256(password, B, 1, dkLen);
}

export const _internals = { blockMix, romix, le32 };

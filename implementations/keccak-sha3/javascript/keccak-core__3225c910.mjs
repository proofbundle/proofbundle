// Auditable pure-mjs Keccak-f[1600] permutation and sponge (FIPS 202 / Keccak).
// State lanes are 64-bit values held as BigInt (masked to 64 bits each step).

const MASK64 = (1n << 64n) - 1n;

const RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
  0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
  0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
  0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
  0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

// Rotation offsets r[x][y], indexed as r[x + 5*y].
const RHO = [
   0n,  1n, 62n, 28n, 27n,
  36n, 44n,  6n, 55n, 20n,
   3n, 10n, 43n, 25n, 39n,
  41n, 45n, 15n, 21n,  8n,
  18n,  2n, 61n, 56n, 14n,
];

function rotl64(x, n) {
  if (n === 0n) return x;
  return ((x << n) | (x >> (64n - n))) & MASK64;
}

export function keccakF1600(state) {
  // state: array of 25 BigInt, lane index = x + 5*y
  const C = new Array(5);
  const D = new Array(5);
  const B = new Array(25);
  for (let round = 0; round < 24; round++) {
    // theta
    for (let x = 0; x < 5; x++) {
      C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    for (let x = 0; x < 5; x++) {
      D[x] = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1n);
    }
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) state[x + 5 * y] ^= D[x];
    }
    // rho + pi
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const idx = x + 5 * y;
        B[y + 5 * ((2 * x + 3 * y) % 5)] = rotl64(state[idx] & MASK64, RHO[idx]);
      }
    }
    // chi
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        state[x + 5 * y] =
          (B[x + 5 * y] ^ ((~B[((x + 1) % 5) + 5 * y] & MASK64) & B[((x + 2) % 5) + 5 * y])) & MASK64;
      }
    }
    // iota
    state[0] ^= RC[round];
  }
  return state;
}

function bytesToLane(block, offset) {
  let v = 0n;
  for (let i = 7; i >= 0; i--) v = (v << 8n) | BigInt(block[offset + i]);
  return v;
}

function laneToBytes(lane, out, offset) {
  let v = lane;
  for (let i = 0; i < 8; i++) { out[offset + i] = Number(v & 0xffn); v >>= 8n; }
}

/**
 * Keccak sponge: single-shot.
 * rateBytes: rate in bytes (e.g. 136 for SHA3-256/128-security, 72 for 256-security)
 * suffix: domain separation suffix byte (0x06 SHA3/SHAKE, 0x01 legacy Keccak, 0x04 cSHAKE)
 * input: Uint8Array
 * outLen: output length in bytes
 */
export function keccakSponge(rateBytes, suffix, input, outLen) {
  const state = new Array(25).fill(0n);
  const block = new Uint8Array(rateBytes);
  let offset = 0;
  while (offset + rateBytes <= input.length) {
    for (let i = 0; i < rateBytes / 8; i++) {
      state[i] ^= bytesToLane(input, offset + i * 8);
    }
    keccakF1600(state);
    offset += rateBytes;
  }
  // final block with pad10*1
  block.fill(0);
  block.set(input.subarray(offset));
  block[input.length - offset] = suffix;
  block[rateBytes - 1] |= 0x80;
  for (let i = 0; i < rateBytes / 8; i++) {
    state[i] ^= bytesToLane(block, i * 8);
  }
  keccakF1600(state);
  const out = new Uint8Array(outLen);
  let produced = 0;
  while (produced < outLen) {
    const take = Math.min(rateBytes, outLen - produced);
    const tmp = new Uint8Array(rateBytes);
    for (let i = 0; i < rateBytes / 8; i++) laneToBytes(state[i], tmp, i * 8);
    out.set(tmp.subarray(0, take), produced);
    produced += take;
    if (produced < outLen) keccakF1600(state);
  }
  return out;
}

// Convenience primitives
export function keccak256(input, outLen = 32) { return keccakSponge(136, 0x01, input, outLen); }
export function shake128sponge(input, outLen) { return keccakSponge(168, 0x1f, input, outLen); }
export function shake256sponge(input, outLen) { return keccakSponge(136, 0x1f, input, outLen); }

// AES block cipher (FIPS 197), 128/192/256-bit keys.
//
// From scratch: no node:crypto, no WebCrypto. The S-box is not transcribed --
// it is computed at load time from the multiplicative inverse in GF(2^8) and
// the affine transform of FIPS 197 5.1.1, so a table typo is impossible. The
// inverse S-box is derived from it. MixColumns uses xtime.
//
// Spec references:
//   FIPS 197 section 4  -- key expansion (w[i] recurrence, Rcon)
//   FIPS 197 section 5  -- cipher (SubBytes, ShiftRows, MixColumns, AddRoundKey)
//   FIPS 197 section 5.3 -- inverse cipher
//   SP 800-38A 6.5      -- CTR mode (counter increment where the caller says so)
//
// State layout is column-major as in the standard: s[r + 4c] is row r, column c.

// ---- GF(2^8) arithmetic, polynomial x^8 + x^4 + x^3 + x + 1 (0x11b) --------
function gfMul(a, b) {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return p;
}

function gfPow(a, n) {
  let r = 1;
  while (n > 0) {
    if (n & 1) r = gfMul(r, a);
    a = gfMul(a, a);
    n >>= 1;
  }
  return r;
}

const rotl8 = (x, n) => ((x << n) | (x >> (8 - n))) & 0xff;

const SBOX = new Uint8Array(256);
const INV_SBOX = new Uint8Array(256);
{
  SBOX[0] = 0x63;                       // affine transform of 0
  for (let x = 1; x < 256; x++) {
    const inv = gfPow(x, 254);          // x^-1 = x^254 in this field
    const s = inv ^ rotl8(inv, 1) ^ rotl8(inv, 2) ^ rotl8(inv, 3) ^ rotl8(inv, 4) ^ 0x63;
    SBOX[x] = s & 0xff;
  }
  for (let x = 0; x < 256; x++) INV_SBOX[SBOX[x]] = x;
}

const RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

const NK = { 16: 4, 24: 6, 32: 8 };
const NR = { 16: 10, 24: 12, 32: 14 };

// Returns the expanded key as 4*(Nr+1) words of 4 bytes each (flat Uint8Array).
export function expandKey(key) {
  const nk = NK[key.length];
  if (!nk) throw new RangeError(`AES key must be 16, 24 or 32 bytes, got ${key.length}`);
  const nr = NR[key.length];
  const words = 4 * (nr + 1);
  const w = new Uint8Array(4 * words);
  w.set(key, 0);
  let rcon = 0;
  for (let i = nk; i < words; i++) {
    let t = w.slice(4 * (i - 1), 4 * i);
    if (i % nk === 0) {
      t = Uint8Array.from([SBOX[t[1]] ^ RCON[rcon++], SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]]);
    } else if (nk > 6 && i % nk === 4) {
      t = Uint8Array.from(t, (x) => SBOX[x]);
    }
    for (let j = 0; j < 4; j++) w[4 * i + j] = w[4 * (i - nk) + j] ^ t[j];
  }
  return { w, nr };
}

const xtime = (x) => ((x << 1) ^ ((x & 0x80) ? 0x1b : 0)) & 0xff;

function addRoundKey(s, w, round) {
  const off = 16 * round;
  for (let i = 0; i < 16; i++) s[i] ^= w[off + i];
}

function subBytes(s) { for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]]; }
function invSubBytes(s) { for (let i = 0; i < 16; i++) s[i] = INV_SBOX[s[i]]; }

// Row r rotates left by r (state is column-major).
function shiftRows(s) {
  const t = Uint8Array.from(s);
  for (let r = 1; r < 4; r++) for (let c = 0; c < 4; c++) s[r + 4 * c] = t[r + 4 * ((c + r) % 4)];
}
function invShiftRows(s) {
  const t = Uint8Array.from(s);
  for (let r = 1; r < 4; r++) for (let c = 0; c < 4; c++) s[r + 4 * c] = t[r + 4 * ((c - r + 4) % 4)];
}

function mixColumns(s) {
  for (let c = 0; c < 4; c++) {
    const a0 = s[4 * c], a1 = s[4 * c + 1], a2 = s[4 * c + 2], a3 = s[4 * c + 3];
    s[4 * c] = xtime(a0) ^ (xtime(a1) ^ a1) ^ a2 ^ a3;
    s[4 * c + 1] = a0 ^ xtime(a1) ^ (xtime(a2) ^ a2) ^ a3;
    s[4 * c + 2] = a0 ^ a1 ^ xtime(a2) ^ (xtime(a3) ^ a3);
    s[4 * c + 3] = (xtime(a0) ^ a0) ^ a1 ^ a2 ^ xtime(a3);
  }
}

function invMixColumns(s) {
  for (let c = 0; c < 4; c++) {
    const a0 = s[4 * c], a1 = s[4 * c + 1], a2 = s[4 * c + 2], a3 = s[4 * c + 3];
    s[4 * c] = gfMul(a0, 14) ^ gfMul(a1, 11) ^ gfMul(a2, 13) ^ gfMul(a3, 9);
    s[4 * c + 1] = gfMul(a0, 9) ^ gfMul(a1, 14) ^ gfMul(a2, 11) ^ gfMul(a3, 13);
    s[4 * c + 2] = gfMul(a0, 13) ^ gfMul(a1, 9) ^ gfMul(a2, 14) ^ gfMul(a3, 11);
    s[4 * c + 3] = gfMul(a0, 11) ^ gfMul(a1, 13) ^ gfMul(a2, 9) ^ gfMul(a3, 14);
  }
}

export function encryptBlock(expanded, block) {
  if (block.length !== 16) throw new RangeError('AES block must be 16 bytes');
  const { w, nr } = expanded;
  const s = Uint8Array.from(block);
  addRoundKey(s, w, 0);
  for (let r = 1; r < nr; r++) { subBytes(s); shiftRows(s); mixColumns(s); addRoundKey(s, w, r); }
  subBytes(s); shiftRows(s); addRoundKey(s, w, nr);
  return s;
}

export function decryptBlock(expanded, block) {
  if (block.length !== 16) throw new RangeError('AES block must be 16 bytes');
  const { w, nr } = expanded;
  const s = Uint8Array.from(block);
  addRoundKey(s, w, nr);
  for (let r = nr - 1; r > 0; r--) { invShiftRows(s); invSubBytes(s); addRoundKey(s, w, r); invMixColumns(s); }
  invShiftRows(s); invSubBytes(s); addRoundKey(s, w, 0);
  return s;
}

// CTR with a 32-bit little-endian counter in the first four bytes of the
// counter block (the layout AES-GCM-SIV uses). `start` is that counter value.
export function ctrCrypt(expanded, counterBlock, input, start = 0) {
  const out = new Uint8Array(input.length);
  const ctr = Uint8Array.from(counterBlock);
  let counter = start >>> 0;
  for (let off = 0; off < input.length; off += 16) {
    ctr[0] = counter & 255; ctr[1] = (counter >>> 8) & 255;
    ctr[2] = (counter >>> 16) & 255; ctr[3] = (counter >>> 24) & 255;
    const ks = encryptBlock(expanded, ctr);
    const n = Math.min(16, input.length - off);
    for (let i = 0; i < n; i++) out[off + i] = input[off + i] ^ ks[i];
    counter = (counter + 1) >>> 0;
  }
  return out;
}

export const _internals = { SBOX, INV_SBOX, gfMul, gfPow, xtime, RCON };

// ---- added 2026-11-24 by claude-opus-5-5: nist sp 800-38a ctr mode ----
// ctrCrypt above is the aes-gcm-siv layout (32-bit little-endian counter in bytes 0..3) and is unchanged.
// ctrCrypt38a treats the whole 128-bit counter block as a big-endian integer and increments it by one per block (mod 2^128).
export function ctrCrypt38a(expanded, initialCounterBlock, input) {
  const out = new Uint8Array(input.length), ctr = Uint8Array.from(initialCounterBlock);
  for (let off = 0; off < input.length; off += 16) {
    const ks = encryptBlock(expanded, ctr), n = Math.min(16, input.length - off);
    for (let i = 0; i < n; i++) out[off + i] = input[off + i] ^ ks[i];
    for (let i = 15; i >= 0; i--) { ctr[i] = (ctr[i] + 1) & 255; if (ctr[i] !== 0) break; }
  }
  return out;
}

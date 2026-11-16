// AES Key Wrap (RFC 3394) and Key Wrap with Padding (RFC 5649).
//
// From scratch on top of ./aes.mjs. No node:crypto, no WebCrypto.
//
// Spec references:
//   RFC 3394 section 2.2.1 -- wrapping, 6 rounds over an 8-byte A and n 8-byte
//                             semi-blocks, A starting at 0xA6A6A6A6A6A6A6A6
//   RFC 3394 section 2.2.2 -- unwrapping with the integrity check
//   RFC 5649 section 4.1   -- KWP: A = 0xA65959A6 || MLI, zero-padded input
import { expandKey, encryptBlock, decryptBlock } from './aes.mjs';

const A6 = Uint8Array.from([0xa6, 0xa6, 0xa6, 0xa6, 0xa6, 0xa6, 0xa6, 0xa6]);

function xorInto8(dst, t) {
  // XOR the 64-bit counter t (big-endian, as a JS number up to 6*n <= 2^32) into dst
  let v = BigInt(t);
  for (let i = 7; i >= 0; i--) { dst[i] ^= Number(v & 0xffn); v >>= 8n; }
}

export function keyWrap(kek, plaintext) {
  if (plaintext.length < 16 || plaintext.length % 8 !== 0) {
    throw new RangeError('RFC 3394 input must be a non-empty multiple of 8 bytes, at least 16');
  }
  const expanded = expandKey(kek);
  const n = plaintext.length / 8;
  const R = [];
  for (let i = 0; i < n; i++) R.push(Uint8Array.from(plaintext.subarray(8 * i, 8 * i + 8)));
  let A = Uint8Array.from(A6);
  for (let j = 0; j < 6; j++) {
    for (let i = 0; i < n; i++) {
      const B = encryptBlock(expanded, Uint8Array.from([...A, ...R[i]]));
      A = B.slice(0, 8);
      xorInto8(A, n * j + i + 1);
      R[i] = B.slice(8, 16);
    }
  }
  const out = new Uint8Array(8 + 8 * n);
  out.set(A, 0);
  for (let i = 0; i < n; i++) out.set(R[i], 8 + 8 * i);
  return out;
}

// Returns the unwrapped key, or null if the integrity check fails.
export function keyUnwrap(kek, ciphertext) {
  if (ciphertext.length < 24 || ciphertext.length % 8 !== 0) return null;
  const expanded = expandKey(kek);
  const n = ciphertext.length / 8 - 1;
  let A = Uint8Array.from(ciphertext.subarray(0, 8));
  const R = [];
  for (let i = 0; i < n; i++) R.push(Uint8Array.from(ciphertext.subarray(8 + 8 * i, 16 + 8 * i)));
  for (let j = 5; j >= 0; j--) {
    for (let i = n - 1; i >= 0; i--) {
      const t = Uint8Array.from(A);
      xorInto8(t, n * j + i + 1);
      const B = decryptBlock(expanded, Uint8Array.from([...t, ...R[i]]));
      A = B.slice(0, 8);
      R[i] = B.slice(8, 16);
    }
  }
  for (let i = 0; i < 8; i++) if (A[i] !== A6[i]) return null;
  const out = new Uint8Array(8 * n);
  for (let i = 0; i < n; i++) out.set(R[i], 8 * i);
  return out;
}

const KWP_IV = Uint8Array.from([0xa6, 0x59, 0x59, 0xa6]);

// RFC 5649: input of any length >= 1; output is 8 bytes longer than the input
// rounded up to a multiple of 8, i.e. 16 bytes for short inputs.
export function keyWrapPad(kek, plaintext) {
  if (plaintext.length === 0) throw new RangeError('KWP input must be non-empty');
  const mli = new Uint8Array(4);
  mli[0] = (plaintext.length >>> 24) & 255; mli[1] = (plaintext.length >>> 16) & 255;
  mli[2] = (plaintext.length >>> 8) & 255; mli[3] = plaintext.length & 255;
  const padded = new Uint8Array(Math.ceil(plaintext.length / 8) * 8); // RFC 5649: no 16-byte floor
  padded.set(plaintext);
  const A = Uint8Array.from([...KWP_IV, ...mli]);
  const expanded = expandKey(kek);
  const n = padded.length / 8;
  const R = [];
  for (let i = 0; i < n; i++) R.push(Uint8Array.from(padded.subarray(8 * i, 8 * i + 8)));
  let a = A;
  // RFC 5649 4.1 step 2: exactly one 8-byte semi-block is special-cased to a
  // single AES block encryption of AIV || P[1]; the 6-round loop is skipped.
  if (n === 1) return encryptBlock(expanded, Uint8Array.from([...A, ...R[0]]));
  for (let j = 0; j < 6; j++) {
    for (let i = 0; i < n; i++) {
      const B = encryptBlock(expanded, Uint8Array.from([...a, ...R[i]]));
      a = B.slice(0, 8);
      xorInto8(a, n * j + i + 1);
      R[i] = B.slice(8, 16);
    }
  }
  const out = new Uint8Array(8 + 8 * n);
  out.set(a, 0);
  for (let i = 0; i < n; i++) out.set(R[i], 8 + 8 * i);
  return out;
}

export function keyUnwrapPad(kek, ciphertext) {
  if (ciphertext.length < 16 || ciphertext.length % 8 !== 0) return null;
  const expanded = expandKey(kek);
  const n = ciphertext.length / 8 - 1;
  let a = Uint8Array.from(ciphertext.subarray(0, 8));
  const R = [];
  for (let i = 0; i < n; i++) R.push(Uint8Array.from(ciphertext.subarray(8 + 8 * i, 16 + 8 * i)));
  if (n === 1) {
    const B = decryptBlock(expanded, Uint8Array.from(ciphertext));
    a = B.slice(0, 8);
    R[0] = B.slice(8, 16);
  } else for (let j = 5; j >= 0; j--) {
    for (let i = n - 1; i >= 0; i--) {
      const t = Uint8Array.from(a);
      xorInto8(t, n * j + i + 1);
      const B = decryptBlock(expanded, Uint8Array.from([...t, ...R[i]]));
      a = B.slice(0, 8);
      R[i] = B.slice(8, 16);
    }
  }
  for (let i = 0; i < 4; i++) if (a[i] !== KWP_IV[i]) return null;
  const mli = ((a[4] << 24) | (a[5] << 16) | (a[6] << 8) | a[7]) >>> 0;
  const total = 8 * n;
  if (mli === 0 || mli > total || total - mli >= 8) return null;
  const unpadded = new Uint8Array(total);
  for (let i = 0; i < n; i++) unpadded.set(R[i], 8 * i);
  if (total - mli > 0) {
    for (let i = mli; i < total; i++) if (unpadded[i] !== 0) return null;
  }
  return unpadded.slice(0, mli);
}

export const _internals = { A6, KWP_IV, xorInto8 };

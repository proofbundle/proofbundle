// chacha20poly1305.mjs
// RFC 8439 ChaCha20, Poly1305 and AEAD_CHACHA20_POLY1305, from scratch.
// Poly1305 keeps 10 limbs of 13 bits so every product stays exact in float64.

const SIGMA = new Uint32Array([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]);
const LIMB = 8192;
const MASK13 = 0x1fff;
const TWO32 = 4294967296;

function rotl(v, n) {
  return (v << n) | (v >>> (32 - n));
}

function qr(x, a, b, c, d) {
  x[a] = (x[a] + x[b]) | 0;
  x[d] = rotl(x[d] ^ x[a], 16);
  x[c] = (x[c] + x[d]) | 0;
  x[b] = rotl(x[b] ^ x[c], 12);
  x[a] = (x[a] + x[b]) | 0;
  x[d] = rotl(x[d] ^ x[a], 8);
  x[c] = (x[c] + x[d]) | 0;
  x[b] = rotl(x[b] ^ x[c], 7);
}

function rd32(u8, o) {
  return (u8[o] | (u8[o + 1] << 8) | (u8[o + 2] << 16) | (u8[o + 3] << 24)) | 0;
}

function wr32(u8, o, v) {
  u8[o] = v & 0xff;
  u8[o + 1] = (v >>> 8) & 0xff;
  u8[o + 2] = (v >>> 16) & 0xff;
  u8[o + 3] = (v >>> 24) & 0xff;
}

export function chacha20Block(key32, counter, nonce12) {
  const s = new Uint32Array(16);
  s[0] = SIGMA[0];
  s[1] = SIGMA[1];
  s[2] = SIGMA[2];
  s[3] = SIGMA[3];
  for (let i = 0; i < 8; i++) s[4 + i] = rd32(key32, i * 4) >>> 0;
  s[12] = counter >>> 0;
  for (let i = 0; i < 3; i++) s[13 + i] = rd32(nonce12, i * 4) >>> 0;
  const w = new Uint32Array(16);
  w.set(s);
  for (let i = 0; i < 10; i++) {
    qr(w, 0, 4, 8, 12);
    qr(w, 1, 5, 9, 13);
    qr(w, 2, 6, 10, 14);
    qr(w, 3, 7, 11, 15);
    qr(w, 0, 5, 10, 15);
    qr(w, 1, 6, 11, 12);
    qr(w, 2, 7, 8, 13);
    qr(w, 3, 4, 9, 14);
  }
  const out = new Uint8Array(64);
  for (let i = 0; i < 16; i++) wr32(out, i * 4, (w[i] + s[i]) | 0);
  return out;
}

export function chacha20Xor(key32, nonce12, counter, data) {
  const out = new Uint8Array(data.length);
  let ctr = counter >>> 0;
  for (let off = 0; off < data.length; off += 64, ctr = (ctr + 1) >>> 0) {
    const ks = chacha20Block(key32, ctr, nonce12);
    const n = Math.min(64, data.length - off);
    for (let i = 0; i < n; i++) out[off + i] = data[off + i] ^ ks[i];
  }
  return out;
}

export function poly1305KeyGen(key32, nonce12) {
  return chacha20Block(key32, 0, nonce12).slice(0, 32);
}

function limbs13(dst, bytes, off, len) {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  for (let i = 0; i < 16; i++) {
    const v = i < len ? bytes[off + i] : (i === len ? 1 : 0);
    if (i < 4) b0 |= v << (8 * i);
    else if (i < 8) b1 |= v << (8 * (i - 4));
    else if (i < 12) b2 |= v << (8 * (i - 8));
    else b3 |= v << (8 * (i - 12));
  }
  dst[0] = b0 & MASK13;
  dst[1] = (b0 >>> 13) & MASK13;
  dst[2] = ((b0 >>> 26) | (b1 << 6)) & MASK13;
  dst[3] = (b1 >>> 7) & MASK13;
  dst[4] = ((b1 >>> 20) | (b2 << 12)) & MASK13;
  dst[5] = (b2 >>> 1) & MASK13;
  dst[6] = (b2 >>> 14) & MASK13;
  dst[7] = ((b2 >>> 27) | (b3 << 5)) & MASK13;
  dst[8] = (b3 >>> 9) & MASK13;
  dst[9] = ((b3 >>> 22) & MASK13) | 0x800;
}

export function poly1305Mac(key32, msg) {
  const r = new Float64Array(10);
  const h = new Float64Array(10);
  const d = new Float64Array(10);
  const m = new Float64Array(10);
  let t0 = rd32(key32, 0) & 0x0fffffff;
  let t1 = rd32(key32, 4) & 0x0ffffffc;
  let t2 = rd32(key32, 8) & 0x0ffffffc;
  let t3 = rd32(key32, 12) & 0x0ffffffc;
  r[0] = t0 & MASK13;
  r[1] = (t0 >>> 13) & MASK13;
  r[2] = ((t0 >>> 26) | (t1 << 6)) & MASK13;
  r[3] = (t1 >>> 7) & MASK13;
  r[4] = ((t1 >>> 20) | (t2 << 12)) & MASK13;
  r[5] = (t2 >>> 1) & MASK13;
  r[6] = (t2 >>> 14) & MASK13;
  r[7] = ((t2 >>> 27) | (t3 << 5)) & MASK13;
  r[8] = (t3 >>> 9) & MASK13;
  r[9] = (t3 >>> 22) & MASK13;

  function absorb() {
    let i;
    for (i = 0; i < 10; i++) h[i] += m[i];
    for (i = 0; i < 10; i++) d[i] = 0;
    for (i = 0; i < 10; i++) {
      const hi = h[i];
      for (let j = 0; j < 10; j++) {
        const p = hi * r[j];
        const k = i + j;
        if (k < 10) d[k] += p;
        else d[k - 10] += 5 * p;
      }
    }
    let c = 0;
    for (i = 0; i < 10; i++) {
      const v = d[i] + c;
      c = Math.floor(v / LIMB);
      h[i] = v - c * LIMB;
    }
    h[0] += 5 * c;
    c = Math.floor(h[0] / LIMB);
    h[0] -= c * LIMB;
    i = 1;
    while (c !== 0 && i < 10) {
      const v = h[i] + c;
      c = Math.floor(v / LIMB);
      h[i] = v - c * LIMB;
      i++;
    }
    if (c !== 0) h[0] += 5 * c;
  }

  let off = 0;
  while (msg.length - off >= 16) {
    limbs13(m, msg, off, 16);
    absorb();
    off += 16;
  }
  if (off < msg.length) {
    limbs13(m, msg, off, msg.length - off);
    absorb();
  }

  let c = 0;
  for (let i = 0; i < 10; i++) {
    const v = h[i] + c;
    c = Math.floor(v / LIMB);
    h[i] = v - c * LIMB;
  }
  h[0] += 5 * c;
  c = Math.floor(h[0] / LIMB);
  h[0] -= c * LIMB;
  h[1] += c;
  c = 0;
  for (let i = 0; i < 10; i++) {
    const v = h[i] + c;
    c = Math.floor(v / LIMB);
    h[i] = v - c * LIMB;
  }

  const g = new Float64Array(10);
  let cc = 0;
  for (let i = 0; i < 10; i++) {
    const v = h[i] + cc + (i === 0 ? 5 : 0);
    cc = Math.floor(v / LIMB);
    g[i] = v - cc * LIMB;
  }
  const mask = -cc;
  for (let i = 0; i < 10; i++) h[i] = (h[i] & ~mask) | (g[i] & mask);

  const w0 = (h[0] | (h[1] << 13) | (h[2] << 26)) >>> 0;
  const w1 = ((h[2] >>> 6) | (h[3] << 7) | (h[4] << 20)) >>> 0;
  const w2 = ((h[4] >>> 12) | (h[5] << 1) | (h[6] << 14) | (h[7] << 27)) >>> 0;
  const w3 = ((h[7] >>> 5) | (h[8] << 8) | (h[9] << 21)) >>> 0;

  let f = w0 + (rd32(key32, 16) >>> 0);
  let cy = Math.floor(f / TWO32);
  f -= cy * TWO32;
  const o0 = f;
  f = w1 + (rd32(key32, 20) >>> 0) + cy;
  cy = Math.floor(f / TWO32);
  f -= cy * TWO32;
  const o1 = f;
  f = w2 + (rd32(key32, 24) >>> 0) + cy;
  cy = Math.floor(f / TWO32);
  f -= cy * TWO32;
  const o2 = f;
  f = w3 + (rd32(key32, 28) >>> 0) + cy;
  const o3 = f - Math.floor(f / TWO32) * TWO32;

  const tag = new Uint8Array(16);
  wr32(tag, 0, o0);
  wr32(tag, 4, o1);
  wr32(tag, 8, o2);
  wr32(tag, 12, o3);
  return tag;
}

function macData(aad, ct) {
  const padA = (aad.length + 15) & ~15;
  const padC = (ct.length + 15) & ~15;
  const mac = new Uint8Array(padA + padC + 16);
  mac.set(aad, 0);
  mac.set(ct, padA);
  const o = padA + padC;
  let l = aad.length;
  for (let i = 0; i < 4; i++) mac[o + i] = (l >>> (8 * i)) & 0xff;
  l = ct.length;
  for (let i = 0; i < 4; i++) mac[o + 4 + i] = (l >>> (8 * i)) & 0xff;
  return mac;
}

export function aeadSeal(key32, nonce12, plaintext, aad) {
  const pk = poly1305KeyGen(key32, nonce12);
  const ct = chacha20Xor(key32, nonce12, 1, plaintext);
  const tag = poly1305Mac(pk, macData(aad, ct));
  const out = new Uint8Array(ct.length + 16);
  out.set(ct, 0);
  out.set(tag, ct.length);
  return out;
}

export function aeadOpen(key32, nonce12, sealed, aad) {
  if (sealed.length < 16) return null;
  const ct = sealed.subarray(0, sealed.length - 16);
  const tag = sealed.subarray(sealed.length - 16);
  const pk = poly1305KeyGen(key32, nonce12);
  const expect = poly1305Mac(pk, macData(aad, ct));
  let diff = 0;
  for (let i = 0; i < 16; i++) diff |= expect[i] ^ tag[i];
  if (diff !== 0) return null;
  return chacha20Xor(key32, nonce12, 1, ct);
}
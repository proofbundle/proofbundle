// chacha20poly1305.mjs
// RFC 8439 ChaCha20, Poly1305 and AEAD_CHACHA20_POLY1305, from scratch.
// Poly1305 here is a REFERENCE BigInt implementation: simple, not constant-time.

const SIGMA = new Uint32Array([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]);

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

function leBig(u8, off, len) {
  let v = 0n;
  for (let i = len - 1; i >= 0; i--) v = (v << 8n) | BigInt(u8[off + i]);
  return v;
}

function leBytes(v, len) {
  const o = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    o[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return o;
}

// REFERENCE tier: plain BigInt, not constant-time.
export function poly1305Mac(key32, msg) {
  const r = leBig(key32, 0, 16) & 0x0ffffffc0ffffffc0ffffffc0fffffffn;
  const s = leBig(key32, 16, 16);
  const p = (1n << 130n) - 5n;
  let acc = 0n;
  for (let off = 0; off < msg.length; off += 16) {
    const n = Math.min(16, msg.length - off);
    const blk = leBig(msg, off, n) + (1n << BigInt(8 * n));
    acc = ((acc + blk) * r) % p;
  }
  return leBytes((acc + s) & ((1n << 128n) - 1n), 16);
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
  for (let i = 0; i < 4; i++) mac[o + 8 + i] = (l >>> (8 * i)) & 0xff;
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
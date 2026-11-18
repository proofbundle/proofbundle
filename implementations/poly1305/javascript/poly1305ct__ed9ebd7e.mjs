// poly1305ct.mjs
// Constant-time Poly1305 with 5 limbs of 26 bits (poly1305-donna-32 layout).
// Products stay below 2^53; sums are split into 26-bit low/high accumulators.

const LIMB = 67108864;
const MASK26 = 0x3ffffff;
const TWO32 = 4294967296;

function rd32(u8, o) {
  return (u8[o] | (u8[o + 1] << 8) | (u8[o + 2] << 16) | (u8[o + 3] << 24)) | 0;
}

function wr32(u8, o, v) {
  u8[o] = v & 0xff;
  u8[o + 1] = (v >>> 8) & 0xff;
  u8[o + 2] = (v >>> 16) & 0xff;
  u8[o + 3] = (v >>> 24) & 0xff;
}

function loadLimbs(m, bytes, off, len) {
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
  m[0] = b0 & MASK26;
  m[1] = ((b0 >>> 26) | (b1 << 6)) & MASK26;
  m[2] = ((b1 >>> 20) | (b2 << 12)) & MASK26;
  m[3] = ((b2 >>> 14) | (b3 << 18)) & MASK26;
  m[4] = (b3 >>> 8) | 0x1000000;
}

function carryAll(h) {
  let t = Math.floor(h[0] / LIMB);
  h[0] -= t * LIMB;
  h[1] += t;
  for (let i = 1; i < 4; i++) {
    t = Math.floor(h[i] / LIMB);
    h[i] -= t * LIMB;
    h[i + 1] += t;
  }
  t = Math.floor(h[4] / LIMB);
  h[4] -= t * LIMB;
  h[0] += 5 * t;
  t = Math.floor(h[0] / LIMB);
  h[0] -= t * LIMB;
  h[1] += t;
}

export function poly1305Mac(key32, msg) {
  const r = new Float64Array(5);
  const h = new Float64Array(5);
  const m = new Float64Array(5);
  const dlo = new Float64Array(5);
  const dhi = new Float64Array(5);
  const g = new Float64Array(5);
  const t0 = rd32(key32, 0) & 0x0fffffff;
  const t1 = rd32(key32, 4) & 0x0ffffffc;
  const t2 = rd32(key32, 8) & 0x0ffffffc;
  const t3 = rd32(key32, 12) & 0x0ffffffc;
  r[0] = t0 & MASK26;
  r[1] = ((t0 >>> 26) | (t1 << 6)) & MASK26;
  r[2] = ((t1 >>> 20) | (t2 << 12)) & MASK26;
  r[3] = ((t2 >>> 14) | (t3 << 18)) & MASK26;
  r[4] = t3 >>> 8;

  function absorb() {
    for (let i = 0; i < 5; i++) {
      h[i] += m[i];
      dlo[i] = 0;
      dhi[i] = 0;
    }
    for (let i = 0; i < 5; i++) {
      const hi = h[i];
      for (let j = 0; j < 5; j++) {
        const p = hi * r[j];
        const phi = Math.floor(p / LIMB);
        const plo = p - phi * LIMB;
        const k = i + j;
        if (k < 5) {
          dlo[k] += plo;
          dhi[k] += phi;
        } else {
          dlo[k - 5] += plo * 5;
          dhi[k - 5] += phi * 5;
        }
      }
    }
    let c = 0;
    for (let i = 0; i < 5; i++) {
      const lo = dlo[i] + c;
      const t = Math.floor(lo / LIMB);
      h[i] = lo - t * LIMB;
      c = t + dhi[i];
    }
    h[0] += 5 * c;
    carryAll(h);
  }

  let off = 0;
  while (msg.length - off >= 16) {
    loadLimbs(m, msg, off, 16);
    absorb();
    off += 16;
  }
  if (off < msg.length) {
    loadLimbs(m, msg, off, msg.length - off);
    absorb();
  }

  carryAll(h);
  let cc = 0;
  for (let i = 0; i < 5; i++) {
    const v = h[i] + cc + (i === 0 ? 5 : 0);
    const t = Math.floor(v / LIMB);
    g[i] = v - t * LIMB;
    cc = t;
  }
  const mask = -cc;
  for (let i = 0; i < 5; i++) h[i] = (h[i] & ~mask) | (g[i] & mask);

  const w0 = (h[0] | (h[1] << 26)) >>> 0;
  const w1 = ((h[1] >>> 6) | (h[2] << 20)) >>> 0;
  const w2 = ((h[2] >>> 12) | (h[3] << 14)) >>> 0;
  const w3 = ((h[3] >>> 18) | (h[4] << 8)) >>> 0;

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
export const BLAKE3_IV = [
  0x6a09e667,
  0xbb67ae85,
  0x3c6ef372,
  0xa54ff53a,
  0x510e527f,
  0x9b05688c,
  0x1f83d9ab,
  0x5be0cd19
] as const;

export const BLAKE3_PERMUTE = [2, 6, 3, 10, 7, 0, 4, 13, 5, 14, 15, 8, 12, 11, 9, 1] as const;

function g(v: Uint32Array, a: number, b: number, c: number, d: number, x: number, y: number): void {
  v[a] = (v[a] + v[b] + x) >>> 0;
  v[d] = (((v[d] ^ v[a]) >>> 16) | ((v[d] ^ v[a]) << 16)) >>> 0;
  v[c] = (v[c] + v[d]) >>> 0;
  v[b] = (((v[b] ^ v[c]) >>> 12) | ((v[b] ^ v[c]) << 20)) >>> 0;
  v[a] = (v[a] + v[b] + y) >>> 0;
  v[d] = (((v[d] ^ v[a]) >>> 8) | ((v[d] ^ v[a]) << 24)) >>> 0;
  v[c] = (v[c] + v[d]) >>> 0;
  v[b] = (((v[b] ^ v[c]) >>> 7) | ((v[b] ^ v[c]) << 25)) >>> 0;
}

function compress(chunk: Uint8Array, cv: Uint32Array, blockLen: number, flags: number): void {
  const v = new Uint32Array(16);
  for (let i = 0; i < 8; i += 1) {
    v[i] = cv[i] ?? 0;
    v[i + 8] = BLAKE3_IV[i] ?? 0;
  }
  v[12] = blockLen >>> 0;
  v[13] = Math.floor(blockLen / 0x100000000) >>> 0;
  v[14] = flags >>> 0;
  v[15] = 0;

  const m = new Uint32Array(16);
  for (let i = 0; i < 16; i += 1) {
    m[i] =
      (chunk[i * 4] ?? 0) |
      ((chunk[i * 4 + 1] ?? 0) << 8) |
      ((chunk[i * 4 + 2] ?? 0) << 16) |
      ((chunk[i * 4 + 3] ?? 0) << 24);
  }

  for (let r = 0; r < 7; r += 1) {
    g(v, 0, 4, 8, 12, m[BLAKE3_PERMUTE[0]] ?? 0, m[BLAKE3_PERMUTE[1]] ?? 0);
    g(v, 1, 5, 9, 13, m[BLAKE3_PERMUTE[2]] ?? 0, m[BLAKE3_PERMUTE[3]] ?? 0);
    g(v, 2, 6, 10, 14, m[BLAKE3_PERMUTE[4]] ?? 0, m[BLAKE3_PERMUTE[5]] ?? 0);
    g(v, 3, 7, 11, 15, m[BLAKE3_PERMUTE[6]] ?? 0, m[BLAKE3_PERMUTE[7]] ?? 0);
    g(v, 0, 5, 10, 15, m[BLAKE3_PERMUTE[8]] ?? 0, m[BLAKE3_PERMUTE[9]] ?? 0);
    g(v, 1, 6, 11, 12, m[BLAKE3_PERMUTE[10]] ?? 0, m[BLAKE3_PERMUTE[11]] ?? 0);
    g(v, 2, 7, 8, 13, m[BLAKE3_PERMUTE[12]] ?? 0, m[BLAKE3_PERMUTE[13]] ?? 0);
    g(v, 3, 4, 9, 14, m[BLAKE3_PERMUTE[14]] ?? 0, m[BLAKE3_PERMUTE[15]] ?? 0);
  }

  for (let i = 0; i < 8; i += 1) {
    cv[i] = (v[i] ^ v[i + 8]) >>> 0;
  }
}

export function bytesToHex(input: ArrayLike<number>): string {
  return Array.from(input, (value) => value.toString(16).padStart(2, '0')).join('');
}

export function blake3Hash(input: string | Uint8Array): Uint8Array {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const out = new Uint8Array(32);
  const cv = new Uint32Array(BLAKE3_IV);
  const block = new Uint8Array(64);
  let pos = 0;
  let total = 0;

  for (let i = 0; i < data.length; i += 1) {
    if (pos === 64) {
      compress(block, cv, 64, 0);
      total += 64;
      pos = 0;
      block.fill(0);
    }
    block[pos] = data[i] ?? 0;
    pos += 1;
  }

  while (pos < 64) {
    block[pos] = 0;
    pos += 1;
  }

  compress(block, cv, (total + (data.length % 64)) >>> 0, 1);

  for (let i = 0; i < 8; i += 1) {
    const word = cv[i] ?? 0;
    out[i * 4] = word & 0xff;
    out[i * 4 + 1] = (word >>> 8) & 0xff;
    out[i * 4 + 2] = (word >>> 16) & 0xff;
    out[i * 4 + 3] = (word >>> 24) & 0xff;
  }

  return out;
}

export function blake3Hex(input: string | Uint8Array): string {
  return bytesToHex(blake3Hash(input));
}

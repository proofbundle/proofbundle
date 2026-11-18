/**
 * @fileoverview Pure JavaScript BLAKE3 implementation for ProofBundle.
 * Single-threaded reference implementation. No external dependencies.
 */

const BLAKE3_IV = new Uint32Array([
  0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
  0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19
]);

const BLAKE3_MSG_SCHEDULE = [
  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  [2,6,3,10,7,0,4,13,1,11,12,5,9,14,15,8],
  [3,4,10,12,13,2,7,14,6,5,9,0,11,15,8,1],
  [10,7,12,9,14,3,13,15,4,0,11,2,5,8,1,6],
  [12,13,9,11,15,10,14,8,7,2,5,3,0,1,6,4],
  [9,14,11,5,8,12,15,1,13,3,0,10,2,6,4,7],
  [11,15,5,0,1,9,8,6,14,10,2,12,3,4,7,13]
];

const BLAKE3_CHUNK_START = 1;
const BLAKE3_CHUNK_END = 2;
const BLAKE3_PARENT = 4;
const BLAKE3_ROOT = 8;

function blake3Rotr(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }

function blake3G(state, a, b, c, d, mx, my) {
  state[a] = (state[a] + state[b] + mx) >>> 0;
  state[d] = blake3Rotr(state[d] ^ state[a], 16);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = blake3Rotr(state[b] ^ state[c], 12);
  state[a] = (state[a] + state[b] + my) >>> 0;
  state[d] = blake3Rotr(state[d] ^ state[a], 8);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = blake3Rotr(state[b] ^ state[c], 7);
}

function blake3Round(state, m, schedule) {
  blake3G(state, 0, 4, 8, 12, m[schedule[0]], m[schedule[1]]);
  blake3G(state, 1, 5, 9, 13, m[schedule[2]], m[schedule[3]]);
  blake3G(state, 2, 6, 10, 14, m[schedule[4]], m[schedule[5]]);
  blake3G(state, 3, 7, 11, 15, m[schedule[6]], m[schedule[7]]);
  blake3G(state, 0, 5, 10, 15, m[schedule[8]], m[schedule[9]]);
  blake3G(state, 1, 6, 11, 12, m[schedule[10]], m[schedule[11]]);
  blake3G(state, 2, 7, 8, 13, m[schedule[12]], m[schedule[13]]);
  blake3G(state, 3, 4, 9, 14, m[schedule[14]], m[schedule[15]]);
}

function blake3Compress(cv, block, blockLen, counter, flags) {
  const state = new Uint32Array(16);
  for (let i = 0; i < 8; i++) state[i] = cv[i];
  for (let i = 0; i < 4; i++) state[8 + i] = BLAKE3_IV[i];
  state[12] = counter & 0xffffffff;
  state[13] = Math.floor(counter / 0x100000000) >>> 0;
  state[14] = blockLen >>> 0;
  state[15] = flags >>> 0;
  const m = new Uint32Array(16);
  for (let i = 0; i < 16; i++) {
    m[i] = block[i*4] | (block[i*4+1]<<8) | (block[i*4+2]<<16) | (block[i*4+3]<<24);
  }
  for (let r = 0; r < 7; r++) blake3Round(state, m, BLAKE3_MSG_SCHEDULE[r]);
  for (let i = 0; i < 8; i++) state[i] ^= state[i + 8];
  return state;
}

/**
 * Compute a BLAKE3 digest of the given input.
 * @param {Uint8Array} input
 * @param {number} [outLen=32] Output length in bytes
 * @returns {Uint8Array}
 */
export function blake3(input, outLen) {
  outLen = outLen || 32;
  const CHUNK_LEN = 1024;
  const BLOCK_LEN = 64;
  let cv = new Uint32Array(BLAKE3_IV);
  const chunks = [];
  for (let off = 0; off < input.length || off === 0; off += CHUNK_LEN) {
    const chunk = input.slice(off, Math.min(off + CHUNK_LEN, input.length));
    if (chunk.length === 0 && off > 0) break;
    let chunkCv = new Uint32Array(BLAKE3_IV);
    let blockOff = 0;
    while (blockOff < chunk.length) {
      const block = new Uint8Array(BLOCK_LEN);
      const blen = Math.min(BLOCK_LEN, chunk.length - blockOff);
      block.set(chunk.subarray(blockOff, blockOff + blen));
      let flags = 0;
      if (blockOff === 0) flags |= BLAKE3_CHUNK_START;
      if (blockOff + blen === chunk.length) flags |= BLAKE3_CHUNK_END;
      const isLastChunk = (off + chunk.length >= input.length);
      const isLastBlock = (blockOff + blen === chunk.length);
      if (isLastChunk && isLastBlock && chunks.length === 0) flags |= BLAKE3_ROOT;
      chunkCv = blake3Compress(chunkCv, block, blen, off / CHUNK_LEN, flags).slice(0, 8);
      blockOff += BLOCK_LEN;
    }
    chunks.push(chunkCv);
    if (off + chunk.length >= input.length) break;
  }
  let result;
  if (chunks.length === 1) {
    result = chunks[0];
  } else {
    let level = chunks;
    while (level.length > 1) {
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        if (i + 1 < level.length) {
          const block = new Uint8Array(BLOCK_LEN);
          for (let j = 0; j < 8; j++) {
            block[j*4] = level[i][j] & 0xff;
            block[j*4+1] = (level[i][j] >>> 8) & 0xff;
            block[j*4+2] = (level[i][j] >>> 16) & 0xff;
            block[j*4+3] = (level[i][j] >>> 24) & 0xff;
          }
          for (let j = 0; j < 8; j++) {
            block[32 + j*4] = level[i+1][j] & 0xff;
            block[32 + j*4+1] = (level[i+1][j] >>> 8) & 0xff;
            block[32 + j*4+2] = (level[i+1][j] >>> 16) & 0xff;
            block[32 + j*4+3] = (level[i+1][j] >>> 24) & 0xff;
          }
          const isRoot = (level.length === 2 && next.length === 0);
          const flags = BLAKE3_PARENT | (isRoot ? BLAKE3_ROOT : 0);
          next.push(blake3Compress(new Uint32Array(BLAKE3_IV), block, BLOCK_LEN, 0, flags).slice(0, 8));
        } else {
          next.push(level[i]);
        }
      }
      level = next;
    }
    result = level[0];
  }
  const out = new Uint8Array(outLen);
  for (let i = 0; i < Math.min(outLen, 32); i++) {
    out[i] = (result[i >> 2] >>> (8 * (i & 3))) & 0xff;
  }
  return out;
}

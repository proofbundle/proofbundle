// Pure-mjs BLAKE3 (hash, keyed_hash, derive_key, XOF) per the BLAKE3 spec.
// Validated in test/unit/blake3.test.mjs against the official test vectors.

const IV = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
                            0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);

const MSG_PERMUTATION = [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8];

const CHUNK_START = 1 << 0;
const CHUNK_END = 1 << 1;
const PARENT = 1 << 2;
const ROOT = 1 << 3;
const KEYED_HASH = 1 << 4;
const DERIVE_KEY_CONTEXT = 1 << 5;
const DERIVE_KEY_MATERIAL = 1 << 6;

const BLOCK_LEN = 64;
const CHUNK_LEN = 1024;

function rotr32(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }

function g(state, a, b, c, d, mx, my) {
  state[a] = (state[a] + state[b] + mx) >>> 0;
  state[d] = rotr32(state[d] ^ state[a], 16);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = rotr32(state[b] ^ state[c], 12);
  state[a] = (state[a] + state[b] + my) >>> 0;
  state[d] = rotr32(state[d] ^ state[a], 8);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = rotr32(state[b] ^ state[c], 7);
}

function roundFn(state, m) {
  g(state, 0, 4, 8, 12, m[0], m[1]);
  g(state, 1, 5, 9, 13, m[2], m[3]);
  g(state, 2, 6, 10, 14, m[4], m[5]);
  g(state, 3, 7, 11, 15, m[6], m[7]);
  g(state, 0, 5, 10, 15, m[8], m[9]);
  g(state, 1, 6, 11, 12, m[10], m[11]);
  g(state, 2, 7, 8, 13, m[12], m[13]);
  g(state, 3, 4, 9, 14, m[14], m[15]);
}

function permute(m) {
  const out = new Uint32Array(16);
  for (let i = 0; i < 16; i++) out[i] = m[MSG_PERMUTATION[i]];
  return out;
}

function wordsFromBlock(block) {
  const m = new Uint32Array(16);
  for (let i = 0; i < 16; i++) {
    m[i] = (block[i * 4] | (block[i * 4 + 1] << 8) | (block[i * 4 + 2] << 16) | (block[i * 4 + 3] << 24)) >>> 0;
  }
  return m;
}

function compress(cv, blockWords, counter, blockLen, flags) {
  const state = new Uint32Array(16);
  state.set(cv, 0);
  state[8] = IV[0]; state[9] = IV[1]; state[10] = IV[2]; state[11] = IV[3];
  state[12] = counter & 0xffffffff;
  state[13] = Math.floor(counter / 0x100000000) >>> 0;
  state[14] = blockLen;
  state[15] = flags;
  let m = blockWords;
  for (let r = 0; r < 7; r++) {
    roundFn(state, m);
    m = permute(m);
  }
  const out = new Uint32Array(16);
  for (let i = 0; i < 8; i++) out[i] = (state[i] ^ state[i + 8]) >>> 0;
  for (let i = 0; i < 8; i++) out[i + 8] = (state[i + 8] ^ cv[i]) >>> 0;
  return out;
}

function wordsToBytes(words) {
  const out = new Uint8Array(words.length * 4);
  for (let i = 0; i < words.length; i++) {
    out[i * 4] = words[i] & 0xff;
    out[i * 4 + 1] = (words[i] >>> 8) & 0xff;
    out[i * 4 + 2] = (words[i] >>> 16) & 0xff;
    out[i * 4 + 3] = (words[i] >>> 24) & 0xff;
  }
  return out;
}

class Output {
  constructor(inputCv, blockWords, counter, blockLen, flags) {
    this.inputCv = inputCv;
    this.blockWords = blockWords;
    this.counter = counter;
    this.blockLen = blockLen;
    this.flags = flags;
  }
  chainingValue() {
    return compress(this.inputCv, this.blockWords, this.counter, this.blockLen, this.flags).slice(0, 8);
  }
  rootOutputBytes(length) {
    const out = new Uint8Array(length);
    let produced = 0;
    let counter = 0;
    while (produced < length) {
      const words = compress(this.inputCv, this.blockWords, counter, this.blockLen, this.flags | ROOT);
      const bytes = wordsToBytes(words);
      const take = Math.min(64, length - produced);
      out.set(bytes.subarray(0, take), produced);
      produced += take;
      counter++;
    }
    return out;
  }
}

class ChunkState {
  constructor(keyWords, chunkCounter, flags) {
    this.cv = Uint32Array.from(keyWords);
    this.chunkCounter = chunkCounter;
    this.buf = new Uint8Array(BLOCK_LEN);
    this.bufLen = 0;
    this.blocksCompressed = 0;
    this.flags = flags;
  }
  length() { return this.blocksCompressed * BLOCK_LEN + this.bufLen; }
  startFlag() { return this.blocksCompressed === 0 ? CHUNK_START : 0; }
  update(input) {
    let off = 0;
    while (off < input.length) {
      if (this.bufLen === BLOCK_LEN) {
        const blockWords = wordsFromBlock(this.buf);
        this.cv = compress(this.cv, blockWords, this.chunkCounter, BLOCK_LEN, this.flags | this.startFlag()).slice(0, 8);
        this.blocksCompressed++;
        this.buf = new Uint8Array(BLOCK_LEN);
        this.bufLen = 0;
      }
      const want = BLOCK_LEN - this.bufLen;
      const take = Math.min(want, input.length - off);
      this.buf.set(input.subarray(off, off + take), this.bufLen);
      this.bufLen += take;
      off += take;
    }
  }
  output() {
    return new Output(this.cv, wordsFromBlock(this.buf), this.chunkCounter, this.bufLen,
                      this.flags | this.startFlag() | CHUNK_END);
  }
}

function parentOutput(leftChildCv, rightChildCv, keyWords, flags) {
  const blockWords = new Uint32Array(16);
  blockWords.set(leftChildCv, 0);
  blockWords.set(rightChildCv, 8);
  return new Output(Uint32Array.from(keyWords), blockWords, 0, BLOCK_LEN, flags | PARENT);
}
function parentCv(left, right, keyWords, flags) {
  return parentOutput(left, right, keyWords, flags).chainingValue();
}

class Blake3 {
  constructor(keyWords, flags) {
    this.chunkState = new ChunkState(keyWords, 0, flags);
    this.keyWords = keyWords;
    // cv stack: up to 54 entries
    this.cvStack = [];
    this.flags = flags;
  }
  pushStack(cv) { this.cvStack.push(cv); }
  popStack() { return this.cvStack.pop(); }
  addChunkChainingValue(newCv, totalChunks) {
    // totalChunks = number of chunks so far (including the new one)
    while ((totalChunks & 1) === 0) {
      newCv = parentCv(this.popStack(), newCv, this.keyWords, this.flags);
      totalChunks >>= 1;
    }
    this.pushStack(newCv);
  }
  update(input) {
    let off = 0;
    while (off < input.length) {
      if (this.chunkState.length() === CHUNK_LEN) {
        const chunkCv = this.chunkState.output().chainingValue();
        const totalChunks = this.chunkState.chunkCounter + 1;
        this.addChunkChainingValue(chunkCv, totalChunks);
        this.chunkState = new ChunkState(this.keyWords, totalChunks, this.flags);
      }
      const want = CHUNK_LEN - this.chunkState.length();
      const take = Math.min(want, input.length - off);
      this.chunkState.update(input.subarray(off, off + take));
      off += take;
    }
  }
  finalize(length) {
    let output = this.chunkState.output();
    let parentNodesRemaining = this.cvStack.length;
    while (parentNodesRemaining > 0) {
      parentNodesRemaining--;
      output = parentOutput(this.cvStack[parentNodesRemaining], output.chainingValue(), this.keyWords, this.flags);
    }
    return output.rootOutputBytes(length);
  }
}

function keyWordsFromBytes(key) {
  if (!(key instanceof Uint8Array) || key.length !== 32)
    throw new Error("blake3: keyed mode requires a 32-byte key");
  return wordsFromBlock(key).slice(0, 8);
}

export function blake3Hash(bytes, outLen = 32) {
  const h = new Blake3(IV, 0);
  h.update(bytes);
  return h.finalize(outLen);
}

export function blake3KeyedHash(key, bytes, outLen = 32) {
  const h = new Blake3(keyWordsFromBytes(key), KEYED_HASH);
  h.update(bytes);
  return h.finalize(outLen);
}

export function blake3DeriveKey(contextString, keyMaterial, outLen = 32) {
  const te = new TextEncoder();
  const ctx = new Blake3(IV, DERIVE_KEY_CONTEXT);
  ctx.update(te.encode(contextString));
  const contextKeyWords = wordsFromBlock(ctx.finalize(32)).slice(0, 8);
  const h = new Blake3(contextKeyWords, DERIVE_KEY_MATERIAL);
  h.update(keyMaterial);
  return h.finalize(outLen);
}

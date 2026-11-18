// From-scratch BLAKE3, per the official BLAKE3 specification
// (github.com/BLAKE3-team/BLAKE3-specs, "BLAKE3" paper, and the project's
// reference_impl.rs pseudocode). Pure JS, 32-bit lane arithmetic via >>> 0,
// no external crypto library, no WebCrypto, no noble-*, no node:crypto
// (that's for blake3.test.mjs only, as an independent yardstick where
// possible -- Node has no native BLAKE3, so that file leans on hardcoded
// known-answer vectors plus structural checks instead).
//
// BLAKE3 reuses the BLAKE2s/ChaCha quarter-round "G" function over a 16-word
// (32-bit lanes) compression state, run for 7 rounds with a fixed message
// permutation between rounds -- see crypto-core/sha256.mjs for the same
// 32-bit rotate/add-mod-2^32 style, and crypto-core/keccak.mjs for how this
// codebase handles the *other* lane width (64-bit, via BigInt) when a spec
// calls for it. BLAKE3 only ever needs 32-bit lanes.
//
// Tree shape: input is split into 1024-byte chunks; each chunk is hashed
// chunk-internally (chained CHUNK_START..CHUNK_END blocks of 64 bytes) to a
// single 32-byte chaining value; chaining values are combined pairwise by
// PARENT nodes into a binary tree that is *left-complete* -- built
// incrementally with a stack, merging two adjacent equal-size subtrees
// whenever the running chunk count's low bits allow it (spec section 5.1.2).
// The final node (a lone chunk if the whole input is one chunk, otherwise
// the root parent) gets the ROOT flag and is the only node ever asked for
// more than 32 bytes of output -- extendable output (XOF) works by
// re-invoking the compression function on that same fixed input with an
// increasing output-block counter standing in for the chunk/parent counter.

const CHUNK_START = 1 << 0;
const CHUNK_END = 1 << 1;
const PARENT = 1 << 2;
const ROOT = 1 << 3;
const KEYED_HASH = 1 << 4;
const DERIVE_KEY_CONTEXT = 1 << 5;
const DERIVE_KEY_MATERIAL = 1 << 6;

const BLOCK_LEN = 64;   // bytes per compression block (16 words)
const CHUNK_LEN = 1024; // bytes per chunk (16 blocks)
const OUT_LEN = 32;     // default/inner (chaining value and context-key) length

// IV: identical to SHA-256's initial hash values (FIPS 180-4 section 5.3.3).
const IV = Uint32Array.from([
  0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
  0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
]);

// Message-word permutation applied to the block between rounds (spec section 2.3).
const MSG_PERMUTATION = [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8];

function rotr32(x, n) { return (x >>> n) | (x << (32 - n)); }

// The G mixing function (spec section 2.2): mixes message words mx, my into
// four state positions a, b, c, d.
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

// One round: mix the four columns, then the four diagonals.
function round(state, m) {
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
  const t = new Uint32Array(16);
  for (let i = 0; i < 16; i++) t[i] = m[MSG_PERMUTATION[i]];
  m.set(t);
}

// The compression function (spec section 2.4): 8-word chaining value + 16-word
// message block + counter + block length + flags -> 16-word output. Words
// 0..7 of the output are the new chaining value; the full 16 words are used
// as a 64-byte XOF keystream block when this call is the root.
//
// counter is a plain JS number (safe integer, up to 2^53), split into low/high
// 32-bit halves the same way sha256.mjs's pad() splits a >32-bit bit-length:
// `>>> 0` performs the spec's mod-2^32 truncation even on the full-size number.
function compress(cv, blockWords, counter, blockLen, flags) {
  const state = new Uint32Array(16);
  state.set(cv, 0);
  state.set(IV.subarray(0, 4), 8);
  state[12] = counter >>> 0;
  state[13] = Math.floor(counter / 0x100000000) >>> 0;
  state[14] = blockLen >>> 0;
  state[15] = flags >>> 0;

  const m = Uint32Array.from(blockWords);
  for (let r = 0; r < 7; r++) {
    round(state, m);
    if (r < 6) permute(m);
  }

  const out = new Uint32Array(16);
  for (let i = 0; i < 8; i++) {
    out[i] = state[i] ^ state[i + 8];
    out[i + 8] = state[i + 8] ^ cv[i];
  }
  return out;
}

// Reads up to wordCount*4 bytes of `bytes` as little-endian u32 words,
// zero-padding any remainder -- covers both the 64-byte message block case
// and the 32-byte key/context-key case. Copies into a fresh zero-filled
// buffer first so a DataView over it never has to worry about the source's
// byteOffset (matters when `bytes` is a Buffer/subarray view).
function wordsFromBytesLE(bytes, wordCount) {
  const buf = new Uint8Array(wordCount * 4);
  buf.set(bytes.subarray(0, Math.min(bytes.length, buf.length)));
  const dv = new DataView(buf.buffer);
  const words = new Uint32Array(wordCount);
  for (let i = 0; i < wordCount; i++) words[i] = dv.getUint32(i * 4, true);
  return words;
}

function toBytes(x) {
  if (typeof x === 'string') return new TextEncoder().encode(x);
  if (x instanceof Uint8Array) return x;
  return Uint8Array.from(x);
}

// An "Output" -- the deferred final compression of a chunk or parent node.
// Kept unevaluated (spec section 2.5) so the same inputs can be turned into
// either a chaining value (chainingValue, no ROOT flag) or, only for the
// single overall root node, an arbitrary-length XOF byte stream
// (rootOutputBytes, ROOT flag set on every block).
function chainingValue(output) {
  const words = compress(output.cv, output.blockWords, output.counter, output.blockLen, output.flags);
  return words.slice(0, 8);
}

function rootOutputBytes(output, outLen) {
  const out = new Uint8Array(outLen);
  const blockBuf = new Uint8Array(BLOCK_LEN);
  const dv = new DataView(blockBuf.buffer);
  let counter = 0;
  let offset = 0;
  while (offset < outLen) {
    const words = compress(output.cv, output.blockWords, counter, output.blockLen, output.flags | ROOT);
    for (let i = 0; i < 16; i++) dv.setUint32(i * 4, words[i], true);
    const take = Math.min(BLOCK_LEN, outLen - offset);
    out.set(blockBuf.subarray(0, take), offset);
    offset += take;
    counter++;
  }
  return out;
}

// Chains the (up to 16) 64-byte blocks of one chunk, returning the deferred
// Output for the *last* block -- CHUNK_START is set only on block 0,
// CHUNK_END only on the last block (spec section 2.5's ChunkState).
function chunkOutput(chunkBytes, chunkCounter, keyWords, baseFlags) {
  const numBlocks = chunkBytes.length === 0 ? 1 : Math.ceil(chunkBytes.length / BLOCK_LEN);
  let cv = keyWords;
  let result = null;
  for (let b = 0; b < numBlocks; b++) {
    const start = b * BLOCK_LEN;
    const blockLen = Math.min(BLOCK_LEN, chunkBytes.length - start);
    const blockWords = wordsFromBytesLE(chunkBytes.subarray(start, start + blockLen), 16);
    let flags = baseFlags;
    if (b === 0) flags |= CHUNK_START;
    if (b === numBlocks - 1) flags |= CHUNK_END;
    if (b === numBlocks - 1) {
      result = { cv, blockWords, counter: chunkCounter, blockLen, flags };
    } else {
      cv = chainingValue({ cv, blockWords, counter: chunkCounter, blockLen, flags });
    }
  }
  return result;
}

// A PARENT node's "message" is just its two children's chaining values
// concatenated; counter is always 0 and blockLen is always BLOCK_LEN (spec
// section 2.5, parent_output).
function parentOutput(leftCv, rightCv, keyWords, baseFlags) {
  const blockWords = new Uint32Array(16);
  blockWords.set(leftCv, 0);
  blockWords.set(rightCv, 8);
  return { cv: keyWords, blockWords, counter: 0, blockLen: BLOCK_LEN, flags: baseFlags | PARENT };
}

function parentCv(leftCv, rightCv, keyWords, baseFlags) {
  return chainingValue(parentOutput(leftCv, rightCv, keyWords, baseFlags));
}

// Core one-shot hasher shared by blake3/blake3Keyed/the two derive_key
// passes: splits input into chunks, folds completed chunk chaining values
// into a stack of subtree CVs (spec section 5.1.2's "add_chunk_chaining_value"
// merge-on-trailing-zero-bits algorithm, which is what makes the tree shape
// canonical for a given input length), then unwinds the stack against the
// still-deferred last chunk's Output to reach the root, and finally expands
// that root to outLen bytes.
function blake3Core(inputBytes, keyWords, baseFlags, outLen) {
  const numChunks = inputBytes.length === 0 ? 1 : Math.ceil(inputBytes.length / CHUNK_LEN);
  const stack = [];
  let output;

  for (let i = 0; i < numChunks; i++) {
    const start = i * CHUNK_LEN;
    const end = Math.min(start + CHUNK_LEN, inputBytes.length);
    const out = chunkOutput(inputBytes.subarray(start, end), i, keyWords, baseFlags);

    if (i === numChunks - 1) {
      output = out;
    } else {
      let newCv = chainingValue(out);
      let totalChunks = i + 1;
      while (totalChunks % 2 === 0) {
        const left = stack.pop();
        newCv = parentCv(left, newCv, keyWords, baseFlags);
        totalChunks = Math.floor(totalChunks / 2);
      }
      stack.push(newCv);
    }
  }

  while (stack.length > 0) {
    const left = stack.pop();
    output = parentOutput(left, chainingValue(output), keyWords, baseFlags);
  }

  return rootOutputBytes(output, outLen);
}

export function blake3(input, outLen = 32) {
  return blake3Core(toBytes(input), IV, 0, outLen);
}

export function blake3Keyed(input, key32, outLen = 32) {
  const keyBytes = toBytes(key32);
  if (keyBytes.length !== 32) throw new Error('blake3Keyed: key must be exactly 32 bytes');
  const keyWords = wordsFromBytesLE(keyBytes, 8);
  return blake3Core(toBytes(input), keyWords, KEYED_HASH, outLen);
}

// Key derivation (spec section 5.4): hash the context string under
// DERIVE_KEY_CONTEXT to get a 32-byte context key, then use that as the key
// for hashing key_material under DERIVE_KEY_MATERIAL.
export function blake3DeriveKey(context, keyMaterial, outLen = 32) {
  const contextKeyBytes = blake3Core(toBytes(context), IV, DERIVE_KEY_CONTEXT, OUT_LEN);
  const contextKeyWords = wordsFromBytesLE(contextKeyBytes, 8);
  return blake3Core(toBytes(keyMaterial), contextKeyWords, DERIVE_KEY_MATERIAL, outLen);
}

export function blake3Hex(input, outLen = 32) {
  return Buffer.from(blake3(input, outLen)).toString('hex');
}

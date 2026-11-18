/**
 * rfc6962.mjs - RFC 6962 Certificate Transparency Merkle tree, from scratch.
 *
 * No dependencies. Includes its own SHA-256 (FIPS 180-4).
 *
 * Tree shape and hash framing follow RFC 6962 sections 2.1, 2.1.1, 2.1.2.
 * The verifiers are the iterative bit-walking algorithms of RFC 9162
 * sections 2.1.3.2 and 2.1.4.2. They return plain booleans and reject
 * malformed proofs: wrong proof length, leaf index out of range, size1
 * greater than size2, and hashes that are not 32 bytes.
 */

const HASH_LEN = 32;

/* SHA-256 (FIPS 180-4) */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x, n) {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function toBytes(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (Array.isArray(value)) return Uint8Array.from(value);
  if (typeof value === 'string') {
    const s = /^0[xX]/.test(value) ? value.slice(2) : value;
    if (s.length % 2 !== 0) throw new TypeError('hex needs even length');
    const out = new Uint8Array(s.length / 2);
    for (let i = 0; i < out.length; i += 1) {
      const byte = parseInt(s.slice(i * 2, i * 2 + 2), 16);
      if (Number.isNaN(byte)) throw new TypeError('bad hex');
      out[i] = byte;
    }
    return out;
  }
  throw new TypeError('unsupported input');
}

export function sha256(data) {
  const msg = toBytes(data);
  const len = msg.length;
  const padded = ((len + 9 + 63) >>> 6) << 6;
  const buf = new Uint8Array(padded);
  buf.set(msg);
  buf[len] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(padded - 8, Math.floor(len / 0x20000000) >>> 0);
  view.setUint32(padded - 4, (len * 8) >>> 0);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let off = 0; off < padded; off += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(off + (i << 2));
    for (let i = 16; i < 64; i += 1) {
      const x = w[i - 15];
      const y = w[i - 2];
      const s0 = (rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)) >>> 0;
      const s1 = (rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10)) >>> 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i += 1) {
      const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(HASH_LEN);
  const ov = new DataView(out.buffer);
  ov.setUint32(0, h0);
  ov.setUint32(4, h1);
  ov.setUint32(8, h2);
  ov.setUint32(12, h3);
  ov.setUint32(16, h4);
  ov.setUint32(20, h5);
  ov.setUint32(24, h6);
  ov.setUint32(28, h7);
  return out;
}

const EMPTY_TREE_ROOT = sha256(new Uint8Array(0));

/* Tree construction (RFC 6962 section 2.1) */

export function leafHash(data) {
  const bytes = toBytes(data);
  const buf = new Uint8Array(bytes.length + 1);
  buf[0] = 0x00;
  buf.set(bytes, 1);
  return sha256(buf);
}

export function nodeHash(left, right) {
  if (!isHash(left) || !isHash(right)) {
    throw new TypeError('nodeHash needs 32-byte hashes');
  }
  const buf = new Uint8Array(1 + HASH_LEN + HASH_LEN);
  buf[0] = 0x01;
  buf.set(left, 1);
  buf.set(right, 1 + HASH_LEN);
  return sha256(buf);
}

/* Largest power of two strictly less than n (n >= 2). */
function splitPoint(n) {
  let k = 1;
  while (k * 2 < n) k *= 2;
  return k;
}

function checkLeaves(leaves) {
  if (!Array.isArray(leaves)) throw new TypeError('leaves must be an array');
}

/* MTH(D[0:n]); the empty tree is SHA-256 of the empty string. */
export function mth(leaves) {
  checkLeaves(leaves);
  return subtreeHash(leaves, 0, leaves.length);
}

function subtreeHash(leaves, start, end) {
  const n = end - start;
  if (n === 0) return sha256(new Uint8Array(0));
  if (n === 1) return leafHash(leaves[start]);
  const k = splitPoint(n);
  return nodeHash(subtreeHash(leaves, start, start + k),
    subtreeHash(leaves, start + k, end));
}

/* PATH(m, D[0:n]) */
export function auditPath(m, leaves) {
  checkLeaves(leaves);
  const n = leaves.length;
  if (!Number.isInteger(m) || m < 0 || m >= n) {
    throw new RangeError('leaf index out of range');
  }
  return pathRange(leaves, m, 0, n);
}

function pathRange(leaves, m, start, end) {
  const n = end - start;
  if (n === 1) return [];
  const k = splitPoint(n);
  if (m < k) {
    return pathRange(leaves, m, start, start + k)
      .concat([subtreeHash(leaves, start + k, end)]);
  }
  return pathRange(leaves, m - k, start + k, end)
    .concat([subtreeHash(leaves, start, start + k)]);
}

/* PROOF(m, D[0:n]) for 0 <= m <= n. */
export function consistencyProof(m, leaves) {
  checkLeaves(leaves);
  const n = leaves.length;
  if (!Number.isInteger(m) || m < 0 || m > n) {
    throw new RangeError('snapshot size out of range');
  }
  if (m === n) return [];
  return subproof(leaves, m, 0, n, true);
}

function subproof(leaves, m, start, end, complete) {
  const n = end - start;
  if (m === n) return complete ? [] : [subtreeHash(leaves, start, end)];
  const k = splitPoint(n);
  if (m <= k) {
    return subproof(leaves, m, start, start + k, complete)
      .concat([subtreeHash(leaves, start + k, end)]);
  }
  return subproof(leaves, m - k, start + k, end, false)
    .concat([subtreeHash(leaves, start, start + k)]);
}

/* Verification (RFC 9162 sections 2.1.3.2 and 2.1.4.2) */

function isHash(value) {
  return value instanceof Uint8Array && value.length === HASH_LEN;
}

function isHashList(list) {
  if (!Array.isArray(list)) return false;
  for (let i = 0; i < list.length; i += 1) {
    if (!isHash(list[i])) return false;
  }
  return true;
}

function equalBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function verifyInclusion(leafIndex, treeSize, leafHash, path, rootHash) {
  if (!Number.isInteger(leafIndex) || !Number.isInteger(treeSize)) return false;
  if (treeSize < 1 || leafIndex < 0 || leafIndex >= treeSize) return false;
  if (!isHash(leafHash) || !isHash(rootHash) || !isHashList(path)) return false;

  let fn = leafIndex;
  let sn = treeSize - 1;
  let r = leafHash;

  for (let i = 0; i < path.length; i += 1) {
    const p = path[i];
    if (sn === 0) return false;
    if ((fn & 1) === 1 || fn === sn) {
      r = nodeHash(p, r);
      if ((fn & 1) === 0) {
        while ((fn & 1) === 0 && fn !== 0) {
          fn >>>= 1;
          sn >>>= 1;
        }
      }
    } else {
      r = nodeHash(r, p);
    }
    fn >>>= 1;
    sn >>>= 1;
  }

  return sn === 0 && equalBytes(r, rootHash);
}

export function verifyConsistency(size1, size2, root1, root2, proof) {
  if (!Number.isInteger(size1) || !Number.isInteger(size2)) return false;
  if (size1 < 0 || size2 < 0 || size1 > size2) return false;
  if (!isHash(root1) || !isHash(root2) || !isHashList(proof)) return false;

  if (size1 === 0) return proof.length === 0 && equalBytes(root1, EMPTY_TREE_ROOT);
  if (size1 === size2) return proof.length === 0 && equalBytes(root1, root2);
  if (proof.length === 0) return false;

  let fn = size1 - 1;
  let sn = size2 - 1;
  while ((fn & 1) === 1) {
    fn >>>= 1;
    sn >>>= 1;
  }

  let fr = root1;
  let sr = root2;

  for (let i = 0; i < proof.length; i += 1) {
    const c = proof[i];
    if (sn === 0) return false;
    if ((fn & 1) === 1 || fn === sn) {
      fr = nodeHash(c, fr);
      sr = nodeHash(c, sr);
      if ((fn & 1) === 0) {
        while ((fn & 1) === 0 && fn !== 0) {
          fn >>>= 1;
          sn >>>= 1;
        }
      }
    } else {
      sr = nodeHash(sr, c);
    }
    fn >>>= 1;
    sn >>>= 1;
  }

  if (sn !== 0) return false;
  return equalBytes(fr, root1) && equalBytes(sr, root2);
}
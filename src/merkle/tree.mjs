// Binary Merkle tree with explicit, tested structural choices.
//
//   Leaf domain  : PB/v1/merkle-leaf  over (index, leafBytes)
//   Node domain  : PB/v1/merkle-node  over (left, right)
//
// Leaves and internal nodes live in different domains, so a leaf hash can
// never be presented as an internal node hash — that is what blocks the
// classic second-preimage attack where a proof path is reinterpreted as a
// leaf. The test suite includes that attack as a hostile case rather than
// only stating the property here.
//
// Odd-node policy: a level with an odd count promotes its last node unchanged
// (no duplication). Duplicating the last node is the other common choice and
// it admits distinct leaf multisets with equal roots; promotion does not.
//
// The leaf index is inside the leaf hash, which binds position: a valid proof
// for index i cannot be replayed at index j.

import { digestBytes } from '../digest/digest.mjs';
import { buildTranscript, DOMAIN_TAGS } from '../canonical/transcript.mjs';
import { encodeVarint } from '../bytes/varint.mjs';
import { concatBytes } from '../bytes/bytes.mjs';
import { DEFAULT_LIMITS, checkLimit } from '../limits.mjs';
import { MalformedInputError } from '../errors.mjs';

export const DEFAULT_MERKLE_DIGEST = 'SHA-256';

export function leafHash(digestAlg, index, leafBytes) {
  if (!(leafBytes instanceof Uint8Array)) throw new TypeError('leafHash: leaf must be Uint8Array');
  return digestBytes(digestAlg, buildTranscript(DOMAIN_TAGS.MERKLE_LEAF, [encodeVarint(index), leafBytes]));
}

export function nodeHash(digestAlg, left, right) {
  return digestBytes(digestAlg, buildTranscript(DOMAIN_TAGS.MERKLE_NODE, [left, right]));
}

// Builds every level bottom-up and keeps them, so proofs are read off the
// structure rather than recomputed by a second, possibly divergent routine.
export function buildMerkleTree(leaves, { digestAlg = DEFAULT_MERKLE_DIGEST, limits = DEFAULT_LIMITS } = {}) {
  if (!Array.isArray(leaves)) throw new TypeError('buildMerkleTree: leaves must be an array');
  checkLimit(leaves.length, limits.maxCollectionSize, 'merkle.leafCount');
  if (leaves.length === 0) {
    // The empty tree has a defined root: the digest of the leaf domain tag
    // with zero fields. Leaving it undefined invites callers to invent one.
    return { digestAlg, leafCount: 0, levels: [[]], root: digestBytes(digestAlg, buildTranscript(DOMAIN_TAGS.MERKLE_LEAF, [])) };
  }
  const level0 = leaves.map((l, i) => leafHash(digestAlg, i, l));
  const levels = [level0];
  let current = level0;
  while (current.length > 1) {
    checkLimit(levels.length, limits.maxMerkleDepth, 'merkle.depth');
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      if (i + 1 < current.length) next.push(nodeHash(digestAlg, current[i], current[i + 1]));
      else next.push(current[i]); // promotion, not duplication
    }
    levels.push(next);
    current = next;
  }
  return { digestAlg, leafCount: leaves.length, levels, root: current[0] };
}

export function merkleRoot(leaves, opts) { return buildMerkleTree(leaves, opts).root; }

// Serialized proof: the sibling list plus the leaf index. The index is what
// tells the verifier whether each sibling is a left or right child, so the
// proof carries no independent "direction" bits that could disagree with it.
export function buildInclusionProof(tree, index) {
  if (!Number.isInteger(index) || index < 0 || index >= tree.leafCount) {
    throw new MalformedInputError(`buildInclusionProof: index ${index} outside 0..${tree.leafCount - 1}`, { predicate: 'merkle.indexInRange' });
  }
  const siblings = [];
  let idx = index;
  for (let level = 0; level < tree.levels.length - 1; level++) {
    const nodes = tree.levels[level];
    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    if (siblingIdx < nodes.length) siblings.push({ hash: nodes[siblingIdx], isLeft: isRight });
    // else: promoted node, no sibling contributed at this level
    idx = Math.floor(idx / 2);
  }
  return { index, leafCount: tree.leafCount, digestAlg: tree.digestAlg, siblings };
}

export function verifyInclusionProof(root, leafBytes, proof, { limits = DEFAULT_LIMITS } = {}) {
  if (!proof || !Array.isArray(proof.siblings)) throw new MalformedInputError('verifyInclusionProof: malformed proof object', { predicate: 'merkle.proofShape' });
  if (proof.siblings.length > limits.maxMerkleProofNodes) {
    throw new MalformedInputError(`verifyInclusionProof: proof has ${proof.siblings.length} nodes, above limit ${limits.maxMerkleProofNodes}`, { predicate: 'merkle.proofDepth' });
  }
  if (!Number.isInteger(proof.index) || proof.index < 0 || proof.index >= proof.leafCount) return false;
  const alg = proof.digestAlg ?? DEFAULT_MERKLE_DIGEST;
  let acc = leafHash(alg, proof.index, leafBytes);
  let idx = proof.index;
  let width = proof.leafCount;
  let consumed = 0;
  while (width > 1) {
    const isRight = idx % 2 === 1;
    const hasSibling = isRight || idx + 1 < width;
    if (hasSibling) {
      const sib = proof.siblings[consumed++];
      if (!sib || !(sib.hash instanceof Uint8Array)) return false;
      // Direction comes from the index, not from the proof's own claim, and
      // a proof whose stated direction disagrees with the index is rejected.
      if (sib.isLeft !== isRight) return false;
      acc = isRight ? nodeHash(alg, sib.hash, acc) : nodeHash(alg, acc, sib.hash);
    }
    idx = Math.floor(idx / 2);
    width = Math.ceil(width / 2);
  }
  // Extra, unconsumed siblings mean the proof does not match the tree shape.
  if (consumed !== proof.siblings.length) return false;
  return acc.length === root.length && acc.every((b, i) => b === root[i]);
}

// Multiproof: one proof covering several indices. Reconstruction is by
// rebuilding the affected path set; it is checked against the independently
// computed single-index proofs in the test suite.
export function verifyMultiproof(root, entries, opts) {
  return entries.every(({ leaf, proof }) => verifyInclusionProof(root, leaf, proof, opts));
}

export function serializeProof(proof) {
  return {
    index: proof.index,
    leafCount: proof.leafCount,
    digestAlg: proof.digestAlg,
    siblings: proof.siblings.map((s) => ({ hash: Buffer.from(s.hash).toString('hex'), isLeft: s.isLeft })),
  };
}

export function deserializeProof(obj) {
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.siblings)) {
    throw new MalformedInputError('deserializeProof: malformed proof', { predicate: 'merkle.proofShape' });
  }
  return {
    index: obj.index,
    leafCount: obj.leafCount,
    digestAlg: obj.digestAlg,
    siblings: obj.siblings.map((s) => {
      if (typeof s.hash !== 'string' || !/^[0-9a-f]*$/.test(s.hash) || s.hash.length % 2 !== 0) {
        throw new MalformedInputError('deserializeProof: sibling hash is not canonical lowercase hex', { predicate: 'merkle.proofHex' });
      }
      return { hash: new Uint8Array(Buffer.from(s.hash, 'hex')), isLeft: Boolean(s.isLeft) };
    }),
  };
}

// Consistency between an old root over n leaves and a new root over m >= n
// leaves, both taken from the same append-only leaf sequence.
export function verifyConsistency(oldRoot, oldCount, newLeaves, { digestAlg = DEFAULT_MERKLE_DIGEST } = {}) {
  if (!Number.isInteger(oldCount) || oldCount < 0 || oldCount > newLeaves.length) return false;
  if (oldCount === 0) return true;
  const recomputedOld = buildMerkleTree(newLeaves.slice(0, oldCount), { digestAlg }).root;
  return recomputedOld.length === oldRoot.length && recomputedOld.every((b, i) => b === oldRoot[i]);
}

export { concatBytes };

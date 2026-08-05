// Merkle Mountain Range: an append-only accumulator whose root can be
// recomputed from a small set of peaks, so appending never rewrites history.
//
// Structure: nodes are stored in append order. A new leaf is pushed as a
// height-0 node; while the top two peaks have equal height they are merged
// into a parent. The peaks that remain are "bagged" right-to-left into the
// root, and the leaf count is bound into the root transcript.
//
// Binding the leaf count is what makes rollback detectable: an MMR truncated
// from 9 leaves back to 7 produces a different root than the genuine 7-leaf
// MMR did, so a rolled-back log cannot present itself as an earlier honest
// state. That is tested, not assumed.

import { digestBytes } from '../digest/digest.mjs';
import { buildTranscript, DOMAIN_TAGS } from '../canonical/transcript.mjs';
import { encodeVarint } from '../bytes/varint.mjs';
import { DEFAULT_LIMITS, checkLimit } from '../limits.mjs';
import { MalformedInputError } from '../errors.mjs';

export const DEFAULT_MMR_DIGEST = 'SHA-256';

function mmrLeafHash(alg, leafIndex, bytes) {
  return digestBytes(alg, buildTranscript(DOMAIN_TAGS.MMR_LEAF, [encodeVarint(leafIndex), bytes]));
}
function mmrParentHash(alg, left, right) {
  return digestBytes(alg, buildTranscript(DOMAIN_TAGS.MMR_PARENT, [left, right]));
}

export class MMR {
  #nodes = [];        // { hash, height, parent }
  #peaks = [];        // node indices, ascending position / descending height
  #leafNodeIndex = []; // leafIndex -> node index
  #digestAlg;
  #limits;

  constructor({ digestAlg = DEFAULT_MMR_DIGEST, limits = DEFAULT_LIMITS } = {}) {
    this.#digestAlg = digestAlg;
    this.#limits = limits;
  }

  get leafCount() { return this.#leafNodeIndex.length; }
  get nodeCount() { return this.#nodes.length; }
  get digestAlg() { return this.#digestAlg; }
  get peakHashes() { return this.#peaks.map((i) => this.#nodes[i].hash); }

  append(leafBytes) {
    if (!(leafBytes instanceof Uint8Array)) throw new TypeError('MMR.append: leaf must be Uint8Array');
    checkLimit(this.leafCount + 1, this.#limits.maxCollectionSize, 'mmr.leafCount');
    const leafIndex = this.#leafNodeIndex.length;
    const idx = this.#push({ hash: mmrLeafHash(this.#digestAlg, leafIndex, leafBytes), height: 0 });
    this.#leafNodeIndex.push(idx);
    this.#peaks.push(idx);
    while (this.#peaks.length >= 2) {
      const r = this.#peaks[this.#peaks.length - 1];
      const l = this.#peaks[this.#peaks.length - 2];
      if (this.#nodes[l].height !== this.#nodes[r].height) break;
      this.#peaks.length -= 2;
      const p = this.#push({
        hash: mmrParentHash(this.#digestAlg, this.#nodes[l].hash, this.#nodes[r].hash),
        height: this.#nodes[l].height + 1,
        left: l, right: r,
      });
      this.#nodes[l].parent = p;
      this.#nodes[r].parent = p;
      this.#peaks.push(p);
    }
    checkLimit(this.#peaks.length, this.#limits.maxMmrPeaks, 'mmr.peaks');
    return leafIndex;
  }

  #push(node) { this.#nodes.push({ parent: null, left: null, right: null, ...node }); return this.#nodes.length - 1; }

  // Bag peaks right-to-left, then bind the leaf count.
  static bagPeaks(digestAlg, peakHashes, leafCount) {
    if (peakHashes.length === 0) {
      return digestBytes(digestAlg, buildTranscript(DOMAIN_TAGS.MMR_PARENT, [encodeVarint(0)]));
    }
    let acc = peakHashes[peakHashes.length - 1];
    for (let i = peakHashes.length - 2; i >= 0; i--) acc = mmrParentHash(digestAlg, peakHashes[i], acc);
    return digestBytes(digestAlg, buildTranscript(DOMAIN_TAGS.MMR_PARENT, [encodeVarint(leafCount), acc]));
  }

  root() { return MMR.bagPeaks(this.#digestAlg, this.peakHashes, this.leafCount); }

  proveLeaf(leafIndex) {
    if (!Number.isInteger(leafIndex) || leafIndex < 0 || leafIndex >= this.leafCount) {
      throw new MalformedInputError(`MMR.proveLeaf: leaf ${leafIndex} outside 0..${this.leafCount - 1}`, { predicate: 'mmr.indexInRange' });
    }
    const siblings = [];
    let cur = this.#leafNodeIndex[leafIndex];
    while (this.#nodes[cur].parent !== null) {
      const p = this.#nodes[cur].parent;
      const { left, right } = this.#nodes[p];
      if (left === cur) siblings.push({ hash: this.#nodes[right].hash, isLeft: false });
      else siblings.push({ hash: this.#nodes[left].hash, isLeft: true });
      cur = p;
    }
    const peakIndex = this.#peaks.indexOf(cur);
    if (peakIndex === -1) throw new Error('MMR.proveLeaf: internal invariant broken — path did not terminate at a peak');
    return {
      leafIndex, leafCount: this.leafCount, digestAlg: this.#digestAlg,
      siblings, peakIndex, peaks: this.peakHashes,
    };
  }

  // Checkpoint: the minimal state needed to verify later proofs and to detect
  // a fork or rollback against a future state.
  checkpoint() {
    return { leafCount: this.leafCount, digestAlg: this.#digestAlg, root: this.root(), peaks: this.peakHashes };
  }
}

export function verifyMmrProof(root, leafBytes, proof, { limits = DEFAULT_LIMITS } = {}) {
  if (!proof || !Array.isArray(proof.siblings) || !Array.isArray(proof.peaks)) return false;
  if (proof.siblings.length > limits.maxMerkleProofNodes) {
    throw new MalformedInputError('verifyMmrProof: proof exceeds node limit', { predicate: 'mmr.proofDepth' });
  }
  if (proof.peaks.length > limits.maxMmrPeaks) {
    throw new MalformedInputError('verifyMmrProof: peak list exceeds limit', { predicate: 'mmr.peaks' });
  }
  const alg = proof.digestAlg ?? DEFAULT_MMR_DIGEST;
  if (!Number.isInteger(proof.leafIndex) || proof.leafIndex < 0 || proof.leafIndex >= proof.leafCount) return false;
  if (!Number.isInteger(proof.peakIndex) || proof.peakIndex < 0 || proof.peakIndex >= proof.peaks.length) return false;

  let acc = mmrLeafHash(alg, proof.leafIndex, leafBytes);
  for (const s of proof.siblings) {
    if (!s || !(s.hash instanceof Uint8Array)) return false;
    acc = s.isLeft ? mmrParentHash(alg, s.hash, acc) : mmrParentHash(alg, acc, s.hash);
  }
  const claimedPeak = proof.peaks[proof.peakIndex];
  if (!(claimedPeak instanceof Uint8Array)) return false;
  if (acc.length !== claimedPeak.length || !acc.every((b, i) => b === claimedPeak[i])) return false;

  const recomputed = MMR.bagPeaks(alg, proof.peaks, proof.leafCount);
  return recomputed.length === root.length && recomputed.every((b, i) => b === root[i]);
}

// Two checkpoints of the same log at the same size must agree. If they do not,
// the signed heads are evidence of a fork — the disagreement is detectable
// without trusting either publisher.
export function detectFork(checkpointA, checkpointB) {
  if (checkpointA.leafCount !== checkpointB.leafCount) return { fork: false, reason: 'DIFFERENT_SIZES' };
  const same = Buffer.compare(Buffer.from(checkpointA.root), Buffer.from(checkpointB.root)) === 0;
  return same ? { fork: false, reason: 'AGREE' } : { fork: true, reason: 'SAME_SIZE_DIFFERENT_ROOT' };
}

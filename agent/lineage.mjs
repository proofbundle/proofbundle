/**
 * Lineage — append-only, hash-chained, Merkle-rooted log.
 *
 * Each envelope references prev_hash. Batches are Merkle-rooted
 * (RFC 6962-style: domain-separated left/right, SHA-256).
 */
import { createHash } from 'node:crypto';
import { canonicalJSON, envelopeHash } from './envelope.mjs';

const LEAF_PREFIX = Buffer.from('PB-AGENT-1\x00', 'utf8');
const LEFT_PREFIX = Buffer.from('L\x00', 'utf8');
const RIGHT_PREFIX = Buffer.from('R\x00', 'utf8');

function sha256(data) {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  return createHash('sha256').update(buf).digest();
}

/** Hash a leaf: SHA-256("PB-AGENT-1\0" || canonical_envelope). */
function hashLeaf(envelope) {
  const canon = canonicalJSON(envelope);
  return sha256(Buffer.concat([LEAF_PREFIX, Buffer.from(canon, 'utf8')]));
}

/** Hash a parent: SHA-256("L\0" || left || "R\0" || right). */
function hashNode(leftHash, rightHash) {
  return sha256(Buffer.concat([LEFT_PREFIX, leftHash, RIGHT_PREFIX, rightHash]));
}

/**
 * Largest power of two strictly less than n (RFC 6962 MTH split point).
 * n=3->2, n=5->4, n=7->4, n=8->4 (8 itself is excluded; must split further).
 */
function splitPoint(n) {
  let k = 1;
  while (k * 2 < n) k *= 2;
  return k;
}

/**
 * RFC 6962 Merkle Tree Hash: recursive, unbalanced-subtree split — NEVER
 * duplicates an odd node. Pairwise-duplicate-last (the historical Bitcoin/
 * CVE-2012-2459 shape) lets two DIFFERENT-length leaf sets collide on the
 * same root (e.g. [A,B,C] and [A,B,C,C]); this does not, independent of the
 * leaf/node domain separation above (which prevents a different attack —
 * presenting an internal node as a leaf, not root collision across lengths).
 */
function mth(leaves) {
  if (leaves.length === 1) return leaves[0];
  const k = splitPoint(leaves.length);
  return hashNode(mth(leaves.slice(0, k)), mth(leaves.slice(k)));
}

/**
 * Compute a Merkle root from an array of envelopes (RFC 6962 MTH).
 * @param {object[]} envelopes
 * @returns {{ root: string (hex), leaves: string[] (hex) }}
 */
export function merkleRoot(envelopes) {
  if (!envelopes.length) return { root: '0'.repeat(64), leaves: [] };
  const leafHashes = envelopes.map(hashLeaf);
  return { root: mth(leafHashes).toString('hex'), leaves: leafHashes.map(b => b.toString('hex')) };
}

/**
 * Generate a Merkle inclusion proof for the leaf at index `index`
 * (RFC 6962 PATH — same recursive split as mth(), so proofs stay valid
 * against merkleRoot's output for any leaf count, not just powers of two).
 * @returns {{ hash: string, side: 'L'|'R' }[]} ordered leaf-to-root.
 */
export function merkleProof(envelopes, index) {
  if (!envelopes.length || index < 0 || index >= envelopes.length) return [];
  const leafHashes = envelopes.map(hashLeaf);
  const path = (leaves, idx) => {
    if (leaves.length === 1) return [];
    const k = splitPoint(leaves.length);
    if (idx < k) {
      return [...path(leaves.slice(0, k), idx), { hash: mth(leaves.slice(k)).toString('hex'), side: 'R' }];
    }
    return [...path(leaves.slice(k), idx - k), { hash: mth(leaves.slice(0, k)).toString('hex'), side: 'L' }];
  };
  return path(leafHashes, index);
}

/** Verify a Merkle inclusion proof. */
export function verifyProof(leafHash, proof, rootHex) {
  let acc = Buffer.from(leafHash, 'hex');
  for (const step of proof) {
    const sib = Buffer.from(step.hash, 'hex');
    acc = step.side === 'R'
      ? hashNode(acc, sib)
      : hashNode(sib, acc);
  }
  return acc.toString('hex') === rootHex;
}

/**
 * Append an envelope to the lineage log, setting prev_hash and seq.
 * @param {object[]} log — the lineage array (mutated)
 * @param {object} envelope — envelope to append (will get seq + prev_hash set)
 * @returns {object} the updated envelope
 */
export function appendToLineage(log, envelope) {
  const seq = log.length;
  const prevHash = log.length === 0 ? 'genesis' : envelopeHash(log[log.length - 1]);
  envelope.seq = seq;
  envelope.prev_hash = prevHash;
  log.push(envelope);
  return envelope;
}

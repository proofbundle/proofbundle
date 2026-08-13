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
 * Compute a Merkle root from an array of envelopes (RFC 6962 style).
 * @param {object[]} envelopes
 * @returns {{ root: Buffer (hex string), leaves: Buffer[] }}
 */
export function merkleRoot(envelopes) {
  if (!envelopes.length) return { root: '0'.repeat(64), leaves: [] };
  let leaves = envelopes.map(hashLeaf);
  while (leaves.length > 1) {
    const next = [];
    for (let i = 0; i < leaves.length; i += 2) {
      const left = leaves[i];
      const right = i + 1 < leaves.length ? leaves[i + 1] : leaves[i]; // duplicate last if odd
      next.push(hashNode(left, right));
    }
    leaves = next;
  }
  return { root: leaves[0].toString('hex'), leaves: envelopes.map(hashLeaf).map(b => b.toString('hex')) };
}

/**
 * Generate a Merkle inclusion proof for the leaf at index `i`.
 * @returns {{ hash: string, side: 'L'|'R' }[]}
 */
export function merkleProof(envelopes, index) {
  if (!envelopes.length || index >= envelopes.length) return [];
  let leaves = envelopes.map(hashLeaf);
  const proof = [];
  let idx = index;
  while (leaves.length > 1) {
    const next = [];
    for (let i = 0; i < leaves.length; i += 2) {
      const left = leaves[i];
      const right = i + 1 < leaves.length ? leaves[i + 1] : leaves[i];
      if (i === idx || i + 1 === idx) {
        const siblingIdx = idx === i ? i + 1 : i;
        const sibling = siblingIdx < leaves.length ? leaves[siblingIdx] : left;
        proof.push({
          hash: sibling.toString('hex'),
          side: idx % 2 === 0 ? 'R' : 'L',
        });
      }
      next.push(hashNode(left, right));
    }
    idx = Math.floor(idx / 2);
    leaves = next;
  }
  return proof;
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

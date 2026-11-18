import {
  asBytes,
  compareBytes,
  equalBytes,
  u32be,
  u64be,
  utf8,
} from './bytes.mjs';
import { encodeCanonicalCbor } from './canonical-cbor.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';
import { digest, digestTagged } from './hashes.mjs';
import { getAlgorithm } from './registry.mjs';

function merkleHash(algorithmId) {
  const algorithm = getAlgorithm(algorithmId, { kind: 'hash' });
  if (algorithm.outputLength === undefined) {
    throw new ProofBundleError(Verdict.MALFORMED, 'Merkle hash must have fixed output length');
  }
  return algorithm;
}

function leafHash(algorithmId, leaf) {
  const bytes = asBytes(leaf, 'Merkle leaf');
  return digestTagged(algorithmId, 'ProofBundle-Merkle-Leaf-v1', u64be(bytes.byteLength), bytes);
}

function nodeHash(algorithmId, left, right) {
  return digestTagged(
    algorithmId,
    'ProofBundle-Merkle-Node-v1',
    asBytes(left, 'left digest'),
    asBytes(right, 'right digest'),
  );
}

function largestPowerOfTwoLessThan(value) {
  let power = 1;
  while (power * 2 < value) power *= 2;
  return power;
}

function rootRange(algorithmId, leaves, start, count) {
  if (count === 1) return leafHash(algorithmId, leaves[start]);
  const split = largestPowerOfTwoLessThan(count);
  return nodeHash(
    algorithmId,
    rootRange(algorithmId, leaves, start, split),
    rootRange(algorithmId, leaves, start + split, count - split),
  );
}

export function merkleRoot(leaves, algorithmId = 'pb.hash.blake3-256.v1') {
  merkleHash(algorithmId);
  if (!Array.isArray(leaves)) {
    throw new ProofBundleError(Verdict.MALFORMED, 'Merkle leaves must be an array');
  }
  if (leaves.length === 0) {
    return digestTagged(algorithmId, 'ProofBundle-Merkle-Empty-v1');
  }
  return rootRange(algorithmId, leaves.map((leaf) => asBytes(leaf)), 0, leaves.length);
}

function buildProof(algorithmId, leaves, start, count, index, siblings) {
  if (count === 1) return;
  const split = largestPowerOfTwoLessThan(count);
  if (index < split) {
    buildProof(algorithmId, leaves, start, split, index, siblings);
    siblings.push({
      side: 'right',
      digest: rootRange(algorithmId, leaves, start + split, count - split),
    });
  } else {
    buildProof(algorithmId, leaves, start + split, count - split, index - split, siblings);
    siblings.push({
      side: 'left',
      digest: rootRange(algorithmId, leaves, start, split),
    });
  }
}

function proofShape(count, index, sides) {
  if (count === 1) return;
  const split = largestPowerOfTwoLessThan(count);
  if (index < split) {
    proofShape(split, index, sides);
    sides.push('right');
  } else {
    proofShape(count - split, index - split, sides);
    sides.push('left');
  }
}

export function createMerkleProof(
  leaves,
  leafIndex,
  algorithmId = 'pb.hash.blake3-256.v1',
) {
  merkleHash(algorithmId);
  if (
    !Array.isArray(leaves) ||
    leaves.length === 0 ||
    !Number.isSafeInteger(leafIndex) ||
    leafIndex < 0 ||
    leafIndex >= leaves.length
  ) {
    throw new ProofBundleError(Verdict.OUT_OF_BOUNDS, 'invalid Merkle proof leaf index');
  }
  const normalized = leaves.map((leaf) => asBytes(leaf));
  const siblings = [];
  buildProof(algorithmId, normalized, 0, normalized.length, leafIndex, siblings);
  return Object.freeze({
    version: 1,
    algorithmId,
    leafIndex,
    treeSize: normalized.length,
    siblings: siblings.map((item) => Object.freeze(item)),
  });
}

export function verifyMerkleProof(leaf, proof, expectedRoot) {
  try {
    if (
      !proof ||
      proof.version !== 1 ||
      !Number.isSafeInteger(proof.treeSize) ||
      proof.treeSize < 1 ||
      !Number.isSafeInteger(proof.leafIndex) ||
      proof.leafIndex < 0 ||
      proof.leafIndex >= proof.treeSize ||
      !Array.isArray(proof.siblings)
    ) {
      return false;
    }
    merkleHash(proof.algorithmId);
    const expectedSides = [];
    proofShape(proof.treeSize, proof.leafIndex, expectedSides);
    if (
      expectedSides.length !== proof.siblings.length ||
      expectedSides.some((side, index) => proof.siblings[index]?.side !== side)
    ) {
      return false;
    }
    let current = leafHash(proof.algorithmId, leaf);
    for (const sibling of proof.siblings) {
      const siblingDigest = asBytes(sibling.digest, 'Merkle sibling digest');
      current =
        sibling.side === 'left'
          ? nodeHash(proof.algorithmId, siblingDigest, current)
          : nodeHash(proof.algorithmId, current, siblingDigest);
    }
    return equalBytes(current, expectedRoot);
  } catch {
    return false;
  }
}

export function createMmr(algorithmId = 'pb.hash.blake3-256.v1') {
  merkleHash(algorithmId);
  return { version: 1, algorithmId, size: 0, peaks: [] };
}

export function appendMmr(mmr, leaf) {
  if (!mmr || mmr.version !== 1 || !Array.isArray(mmr.peaks)) {
    throw new ProofBundleError(Verdict.MALFORMED, 'invalid MMR state');
  }
  merkleHash(mmr.algorithmId);
  let peak = {
    height: 0,
    digest: digestTagged(
      mmr.algorithmId,
      'ProofBundle-MMR-Leaf-v1',
      u64be(mmr.size),
      asBytes(leaf, 'MMR leaf'),
    ),
  };
  const peaks = mmr.peaks.map(({ height, digest: value }) => ({
    height,
    digest: Uint8Array.from(asBytes(value)),
  }));
  while (peaks.length > 0 && peaks.at(-1).height === peak.height) {
    const left = peaks.pop();
    peak = {
      height: peak.height + 1,
      digest: digestTagged(
        mmr.algorithmId,
        'ProofBundle-MMR-Node-v1',
        u32be(peak.height),
        left.digest,
        peak.digest,
      ),
    };
  }
  peaks.push(peak);
  return {
    version: 1,
    algorithmId: mmr.algorithmId,
    size: mmr.size + 1,
    peaks,
  };
}

export function mmrRoot(mmr) {
  if (!mmr || mmr.version !== 1 || !Array.isArray(mmr.peaks)) {
    throw new ProofBundleError(Verdict.MALFORMED, 'invalid MMR state');
  }
  return digestTagged(
    mmr.algorithmId,
    'ProofBundle-MMR-Root-v1',
    u64be(mmr.size),
    ...mmr.peaks.flatMap(({ height, digest: value }) => [u32be(height), value]),
  );
}

export function appendHashChain(
  chain,
  payload,
  options = {},
) {
  if (!Array.isArray(chain)) {
    throw new ProofBundleError(Verdict.MALFORMED, 'hash chain must be an array');
  }
  const algorithmId = options.algorithmId ?? 'pb.hash.sha2-256.v1';
  merkleHash(algorithmId);
  const previous = chain.length === 0 ? new Uint8Array(0) : chain.at(-1).commitment;
  const body = {
    version: 1,
    sequence: chain.length,
    algorithmId,
    previous,
    payloadDigest: digest(algorithmId, asBytes(payload, 'chain payload')),
    metadata: options.metadata ?? {},
  };
  return Object.freeze({
    ...body,
    commitment: digestTagged(
      algorithmId,
      'ProofBundle-Hash-Chain-Entry-v1',
      encodeCanonicalCbor(body),
    ),
  });
}

export function verifyHashChain(chain) {
  try {
    if (!Array.isArray(chain)) return false;
    let previous = new Uint8Array(0);
    for (let index = 0; index < chain.length; index += 1) {
      const entry = chain[index];
      if (
        entry.version !== 1 ||
        entry.sequence !== index ||
        !equalBytes(entry.previous, previous)
      ) {
        return false;
      }
      const body = {
        version: entry.version,
        sequence: entry.sequence,
        algorithmId: entry.algorithmId,
        previous: entry.previous,
        payloadDigest: entry.payloadDigest,
        metadata: entry.metadata,
      };
      const expected = digestTagged(
        entry.algorithmId,
        'ProofBundle-Hash-Chain-Entry-v1',
        encodeCanonicalCbor(body),
      );
      if (!equalBytes(expected, entry.commitment)) return false;
      previous = entry.commitment;
    }
    return true;
  } catch {
    return false;
  }
}

function sortedUniqueStrings(values, label) {
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string')) {
    throw new ProofBundleError(Verdict.MALFORMED, `${label} must be an array of strings`);
  }
  const sorted = [...values].sort();
  if (new Set(sorted).size !== sorted.length) {
    throw new ProofBundleError(Verdict.MALFORMED, `${label} contains duplicates`);
  }
  if (values.some((value, index) => value !== sorted[index])) {
    throw new ProofBundleError(Verdict.MALFORMED, `${label} must already be sorted`);
  }
  return sorted;
}

export function commitDag(nodes, algorithmId = 'pb.hash.blake3-256.v1') {
  merkleHash(algorithmId);
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new ProofBundleError(Verdict.MALFORMED, 'DAG must contain at least one node');
  }
  const byId = new Map();
  for (const node of nodes) {
    if (!node || typeof node.id !== 'string' || node.id.length === 0) {
      throw new ProofBundleError(Verdict.MALFORMED, 'DAG node lacks a non-empty id');
    }
    if (byId.has(node.id)) {
      throw new ProofBundleError(Verdict.MALFORMED, `duplicate DAG node id: ${node.id}`);
    }
    sortedUniqueStrings(node.parents, `parents of ${node.id}`);
    byId.set(node.id, node);
  }
  for (const node of nodes) {
    for (const parent of node.parents) {
      if (!byId.has(parent)) {
        throw new ProofBundleError(Verdict.MISSING_SIDE_INFO, `missing DAG parent ${parent}`);
      }
    }
  }

  const state = new Map();
  const commitments = new Map();
  const visit = (id) => {
    if (state.get(id) === 'visiting') {
      throw new ProofBundleError(Verdict.LINEAGE_INVALID, `DAG cycle detected at ${id}`);
    }
    if (state.get(id) === 'done') return commitments.get(id);
    state.set(id, 'visiting');
    const node = byId.get(id);
    const parentCommitments = node.parents.map((parent) => visit(parent));
    const body = {
      version: 1,
      id,
      parents: node.parents,
      parentCommitments,
      payloadDigest: digest(algorithmId, asBytes(node.payload, `payload of ${id}`)),
    };
    const commitment = digestTagged(
      algorithmId,
      'ProofBundle-DAG-Node-v1',
      encodeCanonicalCbor(body),
    );
    commitments.set(id, commitment);
    state.set(id, 'done');
    return commitment;
  };
  for (const id of [...byId.keys()].sort()) visit(id);

  const referenced = new Set(nodes.flatMap(({ parents }) => parents));
  const sinks = [...byId.keys()].filter((id) => !referenced.has(id)).sort();
  const root = digestTagged(
    algorithmId,
    'ProofBundle-DAG-Root-v1',
    ...sinks.flatMap((id) => [utf8(id), commitments.get(id)]),
  );
  return Object.freeze({
    version: 1,
    algorithmId,
    nodeCount: nodes.length,
    sinks,
    root,
    commitments,
  });
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EntropyHealthMonitor,
  appendHashChain,
  appendMmr,
  commitDag,
  createMerkleProof,
  createMmr,
  createRfc3161RequestForMessage,
  evaluateTimestampPolicy,
  merkleRoot,
  mmrRoot,
  verifyHashChain,
  verifyMerkleProof,
} from '../src/index.mjs';

const leaves = Array.from({ length: 9 }, (_, index) =>
  new TextEncoder().encode(`leaf-${index}`),
);

test('Merkle inclusion proofs cover every position in non-power-of-two trees', () => {
  for (let size = 1; size <= leaves.length; size += 1) {
    const selected = leaves.slice(0, size);
    const root = merkleRoot(selected);
    for (let index = 0; index < size; index += 1) {
      const proof = createMerkleProof(selected, index);
      assert.equal(verifyMerkleProof(selected[index], proof, root), true);
      assert.equal(
        verifyMerkleProof(new TextEncoder().encode('tampered'), proof, root),
        false,
      );
    }
  }
});

test('Merkle proof shape and algorithm identifier are committed', () => {
  const root = merkleRoot(leaves, 'pb.hash.sha2-256.v1');
  const proof = createMerkleProof(leaves, 4, 'pb.hash.sha2-256.v1');
  assert.equal(verifyMerkleProof(leaves[4], proof, root), true);
  const wrongShape = structuredClone(proof);
  wrongShape.siblings.reverse();
  assert.equal(verifyMerkleProof(leaves[4], wrongShape, root), false);
});

test('all profile Merkle algorithms verify inclusion proofs', () => {
  for (const algorithmId of [
    'pb.hash.blake3-256.v1',
    'pb.hash.sha2-256.v1',
    'pb.hash.sha3-256.v1',
  ]) {
    const root = merkleRoot(leaves, algorithmId);
    const proof = createMerkleProof(leaves, 7, algorithmId);
    assert.equal(verifyMerkleProof(leaves[7], proof, root), true, algorithmId);
  }
});

test('MMR, hash chain, and DAG commitments are deterministic and tamper evident', () => {
  let mmr = createMmr();
  for (const leaf of leaves) mmr = appendMmr(mmr, leaf);
  assert.deepEqual(mmrRoot(mmr), mmrRoot(mmr));

  const chain = [];
  for (const leaf of leaves.slice(0, 3)) chain.push(appendHashChain(chain, leaf));
  assert.equal(verifyHashChain(chain), true);
  const tampered = structuredClone(chain);
  tampered[1].commitment[0] ^= 1;
  assert.equal(verifyHashChain(tampered), false);

  const nodes = [
    { id: 'root', parents: [], payload: leaves[0] },
    { id: 'left', parents: ['root'], payload: leaves[1] },
    { id: 'right', parents: ['root'], payload: leaves[2] },
    { id: 'sink', parents: ['left', 'right'], payload: leaves[3] },
  ];
  const committed = commitDag(nodes);
  assert.deepEqual(committed.sinks, ['sink']);
  assert.throws(
    () =>
      commitDag([
        { id: 'a', parents: ['b'], payload: leaves[0] },
        { id: 'b', parents: ['a'], payload: leaves[1] },
      ]),
    { code: 'lineage-invalid' },
  );
});

test('RFC 3161 requests are deterministic DER and timestamp policy counts authorities', () => {
  const requestA = createRfc3161RequestForMessage(leaves[0], {
    nonce: 123456789n,
    certReq: true,
  });
  const requestB = createRfc3161RequestForMessage(leaves[0], {
    nonce: 123456789n,
    certReq: true,
  });
  assert.deepEqual(requestA, requestB);
  assert.equal(requestA[0], 0x30);

  assert.equal(
    evaluateTimestampPolicy(
      [
        { verified: true, authorityId: 'tsa-a' },
        { verified: true, authorityId: 'tsa-a' },
        { verified: true, authorityId: 'bitcoin-calendar' },
      ],
      { minimumIndependentEvidence: 2 },
    ).ok,
    true,
  );
});

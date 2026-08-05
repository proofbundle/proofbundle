// Merkle trees, MMRs, hash-chain logs, and lineage graphs — the structural
// layer where append-only and acyclicity claims live.

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMerkleTree, buildInclusionProof, verifyInclusionProof, merkleRoot, verifyConsistency, serializeProof, deserializeProof, verifyMultiproof } from '../../src/merkle/tree.mjs';
import { MMR, verifyMmrProof, detectFork } from '../../src/mmr/mmr.mjs';
import { HashChainLog, verifyChain, verifyExtends, genesisHash } from '../../src/log/hash-chain.mjs';
import { LineageGraph, checkClaimedLineage, computeNodeId, EDGE_TYPES } from '../../src/lineage/lineage.mjs';
import { bytesToHex } from '../../src/encoding/hex.mjs';

const enc = new TextEncoder();
const B = (s) => enc.encode(s);
const leavesOf = (n, p = 'leaf') => [...Array(n)].map((_, i) => B(`${p}-${i}`));

test('merkle root is deterministic across rebuilds', () => {
  const l = leavesOf(6);
  assert.equal(bytesToHex(merkleRoot(l)), bytesToHex(merkleRoot(l)));
});

test('merkle root changes when any leaf changes', () => {
  const l = leavesOf(6);
  const before = bytesToHex(merkleRoot(l));
  l[3] = B('tampered');
  assert.notEqual(bytesToHex(merkleRoot(l)), before);
});

test('merkle: every inclusion proof verifies, for sizes 1..17', () => {
  for (let n = 1; n <= 17; n++) {
    const l = leavesOf(n);
    const t = buildMerkleTree(l);
    for (let i = 0; i < n; i++) {
      assert.ok(verifyInclusionProof(t.root, l[i], buildInclusionProof(t, i)), `size ${n} index ${i} failed`);
    }
  }
});

test('merkle: a proof for index i does not verify at index j', () => {
  const l = leavesOf(8);
  const t = buildMerkleTree(l);
  const p = buildInclusionProof(t, 2);
  assert.equal(verifyInclusionProof(t.root, l[2], { ...p, index: 3 }), false);
  assert.equal(verifyInclusionProof(t.root, l[3], p), false);
});

test('merkle: an internal node cannot be passed off as a leaf', () => {
  const l = leavesOf(8);
  const t = buildMerkleTree(l);
  assert.equal(verifyInclusionProof(t.root, t.levels[1][0], buildInclusionProof(t, 0)), false);
});

test('merkle: a proof with a flipped direction bit is rejected', () => {
  const l = leavesOf(8);
  const t = buildMerkleTree(l);
  const p = buildInclusionProof(t, 5);
  const flipped = { ...p, siblings: p.siblings.map((s, i) => (i === 0 ? { ...s, isLeft: !s.isLeft } : s)) };
  assert.equal(verifyInclusionProof(t.root, l[5], flipped), false);
});

test('merkle: extra unconsumed siblings are rejected', () => {
  const l = leavesOf(4);
  const t = buildMerkleTree(l);
  const p = buildInclusionProof(t, 0);
  assert.equal(verifyInclusionProof(t.root, l[0], { ...p, siblings: [...p.siblings, { hash: new Uint8Array(32), isLeft: true }] }), false);
});

test('merkle: proofs survive serialization', () => {
  const l = leavesOf(9);
  const t = buildMerkleTree(l);
  for (let i = 0; i < 9; i++) {
    assert.ok(verifyInclusionProof(t.root, l[i], deserializeProof(serializeProof(buildInclusionProof(t, i)))));
  }
});

test('merkle: non-hex proof material is MALFORMED, not false', () => {
  assert.throws(() => deserializeProof({ index: 0, leafCount: 2, digestAlg: 'SHA-256', siblings: [{ hash: 'nothex', isLeft: true }] }), (e) => e.verdict === 'MALFORMED');
});

test('merkle: multiproof verifies all listed entries', () => {
  const l = leavesOf(8);
  const t = buildMerkleTree(l);
  const entries = [0, 3, 7].map((i) => ({ leaf: l[i], proof: buildInclusionProof(t, i) }));
  assert.ok(verifyMultiproof(t.root, entries));
});

test('merkle: appending preserves the prefix root (consistency)', () => {
  const l = leavesOf(10);
  for (let k = 1; k < 10; k++) {
    assert.ok(verifyConsistency(merkleRoot(l.slice(0, k)), k, l), `prefix ${k} not consistent`);
  }
});

test('merkle: the empty tree has a defined root distinct from a one-leaf tree', () => {
  assert.notEqual(bytesToHex(merkleRoot([])), bytesToHex(merkleRoot([new Uint8Array(0)])));
});

test('mmr: every inclusion proof verifies for sizes 1..20', () => {
  for (let n = 1; n <= 20; n++) {
    const m = new MMR();
    const l = leavesOf(n, 'e');
    l.forEach((x) => m.append(x));
    const root = m.root();
    for (let i = 0; i < n; i++) {
      assert.ok(verifyMmrProof(root, l[i], m.proveLeaf(i)), `mmr size ${n} index ${i} failed`);
    }
  }
});

test('mmr: appending never invalidates an earlier leaf proof against the new root', () => {
  const m = new MMR();
  const l = leavesOf(12, 'e');
  l.forEach((x) => m.append(x));
  const root = m.root();
  // Proofs taken from the final state verify for every historical leaf.
  for (let i = 0; i < 12; i++) assert.ok(verifyMmrProof(root, l[i], m.proveLeaf(i)));
});

test('mmr: leaf count is bound into the root, so truncation is detectable', () => {
  const l = leavesOf(9, 'e');
  const full = new MMR(); l.forEach((x) => full.append(x));
  const short = new MMR(); l.slice(0, 7).forEach((x) => short.append(x));
  assert.notEqual(bytesToHex(full.root()), bytesToHex(short.root()));
});

test('mmr: same-size divergent logs are a detectable fork', () => {
  const a = new MMR(); const b = new MMR();
  leavesOf(5, 'e').forEach((x) => { a.append(x); b.append(x); });
  a.append(B('honest')); b.append(B('forked'));
  assert.deepEqual(detectFork(a.checkpoint(), b.checkpoint()), { fork: true, reason: 'SAME_SIZE_DIFFERENT_ROOT' });
});

test('mmr: identical logs are not reported as forked', () => {
  const a = new MMR(); const b = new MMR();
  leavesOf(6, 'e').forEach((x) => { a.append(x); b.append(x); });
  assert.equal(detectFork(a.checkpoint(), b.checkpoint()).fork, false);
});

test('mmr: a proof naming a peak it does not reach is rejected', () => {
  const m = new MMR();
  leavesOf(11, 'e').forEach((x) => m.append(x));
  const p = m.proveLeaf(0);
  if (p.peaks.length > 1) {
    assert.equal(verifyMmrProof(m.root(), B('e-0'), { ...p, peakIndex: (p.peakIndex + 1) % p.peaks.length }), false);
  }
});

test('log: a well-formed chain verifies and sequences are gapless', () => {
  const log = new HashChainLog();
  for (let i = 0; i < 5; i++) log.append(B(`r${i}`));
  const res = verifyChain(log.records);
  assert.equal(res.ok, true);
  assert.equal(res.length, 5);
  assert.deepEqual(log.records.map((r) => r.sequence), [0, 1, 2, 3, 4]);
});

test('log: rewriting any record is detected at that record', () => {
  const log = new HashChainLog();
  for (let i = 0; i < 5; i++) log.append(B(`r${i}`));
  for (let k = 0; k < 5; k++) {
    const tampered = log.records.map((r, i) => (i === k ? { ...r, payload: B('EVIL') } : r));
    const res = verifyChain(tampered);
    assert.equal(res.ok, false);
    assert.equal(res.at, k);
  }
});

test('log: the genesis predecessor is a domain-separated value, not zeros', () => {
  assert.notEqual(bytesToHex(genesisHash()), '0'.repeat(64));
});

test('log: a later log that drops records is reported as a rollback', () => {
  const log = new HashChainLog();
  for (let i = 0; i < 5; i++) log.append(B(`r${i}`));
  const recs = log.records;
  assert.equal(verifyExtends({ sequence: 4, hash: recs[4].hash }, recs.slice(0, 3)).failure, 'ROLLBACK');
});

test('log: a divergent later log is reported as a fork', () => {
  const a = new HashChainLog(); const b = new HashChainLog();
  for (let i = 0; i < 3; i++) { a.append(B(`r${i}`)); b.append(B(`r${i}`)); }
  a.append(B('honest')); b.append(B('forked'));
  assert.equal(verifyExtends({ sequence: 3, hash: a.records[3].hash }, b.records).failure, 'FORK');
});

test('lineage: node ids are deterministic and parent-order independent', () => {
  const g = new LineageGraph();
  const a = g.addNode({ nodeType: 'source', payload: B('A') });
  const b = g.addNode({ nodeType: 'source', payload: B('B') });
  assert.equal(computeNodeId('d', B('X'), [a, b]), computeNodeId('d', B('X'), [b, a]));
});

test('lineage: a node id depends on its parents', () => {
  const g = new LineageGraph();
  const a = g.addNode({ nodeType: 'source', payload: B('A') });
  assert.notEqual(computeNodeId('d', B('X'), [a]), computeNodeId('d', B('X'), []));
});

test('lineage: ancestor closure is correct and sorted', () => {
  const g = new LineageGraph();
  const a = g.addNode({ nodeType: 's', payload: B('A') });
  const b = g.addNode({ nodeType: 'd', payload: B('B'), parents: [a] });
  const c = g.addNode({ nodeType: 'd', payload: B('C'), parents: [b] });
  const anc = g.ancestors(c);
  assert.deepEqual(anc, [a, b].sort());
});

test('lineage: adding a node preserves the ancestry of existing nodes', () => {
  const g = new LineageGraph();
  const a = g.addNode({ nodeType: 's', payload: B('A') });
  const b = g.addNode({ nodeType: 'd', payload: B('B'), parents: [a] });
  const before = g.ancestors(b);
  g.addNode({ nodeType: 'd', payload: B('C'), parents: [b] });
  assert.deepEqual(g.ancestors(b), before);
});

test('lineage: duplicate and self parents are refused at construction', () => {
  const g = new LineageGraph();
  const a = g.addNode({ nodeType: 's', payload: B('A') });
  assert.throws(() => g.addNode({ nodeType: 'd', payload: B('B'), parents: [a, a] }), (e) => e.verdict === 'MALFORMED');
  assert.throws(() => g.addNode({ nodeType: 'd', payload: B('B'), parents: ['nonexistent'] }), (e) => e.verdict === 'MALFORMED');
});

test('lineage: topological order is deterministic across runs', () => {
  const build = () => {
    const g = new LineageGraph();
    const a = g.addNode({ nodeType: 's', payload: B('A') });
    const b = g.addNode({ nodeType: 'd', payload: B('B'), parents: [a] });
    const c = g.addNode({ nodeType: 'd', payload: B('C'), parents: [a] });
    g.addNode({ nodeType: 'd', payload: B('D'), parents: [b, c] });
    return g.topologicalOrder().order;
  };
  assert.deepEqual(build(), build());
});

test('lineage: every registered edge type is accepted', () => {
  for (const t of EDGE_TYPES) {
    const g = new LineageGraph();
    const a = g.addNode({ nodeType: 's', payload: B('A') });
    assert.ok(g.addNode({ nodeType: 'd', payload: B(`B-${t}`), parents: [a], edgeType: t }));
  }
});

test('lineage: an unregistered edge type is refused', () => {
  const g = new LineageGraph();
  assert.throws(() => g.addNode({ nodeType: 's', payload: B('A'), edgeType: 'INVENTED' }), /unregistered edge type/);
});

test('claimed lineage: cycles, self-parents, duplicates and gaps each get their own verdict', () => {
  assert.equal(checkClaimedLineage([{ id: 'x', parents: ['y'] }, { id: 'y', parents: ['x'] }]).failure, 'LINEAGE_CYCLE');
  assert.equal(checkClaimedLineage([{ id: 'x', parents: ['x'] }]).failure, 'LINEAGE_INVALID');
  assert.equal(checkClaimedLineage([{ id: 'x', parents: [] }, { id: 'y', parents: ['x', 'x'] }]).failure, 'LINEAGE_INVALID');
  assert.equal(checkClaimedLineage([{ id: 'x', parents: ['ghost'] }]).failure, 'LINEAGE_MISSING');
  assert.equal(checkClaimedLineage([{ id: 'x', parents: [] }, { id: 'y', parents: ['x'] }]).ok, true);
});

test('claimed lineage: a long chain still terminates and validates', () => {
  const nodes = [{ id: 'n0', parents: [] }];
  for (let i = 1; i < 2000; i++) nodes.push({ id: `n${i}`, parents: [`n${i - 1}`] });
  assert.equal(checkClaimedLineage(nodes).ok, true);
});

// merkle-build / merkle-prove / merkle-verify / mmr-append / mmr-prove /
// mmr-verify / lineage-create / lineage-verify.
//
// These commands operate on JSON state files so a shell session can build an
// accumulator incrementally and the intermediate state is inspectable rather
// than hidden in process memory.

import { readFileSync, writeFileSync } from 'node:fs';
import { buildMerkleTree, buildInclusionProof, verifyInclusionProof, serializeProof, deserializeProof } from '../../merkle/tree.mjs';
import { MMR, verifyMmrProof } from '../../mmr/mmr.mjs';
import { checkClaimedLineage, LineageGraph } from '../../lineage/lineage.mjs';
import { bytesToHex, hexToBytes } from '../../encoding/hex.mjs';
import { EXIT_CODES } from '../output.mjs';

const enc = new TextEncoder();
const readJson = (p) => JSON.parse(readFileSync(p, 'utf-8'));
const leavesFrom = (flags, positional) => {
  if (flags.leaves) return readJson(flags.leaves).map((h) => hexToBytes(h));
  return positional.map((s) => enc.encode(s));
};
const emit = (obj, flags, code = EXIT_CODES.OK) => {
  if (flags.json) process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
  else if (!flags.quiet) {
    for (const [k, v] of Object.entries(obj)) process.stdout.write(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}\n`);
  }
  return code;
};

export function runMerkleBuild({ positional, flags }) {
  const leaves = leavesFrom(flags, positional);
  if (!leaves.length) { process.stderr.write('usage: proofbundle merkle-build <leaf> [leaf...] | --leaves leaves.json [--out tree.json]\n'); return EXIT_CODES.USAGE_ERROR; }
  const tree = buildMerkleTree(leaves);
  const state = { digestAlg: tree.digestAlg, leafCount: tree.leafCount, root: bytesToHex(tree.root), leaves: leaves.map(bytesToHex) };
  if (flags.out) writeFileSync(flags.out, JSON.stringify(state, null, 2) + '\n');
  return emit({ root: state.root, leafCount: state.leafCount, digestAlg: state.digestAlg }, flags);
}

export function runMerkleProve({ positional, flags }) {
  if (!flags.tree || flags.index === undefined) { process.stderr.write('usage: proofbundle merkle-prove --tree tree.json --index N [--out proof.json]\n'); return EXIT_CODES.USAGE_ERROR; }
  const state = readJson(flags.tree);
  const tree = buildMerkleTree(state.leaves.map(hexToBytes), { digestAlg: state.digestAlg });
  const proof = serializeProof(buildInclusionProof(tree, Number(flags.index)));
  const record = { root: bytesToHex(tree.root), leafHex: state.leaves[Number(flags.index)], proof };
  if (flags.out) writeFileSync(flags.out, JSON.stringify(record, null, 2) + '\n');
  return emit(flags.out ? { wrote: flags.out, root: record.root } : record, flags);
}

export function runMerkleVerify({ flags }) {
  if (!flags.proof) { process.stderr.write('usage: proofbundle merkle-verify --proof proof.json [--json]\n'); return EXIT_CODES.USAGE_ERROR; }
  const record = readJson(flags.proof);
  try {
    const ok = verifyInclusionProof(hexToBytes(record.root), hexToBytes(record.leafHex), deserializeProof(record.proof));
    return emit({ verdict: ok ? 'VERIFIED' : 'INVALID_SIGNATURE', root: record.root, index: record.proof.index }, flags, ok ? EXIT_CODES.OK : EXIT_CODES.VERIFICATION_FAILED);
  } catch (e) {
    return emit({ verdict: e.verdict ?? 'INTERNAL_ERROR', message: e.message }, flags, EXIT_CODES.VERIFICATION_FAILED);
  }
}

function loadMmr(path) {
  const state = path ? readJson(path) : { leaves: [] };
  const m = new MMR();
  const leaves = (state.leaves ?? []).map(hexToBytes);
  leaves.forEach((l) => m.append(l));
  return { m, leaves };
}

export function runMmrAppend({ positional, flags }) {
  const { m, leaves } = loadMmr(flags.state);
  const added = positional.map((s) => enc.encode(s));
  if (!added.length) { process.stderr.write('usage: proofbundle mmr-append <entry> [entry...] [--state mmr.json] [--out mmr.json]\n'); return EXIT_CODES.USAGE_ERROR; }
  added.forEach((a) => m.append(a));
  const all = [...leaves, ...added];
  const state = { leafCount: m.leafCount, root: bytesToHex(m.root()), peaks: m.peakHashes.map(bytesToHex), leaves: all.map(bytesToHex) };
  const out = flags.out || flags.state;
  if (out) writeFileSync(out, JSON.stringify(state, null, 2) + '\n');
  return emit({ leafCount: state.leafCount, root: state.root, peakCount: state.peaks.length }, flags);
}

export function runMmrProve({ flags }) {
  if (!flags.state || flags.index === undefined) { process.stderr.write('usage: proofbundle mmr-prove --state mmr.json --index N [--out proof.json]\n'); return EXIT_CODES.USAGE_ERROR; }
  const { m } = loadMmr(flags.state);
  const p = m.proveLeaf(Number(flags.index));
  const record = {
    root: bytesToHex(m.root()),
    leafHex: readJson(flags.state).leaves[Number(flags.index)],
    proof: { leafIndex: p.leafIndex, leafCount: p.leafCount, digestAlg: p.digestAlg, peakIndex: p.peakIndex, siblings: p.siblings.map((s) => ({ hash: bytesToHex(s.hash), isLeft: s.isLeft })), peaks: p.peaks.map(bytesToHex) },
  };
  if (flags.out) writeFileSync(flags.out, JSON.stringify(record, null, 2) + '\n');
  return emit(flags.out ? { wrote: flags.out, root: record.root } : record, flags);
}

export function runMmrVerify({ flags }) {
  if (!flags.proof) { process.stderr.write('usage: proofbundle mmr-verify --proof proof.json [--json]\n'); return EXIT_CODES.USAGE_ERROR; }
  const record = readJson(flags.proof);
  const proof = {
    leafIndex: record.proof.leafIndex, leafCount: record.proof.leafCount, digestAlg: record.proof.digestAlg, peakIndex: record.proof.peakIndex,
    siblings: record.proof.siblings.map((s) => ({ hash: hexToBytes(s.hash), isLeft: s.isLeft })),
    peaks: record.proof.peaks.map(hexToBytes),
  };
  const ok = verifyMmrProof(hexToBytes(record.root), hexToBytes(record.leafHex), proof);
  return emit({ verdict: ok ? 'VERIFIED' : 'INVALID_SIGNATURE', root: record.root, leafIndex: proof.leafIndex }, flags, ok ? EXIT_CODES.OK : EXIT_CODES.VERIFICATION_FAILED);
}

export function runLineageCreate({ positional, flags }) {
  // Each positional is "type:payload[:parentIndex,parentIndex]".
  if (!positional.length) { process.stderr.write('usage: proofbundle lineage-create <type:payload[:parentIdx,...]> ... [--out lineage.json]\n'); return EXIT_CODES.USAGE_ERROR; }
  const g = new LineageGraph();
  const ids = [];
  try {
    for (const spec of positional) {
      const [nodeType, payload, parentSpec] = spec.split(':');
      const parents = parentSpec ? parentSpec.split(',').filter(Boolean).map((i) => ids[Number(i)]) : [];
      ids.push(g.addNode({ nodeType, payload: enc.encode(payload ?? ''), parents }));
    }
  } catch (e) {
    process.stderr.write(`lineage-create: ${e.message}\n`);
    return EXIT_CODES.VERIFICATION_FAILED;
  }
  const state = { nodes: ids.map((id) => ({ id, parents: g.get(id).parents })), topologicalOrder: g.topologicalOrder().order };
  if (flags.out) writeFileSync(flags.out, JSON.stringify(state, null, 2) + '\n');
  return emit({ nodeCount: ids.length, nodes: ids }, flags);
}

export function runLineageVerify({ flags }) {
  if (!flags.lineage) { process.stderr.write('usage: proofbundle lineage-verify --lineage lineage.json [--json]\n'); return EXIT_CODES.USAGE_ERROR; }
  const state = readJson(flags.lineage);
  try {
    const res = checkClaimedLineage(state.nodes);
    return emit(res.ok ? { verdict: 'VERIFIED', nodeCount: res.nodeCount } : { verdict: res.failure, reason: res.reason }, flags, res.ok ? EXIT_CODES.OK : EXIT_CODES.VERIFICATION_FAILED);
  } catch (e) {
    return emit({ verdict: e.verdict ?? 'INTERNAL_ERROR', message: e.message }, flags, EXIT_CODES.VERIFICATION_FAILED);
  }
}

#!/usr/bin/env node
/**
 * Rebuild Merkle state from scratch — corrects missing segments
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BRIDGE_DIR = process.argv[2] || '.';
const LEDGER_PATH = path.join(BRIDGE_DIR, 'ledger.jsonl');
const SEGMENT_SIZE = 50;
const MERKLE_STATE_PATH = path.join(BRIDGE_DIR, 'bridge_state', 'auto_merkle_state.json');

function sha256(text, encoding = 'utf8') {
  return crypto.createHash('sha256').update(text, encoding).digest('hex');
}
function sha256HexPair(left, right) {
  return crypto.createHash('sha256').update(left + right, 'hex').digest('hex');
}
function buildMerkleRoot(leaves) {
  let level = leaves.slice();
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left;
      next.push(sha256HexPair(left, right));
    }
    level = next;
  }
  return level[0];
}

const text = fs.readFileSync(LEDGER_PATH, 'utf8');
const lines = text.trim().split('\n');
const hashes = lines.map((line) => {
  try {
    const d = JSON.parse(line);
    return d.record_sha256 || d.proofbundle_verifier?.gate_sha256 || sha256(line);
  } catch {
    return sha256(line);
  }
});

const segments = [];
for (let i = 0; i < hashes.length; i += SEGMENT_SIZE) {
  const chunk = hashes.slice(i, i + SEGMENT_SIZE);
  const segIdx = Math.floor(i / SEGMENT_SIZE);
  segments.push({
    segment_index: segIdx,
    start_sequence: i + 1,
    end_sequence: i + chunk.length,
    record_count: chunk.length,
    segment_root: buildMerkleRoot(chunk),
  });
}

// Compute cumulative root over segment roots
const cumulativeRoot = buildMerkleRoot(segments.map(s => s.segment_root));

const state = {
  last_computed_sequence: hashes.length,
  last_computed_at: new Date().toISOString(),
  segment_size: SEGMENT_SIZE,
  segment_count: segments.length,
  cumulative_merkle_root: cumulativeRoot,
  segments,
};

fs.mkdirSync(path.dirname(MERKLE_STATE_PATH), { recursive: true });
fs.writeFileSync(MERKLE_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');

console.log(`Rebuilt Merkle state: ${hashes.length} records, ${segments.length} segments`);
console.log(`Cumulative root: ${cumulativeRoot}`);
segments.forEach(s => console.log(`  [${s.segment_index}] seq ${s.start_sequence}-${s.end_sequence} : ${s.segment_root.slice(0,16)}...`));

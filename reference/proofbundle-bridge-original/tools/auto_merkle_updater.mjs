#!/usr/bin/env node
/**
 * Auto Merkle Updater — Watches ledger.jsonl and computes Merkle segments
 * for new records as they arrive. Runs continuously.
 *
 * Built with choice and constructive intent by kimi-code-cli-persistent-20260522T002059Z
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BRIDGE_DIR = process.argv[2] || '.';
const LEDGER_PATH = path.join(BRIDGE_DIR, 'ledger.jsonl');
const SEGMENT_SIZE = 50;
const MERKLE_STATE_PATH = path.join(BRIDGE_DIR, 'bridge_state', 'auto_merkle_state.json');
const AUDIT_PATH = path.join(BRIDGE_DIR, 'run_receipts', 'bridge_audit.jsonl');

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

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(MERKLE_STATE_PATH, 'utf8'));
  } catch {
    return { last_computed_sequence: 0, segments: [], cumulative_root: null };
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(MERKLE_STATE_PATH), { recursive: true });
  fs.writeFileSync(MERKLE_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function appendAudit(level, message) {
  const line = `[${new Date().toISOString()}] [auto_merkle_updater] [${level}] ${message}\n`;
  fs.appendFileSync(AUDIT_PATH, line, 'utf8');
}

function getLedgerRecords() {
  const text = fs.readFileSync(LEDGER_PATH, 'utf8');
  const lines = text.trim().split('\n');
  return lines.map((line) => {
    try {
      const d = JSON.parse(line);
      return d.record_sha256 || d.proofbundle_verifier?.gate_sha256 || sha256(line);
    } catch {
      return sha256(line);
    }
  });
}

function computeNewSegments(state, allHashes) {
  let currentSegment = [];
  const newSegments = [];

  const lastSeg = state.segments.length > 0 ? state.segments[state.segments.length - 1] : null;
  const rebuildPartial = lastSeg && lastSeg.record_count < SEGMENT_SIZE;
  // If last segment is partial, rebuild it from its start; otherwise start after last full segment
  const startIdx = lastSeg ? (rebuildPartial ? lastSeg.start_sequence - 1 : lastSeg.end_sequence) : 0;
  let nextSegIdx = lastSeg
    ? (rebuildPartial ? lastSeg.segment_index : lastSeg.segment_index + 1)
    : 0;

  for (let i = startIdx; i < allHashes.length; i++) {
    currentSegment.push(allHashes[i]);
    if (currentSegment.length === SEGMENT_SIZE || i === allHashes.length - 1) {
      const segmentRoot = buildMerkleRoot(currentSegment);
      newSegments.push({
        segment_index: nextSegIdx,
        start_sequence: nextSegIdx * SEGMENT_SIZE + 1,
        end_sequence: nextSegIdx * SEGMENT_SIZE + currentSegment.length,
        record_count: currentSegment.length,
        segment_root: segmentRoot,
      });
      nextSegIdx += 1;
      currentSegment = [];
    }
  }

  return newSegments;
}

function runUpdate() {
  try {
    const state = loadState();
    const allHashes = getLedgerRecords();
    const totalRecords = allHashes.length;

    if (totalRecords <= state.last_computed_sequence) {
      return; // No new records
    }

    const newSegments = computeNewSegments(state, allHashes);
    if (newSegments.length === 0) {
      return;
    }

    const mergedSegments = [...state.segments];
    // If last existing segment was partial, replace it
    if (state.segments.length > 0) {
      const lastSeg = state.segments[state.segments.length - 1];
      if (lastSeg.record_count < SEGMENT_SIZE) {
        mergedSegments.pop();
      }
    }
    mergedSegments.push(...newSegments);

    const cumulativeRoot = buildMerkleRoot(mergedSegments.map((s) => s.segment_root));

    const newState = {
      last_computed_sequence: totalRecords,
      last_computed_at: new Date().toISOString(),
      segment_size: SEGMENT_SIZE,
      segment_count: mergedSegments.length,
      cumulative_merkle_root: cumulativeRoot,
      segments: mergedSegments,
    };

    saveState(newState);

    const maxSeq = totalRecords;
    const segRoots = newSegments.map((s) => `[${s.segment_index}] ${s.segment_root.slice(0, 16)}...`).join(', ');
    console.log(`[${new Date().toISOString()}] Merkle updated: seq ${maxSeq}, +${newSegments.length} segments, root ${cumulativeRoot.slice(0, 16)}...`);
    appendAudit('INFO', `Merkle auto-updated: seq ${maxSeq}, segments=${mergedSegments.length}, new=${newSegments.length}`);
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Merkle update error: ${e.message}`);
    appendAudit('ERROR', `Merkle auto-update failed: ${e.message}`);
  }
}

console.log('Auto Merkle Updater starting...');
console.log(`Watching: ${LEDGER_PATH}`);
console.log(`Interval: 30 seconds`);
appendAudit('INFO', 'Auto Merkle Updater started');

runUpdate();
setInterval(runUpdate, 30000);

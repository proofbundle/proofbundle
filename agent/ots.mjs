#!/usr/bin/env node
/**
 * ots.mjs — OpenTimestamps state machine for the agent bridge.
 *
 * Distinct states, never conflated (fixes the "OTS_SUBMITTED treated as
 * anchored" defect from the 2026-08-13 postmortem):
 *
 *   pending    — batch root computed, not yet submitted to any calendar
 *   submitted  — `ots stamp` invoked; calendar accepted (NOT anchored yet)
 *   upgraded   — commitment confirmed in a Bitcoin block (block_height known).
 *                Only this state means externally attested.
 *
 * Transitions are recorded append-only in ots_status.jsonl — history is
 * never rewritten.
 */
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, appendFileSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const execFileAsync = promisify(execFile);

export const OTS_STATES = ['pending', 'submitted', 'upgraded'];

/** Append a status transition (append-only). */
export function recordTransition(statusFile, batchId, from, to, extra = {}) {
  appendFileSync(statusFile, JSON.stringify({
    batch_id: batchId, from, to, ts: new Date().toISOString(), ...extra,
  }) + '\n');
}

/** Latest status per batch from the append-only log. */
export function readStatuses(statusFile) {
  if (!existsSync(statusFile)) return {};
  const out = {};
  for (const line of readFileSync(statusFile, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      out[r.batch_id] = r; // last record wins = current state
    } catch { /* torn line — skip */ }
  }
  return out;
}

/**
 * Submit a batch file for OTS stamping. Blocks until `ots stamp` actually
 * finishes (real calendar round-trips across 4 servers take several
 * seconds — a short timeout kills the child before it submits anything and
 * must not be read as success). The transition to 'submitted' is recorded
 * only once the process exits 0 AND the .ots proof file exists on disk;
 * anything else stays 'pending' with the real reason attached, so a status
 * of "submitted" always means a proof file backs it up.
 */
export async function submitForStamping(batchFile, statusFile, batchId, { timeout = 60_000 } = {}) {
  const otsFile = `${batchFile}.ots`;
  try {
    await execFileAsync('ots', ['stamp', batchFile], { timeout });
  } catch (e) {
    const reason = e.code === 'ENOENT' ? 'ots CLI not installed'
      : e.signal === 'SIGTERM' ? `stamp timed out after ${timeout}ms`
      : `stamp failed: ${e.message}`;
    recordTransition(statusFile, batchId, 'pending', 'pending', { reason });
    return 'pending';
  }
  if (!existsSync(otsFile)) {
    recordTransition(statusFile, batchId, 'pending', 'pending',
      { reason: 'ots stamp exited 0 but no .ots proof file was written' });
    return 'pending';
  }
  recordTransition(statusFile, batchId, 'pending', 'submitted', { file: batchFile, ots_file: otsFile });
  return 'submitted';
}

/**
 * Check whether a batch's .ots file has been upgraded into a Bitcoin block.
 * `ots info` on an upgraded timestamp includes "Bitcoin block <N>".
 * @returns {{ state, block_height }|null} null if no .ots file exists yet
 */
export async function checkUpgrade(otsFile) {
  if (!existsSync(otsFile)) return null;
  let stdout;
  try {
    ({ stdout } = await execFileAsync('ots', ['info', otsFile], { timeout: 30000 }));
  } catch {
    return { state: 'submitted', block_height: null }; // ots CLI missing/failed — don't overclaim
  }
  const m = stdout.match(/Bitcoin block (\d+)/);
  if (m) return { state: 'upgraded', block_height: Number(m[1]) };
  return { state: 'submitted', block_height: null };
}

/**
 * Scan a batches directory for .ots files and upgrade statuses where the
 * Bitcoin anchor has confirmed. Records transitions append-only.
 * @returns {object} current statuses map (batch_id -> record)
 */
export async function otsCheck({ batchesDir, statusFile }) {
  const current = readStatuses(statusFile);
  let files = [];
  try { files = readdirSync(batchesDir); } catch { return current; }
  for (const f of files) {
    if (!f.endsWith('.ots')) continue;
    // Batch files on disk are named <batchId>.json, so their proofs are
    // <batchId>.json.ots — strip both suffixes, not just the trailing .ots,
    // or every scan mints a phantom "<batchId>.json" batch that never
    // matches the real batch's recorded status (found live: a single scan
    // produced two records for the same batch under two different ids).
    const batchId = f.replace(/\.json\.ots$/, '');
    const prev = current[batchId];
    if (prev?.to === 'upgraded') continue; // terminal
    // Sequential, not Promise.all: this loop already runs inside the
    // broker's request handler — awaiting one at a time still yields the
    // event loop between each (unlike execFileSync), and keeps behavior
    // identical to the pre-fix ordering rather than reordering transitions.
    const res = await checkUpgrade(join(batchesDir, f));
    if (!res) continue;
    if (res.state !== prev?.to) {
      recordTransition(statusFile, batchId, prev?.to || 'pending', res.state, {
        block_height: res.block_height,
      });
      current[batchId] = { batch_id: batchId, to: res.state, block_height: res.block_height };
    } else if (res.block_height && !prev?.block_height) {
      recordTransition(statusFile, batchId, res.state, 'upgraded', {
        block_height: res.block_height,
      });
      current[batchId] = { batch_id: batchId, to: 'upgraded', block_height: res.block_height };
    }
  }
  return current;
}

/** sha256 of a file, hex — identity of what a batch seals. */
export function fileSha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

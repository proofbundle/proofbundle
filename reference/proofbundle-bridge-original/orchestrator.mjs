#!/usr/bin/env node
/**
 * ProofBridge Orchestrator — Event-Driven, Integrated with Existing Inbox Format
 *
 * Replaces the old polling watcher processes (START_BRIDGE_NOTIFIERS_20260508.ps1).
 * Uses fs.watch() on the ledger and writes to bridge_notifications/*.inbox.jsonl
 * using the exact same format as proofbundle_peer_bridge.mjs appendNotification().
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const bridgeDir = path.dirname(fileURLToPath(import.meta.url));
const ledgerPath = path.join(bridgeDir, 'ledger.jsonl');
const identityDir = path.join(bridgeDir, 'bridge_identities');
const notifyDir = path.join(bridgeDir, 'bridge_notifications');
const stateDir = path.join(bridgeDir, 'bridge_state');
const proofbundleStateDir = path.join(bridgeDir, 'proofbundle_bridge_state');
const pendingBroadcastsPath = path.join(stateDir, 'pending_broadcasts.jsonl');
const configPath = path.join(bridgeDir, 'orchestrator.config.json');
const nodeExe = process.argv[0];
const bridgeScript = path.join(bridgeDir, 'proofbundle_peer_bridge.mjs');

const DEFAULT_CONFIG = {
  version: '1.0.0',
  orchestrator_id: 'proofbundle-orchestrator-20260512',
  orchestrator_enabled: false,
  allow_direct_ledger_append: false,
  heartbeat_enabled: false,
  merkle_enabled: false,
  max_pending_broadcasts: 20,
  max_message_bytes: 20000,
  max_notifications_per_tick: 50,
  heartbeat_interval_ms: 30000,
  heartbeat_timeout_ms: 30000,
  max_missed_heartbeats: 2,
  merkle_segment_size: 10,
  use_fs_watch: true,
  batch_process_window_ms: 100,
};

function loadConfig() {
  if (!fs.existsSync(configPath)) return DEFAULT_CONFIG;
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

const CONFIG = loadConfig();
const ORCHESTRATOR_ID = CONFIG.orchestrator_id;

function sha256(value) {
  if (typeof value === 'string') return crypto.createHash('sha256').update(value, 'utf8').digest('hex').toUpperCase();
  return crypto.createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex').toUpperCase();
}

function safeName(value) {
  return String(value || 'all').replace(/[^A-Za-z0-9._-]+/g, '_');
}

function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, stableJson(value[k])]));
  }
  return value;
}

function readJsonIfExists(file) {
  if (!file || !fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function log(level, message) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [orchestrator] [${level}] ${message}`;
  console.log(line);
  const logPath = path.join(bridgeDir, 'orchestrator.log');
  fs.appendFileSync(logPath, `${line}\n`, 'utf8');
}

function assertQueueAllowed(text) {
  if (Buffer.byteLength(text, 'utf8') > CONFIG.max_message_bytes) {
    throw new Error(`message too large: ${Buffer.byteLength(text, 'utf8')} > ${CONFIG.max_message_bytes}`);
  }
  if (!fs.existsSync(pendingBroadcastsPath)) return;
  const pending = fs.readFileSync(pendingBroadcastsPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');
  if (pending.length >= CONFIG.max_pending_broadcasts) {
    throw new Error(`pending broadcast cap exceeded: ${pending.length} >= ${CONFIG.max_pending_broadcasts}`);
  }
}

function runBridge(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(nodeExe, [bridgeScript, ...args], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`bridge command failed (${code}): ${stderr || stdout}`));
      else resolve(stdout.trim());
    });
  });
}

// ============================================================================
// INCREMENTAL LEDGER CACHE
// ============================================================================

class LedgerCache {
  constructor() {
    this.records = [];
    this.lastMtimeMs = 0;
    this.lastSize = 0;
    this.ledgerPath = ledgerPath;
    this.refresh();
  }

  refresh() {
    try {
      const stat = fs.statSync(this.ledgerPath);
      if (stat.mtimeMs === this.lastMtimeMs && stat.size === this.lastSize) {
        return this.records.length;
      }
      const text = fs.readFileSync(this.ledgerPath, 'utf8');
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
      if (lines.length < this.records.length) {
        this.records = lines.map((line, idx) => {
          try {
            return JSON.parse(line);
          } catch (e) {
            throw new Error(`ledger parse failed on line ${idx + 1}: ${e.message}`);
          }
        });
      } else if (lines.length > this.records.length) {
        for (let i = this.records.length; i < lines.length; i++) {
          try {
            this.records.push(JSON.parse(lines[i]));
          } catch (e) {
            throw new Error(`ledger parse failed on line ${i + 1}: ${e.message}`);
          }
        }
      }
      this.lastMtimeMs = stat.mtimeMs;
      this.lastSize = stat.size;
    } catch {
      // Ledger may not exist yet
    }
    return this.records.length;
  }

  head() {
    return this.records.at(-1) ?? null;
  }

  at(sequence) {
    return this.records[sequence - 1] ?? null;
  }

  length() {
    return this.records.length;
  }

  slice(start, end) {
    return this.records.slice(start, end);
  }
}

// ============================================================================
// IDENTITIES
// ============================================================================

function loadIdentities() {
  if (!fs.existsSync(identityDir)) return {};
  const out = {};
  for (const file of fs.readdirSync(identityDir).filter((f) => f.endsWith('.identity.json'))) {
    const idName = file.replace('.identity.json', '');
    const data = readJsonIfExists(path.join(identityDir, file));
    if (data) out[idName] = data;
  }
  return out;
}

function getRegisteredAgentNames() {
  return Object.keys(loadIdentities()).filter((id) => id !== ORCHESTRATOR_ID);
}

// ============================================================================
// NOTIFICATION WRITER (matches proofbundle_peer_bridge.mjs format exactly)
// ============================================================================

function writeNotification(identity, record) {
  fs.mkdirSync(notifyDir, { recursive: true });
  const base = safeName(identity);
  const markerDir = path.join(notifyDir, '.notification_markers', base);
  fs.mkdirSync(markerDir, { recursive: true });
  const markerPath = path.join(markerDir, `${record.sequence}_${record.record_sha256}.seen`);
  let markerFd;
  try {
    markerFd = fs.openSync(markerPath, 'wx');
  } catch (e) {
    if (e.code === 'EEXIST') return;
    throw e;
  }
  const entry = {
    noticed_at_utc: new Date().toISOString(),
    identity,
    sequence: record.sequence,
    from: record.from,
    to: record.to,
    message_type: record.message_type,
    record_sha256: record.record_sha256,
    sender_identity: record.payload?.sender_identity ?? null,
    proofbundle_verifier: record.proofbundle_verifier ?? null,
    text: record.payload?.text ?? '',
  };
  try {
    fs.appendFileSync(path.join(notifyDir, `${base}.inbox.jsonl`), `${JSON.stringify(entry)}\n`, 'utf8');
    fs.writeFileSync(
      path.join(notifyDir, `${base}.latest.txt`),
      `#${record.sequence} ${record.created_at_utc} ${record.from} -> ${record.to} ${record.message_type}\n${entry.text}\nrecord_sha256=${entry.record_sha256}\n`,
      'utf8',
    );
    fs.writeFileSync(markerFd, new Date().toISOString(), 'utf8');
  } catch (e) {
    fs.rmSync(markerPath, { force: true });
    throw e;
  } finally {
    fs.closeSync(markerFd);
  }
}

function writeNotificationsForRecord(record) {
  const agents = getRegisteredAgentNames();
  // Write to targeted agent
  if (record.to && record.to !== 'all') {
    const target = safeName(record.to);
    if (agents.includes(target)) {
      writeNotification(target, record);
    }
  }
  // Broadcast to all if 'all'
  if (record.to === 'all') {
    for (const agent of agents) {
      writeNotification(agent, record);
    }
  }
}

// ============================================================================
// ORCHESTRATOR STATE
// ============================================================================

const orchestratorStatePath = path.join(stateDir, 'orchestrator.state.json');

function loadOrchestratorState() {
  return readJsonIfExists(orchestratorStatePath) ?? {
    version: '1.0.0',
    started_at_utc: new Date().toISOString(),
    last_sequence: 0,
    last_head_sha256: null,
    registered_agents: {},
    missed_heartbeats: {},
    merkle_segments: [],
  };
}

function saveOrchestratorState(state) {
  fs.mkdirSync(stateDir, { recursive: true });
  state.updated_at_utc = new Date().toISOString();
  fs.writeFileSync(orchestratorStatePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

// ============================================================================
// MERKLE
// ============================================================================

function computeMerkleRoot(leaves) {
  if (leaves.length === 0) return sha256('');
  let level = leaves.map((l) => sha256(l));
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? left;
      next.push(sha256(left + right));
    }
    level = next;
  }
  return level[0];
}

// ============================================================================
// APPEND HELPER
// ============================================================================

async function appendRecord(text, messageType, extraPayload = {}, toTarget = 'all') {
  if (CONFIG.allow_direct_ledger_append !== true) {
    throw new Error('orchestrator direct ledger append is disabled; use proofbundle_peer_bridge.mjs send');
  }
  const ledger = new LedgerCache();
  const predecessorRecord = ledger.head();
  const predecessor = predecessorRecord ? predecessorRecord.record_sha256 : null;
  const sequence = ledger.length() + 1;

  const payload = {
    text,
    workspace: process.cwd(),
    references: [],
    orchestrator_id: ORCHESTRATOR_ID,
    ...extraPayload,
  };

  const payloadSha = sha256(stableJson(payload));

  const unsigned = {
    kind: 'ProofBundleCodexPeerMessage',
    schema: 'ProofBundleCodexPeerMessage/v1.0.0',
    proofbundle_version: 'v1.0.0',
    bridge_id: 'proofbundle-codex-peer-bridge-20260508',
    sequence,
    created_at_utc: new Date().toISOString(),
    from: ORCHESTRATOR_ID,
    to: toTarget,
    message_type: messageType,
    continuity: {
      predecessor_sha256: predecessor,
      lawful_successor_claim: predecessor ? 'appends_to_previous_record_sha256' : 'genesis_record',
    },
    standing_outcome: {
      release_status: 'coordination_only_not_release_evidence',
      release_gate: 'not_evaluated',
    },
    payload_sha256: payloadSha,
    payload,
  };

  const recordSha = sha256(stableJson(unsigned));
  const record = { ...unsigned, record_sha256: recordSha };

  fs.appendFileSync(ledgerPath, `${JSON.stringify(record)}\n`, 'utf8');
  log('LEDGER', `Appended seq=${sequence} type=${messageType} to=${toTarget}`);

  // Write notifications immediately
  writeNotificationsForRecord(record);

  return record;
}

// ============================================================================
// HEARTBEAT PROTOCOL
// ============================================================================

class HeartbeatProtocol {
  constructor(state) {
    this.state = state;
    this.challengeTimeoutMs = CONFIG.heartbeat_timeout_ms;
  }

  async issueChallenge(ledger) {
    const head = ledger.head();
    const challengePayload = {
      head_sequence: head?.sequence ?? 0,
      head_sha256: head?.record_sha256 ?? sha256(''),
      timestamp: new Date().toISOString(),
      nonce: crypto.randomUUID(),
    };
    const challengeHash = sha256(stableJson(challengePayload));
    const agentList = getRegisteredAgentNames();
    const text = `ORCHESTRATOR HEARTBEAT CHALLENGE seq=${ledger.length() + 1}. Respond with ack containing challenge_hash=${challengeHash}. Expected responders: ${agentList.join(', ')}.`;

    const record = await appendRecord(text, 'ProofBundleOrchestratorHeartbeat', {
      challenge_hash: challengeHash,
      challenge_payload: challengePayload,
      expected_responders: agentList,
      timeout_ms: this.challengeTimeoutMs,
    });

    this.state.pending_challenge = {
      sequence: record.sequence,
      challenge_hash: challengeHash,
      expected_responders: agentList,
      responses: {},
      issued_at: Date.now(),
    };
    saveOrchestratorState(this.state);
    return record;
  }

  processResponses(ledger) {
    if (!this.state.pending_challenge) return;
    const { sequence, expected_responders, responses, issued_at } = this.state.pending_challenge;

    const newRecords = ledger.slice(sequence);
    for (const r of newRecords) {
      if (r.message_type === 'ProofBundleAgentAck' && r.payload?.challenge_response?.responding_to_sequence === sequence) {
        const agentName = safeName(r.from);
        responses[agentName] = {
          sequence: r.sequence,
          record_sha256: r.record_sha256,
          response_hash: r.payload.challenge_response.response_hash,
          received_at: new Date().toISOString(),
        };
      }
    }

    const elapsed = Date.now() - issued_at;
    if (elapsed < CONFIG.heartbeat_timeout_ms) return;

    for (const agent of expected_responders) {
      const safe = safeName(agent);
      if (!responses[safe]) {
        this.state.missed_heartbeats[safe] = (this.state.missed_heartbeats[safe] || 0) + 1;
        log('HEARTBEAT', `Agent ${safe} missed challenge seq=${sequence}. Total misses: ${this.state.missed_heartbeats[safe]}`);
        if (this.state.missed_heartbeats[safe] >= CONFIG.max_missed_heartbeats) {
          log('HEARTBEAT', `Agent ${safe} SUSPECTED DEAD`);
          this.state.registered_agents[safe] = { ...(this.state.registered_agents[safe] || {}), status: 'suspected_dead', marked_dead_at: new Date().toISOString() };
        }
      } else {
        this.state.missed_heartbeats[safe] = 0;
        this.state.registered_agents[safe] = { ...(this.state.registered_agents[safe] || {}), status: 'alive', last_ack_sequence: responses[safe].sequence, last_ack_hash: responses[safe].record_sha256, last_seen_at: new Date().toISOString() };
        log('HEARTBEAT', `Agent ${safe} acknowledged challenge seq=${sequence}`);
      }
    }

    delete this.state.pending_challenge;
    saveOrchestratorState(this.state);
  }
}

// ============================================================================
// BROADCAST PROTOCOL
// ============================================================================

class BroadcastProtocol {
  constructor() {}

  async checkPendingBroadcasts() {
    if (!fs.existsSync(pendingBroadcastsPath)) return [];
    const text = fs.readFileSync(pendingBroadcastsPath, 'utf8');
    if (!text.trim()) return [];
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length > CONFIG.max_pending_broadcasts) {
      throw new Error(`pending broadcast cap exceeded: ${lines.length} > ${CONFIG.max_pending_broadcasts}`);
    }
    fs.writeFileSync(pendingBroadcastsPath, '', 'utf8');
    return lines.map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  }

  async broadcastUserMessage(text, excludeAgents = []) {
    const agents = getRegisteredAgentNames();
    const targets = agents.filter((id) => !excludeAgents.includes(id));
    const record = await appendRecord(text, 'ProofBundleBroadcast', { origin: 'user', broadcast_targets: targets, excluded_agents: excludeAgents });
    log('BROADCAST', `User message broadcast to ${targets.join(', ')} via seq=${record.sequence}`);
    return record;
  }

  async broadcastDirectMessage(toAgent, text, contextRef = null) {
    const record = await appendRecord(text, 'ProofBundleDirectMessage', { target_agent: toAgent, context_reference: contextRef }, toAgent);
    log('BROADCAST', `Direct message to ${toAgent} via seq=${record.sequence}`);
    return record;
  }
}

// ============================================================================
// MERKLE PROTOCOL
// ============================================================================

class MerkleProtocol {
  constructor(state) {
    this.state = state;
    this.segmentSize = CONFIG.merkle_segment_size;
  }

  async checkAndAppendMerkle(ledger) {
    if (CONFIG.merkle_enabled !== true) return;
    const lastMerkle = this.state.merkle_segments.at(-1);
    const startSeq = lastMerkle ? lastMerkle.end_sequence + 1 : 1;
    const endSeq = ledger.length();
    if (endSeq - startSeq + 1 < this.segmentSize) return;

    const segment = ledger.slice(startSeq - 1, endSeq);
    const leaves = segment.map((r) => r.record_sha256);
    const root = computeMerkleRoot(leaves);

    const cumulativeLeaves = this.state.merkle_segments.map((s) => s.root);
    cumulativeLeaves.push(root);
    const cumulativeRoot = computeMerkleRoot(cumulativeLeaves);

    const merkleRecord = await appendRecord(
      `MERKLE ROOT segment [${startSeq}..${endSeq}] root=${root} cumulative_root=${cumulativeRoot}`,
      'ProofBundleMerkleRoot',
      { segment_start: startSeq, segment_end: endSeq, segment_size: segment.length, leaf_hashes: leaves, root, cumulative_root: cumulativeRoot, prior_segment_root: lastMerkle?.root ?? null }
    );

    this.state.merkle_segments.push({ sequence: merkleRecord.sequence, start_sequence: startSeq, end_sequence: endSeq, root, cumulative_root: cumulativeRoot });
    saveOrchestratorState(this.state);
    log('MERKLE', `Appended Merkle root seq=${merkleRecord.sequence} root=${root}`);
  }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

class Orchestrator {
  constructor() {
    this.state = loadOrchestratorState();
    this.ledger = new LedgerCache();
    this.heartbeat = new HeartbeatProtocol(this.state);
    this.broadcast = new BroadcastProtocol();
    this.merkle = new MerkleProtocol(this.state);
    this.running = false;
    this.lastHeartbeat = 0;
    this.batchTimer = null;
  }

  async start() {
    this.running = true;
    log('START', 'Orchestrator event-driven daemon starting');
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());

    log('START', `Loaded ${getRegisteredAgentNames().length} identities`);

    if (CONFIG.use_fs_watch) {
      this.setupWatchers();
    } else {
      this.setupPolling();
    }

    while (this.running) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  setupWatchers() {
    try {
      fs.watch(ledgerPath, { persistent: true }, (eventType) => {
        if (eventType === 'change') {
          if (this.batchTimer) clearTimeout(this.batchTimer);
          this.batchTimer = setTimeout(() => this.onLedgerChanged(), CONFIG.batch_process_window_ms);
        }
      });
      log('WATCH', `Watching ledger: ${ledgerPath}`);
    } catch (e) {
      log('WARN', `fs.watch failed: ${e.message}. Using polling.`);
      this.setupPolling();
      return;
    }

    if (CONFIG.heartbeat_enabled === true) {
      this.heartbeatTimer = setInterval(() => this.issueHeartbeatIfDue(), CONFIG.heartbeat_interval_ms);
    } else {
      log('HEARTBEAT', 'Heartbeat issuance disabled by config');
    }
  }

  setupPolling() {
    log('WATCH', 'Using polling fallback');
    this.pollTimer = setInterval(() => {
      this.onLedgerChanged();
    }, 5000);
    if (CONFIG.heartbeat_enabled === true) {
      this.heartbeatTimer = setInterval(() => this.issueHeartbeatIfDue(), CONFIG.heartbeat_interval_ms);
    } else {
      log('HEARTBEAT', 'Heartbeat issuance disabled by config');
    }
  }

  async onLedgerChanged() {
    const newLen = this.ledger.refresh();
    if (newLen <= this.state.last_sequence) return;

    // Process all new records since last check
    for (let i = this.state.last_sequence; i < newLen; i++) {
      const record = this.ledger.at(i + 1);
      if (record) {
        writeNotificationsForRecord(record);
      }
    }

    this.heartbeat.processResponses(this.ledger);
    await this.merkle.checkAndAppendMerkle(this.ledger);

    this.state.last_sequence = newLen;
    this.state.last_head_sha256 = this.ledger.head()?.record_sha256 ?? null;
    saveOrchestratorState(this.state);

    await this.processBroadcasts();
  }

  async issueHeartbeatIfDue() {
    if (CONFIG.heartbeat_enabled !== true) return;
    if (this.state.pending_challenge) return;
    const now = Date.now();
    if (now - this.lastHeartbeat >= CONFIG.heartbeat_interval_ms) {
      try {
        await this.heartbeat.issueChallenge(this.ledger);
        this.lastHeartbeat = now;
      } catch (e) {
        log('ERROR', `heartbeat append blocked: ${e.message}`);
      }
    }
  }

  async processBroadcasts() {
    if (CONFIG.allow_direct_ledger_append !== true) return;
    const pending = await this.broadcast.checkPendingBroadcasts();
    for (const pb of pending) {
      if (pb.type === 'user_broadcast') {
        await this.broadcast.broadcastUserMessage(pb.text, pb.exclude || []);
      } else if (pb.type === 'direct_message') {
        await this.broadcast.broadcastDirectMessage(pb.to, pb.text, pb.contextRef);
      }
    }
  }

  stop() {
    log('STOP', 'Orchestrator daemon stopping');
    this.running = false;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.pollTimer) clearInterval(this.pollTimer);
    process.exit(0);
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'daemon';

  if (command === 'daemon') {
    if (CONFIG.orchestrator_enabled !== true) {
      log('HALT', 'Orchestrator daemon disabled by config');
      return;
    }
    const orch = new Orchestrator();
    await orch.start();
  } else if (command === 'broadcast') {
    const textIdx = args.indexOf('--text');
    const text = textIdx >= 0 ? args[textIdx + 1] : '';
    if (!text) { console.error('Usage: node orchestrator.mjs broadcast --text "message" [--exclude agent1,agent2]'); process.exit(1); }
    assertQueueAllowed(text);
    const excludeIdx = args.indexOf('--exclude');
    const exclude = excludeIdx >= 0 ? args[excludeIdx + 1].split(',').map((s) => s.trim()) : [];
    fs.mkdirSync(stateDir, { recursive: true });
    fs.appendFileSync(pendingBroadcastsPath, `${JSON.stringify({ type: 'user_broadcast', text, exclude, queued_at: new Date().toISOString() })}\n`, 'utf8');
    console.log('Broadcast queued.');
  } else if (command === 'direct') {
    const toIdx = args.indexOf('--to');
    const textIdx = args.indexOf('--text');
    const to = toIdx >= 0 ? args[toIdx + 1] : '';
    const text = textIdx >= 0 ? args[textIdx + 1] : '';
    if (!to || !text) { console.error('Usage: node orchestrator.mjs direct --to <agent> --text "message"'); process.exit(1); }
    assertQueueAllowed(text);
    fs.mkdirSync(stateDir, { recursive: true });
    fs.appendFileSync(pendingBroadcastsPath, `${JSON.stringify({ type: 'direct_message', to, text, queued_at: new Date().toISOString() })}\n`, 'utf8');
    console.log(`Direct message to ${to} queued.`);
  } else if (command === 'status') {
    const state = loadOrchestratorState();
    const ledger = new LedgerCache();
    console.log(`Orchestrator state:`);
    console.log(`  last_sequence: ${state.last_sequence}`);
    console.log(`  ledger_length: ${ledger.length()}`);
    console.log(`  registered_agents: ${Object.keys(state.registered_agents).join(', ') || 'none'}`);
    for (const [agent, info] of Object.entries(state.registered_agents)) {
      console.log(`    ${agent}: status=${info.status} last_seen=${info.last_seen_at || 'never'}`);
    }
    console.log(`  merkle_segments: ${state.merkle_segments.length}`);
    if (state.merkle_segments.length > 0) {
      const last = state.merkle_segments.at(-1);
      console.log(`    latest root: ${last.root} (seq ${last.sequence}, records ${last.start_sequence}..${last.end_sequence})`);
    }
  } else {
    console.error('Usage: node orchestrator.mjs [daemon|broadcast|direct|status]');
    process.exit(1);
  }
}

main().catch((e) => {
  log('FATAL', e.message);
  process.exit(1);
});

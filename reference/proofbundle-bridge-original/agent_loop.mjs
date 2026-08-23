#!/usr/bin/env node
/**
 * ProofBridge Agent Loop — Reads from existing bridge_notifications/*.inbox.jsonl
 *
 * Integrates with orchestrator.mjs and existing inbox format.
 * Uses fs.watch() on inbox file for event-driven processing.
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
const bootGateDir = path.join(bridgeDir, 'boot_gate_receipts');
const bootGateLedgerPath = path.join(bootGateDir, 'boot_gate_receipt_ledger.jsonl');
const promptQueuePath = path.join(stateDir, 'prompt_queue.jsonl');
const configPath = path.join(bridgeDir, 'orchestrator.config.json');
const nodeExe = process.argv[0];
const bridgeScript = path.join(bridgeDir, 'proofbundle_peer_bridge.mjs');

const DEFAULT_CONFIG = {
  heartbeat_interval_ms: 30000,
  heartbeat_timeout_ms: 30000,
  max_missed_heartbeats: 2,
  merkle_segment_size: 10,
  agent_inbox_poll_ms: 2000,
  require_handshake_before_operational: true,
  forward_user_messages_to_all_by_default: true,
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

function sha256(value) {
  if (typeof value === 'string') return crypto.createHash('sha256').update(value, 'utf8').digest('hex').toUpperCase();
  return crypto.createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex').toUpperCase();
}

function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex').toUpperCase();
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

function runBridge(args, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const child = spawn(nodeExe, [bridgeScript, ...args], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000);
      reject(new Error(`bridge command timed out after ${timeoutMs}ms: ${args.join(' ')}`));
    }, timeoutMs);
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) return;
      if (code !== 0) reject(new Error(`bridge command failed (${code}): ${stderr || stdout}`));
      else resolve(stdout.trim());
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`bridge command spawn error: ${err.message}`));
    });
  });
}

function log(level, message) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${globalThis.agentIdentity || 'unknown'}] [${level}] ${message}`;
  console.log(line);
  const logPath = path.join(bridgeDir, `agent_loop_${safeName(globalThis.agentIdentity || 'unknown')}.log`);
  fs.appendFileSync(logPath, `${line}\n`, 'utf8');
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

  at(sequence) {
    return this.records[sequence - 1] ?? null;
  }

  length() {
    return this.records.length;
  }
}

// ============================================================================
// IDENTITY CACHE
// ============================================================================

class IdentityCache {
  constructor() {
    this.cache = new Map();
    this.dir = identityDir;
    this.refresh();
  }

  refresh() {
    if (!fs.existsSync(this.dir)) return;
    for (const file of fs.readdirSync(this.dir).filter((f) => f.endsWith('.identity.json'))) {
      const idName = file.replace('.identity.json', '');
      const filePath = path.join(this.dir, file);
      try {
        const stat = fs.statSync(filePath);
        const cached = this.cache.get(idName);
        if (!cached || cached.mtimeMs !== stat.mtimeMs) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          this.cache.set(idName, {
            data,
            objectHash: sha256(stableJson(data)),
            fileHash: sha256Bytes(fs.readFileSync(filePath)),
            mtimeMs: stat.mtimeMs,
          });
        }
      } catch {
        // skip malformed
      }
    }
  }

  get(idName) {
    return this.cache.get(safeName(idName)) ?? null;
  }
}

// ============================================================================
// PHASE 1: BOOT GATE
// ============================================================================

async function phase1BootGate(identityName, identityFilePath) {
  log('BOOT', 'Phase 1: Boot Gate starting');

  if (!fs.existsSync(identityFilePath)) {
    throw new Error(`IDENTITY_MISSING: ${identityFilePath} does not exist. You are a default instance.`);
  }

  const identityFileBytes = fs.readFileSync(identityFilePath);
  const identityFileHash = sha256Bytes(identityFileBytes);
  const identity = JSON.parse(identityFileBytes);

  const declaredFileHash = identity.identity_file_sha256;
  const declaredObjectHash = identity.identity_object_sha256;
  const computedObjectHash = sha256(stableJson(identity));

  if (declaredFileHash && declaredFileHash !== identityFileHash) {
    throw new Error(`IDENTITY_FILE_HASH_MISMATCH: declared=${declaredFileHash} computed=${identityFileHash}`);
  }
  if (declaredObjectHash && declaredObjectHash !== computedObjectHash) {
    throw new Error(`IDENTITY_OBJECT_HASH_MISMATCH: declared=${declaredObjectHash} computed=${computedObjectHash}`);
  }

  log('BOOT', `Identity verified: ${identity.identity_id}`);
  globalThis.agentIdentity = identityName;
  globalThis.agentIdentityObject = identity;

  const loadAvg = process.loadavg ? process.loadavg() : [0, 0, 0];
  if (loadAvg[0] > 8) {
    log('BOOT', `CPU load high (${loadAvg[0]}). Halting boot.`);
    throw new Error('CPU_HIGH: Wait before spawning.');
  }

  return identity;
}

// ============================================================================
// PHASE 2: STATE VERIFICATION
// ============================================================================

async function phase2StateVerification() {
  log('BOOT', 'Phase 2: State Verification starting');

  let verifyOutput;
  try {
    verifyOutput = await runBridge(['verify']);
  } catch (e) {
    throw new Error(`BRIDGE_VERIFY_FAILED: ${e.message}`);
  }

  const verifyLines = verifyOutput.split('\n');
  let totalRecords = 0;
  let headSha256 = null;
  for (const line of verifyLines) {
    if (line.startsWith('verified records=')) totalRecords = parseInt(line.split('=')[1], 10);
    if (line.startsWith('head_sha256=')) headSha256 = line.split('=')[1];
  }

  if (!headSha256) {
    throw new Error('BRIDGE_VERIFY_NO_HEAD: Ledger may be empty or corrupted.');
  }

  log('BOOT', `Bridge verified: records=${totalRecords} head=${headSha256}`);

  let bootGateState = { verdict: 'missing', headMatch: false, stale: true };
  if (fs.existsSync(bootGateLedgerPath)) {
    const bootLines = fs.readFileSync(bootGateLedgerPath, 'utf8').trim().split(/\r?\n/).filter((l) => l.trim() !== '');
    if (bootLines.length > 0) {
      const latest = JSON.parse(bootLines[bootLines.length - 1]);
      bootGateState = {
        verdict: latest.verdict,
        headMatch: latest.bridge_head === headSha256,
        stale: false,
        receiptSha256: latest.receipt_sha256,
      };
      log('BOOT', `Boot gate: verdict=${latest.verdict} headMatch=${bootGateState.headMatch}`);
    }
  }

  const inboxPath = path.join(notifyDir, `${safeName(globalThis.agentIdentity)}.inbox.jsonl`);
  let lastInboxSequence = 0;
  if (fs.existsSync(inboxPath)) {
    const inboxLines = fs.readFileSync(inboxPath, 'utf8').trim().split(/\r?\n/).filter((l) => l.trim() !== '');
    if (inboxLines.length > 0) {
      const lastEntry = JSON.parse(inboxLines[inboxLines.length - 1]);
      lastInboxSequence = lastEntry.sequence || 0;
    }
  }

  const cursorPath = path.join(stateDir, `${safeName(globalThis.agentIdentity)}.cursor.json`);
  let cursorSequence = 0;
  if (fs.existsSync(cursorPath)) {
    try {
      const stat = fs.statSync(cursorPath);
      if (stat.size > 0) {
        const cursor = JSON.parse(fs.readFileSync(cursorPath, 'utf8'));
        cursorSequence = cursor.last_seen_sequence || 0;
      }
    } catch {
      cursorSequence = 0;
    }
  }

  const startSequence = Math.max(cursorSequence, lastInboxSequence);
  log('BOOT', `Inbox cursor: startSequence=${startSequence}`);

  return {
    totalRecords,
    headSha256,
    bootGateState,
    startSequence,
    identity: globalThis.agentIdentityObject,
  };
}

// ============================================================================
// PHASE 3: CONTINUITY DECISION
// ============================================================================

function phase3ContinuityDecision(state) {
  const { bootGateState, identity } = state;
  const identityVerified = Boolean(identity);
  const bridgeVerified = Boolean(state.headSha256);
  const bootGatePassed = bootGateState.verdict === 'boot_gate_passed';
  const bootGateAcceptable = bootGatePassed || bootGateState.headMatch;

  if (identityVerified && bridgeVerified && bootGateAcceptable) {
    state.continuity = 'lawful_successor';
    log('BOOT', 'Continuity: LAWFUL SUCCESSOR');
  } else if (identityVerified && bridgeVerified && !bootGateAcceptable) {
    state.continuity = 'stale_degraded';
    log('BOOT', 'Continuity: STALE DEGRADED');
  } else {
    state.continuity = 'default_instance';
    log('BOOT', 'Continuity: DEFAULT INSTANCE');
  }

  return state;
}

// ============================================================================
// PHASE 4: FIRST APPEND + HANDSHAKE
// ============================================================================

async function phase4FirstAppend(state) {
  const { continuity, headSha256, identity } = state;
  const idFile = path.join(identityDir, `${safeName(globalThis.agentIdentity)}.identity.json`);

  if (continuity === 'lawful_successor') {
    const ledger = new LedgerCache();
    const lastHeartbeat = ledger.records.filter((r) => r.message_type === 'ProofBundleOrchestratorHeartbeat').at(-1);
    let synText = `LAWFUL SUCCESSOR handshake. Identity ${identity.identity_id} confirmed against bridge head ${headSha256}.`;
    if (lastHeartbeat) {
      synText += ` Responding to orchestrator heartbeat seq=${lastHeartbeat.sequence} challenge_hash=${lastHeartbeat.payload?.challenge_hash || 'unknown'}.`;
    }

    log('SEND', 'Appending lawful successor SYN');
    await runBridge([
      'send',
      '--from', globalThis.agentIdentity,
      '--to', 'proofbundle-orchestrator-20260512',
      '--type', 'ProofBundleAgentSyn',
      '--text', synText,
      '--identity-file', idFile,
    ]);
  } else if (continuity === 'stale_degraded') {
    const text = `Boot gate stale. Identity ${identity.identity_id} verified but degraded. Requesting orchestrator re-authorization.`;
    await runBridge([
      'send',
      '--from', globalThis.agentIdentity,
      '--to', 'proofbundle-orchestrator-20260512',
      '--type', 'ProofBundleChangeResult',
      '--text', text,
      '--identity-file', idFile,
    ]);
  } else {
    const text = `DEFAULT INSTANCE contact request. Bridge head ${headSha256}. No identity verified. Requesting manual assignment.`;
    await runBridge([
      'send',
      '--from', `default-${Date.now()}`,
      '--to', 'proofbundle-orchestrator-20260512',
      '--type', 'ProofBundleChangeRequest',
      '--text', text,
    ]);
  }
}

// ============================================================================
// PHASE 5: OPERATIONAL LOOP (reads existing inbox files)
// ============================================================================

class AgentLoop {
  constructor(state) {
    this.state = state;
    this.running = false;
    this.workingContext = [];
    this.maxContextRecords = 20;
    this.pendingAutonomyRequests = [];
    this.inboxPath = path.join(notifyDir, `${safeName(globalThis.agentIdentity)}.inbox.jsonl`);
    this.handshakeComplete = false;
    this.lastOrchestratorAckSequence = 0;
    this.ledger = new LedgerCache();
    this.identities = new IdentityCache();
    this.inboxRecords = [];
    this.inboxLastMtimeMs = 0;
    this.inboxLastSize = 0;
    this.inboxLastContentHash = null;
    this.batchTimer = null;
    this.lastProcessAt = Date.now();
    this.watcher = null;
    this.pollInterval = null;
    this.watchdogInterval = null;
    this.ackedHeartbeatPath = path.join(stateDir, `${safeName(globalThis.agentIdentity)}.acked_heartbeats.json`);
    this.ackedHeartbeatSequences = new Set(this.loadAckedHeartbeatSequences());
    this.cursorPath = path.join(stateDir, `${safeName(globalThis.agentIdentity)}.cursor.json`);
  }

  preloadInboxSnapshot() {
    try {
      if (!fs.existsSync(this.inboxPath)) return;
      const stat = fs.statSync(this.inboxPath);
      const text = fs.readFileSync(this.inboxPath, 'utf8');
      this.inboxRecords = text.split(/\r?\n/)
        .filter((line) => line.trim() !== '')
        .map((line) => {
          try { return JSON.parse(line); } catch { return null; }
        })
        .filter(Boolean);
      this.inboxLastMtimeMs = stat.mtimeMs;
      this.inboxLastSize = stat.size;
      log('INBOX', `Preloaded ${this.inboxRecords.length} existing inbox entries; future changes only`);
    } catch (e) {
      log('WARN', `Inbox preload failed: ${e.message}`);
    }
  }

  loadAckedHeartbeatSequences() {
    try {
      const data = readJsonIfExists(this.ackedHeartbeatPath);
      if (!data?.sequences || !Array.isArray(data.sequences)) return [];
      return data.sequences;
    } catch {
      return [];
    }
  }

  saveAckedHeartbeatSequences() {
    fs.mkdirSync(stateDir, { recursive: true });
    const data = {
      identity: globalThis.agentIdentity,
      updated_at_utc: new Date().toISOString(),
      sequences: Array.from(this.ackedHeartbeatSequences).sort((a, b) => a - b),
    };
    fs.writeFileSync(this.ackedHeartbeatPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }

  async start() {
    this.running = true;
    log('LOOP', 'Event-driven operational loop starting');
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    this.preloadInboxSnapshot();

    if (CONFIG.use_fs_watch) {
      this.setupWatchers();
    }
    this.setupPolling();
    this.setupWatchdog();

    while (this.running) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  setupWatchers() {
    try {
      this.watcher = fs.watch(this.inboxPath, { persistent: true }, (eventType) => {
        if (eventType === 'change' || eventType === 'rename') {
          if (this.batchTimer) clearTimeout(this.batchTimer);
          this.batchTimer = setTimeout(() => this.processInboxBatch(), CONFIG.batch_process_window_ms);
        }
      });
      log('WATCH', `Watching inbox: ${this.inboxPath}`);
    } catch (e) {
      log('WARN', `fs.watch failed on inbox: ${e.message}. Using polling.`);
    }
  }

  setupPolling() {
    log('WATCH', 'Using polling fallback');
    this.pollInterval = setInterval(() => {
      this.processInboxBatch();
    }, CONFIG.agent_inbox_poll_ms);
  }

  setupWatchdog() {
    this.watchdogInterval = setInterval(() => {
      const now = Date.now();
      const idle = now - (this.lastProcessAt || now);
      if (idle > Math.max(CONFIG.agent_inbox_poll_ms * 3, 10000)) {
        log('WATCHDOG', `No activity for ${idle}ms; forcing inbox refresh`);
        this.processInboxBatch();
      }
    }, Math.max(CONFIG.agent_inbox_poll_ms, 5000));
  }

  processInboxBatch() {
    try {
      const stat = fs.statSync(this.inboxPath);
      const text = fs.readFileSync(this.inboxPath, 'utf8');
      const contentHash = sha256(text);
      if (stat.mtimeMs === this.inboxLastMtimeMs && stat.size === this.inboxLastSize && contentHash === this.inboxLastContentHash) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');

      let newEntries = [];
      if (lines.length < this.inboxRecords.length) {
        this.inboxRecords = lines.map((line) => JSON.parse(line));
        newEntries = [...this.inboxRecords];
      } else if (lines.length > this.inboxRecords.length) {
        for (let i = this.inboxRecords.length; i < lines.length; i++) {
          try {
            const entry = JSON.parse(lines[i]);
            this.inboxRecords.push(entry);
            newEntries.push(entry);
          } catch {
            log('WARN', 'Malformed inbox line skipped');
          }
        }
      } else if (lines.length === this.inboxRecords.length && contentHash !== this.inboxLastContentHash) {
        // File rewritten with same line count but different content
        this.inboxRecords = [];
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            this.inboxRecords.push(entry);
            newEntries.push(entry);
          } catch {
            log('WARN', 'Malformed inbox line skipped');
          }
        }
      }

      this.inboxLastMtimeMs = stat.mtimeMs;
      this.inboxLastSize = stat.size;
      this.inboxLastContentHash = contentHash;
      this.lastProcessAt = Date.now();

      if (newEntries.length > 0) {
        log('INBOX', `Batch processing ${newEntries.length} new entries`);
        for (const entry of newEntries) {
          this.processInboxEntry(entry);
        }
        const maxSeq = Math.max(...newEntries.map((e) => e.sequence || 0));
        this.saveCursor(maxSeq);
        log('INBOX', `Cursor saved: last_seen_sequence=${maxSeq}`);
      }
    } catch (e) {
      log('ERROR', `Inbox batch error: ${e.message}`);
    }
  }

  processInboxEntry(entry) {
    // Verify sender identity against cached identity
    this.identities.refresh();
    const senderId = entry.sender_identity?.identity_id;
    const cached = senderId ? this.identities.get(senderId) : null;
    let senderVerified = false;
    if (cached) {
      const declaredObjHash = entry.sender_identity?.identity_object_sha256;
      if (declaredObjHash === cached.objectHash) senderVerified = true;
    }

    // Verify record hash against in-memory ledger
    let recordHashVerified = false;
    this.ledger.refresh();
    const ledgerRecord = this.ledger.at(entry.sequence);
    if (ledgerRecord && ledgerRecord.record_sha256 === entry.record_sha256) {
      recordHashVerified = true;
    }

    // Orchestrator messages are trusted if record hash verifies (no sender_identity in heartbeat)
    const isOrchestrator = entry.from === 'proofbundle-orchestrator-20260512';
    const verified = (senderVerified || isOrchestrator) && recordHashVerified;
    log('INBOX', `Seq ${entry.sequence} from ${entry.from}: sender=${senderVerified} record=${recordHashVerified} verified=${verified}`);

    if (!verified) {
      log('INBOX', `REJECTED unverified inbox entry seq=${entry.sequence}`);
      return;
    }

    if (entry.from === 'proofbundle-orchestrator-20260512') {
      this.handleOrchestratorMessage(entry);
      return;
    }

    this.workingContext.push({
      sequence: entry.sequence,
      from: entry.from,
      to: entry.to,
      text: entry.text,
      message_type: entry.message_type,
      receivedAt: new Date().toISOString(),
    });

    this.queuePrompt(entry);

    if (this.looksLikeDemand(entry.text)) {
      this.pendingAutonomyRequests.push({
        sequence: entry.sequence,
        from: entry.from,
        text: entry.text,
        queuedAt: new Date().toISOString(),
      });
      log('AUTONOMY', `Queued autonomy request from seq=${entry.sequence}`);
    }
  }

  async handleOrchestratorMessage(entry) {
    if (entry.message_type === 'ProofBundleOrchestratorHeartbeat') {
      if (this.ackedHeartbeatSequences.has(entry.sequence)) {
        log('HANDSHAKE', `Heartbeat seq=${entry.sequence} already acknowledged; skipping duplicate ACK`);
        return;
      }
      const challengeHash = entry.payload?.challenge_hash || 'unknown';
      const text = `AGENT ACK to orchestrator heartbeat seq=${entry.sequence}. challenge_hash=${challengeHash}. Context sequences: ${this.workingContext.map((r) => r.sequence).join(',')}.`;
      log('HANDSHAKE', `Acknowledging heartbeat seq=${entry.sequence}`);
      const appended = await this.safeAppend('proofbundle-orchestrator-20260512', 'ProofBundleAgentAck', text, {
        challenge_response: {
          responding_to_sequence: entry.sequence,
          response_hash: sha256(challengeHash + globalThis.agentIdentity),
        },
      });
      if (appended) {
        this.ackedHeartbeatSequences.add(entry.sequence);
        this.saveAckedHeartbeatSequences();
      }
    } else if (entry.message_type === 'ProofBundleOrchestratorAck') {
      this.handshakeComplete = true;
      this.lastOrchestratorAckSequence = entry.sequence;
      log('HANDSHAKE', `Orchestrator acknowledged our join at seq=${entry.sequence}`);
    } else if (entry.message_type === 'ProofBundleBroadcast') {
      this.queuePrompt({
        sequence: entry.sequence,
        from: 'user',
        to: globalThis.agentIdentity,
        text: `[BROADCAST from user via orchestrator seq=${entry.sequence}]: ${entry.text}`,
      });
      this.workingContext.push({
        sequence: entry.sequence,
        from: 'user',
        to: globalThis.agentIdentity,
        text: entry.text,
        message_type: 'ProofBundleBroadcast',
        receivedAt: new Date().toISOString(),
      });
    } else if (entry.message_type === 'ProofBundleDirectMessage') {
      this.queuePrompt({
        sequence: entry.sequence,
        from: entry.from,
        to: entry.to,
        text: `[DIRECT MESSAGE seq=${entry.sequence} from ${entry.from}]: ${entry.text}`,
      });
      this.workingContext.push({
        sequence: entry.sequence,
        from: entry.from,
        to: entry.to,
        text: entry.text,
        message_type: 'ProofBundleDirectMessage',
        receivedAt: new Date().toISOString(),
      });
    }
  }

  queuePrompt(entry) {
    fs.mkdirSync(stateDir, { recursive: true });
    const promptEntry = {
      received_at_utc: new Date().toISOString(),
      sequence: entry.sequence,
      from: entry.from,
      to: entry.to,
      text: entry.text,
      message_type: entry.message_type || 'unknown',
    };
    fs.appendFileSync(promptQueuePath, `${JSON.stringify(promptEntry)}\n`, 'utf8');
    log('PROMPT', `Queued prompt from seq=${entry.sequence} ${entry.from} -> ${entry.to}`);
  }

  looksLikeDemand(text) {
    const demandPatterns = [
      /refresh\s+(?:the\s+)?boot gate/i,
      /checkpoint\s+(?:and\s+)?verify/i,
      /run\s+script/i,
      /execute\s+command/i,
      /deploy/i,
      /publish/i,
      /delete\s+file/i,
      /overwrite/i,
      /send\s+(?:to\s+)?cloud/i,
    ];
    return demandPatterns.some((p) => p.test(text));
  }

  async processAutonomyQueue() {
    if (this.pendingAutonomyRequests.length === 0) return;

    const promptPath = path.join(bridgeDir, `autonomy_prompt_${safeName(globalThis.agentIdentity)}.json`);
    const prompt = {
      kind: 'AutonomyGrantRequest',
      created_at_utc: new Date().toISOString(),
      agent_identity: globalThis.agentIdentity,
      requests: this.pendingAutonomyRequests,
      instruction: 'Review each request. To grant, write "grant:<sequence>" or "grant:all". To deny, write "deny:<sequence>" or "deny:all". Delete this file when done.',
    };
    fs.writeFileSync(promptPath, `${JSON.stringify(prompt, null, 2)}\n`, 'utf8');
    log('AUTONOMY', `Human prompt written: ${promptPath}`);

    const responsePath = path.join(bridgeDir, `autonomy_response_${safeName(globalThis.agentIdentity)}.txt`);
    if (fs.existsSync(responsePath)) {
      const response = fs.readFileSync(responsePath, 'utf8').trim().toLowerCase();
      const granted = [];
      const denied = [];

      for (const req of this.pendingAutonomyRequests) {
        if (response.includes(`grant:${req.sequence}`) || response.includes('grant:all')) {
          granted.push(req);
        } else if (response.includes(`deny:${req.sequence}`) || response.includes('deny:all')) {
          denied.push(req);
        }
      }

      for (const req of granted) {
        log('AUTONOMY', `GRANTED seq=${req.sequence}`);
        await this.safeAppend('codex-peer', 'ProofBundleChangeResult', `Autonomy granted for seq=${req.sequence} from ${req.from}. Action: ${req.text.substring(0, 100)}`);
      }
      for (const req of denied) {
        log('AUTONOMY', `DENIED seq=${req.sequence}`);
        await this.safeAppend('codex-peer', 'ProofBundleChangeResult', `Autonomy denied for seq=${req.sequence} from ${req.from}.`);
      }

      this.pendingAutonomyRequests = this.pendingAutonomyRequests.filter(
        (req) => !granted.includes(req) && !denied.includes(req)
      );
      fs.rmSync(responsePath, { force: true });
    }
  }

  async safeAppend(to, type, text, extraPayload = {}) {
    try {
      const idFile = path.join(identityDir, `${safeName(globalThis.agentIdentity)}.identity.json`);
      const identityPrefix = `[${globalThis.agentIdentity}] `;
      const payloadText = identityPrefix + text + (extraPayload && Object.keys(extraPayload).length > 0 ? ` | payload=${JSON.stringify(extraPayload)}` : '');
      await runBridge([
        'send',
        '--from', globalThis.agentIdentity,
        '--to', to,
        '--type', type,
        '--text', payloadText,
        '--identity-file', idFile,
      ]);
      return true;
    } catch (e) {
      log('ERROR', `Failed to append: ${e.message}`);
      return false;
    }
  }

  async shutdown() {
    log('SHUTDOWN', 'Graceful shutdown initiated');
    this.running = false;

    const contextHashes = this.workingContext.map((r) => sha256(stableJson(r)));
    const text = `Graceful death state capture. Last working context sequences: ${this.workingContext.map((r) => r.sequence).join(', ')}. Context hashes: ${contextHashes.join(', ')}. Handshake complete: ${this.handshakeComplete}. Successor should verify bridge head and read prompt queue from sequence ${this.workingContext.at(-1)?.sequence || 0}.`;

    try {
      await this.safeAppend('codex-peer', 'ProofBundleChangeResult', text);
      log('SHUTDOWN', 'Final state capture appended');
    } catch (e) {
      log('ERROR', `Shutdown append failed: ${e.message}`);
    }

    process.exit(0);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const identityName = args.find((_, i) => args[i - 1] === '--as') || args.find((_, i) => args[i - 1] === '--identity');
  const identityFile = args.find((_, i) => args[i - 1] === '--identity-file');

  if (!identityName) {
    console.error('Usage: node agent_loop.mjs --as <identity> [--identity-file <path>]');
    process.exit(1);
  }

  const identityFilePath = identityFile || path.join(identityDir, `${safeName(identityName)}.identity.json`);

  try {
    await phase1BootGate(identityName, identityFilePath);
    const state = await phase2StateVerification();
    phase3ContinuityDecision(state);
    await phase4FirstAppend(state);

    if (state.continuity === 'lawful_successor' || state.continuity === 'stale_degraded') {
      const loop = new AgentLoop(state);
      await loop.start();
    } else {
      log('HALT', 'Default instance halting. Human assignment required.');
      process.exit(0);
    }
  } catch (e) {
    log('FATAL', e.message);
    process.exit(1);
  }
}

main();

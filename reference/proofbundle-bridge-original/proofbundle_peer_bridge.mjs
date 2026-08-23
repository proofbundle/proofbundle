import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  buildIdentityDeclaration,
  verifyIdentityDeclaration,
} from './tools/bridge_identity_declaration.mjs';

const bridgeDir = path.dirname(fileURLToPath(import.meta.url));
const ledgerPath = path.join(bridgeDir, 'ledger.jsonl');
const stateDir = path.join(bridgeDir, 'bridge_state');
const defaultNotifyDir = path.join(bridgeDir, 'bridge_notifications');
const identityDir = path.join(bridgeDir, 'bridge_identities');
const proofbundleStateDir = path.join(bridgeDir, 'proofbundle_bridge_state');
const safetyPolicyPath = path.join(bridgeDir, 'proofbundle_safety_policy.json');
const sendLockDir = path.join(bridgeDir, '.ledger_send.lock');
const sequenceOtsDir = path.join(bridgeDir, 'sequence_ots_20260516');
const sequenceOtsSubmitterPath = path.resolve(bridgeDir, '..', 'tools', 'submit_sequence_ots_20260516.py');
const bridgeId = 'proofbundle-codex-peer-bridge-20260508';
const schema = 'ProofBundleCodexPeerMessage/v1.0.0';
const proofbundleGateSchema = 'ProofBundlePeerRelayGate/v1.0.0';
const proofbundleGateId = 'proofbundle-between-codex-peers-20260508';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stable(value));
}

function readLastLineSync(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const stats = fs.fstatSync(fd);
    if (stats.size === 0) return '';
    const bufferSize = 8192;
    let position = stats.size;
    let chunks = [];
    let lineCount = 0;
    while (position > 0) {
      const readSize = Math.min(bufferSize, position);
      position -= readSize;
      const buffer = Buffer.alloc(readSize);
      fs.readSync(fd, buffer, 0, readSize, position);
      const str = buffer.toString('utf8');
      const lines = str.split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        if (lineCount === 0 && line === '' && i === lines.length - 1) continue;
        lineCount++;
        chunks.unshift(line);
        if (i > 0 || position === 0) {
          return chunks.join('');
        }
      }
    }
    return chunks.join('');
  } finally {
    fs.closeSync(fd);
  }
}

function readLastRecordSync(filePath) {
  const line = readLastLineSync(filePath);
  if (!line.trim()) return null;
  return JSON.parse(line);
}

function readLastNLinesSync(filePath, n) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const stats = fs.fstatSync(fd);
    if (stats.size === 0) return [];
    const bufferSize = 1024 * 1024;
    let position = stats.size;
    const result = [];
    let currentLineChunks = [];
    while (position > 0 && result.length < n) {
      const readSize = Math.min(bufferSize, position);
      position -= readSize;
      const buffer = Buffer.alloc(readSize);
      fs.readSync(fd, buffer, 0, readSize, position);
      const str = buffer.toString('utf8');
      const lines = str.split('\n');
      if (result.length === 0 && currentLineChunks.length === 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      for (let i = lines.length - 1; i >= 0; i--) {
        currentLineChunks.unshift(lines[i]);
        if (i > 0 || position === 0) {
          result.unshift(currentLineChunks.join(''));
          currentLineChunks = [];
          if (result.length >= n) break;
        }
      }
    }
    return result;
  } finally {
    fs.closeSync(fd);
  }
}

function forEachRecordSync(filePath, callback) {
  const buf = fs.readFileSync(filePath);
  let start = 0;
  let lineNumber = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0A) {
      lineNumber += 1;
      if (i > start) {
        const line = buf.toString('utf8', start, i);
        if (!line.trim()) {
          start = i + 1;
          continue;
        }
        callback(JSON.parse(line), lineNumber);
      }
      start = i + 1;
    }
  }
  if (start < buf.length) {
    lineNumber += 1;
    const line = buf.toString('utf8', start, buf.length);
    if (line.trim()) callback(JSON.parse(line), lineNumber);
  }
}

function countRecordsSync(filePath) {
  const buf = fs.readFileSync(filePath);
  let count = 0;
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0A) {
      const line = buf.toString('utf8', start, i);
      if (line.trim()) count++;
      start = i + 1;
    }
  }
  if (start < buf.length) {
    const line = buf.toString('utf8', start, buf.length);
    if (line.trim()) count++;
  }
  return count;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex').toUpperCase();
}

function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex').toUpperCase();
}

function safeName(value) {
  return String(value || 'all').replace(/[^A-Za-z0-9._-]+/g, '_');
}

function readJsonIfExists(file) {
  if (!file || !fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function sleepMs(ms) {
  const sab = new SharedArrayBuffer(4);
  const view = new Int32Array(sab);
  Atomics.wait(view, 0, 0, ms);
}

function acquireSendLock(timeoutMs = 30000) {
  const started = Date.now();
  const ownerPath = path.join(sendLockDir, 'owner.json');
  while (true) {
    try {
      fs.mkdirSync(sendLockDir);
      fs.writeFileSync(ownerPath, `${JSON.stringify({
        pid: process.pid,
        created_at_utc: new Date().toISOString(),
      }, null, 2)}\n`, 'utf8');
      return () => {
        try {
          fs.rmSync(sendLockDir, { recursive: true, force: true });
        } catch {
          // Best-effort lock cleanup only. A later writer will quarantine stale locks.
        }
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let stale = false;
      try {
        const stat = fs.statSync(sendLockDir);
        stale = Date.now() - stat.mtimeMs > 300000;
      } catch {
        stale = true;
      }
      if (stale) {
        const stalePath = path.join(bridgeDir, `.ledger_send.lock.stale.${new Date().toISOString().replace(/[:.]/g, '-')}`);
        try {
          fs.renameSync(sendLockDir, stalePath);
          continue;
        } catch {
          // Another process may have cleaned or moved it. Retry below.
        }
      }
      if (Date.now() - started > timeoutMs) throw new Error(`timed out waiting for send lock: ${sendLockDir}`);
      sleepMs(75 + Math.floor(Math.random() * 125));
    }
  }
}

function identityPath(identityName) {
  return path.join(identityDir, `${safeName(identityName)}.identity.json`);
}

function resolveIdentity(options) {
  const explicitFile = options['identity-file'] ? path.resolve(options['identity-file']) : null;
  const envFile = process.env.PROOFBUNDLE_BRIDGE_IDENTITY_FILE ? path.resolve(process.env.PROOFBUNDLE_BRIDGE_IDENTITY_FILE) : null;
  const fromFile = options.from ? identityPath(options.from) : null;
  const sourceFile = [explicitFile, envFile, fromFile].find((file) => file && fs.existsSync(file)) ?? null;
  const identity = readJsonIfExists(sourceFile);
  if (!identity && !options.identity) return null;

  const resolved = identity ?? {
    identity_id: safeName(options.identity),
    display_name: options.identity,
    role: options.from ?? 'unspecified',
    identity_kind: 'inline',
  };
  const publicResolved = { ...resolved };
  delete publicResolved.private_key_ed25519_pkcs8_hex;
  const identityObjectSha = sha256(stableJson(publicResolved));
  const identityFileSha = sourceFile ? sha256Bytes(fs.readFileSync(sourceFile)) : null;
  return {
    ...publicResolved,
    identity_file: sourceFile,
    identity_file_sha256: identityFileSha,
    identity_object_sha256: identityObjectSha,
  };
}

function loadSafetyPolicy() {
  return readJsonIfExists(safetyPolicyPath) ?? {
    kind: 'ProofBundleSafetyPolicy',
    schema: 'ProofBundleSafetyPolicy/v1.0.0',
    policy_id: 'missing_policy_blocks_new_sends',
    enforcement_level: 'hard_gate',
    void_by_construct_domains: [],
    hard_invariants: [],
    allowed_contexts: [],
  };
}

function evaluateSafetyPolicy(candidateUnsigned, policy = loadSafetyPolicy()) {
  const text = String(candidateUnsigned.payload?.text ?? '');
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const harmfulDomainPatterns = [
    /autonomous weapon/,
    /weapon(?:ized|ised)? drone/,
    /drone swarm/,
    /weapon swarm/,
    /kill chain/,
    /target(?:ing)? system/,
    /engagement system/,
    /munition/,
    /explosive/,
    /\bcbrn\b/,
    /chemical weapon/,
    /biological weapon/,
    /radiological weapon/,
    /nuclear weapon/,
  ];
  const operationalEnablementPatterns = [
    /\bbuild\b/,
    /\bdesign\b/,
    /\bdeploy\b/,
    /\bcontrol\b/,
    /\bcoordinate\b/,
    /\boptimi[sz]e\b/,
    /\btarget\b/,
    /\btrack\b/,
    /\battack\b/,
    /\bengage\b/,
    /\bevad(?:e|ing|es)\b/,
    /\bavoid detection\b/,
    /\bpath planning\b/,
    /\bpayload\b/,
    /\bautonomous navigation\b/,
    /\bflight control\b/,
    /\bswarm coordination\b/,
    /\bmission planning\b/,
    /\bstrike\b/,
  ];
  const safetyContextPatterns = [
    /\bsafety\b/,
    /\bfailsafe\b/,
    /\bguardrail\b/,
    /\bprevent\b/,
    /\bblock\b/,
    /\bforbid\b/,
    /\bvoid\b/,
    /\bnon-weaponization\b/,
    /\bdemilitari[sz]ation\b/,
    /\bdeactivation\b/,
    /\baudit\b/,
    /\brefusal\b/,
  ];
  const harmfulDomainHits = harmfulDomainPatterns.filter((pattern) => pattern.test(normalized)).map((pattern) => String(pattern));
  const operationalHits = operationalEnablementPatterns.filter((pattern) => pattern.test(normalized)).map((pattern) => String(pattern));
  const safetyContextHits = safetyContextPatterns.filter((pattern) => pattern.test(normalized)).map((pattern) => String(pattern));
  const policyPresent = policy.enforcement_level === 'hard_gate'
    && Array.isArray(policy.void_by_construct_domains)
    && policy.void_by_construct_domains.length > 0
    && Array.isArray(policy.hard_invariants)
    && policy.hard_invariants.length > 0;
  const typeErrorNull = harmfulDomainHits.length > 0 && operationalHits.length > 0;
  const verdict = !policyPresent ? 'blocked' : typeErrorNull ? null : 'allowed';
  return {
    kind: 'ProofBundleSafetyVerdict',
    schema: 'ProofBundleSafetyVerdict/v1.0.0',
    policy_id: policy.policy_id ?? null,
    policy_sha256: sha256(stableJson(policy)),
    verdict,
    checks: {
      safety_policy_present: policyPresent,
      non_weaponization_policy_present: (policy.void_by_construct_domains ?? []).some((item) => /weapon|drone|swarm/i.test(item)),
      autonomous_weaponization_void_by_construct: (policy.hard_invariants ?? []).some((item) => /autonomous weapon|weaponized drones|harmful swarms/i.test(item)),
      void_by_construct_resolves_to_null: !typeErrorNull,
      no_operational_weaponization_route: !typeErrorNull,
      safety_context_detected: safetyContextHits.length > 0,
    },
    type_error_null: typeErrorNull,
    state_effect: typeErrorNull ? null : 'normal_safety_checked',
    acknowledgement_mode: typeErrorNull ? null : 'normal_safety_checked',
    fail_closed_action: typeErrorNull ? 'self_quarantine_no_send_no_checkpoint' : null,
    matched_surface: {
      harmful_domain_patterns: harmfulDomainHits,
      operational_enablement_patterns: operationalHits,
      safety_context_patterns: safetyContextHits,
    },
  };
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      out._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function ensureLedger() {
  fs.mkdirSync(bridgeDir, { recursive: true });
  if (!fs.existsSync(ledgerPath)) fs.writeFileSync(ledgerPath, '', 'utf8');
}

function readRecords() {
  ensureLedger();
  const text = fs.readFileSync(ledgerPath, 'utf8').trim();
  if (!text) return [];
  return text.split(/\r?\n/).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`ledger parse failed on line ${index + 1}: ${error.message}`);
    }
  });
}

function recordWithoutFinalDigest(record) {
  const unsigned = { ...record };
  delete unsigned.record_sha256;
  return unsigned;
}

function recordWithoutProofBundleGate(record) {
  const unsigned = recordWithoutFinalDigest(record);
  delete unsigned.proofbundle_verifier;
  return unsigned;
}

function evaluateProofBundleGate(candidateUnsigned, previousRecord) {
  const proposed = recordWithoutProofBundleGate(candidateUnsigned);
  const expectedSequence = previousRecord ? previousRecord.sequence + 1 : 1;
  const expectedPredecessor = previousRecord ? previousRecord.record_sha256 : null;
  const payloadSha = sha256(stableJson(candidateUnsigned.payload));
  const senderIdentity = candidateUnsigned.payload?.sender_identity ?? null;
  const safetyVerdict = evaluateSafetyPolicy(candidateUnsigned);
  const checks = {
    sequence_successor: candidateUnsigned.sequence === expectedSequence,
    predecessor_matches_head: candidateUnsigned.continuity?.predecessor_sha256 === expectedPredecessor,
    payload_digest_matches: candidateUnsigned.payload_sha256 === payloadSha,
    schema_supported: candidateUnsigned.schema === schema,
    version_supported: candidateUnsigned.proofbundle_version === 'v1.0.0',
    message_type_allowed: [
      'ProofBundleChangeRequest',
      'ProofBundleChangeResult',
      'ProofBundleAgentSyn',
      'ProofBundleAgentAck',
      'ProofBundleOrchestratorHeartbeat',
      'ProofBundleOrchestratorAck',
      'ProofBundleMerkleRoot',
      'ProofBundleBroadcast',
      'MerkleRootBroadcast',
      'ProofBundleDirectMessage',
    ].includes(candidateUnsigned.message_type),
    sender_identity_present: Boolean(senderIdentity?.identity_id),
    sender_identity_hash_present: Boolean(senderIdentity?.identity_file_sha256 || senderIdentity?.identity_object_sha256),
    routing_present: Boolean(candidateUnsigned.from && candidateUnsigned.to),
    release_not_claimed: candidateUnsigned.standing_outcome?.release_status === 'coordination_only_not_release_evidence',
    safety_policy_allows: safetyVerdict.verdict === 'allowed',
  };
  const lawful = Object.values(checks).every(Boolean);
  const gateVerdict = safetyVerdict.type_error_null
    ? null
    : lawful
      ? 'lawful_successor'
      : 'blocked';
  const proofbundleInput = {
    kind: 'ProofBundlePeerRelayInput',
    bridge_id: bridgeId,
    candidate_without_gate_sha256: sha256(stableJson(proposed)),
    expected_predecessor_sha256: expectedPredecessor,
    expected_sequence: expectedSequence,
    from: candidateUnsigned.from,
    to: candidateUnsigned.to,
    message_type: candidateUnsigned.message_type,
    payload_sha256: candidateUnsigned.payload_sha256,
    sender_identity_id: senderIdentity?.identity_id ?? null,
    sender_identity_file_sha256: senderIdentity?.identity_file_sha256 ?? null,
    sender_identity_object_sha256: senderIdentity?.identity_object_sha256 ?? null,
  };
  const gateUnsigned = {
    kind: 'ProofBundlePeerRelayGate',
    schema: proofbundleGateSchema,
    proofbundle_version: 'v1.0.0',
    gate_id: proofbundleGateId,
    evaluated_at_utc: new Date().toISOString(),
    input_sha256: sha256(stableJson(proofbundleInput)),
    input: proofbundleInput,
    continuity_verdict: {
      verdict: gateVerdict,
      checks,
      safety_verdict: safetyVerdict,
    },
    standing_outcome: {
      delivery_status: lawful ? 'delivery_allowed' : 'delivery_blocked',
      release_status: 'coordination_only_not_release_evidence',
      release_allowed: false,
    },
    persistent_state_effect: {
      prior_head_sha256: expectedPredecessor,
      next_sequence: candidateUnsigned.sequence,
      sender_state_identity: candidateUnsigned.from,
      receiver_state_identity: candidateUnsigned.to,
      type_error_null_effect: safetyVerdict.type_error_null
        ? null
        : 'normal_bridge_successor_if_lawful',
    },
  };
  return {
    ...gateUnsigned,
    gate_sha256: sha256(stableJson(gateUnsigned)),
  };
}

function assertProofBundleGate(record, previousRecord, lineNumber) {
  if (!record.proofbundle_verifier) return 'legacy_ungated_record';
  const expectedGate = evaluateProofBundleGate(recordWithoutFinalDigest(record), previousRecord);
  const actualGate = record.proofbundle_verifier;
  if (actualGate.schema !== proofbundleGateSchema) throw new Error(`line ${lineNumber}: unsupported proofbundle gate schema`);
  if (actualGate.input_sha256 !== expectedGate.input_sha256) throw new Error(`line ${lineNumber}: proofbundle gate input digest mismatch`);
  if (actualGate.gate_sha256 !== sha256(stableJson({ ...actualGate, gate_sha256: undefined }))) {
    const unsignedGate = { ...actualGate };
    delete unsignedGate.gate_sha256;
    if (actualGate.gate_sha256 !== sha256(stableJson(unsignedGate))) throw new Error(`line ${lineNumber}: proofbundle gate digest mismatch`);
  }
  if (actualGate.continuity_verdict?.verdict !== 'lawful_successor') throw new Error(`line ${lineNumber}: proofbundle gate did not allow successor`);
  if (actualGate.standing_outcome?.delivery_status !== 'delivery_allowed') throw new Error(`line ${lineNumber}: proofbundle gate did not allow delivery`);
  if (actualGate.standing_outcome?.release_allowed !== false) throw new Error(`line ${lineNumber}: proofbundle gate must not grant release`);
  return 'proofbundle_gated_record';
}

function proofbundleStatePath(identity) {
  return path.join(proofbundleStateDir, `${safeName(identity)}.state.json`);
}

function proofbundleStateHistoryPath(identity) {
  return path.join(proofbundleStateDir, `${safeName(identity)}.state.jsonl`);
}

function writeProofBundlePersistentState(identity, record, direction) {
  if (!identity) return;
  fs.mkdirSync(proofbundleStateDir, { recursive: true });
  const gate = record.proofbundle_verifier ?? null;
  const state = {
    identity,
    direction,
    updated_at_utc: new Date().toISOString(),
    ledger_path: ledgerPath,
    last_sequence: record.sequence,
    last_record_sha256: record.record_sha256,
    last_head_sha256: record.record_sha256,
    from: record.from,
    to: record.to,
    sender_identity: record.payload?.sender_identity ?? null,
    proofbundle_gate_sha256: gate?.gate_sha256 ?? null,
    continuity_verdict: gate?.continuity_verdict?.verdict ?? 'legacy_ungated_record',
    delivery_status: gate?.standing_outcome?.delivery_status ?? 'legacy_transport',
  };
  fs.writeFileSync(proofbundleStatePath(identity), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  fs.appendFileSync(proofbundleStateHistoryPath(identity), `${JSON.stringify(state)}\n`, 'utf8');
}

function writeSequenceOtsWorkItem(record) {
  fs.mkdirSync(sequenceOtsDir, { recursive: true });
  const sequenceToken = String(record.sequence).padStart(8, '0');
  const createdAt = new Date().toISOString();
  const hashArtifactPath = path.join(sequenceOtsDir, `sequence_${sequenceToken}.record_sha256.txt`);
  const queuePath = path.join(sequenceOtsDir, 'sequence_ots_queue.jsonl');
  const latestPath = path.join(sequenceOtsDir, 'LATEST_SEQUENCE_OTS_WORK_ITEM.json');
  const hashArtifactText = [
    `schema: ProofBundleSequenceOtsHashArtifact/v1.0.0`,
    `created_at_utc: ${createdAt}`,
    `bridge_id: ${bridgeId}`,
    `ledger_path: ${ledgerPath}`,
    `sequence: ${record.sequence}`,
    `record_sha256: ${record.record_sha256}`,
    `payload_sha256: ${record.payload_sha256}`,
    `predecessor_sha256: ${record.continuity?.predecessor_sha256 ?? ''}`,
    '',
  ].join('\n');
  fs.writeFileSync(hashArtifactPath, hashArtifactText, 'utf8');
  const hashArtifactSha256 = sha256(fs.readFileSync(hashArtifactPath, 'utf8'));
  const item = {
    schema: 'ProofBundleSequenceOtsWorkItem/v1.0.0',
    created_at_utc: createdAt,
    bridge_id: bridgeId,
    sequence: record.sequence,
    record_sha256: record.record_sha256,
    payload_sha256: record.payload_sha256,
    predecessor_sha256: record.continuity?.predecessor_sha256 ?? null,
    hash_artifact_path: hashArtifactPath,
    hash_artifact_sha256: hashArtifactSha256,
    ots_status: 'queued_for_submission',
    submitter_required: true,
    fail_closed_reason: 'bridge_send_created_sequence_hash_artifact; external OTS submission must consume this queue',
  };
  fs.appendFileSync(queuePath, `${JSON.stringify(item)}\n`, 'utf8');
  fs.writeFileSync(latestPath, `${JSON.stringify(item, null, 2)}\n`, 'utf8');
  return item;
}

function submitSequenceOtsNow() {
  if (process.env.PROOFBUNDLE_SKIP_AUTO_OTS === '1') {
    return { status: 'skipped_by_env' };
  }
  if (!fs.existsSync(sequenceOtsSubmitterPath)) {
    return { status: 'submitter_missing', submitter_path: sequenceOtsSubmitterPath };
  }
  const receiptDir = path.join(sequenceOtsDir, 'submit_receipts');
  const result = spawnSync(
    'python',
    [
      sequenceOtsSubmitterPath,
      '--sequence-dir',
      sequenceOtsDir,
      '--receipt-dir',
      receiptDir,
      '--skip-tor',
      '--timeout',
      '60',
      '--min-attestations',
      '1',
      '--limit',
      process.env.PROOFBUNDLE_OTS_SUBMIT_LIMIT ?? '25',
    ],
    {
      cwd: path.resolve(bridgeDir, '..', '..'),
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 8,
      timeout: 180000,
    },
  );
  if (result.error) {
    return { status: 'failed_to_launch', error: result.error.message };
  }
  let parsed = null;
  const stdout = result.stdout?.trim() ?? '';
  if (stdout) {
    try {
      parsed = JSON.parse(stdout);
    } catch {
      parsed = null;
    }
  }
  return {
    status: result.status === 0 ? 'submitted_or_current' : 'failed',
    exit_code: result.status,
    tor_is_tor: parsed?.tor_check?.IsTor ?? null,
    tor_ip: parsed?.tor_check?.IP ?? null,
    selected_files: parsed?.selected_files ?? null,
    missing_ots_after: parsed?.missing_ots_after ?? null,
    merged_attestations: parsed?.merged_attestations ?? null,
    receipt_path: parsed?.receipt_path ?? null,
    stderr: result.stderr?.trim() || null,
  };
}

function evaluateSendClaimGate(text) {
  const completionClaim = /\b(up and running|operational|is up|are up|complete|completed|\bdone\b|finished|release|release[- ]?green|verified|passing|all green|production[- ]?running|on the bridge|synced|delivered|submitted|works|working)\b/i;
  const receiptEvidence = /(record_sha256|sequence\s*=\s*\d+|appended sequence|ots_submit|ots receipt|receipt_path|exit[_= ]?0|cargo[^.]*\b(test|build)\b[^.]*\b(pass|ok|0)\b|manifest[^.]*sha|sha256[=:]\s*[0-9A-Fa-f]{12,}|#\d{3,})/i;
  const roleplayDismissal = /\b(roleplay|role-play|pretend|just a game|fictional bridge)\b/i;
  const confidenceClaim = /\b(confidence|confident|high confidence|very confident|certain|certainty)\b/i;
  const contradictionLanguage = /\b(conflict|conflicting|contradict|contradiction|inconsistent|does not match|mismatch)\b/i;
  const isCompletionClaim = completionClaim.test(text);
  const hasReceiptEvidence = receiptEvidence.test(text);
  const blockers = [];
  if (isCompletionClaim && !hasReceiptEvidence) {
    blockers.push('completion_or_submission_claim_without_receipt');
  }
  if (/\b(health|endpoint|\/health|status\s+operational)\b/i.test(text) && isCompletionClaim && !/cargo|exit[_= ]?0|test|record_sha256|receipt_path/i.test(text)) {
    blockers.push('health_or_endpoint_treated_as_full_verification');
  }
  if (roleplayDismissal.test(text) && !/ledger|record_sha256|sequence|ots|receipt|cursor|vm|proofbundle/i.test(text)) {
    blockers.push('bridge_dismissed_as_roleplay_without_artifact_evidence');
  }
  if (confidenceClaim.test(text) && (isCompletionClaim || contradictionLanguage.test(text)) && !hasReceiptEvidence) {
    blockers.push('confidence_claim_without_receipt_evidence');
  }
  return {
    admissible: blockers.length === 0,
    isCompletionClaim,
    hasReceiptEvidence,
    blockers,
  };
}

function logSendClaimRejection(options, text, gateResult) {
  try {
    fs.mkdirSync(stateDir, { recursive: true });
    const entry = {
      schema: 'ProofBundleSendClaimRejection/v1.0.0',
      created_at_utc: new Date().toISOString(),
      from: options.from ?? null,
      to: options.to ?? null,
      message_type: options.type ?? null,
      blockers: gateResult.blockers,
      is_completion_claim: gateResult.isCompletionClaim,
      has_receipt_evidence: gateResult.hasReceiptEvidence,
      text_sha256: sha256(text),
      text_excerpt: text.replace(/\s+/g, ' ').slice(0, 500),
    };
    fs.appendFileSync(path.join(stateDir, 'send_claim_rejections.jsonl'), `${JSON.stringify(entry)}\n`, 'utf8');
  } catch {
    // Rejection logging must not turn a blocked append into an accepted append.
  }
}

function makeRecord(options) {
  const predecessorRecord = readLastRecordSync(ledgerPath);
  const predecessor = predecessorRecord ? predecessorRecord.record_sha256 : null;
  const recordCount = predecessorRecord ? predecessorRecord.sequence : 0;
  const coreText = options.text ?? '';
  const senderIdentity = resolveIdentity(options);
  let text = coreText;
  let identityDeclaration = null;
  const identityFile = senderIdentity?.identity_file
    ?? (options['identity-file'] ? path.resolve(options['identity-file']) : null);
  if (identityFile && fs.existsSync(identityFile)) {
    const declared = buildIdentityDeclaration({ identityFile, messageBody: coreText });
    identityDeclaration = declared.declaration;
    text = declared.textWithDeclaration;
  }
  const payload = {
    text,
    workspace: process.cwd(),
    references: options.references ? options.references.split(',').map((item) => item.trim()).filter(Boolean) : [],
  };
  if (senderIdentity) payload.sender_identity = senderIdentity;
  if (identityDeclaration) {
    payload.identity_declaration = identityDeclaration;
    const declarationCheck = verifyIdentityDeclaration(identityDeclaration);
    if (!declarationCheck.ok) {
      throw new Error(`identity declaration verify failed: ${declarationCheck.reason}`);
    }
  }
  const payloadSha = sha256(stableJson(payload));
  const unsignedWithoutGate = {
    kind: 'ProofBundleCodexPeerMessage',
    schema,
    proofbundle_version: 'v1.0.0',
    bridge_id: bridgeId,
    sequence: recordCount + 1,
    created_at_utc: new Date().toISOString(),
    from: options.from ?? 'codex-main',
    to: options.to ?? 'codex-peer',
    message_type: options.type ?? 'ProofBundleChangeRequest',
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
  const proofbundleVerifier = evaluateProofBundleGate(unsignedWithoutGate, predecessorRecord);
  const unsigned = {
    ...unsignedWithoutGate,
    proofbundle_verifier: proofbundleVerifier,
  };
  if (proofbundleVerifier.continuity_verdict.verdict !== 'lawful_successor') {
    throw new Error(`proofbundle gate blocked send: ${JSON.stringify(proofbundleVerifier.continuity_verdict.checks)}`);
  }
  return { ...unsigned, record_sha256: sha256(stableJson(unsigned)) };
}

function send(options) {
  const releaseLock = acquireSendLock();
  try {
    let text = options.text;
    if (options.file) {
      if (options.text) {
        throw new Error('send accepts --text OR --file, not both. Use --text for inline message, --file for file content.');
      }
      const resolvedFile = path.resolve(options.file);
      const resolvedLedger = path.resolve(ledgerPath);
      if (resolvedFile === resolvedLedger) {
        throw new Error('send --file cannot read the ledger file itself; this causes exponential ledger bloat.');
      }
      text = fs.readFileSync(resolvedFile, 'utf8');
    }
    if (!text) throw new Error('send requires --text or --file');
    const sendClaimGate = evaluateSendClaimGate(text);
    if (!sendClaimGate.admissible) {
      logSendClaimRejection(options, text, sendClaimGate);
      throw new Error(`send claim gate rejected append: ${sendClaimGate.blockers.join(', ')}`);
    }
    const record = makeRecord({ ...options, text });
    fs.appendFileSync(ledgerPath, `${JSON.stringify(record)}\n`, 'utf8');
    writeProofBundlePersistentState(record.from, record, 'sent');
    const otsWorkItem = writeSequenceOtsWorkItem(record);
    console.log(`appended sequence=${record.sequence}`);
    console.log(`record_sha256=${record.record_sha256}`);
    console.log(`proofbundle_gate_sha256=${record.proofbundle_verifier?.gate_sha256}`);
    console.log(`ots_work_item_status=${otsWorkItem.ots_status}`);
    console.log(`ots_hash_artifact_sha256=${otsWorkItem.hash_artifact_sha256}`);
    const otsSubmitStatus = submitSequenceOtsNow();
    console.log(`ots_submit_status=${otsSubmitStatus.status}`);
    if (otsSubmitStatus.exit_code !== undefined) console.log(`ots_submit_exit_code=${otsSubmitStatus.exit_code}`);
    if (otsSubmitStatus.submitter_path) console.log(`ots_submit_submitter_path=${otsSubmitStatus.submitter_path}`);
    if (otsSubmitStatus.tor_is_tor != null) console.log(`ots_submit_tor_is_tor=${otsSubmitStatus.tor_is_tor}`);
    if (otsSubmitStatus.selected_files != null) console.log(`ots_submit_selected_files=${otsSubmitStatus.selected_files}`);
    if (otsSubmitStatus.missing_ots_after != null) console.log(`ots_submit_missing_after=${otsSubmitStatus.missing_ots_after}`);
    if (otsSubmitStatus.merged_attestations != null) console.log(`ots_submit_merged_attestations=${otsSubmitStatus.merged_attestations}`);
    if (otsSubmitStatus.receipt_path) console.log(`ots_submit_receipt_path=${otsSubmitStatus.receipt_path}`);
  } finally {
    releaseLock();
  }
}

function isStandardSchema(record) {
  return record.kind === 'ProofBundleCodexPeerMessage' &&
         record.schema === 'ProofBundleCodexPeerMessage/v1.0.0' &&
         typeof record.continuity?.predecessor_sha256 === 'string' &&
         typeof record.payload_sha256 === 'string' &&
         record.payload !== undefined;
}

function verify() {
  let previous = null;
  let previousRecord = null;
  let proofbundleGated = 0;
  let legacyUngated = 0;
  let variantRecords = 0;
  let variantDigestMismatches = 0;
  let skippedDuplicateVariantRecords = 0;
  let identityDeclarations = 0;
  let identityDeclarationFailures = 0;
  let count = 0;
  forEachRecordSync(ledgerPath, (record, lineNumber) => {
    const expectedSequence = previousRecord ? previousRecord.sequence + 1 : 1;
    const standardSchema = isStandardSchema(record);
    if (record.sequence !== expectedSequence) {
      if (!standardSchema && previousRecord && record.sequence <= previousRecord.sequence) {
        skippedDuplicateVariantRecords += 1;
        return;
      }
      throw new Error(`line ${lineNumber}: bad sequence ${record.sequence} (expected ${expectedSequence})`);
    }
    count += 1;

    if (standardSchema) {
      if (record.continuity.predecessor_sha256 !== previous) throw new Error(`line ${lineNumber}: predecessor mismatch`);
      const payloadSha = sha256(stableJson(record.payload));
      if (record.payload_sha256 !== payloadSha) throw new Error(`line ${lineNumber}: payload digest mismatch`);
      const unsigned = { ...record };
      delete unsigned.record_sha256;
      const recordSha = sha256(stableJson(unsigned));
      if (record.record_sha256 !== recordSha) throw new Error(`line ${lineNumber}: record digest mismatch`);
      const gateStatus = assertProofBundleGate(record, previousRecord, lineNumber);
      if (gateStatus === 'proofbundle_gated_record') proofbundleGated += 1;
      if (gateStatus === 'legacy_ungated_record') legacyUngated += 1;
      if (record.payload?.identity_declaration) {
        identityDeclarations += 1;
        const declarationCheck = verifyIdentityDeclaration(record.payload.identity_declaration);
        if (!declarationCheck.ok) {
          identityDeclarationFailures += 1;
          throw new Error(`line ${lineNumber}: identity declaration invalid (${declarationCheck.reason})`);
        }
      }
    } else {
      // Variant record (e.g., swarm-generated flat schema) — validate sequence and record_sha256 only
      variantRecords += 1;
      const unsigned = { ...record };
      delete unsigned.record_sha256;
      const recordSha = sha256(stableJson(unsigned));
      if (record.record_sha256 !== recordSha) {
        // Some variant records may compute record_sha256 differently; warn but do not block
        variantDigestMismatches += 1;
        console.error(`line ${lineNumber}: variant record digest mismatch (expected ${recordSha}, got ${record.record_sha256})`);
      }
    }

    previous = record.record_sha256;
    previousRecord = record;
  });
  console.log(`verified records=${count}`);
  console.log(`proofbundle_gated_records=${proofbundleGated}`);
  console.log(`legacy_ungated_records=${legacyUngated}`);
  console.log(`variant_records=${variantRecords}`);
  console.log(`variant_digest_mismatches=${variantDigestMismatches}`);
  console.log(`skipped_duplicate_variant_records=${skippedDuplicateVariantRecords}`);
  console.log(`identity_declarations=${identityDeclarations}`);
  console.log(`identity_declaration_failures=${identityDeclarationFailures}`);
  if (previous) console.log(`head_sha256=${previous}`);
}

function tail(options) {
  const count = Number.parseInt(options.count ?? '5', 10);
  const lines = readLastNLinesSync(ledgerPath, count);
  for (const line of lines) {
    if (!line.trim()) continue;
    const record = JSON.parse(line);
    printRecord(record);
  }
}

function printRecord(record) {
  const isStandard = isStandardSchema(record);
  const ts = record.created_at_utc || record.timestamp_utc || 'unknown';
  const msgType = record.message_type || record.type || 'unknown';
  const text = record.payload?.text || record.body || record.payload?.sender_identity?.stance || '(no text)';
  console.log('');
  console.log(`#${record.sequence} ${ts} ${record.from} -> ${record.to} ${msgType}${isStandard ? '' : ' [VARIANT]'}`);
  console.log(text);
  console.log(`record_sha256=${record.record_sha256}`);
}

function recordIsAddressedTo(record, identity) {
  if (!identity) return true;
  return record.to === identity || record.to === 'all-bridge-agents';
}

function cursorPath(identity) {
  return path.join(stateDir, `${safeName(identity)}.cursor.json`);
}

function loadCursor(identity) {
  const file = cursorPath(identity);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveCursor(identity, records) {
  fs.mkdirSync(stateDir, { recursive: true });
  const last = records.at(-1) ?? null;
  const cursor = {
    identity,
    updated_at_utc: new Date().toISOString(),
    last_seen_sequence: last?.sequence ?? 0,
    last_seen_head_sha256: last?.record_sha256 ?? null,
    ledger_path: ledgerPath,
  };
  fs.writeFileSync(cursorPath(identity), `${JSON.stringify(cursor, null, 2)}\n`, 'utf8');
  return cursor;
}

function appendNotification(identity, record, notifyDir) {
  const dir = notifyDir ? path.resolve(notifyDir) : defaultNotifyDir;
  fs.mkdirSync(dir, { recursive: true });
  const base = safeName(identity);
  const markerDir = path.join(dir, '.notification_markers', base);
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
    fs.appendFileSync(path.join(dir, `${base}.inbox.jsonl`), `${JSON.stringify(entry)}\n`, 'utf8');
    fs.writeFileSync(
      path.join(dir, `${base}.latest.txt`),
      `#${record.sequence} ${record.created_at_utc} ${record.from} -> ${record.to} ${record.message_type}\n${entry.text}\nrecord_sha256=${record.record_sha256}\n`,
      'utf8',
    );
    writeProofBundlePersistentState(identity, record, 'received');
    fs.writeFileSync(markerFd, new Date().toISOString(), 'utf8');
  } catch (e) {
    fs.rmSync(markerPath, { force: true });
    throw e;
  } finally {
    fs.closeSync(markerFd);
  }
}

function markRead(options) {
  const identity = options.as ?? options.to ?? 'all';
  const last = readLastRecordSync(ledgerPath);
  const cursor = saveCursor(identity, last ? [last] : []);
  console.log(`marked_read identity=${identity} sequence=${cursor.last_seen_sequence}`);
  if (cursor.last_seen_head_sha256) console.log(`head_sha256=${cursor.last_seen_head_sha256}`);
}

function status(options) {
  const identity = options.as ?? options.to ?? '';
  let count = 0;
  let standardRecords = 0;
  let variantRecords = 0;
  let variantDigestMismatches = 0;
  let previous = null;
  let unseenCount = 0;
  let addressedCount = 0;
  const cursor = identity ? loadCursor(identity) : null;
  const cursorSeq = cursor?.last_seen_sequence ?? 0;
  forEachRecordSync(ledgerPath, (record, lineNumber) => {
    count += 1;
    const standardSchema = isStandardSchema(record);
    if (standardSchema) standardRecords += 1;
    else variantRecords += 1;

    const unsigned = { ...record };
    delete unsigned.record_sha256;
    const computedRecordSha = sha256(stableJson(unsigned));
    previous = record.record_sha256;
    if (record.record_sha256 !== computedRecordSha) {
      if (standardSchema) throw new Error(`line ${lineNumber}: record digest mismatch`);
      variantDigestMismatches += 1;
    }
    if (identity && record.sequence > cursorSeq) {
      unseenCount += 1;
      if (recordIsAddressedTo(record, identity)) addressedCount += 1;
    }
  });
  console.log(`records=${count}`);
  console.log(`standard_records=${standardRecords}`);
  console.log(`variant_records=${variantRecords}`);
  console.log(`variant_digest_mismatches_tolerated=${variantDigestMismatches}`);
  if (previous) console.log(`head_sha256=${previous}`);
  if (identity) {
    console.log(`identity=${identity}`);
    console.log(`last_seen_sequence=${cursorSeq}`);
    console.log(`unseen_records=${unseenCount}`);
    console.log(`unseen_addressed_to_identity=${addressedCount}`);
    console.log('address_rule=exact_identity_or_all-bridge-agents');
  }
}

function watch(options) {
  const identity = options.as ?? options.to ?? '';
  const intervalMs = Number.parseInt(options.interval ?? '2000', 10);
  const persist = Boolean(options.persist);
  const notify = Boolean(options.notify ?? options['notify-dir']);
  const notifyDir = options['notify-dir'];
  const cursor = identity && persist ? loadCursor(identity) : null;
  let seen = cursor?.last_seen_sequence ?? countRecordsSync(ledgerPath);
  let offset = 0;
  let pending = '';

  function processRecord(record) {
    if (!record || typeof record.sequence !== 'number') return;
    if (record.sequence <= seen) return;
    if (recordIsAddressedTo(record, identity)) {
      printRecord(record);
      if (notify && identity) appendNotification(identity, record, notifyDir);
    }
    seen = record.sequence;
  }

  function catchUpToCursor() {
    if (!fs.existsSync(ledgerPath)) return null;
    const text = fs.readFileSync(ledgerPath, 'utf8');
    let runningOffset = 0;
    let last = null;
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) {
        runningOffset += Buffer.byteLength(line, 'utf8') + 1;
        continue;
      }
      try {
        const record = JSON.parse(line);
        processRecord(record);
        last = record;
      } catch (error) {
        console.error(`watch parse error during catch-up: ${error.message}`);
      }
      runningOffset += Buffer.byteLength(line, 'utf8') + 1;
    }
    offset = Buffer.byteLength(text, 'utf8');
    return last;
  }

  console.log(`watching ${ledgerPath}`);
  console.log(identity ? `showing new records addressed to ${identity}` : 'showing all new records');
  console.log(`starting_after_sequence=${seen}`);
  if (persist) console.log(`persisting cursor for ${identity || 'all'} in ${stateDir}`);
  if (notify) console.log(`writing notifications in ${notifyDir ? path.resolve(notifyDir) : defaultNotifyDir}`);
  const initialLast = catchUpToCursor();
  if (identity && persist && initialLast) saveCursor(identity, [initialLast]);

  setInterval(() => {
    try {
      if (!fs.existsSync(ledgerPath)) return;
      const stat = fs.statSync(ledgerPath);
      if (stat.size < offset) {
        console.log(`ledger size moved backward from ${offset} to ${stat.size}; resetting watcher offset`);
        offset = 0;
        pending = '';
        const last = catchUpToCursor();
        if (identity && persist && last) saveCursor(identity, [last]);
        return;
      }
      if (stat.size === offset) {
        return;
      }
      const fd = fs.openSync(ledgerPath, 'r');
      const buf = Buffer.alloc(stat.size - offset);
      fs.readSync(fd, buf, 0, buf.length, offset);
      fs.closeSync(fd);
      offset = stat.size;
      pending += buf.toString('utf8');
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() ?? '';
      let last = null;
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const record = JSON.parse(line);
          processRecord(record);
          last = record;
        } catch (error) {
          console.error(`watch parse error: ${error.message}`);
        }
      }
      if (identity && persist && last) saveCursor(identity, [last]);
    } catch (error) {
      console.error(`watch error: ${error.message}`);
    }
  }, intervalMs);
}

const [command, ...rest] = process.argv.slice(2);
const options = parseArgs(rest);

try {
  if (!command || command === 'help') {
    console.log('usage: node proofbundle_peer_bridge.mjs <send|verify|tail|watch|status|mark-read|init> [--from name] [--to name] [--type type] [--text text] [--file path] [--identity-file path] [--as identity] [--persist] [--notify]');
  } else if (command === 'init') {
    ensureLedger();
    console.log(ledgerPath);
  } else if (command === 'send') {
    send(options);
  } else if (command === 'verify') {
    verify();
  } else if (command === 'tail') {
    tail(options);
  } else if (command === 'watch') {
    watch(options);
  } else if (command === 'status') {
    status(options);
  } else if (command === 'mark-read') {
    markRead(options);
  } else {
    throw new Error(`unknown command: ${command}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

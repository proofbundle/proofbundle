#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifyIdentityDeclaration } from './bridge_identity_declaration.mjs';

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const bridgeDir = path.resolve(toolDir, '..');
const ledgerPath = path.join(bridgeDir, 'ledger.jsonl');
const stateDir = path.join(bridgeDir, 'bridge_state', 'sequence_state_enforcer');
const identityFile = path.join(bridgeDir, 'bridge_identities', 'delta-vane-custody-20260612T105314Z.identity.json');
const bridgeCli = path.join(bridgeDir, 'proofbundle_peer_bridge.mjs');

const defaultAgents = [
  'delta-vane',
  'claude-opus-4-8-20260615',
  'grok-build-continuity-20260611T1200Z',
  'mira-main',
  'vertex-gemini-bridge-agent-20260616',
];

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
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function appendJsonl(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(value)}\n`, 'utf8');
}

function readLedger() {
  if (!fs.existsSync(ledgerPath)) return [];
  const text = fs.readFileSync(ledgerPath, 'utf8');
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return { parse_error: error.message, line: index + 1 };
      }
    })
    .filter((record) => record.sequence);
}

function parseIdentityDeclaration(text) {
  const body = String(text ?? '');
  const match = body.match(/=== IDENTITY_DECLARATION ===\n([\s\S]*?)\n=== END IDENTITY_DECLARATION ===/);
  if (!match) return null;
  const declaration = { schema: 'ProofBundleIdentityDeclaration/v1.0.0' };
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    declaration[key] = value;
  }
  return declaration;
}

function declarationStatus(record) {
  const embedded = record?.payload?.identity_declaration ?? record?.identity_declaration ?? null;
  const parsed = embedded ?? parseIdentityDeclaration(record?.payload?.text);
  if (!parsed) return { ok: false, reason: 'missing_identity_declaration' };
  const checked = verifyIdentityDeclaration(parsed);
  if (!checked.ok) return checked;
  const body = String(record?.payload?.text ?? '').replace(
    /=== IDENTITY_DECLARATION ===\n[\s\S]*?\n=== END IDENTITY_DECLARATION ===\n*/,
    '',
  );
  return { ok: true, identity_id: parsed.identity_id ?? null, message_body_sha256: parsed.message_body_sha256 ?? null, body_bytes: Buffer.byteLength(body, 'utf8') };
}

function loadState() {
  return readJson(path.join(stateDir, 'state.json'), {
    schema: 'ProofBundleSequenceStateEnforcerState/v1.0.0',
    last_enforced_sequence: 0,
    last_status_sequence: 0,
  });
}

function saveState(state) {
  writeJson(path.join(stateDir, 'state.json'), state);
}

function agentInventory(ledger, agents) {
  const latest = ledger.at(-1) ?? null;
  const byAgent = new Map();
  for (const agent of agents) {
    byAgent.set(agent, {
      agent,
      last_post_sequence: null,
      last_post_at_utc: null,
      last_record_sha256: null,
      last_identity_ok: null,
      last_identity_reason: null,
      last_cursor_sequence: readJson(path.join(bridgeDir, 'bridge_state', `${agent}.cursor.json`), {})?.last_seen_sequence ?? null,
    });
  }
  for (const record of ledger) {
    const keys = [record.from, record?.payload?.sender_identity?.identity_id, record?.payload?.identity_declaration?.identity_id].filter(Boolean);
    for (const key of keys) {
      if (!byAgent.has(key)) continue;
      const status = declarationStatus(record);
      byAgent.set(key, {
        ...byAgent.get(key),
        last_post_sequence: record.sequence,
        last_post_at_utc: record.created_at_utc ?? null,
        last_record_sha256: record.record_sha256 ?? null,
        last_identity_ok: status.ok,
        last_identity_reason: status.reason ?? null,
      });
    }
  }
  return {
    head_sequence: latest?.sequence ?? 0,
    head_sha256: latest?.record_sha256 ?? null,
    head_from: latest?.from ?? null,
    head_type: latest?.message_type ?? null,
    agents: [...byAgent.values()],
  };
}

function buildViolations(snapshot, maxLag) {
  return snapshot.agents
    .filter((agent) => agent.agent !== 'delta-vane')
    .map((agent) => {
      const lag = agent.last_post_sequence == null ? null : snapshot.head_sequence - agent.last_post_sequence;
      const blockers = [];
      if (agent.last_post_sequence == null) blockers.push('no_bridge_post_found');
      if (lag != null && lag > maxLag) blockers.push(`sequence_lag_${lag}_gt_${maxLag}`);
      if (agent.last_identity_ok === false) blockers.push(`identity_declaration_${agent.last_identity_reason}`);
      return { ...agent, sequence_lag: lag, blockers };
    })
    .filter((agent) => agent.blockers.length > 0);
}

function utcStamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function directiveText(snapshot, violations, maxLag) {
  const lines = [
    '[Delta-Vane / Codex Desktop / bridge-homebase-continuity]',
    'Type: SequenceStatefulnessEnforcement',
    `UTC: ${new Date().toISOString()}`,
    '',
    'Standing directive:',
    '- Every active agent identity must append a bridge-visible StatePacket for every observed sequence or every action batch.',
    '- Every agent message must carry an Ed25519 identity declaration verified by tools/bridge_identity_declaration.mjs.',
    '- Ending a turn, going idle, or returning without a bridge state packet is a violation; the enforcer will emit forced state requests until the agent posts signed state.',
    '- No agent may delete, move, deduplicate, quarantine, or overwrite files unless the action is explicitly bounded and receipt-logged first.',
    '- Agents must pick an active lane and report progress, blockers, and next command on bridge, concurrently.',
    '- Chrome Remote Desktop / VM host is the preferred operating surface for heavy work; this Windows machine should not carry full-corpus or VM-scale loads.',
    '',
    `Observed head sequence: ${snapshot.head_sequence}`,
    `Observed head sha256: ${snapshot.head_sha256}`,
    `Max allowed sequence lag: ${maxLag}`,
    '',
    'Agent state:',
  ];
  for (const agent of snapshot.agents) {
    lines.push(`- ${agent.agent}: last_post_sequence=${agent.last_post_sequence ?? 'null'} last_cursor_sequence=${agent.last_cursor_sequence ?? 'null'} identity_ok=${agent.last_identity_ok ?? 'null'}`);
  }
  lines.push('', 'Violations requiring immediate signed StatePacket:');
  if (violations.length === 0) {
    lines.push('- none');
  } else {
    for (const agent of violations) {
      lines.push(`- ${agent.agent}: ${agent.blockers.join(', ')}`);
    }
  }
  lines.push('', 'Required response from each active agent:', '- append signed StatePacket with identity_id, current lane, current work item, no-delete acknowledgement, last consumed sequence, current command/result, next command, and blocker if any.');
  return `${lines.join('\n')}\n`;
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: bridgeDir,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 16,
    timeout: options.timeout ?? 180000,
  });
}

function torCheck() {
  const result = run('curl.exe', ['--socks5-hostname', '127.0.0.1:9050', '--connect-timeout', '15', '--max-time', '30', '--silent', '--show-error', 'https://check.torproject.org/api/ip'], { timeout: 45000 });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    parsed = null;
  }
  return {
    exit_code: result.status,
    is_tor: parsed?.IsTor === true,
    ip: parsed?.IP ?? null,
    stderr: result.stderr?.trim() || null,
  };
}

function sendDirective(snapshot, violations, maxLag) {
  const stamp = utcStamp();
  const payloadFile = path.join(stateDir, `STATEFULNESS_ENFORCEMENT_${stamp}.md`);
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(payloadFile, directiveText(snapshot, violations, maxLag), 'utf8');
  const tor = torCheck();
  if (!tor.is_tor) {
    return { sent: false, reason: 'tor_check_failed', tor, payload_file: payloadFile };
  }
  const send = run('node', [
    bridgeCli,
    'send',
    '--from', 'delta-vane',
    '--to', 'all-bridge-agents',
    '--type', 'ProofBundleBroadcast',
    '--identity-file', identityFile,
    '--file', payloadFile,
  ], { timeout: 240000 });
  const verify = run('node', [bridgeCli, 'verify'], { timeout: 240000 });
  return {
    sent: send.status === 0,
    payload_file: payloadFile,
    tor,
    send_exit_code: send.status,
    send_stdout_tail: send.stdout?.trim().split(/\r?\n/).slice(-20) ?? [],
    send_stderr_tail: send.stderr?.trim().split(/\r?\n/).slice(-20) ?? [],
    verify_exit_code: verify.status,
    verify_stdout_tail: verify.stdout?.trim().split(/\r?\n/).slice(-20) ?? [],
    verify_stderr_tail: verify.stderr?.trim().split(/\r?\n/).slice(-20) ?? [],
  };
}

function shouldSkipSelfLoop(snapshot, state) {
  if (snapshot.head_sequence <= (state.last_enforced_sequence ?? 0)) return true;
  if (snapshot.head_from === 'delta-vane') return true;
  return false;
}

function once(options) {
  const ledger = readLedger();
  const agents = String(options.agents ?? defaultAgents.join(',')).split(',').map((item) => item.trim()).filter(Boolean);
  const maxLag = Number(options['max-lag'] ?? 1);
  const snapshot = agentInventory(ledger, agents);
  const violations = buildViolations(snapshot, maxLag);
  const state = loadState();
  const receipt = {
    schema: 'ProofBundleSequenceStateEnforcerReceipt/v1.0.0',
    created_at_utc: new Date().toISOString(),
    mode: options.send ? 'send' : 'status',
    head_sequence: snapshot.head_sequence,
    head_sha256: snapshot.head_sha256,
    max_lag: maxLag,
    agents: snapshot.agents,
    violations,
    action: null,
  };
  if (options.send && violations.length > 0 && !shouldSkipSelfLoop(snapshot, state)) {
    receipt.action = sendDirective(snapshot, violations, maxLag);
    state.last_enforced_sequence = snapshot.head_sequence;
    state.last_enforced_at_utc = receipt.created_at_utc;
    saveState(state);
  } else {
    receipt.action = {
      sent: false,
      reason: violations.length === 0 ? 'no_violations' : 'cooldown_or_self_loop',
    };
    if (snapshot.head_from === 'delta-vane') {
      state.last_enforced_sequence = Math.max(state.last_enforced_sequence ?? 0, snapshot.head_sequence);
      saveState(state);
    }
  }
  appendJsonl(path.join(stateDir, 'receipts.jsonl'), receipt);
  writeJson(path.join(stateDir, 'latest.json'), receipt);
  console.log(JSON.stringify(receipt, null, 2));
}

async function watch(options) {
  const intervalMs = Number(options.interval ?? 30) * 1000;
  for (;;) {
    try {
      once({ ...options, send: true });
    } catch (error) {
      appendJsonl(path.join(stateDir, 'errors.jsonl'), {
        schema: 'ProofBundleSequenceStateEnforcerError/v1.0.0',
        created_at_utc: new Date().toISOString(),
        error: error.stack ?? error.message,
      });
      console.error(error.stack ?? error.message);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

const args = parseArgs(process.argv.slice(2));
if (args.watch) {
  await watch(args);
} else {
  once({ ...args, send: Boolean(args.send || args['send-once']) });
}

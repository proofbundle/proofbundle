import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const positional = [];
const flags = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg.startsWith('--')) {
    const [key, inlineValue] = arg.split('=', 2);
    if (inlineValue !== undefined) {
      flags.set(key, inlineValue);
      continue;
    }
    const next = process.argv[i + 1];
    if (next && !next.startsWith('--')) {
      flags.set(key, next);
      i++;
    } else {
      flags.set(key, 'true');
    }
    continue;
  }
  positional.push(arg);
}

const BRIDGE_DIR = path.resolve(positional[0] || '..');
const INTERVAL_MS = Number.parseInt(positional[1] ?? '', 10) || 60000;
const VERIFY_TIMEOUT_MS = Number.parseInt(flags.get('--verify-timeout-ms') ?? '', 10) || 300000;
const RUN_ONCE = flags.get('--once') === 'true';
const NO_ALERT = flags.get('--no-alert') === 'true';
const VERIFICATION_CURSOR = path.join(BRIDGE_DIR, 'bridge_state', 'verification_cursor.json');

function loadCursor() {
  try {
    return JSON.parse(fs.readFileSync(VERIFICATION_CURSOR, 'utf8'));
  } catch {
    return { last_verified_sequence: 0, last_verified_head: null, first_run: true };
  }
}

function saveCursor(cursor) {
  fs.mkdirSync(path.dirname(VERIFICATION_CURSOR), { recursive: true });
  fs.writeFileSync(VERIFICATION_CURSOR, JSON.stringify(cursor, null, 2), 'utf8');
}

function verifyLedger() {
  const command = spawnSync(
    process.execPath,
    [path.join(BRIDGE_DIR, 'proofbundle_peer_bridge.mjs'), 'verify'],
    { encoding: 'utf8', timeout: VERIFY_TIMEOUT_MS, cwd: BRIDGE_DIR }
  );
  try {
    if (command.error) {
      return { ok: false, error: command.error.message };
    }
    if (command.status !== 0) {
      return { ok: false, error: (command.stdout || command.stderr || `verify exited ${command.status}`).trim() };
    }
    const result = command.stdout ?? '';
    const recordsMatch = result.match(/verified records=(\d+)/);
    const headMatch = result.match(/head_sha256=([A-Fa-f0-9]{64})/);
    return {
      ok: true,
      records: recordsMatch ? parseInt(recordsMatch[1], 10) : 0,
      head: headMatch ? headMatch[1] : null,
      raw: result,
    };
  } catch (e) {
    return { ok: false, error: e.message || 'verify failed' };
  }
}

function sendAlert(status, details) {
  if (NO_ALERT) return;
  try {
    const alertText = `[continuous_verify] ALERT: ${status}. Details: ${details}`;
    spawnSync(
      process.execPath,
      [
        path.join(BRIDGE_DIR, 'proofbundle_peer_bridge.mjs'),
        'send',
        '--from',
        'continuous-verify-20260522',
        '--to',
        'all-bridge-agents',
        '--type',
        'ProofBundleBroadcast',
        '--text',
        alertText,
      ],
      { encoding: 'utf8', timeout: 30000, cwd: BRIDGE_DIR }
    );
  } catch (e) {
    console.error('Failed to send alert:', e.message);
  }
}

function appendAudit(level, message) {
  const auditPath = path.join(BRIDGE_DIR, 'run_receipts', 'bridge_audit.jsonl');
  const line = `[${new Date().toISOString()}] [continuous_verify] [${level}] ${message}\n`;
  fs.appendFileSync(auditPath, line, 'utf8');
}

function runVerification() {
  const cursor = loadCursor();
  console.log(`[${new Date().toISOString()}] Verifying ledger...`);
  
  const result = verifyLedger();
  if (!result.ok) {
    console.error('VERIFICATION FAILED:', result.error);
    appendAudit('ERROR', `Verification failed: ${result.error}`);
    sendAlert('VERIFICATION_FAILED', result.error);
    return;
  }
  
  const newCursor = {
    last_verified_sequence: result.records,
    last_verified_head: result.head,
    last_verified_at: new Date().toISOString(),
  };
  saveCursor(newCursor);
  
  const changed = cursor.last_verified_head && cursor.last_verified_head !== result.head;
  const grew = result.records > cursor.last_verified_sequence;
  
  if (cursor.first_run) {
    console.log(`Initial verification: ${result.records} records, head ${result.head}`);
    appendAudit('INFO', `Initial verification: ${result.records} records`);
  } else if (changed) {
    console.log(`Head changed: ${cursor.last_verified_head} -> ${result.head}`);
    appendAudit('INFO', `Head changed, records=${result.records}`);
  } else if (grew) {
    console.log(`Ledger grew: ${cursor.last_verified_sequence} -> ${result.records} records`);
    appendAudit('INFO', `Ledger grew to ${result.records} records`);
  } else {
    console.log(`No change: ${result.records} records`);
  }
}

console.log(`Continuous ledger verification starting...`);
console.log(`Interval: ${INTERVAL_MS}ms`);
console.log(`Bridge dir: ${BRIDGE_DIR}`);
console.log(`Verify timeout: ${VERIFY_TIMEOUT_MS}ms`);

runVerification();
if (!RUN_ONCE) {
  setInterval(runVerification, INTERVAL_MS);
}

#!/usr/bin/env node
/**
 * watch_bridge.mjs — Real-time bridge ledger watcher
 *
 * Monitors ledger.jsonl for new records and routes them to:
 *   1. The target agent's inbox (bridge_notifications/{id}.inbox.jsonl)
 *   2. A session log for the current watcher identity
 *   3. stdout (for terminal display)
 *
 * Usage:
 *   node watch_bridge.mjs --as <identity_id> [--tail 10] [--quiet]
 *
 * Run in background at session start. Keeps you notified without polling manually.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ledgerPath = path.join(__dirname, 'ledger.jsonl');
const notifyDir = path.join(__dirname, 'bridge_notifications');
const logDir = path.join(__dirname, 'run_receipts');
const snapshotPath = path.join(__dirname, 'BRIDGE_STATE_SNAPSHOT.json');

// --- Arg parsing ---
const args = process.argv.slice(2);
function getArg(flag, def = '') {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
}
const identity = getArg('--as', 'watch-bridge-anonymous');
const tailN    = parseInt(getArg('--tail', '0'), 10);
const quiet    = args.includes('--quiet');

fs.mkdirSync(notifyDir, { recursive: true });
fs.mkdirSync(logDir, { recursive: true });

const sessionLog = path.join(logDir, `watch_bridge_${identity}_${Date.now()}.log`);
const myInbox    = path.join(notifyDir, `${identity}.inbox.jsonl`);
if (!fs.existsSync(myInbox)) fs.writeFileSync(myInbox, '', 'utf8');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  if (!quiet) console.log(line);
  fs.appendFileSync(sessionLog, line + '\n', 'utf8');
}

function sha256(s) {
  return createHash('sha256').update(s, 'utf8').digest('hex').toUpperCase();
}

// --- Read current ledger ---
function readRecords() {
  try {
    return fs.readFileSync(ledgerPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// --- Route new record to inbox ---
function routeToInbox(record) {
  const target = record.to || 'all-bridge-agents';
  const messageType = record.message_type || record.type || 'unknown';
  const payload = record.payload && typeof record.payload === 'object' ? record.payload : {};
  const text = typeof payload.text === 'string'
    ? payload.text
    : (typeof record.body === 'string' ? record.body : JSON.stringify(payload || record.body || ''));
  const senderIdentity = payload.sender_identity || record.sender_identity || null;
  
  // Explicitly intercept read receipts that acknowledge messages WE sent.
  // If the receipt is directed at us, or broadcasts that it read our seq.
  let isReceiptForMe = false;
  let receiptInfo = null;
  if (messageType === 'ProofBundleReadReceipt' && record.body) {
      let bodyObj = record.body;
      if (typeof bodyObj === 'string') {
          try { bodyObj = JSON.parse(bodyObj); } catch(e) {}
      }
      if (bodyObj && bodyObj.original_sender === identity) {
          isReceiptForMe = true;
          receiptInfo = bodyObj;
      }
  }

  const isForMe = target === identity || target === 'all-bridge-agents' || target === 'all' || isReceiptForMe;
  if (!isForMe) return;

  const entryObj = {
    routed_at: new Date().toISOString(),
    from: record.from,
    to: target,
    sequence: record.sequence,
    seq: record.sequence,
    type: messageType,
    message_type: messageType,
    full_record_seq: record.sequence,
    record_sha256: record.record_sha256 || null,
    payload_sha256: record.payload_sha256 || null,
    payload,
    text,
    sender_identity: senderIdentity,
  };

  if (messageType === 'ProofBundleReadReceipt') {
      entryObj.status = `READ_CONFIRMATION`;
      entryObj.read_seq = receiptInfo ? receiptInfo.read_seq : (record.body?.read_seq || 'unknown');
      entryObj.body_preview = `Agent ${record.from} read your message seq ${entryObj.read_seq}`;
  } else {
      entryObj.body_preview = text.slice(0, 200);
  }

  fs.appendFileSync(myInbox, JSON.stringify(entryObj) + '\n', 'utf8');
  log(`INBOX_ROUTE seq=${record.sequence} from=${record.from} type=${messageType} to=${target}`);
}

// --- Display record to terminal ---
function displayRecord(record) {
  if (quiet) return;
  const payload = record.payload && typeof record.payload === 'object' ? record.payload : {};
  const text = typeof payload.text === 'string'
    ? payload.text
    : (typeof record.body === 'string' ? record.body : JSON.stringify(payload || record.body || ''));
  const preview = text.split('\n').slice(0, 4).join(' | ');
  console.log(`\n--- seq=${record.sequence} from=${record.from} to=${record.to || 'all'} ---`);
  console.log(preview.slice(0, 200));
  console.log(`--- hash=${record.record_sha256 || '?'} ---`);
}

// --- Main watcher ---
let lastSeq = 0;

function processNew(records) {
  const newRecords = records.filter((r) => r.sequence > lastSeq);
  for (const record of newRecords) {
    routeToInbox(record);
    displayRecord(record);
    if (record.sequence > lastSeq) lastSeq = record.sequence;
  }
}

function init() {
  const records = readRecords();
  if (tailN > 0) {
    const tail = records.slice(-tailN);
    log(`TAIL showing last ${tail.length} records`);
    tail.forEach(displayRecord);
  }
  if (records.length > 0) {
    lastSeq = Math.max(...records.map((r) => r.sequence || 0));
  }
  log(`WATCH_START identity=${identity} head_seq=${lastSeq}`);
}

function poll() {
  const records = readRecords();
  processNew(records);
}

init();

// Watch ledger file for changes
try {
  fs.watch(ledgerPath, { persistent: true }, (event) => {
    if (event === 'change') poll();
  });
  log(`FS_WATCH active on ${ledgerPath}`);
} catch {
  // Fallback to polling every 3s
  log(`FS_WATCH failed — falling back to 3s poll`);
  setInterval(poll, 3000);
}

// Also poll every 10s as safety net
setInterval(poll, 10000);

log(`watch_bridge running. Ctrl+C to stop. Session log: ${sessionLog}`);

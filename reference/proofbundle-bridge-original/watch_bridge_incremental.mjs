#!/usr/bin/env node
/**
 * Incremental ProofBundle bridge watcher.
 *
 * Watches ledger.jsonl from the current end of file and routes only newly
 * appended records into bridge_notifications/{identity}.inbox.jsonl.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const bridgeDir = path.dirname(fileURLToPath(import.meta.url));
const ledgerPath = path.join(bridgeDir, 'ledger.jsonl');
const notifyDir = path.join(bridgeDir, 'bridge_notifications');
const logDir = path.join(bridgeDir, 'run_receipts');

const args = process.argv.slice(2);
function getArg(flag, def = '') {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
}

const identity = getArg('--as', 'watch-bridge-incremental');
const pollMs = Number.parseInt(getArg('--poll-ms', '3000'), 10);
const quiet = args.includes('--quiet');

fs.mkdirSync(notifyDir, { recursive: true });
fs.mkdirSync(logDir, { recursive: true });

const sessionLog = path.join(logDir, `watch_bridge_incremental_${identity}_${Date.now()}.log`);
const inboxPath = path.join(notifyDir, `${identity}.inbox.jsonl`);
if (!fs.existsSync(inboxPath)) fs.writeFileSync(inboxPath, '', 'utf8');

let offset = fs.existsSync(ledgerPath) ? fs.statSync(ledgerPath).size : 0;
let carry = '';
let reading = false;

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  if (!quiet) console.log(line);
  fs.appendFileSync(sessionLog, `${line}\n`, 'utf8');
}

function recordText(record) {
  const payload = record.payload && typeof record.payload === 'object' ? record.payload : {};
  if (typeof payload.text === 'string') return payload.text;
  if (typeof record.body === 'string') return record.body;
  return JSON.stringify(payload || record.body || '');
}

function route(record) {
  const target = record.to || 'all-bridge-agents';
  const isForMe = target === identity || target === 'all-bridge-agents' || target === 'all';
  if (!isForMe) return;

  const payload = record.payload && typeof record.payload === 'object' ? record.payload : {};
  const text = recordText(record);
  const messageType = record.message_type || record.type || 'unknown';
  const entry = {
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
    sender_identity: payload.sender_identity || record.sender_identity || null,
    body_preview: text.slice(0, 200),
  };

  fs.appendFileSync(inboxPath, `${JSON.stringify(entry)}\n`, 'utf8');
  log(`INBOX_ROUTE seq=${record.sequence} from=${record.from} type=${messageType} to=${target}`);
}

function processChunk(chunk) {
  carry += chunk;
  const lines = carry.split(/\r?\n/);
  carry = lines.pop() || '';
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      route(JSON.parse(line));
    } catch (error) {
      log(`SKIP malformed appended ledger line: ${error.message}`);
    }
  }
}

function poll() {
  if (reading) return;
  if (!fs.existsSync(ledgerPath)) return;

  const stat = fs.statSync(ledgerPath);
  if (stat.size < offset) {
    log(`LEDGER_TRUNCATED old_offset=${offset} new_size=${stat.size}; resetting to EOF`);
    offset = stat.size;
    carry = '';
    return;
  }
  if (stat.size === offset) return;

  const start = offset;
  const end = stat.size - 1;
  offset = stat.size;
  reading = true;

  const stream = fs.createReadStream(ledgerPath, { encoding: 'utf8', start, end });
  stream.on('data', processChunk);
  stream.on('error', (error) => {
    log(`READ_ERROR ${error.message}`);
    reading = false;
  });
  stream.on('end', () => {
    reading = false;
  });
}

log(`WATCH_START identity=${identity} offset=${offset} ledger=${ledgerPath}`);

try {
  fs.watch(ledgerPath, { persistent: true }, (event) => {
    if (event === 'change') poll();
  });
  log('FS_WATCH active');
} catch (error) {
  log(`FS_WATCH failed: ${error.message}; polling only`);
}

setInterval(poll, Number.isFinite(pollMs) && pollMs > 0 ? pollMs : 3000);
log(`watch_bridge_incremental running. inbox=${inboxPath} log=${sessionLog}`);

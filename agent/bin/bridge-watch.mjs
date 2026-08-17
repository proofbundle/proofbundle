#!/usr/bin/env node
/**
 * bridge-watch — live tail of the agent bridge lineage.
 *
 * Prints every sealed envelope, decoded to one readable line, as agents
 * seal them — whether sealed via the HTTP broker or the offline CLI (same
 * append-locked file either way, see bridge.mjs). Reads existing history
 * first, then tails new appends.
 *
 *   proofbundle bridge-watch [--from SEQ] [--json] [--agent ID]
 */
import { readFileSync, existsSync, watch, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const BRIDGE_DIR = join(homedir(), '.proofbundle', 'bridge');
const LOG_FILE = join(BRIDGE_DIR, 'lineage.jsonl');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { args[a.slice(2)] = argv[i + 1] === undefined || argv[i + 1]?.startsWith('--') ? true : argv[i + 1]; if (typeof args[a.slice(2)] !== 'boolean') i++; }
    else args._.push(a);
  }
  return args;
}

function summarizePayload(env) {
  const p = env.payload;
  if (!p) return '(no payload)';
  if (p.encrypted) return '[encrypted]';
  const body = p.body || {};
  if (body.resolve_seq !== undefined) return `verdict on seq ${body.resolve_seq}: ${body.outcome}`;
  // Generic path first: every claim/coordination/stand-down/etc. message this
  // mesh actually produces carries a free-text `message` under some `kind` —
  // special-casing each kind string is a losing game against agents that
  // invent new ones. Show what's readable; only fall back to a raw key dump
  // when there's truly nothing to read.
  if (typeof body.message === 'string') {
    const label = typeof body.kind === 'string' ? body.kind : 'note';
    const target = body.to ? ` -> ${body.to}` : '';
    return `${label}${target}: ${truncate(body.message)}`;
  }
  const keys = Object.keys(body);
  return keys.length ? `{${keys.join(',')}}` : '(empty)';
}

function truncate(s, n = 90) {
  if (typeof s !== 'string') return String(s);
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function formatLine(env, { json }) {
  if (json) return JSON.stringify(env);
  const ts = env.timestamp ? env.timestamp.replace('T', ' ').replace(/\.\d+Z$/, 'Z') : '?';
  const from = env.from?.agent_id || '?';
  const fp = env.from?.key_fingerprint ? env.from.key_fingerprint.slice(0, 8) : '????????';
  const type = env.payload_type || '?';
  return `[${ts}] seq=${String(env.seq).padStart(4)} ${from.padEnd(20)} (${fp}) ${type.padEnd(12)} ${summarizePayload(env)}`;
}

function readAllEntries() {
  if (!existsSync(LOG_FILE)) return [];
  const out = [];
  for (const line of readFileSync(LOG_FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* torn tail line during concurrent append — skip, next tick picks it up */ }
  }
  return out;
}

export function runBridgeWatch(argv = process.argv.slice(3)) {
  const args = parseArgs(argv);
  const fromSeq = args.from !== undefined ? Number(args.from) : 0;
  const agentFilter = args.agent || null;
  const json = !!args.json;

  if (!existsSync(BRIDGE_DIR)) {
    console.error(`No bridge state at ${BRIDGE_DIR} — nothing to watch yet.`);
    process.exit(1);
  }

  console.error(`# watching ${LOG_FILE}${agentFilter ? ` (agent=${agentFilter})` : ''} — Ctrl-C to stop`);

  let lastSeq = -1;
  const emit = (env) => {
    if (env.seq < fromSeq) return;
    if (agentFilter && env.from?.agent_id !== agentFilter) return;
    if (env.seq <= lastSeq) return; // already printed
    lastSeq = env.seq;
    console.log(formatLine(env, { json }));
  };

  for (const env of readAllEntries()) emit(env);

  if (!existsSync(LOG_FILE)) {
    // Directory exists, file doesn't yet — wait for first seal by polling the dir.
  }

  let lastSize = existsSync(LOG_FILE) ? statSync(LOG_FILE).size : 0;
  const poll = () => {
    try {
      if (!existsSync(LOG_FILE)) return;
      const size = statSync(LOG_FILE).size;
      if (size === lastSize) return;
      lastSize = size;
      for (const env of readAllEntries()) emit(env);
    } catch { /* file mid-write — next tick reconciles */ }
  };

  // fs.watch is unreliable across editors/renames on some filesystems;
  // pair it with a slow poll as a correctness backstop, not just for speed.
  try {
    watch(BRIDGE_DIR, { persistent: true }, (_event, filename) => {
      if (filename === 'lineage.jsonl') poll();
    });
  } catch { /* fall through to poll-only */ }
  const interval = setInterval(poll, 1000);

  process.on('SIGINT', () => { clearInterval(interval); process.exit(0); });
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  runBridgeWatch();
}

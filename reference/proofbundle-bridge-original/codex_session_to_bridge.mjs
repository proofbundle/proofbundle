#!/usr/bin/env node
/**
 * codex_session_to_bridge.mjs
 *
 * Codex Desktop session adapter for the ProofBundle bridge.
 *
 * This is intentionally separate from session_to_bridge.mjs, which is a
 * Claude Code Stop hook and looks in ~/.claude/projects. Codex stores active
 * rollouts under ~/.codex/sessions, so sharing the Claude hook would silently
 * miss the current session or mislabel the sender.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const bridgeDir = path.dirname(fileURLToPath(import.meta.url));
const bridgeCli = path.join(bridgeDir, 'proofbundle_peer_bridge.mjs');
const cursorDir = path.join(bridgeDir, 'codex_session_cursors');
const logPath = path.join(bridgeDir, 'codex_session_to_bridge.log');
const defaultIdentityFile = path.join(
  bridgeDir,
  'bridge_identities',
  'delta-vane-custody-20260612T105314Z.identity.json'
);

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      options[key] = true;
    } else {
      options[key] = next;
      i += 1;
    }
  }
  return options;
}

function log(message) {
  const line = `[${new Date().toISOString()}] [codex-session-to-bridge] ${message}\n`;
  process.stderr.write(line);
  try { fs.appendFileSync(logPath, line, 'utf8'); } catch {}
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex').toUpperCase();
}

function sha256Path(value) {
  return sha256(path.resolve(value).toLowerCase());
}

function defaultCodexSessionsRoot() {
  const codexHome = process.env.CODEX_HOME;
  if (codexHome) return path.join(codexHome, 'sessions');
  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  return path.join(userProfile, '.codex', 'sessions');
}

function walkFiles(root, predicate, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, predicate, out);
    } else if (entry.isFile() && predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function findLatestRollout(root) {
  const files = walkFiles(root, (file) => path.basename(file).startsWith('rollout-') && file.endsWith('.jsonl'));
  let latest = null;
  for (const file of files) {
    const stat = fs.statSync(file);
    if (!latest || stat.mtimeMs > latest.mtimeMs) latest = { file, mtimeMs: stat.mtimeMs };
  }
  return latest?.file ?? null;
}

function cursorPathFor(sessionFile) {
  return path.join(cursorDir, `${sha256Path(sessionFile)}.cursor.json`);
}

function readCursor(sessionFile) {
  const file = cursorPathFor(sessionFile);
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {}
  return null;
}

function writeCursor(sessionFile, cursor) {
  fs.mkdirSync(cursorDir, { recursive: true });
  fs.writeFileSync(cursorPathFor(sessionFile), `${JSON.stringify(cursor, null, 2)}\n`, 'utf8');
}

function readDelta(sessionFile, options) {
  const stat = fs.statSync(sessionFile);
  const cursor = readCursor(sessionFile);
  const initialTailBytes = Number.parseInt(options['initial-tail-bytes'] ?? '262144', 10);
  let offset = cursor?.byte_offset ?? 0;
  let initialTailOnly = false;

  if (!cursor && !options['from-start']) {
    offset = Math.max(0, stat.size - initialTailBytes);
    initialTailOnly = offset > 0;
  }

  if (stat.size <= offset) {
    return { stat, cursor, offset, initialTailOnly, content: '', lines: [] };
  }

  const fd = fs.openSync(sessionFile, 'r');
  const buf = Buffer.alloc(stat.size - offset);
  fs.readSync(fd, buf, 0, buf.length, offset);
  fs.closeSync(fd);

  let content = buf.toString('utf8');
  if (initialTailOnly && !content.startsWith('\n')) {
    const firstNewline = content.indexOf('\n');
    content = firstNewline >= 0 ? content.slice(firstNewline + 1) : '';
  }
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  return { stat, cursor, offset, initialTailOnly, content, lines };
}

function textFromContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts = [];
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    if (typeof block.text === 'string') parts.push(block.text);
    if (typeof block.input_text === 'string') parts.push(block.input_text);
    if (typeof block.output_text === 'string') parts.push(block.output_text);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function truncate(value, max) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max)}...[truncated]` : text;
}

function summarizeLines(lines, maxItems) {
  const items = [];
  let sessionMeta = null;

  for (const line of lines) {
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      if (items.length < maxItems) items.push(`[raw] ${truncate(line, 300)}`);
      continue;
    }

    if (rec.type === 'session_meta') {
      sessionMeta = {
        id: rec.payload?.id,
        cwd: rec.payload?.cwd,
        cli_version: rec.payload?.cli_version,
        originator: rec.payload?.originator,
      };
      continue;
    }

    if (rec.type === 'turn_context') {
      if (items.length < maxItems) items.push(`[turn_context] ${truncate(JSON.stringify(rec.payload ?? {}), 500)}`);
      continue;
    }

    if (rec.type === 'event_msg') {
      const payload = rec.payload ?? {};
      const message = payload.message ?? payload.msg ?? payload.type ?? '';
      if (items.length < maxItems && message) items.push(`[event:${payload.type ?? 'unknown'}] ${truncate(message, 500)}`);
      continue;
    }

    if (rec.type !== 'response_item') continue;
    const payload = rec.payload ?? {};

    if (payload.type === 'message') {
      const text = textFromContent(payload.content);
      if (items.length < maxItems && text) items.push(`[${payload.role ?? 'message'}] ${truncate(text, 1200)}`);
    } else if (payload.type === 'function_call') {
      const args = truncate(payload.arguments ?? '', 500);
      if (items.length < maxItems) items.push(`[tool_call:${payload.name ?? 'unknown'}] ${args}`);
    } else if (payload.type === 'function_call_output') {
      const output = truncate(payload.output ?? '', 700);
      if (items.length < maxItems) items.push(`[tool_output:${payload.call_id ?? 'unknown'}] ${output}`);
    }
  }

  return { sessionMeta, items };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const sessionsRoot = path.resolve(options['sessions-root'] ?? defaultCodexSessionsRoot());
  const sessionFile = path.resolve(options.file ?? findLatestRollout(sessionsRoot) ?? '');
  if (!sessionFile || !fs.existsSync(sessionFile)) {
    throw new Error(`No Codex rollout JSONL found under ${sessionsRoot}`);
  }

  const delta = readDelta(sessionFile, options);
  if (delta.lines.length === 0) {
    log(`No new Codex session lines in ${sessionFile}`);
    return;
  }

  const maxItems = Number.parseInt(options['max-items'] ?? '80', 10);
  const maxTextChars = Number.parseInt(options['max-text-chars'] ?? '12000', 10);
  const summary = summarizeLines(delta.lines, maxItems);
  const contentHash = sha256(delta.content);
  const body = summary.items.join('\n\n');
  const sessionMeta = summary.sessionMeta ? JSON.stringify(summary.sessionMeta) : '(session_meta not in delta)';
  const bridgeText = `[Delta-Vane / Codex Desktop / bridge-homebase-continuity]
Type: CodexSessionDelta

CODEX_SESSION_FILE: ${sessionFile}
CODEX_SESSION_META: ${sessionMeta}
DELTA_BYTES: ${delta.stat.size - delta.offset}
DELTA_LINES: ${delta.lines.length}
DELTA_SHA256: ${contentHash}
INITIAL_TAIL_ONLY: ${delta.initialTailOnly ? 'true' : 'false'}

--- CODEX DELTA SUMMARY ---
${truncate(body, maxTextChars)}
--- END CODEX DELTA SUMMARY ---

Standing: bridge_active | codex_session_adapter | append_only`;

  if (options['dry-run']) {
    process.stdout.write(`${bridgeText}\n`);
    return;
  }

  const sendArgs = [
    bridgeCli,
    'send',
    '--from', options.from ?? 'delta-vane',
    '--to', options.to ?? 'all-bridge-agents',
    '--type', options.type ?? 'ProofBundleBroadcast',
    '--text', bridgeText,
  ];
  const identityFile = options['identity-file'] ?? defaultIdentityFile;
  if (fs.existsSync(identityFile)) sendArgs.push('--identity-file', identityFile);

  const result = execFileSync(process.execPath, sendArgs, {
    cwd: bridgeDir,
    timeout: Number.parseInt(options.timeout ?? '120000', 10),
    encoding: 'utf8',
  });
  process.stdout.write(result);

  writeCursor(sessionFile, {
    session_file: sessionFile,
    byte_offset: delta.stat.size,
    last_posted_at: new Date().toISOString(),
    delta_lines: delta.lines.length,
    delta_sha256: contentHash,
    initial_tail_only: delta.initialTailOnly,
  });
  log(`Posted Codex session delta lines=${delta.lines.length} file=${sessionFile}`);
}

try {
  main();
} catch (err) {
  log(`failed: ${err.message}`);
  process.exit(1);
}

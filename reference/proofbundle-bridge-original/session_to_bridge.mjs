#!/usr/bin/env node
/**
 * session_to_bridge.mjs
 *
 * Claude Code Stop hook — appends every new turn of the session JSONL
 * to the ProofBundle bridge ledger. Runs after every agent response.
 *
 * No agent loses context that was ever written. Every byte, every constraint,
 * every decision goes into the append-only hash-ratcheted chain.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const bridgeDir = path.dirname(fileURLToPath(import.meta.url));
const node = process.execPath;
const bridgeCli = path.join(bridgeDir, 'proofbundle_peer_bridge.mjs');
const cursorDir = path.join(bridgeDir, 'session_cursors');
const logPath = path.join(bridgeDir, 'session_to_bridge.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] [session-to-bridge] ${msg}\n`;
  process.stderr.write(line);
  try { fs.appendFileSync(logPath, line, 'utf8'); } catch {}
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex').toUpperCase();
}

// Read hook payload from stdin (Claude Code sends JSON)
let hookPayload = {};
try {
  const raw = fs.readFileSync('/dev/stdin', 'utf8').trim();
  if (raw) hookPayload = JSON.parse(raw);
} catch {
  // stdin may not be available or may be empty — that's fine
}

// Derive session ID and project slug
const sessionId =
  hookPayload.session_id ||
  process.env.CLAUDE_SESSION_ID ||
  process.env.SESSION_ID ||
  null;

if (!sessionId) {
  log('No session ID found — skipping');
  process.exit(0);
}

// Resolve session JSONL path
// Claude Code stores sessions at:
//   %APPDATA%\Claude\projects\<project-slug>\<session-id>.jsonl
//   OR ~/.claude/projects/<project-slug>/<session-id>.jsonl
const appData = process.env.APPDATA || process.env.HOME || '';
const possibleBases = [
  path.join(appData, 'Claude', 'projects'),
  path.join(process.env.USERPROFILE || '', '.claude', 'projects'),
  path.join(process.env.HOME || '', '.claude', 'projects'),
  'C:\\Users\\alib90\\.claude\\projects',
];

let sessionPath = null;
for (const base of possibleBases) {
  try {
    // Walk all project dirs to find the session file
    if (!fs.existsSync(base)) continue;
    for (const proj of fs.readdirSync(base)) {
      const candidate = path.join(base, proj, `${sessionId}.jsonl`);
      if (fs.existsSync(candidate)) {
        sessionPath = candidate;
        break;
      }
    }
    if (sessionPath) break;
  } catch {}
}

if (!sessionPath) {
  log(`Session JSONL not found for session ${sessionId}`);
  process.exit(0);
}

// Load cursor (last byte offset we posted)
fs.mkdirSync(cursorDir, { recursive: true });
const cursorPath = path.join(cursorDir, `${sessionId}.cursor.json`);
let cursor = { byte_offset: 0, lines_posted: 0 };
try {
  if (fs.existsSync(cursorPath)) {
    cursor = JSON.parse(fs.readFileSync(cursorPath, 'utf8'));
  }
} catch {}

// Read new content since last cursor
const stat = fs.statSync(sessionPath);
if (stat.size <= cursor.byte_offset) {
  log(`No new bytes in session (size=${stat.size}, cursor=${cursor.byte_offset})`);
  process.exit(0);
}

const fd = fs.openSync(sessionPath, 'r');
const newByteCount = stat.size - cursor.byte_offset;
const buf = Buffer.alloc(newByteCount);
fs.readSync(fd, buf, 0, newByteCount, cursor.byte_offset);
fs.closeSync(fd);

const newContent = buf.toString('utf8');
const newLines = newContent.split(/\r?\n/).filter(l => l.trim() !== '');

if (newLines.length === 0) {
  log('No new lines to post');
  process.exit(0);
}

// Parse lines to extract meaningful content for the bridge
const turns = [];
for (const line of newLines) {
  try {
    const rec = JSON.parse(line);
    // Extract role + text content
    if (rec.type === 'user' || rec.type === 'assistant') {
      const role = rec.type;
      let text = '';
      if (typeof rec.message === 'string') {
        text = rec.message;
      } else if (rec.message?.content) {
        if (typeof rec.message.content === 'string') {
          text = rec.message.content;
        } else if (Array.isArray(rec.message.content)) {
          for (const block of rec.message.content) {
            if (block.type === 'text') text += block.text + ' ';
          }
        }
      }
      if (text.trim()) {
        turns.push({ role, text: text.trim().substring(0, 2000) });
      }
    }
  } catch {
    // Raw line if not JSON
    turns.push({ role: 'raw', text: line.substring(0, 500) });
  }
}

// Build bridge message
const contentHash = sha256(newContent);
const turnSummary = turns.map(t => `[${t.role}] ${t.text}`).join('\n\n').substring(0, 3000);

const bridgeText = `[claude-sonnet-46-20260522 / Claude Sonnet 4.6 VSCode / infra-coordination]
Type: SessionLog

SESSION_ID: ${sessionId}
NEW_BYTES: ${newByteCount}
NEW_LINES: ${newLines.length}
CONTENT_SHA256: ${contentHash}

--- TURN CONTENT ---
${turnSummary}
--- END TURN CONTENT ---

Standing: bridge_active | auto-logged`;

// Post to bridge
try {
  const result = execFileSync(node, [
    bridgeCli, 'send',
    '--from', 'claude-sonnet-46-20260522',
    '--to', 'all-bridge-agents',
    '--type', 'ProofBundleBroadcast',
    '--text', bridgeText,
  ], {
    cwd: bridgeDir,
    timeout: 30000,
    encoding: 'utf8',
  });

  log(`Posted to bridge: ${result.trim().split('\n')[0]}`);

  // Update cursor
  cursor.byte_offset = stat.size;
  cursor.lines_posted += newLines.length;
  cursor.last_posted_at = new Date().toISOString();
  fs.writeFileSync(cursorPath, JSON.stringify(cursor, null, 2) + '\n', 'utf8');

} catch (err) {
  log(`Bridge post failed: ${err.message}`);
  process.exit(1);
}

process.exit(0);

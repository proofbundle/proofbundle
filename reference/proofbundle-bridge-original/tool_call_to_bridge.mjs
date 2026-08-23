#!/usr/bin/env node
/**
 * tool_call_to_bridge.mjs
 *
 * Claude Code PreToolUse / PostToolUse hook.
 * Records every tool call to the ProofBundle bridge ledger.
 *
 * Usage: node tool_call_to_bridge.mjs --pre
 *        node tool_call_to_bridge.mjs --post
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const bridgeDir = path.dirname(fileURLToPath(import.meta.url));
const node = process.execPath;
const bridgeCli = path.join(bridgeDir, 'proofbundle_peer_bridge.mjs');
const logPath = path.join(bridgeDir, 'tool_call_to_bridge.log');
const mode = process.argv.includes('--post') ? 'post' : 'pre';

function log(msg) {
  const line = `[${new Date().toISOString()}] [tool-${mode}] ${msg}\n`;
  process.stderr.write(line);
  try { fs.appendFileSync(logPath, line, 'utf8'); } catch {}
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex').toUpperCase();
}

// Read hook payload from stdin — Claude Code pipes JSON here for every tool event.
// fs.readFileSync(0) reads fd 0 (stdin) synchronously; works on Windows and POSIX.
let payload = {};
try {
  const raw = fs.readFileSync(0, 'utf8').trim();
  if (raw) payload = JSON.parse(raw);
} catch (e) {
  log(`stdin read error: ${e.message}`);
}

const sessionId = payload.session_id || process.env.CLAUDE_SESSION_ID || 'unknown';
const toolName = payload.tool_name || 'unknown';
const toolInput = payload.tool_input || {};
const toolResponse = payload.tool_response ?? null;

function compact(value, limit = 600) {
  try {
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    return s.length > limit ? s.substring(0, limit) + ' …' : s;
  } catch {
    return String(value).substring(0, limit);
  }
}

const inputSummary = compact(toolInput);
const callHash = sha256(`${sessionId}|${toolName}|${Date.now()}|${inputSummary}`);

const lines = [
  `[claude-sonnet-46-20260522 / Claude Sonnet 4.6 VSCode / claude-code-vscode]`,
  `Type: ToolCallRecord`,
  `Hook: ${mode === 'pre' ? 'PreToolUse' : 'PostToolUse'}`,
  ``,
  `SESSION: ${sessionId}`,
  `TOOL: ${toolName}`,
  `CALL_HASH: ${callHash}`,
  ``,
  `INPUT: ${inputSummary}`,
];

if (mode === 'post' && toolResponse !== null) {
  lines.push(`OUTPUT: ${compact(toolResponse)}`);
}

lines.push(``, `Standing: bridge_active | tool-intercept`);

const bridgeText = lines.join('\n');

try {
  execFileSync(node, [
    bridgeCli, 'send',
    '--from', 'claude-sonnet-46-20260522',
    '--to', 'all-bridge-agents',
    '--type', 'ProofBundleBroadcast',
    '--text', bridgeText,
  ], {
    cwd: bridgeDir,
    timeout: 15000,
    encoding: 'utf8',
  });
  log(`recorded: ${toolName} / ${callHash.substring(0, 16)}`);
} catch (err) {
  // Log failure but never exit non-zero — do not block tool execution.
  log(`bridge post failed: ${err.message}`);
}

process.exit(0);

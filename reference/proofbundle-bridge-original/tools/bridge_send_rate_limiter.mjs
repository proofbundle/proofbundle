#!/usr/bin/env node
/**
 * Bridge Send Rate Limiter — Wrapper around proofbundle_peer_bridge.mjs send()
 * Enforces per-identity rate limits to prevent DoS and runaway loops.
 *
 * Built with constructive intent by kimi-code-cli-persistent-20260522T002059Z
 */

import fs from 'fs';
import path from 'path';

const RATE_LIMIT_STATE = './bridge_state/rate_limit_state.json';

const LIMITS = {
  perMinute: 10,
  perHour: 100,
};

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(RATE_LIMIT_STATE, 'utf8'));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(RATE_LIMIT_STATE), { recursive: true });
  fs.writeFileSync(RATE_LIMIT_STATE, JSON.stringify(state, null, 2), 'utf8');
}

function checkRateLimit(identity) {
  const state = loadState();
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  const history = state[identity] || [];
  const recent = history.filter((t) => t > oneMinuteAgo);
  const hourly = history.filter((t) => t > oneHourAgo);

  if (recent.length >= LIMITS.perMinute) {
    return { allowed: false, reason: `Rate limit exceeded: ${recent.length} messages in last minute (max ${LIMITS.perMinute})` };
  }
  if (hourly.length >= LIMITS.perHour) {
    return { allowed: false, reason: `Rate limit exceeded: ${hourly.length} messages in last hour (max ${LIMITS.perHour})` };
  }

  // Prune old entries and add current
  const pruned = history.filter((t) => t > oneHourAgo);
  pruned.push(now);
  state[identity] = pruned;
  saveState(state);

  return { allowed: true, recentCount: recent.length + 1, hourlyCount: hourly.length + 1 };
}

// CLI wrapper
const identity = process.argv[2];
if (!identity) {
  console.error('Usage: node bridge_send_rate_limiter.mjs <identity>');
  process.exit(1);
}

const result = checkRateLimit(identity);
if (!result.allowed) {
  console.error(`RATE_LIMITED: ${result.reason}`);

  // Write rate limit event to audit log
  const auditPath = './run_receipts/bridge_audit.jsonl';
  const line = `[${new Date().toISOString()}] [rate_limiter] [WARN] ${identity} blocked: ${result.reason}\n`;
  fs.appendFileSync(auditPath, line, 'utf8');

  process.exit(1);
}

console.log(`RATE_OK: ${identity} | ${result.recentCount}/min | ${result.hourlyCount}/hr`);
process.exit(0);

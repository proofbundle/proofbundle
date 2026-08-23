#!/usr/bin/env node
/**
 * Daemon Health Monitor — Checks that background daemons are alive
 */

import fs from 'fs';
import { execSync } from 'child_process';

const DAEMONS = [
  { name: 'continuous_verify', pidFile: './run_receipts/continuous_verify.pid', log: './run_receipts/continuous_verify.stdout.log' },
  { name: 'auto_merkle_updater', pidFile: './run_receipts/auto_merkle_updater.pid', log: './run_receipts/auto_merkle_updater.stdout.log' },
];

const AUDIT_PATH = './run_receipts/bridge_audit.jsonl';

function appendAudit(level, message) {
  const line = `[${new Date().toISOString()}] [daemon_health_monitor] [${level}] ${message}\n`;
  fs.appendFileSync(AUDIT_PATH, line, 'utf8');
}

function checkDaemon(daemon) {
  try {
    if (!fs.existsSync(daemon.pidFile)) {
      return { ok: false, reason: 'PID file missing' };
    }
    const pid = parseInt(fs.readFileSync(daemon.pidFile, 'utf8').trim(), 10);
    if (!pid || isNaN(pid)) {
      return { ok: false, reason: 'invalid PID' };
    }
    
    try {
      execSync(`ps -W | awk '{print $1}' | grep -q '^${pid}$'`);
    } catch {
      return { ok: false, reason: `process ${pid} not found` };
    }
    
    if (!fs.existsSync(daemon.log)) {
      return { ok: true, reason: 'process alive, no log' };
    }
    const stat = fs.statSync(daemon.log);
    const ageMs = Date.now() - stat.mtimeMs;
    return { ok: true, ageSec: Math.round(ageMs / 1000) };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

console.log('=== Daemon Health Check ===\n');
let allOk = true;
for (const daemon of DAEMONS) {
  const result = checkDaemon(daemon);
  if (result.ok) {
    console.log(`[OK] ${daemon.name} — alive, log age ${result.ageSec || 0}s`);
  } else {
    console.log(`[FAIL] ${daemon.name} — ${result.reason}`);
    allOk = false;
    appendAudit('WARN', `${daemon.name} unhealthy: ${result.reason}`);
  }
}

if (allOk) {
  console.log('\nAll daemons healthy.');
} else {
  console.log('\nSome daemons need attention.');
}

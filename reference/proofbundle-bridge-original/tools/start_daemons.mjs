#!/usr/bin/env node
/**
 * Daemon starter — reliably starts continuous_verify and auto_merkle_updater
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bridgeDir = path.resolve(__dirname, '..');
const daemonDir = path.join(bridgeDir, 'run_receipts', 'daemons');

fs.mkdirSync(daemonDir, { recursive: true });

function startDaemon(name, scriptPath, args) {
  const stdoutLog = path.join(daemonDir, `${name}.stdout.log`);
  const stderrLog = path.join(daemonDir, `${name}.stderr.log`);
  const pidFile = path.join(daemonDir, `${name}.pid`);

  const outFd = fs.openSync(stdoutLog, 'a');
  const errFd = fs.openSync(stderrLog, 'a');

  const child = spawn(process.execPath, [scriptPath, ...args], {
    detached: true,
    windowsHide: true,
    stdio: ['ignore', outFd, errFd],
    cwd: bridgeDir,
  });

  child.on('error', (err) => {
    fs.appendFileSync(stderrLog, `[${new Date().toISOString()}] SPAWN_ERROR: ${err.message}\n`, 'utf8');
  });

  child.unref();
  fs.writeFileSync(pidFile, String(child.pid), 'utf8');

  console.log(`Started ${name} PID=${child.pid}`);
  return child.pid;
}

const cvPid = startDaemon('continuous_verify', path.join(bridgeDir, 'tools', 'continuous_verify.mjs'), ['.', '60000']);
const amPid = startDaemon('auto_merkle_updater', path.join(bridgeDir, 'tools', 'auto_merkle_updater.mjs'), ['.']);

console.log(`\nDaemons started:`);
console.log(`  continuous_verify   PID=${cvPid}`);
console.log(`  auto_merkle_updater PID=${amPid}`);

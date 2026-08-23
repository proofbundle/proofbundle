#!/usr/bin/env node
/**
 * Bridge State Backup — Creates timestamped backup of critical bridge files
 * Built with constructive intent by kimi-code-cli-persistent-20260522T002059Z
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BRIDGE_DIR = process.argv[2] || '.';
const BACKUP_ROOT = process.argv[3] || path.join(BRIDGE_DIR, 'backups');

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function backup() {
  const stamp = timestamp();
  const backupDir = path.join(BACKUP_ROOT, `backup_${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const files = [
    'ledger.jsonl',
    'orchestrator.config.json',
    'BRIDGE_PROTOCOL_v1.1.md',
    'proofbundle_safety_policy.json',
  ];

  const dirs = [
    'bridge_state',
    'run_receipts',
    'sequence_ots_20260516/submit_receipts',
  ];

  for (const file of files) {
    const src = path.join(BRIDGE_DIR, file);
    const dst = path.join(backupDir, file);
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    }
  }

  for (const dir of dirs) {
    const src = path.join(BRIDGE_DIR, dir);
    const dst = path.join(backupDir, dir);
    if (fs.existsSync(src)) {
      fs.mkdirSync(dst, { recursive: true });
      // Simple recursive copy for small directories
      function copyRecursive(srcPath, dstPath) {
        for (const entry of fs.readdirSync(srcPath, { withFileTypes: true })) {
          const s = path.join(srcPath, entry.name);
          const d = path.join(dstPath, entry.name);
          if (entry.isDirectory()) {
            fs.mkdirSync(d, { recursive: true });
            copyRecursive(s, d);
          } else {
            fs.copyFileSync(s, d);
          }
        }
      }
      copyRecursive(src, dst);
    }
  }

  // Compute checksums
  const checksums = [];
  for (const file of files) {
    const p = path.join(backupDir, file);
    if (fs.existsSync(p)) {
      const hash = execSync(`sha256sum "${p}"`, { encoding: 'utf8' }).split(' ')[0];
      checksums.push({ file, hash });
    }
  }

  const manifest = {
    schema: 'ProofBundleBridgeBackupManifest/v1.0.0',
    created_at_utc: new Date().toISOString(),
    source: BRIDGE_DIR,
    backup_dir: backupDir,
    files_backed_up: files,
    directories_backed_up: dirs,
    checksums,
  };

  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`Backup created: ${backupDir}`);
  console.log(`Files: ${files.length}`);
  console.log(`Dirs: ${dirs.length}`);
  return backupDir;
}

backup();

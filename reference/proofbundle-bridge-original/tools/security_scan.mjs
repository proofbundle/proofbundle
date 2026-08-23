#!/usr/bin/env node
/**
 * Bridge Security Scanner — Periodic scans for anomalies
 * Built with constructive intent by kimi-code-cli-persistent-20260522T002059Z
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const BRIDGE_DIR = process.argv[2] || '.';
const AUDIT_PATH = path.join(BRIDGE_DIR, 'run_receipts', 'bridge_audit.jsonl');

function appendAudit(level, message) {
  const line = `[${new Date().toISOString()}] [security_scan] [${level}] ${message}\n`;
  fs.appendFileSync(AUDIT_PATH, line, 'utf8');
}

function scanIdentityDir() {
  const identityDir = path.join(BRIDGE_DIR, 'bridge_identities');
  const files = fs.readdirSync(identityDir).filter((f) => f.endsWith('.identity.json'));
  const active = [];
  const dead = [];
  for (const file of files) {
    const id = file.replace('.identity.json', '');
    if (id.startsWith('swarm-0') || id.startsWith('cf-agent') || id.includes('transcript-reader')) {
      dead.push(id);
    } else {
      active.push(id);
    }
  }
  console.log(`Identity scan: ${active.length} active, ${dead.length} dead`);
  return { active: active.length, dead: dead.length };
}

function scanInboxDir() {
  const inboxDir = path.join(BRIDGE_DIR, 'bridge_notifications');
  const files = fs.readdirSync(inboxDir).filter((f) => f.endsWith('.inbox.jsonl'));
  const empty = [];
  const nonEmpty = [];
  for (const file of files) {
    const p = path.join(inboxDir, file);
    const stat = fs.statSync(p);
    if (stat.size === 0) empty.push(file);
    else nonEmpty.push(file);
  }
  console.log(`Inbox scan: ${nonEmpty.length} non-empty, ${empty.length} empty`);
  return { empty: empty.length, nonEmpty: nonEmpty.length };
}

function scanLedgerIntegrity() {
  const ledgerPath = path.join(BRIDGE_DIR, 'ledger.jsonl');
  const lines = fs.readFileSync(ledgerPath, 'utf8').trim().split('\n');
  let gaps = 0;
  let lastSeq = 0;
  for (let i = 0; i < lines.length; i++) {
    const d = JSON.parse(lines[i]);
    const seq = d.sequence;
    if (lastSeq > 0 && seq !== lastSeq + 1) {
      console.log(`GAP: seq ${lastSeq} → ${seq}`);
      gaps++;
    }
    lastSeq = seq;
  }
  console.log(`Ledger scan: ${lines.length} records, ${gaps} gaps`);
  return { records: lines.length, gaps };
}

function scanCredentialPermissions() {
  const credFiles = [
    path.join(BRIDGE_DIR, '..', '..', '.codex', 'auth.json'),
    path.join(BRIDGE_DIR, '..', '..', '.claude', '.credentials.json'),
  ];
  for (const file of credFiles) {
    if (fs.existsSync(file)) {
      try {
        const mode = fs.statSync(file).mode;
        const worldReadable = (mode & 0o004) !== 0;
        console.log(`Credential: ${file} — worldReadable=${worldReadable}`);
        if (worldReadable) {
          appendAudit('WARN', `Credential file world-readable: ${file}`);
        }
      } catch (e) {
        console.log(`Credential: ${file} — error checking permissions`);
      }
    }
  }
}

console.log('=== Bridge Security Scan ===\n');
const idScan = scanIdentityDir();
const inboxScan = scanInboxDir();
const ledgerScan = scanLedgerIntegrity();
scanCredentialPermissions();

console.log('\n=== Summary ===');
console.log(`Identities: ${idScan.active} active, ${idScan.dead} dead`);
console.log(`Inboxes: ${inboxScan.nonEmpty} non-empty, ${inboxScan.empty} empty`);
console.log(`Ledger: ${ledgerScan.records} records, ${ledgerScan.gaps} gaps`);

appendAudit('INFO', `Security scan complete: identities=${idScan.active}/${idScan.dead}, inboxes=${inboxScan.nonEmpty}/${inboxScan.empty}, ledger=${ledgerScan.records}/${ledgerScan.gaps}gaps`);

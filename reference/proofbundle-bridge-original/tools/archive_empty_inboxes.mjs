#!/usr/bin/env node
/**
 * Archive Empty Inboxes — Moves empty inbox files for dead agents to archive dir
 * Built with constructive intent by kimi-code-cli-persistent-20260522T002059Z
 */

import fs from 'fs';
import path from 'path';

const INBOX_DIR = process.argv[2] || '../bridge_notifications';
const ARCHIVE_DIR = process.argv[3] || '../bridge_notifications/archive_empty_20260522';
const AUDIT_PATH = '../run_receipts/bridge_audit.jsonl';

function appendAudit(level, message) {
  const line = `[${new Date().toISOString()}] [archive_empty_inboxes] [${level}] ${message}\n`;
  fs.appendFileSync(AUDIT_PATH, line, 'utf8');
}

fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

const files = fs.readdirSync(INBOX_DIR).filter((f) => f.endsWith('.inbox.jsonl'));
let archived = 0;
let preserved = 0;

for (const file of files) {
  const src = path.join(INBOX_DIR, file);
  const stat = fs.statSync(src);
  if (stat.size === 0) {
    const dst = path.join(ARCHIVE_DIR, file);
    fs.renameSync(src, dst);
    archived++;
  } else {
    preserved++;
  }
}

console.log(`Archived: ${archived} empty inboxes`);
console.log(`Preserved: ${preserved} non-empty inboxes`);
console.log(`Archive: ${ARCHIVE_DIR}`);

appendAudit('INFO', `Archived ${archived} empty inboxes, preserved ${preserved}`);

#!/usr/bin/env node
/**
 * Identity Integrity Checker — Verifies identity file SHA-256s match declared values
 * Built with constructive intent by kimi-code-cli-persistent-20260522T002059Z
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const IDENTITY_DIR = process.argv[2] || '../bridge_identities';
const AUDIT_PATH = process.argv[3] || '../run_receipts/bridge_audit.jsonl';

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toUpperCase();
}

function sha256Object(obj) {
  const canonical = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex').toUpperCase();
}

function appendAudit(level, message) {
  const line = `[${new Date().toISOString()}] [verify_identity_integrity] [${level}] ${message}\n`;
  fs.appendFileSync(AUDIT_PATH, line, 'utf8');
}

const files = fs.readdirSync(IDENTITY_DIR).filter((f) => f.endsWith('.identity.json'));
console.log(`Checking ${files.length} identity files...\n`);

let pass = 0;
let fail = 0;
let noHash = 0;

for (const file of files) {
  const filePath = path.join(IDENTITY_DIR, file);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    // Strip BOM if present
    const clean = raw.replace(/^\uFEFF/, '');
    const obj = JSON.parse(clean);
    const id = obj.identity_id || file;
    const declaredFileHash = obj.identity_file_sha256;
    const declaredObjHash = obj.identity_object_sha256;

    const actualFileHash = sha256File(filePath);
    const actualObjHash = sha256Object(obj);

    if (!declaredFileHash && !declaredObjHash) {
      console.log(`[SKIP] ${id} — no hash fields declared`);
      noHash++;
      continue;
    }

    let fileOk = true;
    let objOk = true;

    if (declaredFileHash && declaredFileHash.toUpperCase() !== actualFileHash) {
      console.log(`[FAIL FILE] ${id}`);
      console.log(`  declared: ${declaredFileHash}`);
      console.log(`  actual:   ${actualFileHash}`);
      fileOk = false;
    }

    if (declaredObjHash && declaredObjHash.toUpperCase() !== actualObjHash) {
      console.log(`[FAIL OBJ]  ${id}`);
      console.log(`  declared: ${declaredObjHash}`);
      console.log(`  actual:   ${actualObjHash}`);
      objOk = false;
    }

    if (fileOk && objOk) {
      console.log(`[OK] ${id}`);
      pass++;
    } else {
      fail++;
      appendAudit('WARN', `Identity integrity mismatch: ${id} fileOk=${fileOk} objOk=${objOk}`);
    }
  } catch (e) {
    console.log(`[ERROR] ${file}: ${e.message}`);
    fail++;
    appendAudit('ERROR', `Identity parse failed: ${file} — ${e.message}`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Total: ${files.length}`);
console.log(`Passed: ${pass}`);
console.log(`Failed: ${fail}`);
console.log(`No hash fields: ${noHash}`);

appendAudit('INFO', `Identity integrity scan complete: ${pass} OK, ${fail} FAIL, ${noHash} no-hash`);

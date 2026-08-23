#!/usr/bin/env node
/**
 * Identity Hash Augmenter — Creates new identity files with SHA-256 hash fields
 * Without modifying existing files (working copy pattern).
 * Built with constructive intent by kimi-code-cli-persistent-20260522T002059Z
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const IDENTITY_DIR = process.argv[2] || '../bridge_identities';
const OUTPUT_DIR = process.argv[3] || '../bridge_identities/with_hashes_20260522';

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toUpperCase();
}

function sha256Object(obj) {
  const canonical = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex').toUpperCase();
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const files = fs.readdirSync(IDENTITY_DIR).filter((f) => f.endsWith('.identity.json'));
console.log(`Processing ${files.length} identity files...\n`);

let created = 0;
let skipped = 0;

for (const file of files) {
  const srcPath = path.join(IDENTITY_DIR, file);
  const dstPath = path.join(OUTPUT_DIR, file);
  
  try {
    const raw = fs.readFileSync(srcPath, 'utf8').replace(/^\uFEFF/, '');
    const obj = JSON.parse(raw);
    
    if (obj.identity_file_sha256 && obj.identity_object_sha256) {
      skipped++;
      continue;
    }
    
    const fileHash = sha256File(srcPath);
    const objHash = sha256Object(obj);
    
    const augmented = {
      ...obj,
      identity_file_sha256: fileHash,
      identity_object_sha256: objHash,
      hash_augmented_at_utc: new Date().toISOString(),
      hash_augmented_by: 'kimi-code-cli-persistent-20260522T002059Z',
    };
    
    fs.writeFileSync(dstPath, JSON.stringify(augmented, null, 2), 'utf8');
    console.log(`[CREATED] ${file}`);
    console.log(`  file_hash: ${fileHash}`);
    console.log(`  obj_hash:  ${objHash}`);
    created++;
  } catch (e) {
    console.log(`[ERROR] ${file}: ${e.message}`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Total: ${files.length}`);
console.log(`Created (augmented): ${created}`);
console.log(`Skipped (already has hashes): ${skipped}`);
console.log(`Output: ${OUTPUT_DIR}`);

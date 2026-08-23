import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OTS_DIR = process.argv[2] || 'sequence_ots_20260516';
const RECEIPTS_DIR = path.join(OTS_DIR, 'submit_receipts');
const SAMPLE_SIZE = parseInt(process.argv[3], 10) || 5;

function listOtsFiles() {
  return fs.readdirSync(OTS_DIR)
    .filter(f => f.endsWith('.ots'))
    .map(f => path.join(OTS_DIR, f));
}

function listReceiptFiles() {
  if (!fs.existsSync(RECEIPTS_DIR)) return [];
  return fs.readdirSync(RECEIPTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(RECEIPTS_DIR, f));
}

function parseReceipt(receiptPath) {
  try {
    const data = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    const files = [];
    if (data && typeof data === 'object') {
      if (Array.isArray(data.written)) {
        for (const entry of data.written) {
          if (entry && entry.ots_path) {
            files.push(path.basename(entry.ots_path));
          }
        }
      }
    }
    return files;
  } catch (e) {
    return [];
  }
}

console.log('=== OTS Coverage Verification ===\n');

const otsFiles = listOtsFiles();
console.log(`Total .ots files: ${otsFiles.length}`);

const receiptFiles = listReceiptFiles();
console.log(`Total receipt files: ${receiptFiles.length}`);

const coveredFiles = new Set();
for (const receipt of receiptFiles) {
  const files = parseReceipt(receipt);
  for (const f of files) {
    coveredFiles.add(path.basename(f));
  }
}

console.log(`Unique files covered by receipts: ${coveredFiles.size}`);

const uncovered = otsFiles.filter(f => !coveredFiles.has(path.basename(f)));
console.log(`Uncovered .ots files: ${uncovered.length}`);

if (uncovered.length > 0) {
  console.log('\nFirst 10 uncovered files:');
  uncovered.slice(0, 10).forEach(f => console.log(`  ${path.basename(f)}`));
}

// Sample verification
console.log(`\n=== Sample Verification (random ${SAMPLE_SIZE}) ===`);
const sample = otsFiles.sort(() => 0.5 - Math.random()).slice(0, SAMPLE_SIZE);
for (const otsFile of sample) {
  try {
    const result = execSync(`ots verify "${otsFile}" 2>&1`, { encoding: 'utf8', timeout: 30000 });
    console.log(`  [OK] ${path.basename(otsFile)}`);
  } catch (e) {
    const msg = e.stdout || e.message || 'unknown error';
    console.log(`  [FAIL] ${path.basename(otsFile)}: ${msg.split('\n')[0]}`);
  }
}

console.log('\n=== Summary ===');
console.log(`Coverage: ${coveredFiles.size}/${otsFiles.length} (${((coveredFiles.size / otsFiles.length) * 100).toFixed(1)}%)`);
console.log(`Uncovered: ${uncovered.length}`);
console.log(`Receipts: ${receiptFiles.length}`);

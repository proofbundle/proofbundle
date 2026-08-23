import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const LEDGER_PATH = process.argv[2] || '../ledger.jsonl';
const SEGMENT_SIZE = parseInt(process.argv[3], 10) || 50;
const OUT_PATH = process.argv[4] || '../bridge_state/ledger_merkle_segments.json';

function sha256(text, encoding = 'utf8') {
  return crypto.createHash('sha256').update(text, encoding).digest('hex');
}

function sha256HexPair(left, right) {
  return crypto.createHash('sha256').update(left + right, 'hex').digest('hex');
}

function buildMerkleRoot(leaves) {
  let level = leaves.slice();
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left;
      next.push(sha256HexPair(left, right));
    }
    level = next;
  }
  return level[0];
}

console.log(`Reading ledger: ${LEDGER_PATH}`);
const rawLedger = fs.readFileSync(LEDGER_PATH, 'utf8');
const lines = rawLedger.split(/\r?\n/);
console.log(`Total ledger lines: ${lines.filter((line) => line.trim()).length}`);

const segments = [];
let currentSegment = [];
let validRecords = 0;
let skippedRecords = 0;
let firstSkipped = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  let record;
  try {
    record = JSON.parse(line);
  } catch (error) {
    skippedRecords += 1;
    firstSkipped ||= { line_number: i + 1, error: error.message };
    continue;
  }

  const recordHash = record.record_sha256 || record.proofbundle_verifier?.gate_sha256 || sha256(line);
  currentSegment.push(recordHash);
  validRecords += 1;

  if (currentSegment.length === SEGMENT_SIZE) {
    const segmentRoot = buildMerkleRoot(currentSegment);
    segments.push({
      segment_index: segments.length,
      start_sequence: segments.length * SEGMENT_SIZE + 1,
      end_sequence: segments.length * SEGMENT_SIZE + currentSegment.length,
      record_count: currentSegment.length,
      segment_root: segmentRoot,
      leaf_hashes: currentSegment,
    });
    currentSegment = [];
  }
}

if (currentSegment.length > 0) {
  const segmentRoot = buildMerkleRoot(currentSegment);
  segments.push({
    segment_index: segments.length,
    start_sequence: segments.length * SEGMENT_SIZE + 1,
    end_sequence: segments.length * SEGMENT_SIZE + currentSegment.length,
    record_count: currentSegment.length,
    segment_root: segmentRoot,
    leaf_hashes: currentSegment,
  });
}

const cumulativeRoot = buildMerkleRoot(segments.map(s => s.segment_root));

const report = {
  generated_at_utc: new Date().toISOString(),
  ledger_path: LEDGER_PATH,
  total_records: validRecords,
  skipped_records: skippedRecords,
  first_skipped_record: firstSkipped,
  segment_size: SEGMENT_SIZE,
  segment_count: segments.length,
  cumulative_merkle_root: cumulativeRoot,
  segments: segments,
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2), 'utf8');

console.log(`\nMerkle computation complete:`);
console.log(`  Total records: ${validRecords}`);
console.log(`  Skipped records: ${skippedRecords}`);
console.log(`  Segment size: ${SEGMENT_SIZE}`);
console.log(`  Segments: ${segments.length}`);
console.log(`  Cumulative root: ${cumulativeRoot}`);
console.log(`  First 10 segment roots:`);
segments.slice(0, 10).forEach(s => {
  console.log(`    [${s.segment_index}] seq ${s.start_sequence}-${s.end_sequence}: ${s.segment_root}`);
});
if (segments.length > 10) {
  console.log(`    ... (${segments.length - 10} more segments)`);
}
console.log(`\nWrote ${OUT_PATH}`);

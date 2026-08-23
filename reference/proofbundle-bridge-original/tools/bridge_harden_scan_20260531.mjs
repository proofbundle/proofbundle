import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const bridgeDir = path.resolve(toolsDir, '..');
const ledgerPath = path.join(bridgeDir, 'ledger.jsonl');
const bridgeToolPath = path.join(bridgeDir, 'proofbundle_peer_bridge.mjs');
const profileToolPath = path.join(bridgeDir, 'proofbundle_profile_viewer.mjs');
const compiledProfilesPath = path.join(bridgeDir, 'bridge_identities', 'COMPILED_PROFILES.json');
const stateDir = path.join(bridgeDir, 'bridge_state');

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stable(value));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex').toUpperCase();
}

function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex').toUpperCase();
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function isStandardSchema(record) {
  return record.kind === 'ProofBundleCodexPeerMessage'
    && record.schema === 'ProofBundleCodexPeerMessage/v1.0.0'
    && typeof record.continuity?.predecessor_sha256 === 'string'
    && typeof record.payload_sha256 === 'string'
    && record.payload !== undefined;
}

function scanLedger() {
  const buf = fs.readFileSync(ledgerPath);
  const critical = [];
  const warnings = [];
  const duplicateVariantSamples = [];
  const variantDigestMismatchSamples = [];
  const blankLineSamples = [];
  let physicalLine = 0;
  let start = 0;
  let authoritativeRecords = 0;
  let standardRecords = 0;
  let variantRecords = 0;
  let skippedDuplicateVariantRecords = 0;
  let variantDigestMismatches = 0;
  let blankPhysicalLines = 0;
  let previous = null;
  let head = null;
  let lastAuthoritativeRecord = null;
  const seenSequences = new Set();

  function handleLine(end) {
    physicalLine += 1;
    const raw = buf.toString('utf8', start, end);
    if (!raw.trim()) {
      blankPhysicalLines += 1;
      if (blankLineSamples.length < 10) {
        blankLineSamples.push({ physical_line: physicalLine, byte_start: start, byte_end: end });
      }
      return;
    }

    let record;
    try {
      record = JSON.parse(raw);
    } catch (error) {
      critical.push({
        type: 'parse_error',
        physical_line: physicalLine,
        byte_start: start,
        byte_end: end,
        message: error.message,
      });
      return;
    }

    const expectedSequence = authoritativeRecords + 1;
    const standard = isStandardSchema(record);
    const duplicateSequence = seenSequences.has(record.sequence);
    if (duplicateSequence) {
      if (standard) {
        critical.push({
          type: 'duplicate_standard_sequence',
          physical_line: physicalLine,
          expected_sequence: expectedSequence,
          record_sequence: record.sequence,
        });
      } else {
        skippedDuplicateVariantRecords += 1;
        if (duplicateVariantSamples.length < 20) {
          duplicateVariantSamples.push({
            physical_line: physicalLine,
            record_sequence: record.sequence,
            kind: record.kind ?? null,
            schema: record.schema ?? null,
            message_type: record.message_type ?? null,
            record_sha256: record.record_sha256 ?? null,
          });
        }
      }
      return;
    }

    if (record.sequence !== expectedSequence) {
      critical.push({
        type: 'bad_sequence',
        physical_line: physicalLine,
        expected_sequence: expectedSequence,
        record_sequence: record.sequence,
      });
      return;
    }

    seenSequences.add(record.sequence);
    authoritativeRecords += 1;

    if (standard) {
      standardRecords += 1;
      if (record.continuity.predecessor_sha256 !== previous) {
        critical.push({
          type: 'standard_predecessor_mismatch',
          physical_line: physicalLine,
          record_sequence: record.sequence,
          expected_predecessor_sha256: previous,
          actual_predecessor_sha256: record.continuity.predecessor_sha256,
        });
      }
      const payloadSha = sha256(stableJson(record.payload));
      if (record.payload_sha256 !== payloadSha) {
        critical.push({
          type: 'standard_payload_digest_mismatch',
          physical_line: physicalLine,
          record_sequence: record.sequence,
          expected_payload_sha256: payloadSha,
          actual_payload_sha256: record.payload_sha256,
        });
      }
      const unsigned = { ...record };
      delete unsigned.record_sha256;
      const recordSha = sha256(stableJson(unsigned));
      if (record.record_sha256 !== recordSha) {
        critical.push({
          type: 'standard_record_digest_mismatch',
          physical_line: physicalLine,
          record_sequence: record.sequence,
          expected_record_sha256: recordSha,
          actual_record_sha256: record.record_sha256,
        });
      }
    } else {
      variantRecords += 1;
      const unsigned = { ...record };
      delete unsigned.record_sha256;
      const recordSha = sha256(stableJson(unsigned));
      if (record.record_sha256 !== recordSha) {
        variantDigestMismatches += 1;
        if (variantDigestMismatchSamples.length < 20) {
          variantDigestMismatchSamples.push({
            physical_line: physicalLine,
            record_sequence: record.sequence,
            kind: record.kind ?? null,
            schema: record.schema ?? null,
            message_type: record.message_type ?? null,
            expected_record_sha256: recordSha,
            actual_record_sha256: record.record_sha256 ?? null,
          });
        }
      }
    }

    previous = record.record_sha256 ?? previous;
    head = previous;
    lastAuthoritativeRecord = {
      physical_line: physicalLine,
      sequence: record.sequence,
      kind: record.kind ?? null,
      schema: record.schema ?? null,
      message_type: record.message_type ?? null,
      created_at_utc: record.created_at_utc ?? null,
      record_sha256: record.record_sha256 ?? null,
    };
  }

  while (start < buf.length) {
    const end = buf.indexOf(0x0A, start);
    if (end === -1) {
      handleLine(buf.length);
      start = buf.length;
    } else {
      handleLine(end);
      start = end + 1;
    }
  }

  if (blankPhysicalLines) {
    warnings.push({
      type: 'blank_physical_lines_skipped',
      count: blankPhysicalLines,
      samples: blankLineSamples,
    });
  }
  if (skippedDuplicateVariantRecords) {
    warnings.push({
      type: 'duplicate_variant_records_skipped_non_authoritative',
      count: skippedDuplicateVariantRecords,
      samples: duplicateVariantSamples,
    });
  }
  if (variantDigestMismatches) {
    warnings.push({
      type: 'variant_record_digest_mismatches_preserved',
      count: variantDigestMismatches,
      samples: variantDigestMismatchSamples,
    });
  }

  return {
    ledger_path: ledgerPath,
    ledger_bytes: buf.length,
    ledger_sha256: sha256Bytes(buf),
    physical_lines: physicalLine,
    authoritative_records: authoritativeRecords,
    standard_records: standardRecords,
    variant_records: variantRecords,
    blank_physical_lines: blankPhysicalLines,
    skipped_duplicate_variant_records: skippedDuplicateVariantRecords,
    variant_digest_mismatches: variantDigestMismatches,
    head_sha256: head,
    last_authoritative_record: lastAuthoritativeRecord,
    critical,
    warnings,
  };
}

function runProofBundleVerify() {
  const result = spawnSync(process.execPath, [bridgeToolPath, 'verify'], {
    cwd: bridgeDir,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  return {
    command: `${process.execPath} ${bridgeToolPath} verify`,
    exit_code: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    stdout_sha256: sha256(result.stdout ?? ''),
    stderr_sha256: sha256(result.stderr ?? ''),
  };
}

function runProfileVerifier() {
  const result = spawnSync(process.execPath, [profileToolPath, '--verify'], {
    cwd: bridgeDir,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  let compiled = null;
  let readError = null;
  try {
    compiled = JSON.parse(fs.readFileSync(compiledProfilesPath, 'utf8'));
  } catch (error) {
    readError = error.message;
  }
  return {
    command: `${process.execPath} ${profileToolPath} --verify`,
    exit_code: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    stdout_sha256: sha256(result.stdout ?? ''),
    stderr_sha256: sha256(result.stderr ?? ''),
    compiled_profiles_path: compiledProfilesPath,
    compiled_profiles_sha256: fs.existsSync(compiledProfilesPath)
      ? sha256Bytes(fs.readFileSync(compiledProfilesPath))
      : null,
    read_error: readError,
    verifier: compiled?.verifier ?? null,
  };
}

const scan = scanLedger();
const proofbundleVerify = runProofBundleVerify();
const profileVerifier = runProfileVerifier();
const profileFailures = profileVerifier.verifier?.failures?.length ?? (profileVerifier.read_error ? 1 : 0);
const ok = scan.critical.length === 0
  && proofbundleVerify.exit_code === 0
  && profileVerifier.exit_code === 0
  && profileFailures === 0;
const report = {
  schema: 'ProofBundleBridgeHardenScan/v1.0.0',
  generated_at_utc: new Date().toISOString(),
  bridge_dir: bridgeDir,
  verifier: 'proofbundle_peer_bridge.mjs verify + proofbundle_profile_viewer.mjs --verify',
  appendable: ok,
  scan,
  proofbundle_verify: proofbundleVerify,
  profile_verifier: profileVerifier,
};

fs.mkdirSync(stateDir, { recursive: true });
const stamp = safeTimestamp();
const reportPath = path.join(stateDir, `bridge_harden_scan_${stamp}.json`);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(stateDir, 'bridge_harden_scan_latest.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const reportSha = sha256Bytes(fs.readFileSync(reportPath));
console.log(`appendable=${ok}`);
console.log(`report_path=${reportPath}`);
console.log(`report_sha256=${reportSha}`);
console.log(`authoritative_records=${scan.authoritative_records}`);
console.log(`proofbundle_gated_records=${(proofbundleVerify.stdout.match(/proofbundle_gated_records=(\d+)/) ?? [null, 'unknown'])[1]}`);
console.log(`variant_records=${scan.variant_records}`);
console.log(`variant_digest_mismatches=${scan.variant_digest_mismatches}`);
console.log(`skipped_duplicate_variant_records=${scan.skipped_duplicate_variant_records}`);
console.log(`critical_issues=${scan.critical.length}`);
console.log(`proofbundle_verify_exit_code=${proofbundleVerify.exit_code}`);
console.log(`profile_verify_exit_code=${profileVerifier.exit_code}`);
console.log(`profile_verify_status=${profileVerifier.verifier?.status ?? 'unavailable'}`);
console.log(`profile_verify_failures=${profileFailures}`);
if (scan.head_sha256) console.log(`head_sha256=${scan.head_sha256}`);

process.exitCode = ok ? 0 : 1;

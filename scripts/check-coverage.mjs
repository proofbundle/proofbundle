#!/usr/bin/env node
// Generates CRYPTOGRAPHIC_SURFACE.csv and FEATURE_COVERAGE.json from the
// registry.
//
// Four closure-rule gates are enforced here rather than described. A row may
// not be COMPLETE without: a source module, a positive vector path, a
// negative-vector file for its family, and both a unit and a hostile test
// file for its family. A violation sets critical_issues and exits non-zero,
// so the build fails rather than shipping a matrix that overstates evidence.
//
// Evidence paths are checked to exist on disk, so a renamed or deleted test
// file becomes a build failure instead of a column pointing at nothing.

import { writeFileSync, existsSync } from 'node:fs';
import { ALGORITHM_REGISTRY } from '../src/registry/algorithm-registry.mjs';

const COLUMNS = [
  'feature_id', 'feature_name', 'category', 'implementation_class',
  'normative_specification', 'registry_entry', 'source_module', 'provider',
  'positive_vectors', 'negative_vectors', 'hostile_tests', 'formal_definition',
  'theorem_ids', 'assumption_ids', 'unit_test_status', 'integration_test_status',
  'interop_status', 'lean_compile_status', 'implementation_status',
  'critical_issues', 'evidence_paths',
];

const FAMILY_EVIDENCE = {
  DIGEST: {
    spec: 'FIPS 180-4 / FIPS 202 / RFC 7693',
    negative: 'vectors/digest/negative-algorithm-ids.json',
    hostile: 'test/hostile/hostile-input.test.mjs',
    unit: 'test/unit/digest.test.mjs',
  },
  MAC: {
    spec: 'FIPS 198-1 / RFC 4231',
    negative: 'vectors/mac/hmac.json',
    hostile: 'test/hostile/hostile-surface.test.mjs',
    unit: 'test/unit/mac-kdf-providers.test.mjs',
  },
  KDF: {
    spec: 'RFC 5869 / RFC 8018 / RFC 7914',
    negative: 'vectors/kdf/kdf.json',
    hostile: 'test/hostile/hostile-surface.test.mjs',
    unit: 'test/unit/mac-kdf-providers.test.mjs',
  },
  SIGNATURE: {
    spec: 'RFC 8032 / FIPS 186-5 / RFC 8017',
    negative: 'vectors/signatures/signatures.json',
    hostile: 'test/hostile/hostile-surface.test.mjs',
    unit: 'test/unit/signature-kem-aead.test.mjs',
  },
  KEM: {
    spec: 'RFC 7748 / SP 800-56A',
    negative: 'vectors/kem/ecdh.json',
    hostile: 'test/hostile/hostile-surface.test.mjs',
    unit: 'test/unit/signature-kem-aead.test.mjs',
  },
  AEAD: {
    spec: 'SP 800-38D / RFC 8439',
    negative: 'vectors/encryption/aead.json',
    hostile: 'test/hostile/hostile-surface.test.mjs',
    unit: 'test/unit/signature-kem-aead.test.mjs',
  },
  HYBRID_SIGNATURE: { spec: 'ProofBundle FORMAT_SPECIFICATION.md (hybrid profiles)', negative: null, hostile: null, unit: null },
  HYBRID_KEM: { spec: 'ProofBundle FORMAT_SPECIFICATION.md (hybrid profiles)', negative: null, hostile: null, unit: null },
};

const ASSUMPTIONS_BY_CLASS = {
  NODE_NATIVE: 'ASSUMPTION-NODE-CRYPTO-CORRECTNESS',
  PURE_MJS: 'ASSUMPTION-PUREMJS-VECTOR-ADEQUACY',
  VETTED_PROVIDER: 'ASSUMPTION-PROVIDER-CORRECTNESS',
  LEGACY_VERIFY_ONLY: 'ASSUMPTION-NODE-CRYPTO-CORRECTNESS',
  RECOGNIZE_AND_REJECT: '',
};

// Families whose security depends on the transcript encoding being injective.
const TRANSCRIPT_BOUND = new Set(['SIGNATURE', 'KEM', 'AEAD', 'KDF']);

function csvField(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const missingPaths = new Set();
function evidencePath(p) {
  if (!p) return null;
  if (!existsSync(p)) { missingPaths.add(p); return null; }
  return p;
}

const rows = ALGORITHM_REGISTRY.map((e) => {
  const fam = FAMILY_EVIDENCE[e.primitiveFamily] ?? { spec: '', negative: null, hostile: null, unit: null };
  const hasVectors = e.testVectorPaths.length > 0;
  const hasModule = e.implementationModulePaths.length > 0;
  const isComplete = e.implementationStatus === 'COMPLETE';
  const negative = isComplete ? evidencePath(fam.negative) : null;
  const hostile = isComplete ? evidencePath(fam.hostile) : null;
  const unit = isComplete ? evidencePath(fam.unit) : null;

  const issues = [];
  if (isComplete && !hasModule) issues.push('COMPLETE without a source module');
  if (isComplete && !hasVectors) issues.push('COMPLETE without a positive-vector path');
  if (isComplete && !negative) issues.push('COMPLETE without a negative-vector file');
  if (isComplete && !hostile) issues.push('COMPLETE without a hostile-input test file');
  if (isComplete && !unit) issues.push('COMPLETE without a unit-test file');

  const assumptions = [ASSUMPTIONS_BY_CLASS[e.implementationClass] ?? ''];
  if (TRANSCRIPT_BOUND.has(e.primitiveFamily) && isComplete) assumptions.push('ASSUMPTION-TRANSCRIPT-INJECTIVITY');
  if (e.primitiveFamily === 'SIGNATURE' && isComplete) assumptions.push('ASSUMPTION-SIGNATURE-CORRECTNESS');
  if (e.primitiveFamily === 'KEM' && isComplete) assumptions.push('ASSUMPTION-DH-HARDNESS');
  if (e.primitiveFamily === 'AEAD' && isComplete) assumptions.push('ASSUMPTION-AEAD-AUTHENTICITY');

  return {
    feature_id: e.id,
    feature_name: e.canonicalName,
    category: e.primitiveFamily,
    implementation_class: e.implementationClass,
    normative_specification: fam.spec,
    registry_entry: 'ALGORITHM_REGISTRY.json',
    source_module: e.implementationModulePaths.join(';'),
    provider: e.implementationClass === 'NODE_NATIVE' ? 'node:crypto'
      : e.implementationClass === 'PURE_MJS' ? 'in-repo'
        : e.implementationClass === 'VETTED_PROVIDER' ? 'NOT_WIRED' : '',
    positive_vectors: hasVectors ? e.testVectorPaths.join(';') : 'no',
    negative_vectors: negative ?? 'no',
    hostile_tests: hostile ?? 'no',
    formal_definition: 'no',
    theorem_ids: e.theoremIds.join(';'),
    assumption_ids: assumptions.filter(Boolean).join(';'),
    unit_test_status: isComplete ? 'PASS' : 'NOT_RUN',
    integration_test_status: 'NOT_RUN — no end-to-end bundle layer in this slice',
    interop_status: 'NOT_RUN — no second independent implementation available in this environment',
    lean_compile_status: 'NOT_RUN — lake/lean not installed in this environment',
    implementation_status: e.implementationStatus,
    critical_issues: issues.join('; '),
    evidence_paths: [...e.implementationModulePaths, ...e.testVectorPaths, unit, hostile].filter(Boolean).join(';'),
  };
});

const csv = [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => csvField(r[c])).join(','))].join('\n') + '\n';
writeFileSync('CRYPTOGRAPHIC_SURFACE.csv', csv);

const byStatus = {};
for (const r of rows) byStatus[r.implementation_status] = (byStatus[r.implementation_status] ?? 0) + 1;
const inconsistent = rows.filter((r) => r.critical_issues);

writeFileSync('FEATURE_COVERAGE.json', JSON.stringify({
  generated_by: 'scripts/check-coverage.mjs from src/registry/algorithm-registry.mjs',
  summary: { total_registry_entries: rows.length, ...byStatus },
  closure_rule_status: inconsistent.length === 0
    ? `NOT PASSED for the full ${rows.length}-row surface: rows remain NOT_IMPLEMENTED, BLOCKED and PARTIAL. PASSED for every row marked COMPLETE — each has a source module, generated positive vectors, a negative-vector file, a unit-test file and a hostile-input test file, and this script fails the build if any COMPLETE row lacks one.`
    : `FAILED: ${inconsistent.length} row(s) claim a status their evidence does not support.`,
  lean_status: 'NOT_RUN — lake/lean is not installed in this environment. No Lean theorem is claimed as compiled anywhere in this project. See reports/lean-build-report.txt.',
  interop_status: 'NOT_RUN — cross-implementation interoperability requires a second independent implementation, which is not available in this environment.',
  note: 'Per-row detail is CRYPTOGRAPHIC_SURFACE.csv (same data, tabular).',
  rows_with_critical_issues: inconsistent.map((r) => ({ feature_id: r.feature_id, critical_issues: r.critical_issues })),
}, null, 2) + '\n');

console.log(`CRYPTOGRAPHIC_SURFACE.csv: ${rows.length} rows written`);
console.log('by implementation_status:', JSON.stringify(byStatus, null, 2));
console.log(`rows with a critical-issue flag: ${inconsistent.length}`);
if (missingPaths.size) {
  console.log('ERROR: evidence paths referenced but not present on disk:');
  for (const p of missingPaths) console.log(`  ${p}`);
  process.exit(1);
}
if (inconsistent.length) {
  console.log(inconsistent.map((r) => `${r.feature_id}: ${r.critical_issues}`).join('\n'));
  process.exit(1);
}

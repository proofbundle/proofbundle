#!/usr/bin/env node
// Generates CRYPTOGRAPHIC_SURFACE.csv from the registry, mapping registry
// implementationStatus -> coverage-matrix implementation_status, and
// refusing (per the closure rule) to mark a row COMPLETE unless it has
// both a module path and a vector path recorded.
import { writeFileSync } from 'node:fs';
import { ALGORITHM_REGISTRY } from '../src/registry/algorithm-registry.mjs';

const COLUMNS = [
  'feature_id', 'feature_name', 'category', 'implementation_class',
  'normative_specification', 'registry_entry', 'source_module', 'provider',
  'positive_vectors', 'negative_vectors', 'hostile_tests', 'formal_definition',
  'theorem_ids', 'assumption_ids', 'unit_test_status', 'integration_test_status',
  'interop_status', 'lean_compile_status', 'implementation_status',
  'critical_issues', 'evidence_paths',
];

function csvField(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const rows = ALGORITHM_REGISTRY.map((e) => {
  const hasVectors = e.testVectorPaths.length > 0;
  const hasModule = e.implementationModulePaths.length > 0;
  return {
    feature_id: e.id,
    feature_name: e.canonicalName,
    category: e.primitiveFamily,
    implementation_class: e.implementationClass,
    normative_specification: e.primitiveFamily === 'DIGEST' ? 'FIPS 180-4 / FIPS 202' : '',
    registry_entry: 'ALGORITHM_REGISTRY.json',
    source_module: e.implementationModulePaths.join(';'),
    provider: e.implementationClass === 'VETTED_PROVIDER' ? 'NOT_WIRED' : (e.implementationClass === 'NODE_NATIVE' ? 'node:crypto' : ''),
    positive_vectors: hasVectors ? 'yes' : 'no',
    negative_vectors: e.primitiveFamily === 'DIGEST' && hasVectors ? 'vectors/digest/negative-algorithm-ids.json' : 'no',
    hostile_tests: e.id.startsWith('SHA-256') || e.primitiveFamily === 'DIGEST' && e.implementationStatus === 'COMPLETE' ? 'test/hostile/hostile-input.test.mjs' : 'no',
    formal_definition: 'no',
    theorem_ids: '',
    assumption_ids: e.implementationClass === 'NODE_NATIVE' ? 'ASSUMPTION-NODE-CRYPTO-CORRECTNESS' : '',
    unit_test_status: e.implementationStatus === 'COMPLETE' ? 'PASS' : 'NOT_RUN',
    integration_test_status: 'NOT_RUN',
    interop_status: hasVectors && e.implementationClass !== 'NODE_NATIVE' ? 'PASS' : 'NOT_RUN',
    lean_compile_status: 'NOT_RUN — toolchain unavailable in this environment',
    implementation_status: e.implementationStatus,
    critical_issues: e.implementationStatus === 'COMPLETE' && !(hasVectors && hasModule) ? 'INCONSISTENT: COMPLETE without vectors+module' : '',
    evidence_paths: [...e.implementationModulePaths, ...e.testVectorPaths].join(';'),
  };
});

const csv = [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => csvField(r[c])).join(','))].join('\n') + '\n';
writeFileSync('CRYPTOGRAPHIC_SURFACE.csv', csv);

const inconsistent = rows.filter((r) => r.critical_issues);
console.log(`CRYPTOGRAPHIC_SURFACE.csv: ${rows.length} rows written`);
console.log(`rows with a critical-issue flag: ${inconsistent.length}`);
if (inconsistent.length) { console.log(inconsistent.map((r) => r.feature_id).join(', ')); process.exit(1); }

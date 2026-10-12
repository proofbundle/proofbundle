// SPDX-License-Identifier: GPL-3.0-or-later
// Execute supported native vector shapes against the existing implementation.
// Imported algorithm declarations never activate or execute source code.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { digestBytes, digestBytesXOF, UnknownAlgorithmError, ForbiddenAlgorithmError } from '../src/digest/digest.mjs';
import { canonicalizeValue, strictParseJSON } from '../src/canonical/canonical-json.mjs';
function executeVectors(data) {
const value = JSON.parse(data);
const cases = Array.isArray(value) ? value : ['vectors','test_vectors','cases','tests']
  .map(k => value[k]).find(Array.isArray) || [];
const result = { schema: 'AletheiaVectorExecution/v1', observed_at: new Date().toISOString(),
  source_sha256: createHash('sha256').update(data).digest('hex'), provider: 'ProofBundle src/digest and src/canonical',
  provider_runtime: process.version, passed: 0, failed: 0, unsupported: 0, cases: [] };
for (let index = 0; index < cases.length; index++) {
  const v = cases[index];
  let actual, computed, expected = v.expected_verdict || (v.expected_digest_hex || v.expected_output_hex ? 'VERIFIED' : null);
  try {
    if (typeof v.input_hex === 'string' && typeof v.algorithm === 'string') {
      if (!/^(?:[a-fA-F0-9]{2})*$/.test(v.input_hex)) throw new Error('Malformed input hex');
      const bytes = new Uint8Array(Buffer.from(v.input_hex, 'hex'));
      const output = v.algorithm.startsWith('SHAKE') ? digestBytesXOF(v.algorithm, bytes, v.output_length) : digestBytes(v.algorithm, bytes);
      computed = Buffer.from(output).toString('hex');
      const reference = v.expected_digest_hex || v.expected_output_hex || v.claimed_digest_hex;
      if (!reference) { actual = 'UNSUPPORTED_VECTOR'; }
      else actual = computed === reference ? 'VERIFIED' : 'DIGEST_MISMATCH';
      if (v.recomputed_digest_hex && v.recomputed_digest_hex !== computed) actual = 'REFERENCE_CONFLICT';
    } else if (v.expected_verdict && typeof v.algorithm === 'string' && !v.input_hex) {
      digestBytes(v.algorithm, new Uint8Array()); actual = 'VERIFIED';
    } else if (typeof v.input_text === 'string' && v.canonical_bytes_hex) {
      computed = Buffer.from(canonicalizeValue(strictParseJSON(v.input_text))).toString('hex');
      expected = 'VERIFIED'; actual = computed === v.canonical_bytes_hex ? 'VERIFIED' : 'CANONICAL_MISMATCH';
    } else actual = 'UNSUPPORTED_VECTOR';
  } catch (e) {
    actual = e instanceof UnknownAlgorithmError ? 'UNKNOWN_ALGORITHM' : e instanceof ForbiddenAlgorithmError ? 'FORBIDDEN_ALGORITHM' : 'EXECUTION_ERROR';
  }
  const standing = actual === 'UNSUPPORTED_VECTOR' || !expected ? 'unsupported' : actual === expected ? 'passed' : 'failed';
  result[standing]++;
  result.cases.push({ index, label: v.label || v.id || String(index), expected, actual, computed: computed || null, standing });
}
if (!cases.length) result.unsupported_files = 1;
return result;
}
if (process.argv.includes('--batch')) {
  const manifest = JSON.parse(readFileSync(0));
  const results = manifest.map(source => ({...executeVectors(readFileSync(source.blob_path)),algorithm_id:source.algorithm_id,source_path:source.path}));
  const totals = Object.fromEntries(['passed','failed','unsupported'].map(key=>[key,results.reduce((n,r)=>n+r[key],0)]));
  console.log(JSON.stringify({schema:'ProofBundleArchiveConformanceExecution/v1',observed_at:new Date().toISOString(), provider:'ProofBundle src/digest and src/canonical',results,...totals, scope:'All captured native vector files submitted to this provider. Unsupported source shapes are retained as unsupported; registrations are not execution claims.'}));
} else console.log(JSON.stringify(executeVectors(readFileSync(0))));

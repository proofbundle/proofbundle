// Regression guard: the registry and the dispatchers must agree.
//
// This exists because of a real defect. The registry was updated to mark
// BLAKE2b-512 COMPLETE and pointed at src/digest/blake2.mjs, but the central
// dispatcher in src/digest/digest.mjs had no entry for it — so
// digestBytes('BLAKE2b-512', …) raised UNKNOWN_ALGORITHM while the coverage
// matrix claimed the row was done. A status is only meaningful if the code it
// describes is reachable, so every COMPLETE row is checked for actual
// dispatchability here.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ALGORITHM_REGISTRY } from '../../src/registry/algorithm-registry.mjs';
import { digestBytes, digestBytesXOF, isImplementedDigest } from '../../src/digest/digest.mjs';
import { isImplementedMac } from '../../src/mac/hmac.mjs';
import { isImplementedKdf } from '../../src/kdf/hkdf.mjs';
import { isImplementedPbkdf2 } from '../../src/kdf/pbkdf2.mjs';
import { isImplementedSignature } from '../../src/signature/signature.mjs';
import { isImplementedKem } from '../../src/kem/ecdh.mjs';
import { isImplementedAead } from '../../src/aead/aead.mjs';
import { isImplementedKeyWrap } from '../../src/aead/aes-key-wrap.mjs';
import { isImplementedSp800185 } from '../../src/digest/sp800-185.mjs';

const complete = ALGORITHM_REGISTRY.filter((e) => e.implementationStatus === 'COMPLETE');
const legacyVerify = ALGORITHM_REGISTRY.filter((e) => e.implementationStatus === 'LEGACY_VERIFY_ONLY');

// Extendable-output and keyed constructions do not have a fixed digest length,
// so the length assertion below skips them by design rather than by accident.
const VARIABLE_LENGTH = new Set(['SHAKE128', 'SHAKE256', 'cSHAKE128', 'cSHAKE256', 'KMAC128', 'KMAC256', 'TupleHash128', 'TupleHash256', 'ParallelHash128', 'ParallelHash256']);

// Rows that are reached through a dedicated entry point rather than their
// family's main dispatcher. Each is named explicitly so a row cannot slip into
// this list by pattern-matching.
function reachable(e) {
  if (isImplementedSp800185(e.id)) return true;              // src/digest/sp800-185.mjs
  if (isImplementedKeyWrap(e.id)) return true;               // src/aead/aes-key-wrap.mjs
  if (e.id === 'ProofBundle-subkey-derivation') return true; // src/kdf/subkey-derivation.mjs
  if (e.id === 'scrypt') return true;                        // src/kdf/scrypt.mjs
  if (isImplementedPbkdf2(e.id)) return true;                // src/kdf/pbkdf2.mjs
  switch (e.primitiveFamily) {
    case 'DIGEST': return VARIABLE_LENGTH.has(e.id) ? true : isImplementedDigest(e.id);
    case 'MAC': return isImplementedMac(e.id);
    case 'KDF': return isImplementedKdf(e.id);
    case 'SIGNATURE': return isImplementedSignature(e.id);
    case 'KEM': return isImplementedKem(e.id);
    case 'AEAD': return isImplementedAead(e.id);
    // No hybrid dispatcher exists in this build, so no HYBRID_* row is
    // reachable. Returning true here would have let a recognize-and-reject
    // hybrid profile look dispatchable — which this test caught.
    case 'HYBRID_SIGNATURE': case 'HYBRID_KEM': return false;
    default: return false;
  }
}

test('every COMPLETE row is reachable through a dispatcher', () => {
  const unreachable = complete.filter((e) => !reachable(e)).map((e) => `${e.id} (${e.primitiveFamily})`);
  assert.deepEqual(unreachable, [], `registry marks these COMPLETE but no dispatcher accepts them: ${unreachable.join(', ')}`);
});

test('every LEGACY_VERIFY_ONLY row is still reachable for verification', () => {
  const unreachable = legacyVerify.filter((e) => !reachable(e)).map((e) => `${e.id} (${e.primitiveFamily})`);
  assert.deepEqual(unreachable, [], `verify-only rows must remain computable: ${unreachable.join(', ')}`);
});

test('every fixed-length COMPLETE digest produces its declared length', () => {
  for (const e of complete.filter((x) => x.primitiveFamily === 'DIGEST')) {
    if (VARIABLE_LENGTH.has(e.id)) {
      // Variable-output: assert the caller-requested length is honoured instead.
      if (e.id === 'SHAKE128' || e.id === 'SHAKE256') {
        assert.equal(digestBytesXOF(e.id, new Uint8Array(1), 47).length, 47, `${e.id} did not honour the requested output length`);
      }
      continue;
    }
    if (typeof e.digestLength !== 'number') continue;
    const out = digestBytes(e.id, new Uint8Array(1));
    assert.equal(out.length, e.digestLength, `${e.id} produced ${out.length} bytes, registry declares ${e.digestLength}`);
  }
});

test('every module and vector path referenced by the registry exists on disk', () => {
  const missing = [];
  for (const e of ALGORITHM_REGISTRY) {
    for (const p of [...e.implementationModulePaths, ...e.testVectorPaths]) {
      if (!existsSync(p)) missing.push(`${e.id} -> ${p}`);
    }
  }
  assert.deepEqual(missing, [], `registry references paths that do not exist: ${missing.join(', ')}`);
});

test('no row is COMPLETE without both a module and a vector path', () => {
  const bad = complete.filter((e) => e.implementationModulePaths.length === 0 || e.testVectorPaths.length === 0);
  assert.deepEqual(bad.map((e) => e.id), []);
});

test('every registry id is unique', () => {
  const ids = ALGORITHM_REGISTRY.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every non-COMPLETE row states a reason', () => {
  // A row that is not done must say why. An empty note on a NOT_IMPLEMENTED
  // row is exactly the "undisclosed gap" the coverage matrix exists to prevent.
  const silent = ALGORITHM_REGISTRY
    .filter((e) => ['NOT_IMPLEMENTED', 'BLOCKED', 'RECOGNIZE_ONLY', 'PARTIAL'].includes(e.implementationStatus))
    .filter((e) => !e.interoperabilityNotes || e.interoperabilityNotes.length < 20)
    .map((e) => e.id);
  assert.deepEqual(silent, [], `these rows are incomplete but give no reason: ${silent.join(', ')}`);
});

test('recognize-and-reject digests are refused by the digest dispatcher', () => {
  const digestRejects = ALGORITHM_REGISTRY.filter(
    (e) => e.implementationClass === 'RECOGNIZE_AND_REJECT' && e.primitiveFamily === 'DIGEST',
  );
  assert.ok(digestRejects.length >= 7);
  for (const e of digestRejects) {
    assert.throws(
      () => digestBytes(e.id, new Uint8Array(1)),
      (err) => err.name === 'ForbiddenAlgorithmError' || err.verdict === 'FORBIDDEN_ALGORITHM',
      `${e.id} was not refused`,
    );
  }
});

test('recognize-and-reject rows in other families are never dispatchable', () => {
  // These are not digests, so digestBytes is the wrong probe. The property
  // that matters is that no family dispatcher claims to implement them.
  const others = ALGORITHM_REGISTRY.filter(
    (e) => e.implementationClass === 'RECOGNIZE_AND_REJECT' && e.primitiveFamily !== 'DIGEST',
  );
  assert.ok(others.length > 50, `expected the broken/superseded PQ and legacy rows, got ${others.length}`);
  const dispatchable = others.filter(reachable).map((e) => e.id);
  assert.deepEqual(dispatchable, [], `these are recognize-and-reject but a dispatcher accepts them: ${dispatchable.join(', ')}`);
});

test('no NOT_IMPLEMENTED or BLOCKED row carries vector evidence it cannot back', () => {
  const overclaiming = ALGORITHM_REGISTRY
    .filter((e) => ['NOT_IMPLEMENTED', 'BLOCKED'].includes(e.implementationStatus))
    .filter((e) => e.testVectorPaths.length > 0)
    .map((e) => e.id);
  assert.deepEqual(overclaiming, [], `these rows are not implemented but cite vectors: ${overclaiming.join(', ')}`);
});

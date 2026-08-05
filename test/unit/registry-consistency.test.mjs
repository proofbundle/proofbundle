// Regression guard: the registry and the dispatchers must agree.
//
// This exists because of a real defect found during the slice-2 build. The
// registry was updated to mark BLAKE2b-512 COMPLETE and pointed at
// src/digest/blake2.mjs, but the central dispatcher in src/digest/digest.mjs
// had no entry for it — so `digestBytes('BLAKE2b-512', ...)` raised
// UNKNOWN_ALGORITHM while the coverage matrix claimed the row was done.
// A status is only meaningful if the code it describes is reachable, so
// every COMPLETE row is checked here for actual dispatchability.

import test from 'node:test';
import assert from 'node:assert/strict';
import { ALGORITHM_REGISTRY } from '../../src/registry/algorithm-registry.mjs';
import { digestBytes, digestBytesXOF, isImplementedDigest } from '../../src/digest/digest.mjs';
import { isImplementedMac } from '../../src/mac/hmac.mjs';
import { isImplementedKdf } from '../../src/kdf/hkdf.mjs';
import { isImplementedSignature } from '../../src/signature/signature.mjs';
import { isImplementedKem } from '../../src/kem/ecdh.mjs';
import { isImplementedAead } from '../../src/aead/aead.mjs';
import { existsSync } from 'node:fs';

const complete = ALGORITHM_REGISTRY.filter((e) => e.implementationStatus === 'COMPLETE');
const XOF = new Set(['SHAKE128', 'SHAKE256']);
// Registered under a family for cataloguing, but reached through a dedicated
// entry point rather than that family's dispatcher.
const DEDICATED_ENTRY_POINT = new Set(['ProofBundle-subkey-derivation', 'PBKDF2-HMAC-SHA-256', 'PBKDF2-HMAC-SHA-512', 'scrypt']);

test('every COMPLETE row is reachable through its family dispatcher', () => {
  const unreachable = [];
  for (const e of complete) {
    if (DEDICATED_ENTRY_POINT.has(e.id)) continue;
    let ok;
    switch (e.primitiveFamily) {
      case 'DIGEST': ok = XOF.has(e.id) ? true : isImplementedDigest(e.id); break;
      case 'MAC': ok = isImplementedMac(e.id); break;
      case 'KDF': ok = isImplementedKdf(e.id); break;
      case 'SIGNATURE': ok = isImplementedSignature(e.id); break;
      case 'KEM': ok = isImplementedKem(e.id); break;
      case 'AEAD': ok = isImplementedAead(e.id); break;
      default: ok = true;
    }
    if (!ok) unreachable.push(`${e.id} (${e.primitiveFamily})`);
  }
  assert.deepEqual(unreachable, [], `registry marks these COMPLETE but no dispatcher accepts them: ${unreachable.join(', ')}`);
});

test('every COMPLETE digest actually produces its declared digest length', () => {
  for (const e of complete.filter((x) => x.primitiveFamily === 'DIGEST')) {
    const out = XOF.has(e.id) ? digestBytesXOF(e.id, new Uint8Array(1), 32) : digestBytes(e.id, new Uint8Array(1));
    if (typeof e.digestLength === 'number') {
      assert.equal(out.length, e.digestLength, `${e.id} produced ${out.length} bytes, registry declares ${e.digestLength}`);
    }
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

test('RECOGNIZE_AND_REJECT ids are recognized and always refused', () => {
  for (const e of ALGORITHM_REGISTRY.filter((x) => x.implementationClass === 'RECOGNIZE_AND_REJECT')) {
    assert.throws(() => digestBytes(e.id, new Uint8Array(1)), (err) => err.name === 'ForbiddenAlgorithmError' || err.verdict === 'FORBIDDEN_ALGORITHM', `${e.id} was not refused`);
  }
});

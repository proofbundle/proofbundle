import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSignatureKeyPair,
  generateSignatureKeySet,
  listAlgorithms,
  signBytes,
  signDetached,
  verifyBytes,
  verifyDetached,
} from '../src/index.mjs';

const message = new TextEncoder().encode('ProofBundle signature test');

for (const algorithmId of [
  'pb.sig.ed25519.v1',
  'pb.sig.ecdsa-p256-sha256-p1363.v1',
  'pb.sig.ml-dsa-65.v1',
]) {
  test(`${algorithmId} signs and verifies`, () => {
    const key = generateSignatureKeyPair(algorithmId);
    const signature = signBytes(algorithmId, key.privateKeyDer, message);
    assert.equal(verifyBytes(algorithmId, key.publicKeyDer, message, signature), true);
    signature[0] ^= 1;
    assert.equal(verifyBytes(algorithmId, key.publicKeyDer, message, signature), false);
  });
}

test('hybrid signature requires exact ordered components and all valid signatures', () => {
  const suite = 'pb.sig.hybrid.ed25519+ml-dsa-65.v1';
  const keys = generateSignatureKeySet(suite);
  const envelope = signDetached(suite, keys, message, { purpose: 'test' });
  const publicKeys = keys.map(({ privateKeyDer: _private, ...key }) => key);
  const verified = verifyDetached(envelope, publicKeys, message);
  assert.equal(verified.ok, true);
  assert.deepEqual(
    verified.componentResults.map(({ valid }) => valid),
    [true, true],
  );

  const missing = structuredClone(envelope);
  missing.signatures.pop();
  assert.equal(verifyDetached(missing, publicKeys, message).ok, false);

  const tampered = structuredClone(envelope);
  tampered.signatures[1].value[0] ^= 1;
  const failed = verifyDetached(tampered, publicKeys, message);
  assert.equal(failed.ok, false);
  assert.deepEqual(
    failed.componentResults.map(({ valid }) => valid),
    [true, false],
  );

  const reordered = structuredClone(envelope);
  reordered.signatures.reverse();
  assert.equal(verifyDetached(reordered, publicKeys, message).ok, false);
});

const full = process.env.PROOFBUNDLE_FULL_TESTS === '1';
for (const { id: algorithmId } of listAlgorithms('signature')) {
  test(
    `full signature matrix: ${algorithmId}`,
    { skip: full ? false : 'set PROOFBUNDLE_FULL_TESTS=1' },
    () => {
      const key = generateSignatureKeyPair(algorithmId);
      const signature = signBytes(algorithmId, key.privateKeyDer, message);
      assert.equal(verifyBytes(algorithmId, key.publicKeyDer, message, signature), true);
    },
  );
}

for (const suiteId of [
  'pb.sig.hybrid.ed25519+ml-dsa-65.v1',
  'pb.sig.hybrid.ed448+ml-dsa-87.v1',
  'pb.sig.hybrid.ecdsa-p384+ml-dsa-87.v1',
]) {
  test(
    `full hybrid signature matrix: ${suiteId}`,
    { skip: full ? false : 'set PROOFBUNDLE_FULL_TESTS=1' },
    () => {
      const keys = generateSignatureKeySet(suiteId);
      const publicKeys = keys.map(({ privateKeyDer: _private, ...key }) => key);
      const envelope = signDetached(suiteId, keys, message);
      assert.equal(verifyDetached(envelope, publicKeys, message).ok, true);
    },
  );
}

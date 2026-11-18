import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CallbackSignatureProvider,
  ExternalContainerVerifier,
  SoftwareSignatureProvider,
  createSignedBundle,
  decodeSignedBundle,
  encodeCanonicalCbor,
  generateSignatureKeyPair,
  generateSignatureKeySet,
  verifyBundle,
  verifyLineageGraph,
} from '../src/index.mjs';

const createdAt = '2026-07-28T12:00:00.000Z';
const payloads = {
  'evidence/a.txt': new TextEncoder().encode('alpha'),
  'evidence/b.bin': Uint8Array.of(0, 1, 2, 3),
};
const files = Object.entries(payloads).map(([path, bytes]) => ({ path, bytes }));

test('signed bundle verifies structure, signature, and every supplied payload', () => {
  const profileId = 'pb.profile.interop-2026.v1';
  const keys = [generateSignatureKeyPair('pb.sig.ed25519.v1')];
  const built = createSignedBundle(files, keys, { profileId, createdAt });
  const verified = verifyBundle(built.bytes, { payloads });
  assert.equal(verified.ok, true);
  assert.equal(verified.verdict, 'verified');
  assert.equal(verified.verifiedScope, 'manifest-signature-structure-and-payloads');
  assert.equal(verified.entryCount, 2);

  const manifestOnly = verifyBundle(built.bytes);
  assert.equal(manifestOnly.ok, false);
  assert.equal(manifestOnly.verdict, 'missing-side-info');
  assert.equal(manifestOnly.verifiedScope, 'manifest-signature-and-structure');

  const tamperedPayloads = { ...payloads, 'evidence/a.txt': new TextEncoder().encode('ALPHA') };
  assert.equal(verifyBundle(built.bytes, { payloads: tamperedPayloads }).verdict, 'digest-mismatch');
});

test('default provenance profile executes its all-required hybrid signature', () => {
  const profileId = 'pb.profile.provenance-2026.v1';
  const keys = generateSignatureKeySet('pb.sig.hybrid.ed25519+ml-dsa-65.v1');
  const built = createSignedBundle(files, keys, { profileId, createdAt });
  const verified = verifyBundle(built.bundle, { payloads });
  assert.equal(verified.ok, true);
  assert.deepEqual(
    verified.signature.componentResults.map(({ valid }) => valid),
    [true, true],
  );
});

test('bundle decoder rejects signature-envelope tampering', () => {
  const keys = [generateSignatureKeyPair('pb.sig.ed25519.v1')];
  const built = createSignedBundle(files, keys, {
    profileId: 'pb.profile.interop-2026.v1',
    createdAt,
  });
  const decoded = decodeSignedBundle(built.bytes);
  decoded.signature.signatures[0].value[0] ^= 1;
  const result = verifyBundle(encodeCanonicalCbor(decoded), { payloads });
  assert.equal(result.ok, false);
  assert.equal(result.verdict, 'invalid-signature');
});

test('raw timestamp bytes never satisfy a validated timestamp policy by themselves', () => {
  const keys = [generateSignatureKeyPair('pb.sig.ed25519.v1')];
  const built = createSignedBundle(files, keys, {
    profileId: 'pb.profile.interop-2026.v1',
    createdAt,
    timestamps: [{ algorithmId: 'pb.timestamp.rfc3161.v1', token: Uint8Array.of(1) }],
  });
  const missingValidation = verifyBundle(built.bytes, {
    payloads,
    requireTimestampEvidence: true,
  });
  assert.equal(missingValidation.ok, false);
  assert.equal(missingValidation.verdict, 'missing-side-info');

  const validated = verifyBundle(built.bytes, {
    payloads,
    requireTimestampEvidence: true,
    timestampResults: [{ verified: true, authorityId: 'review-test-tsa' }],
  });
  assert.equal(validated.ok, true);
  assert.equal(validated.timestampPolicy.ok, true);
});

test('lineage graph verifies exact CIDs and rejects missing parents', () => {
  const keys = [generateSignatureKeyPair('pb.sig.ed25519.v1')];
  const root = createSignedBundle(files, keys, {
    profileId: 'pb.profile.interop-2026.v1',
    createdAt,
  });
  const child = createSignedBundle(files, keys, {
    profileId: 'pb.profile.interop-2026.v1',
    createdAt: '2026-07-28T12:01:00.000Z',
    parentBundles: [root.manifestCid],
  });
  assert.equal(
    verifyLineageGraph({
      [root.manifestCid]: root.bundle,
      [child.manifestCid]: child.bundle,
    }).ok,
    true,
  );
  assert.equal(
    verifyLineageGraph({ [child.manifestCid]: child.bundle }).verdict,
    'missing-side-info',
  );
});

test('software and callback provider boundaries return raw signatures', async () => {
  const key = generateSignatureKeyPair('pb.sig.ed25519.v1');
  const provider = new SoftwareSignatureProvider(key);
  const signature = await provider.sign(new TextEncoder().encode('provider'));
  assert.ok(signature.byteLength > 0);
  provider.destroy();

  const callback = new CallbackSignatureProvider({
    kind: 'pkcs11',
    key,
    implementationId: 'test-double',
    sign: async () => new Uint8Array(64).fill(1),
  });
  assert.equal((await callback.sign(new Uint8Array(1))).byteLength, 64);
});

test('external container boundary requires the verified payload and protected bytes', async () => {
  const adapter = new ExternalContainerVerifier({
    formatId: 'pb.container.cose-sign1.v1',
    implementationId: 'review-test-double',
    verify: async (container) => ({
      ok: true,
      verdict: 'verified',
      payload: Uint8Array.from(container),
      protectedBytes: Uint8Array.of(0xa0),
    }),
  });
  const result = await adapter.verify(Uint8Array.of(1, 2, 3));
  assert.equal(result.ok, true);
  assert.equal(result.formatId, 'pb.container.cose-sign1.v1');
});

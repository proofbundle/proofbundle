import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EntropyHealthMonitor,
  createDeterministicFixtureDrbg,
  digest,
  listAlgorithms,
  macKmac256,
  osRandomBytes,
  toHex,
} from '../src/index.mjs';

test('fixed-output hash and SHAKE known-answer vectors', () => {
  const empty = new Uint8Array(0);
  assert.equal(
    toHex(digest('pb.hash.sha2-256.v1', empty)),
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  );
  assert.equal(
    toHex(digest('pb.hash.sha2-512-256.v1', empty)),
    'c672b8d1ef56ed28ab87c3622c5114069bdd3ad7b8f9737498d0c01ecef0967a',
  );
  assert.equal(
    toHex(digest('pb.hash.sha3-256.v1', empty)),
    'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
  );
  assert.equal(
    toHex(digest('pb.hash.blake3-256.v1', empty)),
    'af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262',
  );
  assert.equal(
    toHex(digest('pb.xof.shake256.v1', empty, { outputLength: 32 })),
    '46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762f',
  );
});

test('cSHAKE and KMAC bind customization and enforce bounds', () => {
  const message = new TextEncoder().encode('proof');
  const a = digest('pb.xof.cshake256.v1', message, {
    outputLength: 48,
    personalization: new TextEncoder().encode('bundle-a'),
  });
  const b = digest('pb.xof.cshake256.v1', message, {
    outputLength: 48,
    personalization: new TextEncoder().encode('bundle-b'),
  });
  assert.equal(a.byteLength, 48);
  assert.notDeepEqual(a, b);
  assert.throws(
    () => digest('pb.xof.cshake256.v1', message, { outputLength: 32 }),
    { code: 'malformed' },
  );
  assert.equal(macKmac256(new Uint8Array(32).fill(7), message).byteLength, 32);
  assert.throws(() => macKmac256(new Uint8Array(16), message), { code: 'out-of-bounds' });
});

test('registry separates hashes, XOFs, and MACs', () => {
  assert.equal(listAlgorithms('hash').length, 10);
  assert.equal(listAlgorithms('xof').length, 2);
  assert.equal(listAlgorithms('mac').length, 1);
});

test('every registered fixed-output hash returns its declared length', () => {
  const message = new TextEncoder().encode('registry length check');
  for (const algorithm of listAlgorithms('hash')) {
    assert.equal(
      digest(algorithm.id, message).byteLength,
      algorithm.outputLength,
      algorithm.id,
    );
  }
});

test('OS randomness and deterministic fixture DRBG have distinct semantics', () => {
  assert.equal(osRandomBytes(32).byteLength, 32);
  const seed = new Uint8Array(48).map((_, index) => index);
  const left = createDeterministicFixtureDrbg(seed);
  const right = createDeterministicFixtureDrbg(seed);
  assert.deepEqual(left.generate(96), right.generate(96));
  assert.equal(left.metadata.use, 'deterministic-test-and-protocol-fixtures-only');
});

test('raw entropy health monitor fails closed at configured thresholds', () => {
  const monitor = new EntropyHealthMonitor({
    alphabetSize: 2,
    repetitionCutoff: 4,
    windowSize: 8,
    adaptiveCutoff: 7,
  });
  monitor.observe(1);
  monitor.observe(1);
  monitor.observe(1);
  assert.equal(monitor.observe(1).healthy, false);
  assert.throws(() => monitor.assertHealthy(), { code: 'policy-denied' });
});

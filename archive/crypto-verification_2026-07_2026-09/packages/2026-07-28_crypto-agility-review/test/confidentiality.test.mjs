import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decapsulateKem,
  deriveHkdf,
  derivePasswordKey,
  encapsulateKem,
  generateEncryptionRecipient,
  generateKemRecipient,
  openAead,
  openEncryptedEnvelope,
  sealAead,
  sealEncryptedEnvelope,
} from '../src/index.mjs';

const plaintext = new TextEncoder().encode('confidential ProofBundle payload');
const aad = new TextEncoder().encode('protected header');

for (const [algorithmId, nonceLength] of [
  ['pb.aead.aes-256-gcm.v1', 12],
  ['pb.aead.aes-256-gcm-siv.v1', 12],
  ['pb.aead.chacha20-poly1305.v1', 12],
  ['pb.aead.xchacha20-poly1305.v1', 24],
]) {
  test(`${algorithmId} authenticates ciphertext and AAD`, () => {
    const key = new Uint8Array(32).fill(0x42);
    const sealed = sealAead(algorithmId, key, plaintext, {
      aad,
      nonce: new Uint8Array(nonceLength).fill(0x24),
      allowExternalNonce: true,
    });
    assert.deepEqual(openAead(algorithmId, key, sealed, { aad }), plaintext);
    const tampered = structuredClone(sealed);
    tampered.ciphertext[0] ^= 1;
    assert.throws(() => openAead(algorithmId, key, tampered, { aad }), {
      code: 'authentication-failed',
    });
  });
}

for (const kemId of [
  'pb.kem.ml-kem-512.v1',
  'pb.kem.ml-kem-768.v1',
  'pb.kem.ml-kem-1024.v1',
]) {
  test(`${kemId} encapsulates and decapsulates`, () => {
    const recipient = generateKemRecipient(kemId);
    const encapsulated = encapsulateKem(kemId, recipient.publicKey);
    const decapsulated = decapsulateKem(
      kemId,
      recipient.privateKey,
      encapsulated.ciphertext,
    );
    assert.deepEqual(decapsulated, encapsulated.sharedSecret);
  });
}

for (const kemId of [
  'pb.kem.hybrid.x25519+ml-kem-768.v1',
  'pb.kem.hybrid.p384+ml-kem-768.v1',
]) {
  test(`${kemId} binds and combines both ordered component secrets`, () => {
    const recipient = generateKemRecipient(kemId, { allowReviewRequired: true });
    const encapsulated = encapsulateKem(kemId, recipient.publicKey, {
      allowReviewRequired: true,
    });
    const decapsulated = decapsulateKem(
      kemId,
      recipient.privateKey,
      encapsulated.ciphertext,
      { allowReviewRequired: true },
    );
    assert.deepEqual(decapsulated, encapsulated.sharedSecret);
  });
}

test('ML-KEM KEM-DEM envelope round-trips and binds protected metadata', () => {
  const suite = 'pb.enc.ml-kem-768+hkdf-sha512+xchacha20-poly1305.v1';
  const recipient = generateEncryptionRecipient(suite);
  const envelope = sealEncryptedEnvelope(suite, recipient.publicKey, plaintext, {
    additionalProtected: { evidenceType: 'sealed-test' },
    nonce: new Uint8Array(24).fill(9),
    allowExternalNonce: true,
  });
  assert.deepEqual(openEncryptedEnvelope(envelope, recipient.privateKey), plaintext);
  const tampered = structuredClone(envelope);
  tampered.protected[3] ^= 1;
  assert.throws(() => openEncryptedEnvelope(tampered, recipient.privateKey));
});

test('interoperability KEM-DEM profile round-trips ML-KEM, HKDF, and AES-GCM', () => {
  const suite = 'pb.enc.ml-kem-768+hkdf-sha384+aes-256-gcm.v1';
  const recipient = generateEncryptionRecipient(suite);
  const envelope = sealEncryptedEnvelope(suite, recipient.publicKey, plaintext);
  assert.deepEqual(openEncryptedEnvelope(envelope, recipient.privateKey), plaintext);
});

test('review-required hybrid KEM is denied unless explicitly authorized', () => {
  const suite = 'pb.enc.x25519+ml-kem-768+hkdf-sha512+xchacha20-poly1305.v1';
  assert.throws(() => generateEncryptionRecipient(suite), { code: 'policy-denied' });
  const recipient = generateEncryptionRecipient(suite, { allowReviewRequired: true });
  const envelope = sealEncryptedEnvelope(suite, recipient.publicKey, plaintext, {
    allowReviewRequired: true,
    nonce: new Uint8Array(24).fill(7),
    allowExternalNonce: true,
  });
  assert.deepEqual(
    openEncryptedEnvelope(envelope, recipient.privateKey, { allowReviewRequired: true }),
    plaintext,
  );
});

test('HKDF binds salt and non-empty context', () => {
  const ikm = new Uint8Array(32).fill(1);
  const first = deriveHkdf('pb.kdf.hkdf-sha512.v1', ikm, {
    salt: new Uint8Array(64).fill(2),
    info: new TextEncoder().encode('bundle-a'),
    length: 32,
  });
  const second = deriveHkdf('pb.kdf.hkdf-sha512.v1', ikm, {
    salt: new Uint8Array(64).fill(2),
    info: new TextEncoder().encode('bundle-b'),
    length: 32,
  });
  assert.notDeepEqual(first, second);
  assert.throws(
    () =>
      deriveHkdf('pb.kdf.hkdf-sha512.v1', ikm, {
        salt: new Uint8Array(64),
        info: new Uint8Array(0),
        length: 32,
      }),
    { code: 'malformed' },
  );
});

test(
  'full password KDF policy exercise',
  { skip: process.env.PROOFBUNDLE_FULL_TESTS === '1' ? false : 'full test only' },
  () => {
    const password = new TextEncoder().encode('correct horse battery staple');
    const salt = new Uint8Array(16).fill(4);
    assert.equal(
      derivePasswordKey('pb.kdf.argon2id.v1', password, {
        salt,
        profileId: 'pb.argon2id.interactive.v1',
      }).byteLength,
      32,
    );
    assert.equal(
      derivePasswordKey('pb.kdf.pbkdf2-hmac-sha256-legacy.v1', password, {
        salt,
        allowLegacy: true,
        iterations: 600_000,
        length: 32,
      }).byteLength,
      32,
    );
  },
);

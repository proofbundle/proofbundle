import { asBytes, domainSeparated, equalBytes } from './bytes.mjs';
import { decodeCanonicalCbor, encodeCanonicalCbor } from './canonical-cbor.mjs';
import { openAead, sealAead } from './aead.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';
import { digest } from './hashes.mjs';
import { decapsulateKem, encapsulateKem, generateKemRecipient } from './kem.mjs';
import { deriveHkdf } from './kdf.mjs';
import { getAlgorithm } from './registry.mjs';

const ENCRYPTION_FORMAT = 'ProofBundle-Encrypted-Envelope';

function encryptionSuite(suiteId, options = {}) {
  return getAlgorithm(suiteId, {
    kind: 'encryption-suite',
    allowReviewRequired: options.allowReviewRequired === true,
  });
}

function recipientKeyIds(recipientKey) {
  return recipientKey.components.map(({ algorithmId, keyId }) => ({ algorithmId, keyId }));
}

function contentKey(suite, sharedSecret, protectedBytes) {
  const aead = getAlgorithm(suite.aead, { kind: 'aead' });
  const protectedCommitment = digest('pb.hash.sha2-512.v1', protectedBytes);
  const salt = protectedCommitment;
  const info = domainSeparated(
    'ProofBundle-KEM-DEM-Content-Key-v1',
    new TextEncoder().encode(suite.id),
    protectedCommitment,
  );
  return deriveHkdf(suite.kdf, sharedSecret, {
    salt,
    info,
    length: aead.keyLength,
  });
}

export function generateEncryptionRecipient(suiteId, options = {}) {
  const suite = encryptionSuite(suiteId, options);
  const recipient = generateKemRecipient(suite.kem, options);
  return Object.freeze({
    suiteId,
    publicKey: recipient.publicKey,
    privateKey: recipient.privateKey,
  });
}

export function sealEncryptedEnvelope(
  suiteId,
  recipientPublicKey,
  plaintext,
  options = {},
) {
  const suite = encryptionSuite(suiteId, options);
  const kemResult = encapsulateKem(suite.kem, recipientPublicKey, options);
  const additionalProtected = options.additionalProtected ?? {};
  if (
    additionalProtected === null ||
    typeof additionalProtected !== 'object' ||
    Array.isArray(additionalProtected)
  ) {
    throw new ProofBundleError(Verdict.MALFORMED, 'additional protected data must be a map');
  }
  for (const reserved of [
    'format',
    'version',
    'suiteId',
    'kemId',
    'kdfId',
    'aeadId',
    'recipientKeys',
    'kemCiphertext',
  ]) {
    if (Object.hasOwn(additionalProtected, reserved)) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        `additional protected data replaces reserved field ${reserved}`,
      );
    }
  }
  const protectedObject = {
    format: ENCRYPTION_FORMAT,
    version: 1,
    suiteId,
    kemId: suite.kem,
    kdfId: suite.kdf,
    aeadId: suite.aead,
    recipientKeys: recipientKeyIds(recipientPublicKey),
    kemCiphertext: kemResult.ciphertext,
    ...additionalProtected,
  };
  const protectedBytes = encodeCanonicalCbor(protectedObject);
  const key = contentKey(suite, kemResult.sharedSecret, protectedBytes);
  const sealed = sealAead(suite.aead, key, asBytes(plaintext, 'plaintext'), {
    aad: protectedBytes,
    nonce: options.nonce,
    allowExternalNonce: options.allowExternalNonce === true,
  });
  key.fill(0);
  return Object.freeze({
    version: 1,
    suiteId,
    protected: protectedBytes,
    nonce: sealed.nonce,
    ciphertext: sealed.ciphertext,
  });
}

export function openEncryptedEnvelope(envelope, recipientPrivateKey, options = {}) {
  if (!envelope || envelope.version !== 1 || typeof envelope.suiteId !== 'string') {
    throw new ProofBundleError(Verdict.MALFORMED, 'invalid encrypted envelope');
  }
  const suite = encryptionSuite(envelope.suiteId, options);
  const protectedObject = decodeCanonicalCbor(
    asBytes(envelope.protected, 'encrypted protected header'),
  );
  if (
    protectedObject.format !== ENCRYPTION_FORMAT ||
    protectedObject.version !== 1 ||
    protectedObject.suiteId !== envelope.suiteId ||
    protectedObject.kemId !== suite.kem ||
    protectedObject.kdfId !== suite.kdf ||
    protectedObject.aeadId !== suite.aead ||
    !Array.isArray(protectedObject.recipientKeys)
  ) {
    throw new ProofBundleError(Verdict.MALFORMED, 'encrypted protected header is inconsistent');
  }
  const expectedRecipients = encodeCanonicalCbor(recipientKeyIds(recipientPrivateKey));
  const suppliedRecipients = encodeCanonicalCbor(protectedObject.recipientKeys);
  if (!equalBytes(expectedRecipients, suppliedRecipients)) {
    throw new ProofBundleError(Verdict.POLICY_DENIED, 'encrypted envelope targets different keys');
  }
  const sharedSecret = decapsulateKem(
    suite.kem,
    recipientPrivateKey,
    protectedObject.kemCiphertext,
    options,
  );
  const key = contentKey(suite, sharedSecret, envelope.protected);
  const plaintext = openAead(
    suite.aead,
    key,
    {
      algorithmId: suite.aead,
      nonce: envelope.nonce,
      ciphertext: envelope.ciphertext,
    },
    { aad: envelope.protected },
  );
  key.fill(0);
  return plaintext;
}

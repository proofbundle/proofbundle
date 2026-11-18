import {
  generateEncryptionRecipient,
  openEncryptedEnvelope,
  sealEncryptedEnvelope,
} from '../src/index.mjs';

const suiteId = 'pb.enc.ml-kem-768+hkdf-sha512+xchacha20-poly1305.v1';
const recipient = generateEncryptionRecipient(suiteId);
const plaintext = new TextEncoder().encode('Encrypted ProofBundle content.');
const envelope = sealEncryptedEnvelope(suiteId, recipient.publicKey, plaintext, {
  additionalProtected: { purpose: 'encryption-review-example' },
});
const opened = openEncryptedEnvelope(envelope, recipient.privateKey);

if (!Buffer.from(opened).equals(Buffer.from(plaintext))) {
  throw new Error('decrypted content differs');
}
console.log({ suiteId, ciphertextBytes: envelope.ciphertext.byteLength, roundTrip: true });

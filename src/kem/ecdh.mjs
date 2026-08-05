// Diffie-Hellman key agreement (X25519, X448, ECDH P-256/384/521) presented
// through a KEM-shaped interface: encapsulate() generates an ephemeral key
// pair and returns (ciphertext = ephemeral public key, sharedSecret);
// decapsulate() recovers the same secret from the recipient's private key.
//
// The raw DH output is NOT the shared secret handed to callers. It goes
// through HKDF with a domain-separated transcript binding the component
// algorithm id, the recipient public key, and the ephemeral public key, so a
// secret derived for one (algorithm, recipient, ephemeral) triple is useless
// for any other. Raw DH output is available only via `rawAgree` for vector
// checking.

import { diffieHellman, createPublicKey } from 'node:crypto';
import { generateKeyPair } from '../keys/key-generation.mjs';
import { hkdf } from '../kdf/hkdf.mjs';
import { buildTranscript, DOMAIN_TAGS } from '../canonical/transcript.mjs';
import { UnknownAlgorithmError, UnsupportedAlgorithmError } from '../errors.mjs';

const TABLE = new Map([
  ['X25519', { secretLength: 32 }],
  ['X448', { secretLength: 56 }],
  ['ECDH-P-256', { secretLength: 32 }],
  ['ECDH-P-384', { secretLength: 48 }],
  ['ECDH-P-521', { secretLength: 66 }],
]);

export function isImplementedKem(algId) { return TABLE.has(algId); }
export function kemAlgorithms() { return [...TABLE.keys()]; }

function spec(algId) {
  const s = TABLE.get(algId);
  if (s) return s;
  // ML-KEM is registered but deliberately unwired in this build; say so
  // rather than claiming the identifier is unrecognized.
  if (typeof algId === 'string' && algId.startsWith('ML-KEM')) {
    throw new UnsupportedAlgorithmError(algId, 'kem.implemented');
  }
  throw new UnknownAlgorithmError(algId, 'kem.algorithmKnown');
}

export function rawAgree(algId, privateKey, peerPublicKey) {
  spec(algId);
  const pub = peerPublicKey instanceof Uint8Array ? createPublicKey({ key: Buffer.from(peerPublicKey), format: 'der', type: 'spki' }) : peerPublicKey;
  return new Uint8Array(diffieHellman({ privateKey, publicKey: pub }));
}

function deriveShared(algId, rawSecret, recipientSpki, ephemeralSpki, length) {
  const info = buildTranscript(DOMAIN_TAGS.KEM_COMPONENT, [algId, recipientSpki, ephemeralSpki]);
  return hkdf('HKDF-SHA-256', { ikm: rawSecret, info, length });
}

export function encapsulate(algId, recipientPublicKey, { length = 32 } = {}) {
  spec(algId);
  const recipient = recipientPublicKey instanceof Uint8Array
    ? createPublicKey({ key: Buffer.from(recipientPublicKey), format: 'der', type: 'spki' })
    : recipientPublicKey;
  const recipientSpki = new Uint8Array(recipient.export({ format: 'der', type: 'spki' }));
  const eph = generateKeyPair(algId);
  const raw = rawAgree(algId, eph.privateKey, recipient);
  return {
    ciphertext: eph.spki, // the ephemeral public key is the KEM ciphertext
    sharedSecret: deriveShared(algId, raw, recipientSpki, eph.spki, length),
  };
}

export function decapsulate(algId, recipientPrivateKey, ciphertext, { length = 32 } = {}) {
  spec(algId);
  if (!(ciphertext instanceof Uint8Array)) throw new TypeError('decapsulate: ciphertext must be Uint8Array (ephemeral SPKI)');
  const recipientSpki = new Uint8Array(createPublicKey(recipientPrivateKey).export({ format: 'der', type: 'spki' }));
  const raw = rawAgree(algId, recipientPrivateKey, ciphertext);
  return deriveShared(algId, raw, recipientSpki, ciphertext, length);
}

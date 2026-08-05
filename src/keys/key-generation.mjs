// Key generation for the algorithms this build can actually mint with, plus
// SPKI/PKCS#8/PEM/JWK import and export. Generation for a verify-only
// algorithm is refused here as well as in signature.mjs — two independent
// refusals, because this is the kind of gate that must not depend on one call
// site remembering to check.

import { generateKeyPairSync, createPublicKey, createPrivateKey } from 'node:crypto';
import { canGenerate } from '../signature/signature.mjs';
import { computeKeyId } from './key-id.mjs';
import { GenerationProhibitedError, UnknownAlgorithmError, UnsupportedAlgorithmError } from '../errors.mjs';

const GEN = new Map([
  ['Ed25519', () => generateKeyPairSync('ed25519')],
  ['Ed448', () => generateKeyPairSync('ed448')],
  ['ECDSA-P-256-SHA-256', () => generateKeyPairSync('ec', { namedCurve: 'prime256v1' })],
  ['ECDSA-P-384-SHA-384', () => generateKeyPairSync('ec', { namedCurve: 'secp384r1' })],
  ['ECDSA-P-521-SHA-512', () => generateKeyPairSync('ec', { namedCurve: 'secp521r1' })],
  ['RSA-PSS-SHA-256', () => generateKeyPairSync('rsa', { modulusLength: 3072 })],
  ['RSA-PSS-SHA-384', () => generateKeyPairSync('rsa', { modulusLength: 3072 })],
  ['RSA-PSS-SHA-512', () => generateKeyPairSync('rsa', { modulusLength: 4096 })],
  ['X25519', () => generateKeyPairSync('x25519')],
  ['X448', () => generateKeyPairSync('x448')],
  ['ECDH-P-256', () => generateKeyPairSync('ec', { namedCurve: 'prime256v1' })],
  ['ECDH-P-384', () => generateKeyPairSync('ec', { namedCurve: 'secp384r1' })],
  ['ECDH-P-521', () => generateKeyPairSync('ec', { namedCurve: 'secp521r1' })],
]);

const KEM_IDS = new Set(['X25519', 'X448', 'ECDH-P-256', 'ECDH-P-384', 'ECDH-P-521']);

export function canGenerateKey(algId) { return GEN.has(algId); }
export function generatableAlgorithms() { return [...GEN.keys()]; }

export function generateKeyPair(algId) {
  const gen = GEN.get(algId);
  if (!gen) {
    // Distinguish "registered but this build can't mint it" from "no such id".
    if (algId === 'RSA-PKCS1v1.5') throw new GenerationProhibitedError(algId);
    if (typeof algId === 'string' && /^(ML-DSA|SLH-DSA|ML-KEM)/.test(algId)) throw new UnsupportedAlgorithmError(algId, 'keygen.implemented');
    throw new UnknownAlgorithmError(algId, 'keygen.algorithmKnown');
  }
  if (!KEM_IDS.has(algId) && !canGenerate(algId)) throw new GenerationProhibitedError(algId);
  const { publicKey, privateKey } = gen();
  const spki = new Uint8Array(publicKey.export({ format: 'der', type: 'spki' }));
  const pkcs8 = new Uint8Array(privateKey.export({ format: 'der', type: 'pkcs8' }));
  return {
    algId,
    keyId: computeKeyId(algId, spki),
    publicKey, privateKey,
    spki, pkcs8,
  };
}

export function exportPublicKey(keyObject, format = 'der') {
  if (format === 'der') return new Uint8Array(keyObject.export({ format: 'der', type: 'spki' }));
  if (format === 'pem') return keyObject.export({ format: 'pem', type: 'spki' });
  if (format === 'jwk') return keyObject.export({ format: 'jwk' });
  throw new RangeError(`exportPublicKey: unsupported format ${JSON.stringify(format)}`);
}

export function exportPrivateKey(keyObject, format = 'der') {
  if (format === 'der') return new Uint8Array(keyObject.export({ format: 'der', type: 'pkcs8' }));
  if (format === 'pem') return keyObject.export({ format: 'pem', type: 'pkcs8' });
  if (format === 'jwk') return keyObject.export({ format: 'jwk' });
  throw new RangeError(`exportPrivateKey: unsupported format ${JSON.stringify(format)}`);
}

export function importPublicKey(material, format = 'der') {
  if (format === 'der') return createPublicKey({ key: Buffer.from(material), format: 'der', type: 'spki' });
  if (format === 'pem') return createPublicKey({ key: material, format: 'pem' });
  if (format === 'jwk') return createPublicKey({ key: material, format: 'jwk' });
  throw new RangeError(`importPublicKey: unsupported format ${JSON.stringify(format)}`);
}

export function importPrivateKey(material, format = 'der') {
  if (format === 'der') return createPrivateKey({ key: Buffer.from(material), format: 'der', type: 'pkcs8' });
  if (format === 'pem') return createPrivateKey({ key: material, format: 'pem' });
  if (format === 'jwk') return createPrivateKey({ key: material, format: 'jwk' });
  throw new RangeError(`importPrivateKey: unsupported format ${JSON.stringify(format)}`);
}

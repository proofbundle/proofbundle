import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';
import { gcmsiv } from '@noble/ciphers/aes.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { asBytes, concatBytes } from './bytes.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';
import { getAlgorithm } from './registry.mjs';

const DEFAULT_MAX_PLAINTEXT = 64 * 1024 * 1024;

function assertLength(bytes, expected, label) {
  if (bytes.byteLength !== expected) {
    throw new ProofBundleError(
      Verdict.OUT_OF_BOUNDS,
      `${label} must be exactly ${expected} bytes`,
    );
  }
}

function inputs(algorithmId, key, options, dataLabel, data) {
  const algorithm = getAlgorithm(algorithmId, { kind: 'aead' });
  const keyBytes = asBytes(key, 'AEAD key');
  const dataBytes = asBytes(data, dataLabel);
  const aad =
    options?.aad === undefined ? new Uint8Array(0) : asBytes(options.aad, 'AEAD associated data');
  assertLength(keyBytes, algorithm.keyLength, 'AEAD key');
  const maxLength = options?.maxLength ?? DEFAULT_MAX_PLAINTEXT;
  if (!Number.isSafeInteger(maxLength) || maxLength < 0 || dataBytes.byteLength > maxLength) {
    throw new ProofBundleError(Verdict.RESOURCE_EXHAUSTED, `${dataLabel} exceeds policy bounds`);
  }
  return { algorithm, keyBytes, dataBytes, aad };
}

export function sealAead(algorithmId, key, plaintext, options = {}) {
  const { algorithm, keyBytes, dataBytes, aad } = inputs(
    algorithmId,
    key,
    options,
    'plaintext',
    plaintext,
  );
  if (options.nonce !== undefined && options.allowExternalNonce !== true) {
    throw new ProofBundleError(
      Verdict.POLICY_DENIED,
      'externally supplied AEAD nonces require an explicit policy override',
    );
  }
  const nonce =
    options.nonce === undefined
      ? new Uint8Array(randomBytes(algorithm.nonceLength))
      : asBytes(options.nonce, 'AEAD nonce');
  assertLength(nonce, algorithm.nonceLength, 'AEAD nonce');

  if (
    algorithmId === 'pb.aead.aes-256-gcm.v1' ||
    algorithmId === 'pb.aead.chacha20-poly1305.v1'
  ) {
    const cipher = createCipheriv(algorithm.nodeName, keyBytes, nonce, {
      authTagLength: algorithm.tagLength,
    });
    cipher.setAAD(aad, { plaintextLength: dataBytes.byteLength });
    const ciphertext = concatBytes(cipher.update(dataBytes), cipher.final());
    return Object.freeze({
      algorithmId,
      nonce: Uint8Array.from(nonce),
      ciphertext: concatBytes(ciphertext, cipher.getAuthTag()),
    });
  }

  if (algorithmId === 'pb.aead.aes-256-gcm-siv.v1') {
    return Object.freeze({
      algorithmId,
      nonce: Uint8Array.from(nonce),
      ciphertext: Uint8Array.from(gcmsiv(keyBytes, nonce, aad).encrypt(dataBytes)),
    });
  }
  if (algorithmId === 'pb.aead.xchacha20-poly1305.v1') {
    return Object.freeze({
      algorithmId,
      nonce: Uint8Array.from(nonce),
      ciphertext: Uint8Array.from(xchacha20poly1305(keyBytes, nonce, aad).encrypt(dataBytes)),
    });
  }
  throw new ProofBundleError(
    Verdict.UNSUPPORTED_ALGORITHM,
    `AEAD implementation is missing for ${algorithmId}`,
  );
}

export function openAead(algorithmId, key, sealed, options = {}) {
  try {
    if (!sealed || sealed.algorithmId !== algorithmId) {
      throw new ProofBundleError(Verdict.MALFORMED, 'AEAD identifier mismatch');
    }
    const { algorithm, keyBytes, dataBytes, aad } = inputs(
      algorithmId,
      key,
      options,
      'ciphertext',
      sealed.ciphertext,
    );
    const nonce = asBytes(sealed.nonce, 'AEAD nonce');
    assertLength(nonce, algorithm.nonceLength, 'AEAD nonce');
    if (dataBytes.byteLength < algorithm.tagLength) {
      throw new ProofBundleError(Verdict.MALFORMED, 'AEAD ciphertext is shorter than its tag');
    }

    if (
      algorithmId === 'pb.aead.aes-256-gcm.v1' ||
      algorithmId === 'pb.aead.chacha20-poly1305.v1'
    ) {
      const body = dataBytes.subarray(0, dataBytes.byteLength - algorithm.tagLength);
      const tag = dataBytes.subarray(dataBytes.byteLength - algorithm.tagLength);
      const decipher = createDecipheriv(algorithm.nodeName, keyBytes, nonce, {
        authTagLength: algorithm.tagLength,
      });
      decipher.setAAD(aad, { plaintextLength: body.byteLength });
      decipher.setAuthTag(tag);
      return concatBytes(decipher.update(body), decipher.final());
    }
    if (algorithmId === 'pb.aead.aes-256-gcm-siv.v1') {
      return Uint8Array.from(gcmsiv(keyBytes, nonce, aad).decrypt(dataBytes));
    }
    if (algorithmId === 'pb.aead.xchacha20-poly1305.v1') {
      return Uint8Array.from(xchacha20poly1305(keyBytes, nonce, aad).decrypt(dataBytes));
    }
    throw new ProofBundleError(
      Verdict.UNSUPPORTED_ALGORITHM,
      `AEAD implementation is missing for ${algorithmId}`,
    );
  } catch (error) {
    if (error instanceof ProofBundleError) throw error;
    throw new ProofBundleError(
      Verdict.AUTHENTICATION_FAILED,
      'AEAD authentication failed',
      undefined,
      { cause: error },
    );
  }
}

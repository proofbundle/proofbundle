import { createHash } from 'node:crypto';
import { blake3 } from '@noble/hashes/blake3.js';
import { cshake256, kmac256 } from '@noble/hashes/sha3-addons.js';
import { asBytes, domainSeparated } from './bytes.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';
import { getAlgorithm } from './registry.mjs';

const MAX_XOF_OUTPUT = 1024 * 1024;

function boundedOutputLength(value, label = 'outputLength') {
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_XOF_OUTPUT) {
    throw new ProofBundleError(
      Verdict.OUT_OF_BOUNDS,
      `${label} must be between 1 and ${MAX_XOF_OUTPUT} bytes`,
    );
  }
  return value;
}

export function digest(algorithmId, message, options = {}) {
  const data = asBytes(message, 'hash input');
  const algorithm = getAlgorithm(algorithmId);
  if (!['hash', 'xof'].includes(algorithm.kind)) {
    throw new ProofBundleError(Verdict.MALFORMED, `${algorithmId} is not a hash or XOF`);
  }

  if (algorithmId === 'pb.hash.blake3-256.v1') {
    return Uint8Array.from(blake3(data, { dkLen: 32 }));
  }
  if (algorithmId === 'pb.xof.cshake256.v1') {
    const outputLength = boundedOutputLength(options.outputLength);
    const personalization = asBytes(options.personalization, 'cSHAKE personalization');
    if (personalization.byteLength === 0) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        'cSHAKE personalization must be non-empty; use SHAKE256 when no customization is needed',
      );
    }
    return Uint8Array.from(
      cshake256(data, {
        dkLen: outputLength,
        personalization,
      }),
    );
  }
  if (algorithmId === 'pb.xof.shake256.v1') {
    const outputLength = boundedOutputLength(options.outputLength);
    return new Uint8Array(
      createHash(algorithm.nodeName, { outputLength }).update(data).digest(),
    );
  }
  if (!algorithm.nodeName) {
    throw new ProofBundleError(
      Verdict.UNSUPPORTED_ALGORITHM,
      `no digest implementation is bound for ${algorithmId}`,
    );
  }
  return new Uint8Array(createHash(algorithm.nodeName).update(data).digest());
}

export function macKmac256(key, message, options = {}) {
  const algorithm = getAlgorithm('pb.mac.kmac256.v1', { kind: 'mac' });
  const keyBytes = asBytes(key, 'KMAC key');
  const data = asBytes(message, 'KMAC input');
  if (keyBytes.byteLength < algorithm.minimumKeyLength) {
    throw new ProofBundleError(
      Verdict.OUT_OF_BOUNDS,
      `KMAC256 key must be at least ${algorithm.minimumKeyLength} bytes`,
    );
  }
  const outputLength = boundedOutputLength(options.outputLength ?? algorithm.outputLengthDefault);
  const personalization =
    options.personalization === undefined
      ? new Uint8Array(0)
      : asBytes(options.personalization, 'KMAC personalization');
  return Uint8Array.from(
    kmac256(keyBytes, data, {
      dkLen: outputLength,
      personalization,
    }),
  );
}

export function digestTagged(algorithmId, label, ...parts) {
  return digest(algorithmId, domainSeparated(label, ...parts));
}

export function digestSet(algorithmIds, message) {
  if (!Array.isArray(algorithmIds) || algorithmIds.length === 0) {
    throw new ProofBundleError(Verdict.MALFORMED, 'digest algorithm list must be non-empty');
  }
  if (new Set(algorithmIds).size !== algorithmIds.length) {
    throw new ProofBundleError(Verdict.MALFORMED, 'digest algorithm list contains duplicates');
  }
  return algorithmIds.map((algorithmId) =>
    Object.freeze({ algorithmId, value: digest(algorithmId, message) }),
  );
}

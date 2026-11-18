import { argon2Sync, hkdfSync, pbkdf2Sync } from 'node:crypto';
import { asBytes } from './bytes.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';
import { getAlgorithm } from './registry.mjs';

const MAX_DERIVED_KEY_LENGTH = 64 * 1024;

function keyLength(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_DERIVED_KEY_LENGTH) {
    throw new ProofBundleError(
      Verdict.OUT_OF_BOUNDS,
      `derived-key length must be between 1 and ${MAX_DERIVED_KEY_LENGTH} bytes`,
    );
  }
  return value;
}

export function deriveHkdf(algorithmId, inputKeyMaterial, options) {
  const algorithm = getAlgorithm(algorithmId, { kind: 'kdf' });
  if (!algorithmId.startsWith('pb.kdf.hkdf-')) {
    throw new ProofBundleError(Verdict.MALFORMED, `${algorithmId} is not an HKDF suite`);
  }
  if (!options || typeof options !== 'object') {
    throw new ProofBundleError(Verdict.MALFORMED, 'HKDF options are required');
  }
  const ikm = asBytes(inputKeyMaterial, 'HKDF input key material');
  const salt = asBytes(options.salt, 'HKDF salt');
  const info = asBytes(options.info, 'HKDF info');
  if (info.byteLength === 0) {
    throw new ProofBundleError(
      Verdict.MALFORMED,
      'ProofBundle requires non-empty HKDF info for domain separation',
    );
  }
  return new Uint8Array(
    hkdfSync(algorithm.nodeDigest, ikm, salt, info, keyLength(options.length)),
  );
}

export const ARGON2ID_PROFILES = Object.freeze({
  'pb.argon2id.interactive.v1': Object.freeze({
    memory: 65_536,
    passes: 3,
    parallelism: 1,
    tagLength: 32,
  }),
  'pb.argon2id.moderate.v1': Object.freeze({
    memory: 262_144,
    passes: 3,
    parallelism: 2,
    tagLength: 32,
  }),
});

export function derivePasswordKey(algorithmId, password, options) {
  const algorithm = getAlgorithm(algorithmId, {
    kind: 'password-kdf',
    allowLegacy: options?.allowLegacy === true,
  });
  if (!options || typeof options !== 'object') {
    throw new ProofBundleError(Verdict.MALFORMED, 'password KDF options are required');
  }
  const passwordBytes = asBytes(password, 'password bytes');
  const salt = asBytes(options.salt, 'password KDF salt');

  if (algorithmId === 'pb.kdf.argon2id.v1') {
    if (salt.byteLength < algorithm.minimumSaltLength) {
      throw new ProofBundleError(
        Verdict.OUT_OF_BOUNDS,
        `Argon2id salt must be at least ${algorithm.minimumSaltLength} bytes`,
      );
    }
    const profile = ARGON2ID_PROFILES[options.profileId];
    if (!profile) {
      throw new ProofBundleError(
        Verdict.UNKNOWN_ALGORITHM,
        `unknown Argon2id parameter profile: ${options.profileId}`,
      );
    }
    return new Uint8Array(
      argon2Sync('argon2id', {
        message: passwordBytes,
        nonce: salt,
        memory: profile.memory,
        passes: profile.passes,
        parallelism: profile.parallelism,
        tagLength: profile.tagLength,
        ...(options.associatedData === undefined
          ? {}
          : { associatedData: asBytes(options.associatedData, 'Argon2 associated data') }),
        ...(options.secret === undefined
          ? {}
          : { secret: asBytes(options.secret, 'Argon2 secret') }),
      }),
    );
  }

  if (algorithmId === 'pb.kdf.pbkdf2-hmac-sha256-legacy.v1') {
    if (options.allowLegacy !== true) {
      throw new ProofBundleError(
        Verdict.DEPRECATED_ALGORITHM,
        'PBKDF2 creation requires an explicit legacy-policy override',
      );
    }
    if (!Number.isSafeInteger(options.iterations) || options.iterations < 600_000) {
      throw new ProofBundleError(
        Verdict.OUT_OF_BOUNDS,
        'legacy PBKDF2-HMAC-SHA256 requires at least 600000 iterations in this profile',
      );
    }
    if (salt.byteLength < 16) {
      throw new ProofBundleError(Verdict.OUT_OF_BOUNDS, 'PBKDF2 salt must be at least 16 bytes');
    }
    return new Uint8Array(
      pbkdf2Sync(
        passwordBytes,
        salt,
        options.iterations,
        keyLength(options.length ?? 32),
        algorithm.nodeDigest,
      ),
    );
  }

  throw new ProofBundleError(
    Verdict.UNSUPPORTED_ALGORITHM,
    `password KDF implementation is missing for ${algorithmId}`,
  );
}

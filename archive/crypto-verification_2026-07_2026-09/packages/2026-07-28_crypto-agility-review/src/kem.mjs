import {
  createPrivateKey,
  createPublicKey,
  decapsulate as nodeDecapsulate,
  diffieHellman,
  encapsulate as nodeEncapsulate,
  generateKeyPairSync,
} from 'node:crypto';
import { asBytes, domainSeparated } from './bytes.mjs';
import { encodeCanonicalCbor } from './canonical-cbor.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';
import { digest } from './hashes.mjs';
import { deriveHkdf } from './kdf.mjs';
import { getAlgorithm } from './registry.mjs';
import { keyIdFromPublicKey } from './signatures.mjs';

function publicDer(key) {
  return new Uint8Array(key.export({ format: 'der', type: 'spki' }));
}

function privateDer(key) {
  return new Uint8Array(key.export({ format: 'der', type: 'pkcs8' }));
}

function importPublic(der) {
  return createPublicKey({ key: asBytes(der, 'public key DER'), format: 'der', type: 'spki' });
}

function importPrivate(der) {
  return createPrivateKey({ key: asBytes(der, 'private key DER'), format: 'der', type: 'pkcs8' });
}

function component(algorithmId, generated) {
  const publicKeyDer = publicDer(generated.publicKey);
  return {
    public: {
      algorithmId,
      keyId: keyIdFromPublicKey(publicKeyDer),
      publicKeyDer,
    },
    private: {
      algorithmId,
      keyId: keyIdFromPublicKey(publicKeyDer),
      publicKeyDer,
      privateKeyDer: privateDer(generated.privateKey),
    },
  };
}

function generateComponent(algorithmId) {
  const algorithm = getAlgorithm(algorithmId);
  if (algorithm.kind === 'kem') {
    return component(algorithmId, generateKeyPairSync(algorithm.nodeType));
  }
  if (algorithm.kind === 'key-exchange' && algorithm.nodeType === 'x25519') {
    return component(algorithmId, generateKeyPairSync('x25519'));
  }
  if (algorithm.kind === 'key-exchange' && algorithm.nodeType === 'ec') {
    return component(algorithmId, generateKeyPairSync('ec', { namedCurve: algorithm.namedCurve }));
  }
  throw new ProofBundleError(
    Verdict.UNSUPPORTED_ALGORITHM,
    `key generation is not implemented for ${algorithmId}`,
  );
}

export function generateKemRecipient(kemId, options = {}) {
  const algorithm = getAlgorithm(kemId, {
    allowReviewRequired: options.allowReviewRequired === true,
  });
  if (algorithm.kind === 'kem') {
    const generated = generateComponent(kemId);
    return Object.freeze({
      kemId,
      publicKey: Object.freeze({ kemId, components: [Object.freeze(generated.public)] }),
      privateKey: Object.freeze({ kemId, components: [Object.freeze(generated.private)] }),
    });
  }
  if (algorithm.kind === 'hybrid-kem') {
    const generated = algorithm.components.map(generateComponent);
    return Object.freeze({
      kemId,
      publicKey: Object.freeze({
        kemId,
        components: generated.map(({ public: item }) => Object.freeze(item)),
      }),
      privateKey: Object.freeze({
        kemId,
        components: generated.map(({ private: item }) => Object.freeze(item)),
      }),
    });
  }
  throw new ProofBundleError(Verdict.MALFORMED, `${kemId} is not a KEM`);
}

function validateComponents(expected, material, role) {
  if (!material || !Array.isArray(material.components) || material.components.length !== expected.length) {
    throw new ProofBundleError(
      Verdict.MALFORMED,
      `${role} KEM material does not contain the required ordered components`,
    );
  }
  for (let index = 0; index < expected.length; index += 1) {
    const item = material.components[index];
    if (item.algorithmId !== expected[index]) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        `${role} KEM component ${index} must be ${expected[index]}`,
      );
    }
    if (keyIdFromPublicKey(item.publicKeyDer) !== item.keyId) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        `${role} KEM component ${index} key identifier mismatch`,
      );
    }
  }
}

function hybridTranscript(kemId, recipientComponents, ciphertextComponents) {
  return encodeCanonicalCbor({
    format: 'ProofBundle-Hybrid-KEM-Transcript',
    version: 1,
    kemId,
    recipientKeys: recipientComponents.map(({ algorithmId, keyId }) => ({ algorithmId, keyId })),
    ciphertextComponents,
  });
}

function combineHybridSecrets(kemId, first, second, transcript) {
  const ikm = domainSeparated('ProofBundle-Hybrid-KEM-IKM-v1', first, second);
  const transcriptCommitment = digest('pb.hash.sha2-512.v1', transcript);
  const salt = transcriptCommitment;
  const info = domainSeparated(
    'ProofBundle-Hybrid-KEM-Info-v1',
    new TextEncoder().encode(kemId),
    transcriptCommitment,
  );
  return deriveHkdf('pb.kdf.hkdf-sha512.v1', ikm, { salt, info, length: 32 });
}

function classicalSharedSecret(algorithmId, privateKeyDer, publicKeyDer) {
  const algorithm = getAlgorithm(algorithmId, { kind: 'key-exchange' });
  const privateKey = importPrivate(privateKeyDer);
  const publicKey = importPublic(publicKeyDer);
  if (
    privateKey.asymmetricKeyType !== algorithm.nodeType ||
    publicKey.asymmetricKeyType !== algorithm.nodeType
  ) {
    throw new ProofBundleError(Verdict.MALFORMED, 'classical key-exchange key type mismatch');
  }
  if (
    algorithm.namedCurve &&
    (privateKey.asymmetricKeyDetails?.namedCurve !== algorithm.namedCurve ||
      publicKey.asymmetricKeyDetails?.namedCurve !== algorithm.namedCurve)
  ) {
    throw new ProofBundleError(Verdict.MALFORMED, 'classical key-exchange curve mismatch');
  }
  return new Uint8Array(diffieHellman({ privateKey, publicKey }));
}

export function encapsulateKem(kemId, recipientPublicKey, options = {}) {
  const algorithm = getAlgorithm(kemId, {
    allowReviewRequired: options.allowReviewRequired === true,
  });
  if (recipientPublicKey?.kemId !== kemId) {
    throw new ProofBundleError(Verdict.MALFORMED, 'recipient public key KEM identifier mismatch');
  }

  if (algorithm.kind === 'kem') {
    validateComponents([kemId], recipientPublicKey, 'public');
    const publicKey = importPublic(recipientPublicKey.components[0].publicKeyDer);
    if (publicKey.asymmetricKeyType !== algorithm.nodeType) {
      throw new ProofBundleError(Verdict.MALFORMED, 'ML-KEM public key type mismatch');
    }
    const result = nodeEncapsulate(publicKey);
    return Object.freeze({
      kemId,
      sharedSecret: new Uint8Array(result.sharedKey),
      ciphertext: Object.freeze({
        version: 1,
        kemId,
        components: [
          Object.freeze({
            algorithmId: kemId,
            ciphertext: new Uint8Array(result.ciphertext),
          }),
        ],
      }),
    });
  }

  if (algorithm.kind === 'hybrid-kem') {
    validateComponents(algorithm.components, recipientPublicKey, 'public');
    const classicalAlgorithm = getAlgorithm(algorithm.components[0], { kind: 'key-exchange' });
    const ephemeral =
      classicalAlgorithm.nodeType === 'ec'
        ? generateKeyPairSync('ec', { namedCurve: classicalAlgorithm.namedCurve })
        : generateKeyPairSync(classicalAlgorithm.nodeType);
    const classicalSecret = classicalSharedSecret(
      classicalAlgorithm.id,
      privateDer(ephemeral.privateKey),
      recipientPublicKey.components[0].publicKeyDer,
    );
    const pqAlgorithm = getAlgorithm(algorithm.components[1], { kind: 'kem' });
    const pqPublicKey = importPublic(recipientPublicKey.components[1].publicKeyDer);
    if (pqPublicKey.asymmetricKeyType !== pqAlgorithm.nodeType) {
      throw new ProofBundleError(Verdict.MALFORMED, 'ML-KEM public key type mismatch');
    }
    const pq = nodeEncapsulate(pqPublicKey);
    const ciphertextComponents = [
      {
        algorithmId: classicalAlgorithm.id,
        ephemeralPublicKeyDer: publicDer(ephemeral.publicKey),
      },
      {
        algorithmId: pqAlgorithm.id,
        ciphertext: new Uint8Array(pq.ciphertext),
      },
    ];
    const transcript = hybridTranscript(kemId, recipientPublicKey.components, ciphertextComponents);
    return Object.freeze({
      kemId,
      sharedSecret: combineHybridSecrets(
        kemId,
        classicalSecret,
        new Uint8Array(pq.sharedKey),
        transcript,
      ),
      ciphertext: Object.freeze({ version: 1, kemId, components: ciphertextComponents }),
    });
  }
  throw new ProofBundleError(Verdict.MALFORMED, `${kemId} is not a KEM`);
}

export function decapsulateKem(kemId, recipientPrivateKey, ciphertext, options = {}) {
  const algorithm = getAlgorithm(kemId, {
    allowReviewRequired: options.allowReviewRequired === true,
  });
  if (
    recipientPrivateKey?.kemId !== kemId ||
    ciphertext?.kemId !== kemId ||
    ciphertext?.version !== 1
  ) {
    throw new ProofBundleError(Verdict.MALFORMED, 'KEM envelope identifier mismatch');
  }

  if (algorithm.kind === 'kem') {
    validateComponents([kemId], recipientPrivateKey, 'private');
    if (
      !Array.isArray(ciphertext.components) ||
      ciphertext.components.length !== 1 ||
      ciphertext.components[0].algorithmId !== kemId
    ) {
      throw new ProofBundleError(Verdict.MALFORMED, 'invalid ML-KEM ciphertext components');
    }
    const privateKey = importPrivate(recipientPrivateKey.components[0].privateKeyDer);
    if (privateKey.asymmetricKeyType !== algorithm.nodeType) {
      throw new ProofBundleError(Verdict.MALFORMED, 'ML-KEM private key type mismatch');
    }
    return new Uint8Array(
      nodeDecapsulate(privateKey, asBytes(ciphertext.components[0].ciphertext, 'KEM ciphertext')),
    );
  }

  if (algorithm.kind === 'hybrid-kem') {
    validateComponents(algorithm.components, recipientPrivateKey, 'private');
    if (!Array.isArray(ciphertext.components) || ciphertext.components.length !== 2) {
      throw new ProofBundleError(Verdict.MALFORMED, 'invalid hybrid KEM ciphertext components');
    }
    const classicalCiphertext = ciphertext.components[0];
    const pqCiphertext = ciphertext.components[1];
    if (
      classicalCiphertext.algorithmId !== algorithm.components[0] ||
      pqCiphertext.algorithmId !== algorithm.components[1]
    ) {
      throw new ProofBundleError(Verdict.MALFORMED, 'hybrid KEM component order mismatch');
    }
    const classicalSecret = classicalSharedSecret(
      algorithm.components[0],
      recipientPrivateKey.components[0].privateKeyDer,
      classicalCiphertext.ephemeralPublicKeyDer,
    );
    const pqAlgorithm = getAlgorithm(algorithm.components[1], { kind: 'kem' });
    const pqPrivateKey = importPrivate(recipientPrivateKey.components[1].privateKeyDer);
    if (pqPrivateKey.asymmetricKeyType !== pqAlgorithm.nodeType) {
      throw new ProofBundleError(Verdict.MALFORMED, 'ML-KEM private key type mismatch');
    }
    const pqSecret = new Uint8Array(
      nodeDecapsulate(pqPrivateKey, asBytes(pqCiphertext.ciphertext, 'ML-KEM ciphertext')),
    );
    const transcript = hybridTranscript(
      kemId,
      recipientPrivateKey.components,
      ciphertext.components,
    );
    return combineHybridSecrets(kemId, classicalSecret, pqSecret, transcript);
  }
  throw new ProofBundleError(Verdict.MALFORMED, `${kemId} is not a KEM`);
}

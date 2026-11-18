import {
  constants,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as nodeSign,
  verify as nodeVerify,
} from 'node:crypto';
import { asBytes, domainSeparated, toBase64url } from './bytes.mjs';
import { decodeCanonicalCbor, encodeCanonicalCbor } from './canonical-cbor.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';
import { digest } from './hashes.mjs';
import { getAlgorithm } from './registry.mjs';

const SIGNATURE_FORMAT = 'ProofBundle-Signature-Envelope';

function importPrivate(der) {
  return createPrivateKey({ key: asBytes(der, 'private key DER'), format: 'der', type: 'pkcs8' });
}

function importPublic(der) {
  return createPublicKey({ key: asBytes(der, 'public key DER'), format: 'der', type: 'spki' });
}

function assertKeyMatches(algorithm, key, role) {
  if (key.asymmetricKeyType !== algorithm.nodeType) {
    throw new ProofBundleError(
      Verdict.MALFORMED,
      `${role} key type ${key.asymmetricKeyType} does not match ${algorithm.id}`,
    );
  }
  if (
    algorithm.namedCurve &&
    key.asymmetricKeyDetails?.namedCurve !== algorithm.namedCurve
  ) {
    throw new ProofBundleError(
      Verdict.MALFORMED,
      `${role} curve ${key.asymmetricKeyDetails?.namedCurve} does not match ${algorithm.namedCurve}`,
    );
  }
  if (
    algorithm.modulusLength &&
    key.asymmetricKeyDetails?.modulusLength !== algorithm.modulusLength
  ) {
    throw new ProofBundleError(
      Verdict.MALFORMED,
      `${role} RSA modulus length does not match ${algorithm.modulusLength}`,
    );
  }
}

function signatureAlgorithm(id) {
  return getAlgorithm(id, { kind: 'signature' });
}

function suiteComponents(suiteId) {
  const suite = getAlgorithm(suiteId);
  if (suite.kind === 'signature') return [suiteId];
  if (suite.kind === 'hybrid-signature') return suite.components;
  throw new ProofBundleError(Verdict.MALFORMED, `${suiteId} is not a signature suite`);
}

export function keyIdFromPublicKey(publicKeyDer) {
  const fingerprint = digest('pb.hash.sha2-256.v1', asBytes(publicKeyDer, 'public key DER'));
  return `pb-kid-v1:sha256:${toBase64url(fingerprint)}`;
}

export function generateSignatureKeyPair(algorithmId) {
  const algorithm = signatureAlgorithm(algorithmId);
  let generated;
  if (algorithm.nodeType === 'ec') {
    generated = generateKeyPairSync('ec', { namedCurve: algorithm.namedCurve });
  } else if (algorithm.nodeType === 'rsa-pss') {
    generated = generateKeyPairSync('rsa-pss', {
      modulusLength: algorithm.modulusLength,
      publicExponent: 0x10001,
      hashAlgorithm: algorithm.digest,
      mgf1HashAlgorithm: algorithm.digest,
      saltLength: algorithm.saltLength,
    });
  } else {
    generated = generateKeyPairSync(algorithm.nodeType);
  }
  const publicKeyDer = new Uint8Array(
    generated.publicKey.export({ format: 'der', type: 'spki' }),
  );
  const privateKeyDer = new Uint8Array(
    generated.privateKey.export({ format: 'der', type: 'pkcs8' }),
  );
  return Object.freeze({
    algorithmId,
    keyId: keyIdFromPublicKey(publicKeyDer),
    publicKeyDer,
    privateKeyDer,
  });
}

export function generateSignatureKeySet(suiteId) {
  return suiteComponents(suiteId).map(generateSignatureKeyPair);
}

export function signBytes(algorithmId, privateKeyDer, message) {
  const algorithm = signatureAlgorithm(algorithmId);
  const key = importPrivate(privateKeyDer);
  assertKeyMatches(algorithm, key, 'private');
  const data = asBytes(message, 'message');

  if (
    ['ed25519', 'ed448'].includes(algorithm.nodeType) ||
    algorithm.nodeType.startsWith('ml-dsa-') ||
    algorithm.nodeType.startsWith('slh-dsa-')
  ) {
    return new Uint8Array(nodeSign(null, data, key));
  }
  if (algorithm.nodeType === 'ec') {
    return new Uint8Array(
      nodeSign(algorithm.digest, data, {
        key,
        dsaEncoding: algorithm.signatureEncoding,
      }),
    );
  }
  if (algorithm.nodeType === 'rsa-pss') {
    return new Uint8Array(
      nodeSign(algorithm.digest, data, {
        key,
        padding: constants.RSA_PKCS1_PSS_PADDING,
        saltLength: algorithm.saltLength,
      }),
    );
  }
  throw new ProofBundleError(
    Verdict.UNSUPPORTED_ALGORITHM,
    `signature implementation is missing for ${algorithmId}`,
  );
}

export function verifyBytes(algorithmId, publicKeyDer, message, signature) {
  try {
    const algorithm = signatureAlgorithm(algorithmId);
    const key = importPublic(publicKeyDer);
    assertKeyMatches(algorithm, key, 'public');
    const data = asBytes(message, 'message');
    const signatureBytes = asBytes(signature, 'signature');

    if (
      ['ed25519', 'ed448'].includes(algorithm.nodeType) ||
      algorithm.nodeType.startsWith('ml-dsa-') ||
      algorithm.nodeType.startsWith('slh-dsa-')
    ) {
      return nodeVerify(null, data, key, signatureBytes);
    }
    if (algorithm.nodeType === 'ec') {
      return nodeVerify(
        algorithm.digest,
        data,
        { key, dsaEncoding: algorithm.signatureEncoding },
        signatureBytes,
      );
    }
    if (algorithm.nodeType === 'rsa-pss') {
      return nodeVerify(
        algorithm.digest,
        data,
        {
          key,
          padding: constants.RSA_PKCS1_PSS_PADDING,
          saltLength: algorithm.saltLength,
        },
        signatureBytes,
      );
    }
    return false;
  } catch {
    return false;
  }
}

function protectedHeader(suiteId, keyMaterials, additionalProtected) {
  if (
    additionalProtected === null ||
    typeof additionalProtected !== 'object' ||
    Array.isArray(additionalProtected)
  ) {
    throw new ProofBundleError(Verdict.MALFORMED, 'additional protected header must be a map');
  }
  for (const reserved of ['format', 'version', 'suiteId', 'components']) {
    if (Object.hasOwn(additionalProtected, reserved)) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        `protected header extension attempts to replace reserved field ${reserved}`,
      );
    }
  }
  return {
    format: SIGNATURE_FORMAT,
    version: 1,
    suiteId,
    components: keyMaterials.map(({ algorithmId, keyId }) => ({ algorithmId, keyId })),
    ...additionalProtected,
  };
}

function signatureTbs(protectedBytes, payload) {
  return domainSeparated(
    'ProofBundle-Signature-TBS-v1',
    asBytes(protectedBytes, 'protected header'),
    asBytes(payload, 'signed payload'),
  );
}

function validateKeyMaterialOrder(suiteId, keyMaterials, requirePrivate) {
  const components = suiteComponents(suiteId);
  if (!Array.isArray(keyMaterials) || keyMaterials.length !== components.length) {
    throw new ProofBundleError(
      Verdict.MALFORMED,
      `${suiteId} requires exactly ${components.length} ordered key components`,
    );
  }
  for (let index = 0; index < components.length; index += 1) {
    const material = keyMaterials[index];
    if (!material || material.algorithmId !== components[index]) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        `key component ${index} must be ${components[index]}`,
      );
    }
    if (typeof material.keyId !== 'string') {
      throw new ProofBundleError(Verdict.MALFORMED, `key component ${index} lacks a keyId`);
    }
    const publicKeyDer = asBytes(material.publicKeyDer, `public key ${index}`);
    if (keyIdFromPublicKey(publicKeyDer) !== material.keyId) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        `key component ${index} keyId does not match its public key`,
      );
    }
    if (requirePrivate) asBytes(material.privateKeyDer, `private key ${index}`);
  }
}

export function signDetached(suiteId, keyMaterials, payload, additionalProtected = {}) {
  validateKeyMaterialOrder(suiteId, keyMaterials, true);
  const header = protectedHeader(suiteId, keyMaterials, additionalProtected);
  const protectedBytes = encodeCanonicalCbor(header);
  const tbs = signatureTbs(protectedBytes, payload);
  const signatures = keyMaterials.map((material) => ({
    algorithmId: material.algorithmId,
    keyId: material.keyId,
    value: signBytes(material.algorithmId, material.privateKeyDer, tbs),
  }));
  return {
    version: 1,
    suiteId,
    protected: protectedBytes,
    signatures,
  };
}

export function verifyDetached(envelope, publicKeyMaterials, payload) {
  try {
    if (!envelope || envelope.version !== 1 || typeof envelope.suiteId !== 'string') {
      throw new ProofBundleError(Verdict.MALFORMED, 'invalid signature envelope header');
    }
    const components = suiteComponents(envelope.suiteId);
    validateKeyMaterialOrder(envelope.suiteId, publicKeyMaterials, false);
    const header = decodeCanonicalCbor(asBytes(envelope.protected, 'protected header'));
    if (
      header.format !== SIGNATURE_FORMAT ||
      header.version !== 1 ||
      header.suiteId !== envelope.suiteId ||
      !Array.isArray(header.components) ||
      header.components.length !== components.length
    ) {
      throw new ProofBundleError(Verdict.MALFORMED, 'protected signature header is inconsistent');
    }
    if (!Array.isArray(envelope.signatures) || envelope.signatures.length !== components.length) {
      throw new ProofBundleError(
        Verdict.INVALID_SIGNATURE,
        'signature component count does not match the suite',
      );
    }
    const tbs = signatureTbs(envelope.protected, payload);
    const componentResults = [];
    for (let index = 0; index < components.length; index += 1) {
      const expectedAlgorithm = components[index];
      const expectedKey = publicKeyMaterials[index];
      const protectedComponent = header.components[index];
      const suppliedSignature = envelope.signatures[index];
      const structureValid =
        protectedComponent?.algorithmId === expectedAlgorithm &&
        protectedComponent?.keyId === expectedKey.keyId &&
        suppliedSignature?.algorithmId === expectedAlgorithm &&
        suppliedSignature?.keyId === expectedKey.keyId;
      const valid =
        structureValid &&
        verifyBytes(
          expectedAlgorithm,
          expectedKey.publicKeyDer,
          tbs,
          suppliedSignature.value,
        );
      componentResults.push(
        Object.freeze({
          algorithmId: expectedAlgorithm,
          keyId: expectedKey.keyId,
          structureValid,
          valid,
        }),
      );
    }
    const ok = componentResults.every(({ valid }) => valid);
    return Object.freeze({
      ok,
      verdict: ok ? Verdict.VERIFIED : Verdict.INVALID_SIGNATURE,
      componentResults,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      verdict:
        error instanceof ProofBundleError ? error.code : Verdict.INVALID_SIGNATURE,
      message: error instanceof Error ? error.message : String(error),
      componentResults: [],
    });
  }
}

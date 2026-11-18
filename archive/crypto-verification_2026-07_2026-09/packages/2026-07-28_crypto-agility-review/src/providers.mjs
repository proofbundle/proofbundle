import { asBytes } from './bytes.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';
import { keyIdFromPublicKey, signBytes } from './signatures.mjs';

export const PROVIDER_KINDS = Object.freeze([
  'software',
  'pkcs11',
  'tpm2',
  'apple-secure-enclave',
  'android-keystore',
  'fido2',
  'piv',
  'hsm-service',
]);

function publicDescriptor(material) {
  const publicKeyDer = asBytes(material.publicKeyDer, 'provider public key');
  const keyId = keyIdFromPublicKey(publicKeyDer);
  if (
    typeof material.algorithmId !== 'string' ||
    (material.keyId !== undefined && material.keyId !== keyId)
  ) {
    throw new ProofBundleError(Verdict.MALFORMED, 'provider key descriptor is inconsistent');
  }
  return Object.freeze({
    algorithmId: material.algorithmId,
    keyId,
    publicKeyDer: Uint8Array.from(publicKeyDer),
  });
}

export class SoftwareSignatureProvider {
  constructor(keyMaterial) {
    this.kind = 'software';
    this.key = publicDescriptor(keyMaterial);
    this.#privateKeyDer = Uint8Array.from(
      asBytes(keyMaterial.privateKeyDer, 'provider private key'),
    );
  }

  #privateKeyDer;

  getPublicKey() {
    return this.key;
  }

  async sign(message, context = {}) {
    if (
      context.algorithmId !== undefined &&
      context.algorithmId !== this.key.algorithmId
    ) {
      throw new ProofBundleError(Verdict.POLICY_DENIED, 'provider algorithm mismatch');
    }
    return signBytes(this.key.algorithmId, this.#privateKeyDer, asBytes(message, 'message'));
  }

  destroy() {
    this.#privateKeyDer.fill(0);
  }
}

/**
 * Integration boundary for a PKCS#11, TPM, platform keystore, FIDO2/PIV, or
 * remote-HSM implementation. The callback owns user-presence, PIN, session,
 * attestation, and mechanism-selection policy.
 */
export class CallbackSignatureProvider {
  constructor({ kind, key, sign, implementationId }) {
    if (!PROVIDER_KINDS.includes(kind) || kind === 'software') {
      throw new ProofBundleError(Verdict.MALFORMED, `unsupported provider kind: ${kind}`);
    }
    if (typeof sign !== 'function' || typeof implementationId !== 'string') {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        'provider callback and implementation identifier are required',
      );
    }
    this.kind = kind;
    this.key = publicDescriptor(key);
    this.implementationId = implementationId;
    this.#sign = sign;
  }

  #sign;

  getPublicKey() {
    return this.key;
  }

  async sign(message, context = {}) {
    const value = await this.#sign(asBytes(message, 'message'), {
      ...context,
      algorithmId: this.key.algorithmId,
      keyId: this.key.keyId,
      providerKind: this.kind,
      implementationId: this.implementationId,
    });
    return Uint8Array.from(asBytes(value, 'provider signature'));
  }
}

export function unavailableProvider(kind, reason) {
  if (!PROVIDER_KINDS.includes(kind) || kind === 'software') {
    throw new ProofBundleError(Verdict.MALFORMED, `unsupported provider kind: ${kind}`);
  }
  return Object.freeze({
    kind,
    available: false,
    reason,
    async sign() {
      throw new ProofBundleError(
        Verdict.UNSUPPORTED_ALGORITHM,
        `${kind} provider is not configured: ${reason}`,
      );
    },
  });
}

export const HARDWARE_PROVIDER_REQUIREMENTS = Object.freeze({
  common: [
    'bind algorithm identifier and key identifier before signing',
    'return raw signature bytes only after device or service success',
    'surface user-presence, PIN, or approval failures distinctly',
    'record implementation and firmware identifiers as evidence, not signed algorithm identity',
    'validate attestation or certificate chains under an explicit external policy',
  ],
  warning:
    'A provider adapter proves API conformance only; it does not prove key non-exportability or hardware certification.',
});

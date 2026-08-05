// Provider interface and the deterministic-unavailability contract.
//
// The rule this module exists to enforce: a provider that is not present must
// produce PROVIDER_UNAVAILABLE with a specific, machine-readable reason —
// never a silent fallback to a software implementation, and never a
// manufactured cryptographic result.
//
// `UnavailableProvider` is a real object with the full interface. Every method
// throws ProviderUnavailableError carrying the exact reason it is missing.
// That distinction matters for the coverage matrix: these rows are
// COMPLETE_PROVIDER_UNAVAILABLE — the interface and its failure behaviour are
// implemented and tested; the backing hardware or service is absent.

import { ProviderUnavailableError } from '../errors.mjs';

export const PROVIDER_OPERATIONS = Object.freeze([
  'getPublicKey', 'sign', 'verify', 'encapsulate', 'decapsulate', 'attest', 'generateKey',
]);

export class Provider {
  constructor({ providerId, providerVersion, capabilities = {}, supportedAlgorithms = [], supportedOperations = [] }) {
    this.providerId = providerId;
    this.providerVersion = providerVersion;
    this.capabilities = Object.freeze({ ...capabilities });
    this.supportedAlgorithms = Object.freeze([...supportedAlgorithms]);
    this.supportedOperations = Object.freeze([...supportedOperations]);
  }
  get available() { return true; }
  describe() {
    return {
      providerId: this.providerId,
      providerVersion: this.providerVersion,
      available: this.available,
      capabilities: this.capabilities,
      supportedAlgorithms: [...this.supportedAlgorithms],
      supportedOperations: [...this.supportedOperations],
    };
  }
}

export class UnavailableProvider extends Provider {
  #reason;
  #detectedBy;
  constructor({ providerId, reason, detectedBy, supportedAlgorithms = [], supportedOperations = PROVIDER_OPERATIONS }) {
    super({ providerId, providerVersion: null, capabilities: {}, supportedAlgorithms, supportedOperations });
    this.#reason = reason;
    this.#detectedBy = detectedBy;
  }
  get available() { return false; }
  get reason() { return this.#reason; }
  get detectedBy() { return this.#detectedBy; }
  #fail(op) {
    throw new ProviderUnavailableError(this.providerId, `${this.#reason} (operation ${op}; detected by ${this.#detectedBy})`);
  }
  getPublicKey() { this.#fail('getPublicKey'); }
  sign() { this.#fail('sign'); }
  verify() { this.#fail('verify'); }
  encapsulate() { this.#fail('encapsulate'); }
  decapsulate() { this.#fail('decapsulate'); }
  attest() { this.#fail('attest'); }
  generateKey() { this.#fail('generateKey'); }
  describe() { return { ...super.describe(), reason: this.#reason, detectedBy: this.#detectedBy }; }
}

import { createHmac, randomBytes as nodeRandomBytes } from 'node:crypto';
import { asBytes, concatBytes, utf8 } from './bytes.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';

const SHA512_BYTES = 64;
const MAX_RANDOM_REQUEST = 1024 * 1024;
const MAX_DRBG_REQUEST = 65_536;
const MAX_RESEED_COUNTER = 2 ** 48;

function boundedLength(value, maximum, label) {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new ProofBundleError(
      Verdict.OUT_OF_BOUNDS,
      `${label} must be an integer between 1 and ${maximum}`,
    );
  }
  return value;
}

function hmacSha512(key, ...parts) {
  const hmac = createHmac('sha512', key);
  for (const part of parts) hmac.update(asBytes(part));
  return new Uint8Array(hmac.digest());
}

export function osRandomBytes(length) {
  return new Uint8Array(
    nodeRandomBytes(boundedLength(length, MAX_RANDOM_REQUEST, 'OS randomness request')),
  );
}

/**
 * A direct HMAC_DRBG state machine using SHA-512 and the update/generate
 * transitions from NIST SP 800-90A. It is intentionally exposed only for
 * deterministic protocol fixtures and reproducible tests. Production key
 * generation should use the operating-system CSPRNG or an approved provider.
 */
export class HmacDrbgSha512 {
  #key = new Uint8Array(SHA512_BYTES);
  #value = new Uint8Array(SHA512_BYTES).fill(1);
  #reseedCounter = 1;

  constructor({ entropyInput, nonce, personalization = new Uint8Array(0) }) {
    const entropy = asBytes(entropyInput, 'DRBG entropy input');
    const nonceBytes = asBytes(nonce, 'DRBG nonce');
    const personalizationBytes = asBytes(personalization, 'DRBG personalization');
    if (entropy.byteLength < 32) {
      throw new ProofBundleError(
        Verdict.OUT_OF_BOUNDS,
        'HMAC_DRBG-SHA512 requires at least 256 bits of entropy input',
      );
    }
    if (nonceBytes.byteLength < 16) {
      throw new ProofBundleError(
        Verdict.OUT_OF_BOUNDS,
        'HMAC_DRBG-SHA512 requires a nonce of at least 128 bits',
      );
    }
    this.#update(concatBytes(entropy, nonceBytes, personalizationBytes));
  }

  #update(providedData) {
    const data = asBytes(providedData, 'DRBG provided data');
    this.#key = hmacSha512(this.#key, this.#value, Uint8Array.of(0), data);
    this.#value = hmacSha512(this.#key, this.#value);
    if (data.byteLength > 0) {
      this.#key = hmacSha512(this.#key, this.#value, Uint8Array.of(1), data);
      this.#value = hmacSha512(this.#key, this.#value);
    }
  }

  reseed(entropyInput, additionalInput = new Uint8Array(0)) {
    const entropy = asBytes(entropyInput, 'DRBG reseed entropy');
    if (entropy.byteLength < 32) {
      throw new ProofBundleError(
        Verdict.OUT_OF_BOUNDS,
        'HMAC_DRBG-SHA512 reseed requires at least 256 bits of entropy',
      );
    }
    this.#update(concatBytes(entropy, asBytes(additionalInput, 'DRBG additional input')));
    this.#reseedCounter = 1;
  }

  generate(length, additionalInput = new Uint8Array(0)) {
    boundedLength(length, MAX_DRBG_REQUEST, 'DRBG request');
    if (this.#reseedCounter > MAX_RESEED_COUNTER) {
      throw new ProofBundleError(Verdict.POLICY_DENIED, 'DRBG reseed is required');
    }
    const additional = asBytes(additionalInput, 'DRBG additional input');
    if (additional.byteLength > 0) this.#update(additional);
    const chunks = [];
    let produced = 0;
    while (produced < length) {
      this.#value = hmacSha512(this.#key, this.#value);
      chunks.push(this.#value);
      produced += this.#value.byteLength;
    }
    this.#update(additional);
    this.#reseedCounter += 1;
    return concatBytes(...chunks).slice(0, length);
  }

  get metadata() {
    return Object.freeze({
      algorithm: 'HMAC_DRBG-SHA-512',
      use: 'deterministic-test-and-protocol-fixtures-only',
      reseedCounter: this.#reseedCounter,
      predictionResistance: false,
    });
  }
}

export function createDeterministicFixtureDrbg(seed, label = 'ProofBundle test fixture') {
  const seedBytes = asBytes(seed, 'fixture seed');
  if (seedBytes.byteLength < 48) {
    throw new ProofBundleError(
      Verdict.OUT_OF_BOUNDS,
      'deterministic fixture seed must contain at least 48 bytes',
    );
  }
  return new HmacDrbgSha512({
    entropyInput: seedBytes.subarray(0, 32),
    nonce: seedBytes.subarray(32, 48),
    personalization: utf8(label, 'fixture label'),
  });
}

/**
 * Configurable online tests for symbols emitted by a raw entropy source.
 * Thresholds are source-specific inputs from an entropy assessment; this class
 * does not turn OS CSPRNG output into evidence of SP 800-90B validation.
 */
export class EntropyHealthMonitor {
  #last;
  #runLength = 0;
  #window = [];
  #failed = false;
  #failure;

  constructor({ alphabetSize, repetitionCutoff, windowSize, adaptiveCutoff }) {
    for (const [name, value] of Object.entries({
      alphabetSize,
      repetitionCutoff,
      windowSize,
      adaptiveCutoff,
    })) {
      if (!Number.isSafeInteger(value) || value < 2) {
        throw new ProofBundleError(Verdict.OUT_OF_BOUNDS, `${name} must be an integer >= 2`);
      }
    }
    if (adaptiveCutoff > windowSize) {
      throw new ProofBundleError(
        Verdict.OUT_OF_BOUNDS,
        'adaptiveCutoff cannot exceed windowSize',
      );
    }
    this.config = Object.freeze({
      alphabetSize,
      repetitionCutoff,
      windowSize,
      adaptiveCutoff,
    });
  }

  observe(symbol) {
    if (!Number.isSafeInteger(symbol) || symbol < 0 || symbol >= this.config.alphabetSize) {
      throw new ProofBundleError(Verdict.OUT_OF_BOUNDS, 'entropy symbol is outside its alphabet');
    }
    this.#runLength = symbol === this.#last ? this.#runLength + 1 : 1;
    this.#last = symbol;
    if (this.#runLength >= this.config.repetitionCutoff) {
      this.#failed = true;
      this.#failure = 'repetition-count-test';
    }
    this.#window.push(symbol);
    if (this.#window.length > this.config.windowSize) this.#window.shift();
    if (this.#window.length === this.config.windowSize) {
      const counts = new Map();
      for (const value of this.#window) counts.set(value, (counts.get(value) ?? 0) + 1);
      if (Math.max(...counts.values()) >= this.config.adaptiveCutoff) {
        this.#failed = true;
        this.#failure = 'adaptive-proportion-test';
      }
    }
    return this.status;
  }

  assertHealthy() {
    if (this.#failed) {
      throw new ProofBundleError(
        Verdict.POLICY_DENIED,
        `raw entropy source failed ${this.#failure}`,
      );
    }
  }

  get status() {
    return Object.freeze({
      healthy: !this.#failed,
      failure: this.#failure,
      observedWindow: this.#window.length,
      thresholdsAreSourceSpecific: true,
    });
  }
}

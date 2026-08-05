// Stable error types for the whole surface. Every error carries a `verdict`
// field naming the terminal verdict a verifier must issue if this error
// reaches it, so the mapping from "something went wrong" to "which of the 46
// codes" is recorded at the throw site rather than guessed at the catch site.
//
// Nothing here ever carries the verdict VERIFIED. That is not a comment; the
// constructor rejects it, so no failure path can produce a success verdict
// even by a typo.

import { assertValidVerdict } from './verdict/verdict.mjs';

export class ProofBundleError extends Error {
  constructor(message, { verdict, predicate = null, path = null, algorithmId = null, keyId = null, cause = null } = {}) {
    super(message);
    assertValidVerdict(verdict);
    if (verdict === 'VERIFIED' || verdict === 'VERIFIED_WITH_WARNINGS') {
      throw new TypeError('ProofBundleError: an error may not carry an accepting verdict');
    }
    this.name = new.target.name;
    this.verdict = verdict;
    this.predicate = predicate;
    this.path = path;
    this.algorithmId = algorithmId;
    this.keyId = keyId;
    if (cause) this.cause = cause;
  }
}

// The identifier is not in the registry at all.
export class UnknownAlgorithmError extends ProofBundleError {
  constructor(algId, predicate = 'algorithm.known') {
    super(`unknown algorithm identifier ${JSON.stringify(algId)}`, { verdict: 'UNKNOWN_ALGORITHM', predicate, algorithmId: algId });
  }
}

// The identifier is registered but this build has no implementation wired.
// Distinct from UNKNOWN: the caller asked for something real that we cannot do.
export class UnsupportedAlgorithmError extends ProofBundleError {
  constructor(algId, predicate = 'algorithm.supported') {
    super(`algorithm ${JSON.stringify(algId)} is registered but not implemented in this build`, { verdict: 'UNSUPPORTED_ALGORITHM', predicate, algorithmId: algId });
  }
}

// RECOGNIZE_AND_REJECT: recognized precisely so the rejection is deterministic.
export class ForbiddenAlgorithmError extends ProofBundleError {
  constructor(algId, predicate = 'algorithm.permitted') {
    super(`algorithm ${JSON.stringify(algId)} is recognize-and-reject; no output is ever produced for it`, { verdict: 'FORBIDDEN_ALGORITHM', predicate, algorithmId: algId });
  }
}

export class MalformedInputError extends ProofBundleError {
  constructor(message, opts = {}) { super(message, { verdict: 'MALFORMED', ...opts }); }
}

export class LimitExceededError extends ProofBundleError {
  constructor(message, opts = {}) { super(message, { verdict: 'LIMIT_EXCEEDED', ...opts }); }
}

export class ResourceExhaustedError extends ProofBundleError {
  constructor(message, opts = {}) { super(message, { verdict: 'RESOURCE_EXHAUSTED', ...opts }); }
}

export class ProviderUnavailableError extends ProofBundleError {
  constructor(providerId, reason, opts = {}) {
    super(`provider ${JSON.stringify(providerId)} unavailable: ${reason}`, { verdict: 'PROVIDER_UNAVAILABLE', predicate: 'provider.available', ...opts });
    this.providerId = providerId;
    this.reason = reason;
  }
}

// Generation attempted with a key/algorithm accepted only for historical
// verification. Verification of old material stays allowed; new output does not.
export class GenerationProhibitedError extends ProofBundleError {
  constructor(algId) {
    super(`algorithm ${JSON.stringify(algId)} is verify-only; generating new output with it is prohibited`, { verdict: 'FORBIDDEN_ALGORITHM', predicate: 'algorithm.generationPermitted', algorithmId: algId });
  }
}

export const Verdict = Object.freeze({
  VERIFIED: 'verified',
  MALFORMED: 'malformed',
  INVALID_SIGNATURE: 'invalid-signature',
  AUTHENTICATION_FAILED: 'authentication-failed',
  DIGEST_MISMATCH: 'digest-mismatch',
  UNKNOWN_ALGORITHM: 'unknown-algorithm',
  UNSUPPORTED_ALGORITHM: 'unsupported-algorithm',
  DEPRECATED_ALGORITHM: 'deprecated-algorithm',
  OUT_OF_BOUNDS: 'out-of-bounds',
  MISSING_SIDE_INFO: 'missing-side-info',
  LINEAGE_INVALID: 'lineage-invalid',
  RESOURCE_EXHAUSTED: 'resource-exhausted',
  POLICY_DENIED: 'policy-denied',
  INDETERMINATE: 'indeterminate',
  NOT_DEFINED: 'not-defined',
});

export class ProofBundleError extends Error {
  constructor(code, message, details = undefined, options = undefined) {
    super(message, options);
    this.name = 'ProofBundleError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

export function fail(code, message, details = undefined) {
  throw new ProofBundleError(code, message, details);
}

export function asVerificationFailure(error) {
  if (error instanceof ProofBundleError) {
    return Object.freeze({
      verdict: error.code,
      ok: false,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    });
  }
  return Object.freeze({
    verdict: Verdict.INDETERMINATE,
    ok: false,
    message: error instanceof Error ? error.message : String(error),
  });
}

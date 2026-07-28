// The full verdict enum. A verifier result carries exactly one of these as
// its terminal code — never more than one, never zero. See cause.mjs for
// the Result shape that enforces that.

export const VERDICTS = Object.freeze([
  'VERIFIED',
  'VERIFIED_WITH_WARNINGS',
  'MALFORMED',
  'NONCANONICAL',
  'UNSUPPORTED_VERSION',
  'UNKNOWN_VERSION',
  'UNSUPPORTED_ALGORITHM',
  'UNKNOWN_ALGORITHM',
  'DEPRECATED_ALGORITHM',
  'FORBIDDEN_ALGORITHM',
  'DIGEST_MISMATCH',
  'INVALID_SIGNATURE',
  'MISSING_SIGNATURE',
  'INSUFFICIENT_SIGNATURES',
  'UNEXPECTED_SIGNER',
  'UNKNOWN_SIGNER',
  'REVOKED_KEY',
  'EXPIRED_KEY',
  'KEY_NOT_YET_VALID',
  'CERTIFICATE_INVALID',
  'CERTIFICATE_PATH_INVALID',
  'CERTIFICATE_UNTRUSTED',
  'CERTIFICATE_REVOCATION_INDETERMINATE',
  'TIMESTAMP_INVALID',
  'TIMESTAMP_UNTRUSTED',
  'TIMESTAMP_INDETERMINATE',
  'BUNDLE_EXPIRED',
  'BUNDLE_NOT_YET_VALID',
  'LINEAGE_INVALID',
  'LINEAGE_CYCLE',
  'LINEAGE_MISSING',
  'ANCESTOR_UNAVAILABLE',
  'PAYLOAD_MISSING',
  'SIDE_INFORMATION_MISSING',
  'POLICY_DENIED',
  'POLICY_INDETERMINATE',
  'RESOURCE_EXHAUSTED',
  'LIMIT_EXCEEDED',
  'PROVIDER_UNAVAILABLE',
  'EXTERNAL_SERVICE_UNAVAILABLE',
  'EVIDENCE_INCOMPLETE',
  'NEGATIVE',
  'NULL',
  'INDETERMINATE',
  'NOT_DEFINED',
  'INTERNAL_ERROR',
]);

const VERDICT_SET = new Set(VERDICTS);

// Verdicts that are never allowed to occur alongside a positive/accepting
// outcome for the same result — used by tests, not by the dispatcher
// itself, so the exclusivity claims below are checkable rather than
// asserted only in prose.
export const FAILURE_VERDICTS = Object.freeze(VERDICTS.filter((v) => v !== 'VERIFIED' && v !== 'VERIFIED_WITH_WARNINGS'));

export function isValidVerdict(code) {
  return typeof code === 'string' && VERDICT_SET.has(code);
}

export function assertValidVerdict(code) {
  if (!isValidVerdict(code)) throw new RangeError(`not a registered verdict code: ${JSON.stringify(code)}`);
  return code;
}

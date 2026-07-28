// Constant-time comparison for security-relevant byte equality checks
// (MAC tags, signature-derived values, key material). A length mismatch is
// checked first and is not timing-sensitive to leak — only the mismatch
// *position*, if lengths already differ, would be — so unequal length
// short-circuits safely, and equal-length inputs are compared in full with
// no early return.

export function constantTimeEqual(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
    throw new TypeError('constantTimeEqual: both arguments must be Uint8Array');
  }
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

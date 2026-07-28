// SHAKE128/256 with an explicit output length — thin arity wrapper over the
// shared implementation in sha3.mjs (itself re-exported from the verified
// crypto/keccak.mjs). Kept as a separate module because the registry lists
// SHAKE as its own primitive family with its own parameter (output length),
// distinct from the fixed-length SHA3-* digests.

import { shake128 as _shake128, shake256 as _shake256 } from './sha3.mjs';

export function shake128(bytes, outputLength) {
  if (!Number.isInteger(outputLength) || outputLength <= 0) {
    throw new RangeError('shake128: outputLength must be a positive integer');
  }
  return _shake128(bytes, outputLength);
}

export function shake256(bytes, outputLength) {
  if (!Number.isInteger(outputLength) || outputLength <= 0) {
    throw new RangeError('shake256: outputLength must be a positive integer');
  }
  return _shake256(bytes, outputLength);
}

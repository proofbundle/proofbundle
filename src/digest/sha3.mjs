// SHA3-256/384/512, SHAKE128/256 (PURE_MJS implementation class). This
// module does not reimplement Keccak — it re-exports the from-scratch
// implementation already recovered and independently verified this session
// at ../../crypto/keccak.mjs (88/88 against node:crypto, byte-identical to
// the SHA-3 now shipped in proofbundle.html). Duplicating that code here
// would create two copies to keep in sync for no benefit; this is the
// single source.

export { sha3_224, sha3_256, sha3_384, sha3_512, shake128, shake256 } from '../../crypto/keccak.mjs';

// Keccak: the pre-standardization variant. Same permutation and rates as
// SHA-3, different domain suffix (0x01 vs 0x06), so the two are NOT
// interchangeable — same input, different digest.
export { keccak_224, keccak_256, keccak_384, keccak_512 } from '../../crypto/keccak.mjs';

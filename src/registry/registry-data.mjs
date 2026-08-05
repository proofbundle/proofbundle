// The exhaustive algorithm enumeration, as data.
//
// One row per algorithm/parameter-set named in the specification, including
// the ones this build cannot perform. A row exists so its status can be stated
// — an algorithm absent from the registry is an algorithm whose absence nobody
// recorded, which is the failure mode this file prevents.
//
// STATUS MEANINGS, applied strictly:
//   COMPLETE                      implemented here, with vectors and tests
//   COMPLETE_PROVIDER_UNAVAILABLE the interface and its deterministic refusal
//                                 are implemented and tested; the backing
//                                 provider is absent, so no output is produced
//   LEGACY_VERIFY_ONLY            computable for historical verification only;
//                                 generation is refused
//   RECOGNIZE_ONLY                recognized so rejection is deterministic;
//                                 never computed
//   PARTIAL                       implemented but missing a required artifact
//   BLOCKED                       waits on another row in this same registry
//   NOT_IMPLEMENTED               not built; `blocker` says exactly why
//
// Every non-COMPLETE row carries a `blocker` naming the specific dependency.
// These are deliberately not collapsed into one generic message: "needs a
// vetted PQ provider" and "OpenSSL exposes no GCM mode for this cipher" are
// different facts with different remedies.

const PQ_PROVIDER = 'BLOCKING DEPENDENCY: no vetted post-quantum provider is bundled or configured; node:crypto exposes no such key type on this build.';
const OQS = 'BLOCKING DEPENDENCY: requires a vetted liboqs-class provider; none is bundled or configured.';
const BROKEN = 'Cryptanalytically broken. Recognized so a deterministic rejection can be issued; never computed.';
const SUPERSEDED = 'Superseded by the standardized version. Recognized for rejection so a bundle naming the draft identifier fails deterministically rather than being silently treated as the standard.';

// ---------------------------------------------------------------- digests
export const DIGEST_ROWS = [
  ['SHA-224', 'NODE_NATIVE', 'COMPLETE', { digestLength: 28, module: 'src/digest/sha2.mjs', vectors: 'vectors/digest/sha-224.json' }],
  ['SHA-256', 'NODE_NATIVE', 'COMPLETE', { digestLength: 32, module: 'src/digest/sha2.mjs', vectors: 'vectors/digest/sha-256.json' }],
  ['SHA-384', 'NODE_NATIVE', 'COMPLETE', { digestLength: 48, module: 'src/digest/sha2.mjs', vectors: 'vectors/digest/sha-384.json' }],
  ['SHA-512', 'NODE_NATIVE', 'COMPLETE', { digestLength: 64, module: 'src/digest/sha2.mjs', vectors: 'vectors/digest/sha-512.json' }],
  ['SHA-512/224', 'NODE_NATIVE', 'COMPLETE', { digestLength: 28, module: 'src/digest/sha2.mjs', vectors: 'vectors/digest/sha-512-224.json' }],
  ['SHA-512/256', 'NODE_NATIVE', 'COMPLETE', { digestLength: 32, module: 'src/digest/sha2.mjs', vectors: 'vectors/digest/sha-512-256.json' }],
  ['SHA3-224', 'PURE_MJS', 'COMPLETE', { digestLength: 28, module: 'src/digest/sha3.mjs', vectors: 'vectors/digest/sha3-224.json', notes: 'Unlocked this pass by exporting the sponge from crypto/keccak.mjs; checked against the published SHA3-224("abc") digest.' }],
  ['SHA3-256', 'PURE_MJS', 'COMPLETE', { digestLength: 32, module: 'src/digest/sha3.mjs', vectors: 'vectors/digest/sha3-256.json' }],
  ['SHA3-384', 'PURE_MJS', 'COMPLETE', { digestLength: 48, module: 'src/digest/sha3.mjs', vectors: 'vectors/digest/sha3-384.json' }],
  ['SHA3-512', 'PURE_MJS', 'COMPLETE', { digestLength: 64, module: 'src/digest/sha3.mjs', vectors: 'vectors/digest/sha3-512.json' }],
  ['SHAKE128', 'PURE_MJS', 'COMPLETE', { digestLength: 'variable', module: 'src/digest/shake.mjs', vectors: 'vectors/digest/shake128.json' }],
  ['SHAKE256', 'PURE_MJS', 'COMPLETE', { digestLength: 'variable', module: 'src/digest/shake.mjs', vectors: 'vectors/digest/shake256.json' }],
  ['cSHAKE128', 'PURE_MJS', 'COMPLETE', { digestLength: 'variable', module: 'src/digest/sp800-185.mjs', vectors: 'vectors/digest/sp800-185.json', notes: 'SP 800-185. Checked against NIST cSHAKE128 Sample 1.' }],
  ['cSHAKE256', 'PURE_MJS', 'COMPLETE', { digestLength: 'variable', module: 'src/digest/sp800-185.mjs', vectors: 'vectors/digest/sp800-185.json', notes: 'SP 800-185. Checked against NIST cSHAKE256 Sample 3.' }],
  ['TupleHash128', 'PURE_MJS', 'COMPLETE', { digestLength: 'variable', module: 'src/digest/sp800-185.mjs', vectors: 'vectors/digest/sp800-185.json', notes: 'Checked against NIST TupleHash128 Sample 1. Hashes a sequence of strings unambiguously — ["ab","c"] and ["a","bc"] differ.' }],
  ['TupleHash256', 'PURE_MJS', 'COMPLETE', { digestLength: 'variable', module: 'src/digest/sp800-185.mjs', vectors: 'vectors/digest/sp800-185.json' }],
  ['ParallelHash128', 'PURE_MJS', 'COMPLETE', { digestLength: 'variable', module: 'src/digest/sp800-185.mjs', vectors: 'vectors/digest/sp800-185.json', notes: 'Checked against NIST ParallelHash128 Sample 1. Computed sequentially — output is identical; no parallel execution is claimed.' }],
  ['ParallelHash256', 'PURE_MJS', 'COMPLETE', { digestLength: 'variable', module: 'src/digest/sp800-185.mjs', vectors: 'vectors/digest/sp800-185.json' }],
  ['Keccak-224', 'PURE_MJS', 'COMPLETE', { digestLength: 28, module: 'src/digest/sha3.mjs', vectors: 'vectors/digest/keccak.json', notes: 'Pre-standardization 0x01 domain suffix, distinct from SHA3 0x06. Same input, different digest.' }],
  ['Keccak-256', 'PURE_MJS', 'COMPLETE', { digestLength: 32, module: 'src/digest/sha3.mjs', vectors: 'vectors/digest/keccak.json', notes: 'Checked against the published Keccak-256("abc") digest.' }],
  ['Keccak-384', 'PURE_MJS', 'COMPLETE', { digestLength: 48, module: 'src/digest/sha3.mjs', vectors: 'vectors/digest/keccak.json' }],
  ['Keccak-512', 'PURE_MJS', 'COMPLETE', { digestLength: 64, module: 'src/digest/sha3.mjs', vectors: 'vectors/digest/keccak.json' }],
  ['BLAKE2b-512', 'NODE_NATIVE', 'COMPLETE', { digestLength: 64, module: 'src/digest/blake2.mjs', vectors: 'vectors/digest/blake2.json' }],
  ['BLAKE2s-256', 'NODE_NATIVE', 'COMPLETE', { digestLength: 32, module: 'src/digest/blake2.mjs', vectors: 'vectors/digest/blake2.json' }],
  ['SM3', 'NODE_NATIVE', 'COMPLETE', { digestLength: 32, module: 'src/digest/legacy-and-national.mjs', vectors: 'vectors/digest/legacy-national.json', notes: 'GM/T 0004-2012, available in this OpenSSL build; checked against the published SM3("abc") digest.' }],
  ['BLAKE2b-160', 'NODE_NATIVE', 'NOT_IMPLEMENTED', { digestLength: 20, blocker: 'BLOCKING DEPENDENCY: node:crypto exposes only blake2b512, not BLAKE2 parameterised digest lengths. BLAKE2b-160 is NOT the first 20 bytes of BLAKE2b-512 — the digest length is an input to the initial state — so it cannot be derived from the available primitive.' }],
  ['BLAKE2b-256', 'NODE_NATIVE', 'NOT_IMPLEMENTED', { digestLength: 32, blocker: 'BLOCKING DEPENDENCY: same as BLAKE2b-160 — node:crypto exposes only blake2b512.' }],
  ['BLAKE2b-384', 'NODE_NATIVE', 'NOT_IMPLEMENTED', { digestLength: 48, blocker: 'BLOCKING DEPENDENCY: same as BLAKE2b-160 — node:crypto exposes only blake2b512.' }],
  ['BLAKE2s-128', 'NODE_NATIVE', 'NOT_IMPLEMENTED', { digestLength: 16, blocker: 'BLOCKING DEPENDENCY: node:crypto exposes only blake2s256.' }],
  ['BLAKE2s-160', 'NODE_NATIVE', 'NOT_IMPLEMENTED', { digestLength: 20, blocker: 'BLOCKING DEPENDENCY: node:crypto exposes only blake2s256.' }],
  ['BLAKE2s-224', 'NODE_NATIVE', 'NOT_IMPLEMENTED', { digestLength: 28, blocker: 'BLOCKING DEPENDENCY: node:crypto exposes only blake2s256.' }],
  ['BLAKE3-256', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { digestLength: 32, blocker: 'BLOCKING DEPENDENCY: node:crypto getHashes() has no blake3 and no vetted native/WASM module is bundled or configured (PROOFBUNDLE_BLAKE3_MODULE unset).' }],
  ['BLAKE3-XOF', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { digestLength: 'variable', blocker: 'BLOCKING DEPENDENCY: same as BLAKE3-256.' }],
  ['Streebog-256', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { digestLength: 32, blocker: 'BLOCKING DEPENDENCY: GOST R 34.11-2012 needs a gost engine, absent from this OpenSSL build; no provider configured.' }],
  ['Streebog-512', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { digestLength: 64, blocker: 'BLOCKING DEPENDENCY: same as Streebog-256.' }],
  ['Ascon-Hash', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { digestLength: 32, blocker: 'BLOCKING DEPENDENCY: NIST lightweight-cryptography Ascon is not in node:crypto and no provider is bundled.' }],
  ['Ascon-Hasha', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { digestLength: 32, blocker: 'BLOCKING DEPENDENCY: same as Ascon-Hash.' }],
  ['SHA-1', 'LEGACY_VERIFY_ONLY', 'LEGACY_VERIFY_ONLY', { digestLength: 20, module: 'src/digest/legacy-and-national.mjs', vectors: 'vectors/digest/legacy-national.json', notes: 'Collision-broken (SHAttered, 2017). Computable for historical verification; digestForGeneration() refuses it.' }],
  ['RIPEMD-160', 'LEGACY_VERIFY_ONLY', 'LEGACY_VERIFY_ONLY', { digestLength: 20, module: 'src/digest/legacy-and-national.mjs', vectors: 'vectors/digest/legacy-national.json', notes: 'Still present in Bitcoin address derivation and older PGP artifacts. Verify-only.' }],
  ['MD2', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { digestLength: 16, module: 'src/digest/legacy-and-national.mjs', blocker: BROKEN }],
  ['MD4', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { digestLength: 16, module: 'src/digest/legacy-and-national.mjs', blocker: BROKEN }],
  ['MD5', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { digestLength: 16, module: 'src/digest/digest.mjs', blocker: BROKEN }],
  ['Whirlpool', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { digestLength: 64, module: 'src/digest/legacy-and-national.mjs', blocker: 'Not in this OpenSSL build and not required by any ProofBundle profile. Recognized for deterministic rejection.' }],
  ['RIPEMD-128', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { digestLength: 16, module: 'src/digest/legacy-and-national.mjs', blocker: BROKEN }],
  ['RIPEMD-256', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { digestLength: 32, module: 'src/digest/legacy-and-national.mjs', blocker: 'Provides only RIPEMD-128-level collision resistance despite its output size; not required by any profile.' }],
  ['RIPEMD-320', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { digestLength: 40, module: 'src/digest/legacy-and-national.mjs', blocker: 'Provides only RIPEMD-160-level collision resistance despite its output size; not required by any profile.' }],
];

// -------------------------------------------------------------------- MAC
const HMAC_COMPLETE = [
  ['HMAC-SHA-224', 28], ['HMAC-SHA-256', 32], ['HMAC-SHA-384', 48], ['HMAC-SHA-512', 64],
  ['HMAC-SHA-512/224', 28], ['HMAC-SHA-512/256', 32],
  ['HMAC-SHA3-224', 28], ['HMAC-SHA3-256', 32], ['HMAC-SHA3-384', 48], ['HMAC-SHA3-512', 64],
  ['HMAC-SM3', 32],
];

export const MAC_ROWS = [
  ...HMAC_COMPLETE.map(([id, len]) => [id, 'NODE_NATIVE', 'COMPLETE', { digestLength: len, module: 'src/mac/hmac.mjs', vectors: 'vectors/mac/hmac.json' }]),
  ['HMAC-SHA-1', 'LEGACY_VERIFY_ONLY', 'LEGACY_VERIFY_ONLY', { digestLength: 20, module: 'src/mac/hmac.mjs', vectors: 'vectors/mac/hmac.json', notes: 'HMAC-SHA-1 is not broken by the SHA-1 collision attacks, but is deprecated for new use. macGenerate() refuses it; macBytes() still verifies historical tags.' }],
  ['HMAC-RIPEMD-160', 'LEGACY_VERIFY_ONLY', 'LEGACY_VERIFY_ONLY', { digestLength: 20, module: 'src/mac/hmac.mjs', vectors: 'vectors/mac/hmac.json', notes: 'Verify-only, same treatment as HMAC-SHA-1.' }],
  ['KMAC128', 'PURE_MJS', 'COMPLETE', { digestLength: 'variable', module: 'src/digest/sp800-185.mjs', vectors: 'vectors/digest/sp800-185.json', notes: 'SP 800-185. Checked against NIST KMAC128 Samples 1 and 2. Output length is bound into the input via right_encode, so a truncated tag is not the valid tag of that shorter length.' }],
  ['KMAC256', 'PURE_MJS', 'COMPLETE', { digestLength: 'variable', module: 'src/digest/sp800-185.mjs', vectors: 'vectors/digest/sp800-185.json', notes: 'Checked against NIST KMAC256 Sample 4.' }],
  ['keyed-BLAKE2', 'VETTED_PROVIDER', 'COMPLETE_PROVIDER_UNAVAILABLE', { module: 'src/digest/blake2.mjs', blocker: 'FINDING: node:crypto accepts createHash(alg, { key }) and silently ignores the key, returning an unkeyed digest. blake2Keyed() detects this and raises PROVIDER_UNAVAILABLE rather than shipping a MAC that authenticates nothing. Interface and refusal are implemented and tested; no keyed BLAKE2 output is ever produced on this build.' }],
  ['keyed-BLAKE3', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: BLAKE3 itself is not implemented (see BLAKE3-256).' }],
  ['Poly1305', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { digestLength: 16, blocker: 'BLOCKING DEPENDENCY: node:crypto exposes Poly1305 only inside the ChaCha20-Poly1305 AEAD, not as a standalone one-time authenticator.' }],
  ['GMAC', 'NODE_NATIVE', 'NOT_IMPLEMENTED', { digestLength: 16, blocker: 'BLOCKING DEPENDENCY: none technical — GMAC is AES-GCM over empty plaintext and would be a thin wrapper over the existing AEAD module. Not built this pass; no caller needs it.' }],
  ['AES-128-CMAC', 'PURE_MJS', 'NOT_IMPLEMENTED', { digestLength: 16, blocker: 'BLOCKING DEPENDENCY: node:crypto has no createCmac and no CMAC cipher mode; would require implementing subkey derivation and the CBC chain in pure MJS.' }],
  ['AES-192-CMAC', 'PURE_MJS', 'NOT_IMPLEMENTED', { digestLength: 16, blocker: 'BLOCKING DEPENDENCY: same as AES-128-CMAC.' }],
  ['AES-256-CMAC', 'PURE_MJS', 'NOT_IMPLEMENTED', { digestLength: 16, blocker: 'BLOCKING DEPENDENCY: same as AES-128-CMAC.' }],
  ['AES-CBC-MAC', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { digestLength: 16, blocker: 'Raw CBC-MAC is insecure for variable-length messages. Recognized for deterministic rejection; CMAC is the correct construction.' }],
  ['Ascon-MAC', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: same as Ascon-Hash.' }],
];

// -------------------------------------------------------------------- KDF
const HKDF_COMPLETE = ['HKDF-SHA-224', 'HKDF-SHA-256', 'HKDF-SHA-384', 'HKDF-SHA-512', 'HKDF-SHA-512/224', 'HKDF-SHA-512/256', 'HKDF-SHA3-224', 'HKDF-SHA3-256', 'HKDF-SHA3-384', 'HKDF-SHA3-512', 'HKDF-SM3'];
const SP800_108 = [];
for (const mode of ['Counter', 'Feedback', 'Double-Pipeline']) {
  for (const d of ['SHA-256', 'SHA-384', 'SHA-512']) {
    SP800_108.push([`SP800-108-${mode}-HMAC-${d}`, 'PURE_MJS', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: none technical — buildable on the existing HMAC module. Not built this pass: ProofBundle uses HKDF plus its own domain-separated subkey derivation, so no caller needs SP 800-108.' }]);
  }
}
const SP800_56C = [];
for (const step of ['One-Step', 'Two-Step']) {
  for (const d of ['SHA-256', 'SHA-384', 'SHA-512']) {
    SP800_56C.push([`SP800-56C-${step}-${d}`, 'PURE_MJS', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: none technical — buildable on the existing digest/HMAC modules. Not built this pass: the KEM combiner uses HKDF directly.' }]);
  }
}

export const KDF_ROWS = [
  ...HKDF_COMPLETE.map((id) => [id, 'NODE_NATIVE', 'COMPLETE', { module: 'src/kdf/hkdf.mjs', vectors: 'vectors/kdf/kdf.json' }]),
  ['PBKDF2-HMAC-SHA-224', 'NODE_NATIVE', 'COMPLETE', { module: 'src/kdf/pbkdf2.mjs', vectors: 'vectors/kdf/kdf.json' }],
  ['PBKDF2-HMAC-SHA-256', 'NODE_NATIVE', 'COMPLETE', { module: 'src/kdf/pbkdf2.mjs', vectors: 'vectors/kdf/kdf.json' }],
  ['PBKDF2-HMAC-SHA-384', 'NODE_NATIVE', 'COMPLETE', { module: 'src/kdf/pbkdf2.mjs', vectors: 'vectors/kdf/kdf.json' }],
  ['PBKDF2-HMAC-SHA-512', 'NODE_NATIVE', 'COMPLETE', { module: 'src/kdf/pbkdf2.mjs', vectors: 'vectors/kdf/kdf.json' }],
  ['PBKDF2-HMAC-SHA-1', 'LEGACY_VERIFY_ONLY', 'LEGACY_VERIFY_ONLY', { module: 'src/kdf/pbkdf2.mjs', vectors: 'vectors/kdf/kdf.json', notes: 'Extremely common in existing password databases, so verification must remain possible. pbkdf2Generate() refuses it.' }],
  ['scrypt', 'NODE_NATIVE', 'PARTIAL', { module: 'src/kdf/scrypt.mjs', blocker: 'Implemented with N/r/p validation and a maxmem ceiling yielding RESOURCE_EXHAUSTED, unit-tested for both rejection paths. PARTIAL because no positive RFC 7914 known-answer vector is recorded, so the closure rule is not met for this row.' }],
  ['Argon2d', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: needs a vetted native/WASM Argon2 module; none is bundled and PROOFBUNDLE_ARGON2_MODULE is unset. The provider row is probed and reports PROVIDER_UNAVAILABLE.' }],
  ['Argon2i', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: same as Argon2d.' }],
  ['Argon2id', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: same as Argon2d.' }],
  ...SP800_108, ...SP800_56C,
  ['ProofBundle-subkey-derivation', 'PURE_MJS', 'COMPLETE', { module: 'src/kdf/subkey-derivation.mjs', vectors: 'vectors/kdf/kdf.json', domainTag: 'PB/v1/subkey-derivation' }],
];

// ------------------------------------------------------- classical signatures
export const CLASSICAL_SIG_ROWS = [
  ['Ed25519', 'NODE_NATIVE', 'COMPLETE', { sigEncoding: 'raw 64-byte' }],
  ['Ed448', 'NODE_NATIVE', 'COMPLETE', { sigEncoding: 'raw 114-byte' }],
  ['Ed25519ctx', 'NODE_NATIVE', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: node:crypto exposes no context parameter for Ed25519; RFC 8032 Ed25519ctx cannot be driven through it.' }],
  ['Ed25519ph', 'NODE_NATIVE', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: node:crypto exposes no prehash mode for Ed25519.' }],
  ['Ed448ph', 'NODE_NATIVE', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: node:crypto exposes no prehash mode for Ed448.' }],
  ['ECDSA-P-224-SHA-224', 'NODE_NATIVE', 'COMPLETE', { sigEncoding: 'DER SEQUENCE(r,s)' }],
  ['ECDSA-P-256-SHA-256', 'NODE_NATIVE', 'COMPLETE', { sigEncoding: 'DER SEQUENCE(r,s)' }],
  ['ECDSA-P-384-SHA-384', 'NODE_NATIVE', 'COMPLETE', { sigEncoding: 'DER SEQUENCE(r,s)' }],
  ['ECDSA-P-521-SHA-512', 'NODE_NATIVE', 'COMPLETE', { sigEncoding: 'DER SEQUENCE(r,s)' }],
  ['ECDSA-secp256k1-SHA-256', 'NODE_NATIVE', 'COMPLETE', { sigEncoding: 'DER SEQUENCE(r,s)' }],
  ['ECDSA-P-192-SHA-256', 'LEGACY_VERIFY_ONLY', 'LEGACY_VERIFY_ONLY', { notes: 'P-192 is below current strength. Verify-only; generation refused.' }],
  ['RSA-PSS-SHA-224', 'NODE_NATIVE', 'COMPLETE', { sigEncoding: 'PSS, salt length = digest length', notes: '2048-bit minimum modulus.' }],
  ['RSA-PSS-SHA-256', 'NODE_NATIVE', 'COMPLETE', { sigEncoding: 'PSS, salt length = digest length' }],
  ['RSA-PSS-SHA-384', 'NODE_NATIVE', 'COMPLETE', { sigEncoding: 'PSS, salt length = digest length' }],
  ['RSA-PSS-SHA-512', 'NODE_NATIVE', 'COMPLETE', { sigEncoding: 'PSS, salt length = digest length' }],
  ['RSA-PSS-SHA-512/224', 'NODE_NATIVE', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: OpenSSL rejects sha512-224 as a PSS/MGF1 digest through the node RSA-PSS interface.' }],
  ['RSA-PSS-SHA-512/256', 'NODE_NATIVE', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: same as RSA-PSS-SHA-512/224.' }],
  ['RSA-PSS-SHAKE128', 'PURE_MJS', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: RFC 8702 SHAKE-based PSS is not exposed by node:crypto; would require a pure-MJS PSS encoder over the existing SHAKE.' }],
  ['RSA-PSS-SHAKE256', 'PURE_MJS', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: same as RSA-PSS-SHAKE128.' }],
  ['RSA-PKCS1v1.5', 'LEGACY_VERIFY_ONLY', 'LEGACY_VERIFY_ONLY', { notes: 'Default SHA-256 binding. Historical verification only; generation refused in two independent places.' }],
  ['RSA-PKCS1v1.5-SHA-1', 'LEGACY_VERIFY_ONLY', 'LEGACY_VERIFY_ONLY', {}],
  ['RSA-PKCS1v1.5-SHA-224', 'LEGACY_VERIFY_ONLY', 'LEGACY_VERIFY_ONLY', {}],
  ['RSA-PKCS1v1.5-SHA-256', 'LEGACY_VERIFY_ONLY', 'LEGACY_VERIFY_ONLY', {}],
  ['RSA-PKCS1v1.5-SHA-384', 'LEGACY_VERIFY_ONLY', 'LEGACY_VERIFY_ONLY', {}],
  ['RSA-PKCS1v1.5-SHA-512', 'LEGACY_VERIFY_ONLY', 'LEGACY_VERIFY_ONLY', {}],
  ['DSA-SHA-1', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: 'DSA is withdrawn from FIPS 186-5 for new signatures. Recognized for deterministic rejection.' }],
  ['DSA-SHA-224', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: 'DSA is withdrawn from FIPS 186-5 for new signatures. Recognized for deterministic rejection.' }],
  ['DSA-SHA-256', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: 'DSA is withdrawn from FIPS 186-5 for new signatures. Recognized for deterministic rejection.' }],
  ['GOST-R-34.10-2012-256', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: no GOST engine in this OpenSSL build and no provider configured.' }],
  ['GOST-R-34.10-2012-512', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: same as GOST-R-34.10-2012-256.' }],
  ['SM2-SM3', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: SM3 is available here as a digest, but node:crypto exposes no SM2 signature interface — SM2 requires the ZA user-identity preprocessing step, which node does not perform.' }],
  ['ECSDSA', 'PURE_MJS', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: no EC Schnorr interface in node:crypto; would require pure-MJS curve arithmetic.' }],
];

// -------------------------------------------------- post-quantum signatures
const SLH_DSA = [];
for (const h of ['SHA2', 'SHAKE']) for (const s of ['128', '192', '256']) for (const v of ['s', 'f']) SLH_DSA.push(`SLH-DSA-${h}-${s}${v}`);
const SPHINCS_PLUS = [];
for (const h of ['SHA2', 'SHAKE']) for (const s of ['128', '192', '256']) for (const v of ['s', 'f']) SPHINCS_PLUS.push(`SPHINCS+-${h}-${s}${v}`);
const SPHINCS_R3 = [];
for (const h of ['SHA-256', 'SHAKE-256']) for (const s of ['128', '192', '256']) for (const v of ['s', 'f']) for (const r of ['robust', 'simple']) SPHINCS_R3.push(`SPHINCS+-${h}-${s}${v}-${r}`);
const XMSS = [];
for (const h of ['SHA2', 'SHAKE']) for (const t of ['10', '16', '20']) for (const n of ['256', '512']) XMSS.push(`XMSS-${h}_${t}_${n}`);
const LMS = ['LMS-SHA256_M32_H5', 'LMS-SHA256_M32_H10', 'LMS-SHA256_M32_H15', 'LMS-SHA256_M32_H20', 'LMS-SHA256_M32_H25'];
const STATEFUL = ' Additionally STATEFUL: signing consumes a one-time key and reusing an index is catastrophic. ProofBundle has no state-management story for stateful signatures, which is an independent blocker from provider availability.';

export const PQ_SIG_ROWS = [
  ...['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'].map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: PQ_PROVIDER + ' A separate ML-DSA implementation exists under crypto/ and was verified earlier, but it is not registered through this src/ dispatch layer, so the surface cannot dispatch it by authenticated algorithm id.' }]),
  ...SLH_DSA.map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: PQ_PROVIDER + ' (FIPS 205.)' }]),
  ...['Falcon-512', 'Falcon-1024'].map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: OQS + ' FN-DSA; the FIPS draft was not final at time of writing.' }]),
  ...XMSS.map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: OQS + STATEFUL }]),
  ...LMS.map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: OQS + STATEFUL }]),
  ['HSS-LMS', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: OQS + STATEFUL }],
  ...SPHINCS_PLUS.map((id) => [id, 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: SUPERSEDED + ' Use the SLH-DSA identifier.' }]),
  ...SPHINCS_R3.map((id) => [id, 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: SUPERSEDED + ' Round-3 parameter naming, superseded by FIPS 205 SLH-DSA.' }]),
  ...['Dilithium2', 'Dilithium3', 'Dilithium5'].map((id) => [id, 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: SUPERSEDED + ' Use the ML-DSA identifier; FIPS 204 is not bit-compatible with round-3 Dilithium.' }]),
  ...['Picnic-L1-FS', 'Picnic-L1-UR', 'Picnic-L3-FS', 'Picnic-L3-UR', 'Picnic-L5-FS', 'Picnic-L5-UR'].map((id) => [id, 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: 'Withdrawn from the NIST process; not selected for standardization. Recognized for deterministic rejection.' }]),
  ...['Rainbow-I', 'Rainbow-III', 'Rainbow-V'].map((id) => [id, 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: 'BROKEN: practical key-recovery attack (Beullens, 2022). Recognized so a bundle naming it fails deterministically.' }]),
  ...['GeMSS-128', 'GeMSS-192', 'GeMSS-256'].map((id) => [id, 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: 'BROKEN: attacks on the underlying HFEv- problem. Recognized for deterministic rejection.' }]),
];

// ------------------------------------------------------------- KEM / ECDH
const MCELIECE = ['348864', '348864f', '460896', '460896f', '6688128', '6688128f', '6960119', '6960119f', '8192128', '8192128f'].map((p) => `Classic-McEliece-${p}`);
const NTRU = ['NTRU-HPS-2048-509', 'NTRU-HPS-2048-677', 'NTRU-HPS-4096-821', 'NTRU-HRSS-701'];
const NTRU_PRIME = ['sntrup653', 'sntrup761', 'sntrup857', 'ntrulpr653', 'ntrulpr761', 'ntrulpr857'];
const FRODO = [];
for (const n of ['640', '976', '1344']) for (const s of ['AES', 'SHAKE']) FRODO.push(`FrodoKEM-${n}-${s}`);
const ROUND1 = ['BigQuake', 'Ding-Key-Exchange', 'DAGS', 'Hila5', 'KINDI', 'LAC', 'Lima', 'Lizard', 'RLizard', 'Lottery', 'NTRUEncrypt', 'NTRU-HRSS-KEM-R1', 'ODD', 'OKCN-AKCN', 'Round2', 'RQC', 'Three-Bears', 'Titanium'];

export const KEM_ROWS = [
  ['X25519', 'NODE_NATIVE', 'COMPLETE', {}],
  ['X448', 'NODE_NATIVE', 'COMPLETE', {}],
  ['ECDH-P-224', 'NODE_NATIVE', 'COMPLETE', {}],
  ['ECDH-P-256', 'NODE_NATIVE', 'COMPLETE', {}],
  ['ECDH-P-384', 'NODE_NATIVE', 'COMPLETE', {}],
  ['ECDH-P-521', 'NODE_NATIVE', 'COMPLETE', {}],
  ['ECDH-secp256k1', 'NODE_NATIVE', 'COMPLETE', {}],
  ['ECDH-P-192', 'LEGACY_VERIFY_ONLY', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: below current strength, and no historical ProofBundle artifact uses it, so no verify-only path was built.' }],
  ...['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'].map((id) => [id, 'PURE_MJS', 'NOT_IMPLEMENTED', { module: 'crypto/mlkem.mjs', blocker: 'BLOCKING DEPENDENCY: ML-KEM itself is implemented and vector-verified at crypto/mlkem.mjs. NOT_IMPLEMENTED here means specifically: not registered through this src/ registry and dispatcher, so the surface cannot dispatch it by authenticated algorithm id.' }]),
  ...MCELIECE.map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: OQS }]),
  ...NTRU.map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: OQS }]),
  ...NTRU_PRIME.map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: OQS }]),
  ...['BIKE-L1', 'BIKE-L3', 'BIKE-L5'].map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: OQS }]),
  ...['HQC-128', 'HQC-192', 'HQC-256'].map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: OQS }]),
  ...FRODO.map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: OQS }]),
  ...['Kyber512', 'Kyber768', 'Kyber1024'].map((id) => [id, 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: SUPERSEDED + ' Use the ML-KEM identifier; FIPS 203 is not bit-compatible with round-3 Kyber.' }]),
  ...['LightSaber', 'Saber', 'FireSaber'].map((id) => [id, 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: 'Not selected for standardization. Recognized for deterministic rejection.' }]),
  ...['SIKEp434', 'SIKEp503', 'SIKEp610', 'SIKEp751', 'SIKE-compressed'].map((id) => [id, 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: 'BROKEN: practical key recovery in minutes on one core (Castryck-Decru, 2022). Recognized so a bundle naming it fails deterministically.' }]),
  ...ROUND1.map((id) => [id, 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: 'NIST PQC Round 1 candidate, not advanced. Recognized for deterministic rejection.' }]),
  ['RSA-OAEP-SHA-1', 'LEGACY_VERIFY_ONLY', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: RSA key transport is not part of the ProofBundle envelope design, which uses KEM + AEAD. No caller exists.' }],
  ...['RSA-OAEP-SHA-224', 'RSA-OAEP-SHA-256', 'RSA-OAEP-SHA-384', 'RSA-OAEP-SHA-512'].map((id) => [id, 'NODE_NATIVE', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: none technical — node:crypto supports RSA-OAEP and it was verified available during this build. Not wired: the envelope design uses KEM + AEAD, so no caller exists.' }]),
  ['RSA-PKCS1-encryption', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: 'PKCS#1 v1.5 encryption is vulnerable to Bleichenbacher padding-oracle attacks. Recognized for deterministic rejection; never used for key transport.' }],
  ['SM2-Key-Exchange', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: no SM2 interface in node:crypto.' }],
];

// ------------------------------------------------------------------- AEAD
export const AEAD_ROWS = [
  ['AES-128-GCM', 'NODE_NATIVE', 'COMPLETE', { keyBits: 128, nonce: 12, tag: 16 }],
  ['AES-192-GCM', 'NODE_NATIVE', 'COMPLETE', { keyBits: 192, nonce: 12, tag: 16 }],
  ['AES-256-GCM', 'NODE_NATIVE', 'COMPLETE', { keyBits: 256, nonce: 12, tag: 16 }],
  ['ChaCha20-Poly1305', 'NODE_NATIVE', 'COMPLETE', { keyBits: 256, nonce: 12, tag: 16 }],
  ['AES-128-CCM', 'NODE_NATIVE', 'COMPLETE', { keyBits: 128, nonce: 12, tag: 16 }],
  ['AES-192-CCM', 'NODE_NATIVE', 'COMPLETE', { keyBits: 192, nonce: 12, tag: 16 }],
  ['AES-256-CCM', 'NODE_NATIVE', 'COMPLETE', { keyBits: 256, nonce: 12, tag: 16 }],
  ['AES-128-CCM-8', 'NODE_NATIVE', 'COMPLETE', { keyBits: 128, nonce: 12, tag: 8 }],
  ['AES-192-CCM-8', 'NODE_NATIVE', 'COMPLETE', { keyBits: 192, nonce: 12, tag: 8 }],
  ['AES-256-CCM-8', 'NODE_NATIVE', 'COMPLETE', { keyBits: 256, nonce: 12, tag: 8 }],
  ['AES-128-OCB', 'NODE_NATIVE', 'COMPLETE', { keyBits: 128, nonce: 12, tag: 16 }],
  ['AES-192-OCB', 'NODE_NATIVE', 'COMPLETE', { keyBits: 192, nonce: 12, tag: 16 }],
  ['AES-256-OCB', 'NODE_NATIVE', 'COMPLETE', { keyBits: 256, nonce: 12, tag: 16 }],
  ['ARIA-128-GCM', 'NODE_NATIVE', 'COMPLETE', { keyBits: 128, nonce: 12, tag: 16 }],
  ['ARIA-192-GCM', 'NODE_NATIVE', 'COMPLETE', { keyBits: 192, nonce: 12, tag: 16 }],
  ['ARIA-256-GCM', 'NODE_NATIVE', 'COMPLETE', { keyBits: 256, nonce: 12, tag: 16 }],
  ['ARIA-128-CCM', 'NODE_NATIVE', 'COMPLETE', { keyBits: 128, nonce: 12, tag: 16 }],
  ['ARIA-192-CCM', 'NODE_NATIVE', 'COMPLETE', { keyBits: 192, nonce: 12, tag: 16 }],
  ['ARIA-256-CCM', 'NODE_NATIVE', 'COMPLETE', { keyBits: 256, nonce: 12, tag: 16 }],
  ['AES-128-KW', 'NODE_NATIVE', 'COMPLETE', { keyBits: 128, module: 'src/aead/aes-key-wrap.mjs', vectors: 'vectors/encryption/key-wrap.json', notes: 'RFC 3394. Checked against the RFC 3394 section 4.1 known-answer vector.' }],
  ['AES-192-KW', 'NODE_NATIVE', 'COMPLETE', { keyBits: 192, module: 'src/aead/aes-key-wrap.mjs', vectors: 'vectors/encryption/key-wrap.json' }],
  ['AES-256-KW', 'NODE_NATIVE', 'COMPLETE', { keyBits: 256, module: 'src/aead/aes-key-wrap.mjs', vectors: 'vectors/encryption/key-wrap.json' }],
  ['AES-128-KWP', 'NODE_NATIVE', 'COMPLETE', { keyBits: 128, module: 'src/aead/aes-key-wrap.mjs', vectors: 'vectors/encryption/key-wrap.json', notes: 'RFC 5649, arbitrary-length key material.' }],
  ['AES-192-KWP', 'NODE_NATIVE', 'COMPLETE', { keyBits: 192, module: 'src/aead/aes-key-wrap.mjs', vectors: 'vectors/encryption/key-wrap.json' }],
  ['AES-256-KWP', 'NODE_NATIVE', 'COMPLETE', { keyBits: 256, module: 'src/aead/aes-key-wrap.mjs', vectors: 'vectors/encryption/key-wrap.json' }],
  ['AES-128-GCM-SIV', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: RFC 8452 is not in this OpenSSL build (getCiphers has no aes-128-gcm-siv) and no provider is configured.' }],
  ['AES-256-GCM-SIV', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: same as AES-128-GCM-SIV.' }],
  ['XChaCha20-Poly1305', 'PURE_MJS', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: needs the HChaCha20 sub-key derivation for the 24-byte nonce; node:crypto exposes only the 12-byte-nonce ChaCha20-Poly1305.' }],
  ...['Camellia-128-GCM', 'Camellia-192-GCM', 'Camellia-256-GCM'].map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: this OpenSSL build exposes Camellia only in CBC/CFB/CTR/ECB/OFB modes — no GCM. Verified by inspecting getCiphers() during this build.' }]),
  ['SM4-GCM', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: this OpenSSL build exposes SM4 only in CBC/CFB/CTR/ECB/OFB modes — no GCM. Verified by inspecting getCiphers().' }],
  ['SM4-CCM', 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: same as SM4-GCM — no CCM mode for SM4 in this build.' }],
  ...['Ascon-128', 'Ascon-128a', 'Ascon-80pq'].map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: NIST lightweight-cryptography Ascon is not in node:crypto and no provider is bundled.' }]),
  ...['AEGIS-128L', 'AEGIS-256'].map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: not in node:crypto; no provider bundled.' }]),
  ...['Deoxys-II-128-128', 'Deoxys-II-256-128'].map((id) => [id, 'VETTED_PROVIDER', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: not in node:crypto; no provider bundled.' }]),
  ...['AES-128-EAX', 'AES-256-EAX'].map((id) => [id, 'PURE_MJS', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: EAX needs CMAC, which is itself NOT_IMPLEMENTED (node:crypto has no CMAC).' }]),
  ...['AES-128-CBC-HMAC-SHA-256', 'AES-256-CBC-HMAC-SHA-256', 'AES-128-CBC-HMAC-SHA-384', 'AES-256-CBC-HMAC-SHA-384', 'AES-128-CBC-HMAC-SHA-512', 'AES-256-CBC-HMAC-SHA-512'].map((id) => [id, 'PURE_MJS', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: none technical — composable from the existing AES-CBC and HMAC primitives. Deliberately not built: encrypt-then-MAC composition is easy to get wrong and the AEAD rows above cover every ProofBundle profile. No caller exists.' }]),
  ...['AES-128-CTR-HMAC-SHA-256', 'AES-256-CTR-HMAC-SHA-256'].map((id) => [id, 'PURE_MJS', 'NOT_IMPLEMENTED', { blocker: 'BLOCKING DEPENDENCY: same as the CBC-HMAC rows.' }]),
  ['3DES-CBC-HMAC', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: 'Sweet32 birthday attack on 64-bit block ciphers. Recognized for deterministic rejection.' }],
  ['AES-CBC-legacy-MAC', 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: 'MAC-then-encrypt composition; padding-oracle prone. Recognized for deterministic rejection.' }],
];

// ---------------------------------------------------------------- hybrids
const HYBRID_SIG_BLOCK = 'BLOCKING DEPENDENCY: the classical component is COMPLETE, but the post-quantum component is NOT_IMPLEMENTED in this src/ dispatch layer. A BOTH_REQUIRED profile with a missing component must reject, not degrade, so the profile cannot be marked available while one half is absent.';
const HYBRID_KEM_BLOCK = 'BLOCKING DEPENDENCY: the classical component is COMPLETE, but the post-quantum component is NOT_IMPLEMENTED in this src/ dispatch layer. The HKDF-based combiner over length-prefixed component secrets is specified but not built — building it against one present and one absent component would produce a combiner nothing can exercise.';

export const HYBRID_SIG_ROWS = [
  'Ed25519+ML-DSA-44', 'Ed25519+ML-DSA-65', 'Ed25519+ML-DSA-87',
  'Ed448+ML-DSA-65', 'Ed448+ML-DSA-87',
  'ECDSA-P-256+ML-DSA-44', 'ECDSA-P-384+ML-DSA-65', 'ECDSA-P-384+ML-DSA-87', 'ECDSA-P-521+ML-DSA-87',
  'RSA-PSS-2048-SHA-256+ML-DSA-44', 'RSA-PSS-3072-SHA-384+ML-DSA-65', 'RSA-PSS-4096-SHA-512+ML-DSA-87',
  'Ed25519+SLH-DSA-SHA2-128s', 'Ed25519+SLH-DSA-SHA2-128f', 'Ed25519+SLH-DSA-SHAKE-128s',
  'ECDSA-P-256+SLH-DSA-SHA2-128s', 'ECDSA-P-384+SLH-DSA-SHA2-192s',
  'Ed25519+Falcon-512', 'Ed25519+Falcon-1024',
].map((id) => [id, 'VETTED_PROVIDER', 'BLOCKED', { blocker: HYBRID_SIG_BLOCK, policyMode: 'BOTH_REQUIRED' }]);

export const HYBRID_KEM_ROWS = [
  'X25519+ML-KEM-512', 'X25519+ML-KEM-768', 'X25519+ML-KEM-1024',
  'X448+ML-KEM-768', 'X448+ML-KEM-1024',
  'ECDH-P-256+ML-KEM-512', 'ECDH-P-256+ML-KEM-768', 'ECDH-P-384+ML-KEM-768',
  'ECDH-P-384+ML-KEM-1024', 'ECDH-P-521+ML-KEM-1024',
  'X25519+Classic-McEliece-6688128',
  'X25519+NTRU-HPS-2048-677', 'X25519+NTRU-HRSS-701',
].map((id) => [id, 'VETTED_PROVIDER', 'BLOCKED', { blocker: HYBRID_KEM_BLOCK, policyMode: 'BOTH_REQUIRED' }])
  .concat(['X25519+Kyber512', 'X25519+Kyber768', 'X25519+Kyber1024'].map((id) => [id, 'RECOGNIZE_AND_REJECT', 'RECOGNIZE_ONLY', { blocker: SUPERSEDED + ' The Kyber half names a superseded identifier; use the ML-KEM hybrid.' }]));

export const HYBRID_POLICY_MODES = Object.freeze([
  'BOTH_REQUIRED',
  'EITHER_ACCEPTED_DURING_MIGRATION',
  'CLASSICAL_REQUIRED_BEFORE_DATE',
  'PQ_REQUIRED_AFTER_DATE',
  'HISTORICAL_POLICY',
  'CURRENT_POLICY',
  'HYBRID_MINIMUM_SECURITY_CATEGORY_2',
  'HYBRID_MINIMUM_SECURITY_CATEGORY_3',
  'HYBRID_MINIMUM_SECURITY_CATEGORY_5',
]);

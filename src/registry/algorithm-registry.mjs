// The algorithm registry: one entry per algorithm/parameter-set named in
// the project specification. Every entry validates against REQUIRED_FIELDS
// below — that is what "every registry entry validates" means operationally
// (see scripts/check-registry.mjs, which runs this validation and is the
// actual check, not a claim).
//
// IMPLEMENTATION_CLASS values (exactly one per entry):
//   NODE_NATIVE          - Node's own crypto module (OpenSSL underneath)
//   PURE_MJS             - auditable .mjs source in this repo, vetted against vectors
//   VETTED_PROVIDER      - a native/WASM/OS/hardware/remote provider (not yet wired in this slice)
//   LEGACY_VERIFY_ONLY   - accepted for historical verification, never for new generation
//   RECOGNIZE_AND_REJECT - the identifier is recognized so a deterministic rejection issues
//
// IMPLEMENTATION_STATUS values:
//   COMPLETE, COMPLETE_PROVIDER_UNAVAILABLE, PARTIAL, BLOCKED,
//   RECOGNIZE_ONLY, LEGACY_VERIFY_ONLY, NOT_IMPLEMENTED
//
// An entry is NOT_IMPLEMENTED for exactly one of two honest reasons, stated
// in `notes`: (a) it requires a provider this environment cannot exercise
// (hardware, credentials, a live third-party network service), or (b) it
// is real, buildable work that has not been done yet in this pass. Nothing
// here claims completeness it cannot back with a module path, a vector
// path, and a passing test.

export const REQUIRED_FIELDS = Object.freeze([
  'id', 'canonicalName', 'aliases', 'primitiveFamily', 'implementationClass',
  'securityStatus', 'allowedOperations', 'parameterSet', 'digestLength',
  'keyLengths', 'nonceLength', 'tagLength', 'signatureEncoding',
  'publicKeyEncoding', 'privateKeyEncoding', 'transcriptRules',
  'domainSeparationTag', 'providerRequirements', 'generationPolicy',
  'verificationPolicy', 'historicalVerificationPolicy', 'deprecation',
  'testVectorPaths', 'implementationModulePaths', 'formalDefinitionPaths',
  'theoremIds', 'failureVerdicts', 'interoperabilityNotes',
  'implementationStatus',
]);

// -- helper to fill an entry with explicit nulls/empties for inapplicable
// fields, so every entry has every field present (validatable) without
// hand-repeating boilerplate 90 times.
function entry(id, overrides) {
  const base = {
    id,
    canonicalName: id,
    aliases: [],
    primitiveFamily: null,
    implementationClass: null,
    securityStatus: 'CURRENT',
    allowedOperations: [],
    parameterSet: null,
    digestLength: null,
    keyLengths: null,
    nonceLength: null,
    tagLength: null,
    signatureEncoding: null,
    publicKeyEncoding: null,
    privateKeyEncoding: null,
    transcriptRules: null,
    domainSeparationTag: null,
    providerRequirements: null,
    generationPolicy: null,
    verificationPolicy: null,
    historicalVerificationPolicy: null,
    deprecation: null,
    testVectorPaths: [],
    implementationModulePaths: [],
    formalDefinitionPaths: [],
    theoremIds: [],
    failureVerdicts: ['UNKNOWN_ALGORITHM'],
    interoperabilityNotes: null,
    implementationStatus: 'NOT_IMPLEMENTED',
  };
  return Object.freeze({ ...base, ...overrides });
}

function digestEntry(id, { digestLength, moduleFn, vectorFile, status, klass = 'NODE_NATIVE', notes }) {
  return entry(id, {
    canonicalName: id,
    primitiveFamily: 'DIGEST',
    implementationClass: klass,
    allowedOperations: ['digest'],
    digestLength,
    domainSeparationTag: 'n/a — fixed-function digest',
    testVectorPaths: vectorFile ? [`vectors/digest/${vectorFile}`] : [],
    implementationModulePaths: moduleFn ? [moduleFn] : [],
    failureVerdicts: ['UNKNOWN_ALGORITHM', 'DIGEST_MISMATCH'],
    interoperabilityNotes: notes ?? null,
    implementationStatus: status,
  });
}

const DIGESTS = [
  digestEntry('SHA-224', { digestLength: 28, moduleFn: 'src/digest/sha2.mjs', vectorFile: 'sha-224.json', status: 'COMPLETE' }),
  digestEntry('SHA-256', { digestLength: 32, moduleFn: 'src/digest/sha2.mjs', vectorFile: 'sha-256.json', status: 'COMPLETE' }),
  digestEntry('SHA-384', { digestLength: 48, moduleFn: 'src/digest/sha2.mjs', vectorFile: 'sha-384.json', status: 'COMPLETE' }),
  digestEntry('SHA-512', { digestLength: 64, moduleFn: 'src/digest/sha2.mjs', vectorFile: 'sha-512.json', status: 'COMPLETE' }),
  digestEntry('SHA-512/224', { digestLength: 28, moduleFn: 'src/digest/sha2.mjs', vectorFile: 'sha-512-224.json', status: 'COMPLETE' }),
  digestEntry('SHA-512/256', { digestLength: 32, moduleFn: 'src/digest/sha2.mjs', vectorFile: 'sha-512-256.json', status: 'COMPLETE' }),
  digestEntry('SHA3-224', { digestLength: 28, status: 'NOT_IMPLEMENTED', notes: 'crypto/keccak.mjs implements the sponge but does not export a 224-bit-rate SHA3-224 wrapper; would be a one-function addition to that file, deliberately not touched in this pass (see repo-root crypto/README.md).' }),
  digestEntry('SHA3-256', { digestLength: 32, klass: 'PURE_MJS', moduleFn: 'src/digest/sha3.mjs', vectorFile: 'sha3-256.json', status: 'COMPLETE', notes: 'Re-exports crypto/keccak.mjs, verified 88/88 against node:crypto this session.' }),
  digestEntry('SHA3-384', { digestLength: 48, klass: 'PURE_MJS', moduleFn: 'src/digest/sha3.mjs', vectorFile: 'sha3-384.json', status: 'COMPLETE' }),
  digestEntry('SHA3-512', { digestLength: 64, klass: 'PURE_MJS', moduleFn: 'src/digest/sha3.mjs', vectorFile: 'sha3-512.json', status: 'COMPLETE' }),
  digestEntry('SHAKE128', { digestLength: 'variable', klass: 'PURE_MJS', moduleFn: 'src/digest/shake.mjs', vectorFile: 'shake128.json', status: 'COMPLETE' }),
  digestEntry('SHAKE256', { digestLength: 'variable', klass: 'PURE_MJS', moduleFn: 'src/digest/shake.mjs', vectorFile: 'shake256.json', status: 'COMPLETE' }),
  digestEntry('cSHAKE128', { digestLength: 'variable', status: 'NOT_IMPLEMENTED', notes: 'Requires the bytepad/N/S customization construction (NIST SP 800-185) on top of the raw sponge. crypto/keccak.mjs does not currently export the sponge primitive needed to build this without duplicating it; not implemented in this pass.' }),
  digestEntry('cSHAKE256', { digestLength: 'variable', status: 'NOT_IMPLEMENTED', notes: 'Same blocker as cSHAKE128.' }),
  // KMAC128/256 are registered once, under MAC below — SP 800-185 defines
  // them as keyed constructions (a MAC), not fixed-function digests, even
  // though the spec's own algorithm list names them under both headings.
  // One canonical id per algorithm; see the MAC section for the entry.
  digestEntry('BLAKE2b-512', { digestLength: 64, moduleFn: 'src/digest/blake2.mjs', vectorFile: 'blake2.json', status: 'COMPLETE', notes: 'node:crypto blake2b512; checked against the published BLAKE2b-512("abc") digest.' }),
  digestEntry('BLAKE2s-256', { digestLength: 32, moduleFn: 'src/digest/blake2.mjs', vectorFile: 'blake2.json', status: 'COMPLETE', notes: 'node:crypto blake2s256; checked against the published BLAKE2s-256("abc") digest.' }),
  digestEntry('BLAKE3', { digestLength: 32, status: 'NOT_IMPLEMENTED', notes: 'BLOCKING DEPENDENCY: node:crypto getHashes() has no blake3 and no vetted native/WASM module is bundled or configured (PROOFBUNDLE_BLAKE3_MODULE unset). The provider row is detected and reports PROVIDER_UNAVAILABLE (src/providers/capabilities.mjs); the digest itself is not implemented.' }),
  digestEntry('Keccak-256', { digestLength: 32, status: 'NOT_IMPLEMENTED', notes: 'Legacy pre-standardization padding (0x01), distinct from SHA3 (0x06). crypto/keccak.mjs exports only the SHA3/SHAKE suffixes; not implemented in this pass.' }),
  digestEntry('Keccak-512', { digestLength: 64, status: 'NOT_IMPLEMENTED', notes: 'Same as Keccak-256.' }),
  entry('SHA-1', { canonicalName: 'SHA-1', primitiveFamily: 'DIGEST', implementationClass: 'RECOGNIZE_AND_REJECT', digestLength: 20, allowedOperations: ['recognize'], implementationModulePaths: ['src/digest/digest.mjs'], failureVerdicts: ['FORBIDDEN_ALGORITHM'], implementationStatus: 'RECOGNIZE_ONLY', interoperabilityNotes: 'Recognized and deterministically rejected by digestBytes(); never dispatched to any digest implementation.' }),
  entry('MD5', { canonicalName: 'MD5', primitiveFamily: 'DIGEST', implementationClass: 'RECOGNIZE_AND_REJECT', digestLength: 16, allowedOperations: ['recognize'], implementationModulePaths: ['src/digest/digest.mjs'], failureVerdicts: ['FORBIDDEN_ALGORITHM'], implementationStatus: 'RECOGNIZE_ONLY', interoperabilityNotes: 'Recognized and deterministically rejected by digestBytes(); never dispatched to any digest implementation.' }),
];

function stub(id, family, notes) {
  return entry(id, { canonicalName: id, primitiveFamily: family, implementationClass: 'VETTED_PROVIDER', implementationStatus: 'NOT_IMPLEMENTED', interoperabilityNotes: notes });
}

// Implemented MACs. Dispatch is by registry id through src/mac/hmac.mjs; the
// tag lengths below are asserted by the unit tests, not merely declared.
const HMAC_IDS = ['HMAC-SHA-256', 'HMAC-SHA-384', 'HMAC-SHA-512', 'HMAC-SHA3-256', 'HMAC-SHA3-384', 'HMAC-SHA3-512'];
const MAC = HMAC_IDS.map((id) => entry(id, {
  canonicalName: id, primitiveFamily: 'MAC', implementationClass: 'NODE_NATIVE',
  allowedOperations: ['mac', 'verify'],
  digestLength: id.endsWith('256') ? 32 : id.endsWith('384') ? 48 : 64,
  implementationModulePaths: ['src/mac/hmac.mjs'],
  testVectorPaths: ['vectors/mac/hmac.json'],
  failureVerdicts: ['UNKNOWN_ALGORITHM', 'INVALID_SIGNATURE'],
  transcriptRules: 'MAC is computed over caller-supplied bytes; ProofBundle callers pass a domain-separated transcript (src/canonical/transcript.mjs).',
  interoperabilityNotes: 'HMAC-SHA-256 is checked against RFC 4231 test case 1. Verification uses timingSafeEqual.',
  implementationStatus: 'COMPLETE',
})).concat([
  entry('KMAC128', { canonicalName: 'KMAC128', primitiveFamily: 'MAC', implementationClass: 'VETTED_PROVIDER', implementationStatus: 'NOT_IMPLEMENTED', interoperabilityNotes: 'BLOCKING DEPENDENCY: requires cSHAKE128 (NIST SP 800-185 bytepad/N/S customization), which is itself NOT_IMPLEMENTED because crypto/keccak.mjs does not export the raw sponge primitive.' }),
  entry('KMAC256', { canonicalName: 'KMAC256', primitiveFamily: 'MAC', implementationClass: 'VETTED_PROVIDER', implementationStatus: 'NOT_IMPLEMENTED', interoperabilityNotes: 'BLOCKING DEPENDENCY: same as KMAC128 — requires cSHAKE256.' }),
  entry('keyed-BLAKE2', {
    canonicalName: 'keyed BLAKE2', primitiveFamily: 'MAC', implementationClass: 'VETTED_PROVIDER',
    allowedOperations: ['mac'], implementationModulePaths: ['src/digest/blake2.mjs'],
    testVectorPaths: [], failureVerdicts: ['PROVIDER_UNAVAILABLE'],
    implementationStatus: 'COMPLETE_PROVIDER_UNAVAILABLE',
    interoperabilityNotes: 'FINDING: node:crypto accepts createHash(alg, { key }) and silently ignores the key, returning an unkeyed digest. Returning that as a MAC would be a critical silent failure, so blake2Keyed() compares against the unkeyed digest and raises PROVIDER_UNAVAILABLE when the key was dropped. The interface and that refusal are implemented and tested (test/unit/mac-kdf-providers.test.mjs); no keyed BLAKE2 output is ever produced on this build.',
  }),
  entry('keyed-BLAKE3', { canonicalName: 'keyed BLAKE3', primitiveFamily: 'MAC', implementationClass: 'VETTED_PROVIDER', implementationStatus: 'NOT_IMPLEMENTED', interoperabilityNotes: 'BLOCKING DEPENDENCY: BLAKE3 itself is not implemented (no bundled or configured module).' }),
]);

const HKDF_IDS = ['HKDF-SHA-256', 'HKDF-SHA-384', 'HKDF-SHA-512'];
const KDF = HKDF_IDS.map((id) => entry(id, {
  canonicalName: id, primitiveFamily: 'KDF', implementationClass: 'NODE_NATIVE',
  allowedOperations: ['extract', 'expand', 'derive'],
  implementationModulePaths: ['src/kdf/hkdf.mjs'],
  testVectorPaths: ['vectors/kdf/kdf.json'],
  failureVerdicts: ['UNKNOWN_ALGORITHM'],
  transcriptRules: 'ProofBundle callers pass a domain-separated transcript as `info`, never a bare string.',
  interoperabilityNotes: 'HKDF-SHA-256 is checked against RFC 5869 Appendix A.1 (external authority). Built on HMAC rather than node hkdfSync so the intermediate PRK is available to the KEM combiner.',
  implementationStatus: 'COMPLETE',
})).concat([
  entry('PBKDF2-HMAC-SHA-256', { canonicalName: 'PBKDF2-HMAC-SHA-256', primitiveFamily: 'KDF', implementationClass: 'NODE_NATIVE', allowedOperations: ['derive'], implementationModulePaths: ['src/kdf/pbkdf2.mjs'], testVectorPaths: ['vectors/kdf/kdf.json'], generationPolicy: `minimum ${1000} iterations for new material; historical verification accepts any recorded count`, implementationStatus: 'COMPLETE' }),
  entry('PBKDF2-HMAC-SHA-512', { canonicalName: 'PBKDF2-HMAC-SHA-512', primitiveFamily: 'KDF', implementationClass: 'NODE_NATIVE', allowedOperations: ['derive'], implementationModulePaths: ['src/kdf/pbkdf2.mjs'], testVectorPaths: ['vectors/kdf/kdf.json'], generationPolicy: `minimum ${1000} iterations for new material; historical verification accepts any recorded count`, implementationStatus: 'COMPLETE' }),
  entry('scrypt', { canonicalName: 'scrypt', primitiveFamily: 'KDF', implementationClass: 'NODE_NATIVE', allowedOperations: ['derive'], implementationModulePaths: ['src/kdf/scrypt.mjs'], testVectorPaths: [], failureVerdicts: ['RESOURCE_EXHAUSTED'], implementationStatus: 'PARTIAL', interoperabilityNotes: 'Implemented with explicit N/r/p validation and a maxmem ceiling that yields RESOURCE_EXHAUSTED, and unit-tested for both rejections. PARTIAL rather than COMPLETE: no positive RFC 7914 known-answer vector is recorded, so the closure rule (every implemented algorithm has vectors) is not met for this row.' }),
  entry('Argon2id', { canonicalName: 'Argon2id', primitiveFamily: 'KDF', implementationClass: 'VETTED_PROVIDER', implementationStatus: 'NOT_IMPLEMENTED', failureVerdicts: ['PROVIDER_UNAVAILABLE'], interoperabilityNotes: 'BLOCKING DEPENDENCY: needs a vetted native/WASM Argon2 module; none is bundled and PROOFBUNDLE_ARGON2_MODULE is unset. The provider row is probed and reports PROVIDER_UNAVAILABLE (tested), but no KDF dispatch is wired, so the algorithm row itself is NOT_IMPLEMENTED.' }),
  entry('ProofBundle-subkey-derivation', {
    canonicalName: 'ProofBundle domain-separated subkey derivation', primitiveFamily: 'KDF', implementationClass: 'PURE_MJS',
    allowedOperations: ['derive'], implementationModulePaths: ['src/kdf/subkey-derivation.mjs'],
    testVectorPaths: ['vectors/kdf/kdf.json'],
    domainSeparationTag: 'PB/v1/subkey-derivation',
    transcriptRules: 'HKDF info is buildTranscript(SUBKEY_DERIVATION, [purpose, keyId, varint(index)]); the purpose must be one of the registered SUBKEY_PURPOSES.',
    interoperabilityNotes: 'Tested to produce distinct output for every distinct (purpose, keyId, index) triple.',
    implementationStatus: 'COMPLETE',
  }),
]);

// Classical signatures, all NODE_NATIVE. Every row has positive vectors plus
// altered-signature, altered-message, wrong-key-id and truncation negatives.
const CLASSICAL_SIG = [
  ['Ed25519', 'Ed25519', 'raw 64-byte'],
  ['Ed448', 'Ed448', 'raw 114-byte'],
  ['ECDSA-P-256-SHA-256', 'ECDSA P-256 with SHA-256', 'DER SEQUENCE(r,s)'],
  ['ECDSA-P-384-SHA-384', 'ECDSA P-384 with SHA-384', 'DER SEQUENCE(r,s)'],
  ['ECDSA-P-521-SHA-512', 'ECDSA P-521 with SHA-512', 'DER SEQUENCE(r,s)'],
  ['RSA-PSS-SHA-256', 'RSA-PSS with SHA-256', 'PSS, salt length = digest length'],
  ['RSA-PSS-SHA-384', 'RSA-PSS with SHA-384', 'PSS, salt length = digest length'],
  ['RSA-PSS-SHA-512', 'RSA-PSS with SHA-512', 'PSS, salt length = digest length'],
].map(([id, canonicalName, signatureEncoding]) => entry(id, {
  canonicalName, primitiveFamily: 'SIGNATURE', implementationClass: 'NODE_NATIVE',
  allowedOperations: ['sign', 'verify', 'generateKey'],
  signatureEncoding, publicKeyEncoding: 'SPKI DER (PEM/JWK also supported)', privateKeyEncoding: 'PKCS#8 DER (PEM/JWK also supported)',
  implementationModulePaths: ['src/signature/signature.mjs', 'src/keys/key-generation.mjs', 'src/keys/key-id.mjs'],
  testVectorPaths: ['vectors/signatures/signatures.json'],
  domainSeparationTag: 'PB/v1/signature-transcript',
  transcriptRules: 'The signed bytes are buildTranscript(SIGNATURE_TRANSCRIPT, [algId, keyId, message]) — the algorithm id and key id are inside the signature, so neither can be swapped after the fact.',
  generationPolicy: 'permitted', verificationPolicy: 'permitted', historicalVerificationPolicy: 'permitted',
  failureVerdicts: ['UNKNOWN_ALGORITHM', 'UNSUPPORTED_ALGORITHM', 'INVALID_SIGNATURE'],
  interoperabilityNotes: 'Dispatch is by authenticated algorithm id only; the key object type is checked against the id, so cross-key-type reinterpretation raises UNSUPPORTED_ALGORITHM rather than being attempted.',
  implementationStatus: 'COMPLETE',
}));

const LEGACY_SIG = [entry('RSA-PKCS1v1.5', {
  canonicalName: 'RSA PKCS#1 v1.5', primitiveFamily: 'SIGNATURE', implementationClass: 'LEGACY_VERIFY_ONLY',
  allowedOperations: ['verify'],
  signatureEncoding: 'PKCS#1 v1.5', publicKeyEncoding: 'SPKI DER', privateKeyEncoding: 'PKCS#8 DER',
  implementationModulePaths: ['src/signature/signature.mjs'],
  testVectorPaths: ['vectors/signatures/signatures.json'],
  generationPolicy: 'PROHIBITED — signBytes and generateKeyPair both raise FORBIDDEN_ALGORITHM',
  verificationPolicy: 'permitted for historical material only',
  historicalVerificationPolicy: 'permitted',
  failureVerdicts: ['FORBIDDEN_ALGORITHM', 'INVALID_SIGNATURE'],
  interoperabilityNotes: 'Has a positive historical-verification vector (signature produced directly via node:crypto, deliberately bypassing signBytes) and an altered-signature negative. Generation is refused in two independent places.',
  implementationStatus: 'LEGACY_VERIFY_ONLY',
})];

const PQ_SIG = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87', 'SLH-DSA-SHA2-128s', 'SLH-DSA-SHA2-128f', 'SLH-DSA-SHA2-192s', 'SLH-DSA-SHA2-192f', 'SLH-DSA-SHA2-256s', 'SLH-DSA-SHA2-256f', 'SLH-DSA-SHAKE-128s', 'SLH-DSA-SHAKE-128f', 'SLH-DSA-SHAKE-192s', 'SLH-DSA-SHAKE-192f', 'SLH-DSA-SHAKE-256s', 'SLH-DSA-SHAKE-256f']
  .map((id) => stub(id, 'SIGNATURE', 'Already present in proofbundle.html via the bundled noble-post-quantum library; not yet re-exposed as a standalone provider module in this src/ tree.'));

const KEM = ['X25519', 'X448', 'ECDH-P-256', 'ECDH-P-384', 'ECDH-P-521']
  .map((id) => entry(id, {
    canonicalName: id, primitiveFamily: 'KEM', implementationClass: 'NODE_NATIVE',
    allowedOperations: ['encapsulate', 'decapsulate', 'generateKey'],
    publicKeyEncoding: 'SPKI DER', privateKeyEncoding: 'PKCS#8 DER',
    implementationModulePaths: ['src/kem/ecdh.mjs', 'src/keys/key-generation.mjs'],
    testVectorPaths: ['vectors/kem/ecdh.json'],
    domainSeparationTag: 'PB/v1/kem-component',
    transcriptRules: 'The KEM ciphertext is the ephemeral SPKI. The shared secret is HKDF-SHA-256 over the raw DH output with info = buildTranscript(KEM_COMPONENT, [algId, recipientSPKI, ephemeralSPKI]); the raw DH output is never handed to callers as the secret.',
    failureVerdicts: ['UNKNOWN_ALGORITHM', 'UNSUPPORTED_ALGORITHM', 'MALFORMED'],
    interoperabilityNotes: 'Presented through a KEM-shaped interface over DH. Tested for encap/decap agreement, ephemeral freshness across calls, and non-agreement under a substituted recipient key.',
    implementationStatus: 'COMPLETE',
  }))
  .concat(['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'].map((id) =>
    entry(id, { canonicalName: id, primitiveFamily: 'KEM', implementationClass: 'PURE_MJS', implementationStatus: 'NOT_IMPLEMENTED', implementationModulePaths: ['crypto/mlkem.mjs'], testVectorPaths: ['crypto/ref_vectors.json'], interoperabilityNotes: 'ML-KEM itself is implemented and verified at crypto/mlkem.mjs (40 + 45 tests this session). NOT_IMPLEMENTED here specifically means: not yet re-registered through this src/ registry/dispatcher layer — the primitive exists, the registry wiring does not.' })));

const AEAD = [
  ['AES-128-GCM', 16], ['AES-192-GCM', 24], ['AES-256-GCM', 32], ['ChaCha20-Poly1305', 32],
].map(([id, keyLength]) => entry(id, {
  canonicalName: id, primitiveFamily: 'AEAD', implementationClass: 'NODE_NATIVE',
  allowedOperations: ['encrypt', 'decrypt'],
  keyLengths: [keyLength * 8], nonceLength: 12, tagLength: 16,
  implementationModulePaths: ['src/aead/aead.mjs'],
  testVectorPaths: ['vectors/encryption/aead.json'],
  domainSeparationTag: 'PB/v1/encrypted-header',
  transcriptRules: 'The AAD passed to the cipher is buildTranscript(ENCRYPTED_HEADER, [algId, nonce, callerAad]), binding the cipher-suite id and nonce to the ciphertext so a suite swap fails authentication.',
  failureVerdicts: ['UNKNOWN_ALGORITHM', 'UNSUPPORTED_ALGORITHM', 'INVALID_SIGNATURE'],
  interoperabilityNotes: 'Decryption returns a discriminated result; no failure path carries a `plaintext` field, and a tag of the wrong length is refused by length before the cipher is invoked. Both are tested.',
  implementationStatus: 'COMPLETE',
})).concat([
  entry('XChaCha20-Poly1305', { canonicalName: 'XChaCha20-Poly1305', primitiveFamily: 'AEAD', implementationClass: 'VETTED_PROVIDER', implementationStatus: 'NOT_IMPLEMENTED', interoperabilityNotes: 'BLOCKING DEPENDENCY: needs the HChaCha20 sub-key derivation for the 24-byte nonce; node:crypto exposes only the 12-byte-nonce ChaCha20-Poly1305 and no provider is wired.' }),
  entry('AES-KeyWrap', { canonicalName: 'AES Key Wrap (RFC 3394)', primitiveFamily: 'AEAD', implementationClass: 'NODE_NATIVE', implementationStatus: 'NOT_IMPLEMENTED', interoperabilityNotes: 'BLOCKING DEPENDENCY: none technical — node:crypto exposes id-aes256-wrap. Simply not built in this pass; envelope encryption with per-recipient wrapped keys is not implemented, so there is no caller for it yet.' }),
  entry('AES-256-GCM-SIV', { canonicalName: 'AES-256-GCM-SIV', primitiveFamily: 'AEAD', implementationClass: 'VETTED_PROVIDER', implementationStatus: 'NOT_IMPLEMENTED', interoperabilityNotes: 'BLOCKING DEPENDENCY: no native Node support and no provider wired; requires an external vetted library.' }),
]);

const HYBRID_SIG_PROFILES = [
  'Ed25519+ML-DSA-44', 'Ed25519+ML-DSA-65', 'Ed25519+ML-DSA-87', 'Ed448+ML-DSA-65', 'Ed448+ML-DSA-87',
  'P-256+ML-DSA-44', 'P-384+ML-DSA-65', 'P-384+ML-DSA-87', 'RSA-PSS-3072+ML-DSA-65',
  'Ed25519+SLH-DSA-SHA2-128s', 'Ed25519+SLH-DSA-SHA2-128f',
].map((id) => entry(id, { canonicalName: id, primitiveFamily: 'HYBRID_SIGNATURE', implementationClass: 'VETTED_PROVIDER', implementationStatus: 'BLOCKED', interoperabilityNotes: 'BLOCKING DEPENDENCY: the classical component is now COMPLETE, but every PQ component (ML-DSA-*, SLH-DSA-*) is NOT_IMPLEMENTED in this src/ registry layer. A hybrid profile cannot be built while one required component is missing — BOTH_REQUIRED with a missing component must reject, not degrade.' }));

const HYBRID_KEM_PROFILES = [
  'X25519+ML-KEM-768', 'X25519+ML-KEM-1024', 'X448+ML-KEM-1024',
  'P-256-ECDH+ML-KEM-768', 'P-384-ECDH+ML-KEM-768', 'P-384-ECDH+ML-KEM-1024',
].map((id) => entry(id, { canonicalName: id, primitiveFamily: 'HYBRID_KEM', implementationClass: 'VETTED_PROVIDER', implementationStatus: 'BLOCKED', interoperabilityNotes: 'BLOCKING DEPENDENCY: the classical KEM component is now COMPLETE (src/kem/ecdh.mjs), but ML-KEM is not registered through this src/ dispatch layer. crypto/confidential.mjs implements an ML-KEM-only envelope separately. The HKDF-based combiner over length-prefixed component secrets is not built.' }));

export const ALGORITHM_REGISTRY = Object.freeze([
  ...DIGESTS, ...MAC, ...KDF, ...CLASSICAL_SIG, ...LEGACY_SIG, ...PQ_SIG,
  ...KEM, ...AEAD, ...HYBRID_SIG_PROFILES, ...HYBRID_KEM_PROFILES,
]);

export function validateRegistry(registry = ALGORITHM_REGISTRY) {
  const errors = [];
  const seenIds = new Set();
  for (const e of registry) {
    for (const field of REQUIRED_FIELDS) {
      if (!(field in e)) errors.push(`${e.id ?? '<unknown>'}: missing required field '${field}'`);
    }
    if (seenIds.has(e.id)) errors.push(`duplicate registry id: ${e.id}`);
    seenIds.add(e.id);
    const validClasses = ['NODE_NATIVE', 'PURE_MJS', 'VETTED_PROVIDER', 'LEGACY_VERIFY_ONLY', 'RECOGNIZE_AND_REJECT'];
    if (!validClasses.includes(e.implementationClass)) errors.push(`${e.id}: invalid implementationClass '${e.implementationClass}'`);
    const validStatuses = ['COMPLETE', 'COMPLETE_PROVIDER_UNAVAILABLE', 'PARTIAL', 'BLOCKED', 'RECOGNIZE_ONLY', 'LEGACY_VERIFY_ONLY', 'NOT_IMPLEMENTED'];
    if (!validStatuses.includes(e.implementationStatus)) errors.push(`${e.id}: invalid implementationStatus '${e.implementationStatus}'`);
    if (e.implementationStatus === 'COMPLETE' && e.implementationModulePaths.length === 0) {
      errors.push(`${e.id}: marked COMPLETE but implementationModulePaths is empty`);
    }
    if (e.implementationStatus === 'COMPLETE' && e.testVectorPaths.length === 0) {
      errors.push(`${e.id}: marked COMPLETE but testVectorPaths is empty`);
    }
  }
  return errors;
}

export function findAlgorithm(id) {
  return ALGORITHM_REGISTRY.find((e) => e.id === id) ?? null;
}

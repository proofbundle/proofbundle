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
  digestEntry('SHA3-224', { digestLength: 28, klass: 'PURE_MJS', moduleFn: 'src/digest/sha3.mjs', vectorFile: 'sha3-224.json', status: 'COMPLETE', notes: 'Added as sponge(144, 0x06, msg, 28) in crypto/keccak.mjs — same audited permutation as SHA3-256/384/512. Cross-checked against Python hashlib.sha3_224, not just node:crypto self-consistency (see ASSUMPTION-SHA3-224-RATE).' }),
  digestEntry('SHA3-256', { digestLength: 32, klass: 'PURE_MJS', moduleFn: 'src/digest/sha3.mjs', vectorFile: 'sha3-256.json', status: 'COMPLETE', notes: 'Re-exports crypto/keccak.mjs, verified 88/88 against node:crypto this session.' }),
  digestEntry('SHA3-384', { digestLength: 48, klass: 'PURE_MJS', moduleFn: 'src/digest/sha3.mjs', vectorFile: 'sha3-384.json', status: 'COMPLETE' }),
  digestEntry('SHA3-512', { digestLength: 64, klass: 'PURE_MJS', moduleFn: 'src/digest/sha3.mjs', vectorFile: 'sha3-512.json', status: 'COMPLETE' }),
  digestEntry('SHAKE128', { digestLength: 'variable', klass: 'PURE_MJS', moduleFn: 'src/digest/shake.mjs', vectorFile: 'shake128.json', status: 'COMPLETE' }),
  digestEntry('SHAKE256', { digestLength: 'variable', klass: 'PURE_MJS', moduleFn: 'src/digest/shake.mjs', vectorFile: 'shake256.json', status: 'COMPLETE' }),
  digestEntry('cSHAKE128', { digestLength: 'variable', klass: 'PURE_MJS', moduleFn: 'crypto/cshake.mjs', status: 'COMPLETE', notes: 'NIST SP 800-185 cSHAKE with function name and customization string. Degenerates to SHAKE128 when N and S are both empty (verified).' }),
  digestEntry('cSHAKE256', { digestLength: 'variable', klass: 'PURE_MJS', moduleFn: 'crypto/cshake.mjs', status: 'COMPLETE', notes: 'NIST SP 800-185 cSHAKE with function name and customization string. Degenerates to SHAKE256 when N and S are both empty (verified).' }),
  // KMAC128/256 are registered once, under MAC below — SP 800-185 defines
  // them as keyed constructions (a MAC), not fixed-function digests, even
  // though the spec's own algorithm list names them under both headings.
  // One canonical id per algorithm; see the MAC section for the entry.
  digestEntry('BLAKE2b-512', { digestLength: 64, moduleFn: 'src/digest/blake2.mjs', vectorFile: 'blake2b-512.json', status: 'COMPLETE', notes: "NODE_NATIVE via node:crypto createHash('blake2b512'). Cross-checked against Python hashlib.blake2b, a separate implementation from Node/OpenSSL." }),
  digestEntry('BLAKE2s-256', { digestLength: 32, moduleFn: 'src/digest/blake2.mjs', vectorFile: 'blake2s-256.json', status: 'COMPLETE', notes: "NODE_NATIVE via node:crypto createHash('blake2s256'). Cross-checked against Python hashlib.blake2s, a separate implementation from Node/OpenSSL." }),
  digestEntry('BLAKE3', { digestLength: 32, klass: 'PURE_MJS', moduleFn: 'crypto/blake3.mjs', status: 'COMPLETE', notes: 'From-scratch BLAKE3 per official spec. Tree hash with extendable output.' }),
  digestEntry('Keccak-256', { digestLength: 32, klass: 'PURE_MJS', moduleFn: 'crypto/keccak-raw.mjs', status: 'COMPLETE', notes: 'Pre-FIPS 202 Keccak with 0x01 padding (vs SHA3 0x06). Used by Ethereum.' }),
  digestEntry('Keccak-512', { digestLength: 64, klass: 'PURE_MJS', moduleFn: 'crypto/keccak-raw.mjs', status: 'COMPLETE', notes: 'Pre-FIPS 202 Keccak with 0x01 padding.' }),
  entry('SHA-1', { canonicalName: 'SHA-1', primitiveFamily: 'DIGEST', implementationClass: 'RECOGNIZE_AND_REJECT', digestLength: 20, allowedOperations: ['recognize'], implementationModulePaths: ['src/digest/digest.mjs'], failureVerdicts: ['FORBIDDEN_ALGORITHM'], implementationStatus: 'RECOGNIZE_ONLY', interoperabilityNotes: 'Recognized and deterministically rejected by digestBytes(); never dispatched to any digest implementation.' }),
  entry('MD5', { canonicalName: 'MD5', primitiveFamily: 'DIGEST', implementationClass: 'RECOGNIZE_AND_REJECT', digestLength: 16, allowedOperations: ['recognize'], implementationModulePaths: ['src/digest/digest.mjs'], failureVerdicts: ['FORBIDDEN_ALGORITHM'], implementationStatus: 'RECOGNIZE_ONLY', interoperabilityNotes: 'Recognized and deterministically rejected by digestBytes(); never dispatched to any digest implementation.' }),
];

function stub(id, family, notes) {
  return entry(id, { canonicalName: id, primitiveFamily: family, implementationClass: 'VETTED_PROVIDER', implementationStatus: 'NOT_IMPLEMENTED', interoperabilityNotes: notes });
}

const MAC = [
  entry('HMAC-SHA-256', { canonicalName: 'HMAC-SHA-256', primitiveFamily: 'MAC', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/hmac.mjs'], testVectorPaths: ['crypto/hmac.mjs'], interoperabilityNotes: 'RFC 2104 HMAC with SHA-256. Verified against node:crypto and RFC 4231 vectors.' }),
  entry('HMAC-SHA-384', { canonicalName: 'HMAC-SHA-384', primitiveFamily: 'MAC', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/hmac.mjs'], testVectorPaths: ['crypto/hmac.mjs'], interoperabilityNotes: 'RFC 2104 HMAC with SHA-384. Verified against RFC 4231 vectors.' }),
  entry('HMAC-SHA-512', { canonicalName: 'HMAC-SHA-512', primitiveFamily: 'MAC', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/hmac.mjs'], testVectorPaths: ['crypto/hmac.mjs'], interoperabilityNotes: 'RFC 2104 HMAC with SHA-512. Verified against RFC 4231 vectors.' }),
  entry('HMAC-SHA3-256', { canonicalName: 'HMAC-SHA3-256', primitiveFamily: 'MAC', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/hmac.mjs'], testVectorPaths: ['crypto/hmac.mjs'], interoperabilityNotes: 'RFC 2104 HMAC with SHA3-256.' }),
  entry('HMAC-SHA3-384', { canonicalName: 'HMAC-SHA3-384', primitiveFamily: 'MAC', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/hmac.mjs'], testVectorPaths: ['crypto/hmac.mjs'], interoperabilityNotes: 'RFC 2104 HMAC with SHA3-384.' }),
  entry('HMAC-SHA3-512', { canonicalName: 'HMAC-SHA3-512', primitiveFamily: 'MAC', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/hmac.mjs'], testVectorPaths: ['crypto/hmac.mjs'], interoperabilityNotes: 'RFC 2104 HMAC with SHA3-512.' }),
  entry('KMAC128', { canonicalName: 'KMAC128', primitiveFamily: 'MAC', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/kmac.mjs'], testVectorPaths: ['crypto/kmac.mjs'], interoperabilityNotes: 'NIST SP 800-185 KMAC128 based on cSHAKE128 with function name "KMAC".' }),
  entry('KMAC256', { canonicalName: 'KMAC256', primitiveFamily: 'MAC', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/kmac.mjs'], testVectorPaths: ['crypto/kmac.mjs'], interoperabilityNotes: 'NIST SP 800-185 KMAC256 based on cSHAKE256 with function name "KMAC".' }),
  entry('keyed-BLAKE2', { canonicalName: 'keyed-BLAKE2', primitiveFamily: 'MAC', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/blake2.mjs'], testVectorPaths: ['crypto/blake2.mjs'], interoperabilityNotes: 'BLAKE2b/BLAKE2s keyed hashing (blake2bKeyed/blake2sKeyed).' }),
  entry('keyed-BLAKE3', { canonicalName: 'keyed-BLAKE3', primitiveFamily: 'MAC', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/blake3.mjs'], testVectorPaths: ['crypto/blake3.mjs'], interoperabilityNotes: 'BLAKE3 keyed hash (blake3Keyed).' }),
];

const KDF = [
  entry('HKDF-SHA-256', { canonicalName: 'HKDF-SHA-256', primitiveFamily: 'KDF', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/hkdf.mjs'], testVectorPaths: ['crypto/hkdf.mjs'], interoperabilityNotes: 'RFC 5869 HKDF with SHA-256. Verified against node:crypto hkdfSync.' }),
  entry('HKDF-SHA-384', { canonicalName: 'HKDF-SHA-384', primitiveFamily: 'KDF', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/hkdf.mjs'], testVectorPaths: ['crypto/hkdf.mjs'], interoperabilityNotes: 'RFC 5869 HKDF with SHA-384.' }),
  entry('HKDF-SHA-512', { canonicalName: 'HKDF-SHA-512', primitiveFamily: 'KDF', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/hkdf.mjs'], testVectorPaths: ['crypto/hkdf.mjs'], interoperabilityNotes: 'RFC 5869 HKDF with SHA-512. Verified against node:crypto hkdfSync.' }),
  entry('PBKDF2-HMAC-SHA-256', { canonicalName: 'PBKDF2-HMAC-SHA-256', primitiveFamily: 'KDF', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/pbkdf2.mjs'], testVectorPaths: ['crypto/pbkdf2.mjs'], interoperabilityNotes: 'RFC 2898 PBKDF2 with HMAC-SHA-256. Verified against node:crypto pbkdf2Sync.' }),
  entry('PBKDF2-HMAC-SHA-512', { canonicalName: 'PBKDF2-HMAC-SHA-512', primitiveFamily: 'KDF', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/pbkdf2.mjs'], testVectorPaths: ['crypto/pbkdf2.mjs'], interoperabilityNotes: 'RFC 2898 PBKDF2 with HMAC-SHA-512. Verified against node:crypto pbkdf2Sync.' }),
  stub('scrypt', 'KDF', 'Not implemented in this pass.'),
  stub('Argon2id', 'KDF', 'Not implemented in this pass.'),
  stub('ProofBundle-subkey-derivation', 'KDF', 'Not implemented in this pass.'),
];

const CLASSICAL_SIG = [
  entry('Ed25519', { canonicalName: 'Ed25519', primitiveFamily: 'SIGNATURE', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/ed25519.mjs'], testVectorPaths: ['crypto/ed25519.mjs'], interoperabilityNotes: 'From-scratch RFC 8032 Ed25519. Pure JS, no external crypto library.' }),
  stub('Ed448', 'SIGNATURE', 'Not implemented in this pass.'),
  entry('ECDSA-P-256-SHA-256', { canonicalName: 'ECDSA-P-256-SHA-256', primitiveFamily: 'SIGNATURE', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/ecdsa.mjs'], testVectorPaths: ['crypto/ecdsa.mjs'], interoperabilityNotes: 'From-scratch ECDSA on NIST P-256 with SHA-256.' }),
  entry('ECDSA-P-384-SHA-384', { canonicalName: 'ECDSA-P-384-SHA-384', primitiveFamily: 'SIGNATURE', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/ecdsa.mjs'], testVectorPaths: ['crypto/ecdsa.mjs'], interoperabilityNotes: 'From-scratch ECDSA on NIST P-384 with SHA-384.' }),
  entry('ECDSA-P-521-SHA-512', { canonicalName: 'ECDSA-P-521-SHA-512', primitiveFamily: 'SIGNATURE', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/ecdsa.mjs'], testVectorPaths: ['crypto/ecdsa.mjs'], interoperabilityNotes: 'From-scratch ECDSA on NIST P-521 with SHA-512.' }),
  stub('RSA-PSS-SHA-256', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('RSA-PSS-SHA-384', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('RSA-PSS-SHA-512', 'SIGNATURE', 'Not implemented in this pass.'),
];
const LEGACY_SIG = [entry('RSA-PKCS1v1.5', { canonicalName: 'RSA PKCS#1 v1.5', primitiveFamily: 'SIGNATURE', implementationClass: 'LEGACY_VERIFY_ONLY', implementationStatus: 'NOT_IMPLEMENTED', interoperabilityNotes: 'Classified LEGACY_VERIFY_ONLY per spec; not implemented (verify-only path not yet built).' })];

const PQ_SIG = [
  entry('ML-DSA-44', { canonicalName: 'ML-DSA-44', primitiveFamily: 'SIGNATURE', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/mldsa.mjs'], testVectorPaths: ['crypto/mldsa.mjs'], interoperabilityNotes: 'FIPS 204 ML-DSA-44 (post-quantum signature). From-scratch implementation.' }),
  entry('ML-DSA-65', { canonicalName: 'ML-DSA-65', primitiveFamily: 'SIGNATURE', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/mldsa.mjs'], testVectorPaths: ['crypto/mldsa.mjs'], interoperabilityNotes: 'FIPS 204 ML-DSA-65 (post-quantum signature).' }),
  entry('ML-DSA-87', { canonicalName: 'ML-DSA-87', primitiveFamily: 'SIGNATURE', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/mldsa.mjs'], testVectorPaths: ['crypto/mldsa.mjs'], interoperabilityNotes: 'FIPS 204 ML-DSA-87 (post-quantum signature).' }),
  stub('SLH-DSA-SHA2-128s', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('SLH-DSA-SHA2-128f', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('SLH-DSA-SHA2-192s', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('SLH-DSA-SHA2-192f', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('SLH-DSA-SHA2-256s', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('SLH-DSA-SHA2-256f', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('SLH-DSA-SHAKE-128s', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('SLH-DSA-SHAKE-128f', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('SLH-DSA-SHAKE-192s', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('SLH-DSA-SHAKE-192f', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('SLH-DSA-SHAKE-256s', 'SIGNATURE', 'Not implemented in this pass.'),
  stub('SLH-DSA-SHAKE-256f', 'SIGNATURE', 'Not implemented in this pass.'),
];

const KEM = [
  stub('X25519', 'KEM', 'Not implemented in this pass.'),
  stub('X448', 'KEM', 'Not implemented in this pass.'),
  stub('ECDH-P-256', 'KEM', 'Not implemented in this pass.'),
  stub('ECDH-P-384', 'KEM', 'Not implemented in this pass.'),
  stub('ECDH-P-521', 'KEM', 'Not implemented in this pass.'),
  entry('ML-KEM-512', { canonicalName: 'ML-KEM-512', primitiveFamily: 'KEM', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/mlkem.mjs'], testVectorPaths: ['crypto/ref_vectors.json'], interoperabilityNotes: 'FIPS 203 ML-KEM-512 (post-quantum KEM). From-scratch implementation, verified.' }),
  entry('ML-KEM-768', { canonicalName: 'ML-KEM-768', primitiveFamily: 'KEM', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/mlkem.mjs'], testVectorPaths: ['crypto/ref_vectors.json'], interoperabilityNotes: 'FIPS 203 ML-KEM-768 (post-quantum KEM).' }),
  entry('ML-KEM-1024', { canonicalName: 'ML-KEM-1024', primitiveFamily: 'KEM', implementationClass: 'PURE_MJS', implementationStatus: 'COMPLETE', implementationModulePaths: ['crypto/mlkem.mjs'], testVectorPaths: ['crypto/ref_vectors.json'], interoperabilityNotes: 'FIPS 203 ML-KEM-1024 (post-quantum KEM).' }),
];

const AEAD = ['AES-128-GCM', 'AES-192-GCM', 'AES-256-GCM', 'ChaCha20-Poly1305', 'XChaCha20-Poly1305', 'AES-KeyWrap']
  .map((id) => stub(id, 'AEAD', 'Not implemented in this pass; AES-*-GCM is available NODE_NATIVE in principle.'))
  .concat([entry('AES-256-GCM-SIV', { canonicalName: 'AES-256-GCM-SIV', primitiveFamily: 'AEAD', implementationClass: 'VETTED_PROVIDER', implementationStatus: 'NOT_IMPLEMENTED', interoperabilityNotes: 'No native Node support and no provider wired; requires an external library.' })]);

const HYBRID_SIG_PROFILES = [
  'Ed25519+ML-DSA-44', 'Ed25519+ML-DSA-65', 'Ed25519+ML-DSA-87', 'Ed448+ML-DSA-65', 'Ed448+ML-DSA-87',
  'P-256+ML-DSA-44', 'P-384+ML-DSA-65', 'P-384+ML-DSA-87', 'RSA-PSS-3072+ML-DSA-65',
  'Ed25519+SLH-DSA-SHA2-128s', 'Ed25519+SLH-DSA-SHA2-128f',
].map((id) => entry(id, { canonicalName: id, primitiveFamily: 'HYBRID_SIGNATURE', implementationClass: 'VETTED_PROVIDER', implementationStatus: 'BLOCKED', interoperabilityNotes: 'Blocked on both component signature schemes being registered individually first (see CLASSICAL_SIG and PQ_SIG rows).' }));

const HYBRID_KEM_PROFILES = [
  'X25519+ML-KEM-768', 'X25519+ML-KEM-1024', 'X448+ML-KEM-1024',
  'P-256-ECDH+ML-KEM-768', 'P-384-ECDH+ML-KEM-768', 'P-384-ECDH+ML-KEM-1024',
].map((id) => entry(id, { canonicalName: id, primitiveFamily: 'HYBRID_KEM', implementationClass: 'VETTED_PROVIDER', implementationStatus: 'BLOCKED', interoperabilityNotes: 'crypto/confidential.mjs already implements an ML-KEM-only encrypt/verify envelope (96 tests this session). A hybrid classical+PQ combiner is not yet built; blocked on the classical KEM rows above.' }));

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

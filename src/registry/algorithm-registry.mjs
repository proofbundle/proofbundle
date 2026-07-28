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
  digestEntry('BLAKE2b-512', { digestLength: 64, status: 'NOT_IMPLEMENTED', notes: 'Already present in proofbundle.html via the bundled noble library (VETTED_PROVIDER there); not yet re-exposed as a standalone src/digest module.' }),
  digestEntry('BLAKE2s-256', { digestLength: 32, status: 'NOT_IMPLEMENTED', notes: 'Same as BLAKE2b-512.' }),
  digestEntry('BLAKE3', { digestLength: 32, status: 'NOT_IMPLEMENTED', notes: 'Same as BLAKE2b-512.' }),
  digestEntry('Keccak-256', { digestLength: 32, status: 'NOT_IMPLEMENTED', notes: 'Legacy pre-standardization padding (0x01), distinct from SHA3 (0x06). crypto/keccak.mjs exports only the SHA3/SHAKE suffixes; not implemented in this pass.' }),
  digestEntry('Keccak-512', { digestLength: 64, status: 'NOT_IMPLEMENTED', notes: 'Same as Keccak-256.' }),
  entry('SHA-1', { canonicalName: 'SHA-1', primitiveFamily: 'DIGEST', implementationClass: 'RECOGNIZE_AND_REJECT', digestLength: 20, allowedOperations: ['recognize'], implementationModulePaths: ['src/digest/digest.mjs'], failureVerdicts: ['FORBIDDEN_ALGORITHM'], implementationStatus: 'RECOGNIZE_ONLY', interoperabilityNotes: 'Recognized and deterministically rejected by digestBytes(); never dispatched to any digest implementation.' }),
  entry('MD5', { canonicalName: 'MD5', primitiveFamily: 'DIGEST', implementationClass: 'RECOGNIZE_AND_REJECT', digestLength: 16, allowedOperations: ['recognize'], implementationModulePaths: ['src/digest/digest.mjs'], failureVerdicts: ['FORBIDDEN_ALGORITHM'], implementationStatus: 'RECOGNIZE_ONLY', interoperabilityNotes: 'Recognized and deterministically rejected by digestBytes(); never dispatched to any digest implementation.' }),
];

function stub(id, family, notes) {
  return entry(id, { canonicalName: id, primitiveFamily: family, implementationClass: 'VETTED_PROVIDER', implementationStatus: 'NOT_IMPLEMENTED', interoperabilityNotes: notes });
}

const MAC = ['HMAC-SHA-256', 'HMAC-SHA-384', 'HMAC-SHA-512', 'HMAC-SHA3-256', 'HMAC-SHA3-384', 'HMAC-SHA3-512', 'KMAC128', 'KMAC256', 'keyed-BLAKE2', 'keyed-BLAKE3']
  .map((id) => stub(id, 'MAC', id.startsWith('KMAC') ? 'Depends on cSHAKE, not yet implemented.' : 'Not wired in this pass; HMAC-SHA-256/384/512 are straightforward NODE_NATIVE additions and are the natural next step, not attempted here to keep this slice finite.'));

const KDF = ['HKDF-SHA-256', 'HKDF-SHA-384', 'HKDF-SHA-512', 'PBKDF2-HMAC-SHA-256', 'PBKDF2-HMAC-SHA-512', 'scrypt', 'Argon2id', 'ProofBundle-subkey-derivation']
  .map((id) => stub(id, 'KDF', 'Not implemented in this pass.'));

const CLASSICAL_SIG = ['Ed25519', 'Ed448', 'ECDSA-P-256-SHA-256', 'ECDSA-P-384-SHA-384', 'ECDSA-P-521-SHA-512', 'RSA-PSS-SHA-256', 'RSA-PSS-SHA-384', 'RSA-PSS-SHA-512']
  .map((id) => stub(id, 'SIGNATURE', 'Not implemented in this pass; all are available NODE_NATIVE in principle (Node supports Ed25519/Ed448/ECDSA/RSA-PSS natively) and are the natural next slice.'));
const LEGACY_SIG = [entry('RSA-PKCS1v1.5', { canonicalName: 'RSA PKCS#1 v1.5', primitiveFamily: 'SIGNATURE', implementationClass: 'LEGACY_VERIFY_ONLY', implementationStatus: 'NOT_IMPLEMENTED', interoperabilityNotes: 'Classified LEGACY_VERIFY_ONLY per spec; not implemented (verify-only path not yet built).' })];

const PQ_SIG = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87', 'SLH-DSA-SHA2-128s', 'SLH-DSA-SHA2-128f', 'SLH-DSA-SHA2-192s', 'SLH-DSA-SHA2-192f', 'SLH-DSA-SHA2-256s', 'SLH-DSA-SHA2-256f', 'SLH-DSA-SHAKE-128s', 'SLH-DSA-SHAKE-128f', 'SLH-DSA-SHAKE-192s', 'SLH-DSA-SHAKE-192f', 'SLH-DSA-SHAKE-256s', 'SLH-DSA-SHAKE-256f']
  .map((id) => stub(id, 'SIGNATURE', 'Already present in proofbundle.html via the bundled noble-post-quantum library; not yet re-exposed as a standalone provider module in this src/ tree.'));

const KEM = ['X25519', 'X448', 'ECDH-P-256', 'ECDH-P-384', 'ECDH-P-521']
  .map((id) => stub(id, 'KEM', 'Not implemented in this pass; available NODE_NATIVE in principle.'))
  .concat(['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'].map((id) =>
    entry(id, { canonicalName: id, primitiveFamily: 'KEM', implementationClass: 'PURE_MJS', implementationStatus: 'NOT_IMPLEMENTED', implementationModulePaths: ['crypto/mlkem.mjs'], testVectorPaths: ['crypto/ref_vectors.json'], interoperabilityNotes: 'ML-KEM itself is implemented and verified at crypto/mlkem.mjs (40 + 45 tests this session). NOT_IMPLEMENTED here specifically means: not yet re-registered through this src/ registry/dispatcher layer — the primitive exists, the registry wiring does not.' })));

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

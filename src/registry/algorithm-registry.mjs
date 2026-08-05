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

// ---------------------------------------------------------------------------
// The registry is now generated from src/registry/registry-data.mjs, which
// holds the exhaustive enumeration as data. Hand-maintained per-family arrays
// did not scale past ~95 entries and made it easy for a status to drift away
// from the module that backs it.
//
// `buildEntry` is the single place a data row becomes a registry entry, so
// every entry gets every REQUIRED_FIELD whether or not the row supplied one.

import {
  DIGEST_ROWS, MAC_ROWS, KDF_ROWS, CLASSICAL_SIG_ROWS, PQ_SIG_ROWS,
  KEM_ROWS, AEAD_ROWS, HYBRID_SIG_ROWS, HYBRID_KEM_ROWS, HYBRID_POLICY_MODES,
} from './registry-data.mjs';

export { HYBRID_POLICY_MODES };

const FAMILY_DEFAULTS = {
  DIGEST: { ops: ['digest'], verdicts: ['UNKNOWN_ALGORITHM', 'DIGEST_MISMATCH'], spec: 'FIPS 180-4 / FIPS 202 / SP 800-185 / RFC 7693' },
  MAC: { ops: ['mac', 'verify'], verdicts: ['UNKNOWN_ALGORITHM', 'INVALID_SIGNATURE'], spec: 'FIPS 198-1 / RFC 4231 / SP 800-185' },
  KDF: { ops: ['derive'], verdicts: ['UNKNOWN_ALGORITHM'], spec: 'RFC 5869 / RFC 8018 / RFC 7914 / SP 800-108 / SP 800-56C' },
  SIGNATURE: { ops: ['sign', 'verify', 'generateKey'], verdicts: ['UNKNOWN_ALGORITHM', 'UNSUPPORTED_ALGORITHM', 'INVALID_SIGNATURE'], spec: 'RFC 8032 / FIPS 186-5 / RFC 8017 / FIPS 204 / FIPS 205' },
  KEM: { ops: ['encapsulate', 'decapsulate', 'generateKey'], verdicts: ['UNKNOWN_ALGORITHM', 'UNSUPPORTED_ALGORITHM', 'MALFORMED'], spec: 'RFC 7748 / SP 800-56A / FIPS 203' },
  AEAD: { ops: ['encrypt', 'decrypt'], verdicts: ['UNKNOWN_ALGORITHM', 'UNSUPPORTED_ALGORITHM', 'INVALID_SIGNATURE'], spec: 'SP 800-38D / RFC 8439 / RFC 3394 / RFC 5649' },
  HYBRID_SIGNATURE: { ops: ['sign', 'verify'], verdicts: ['UNSUPPORTED_ALGORITHM', 'INVALID_SIGNATURE'], spec: 'ProofBundle FORMAT_SPECIFICATION.md (hybrid profiles)' },
  HYBRID_KEM: { ops: ['encapsulate', 'decapsulate'], verdicts: ['UNSUPPORTED_ALGORITHM', 'MALFORMED'], spec: 'ProofBundle FORMAT_SPECIFICATION.md (hybrid profiles)' },
};

const DEFAULT_MODULE = {
  MAC: 'src/mac/hmac.mjs',
  KDF: 'src/kdf/hkdf.mjs',
  SIGNATURE: 'src/signature/signature.mjs',
  KEM: 'src/kem/ecdh.mjs',
  AEAD: 'src/aead/aead.mjs',
};
const DEFAULT_VECTORS = {
  MAC: 'vectors/mac/hmac.json',
  KDF: 'vectors/kdf/kdf.json',
  SIGNATURE: 'vectors/signatures/signatures.json',
  KEM: 'vectors/kem/ecdh.json',
  AEAD: 'vectors/encryption/aead.json',
};

// Statuses that assert working code. Only these get module/vector paths filled
// in from the family default — a NOT_IMPLEMENTED row must never inherit an
// evidence path it has no claim to.
const BACKED_BY_CODE = new Set(['COMPLETE', 'LEGACY_VERIFY_ONLY', 'PARTIAL']);

function buildEntry(family, [id, klass, status, opts = {}]) {
  const d = FAMILY_DEFAULTS[family];
  const backed = BACKED_BY_CODE.has(status);
  const modulePath = opts.module ?? (backed ? DEFAULT_MODULE[family] : null);
  const vectorPath = opts.vectors ?? (status === 'COMPLETE' ? DEFAULT_VECTORS[family] : null);
  // RECOGNIZE_ONLY rows point at the module that performs the rejection, but
  // carry no vectors: there is no output to have a vector for.
  const recogniseModule = status === 'RECOGNIZE_ONLY' ? (opts.module ?? DEFAULT_MODULE[family] ?? null) : null;

  return entry(id, {
    canonicalName: opts.canonicalName ?? id,
    primitiveFamily: family,
    implementationClass: klass,
    securityStatus: status === 'RECOGNIZE_ONLY' ? 'REJECTED'
      : status === 'LEGACY_VERIFY_ONLY' ? 'DEPRECATED' : 'CURRENT',
    allowedOperations: status === 'RECOGNIZE_ONLY' ? ['recognize']
      : status === 'LEGACY_VERIFY_ONLY' ? d.ops.filter((o) => o === 'verify' || o === 'digest' || o === 'derive' || o === 'mac') : d.ops,
    digestLength: opts.digestLength ?? null,
    keyLengths: opts.keyBits ? [opts.keyBits] : null,
    nonceLength: opts.nonce ?? null,
    tagLength: opts.tag ?? null,
    signatureEncoding: opts.sigEncoding ?? null,
    publicKeyEncoding: family === 'SIGNATURE' || family === 'KEM' ? 'SPKI DER (PEM/JWK also supported)' : null,
    privateKeyEncoding: family === 'SIGNATURE' || family === 'KEM' ? 'PKCS#8 DER (PEM/JWK also supported)' : null,
    transcriptRules: opts.transcriptRules ?? (family === 'SIGNATURE'
      ? 'Signed bytes are buildTranscript(SIGNATURE_TRANSCRIPT, [algId, keyId, message]) — algorithm id and key id are inside the signature.'
      : family === 'AEAD'
        ? 'AAD passed to the cipher is buildTranscript(ENCRYPTED_HEADER, [algId, nonce, callerAad]), binding the suite id and nonce to the ciphertext.'
        : family === 'KEM'
          ? 'Shared secret is HKDF over the raw agreement with info = buildTranscript(KEM_COMPONENT, [algId, recipientSPKI, ephemeralSPKI]).'
          : null),
    domainSeparationTag: opts.domainTag ?? null,
    providerRequirements: klass === 'VETTED_PROVIDER' ? 'external provider required; none configured in this environment' : null,
    generationPolicy: status === 'LEGACY_VERIFY_ONLY' ? 'PROHIBITED — generation entry points raise FORBIDDEN_ALGORITHM'
      : status === 'RECOGNIZE_ONLY' ? 'PROHIBITED — never dispatched'
        : status === 'COMPLETE' ? 'permitted' : null,
    verificationPolicy: status === 'RECOGNIZE_ONLY' ? 'PROHIBITED — deterministic rejection'
      : backed ? 'permitted' : null,
    historicalVerificationPolicy: status === 'LEGACY_VERIFY_ONLY' ? 'permitted' : (backed ? 'permitted' : null),
    testVectorPaths: vectorPath ? [vectorPath] : [],
    implementationModulePaths: modulePath ? [modulePath] : (recogniseModule ? [recogniseModule] : []),
    failureVerdicts: status === 'RECOGNIZE_ONLY' ? ['FORBIDDEN_ALGORITHM'] : d.verdicts,
    interoperabilityNotes: opts.notes ?? opts.blocker ?? null,
    implementationStatus: status,
  });
}

export const ALGORITHM_REGISTRY = Object.freeze([
  ...DIGEST_ROWS.map((r) => buildEntry('DIGEST', r)),
  ...MAC_ROWS.map((r) => buildEntry('MAC', r)),
  ...KDF_ROWS.map((r) => buildEntry('KDF', r)),
  ...CLASSICAL_SIG_ROWS.map((r) => buildEntry('SIGNATURE', r)),
  ...PQ_SIG_ROWS.map((r) => buildEntry('SIGNATURE', r)),
  ...KEM_ROWS.map((r) => buildEntry('KEM', r)),
  ...AEAD_ROWS.map((r) => buildEntry('AEAD', r)),
  ...HYBRID_SIG_ROWS.map((r) => buildEntry('HYBRID_SIGNATURE', r)),
  ...HYBRID_KEM_ROWS.map((r) => buildEntry('HYBRID_KEM', r)),
]);

export const NORMATIVE_SPEC_BY_FAMILY = Object.freeze(
  Object.fromEntries(Object.entries(FAMILY_DEFAULTS).map(([k, v]) => [k, v.spec])),
);
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

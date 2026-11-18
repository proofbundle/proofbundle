import { ProofBundleError, Verdict } from './errors.mjs';

function entry(id, kind, status, standard, implementation, extra = {}) {
  return Object.freeze({
    id,
    kind,
    version: 1,
    status,
    standard,
    implementation,
    ...extra,
  });
}

const entries = [
  entry('pb.hash.sha2-256.v1', 'hash', 'active', 'FIPS 180-4', 'node:crypto', {
    nodeName: 'sha256',
    outputLength: 32,
    multihash: { code: 0x12, status: 'permanent' },
  }),
  entry('pb.hash.sha2-384.v1', 'hash', 'active', 'FIPS 180-4', 'node:crypto', {
    nodeName: 'sha384',
    outputLength: 48,
    multihash: { code: 0x20, status: 'permanent' },
  }),
  entry('pb.hash.sha2-512.v1', 'hash', 'active', 'FIPS 180-4', 'node:crypto', {
    nodeName: 'sha512',
    outputLength: 64,
    multihash: { code: 0x13, status: 'permanent' },
  }),
  entry('pb.hash.sha2-512-256.v1', 'hash', 'active', 'FIPS 180-4', 'node:crypto', {
    nodeName: 'sha512-256',
    outputLength: 32,
    multihash: { code: 0x1015, status: 'permanent' },
  }),
  entry('pb.hash.sha3-256.v1', 'hash', 'active', 'FIPS 202', 'node:crypto', {
    nodeName: 'sha3-256',
    outputLength: 32,
    multihash: { code: 0x16, status: 'permanent' },
  }),
  entry('pb.hash.sha3-384.v1', 'hash', 'active', 'FIPS 202', 'node:crypto', {
    nodeName: 'sha3-384',
    outputLength: 48,
    multihash: { code: 0x15, status: 'permanent' },
  }),
  entry('pb.hash.sha3-512.v1', 'hash', 'active', 'FIPS 202', 'node:crypto', {
    nodeName: 'sha3-512',
    outputLength: 64,
    multihash: { code: 0x14, status: 'permanent' },
  }),
  entry('pb.hash.blake3-256.v1', 'hash', 'active', 'BLAKE3 specification', '@noble/hashes', {
    outputLength: 32,
    multihash: { code: 0x1e, status: 'draft' },
    assuranceNote: 'BLAKE3 is not a NIST/FIPS hash; retain a standardized compatibility digest.',
  }),
  entry('pb.hash.blake2b-512.v1', 'hash', 'active', 'RFC 7693', 'node:crypto', {
    nodeName: 'blake2b512',
    outputLength: 64,
    multihash: { code: 0xb240, status: 'draft' },
  }),
  entry('pb.hash.blake2s-256.v1', 'hash', 'active', 'RFC 7693', 'node:crypto', {
    nodeName: 'blake2s256',
    outputLength: 32,
    multihash: { code: 0xb260, status: 'draft' },
  }),
  entry('pb.xof.shake256.v1', 'xof', 'active', 'FIPS 202', 'node:crypto', {
    nodeName: 'shake256',
    outputLengthRequired: true,
    multihash: { code: 0x19, status: 'draft' },
  }),
  entry('pb.xof.cshake256.v1', 'xof', 'active', 'NIST SP 800-185', '@noble/hashes', {
    outputLengthRequired: true,
    personalizationRequired: true,
  }),
  entry('pb.mac.kmac256.v1', 'mac', 'active', 'NIST SP 800-185', '@noble/hashes', {
    outputLengthDefault: 32,
    minimumKeyLength: 32,
  }),

  entry('pb.sig.ed25519.v1', 'signature', 'active', 'RFC 8032 / FIPS 186-5', 'node:crypto', {
    nodeType: 'ed25519',
  }),
  entry('pb.sig.ed448.v1', 'signature', 'active', 'RFC 8032 / FIPS 186-5', 'node:crypto', {
    nodeType: 'ed448',
  }),
  entry('pb.sig.ecdsa-p256-sha256-p1363.v1', 'signature', 'active', 'FIPS 186-5', 'node:crypto', {
    nodeType: 'ec',
    namedCurve: 'prime256v1',
    digest: 'sha256',
    signatureEncoding: 'ieee-p1363',
  }),
  entry('pb.sig.ecdsa-p384-sha384-p1363.v1', 'signature', 'active', 'FIPS 186-5', 'node:crypto', {
    nodeType: 'ec',
    namedCurve: 'secp384r1',
    digest: 'sha384',
    signatureEncoding: 'ieee-p1363',
  }),
  entry('pb.sig.rsa-pss-3072-sha384.v1', 'signature', 'active', 'RFC 8017 / FIPS 186-5', 'node:crypto', {
    nodeType: 'rsa-pss',
    modulusLength: 3072,
    digest: 'sha384',
    saltLength: 48,
  }),
  entry('pb.sig.rsa-pss-4096-sha512.v1', 'signature', 'active', 'RFC 8017 / FIPS 186-5', 'node:crypto', {
    nodeType: 'rsa-pss',
    modulusLength: 4096,
    digest: 'sha512',
    saltLength: 64,
  }),
  ...['44', '65', '87'].map((level) =>
    entry(`pb.sig.ml-dsa-${level}.v1`, 'signature', 'active', 'FIPS 204', 'node:crypto/OpenSSL', {
      nodeType: `ml-dsa-${level}`,
    }),
  ),
  ...['128s', '128f', '192s', '192f', '256s', '256f'].flatMap((parameter) =>
    ['sha2', 'shake'].map((family) =>
      entry(
        `pb.sig.slh-dsa-${family}-${parameter}.v1`,
        'signature',
        'active',
        'FIPS 205',
        'node:crypto/OpenSSL',
        { nodeType: `slh-dsa-${family}-${parameter}` },
      ),
    ),
  ),
  entry(
    'pb.sig.hybrid.ed25519+ml-dsa-65.v1',
    'hybrid-signature',
    'active',
    'ProofBundle composite profile',
    'ProofBundle',
    { components: ['pb.sig.ed25519.v1', 'pb.sig.ml-dsa-65.v1'], threshold: 'all' },
  ),
  entry(
    'pb.sig.hybrid.ed448+ml-dsa-87.v1',
    'hybrid-signature',
    'active',
    'ProofBundle composite profile',
    'ProofBundle',
    { components: ['pb.sig.ed448.v1', 'pb.sig.ml-dsa-87.v1'], threshold: 'all' },
  ),
  entry(
    'pb.sig.hybrid.ecdsa-p384+ml-dsa-87.v1',
    'hybrid-signature',
    'active',
    'ProofBundle composite profile',
    'ProofBundle',
    {
      components: ['pb.sig.ecdsa-p384-sha384-p1363.v1', 'pb.sig.ml-dsa-87.v1'],
      threshold: 'all',
    },
  ),

  ...['512', '768', '1024'].map((level) =>
    entry(`pb.kem.ml-kem-${level}.v1`, 'kem', 'active', 'FIPS 203', 'node:crypto/OpenSSL', {
      nodeType: `ml-kem-${level}`,
    }),
  ),
  entry('pb.kex.x25519.v1', 'key-exchange', 'active', 'RFC 7748', 'node:crypto', {
    nodeType: 'x25519',
  }),
  entry('pb.kex.ecdh-p384.v1', 'key-exchange', 'active', 'NIST SP 800-56A', 'node:crypto', {
    nodeType: 'ec',
    namedCurve: 'secp384r1',
  }),
  entry(
    'pb.kem.hybrid.x25519+ml-kem-768.v1',
    'hybrid-kem',
    'review-required',
    'ProofBundle fixed-length combiner; informed by RFC 9954',
    'ProofBundle',
    {
      components: ['pb.kex.x25519.v1', 'pb.kem.ml-kem-768.v1'],
      kdf: 'pb.kdf.hkdf-sha512.v1',
      assuranceNote: 'This is a ProofBundle suite, not an IETF-assigned generic KEM identifier.',
    },
  ),
  entry(
    'pb.kem.hybrid.p384+ml-kem-768.v1',
    'hybrid-kem',
    'review-required',
    'ProofBundle fixed-length combiner; informed by RFC 9954',
    'ProofBundle',
    {
      components: ['pb.kex.ecdh-p384.v1', 'pb.kem.ml-kem-768.v1'],
      kdf: 'pb.kdf.hkdf-sha512.v1',
      assuranceNote: 'This is a ProofBundle suite, not an IETF-assigned generic KEM identifier.',
    },
  ),

  entry('pb.aead.aes-256-gcm.v1', 'aead', 'active', 'NIST SP 800-38D', 'node:crypto', {
    nodeName: 'aes-256-gcm',
    keyLength: 32,
    nonceLength: 12,
    tagLength: 16,
  }),
  entry('pb.aead.aes-256-gcm-siv.v1', 'aead', 'active', 'RFC 8452', '@noble/ciphers', {
    keyLength: 32,
    nonceLength: 12,
    tagLength: 16,
  }),
  entry(
    'pb.aead.chacha20-poly1305.v1',
    'aead',
    'active',
    'RFC 8439',
    'node:crypto',
    { nodeName: 'chacha20-poly1305', keyLength: 32, nonceLength: 12, tagLength: 16 },
  ),
  entry(
    'pb.aead.xchacha20-poly1305.v1',
    'aead',
    'active',
    'draft-irtf-cfrg-xchacha',
    '@noble/ciphers',
    {
      keyLength: 32,
      nonceLength: 24,
      tagLength: 16,
      assuranceNote: 'Widely deployed construction; the cited IRTF document remains a draft.',
    },
  ),

  ...['256', '384', '512'].map((level) =>
    entry(`pb.kdf.hkdf-sha${level}.v1`, 'kdf', 'active', 'RFC 5869', 'node:crypto', {
      nodeDigest: `sha${level}`,
    }),
  ),
  entry('pb.kdf.argon2id.v1', 'password-kdf', 'active', 'RFC 9106', 'node:crypto', {
    minimumSaltLength: 16,
  }),
  entry(
    'pb.kdf.pbkdf2-hmac-sha256-legacy.v1',
    'password-kdf',
    'legacy-only',
    'NIST SP 800-132',
    'node:crypto',
    { nodeDigest: 'sha256', creationDefault: false },
  ),

  entry(
    'pb.enc.ml-kem-768+hkdf-sha384+aes-256-gcm.v1',
    'encryption-suite',
    'active',
    'ProofBundle KEM-DEM profile',
    'ProofBundle',
    {
      kem: 'pb.kem.ml-kem-768.v1',
      kdf: 'pb.kdf.hkdf-sha384.v1',
      aead: 'pb.aead.aes-256-gcm.v1',
    },
  ),
  entry(
    'pb.enc.ml-kem-768+hkdf-sha512+xchacha20-poly1305.v1',
    'encryption-suite',
    'active',
    'ProofBundle KEM-DEM profile',
    'ProofBundle',
    {
      kem: 'pb.kem.ml-kem-768.v1',
      kdf: 'pb.kdf.hkdf-sha512.v1',
      aead: 'pb.aead.xchacha20-poly1305.v1',
    },
  ),
  entry(
    'pb.enc.x25519+ml-kem-768+hkdf-sha512+xchacha20-poly1305.v1',
    'encryption-suite',
    'review-required',
    'ProofBundle KEM-DEM profile',
    'ProofBundle',
    {
      kem: 'pb.kem.hybrid.x25519+ml-kem-768.v1',
      kdf: 'pb.kdf.hkdf-sha512.v1',
      aead: 'pb.aead.xchacha20-poly1305.v1',
    },
  ),

  entry('pb.encoding.cbor-deterministic-subset.v1', 'encoding', 'active', 'RFC 8949 §4.2', 'ProofBundle'),
  entry('pb.encoding.jcs.v1', 'encoding', 'active', 'RFC 8785', 'ProofBundle'),
  entry('pb.timestamp.rfc3161.v1', 'timestamp', 'external-verifier', 'RFC 3161', 'OpenSSL adapter'),
  entry('pb.timestamp.opentimestamps.v1', 'timestamp', 'external-verifier', 'OpenTimestamps', 'ots-cli adapter'),
];

export const ALGORITHM_REGISTRY = Object.freeze(
  Object.fromEntries(entries.map((item) => [item.id, item])),
);

if (Object.keys(ALGORITHM_REGISTRY).length !== entries.length) {
  throw new Error('duplicate algorithm identifier in registry');
}

export const PROFILES = Object.freeze({
  'pb.profile.provenance-2026.v1': Object.freeze({
    id: 'pb.profile.provenance-2026.v1',
    version: 1,
    status: 'active',
    encoding: 'pb.encoding.cbor-deterministic-subset.v1',
    digests: ['pb.hash.blake3-256.v1', 'pb.hash.sha2-256.v1'],
    merkle: 'pb.hash.blake3-256.v1',
    signature: 'pb.sig.hybrid.ed25519+ml-dsa-65.v1',
    optionalEncryption: 'pb.enc.x25519+ml-kem-768+hkdf-sha512+xchacha20-poly1305.v1',
    timestamps: ['pb.timestamp.rfc3161.v1', 'pb.timestamp.opentimestamps.v1'],
    timestampPolicy: { minimumIndependentEvidence: 1 },
  }),
  'pb.profile.interop-2026.v1': Object.freeze({
    id: 'pb.profile.interop-2026.v1',
    version: 1,
    status: 'active',
    encoding: 'pb.encoding.cbor-deterministic-subset.v1',
    digests: ['pb.hash.sha2-256.v1', 'pb.hash.sha2-512.v1'],
    merkle: 'pb.hash.sha2-256.v1',
    signature: 'pb.sig.ed25519.v1',
    optionalEncryption: 'pb.enc.ml-kem-768+hkdf-sha384+aes-256-gcm.v1',
    timestamps: ['pb.timestamp.rfc3161.v1'],
    timestampPolicy: { minimumIndependentEvidence: 1 },
  }),
  'pb.profile.nist-algorithms-2026.v1': Object.freeze({
    id: 'pb.profile.nist-algorithms-2026.v1',
    version: 1,
    status: 'active',
    encoding: 'pb.encoding.cbor-deterministic-subset.v1',
    digests: ['pb.hash.sha2-384.v1', 'pb.hash.sha3-384.v1'],
    merkle: 'pb.hash.sha3-256.v1',
    signature: 'pb.sig.ml-dsa-65.v1',
    optionalEncryption: 'pb.enc.ml-kem-768+hkdf-sha384+aes-256-gcm.v1',
    timestamps: ['pb.timestamp.rfc3161.v1'],
    timestampPolicy: { minimumIndependentEvidence: 1 },
    assuranceNote:
      'This selects standardized algorithms; it does not assert that the runtime is a validated FIPS module.',
  }),
});

export function getAlgorithm(id, options = {}) {
  const algorithm = ALGORITHM_REGISTRY[id];
  if (!algorithm) {
    throw new ProofBundleError(Verdict.UNKNOWN_ALGORITHM, `unknown algorithm identifier: ${id}`);
  }
  if (options.kind && algorithm.kind !== options.kind) {
    throw new ProofBundleError(
      Verdict.MALFORMED,
      `algorithm ${id} has kind ${algorithm.kind}, expected ${options.kind}`,
    );
  }
  if (algorithm.status === 'legacy-only' && options.allowLegacy !== true) {
    throw new ProofBundleError(Verdict.DEPRECATED_ALGORITHM, `${id} is legacy-only`);
  }
  if (algorithm.status === 'review-required' && options.allowReviewRequired !== true) {
    throw new ProofBundleError(
      Verdict.POLICY_DENIED,
      `${id} requires explicit review-policy authorization`,
    );
  }
  return algorithm;
}

export function getProfile(id) {
  const profile = PROFILES[id];
  if (!profile) {
    throw new ProofBundleError(Verdict.UNKNOWN_ALGORITHM, `unknown profile identifier: ${id}`);
  }
  return profile;
}

export function listAlgorithms(kind = undefined) {
  return entries.filter((item) => kind === undefined || item.kind === kind);
}

export const proofbundleTargetAdditions = Object.freeze({
  missingOrUnclosed: [
    'SHA-512/256','cSHAKE256','KMAC256','Ed448','ECDSA-P521',
    'RSA-PSS-2048','RSA-PSS-3072','RSA-PSS-4096',
    'SLH-DSA-128f','SLH-DSA-128s','SLH-DSA-192f','SLH-DSA-192s','SLH-DSA-256f','SLH-DSA-256s',
    'Falcon-512','Falcon-1024'
  ],
  nodeConfirmedInThisPackage: [
  "SHA-256",
  "SHA-384",
  "SHA-512",
  "SHA3-256",
  "SHA3-384",
  "SHA3-512",
  "SHAKE128",
  "SHAKE256",
  "BLAKE2b",
  "BLAKE2s",
  "BLAKE3",
  "BLAKE3-keyed",
  "BLAKE3-derive-key",
  "BLAKE3-XOF",
  "Ed25519",
  "ECDSA-P256",
  "ECDSA-P384",
  "ML-KEM-512",
  "ML-KEM-768",
  "ML-KEM-1024",
  "ML-DSA-44",
  "ML-DSA-65",
  "ML-DSA-87"
]
});

export function requireClosedAlgorithm(name) {
  if (proofbundleTargetAdditions.missingOrUnclosed.includes(name)) {
    throw new Error('Algorithm not closed in this package: ' + name);
  }
  return true;
}

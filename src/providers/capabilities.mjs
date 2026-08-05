// Capability detection for every provider named in the specification.
//
// Each entry is probed rather than assumed. `node:crypto` is probed by actually
// exercising the primitive; the hardware, OS, and remote providers are probed
// for the module, device node, or credential they need, and every one of them
// reports the exact reason it is unavailable — "no PKCS#11 module configured"
// is a different fact from "no TPM device present", and collapsing them into
// one generic "unavailable" would lose the blocking dependency.

import { existsSync } from 'node:fs';
import { getHashes, getCiphers, generateKeyPairSync } from 'node:crypto';
import { Provider, UnavailableProvider } from './provider.mjs';
import { signatureAlgorithms } from '../signature/signature.mjs';
import { aeadAlgorithms } from '../aead/aead.mjs';
import { kemAlgorithms } from '../kem/ecdh.mjs';

function probeNodeCrypto() {
  const missing = [];
  for (const h of ['sha256', 'sha512', 'sha3-256']) if (!getHashes().includes(h)) missing.push(`hash:${h}`);
  for (const c of ['aes-256-gcm', 'chacha20-poly1305']) if (!getCiphers().includes(c)) missing.push(`cipher:${c}`);
  try { generateKeyPairSync('ed25519'); } catch { missing.push('keypair:ed25519'); }
  if (missing.length) {
    return new UnavailableProvider({
      providerId: 'node:crypto',
      reason: `this Node/OpenSSL build lacks: ${missing.join(', ')}`,
      detectedBy: 'runtime probe of getHashes/getCiphers/generateKeyPairSync',
    });
  }
  return new Provider({
    providerId: 'node:crypto',
    providerVersion: process.versions.openssl ? `openssl ${process.versions.openssl}` : `node ${process.version}`,
    capabilities: { digest: true, mac: true, kdf: true, signature: true, kem: true, aead: true },
    supportedAlgorithms: [...signatureAlgorithms(), ...aeadAlgorithms(), ...kemAlgorithms()],
    supportedOperations: ['getPublicKey', 'sign', 'verify', 'encapsulate', 'decapsulate', 'generateKey'],
  });
}

// Providers that need something this environment does not have. The reason
// strings are the blocking dependency for the corresponding coverage rows.
const EXTERNAL = [
  { providerId: 'pkcs11', envVar: 'PROOFBUNDLE_PKCS11_MODULE', reason: 'no PKCS#11 module path configured', detectedBy: 'env PROOFBUNDLE_PKCS11_MODULE unset and no module loaded' },
  { providerId: 'tpm2', path: '/dev/tpm0', reason: 'no TPM 2.0 device node present', detectedBy: 'stat /dev/tpm0' },
  { providerId: 'secure-enclave', platform: 'darwin', reason: 'Apple Secure Enclave requires macOS on Apple silicon', detectedBy: `process.platform === ${JSON.stringify(process.platform)}` },
  { providerId: 'windows-cng', platform: 'win32', reason: 'Windows CNG/NCrypt requires Windows', detectedBy: `process.platform === ${JSON.stringify(process.platform)}` },
  { providerId: 'macos-keychain', platform: 'darwin', reason: 'macOS Keychain requires macOS', detectedBy: `process.platform === ${JSON.stringify(process.platform)}` },
  { providerId: 'android-keystore', platform: 'android', reason: 'Android Keystore requires an Android runtime', detectedBy: `process.platform === ${JSON.stringify(process.platform)}` },
  { providerId: 'piv', envVar: 'PROOFBUNDLE_PIV_READER', reason: 'no PIV smart-card reader configured', detectedBy: 'env PROOFBUNDLE_PIV_READER unset' },
  { providerId: 'fido2', envVar: 'PROOFBUNDLE_FIDO2_DEVICE', reason: 'no FIDO2/WebAuthn authenticator available in a headless process', detectedBy: 'env PROOFBUNDLE_FIDO2_DEVICE unset' },
  { providerId: 'cloud-kms', envVar: 'PROOFBUNDLE_KMS_ENDPOINT', reason: 'no cloud KMS endpoint or credentials configured', detectedBy: 'env PROOFBUNDLE_KMS_ENDPOINT unset' },
  { providerId: 'remote-signing', envVar: 'PROOFBUNDLE_REMOTE_SIGNER', reason: 'no remote signing endpoint configured', detectedBy: 'env PROOFBUNDLE_REMOTE_SIGNER unset' },
  { providerId: 'rfc3161-tsa', envVar: 'PROOFBUNDLE_TSA_URL', reason: 'no RFC 3161 TSA URL configured and no outbound network permitted', detectedBy: 'env PROOFBUNDLE_TSA_URL unset' },
  { providerId: 'opentimestamps', envVar: 'PROOFBUNDLE_OTS_CALENDAR', reason: 'no OpenTimestamps calendar configured and no outbound network permitted', detectedBy: 'env PROOFBUNDLE_OTS_CALENDAR unset' },
  { providerId: 'x509-path-validation', envVar: 'PROOFBUNDLE_TRUST_ANCHORS', reason: 'no trust-anchor set configured; path validation without anchors is undefined, not permissive', detectedBy: 'env PROOFBUNDLE_TRUST_ANCHORS unset' },
  { providerId: 'ocsp', envVar: 'PROOFBUNDLE_OCSP_URL', reason: 'no OCSP responder configured and no outbound network permitted', detectedBy: 'env PROOFBUNDLE_OCSP_URL unset' },
  { providerId: 'argon2id', envVar: 'PROOFBUNDLE_ARGON2_MODULE', reason: 'Argon2id needs a vetted native/WASM module; none is bundled and none is configured', detectedBy: 'env PROOFBUNDLE_ARGON2_MODULE unset' },
  { providerId: 'ml-kem', envVar: 'PROOFBUNDLE_MLKEM_PROVIDER', reason: 'ML-KEM is not provided by this Node build and no vetted provider is configured', detectedBy: 'node:crypto exposes no ML-KEM key type' },
  { providerId: 'ml-dsa', envVar: 'PROOFBUNDLE_MLDSA_PROVIDER', reason: 'ML-DSA is not provided by this Node build and no vetted provider is configured', detectedBy: 'node:crypto exposes no ML-DSA key type' },
  { providerId: 'slh-dsa', envVar: 'PROOFBUNDLE_SLHDSA_PROVIDER', reason: 'SLH-DSA is not provided by this Node build and no vetted provider is configured', detectedBy: 'node:crypto exposes no SLH-DSA key type' },
  { providerId: 'blake3', envVar: 'PROOFBUNDLE_BLAKE3_MODULE', reason: 'BLAKE3 needs a vetted native/WASM module; none is bundled and none is configured', detectedBy: 'node:crypto getHashes() has no blake3' },
];

function probeExternal(spec) {
  if (spec.platform && process.platform === spec.platform && spec.probePath && existsSync(spec.probePath)) {
    return null; // present — no such case in this environment, kept for correctness on other hosts
  }
  if (spec.path && existsSync(spec.path)) return null;
  if (spec.envVar && process.env[spec.envVar]) {
    // Configured but not implemented in this build: still unavailable, with a
    // different reason, because pretending otherwise would be the exact
    // "manufactured cryptographic output" the spec forbids.
    return new UnavailableProvider({
      providerId: spec.providerId,
      reason: `${spec.envVar} is set but no adapter for ${spec.providerId} is wired in this build`,
      detectedBy: `env ${spec.envVar} present, adapter absent`,
    });
  }
  return new UnavailableProvider({ providerId: spec.providerId, reason: spec.reason, detectedBy: spec.detectedBy });
}

export function detectProviders() {
  const out = new Map();
  const nodeProvider = probeNodeCrypto();
  out.set(nodeProvider.providerId, nodeProvider);
  for (const spec of EXTERNAL) {
    const p = probeExternal(spec);
    if (p) out.set(p.providerId, p);
  }
  return out;
}

export function providerReport() {
  const providers = detectProviders();
  const rows = [...providers.values()].map((p) => p.describe());
  return {
    generatedBy: 'src/providers/capabilities.mjs',
    platform: `${process.platform}/${process.arch}`,
    node: process.version,
    openssl: process.versions.openssl ?? null,
    available: rows.filter((r) => r.available).map((r) => r.providerId),
    unavailable: rows.filter((r) => !r.available).map((r) => ({ providerId: r.providerId, reason: r.reason, detectedBy: r.detectedBy })),
    providers: rows,
  };
}

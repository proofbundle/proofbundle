import { compareBytes, toBase64url, utf8 } from './bytes.mjs';
import { decodeCanonicalCbor, encodeCanonicalCbor } from './canonical-cbor.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';
import { digestSet } from './hashes.mjs';
import { contentId } from './multiformats.mjs';
import { signDetached } from './signatures.mjs';
import { merkleRoot } from './structures.mjs';
import { getProfile } from './registry.mjs';

const MANIFEST_FORMAT = 'ProofBundle-Manifest';
const BUNDLE_FORMAT = 'ProofBundle-Signed-Bundle';

export function assertCanonicalPath(path) {
  if (typeof path !== 'string' || path.length === 0) {
    throw new ProofBundleError(Verdict.MALFORMED, 'manifest path must be non-empty text');
  }
  if (path.includes('\\') || path.startsWith('/') || path.includes('\u0000')) {
    throw new ProofBundleError(Verdict.MALFORMED, `manifest path is not portable: ${path}`);
  }
  if (path !== path.normalize('NFC')) {
    throw new ProofBundleError(Verdict.MALFORMED, `manifest path is not NFC-normalized: ${path}`);
  }
  const segments = path.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new ProofBundleError(Verdict.MALFORMED, `manifest path has a forbidden segment: ${path}`);
  }
  utf8(path, 'manifest path');
  return path;
}

export function assertCanonicalTimestamp(timestamp) {
  if (
    typeof timestamp !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp) ||
    Number.isNaN(Date.parse(timestamp)) ||
    new Date(timestamp).toISOString() !== timestamp
  ) {
    throw new ProofBundleError(
      Verdict.MALFORMED,
      'timestamp must be a real UTC instant in YYYY-MM-DDTHH:mm:ss.sssZ form',
    );
  }
  return timestamp;
}

function sortPaths(entries) {
  return [...entries].sort((a, b) => compareBytes(utf8(a.path), utf8(b.path)));
}

function entryFor(profile, file) {
  const path = assertCanonicalPath(file.path);
  const bytes =
    file.bytes instanceof Uint8Array
      ? file.bytes
      : (() => {
          throw new ProofBundleError(Verdict.MALFORMED, `bytes are required for ${path}`);
        })();
  return {
    path,
    byteLength: bytes.byteLength,
    mediaType: file.mediaType ?? 'application/octet-stream',
    digests: digestSet(profile.digests, bytes),
  };
}

export function buildManifest(files, options) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new ProofBundleError(Verdict.MALFORMED, 'manifest must contain at least one file');
  }
  if (!options || typeof options !== 'object') {
    throw new ProofBundleError(Verdict.MALFORMED, 'manifest options are required');
  }
  const profile = getProfile(options.profileId);
  const entries = sortPaths(files.map((file) => entryFor(profile, file)));
  if (new Set(entries.map(({ path }) => path)).size !== entries.length) {
    throw new ProofBundleError(Verdict.MALFORMED, 'manifest contains duplicate paths');
  }
  const parentBundles = options.parentBundles ?? [];
  if (
    !Array.isArray(parentBundles) ||
    parentBundles.some((cid) => typeof cid !== 'string') ||
    new Set(parentBundles).size !== parentBundles.length ||
    parentBundles.some((cid, index) => index > 0 && cid <= parentBundles[index - 1])
  ) {
    throw new ProofBundleError(
      Verdict.MALFORMED,
      'parent bundle CIDs must be unique and lexicographically sorted',
    );
  }
  const manifest = {
    format: MANIFEST_FORMAT,
    version: 1,
    profileId: profile.id,
    createdAt: assertCanonicalTimestamp(options.createdAt),
    entries,
    integrity: {
      merkleAlgorithmId: profile.merkle,
      merkleRoot: merkleRoot(entries.map(encodeCanonicalCbor), profile.merkle),
    },
    parentBundles,
    metadata: options.metadata ?? {},
  };
  const bytes = encodeCanonicalCbor(manifest);
  return Object.freeze({
    manifest,
    bytes,
    cid: contentId(bytes, {
      hashId: 'pb.hash.sha2-256.v1',
      codec: 'dag-cbor',
      base: 'base32',
    }),
  });
}

export function decodeManifest(bytes) {
  const manifest = decodeCanonicalCbor(bytes);
  if (manifest.format !== MANIFEST_FORMAT || manifest.version !== 1) {
    throw new ProofBundleError(Verdict.MALFORMED, 'unsupported ProofBundle manifest');
  }
  return manifest;
}

export function createSignedBundle(files, signingKeys, options) {
  const built = buildManifest(files, options);
  const profile = getProfile(options.profileId);
  if (options.signatureSuiteId !== undefined && options.signatureSuiteId !== profile.signature) {
    throw new ProofBundleError(
      Verdict.POLICY_DENIED,
      'signature suite override conflicts with the selected profile',
    );
  }
  const signature = signDetached(profile.signature, signingKeys, built.bytes, {
    manifestCid: built.cid,
    profileId: profile.id,
    createdAt: built.manifest.createdAt,
  });
  const verificationKeys = signingKeys.map(
    ({ algorithmId, keyId, publicKeyDer, certificateChain = undefined }) => ({
      algorithmId,
      keyId,
      publicKeyDer,
      ...(certificateChain === undefined ? {} : { certificateChain }),
    }),
  );
  const bundle = {
    format: BUNDLE_FORMAT,
    version: 1,
    manifest: built.bytes,
    signature,
    verificationKeys,
    timestamps: options.timestamps ?? [],
  };
  return Object.freeze({
    bundle,
    bytes: encodeCanonicalCbor(bundle),
    manifest: built.manifest,
    manifestBytes: built.bytes,
    manifestCid: built.cid,
  });
}

export function decodeSignedBundle(bytes) {
  const bundle = decodeCanonicalCbor(bytes);
  if (bundle.format !== BUNDLE_FORMAT || bundle.version !== 1) {
    throw new ProofBundleError(Verdict.MALFORMED, 'unsupported signed ProofBundle envelope');
  }
  return bundle;
}

export function manifestSummary(manifestBytes) {
  const manifest = decodeManifest(manifestBytes);
  return Object.freeze({
    profileId: manifest.profileId,
    createdAt: manifest.createdAt,
    entryCount: manifest.entries?.length,
    declaredBytes: manifest.entries?.reduce((sum, entry) => sum + entry.byteLength, 0),
    merkleRootBase64url: toBase64url(manifest.integrity?.merkleRoot ?? new Uint8Array(0)),
  });
}

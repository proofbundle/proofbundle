import { asBytes, compareBytes, equalBytes, utf8 } from './bytes.mjs';
import { encodeCanonicalCbor } from './canonical-cbor.mjs';
import { asVerificationFailure, ProofBundleError, Verdict } from './errors.mjs';
import { digest, digestSet } from './hashes.mjs';
import {
  assertCanonicalPath,
  assertCanonicalTimestamp,
  decodeManifest,
  decodeSignedBundle,
} from './manifest.mjs';
import { contentId } from './multiformats.mjs';
import { getAlgorithm, getProfile } from './registry.mjs';
import { keyIdFromPublicKey, verifyDetached } from './signatures.mjs';
import { merkleRoot } from './structures.mjs';
import { evaluateTimestampPolicy } from './timestamp.mjs';

export const DEFAULT_LIMITS = Object.freeze({
  maxBundleBytes: 32 * 1024 * 1024,
  maxManifestBytes: 16 * 1024 * 1024,
  maxEntries: 100_000,
  maxDeclaredBytes: 1024 * 1024 * 1024 * 1024,
  maxPathBytes: 4096,
  maxMetadataBytes: 4 * 1024 * 1024,
});

function exactDigestList(profile, entry) {
  if (!Array.isArray(entry.digests) || entry.digests.length !== profile.digests.length) {
    throw new ProofBundleError(Verdict.MALFORMED, `wrong digest count for ${entry.path}`);
  }
  for (let index = 0; index < profile.digests.length; index += 1) {
    const expectedId = profile.digests[index];
    const supplied = entry.digests[index];
    if (supplied.algorithmId !== expectedId) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        `digest ${index} for ${entry.path} must be ${expectedId}`,
      );
    }
    const algorithm = getAlgorithm(expectedId, { kind: 'hash' });
    const value = asBytes(supplied.value, `digest for ${entry.path}`);
    if (value.byteLength !== algorithm.outputLength) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        `digest length for ${entry.path} conflicts with ${expectedId}`,
      );
    }
  }
}

function payloadLookup(payloads, path) {
  if (payloads instanceof Map) return payloads.get(path);
  if (payloads && typeof payloads === 'object') return payloads[path];
  return undefined;
}

function validateManifestStructure(manifestBytes, limits) {
  if (manifestBytes.byteLength > limits.maxManifestBytes) {
    throw new ProofBundleError(Verdict.RESOURCE_EXHAUSTED, 'manifest exceeds byte limit');
  }
  const manifest = decodeManifest(manifestBytes);
  const profile = getProfile(manifest.profileId);
  assertCanonicalTimestamp(manifest.createdAt);
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    throw new ProofBundleError(Verdict.MALFORMED, 'manifest entries must be non-empty');
  }
  if (manifest.entries.length > limits.maxEntries) {
    throw new ProofBundleError(Verdict.RESOURCE_EXHAUSTED, 'manifest entry count exceeds limit');
  }
  let declaredBytes = 0;
  let previousPath;
  for (const entry of manifest.entries) {
    assertCanonicalPath(entry.path);
    if (utf8(entry.path).byteLength > limits.maxPathBytes) {
      throw new ProofBundleError(Verdict.RESOURCE_EXHAUSTED, `path is too long: ${entry.path}`);
    }
    if (
      previousPath !== undefined &&
      compareBytes(utf8(previousPath), utf8(entry.path)) >= 0
    ) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        'manifest paths are duplicated or not in canonical order',
      );
    }
    previousPath = entry.path;
    if (!Number.isSafeInteger(entry.byteLength) || entry.byteLength < 0) {
      throw new ProofBundleError(Verdict.MALFORMED, `invalid byte length for ${entry.path}`);
    }
    declaredBytes += entry.byteLength;
    if (declaredBytes > limits.maxDeclaredBytes) {
      throw new ProofBundleError(Verdict.RESOURCE_EXHAUSTED, 'declared payload bytes exceed limit');
    }
    exactDigestList(profile, entry);
  }
  if (
    !manifest.integrity ||
    manifest.integrity.merkleAlgorithmId !== profile.merkle ||
    !equalBytes(
      merkleRoot(manifest.entries.map(encodeCanonicalCbor), profile.merkle),
      manifest.integrity.merkleRoot,
    )
  ) {
    throw new ProofBundleError(Verdict.DIGEST_MISMATCH, 'manifest Merkle commitment mismatch');
  }
  const metadataSize = encodeCanonicalCbor(manifest.metadata ?? {}).byteLength;
  if (metadataSize > limits.maxMetadataBytes) {
    throw new ProofBundleError(Verdict.RESOURCE_EXHAUSTED, 'manifest metadata exceeds limit');
  }
  if (
    !Array.isArray(manifest.parentBundles) ||
    new Set(manifest.parentBundles).size !== manifest.parentBundles.length ||
    manifest.parentBundles.some(
      (cid, index) =>
        typeof cid !== 'string' || (index > 0 && cid <= manifest.parentBundles[index - 1]),
    )
  ) {
    throw new ProofBundleError(Verdict.LINEAGE_INVALID, 'invalid parent bundle list');
  }
  return { manifest, profile, declaredBytes };
}

function validateVerificationKeys(bundle, profile) {
  if (!Array.isArray(bundle.verificationKeys)) {
    throw new ProofBundleError(Verdict.MISSING_SIDE_INFO, 'verification keys are absent');
  }
  const signatureSuite = getAlgorithm(profile.signature);
  const components =
    signatureSuite.kind === 'hybrid-signature' ? signatureSuite.components : [signatureSuite.id];
  if (bundle.verificationKeys.length !== components.length) {
    throw new ProofBundleError(Verdict.MISSING_SIDE_INFO, 'verification key count is wrong');
  }
  for (let index = 0; index < components.length; index += 1) {
    const key = bundle.verificationKeys[index];
    if (
      key.algorithmId !== components[index] ||
      keyIdFromPublicKey(key.publicKeyDer) !== key.keyId
    ) {
      throw new ProofBundleError(Verdict.MALFORMED, `verification key ${index} is inconsistent`);
    }
  }
  return bundle.verificationKeys;
}

function verifyPayloads(manifest, profile, payloads) {
  if (payloads === undefined) {
    return { complete: false, checks: [], missing: manifest.entries.map(({ path }) => path) };
  }
  const checks = [];
  const missing = [];
  for (const entry of manifest.entries) {
    const supplied = payloadLookup(payloads, entry.path);
    if (supplied === undefined) {
      missing.push(entry.path);
      continue;
    }
    const bytes = asBytes(supplied, `payload ${entry.path}`);
    if (bytes.byteLength !== entry.byteLength) {
      throw new ProofBundleError(
        Verdict.DIGEST_MISMATCH,
        `payload length mismatch for ${entry.path}`,
      );
    }
    const computed = digestSet(profile.digests, bytes);
    const ok = computed.every((item, index) => equalBytes(item.value, entry.digests[index].value));
    if (!ok) {
      throw new ProofBundleError(Verdict.DIGEST_MISMATCH, `payload digest mismatch for ${entry.path}`);
    }
    checks.push(Object.freeze({ path: entry.path, ok: true }));
  }
  return { complete: missing.length === 0, checks, missing };
}

export function verifyBundle(bundleOrBytes, options = {}) {
  try {
    const limits = Object.freeze({ ...DEFAULT_LIMITS, ...(options.limits ?? {}) });
    const bundle =
      bundleOrBytes instanceof Uint8Array ||
      bundleOrBytes instanceof ArrayBuffer ||
      ArrayBuffer.isView(bundleOrBytes)
        ? (() => {
            const bytes = asBytes(bundleOrBytes, 'bundle');
            if (bytes.byteLength > limits.maxBundleBytes) {
              throw new ProofBundleError(Verdict.RESOURCE_EXHAUSTED, 'bundle exceeds byte limit');
            }
            return decodeSignedBundle(bytes);
          })()
        : bundleOrBytes;
    if (!bundle || bundle.format !== 'ProofBundle-Signed-Bundle' || bundle.version !== 1) {
      throw new ProofBundleError(Verdict.MALFORMED, 'invalid signed bundle structure');
    }
    const manifestBytes = asBytes(bundle.manifest, 'manifest');
    const { manifest, profile, declaredBytes } = validateManifestStructure(manifestBytes, limits);
    if (bundle.signature?.suiteId !== profile.signature) {
      throw new ProofBundleError(
        Verdict.POLICY_DENIED,
        'signature suite does not match the manifest profile',
      );
    }
    const keys = options.verificationKeys ?? validateVerificationKeys(bundle, profile);
    const signature = verifyDetached(bundle.signature, keys, manifestBytes);
    if (!signature.ok) {
      throw new ProofBundleError(
        signature.verdict,
        signature.message ?? 'signature verification failed',
        { componentResults: signature.componentResults },
      );
    }
    const manifestCid = contentId(manifestBytes, {
      hashId: 'pb.hash.sha2-256.v1',
      codec: 'dag-cbor',
      base: 'base32',
    });
    const payload = verifyPayloads(manifest, profile, options.payloads);
    const timestampEvidenceItems = Array.isArray(bundle.timestamps) ? bundle.timestamps.length : 0;
    let timestampPolicy = Object.freeze({
      ok: false,
      verdict: Verdict.NOT_DEFINED,
      status: 'not-evaluated',
      rawEvidenceItems: timestampEvidenceItems,
    });
    if (options.timestampResults !== undefined || options.requireTimestampEvidence === true) {
      if (options.timestampResults === undefined) {
        throw new ProofBundleError(
          Verdict.MISSING_SIDE_INFO,
          'validated timestamp results are required; raw evidence bytes are not verification',
        );
      }
      timestampPolicy = evaluateTimestampPolicy(options.timestampResults, {
        minimumIndependentEvidence:
          options.minimumIndependentTimestampEvidence ??
          profile.timestampPolicy?.minimumIndependentEvidence ??
          1,
      });
      if (!timestampPolicy.ok && options.requireTimestampEvidence === true) {
        throw new ProofBundleError(
          timestampPolicy.verdict,
          'timestamp evidence policy was not satisfied',
          { timestampPolicy },
        );
      }
    }
    if (!payload.complete) {
      return Object.freeze({
        ok: false,
        verdict: Verdict.MISSING_SIDE_INFO,
        verifiedScope: 'manifest-signature-and-structure',
        manifestCid,
        profileId: profile.id,
        entryCount: manifest.entries.length,
        declaredBytes,
        missingPayloads: payload.missing,
        signature,
        timestampEvidenceItems,
        timestampPolicy,
      });
    }
    return Object.freeze({
      ok: true,
      verdict: Verdict.VERIFIED,
      verifiedScope: 'manifest-signature-structure-and-payloads',
      manifestCid,
      profileId: profile.id,
      entryCount: manifest.entries.length,
      declaredBytes,
      payloadChecks: payload.checks,
      signature,
      timestampEvidenceItems,
      timestampPolicy,
    });
  } catch (error) {
    return asVerificationFailure(error);
  }
}

export function verifyLineageGraph(bundlesByCid) {
  try {
    const records =
      bundlesByCid instanceof Map ? [...bundlesByCid.entries()] : Object.entries(bundlesByCid ?? {});
    const parents = new Map();
    for (const [claimedCid, bundleValue] of records) {
      const bundle =
        bundleValue instanceof Uint8Array ? decodeSignedBundle(bundleValue) : bundleValue;
      const manifestBytes = asBytes(bundle.manifest, 'lineage manifest');
      const actualCid = contentId(manifestBytes, {
        hashId: 'pb.hash.sha2-256.v1',
        codec: 'dag-cbor',
        base: 'base32',
      });
      if (actualCid !== claimedCid) {
        throw new ProofBundleError(Verdict.LINEAGE_INVALID, `lineage CID mismatch: ${claimedCid}`);
      }
      const manifest = decodeManifest(manifestBytes);
      parents.set(claimedCid, manifest.parentBundles);
    }
    for (const [cid, values] of parents) {
      for (const parent of values) {
        if (!parents.has(parent)) {
          throw new ProofBundleError(
            Verdict.MISSING_SIDE_INFO,
            `lineage parent ${parent} required by ${cid} is absent`,
          );
        }
      }
    }
    const state = new Map();
    const visit = (cid) => {
      if (state.get(cid) === 'visiting') {
        throw new ProofBundleError(Verdict.LINEAGE_INVALID, `lineage cycle at ${cid}`);
      }
      if (state.get(cid) === 'done') return;
      state.set(cid, 'visiting');
      for (const parent of parents.get(cid)) visit(parent);
      state.set(cid, 'done');
    };
    for (const cid of [...parents.keys()].sort()) visit(cid);
    return Object.freeze({ ok: true, verdict: Verdict.VERIFIED, bundleCount: parents.size });
  } catch (error) {
    return asVerificationFailure(error);
  }
}

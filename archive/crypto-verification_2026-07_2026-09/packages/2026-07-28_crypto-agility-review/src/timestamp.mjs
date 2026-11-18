import { spawnSync } from 'node:child_process';
import { isAbsolute } from 'node:path';
import { asBytes, concatBytes } from './bytes.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';
import { digest } from './hashes.mjs';
import { getAlgorithm } from './registry.mjs';

const RFC3161_HASH_OIDS = Object.freeze({
  'pb.hash.sha2-256.v1': '2.16.840.1.101.3.4.2.1',
  'pb.hash.sha2-384.v1': '2.16.840.1.101.3.4.2.2',
  'pb.hash.sha2-512.v1': '2.16.840.1.101.3.4.2.3',
  'pb.hash.sha3-256.v1': '2.16.840.1.101.3.4.2.8',
  'pb.hash.sha3-384.v1': '2.16.840.1.101.3.4.2.9',
  'pb.hash.sha3-512.v1': '2.16.840.1.101.3.4.2.10',
});

function derLength(length) {
  if (!Number.isSafeInteger(length) || length < 0) {
    throw new ProofBundleError(Verdict.OUT_OF_BOUNDS, 'invalid DER length');
  }
  if (length < 128) return Uint8Array.of(length);
  const bytes = [];
  for (let value = length; value > 0; value = Math.floor(value / 256)) {
    bytes.unshift(value & 0xff);
  }
  return Uint8Array.of(0x80 | bytes.length, ...bytes);
}

function der(tag, content) {
  const body = asBytes(content, 'DER content');
  return concatBytes(Uint8Array.of(tag), derLength(body.byteLength), body);
}

function base128(value) {
  const bytes = [value & 0x7f];
  for (let rest = Math.floor(value / 128); rest > 0; rest = Math.floor(rest / 128)) {
    bytes.unshift(0x80 | (rest & 0x7f));
  }
  return bytes;
}

function derOid(value) {
  if (typeof value !== 'string' || !/^\d+(?:\.\d+)+$/.test(value)) {
    throw new ProofBundleError(Verdict.MALFORMED, 'invalid object identifier');
  }
  const arcs = value.split('.').map(Number);
  if (
    arcs.some((arc) => !Number.isSafeInteger(arc) || arc < 0) ||
    arcs[0] > 2 ||
    (arcs[0] < 2 && arcs[1] > 39)
  ) {
    throw new ProofBundleError(Verdict.MALFORMED, 'invalid object identifier arcs');
  }
  return der(
    0x06,
    Uint8Array.from([
      ...base128(arcs[0] * 40 + arcs[1]),
      ...arcs.slice(2).flatMap(base128),
    ]),
  );
}

function unsignedIntegerBytes(value) {
  let bytes;
  if (typeof value === 'bigint') {
    if (value < 0n) throw new ProofBundleError(Verdict.OUT_OF_BOUNDS, 'nonce must be positive');
    let hex = value.toString(16);
    if (hex.length % 2) hex = `0${hex}`;
    bytes = Uint8Array.from(Buffer.from(hex || '00', 'hex'));
  } else {
    bytes = Uint8Array.from(asBytes(value, 'timestamp nonce'));
  }
  let first = 0;
  while (first < bytes.length - 1 && bytes[first] === 0) first += 1;
  bytes = bytes.subarray(first);
  return bytes[0] & 0x80 ? concatBytes(Uint8Array.of(0), bytes) : bytes;
}

export function createRfc3161Request({
  hashAlgorithmId,
  messageImprint,
  nonce,
  certReq = true,
  policyOid,
}) {
  const algorithm = getAlgorithm(hashAlgorithmId, { kind: 'hash' });
  const oid = RFC3161_HASH_OIDS[hashAlgorithmId];
  if (!oid) {
    throw new ProofBundleError(
      Verdict.UNSUPPORTED_ALGORITHM,
      `${hashAlgorithmId} is not enabled for RFC 3161 requests`,
    );
  }
  const imprint = asBytes(messageImprint, 'timestamp message imprint');
  if (imprint.byteLength !== algorithm.outputLength) {
    throw new ProofBundleError(
      Verdict.OUT_OF_BOUNDS,
      `message imprint must be ${algorithm.outputLength} bytes`,
    );
  }
  const algorithmIdentifier = der(0x30, concatBytes(derOid(oid), der(0x05, new Uint8Array(0))));
  const fields = [
    der(0x02, Uint8Array.of(1)),
    der(0x30, concatBytes(algorithmIdentifier, der(0x04, imprint))),
  ];
  if (policyOid !== undefined) fields.push(derOid(policyOid));
  if (nonce !== undefined) fields.push(der(0x02, unsignedIntegerBytes(nonce)));
  if (certReq === true) fields.push(der(0x01, Uint8Array.of(0xff)));
  if (certReq !== true && certReq !== false) {
    throw new ProofBundleError(Verdict.MALFORMED, 'certReq must be a boolean');
  }
  return der(0x30, concatBytes(...fields));
}

export function createRfc3161RequestForMessage(message, options = {}) {
  const hashAlgorithmId = options.hashAlgorithmId ?? 'pb.hash.sha2-256.v1';
  return createRfc3161Request({
    ...options,
    hashAlgorithmId,
    messageImprint: digest(hashAlgorithmId, asBytes(message, 'timestamped message')),
  });
}

function absolutePath(value, label) {
  if (typeof value !== 'string' || !isAbsolute(value)) {
    throw new ProofBundleError(Verdict.MALFORMED, `${label} must be an absolute path`);
  }
  return value;
}

function runVerifier(command, args, timeout) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
  });
  return Object.freeze({
    verified: result.status === 0,
    command,
    exitCode: result.status,
    signal: result.signal,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
    error: result.error?.message,
  });
}

/**
 * Delegates CMS path validation and imprint verification to OpenSSL. A CA file
 * is mandatory; accepting a timestamp token without a trust anchor is not
 * exposed as an option.
 */
export function verifyRfc3161WithOpenSsl({
  responsePath,
  dataPath,
  caFile,
  untrustedFile,
  openssl = 'openssl',
  timeout = 30_000,
}) {
  const args = [
    'ts',
    '-verify',
    '-in',
    absolutePath(responsePath, 'RFC 3161 response'),
    '-data',
    absolutePath(dataPath, 'timestamped data'),
    '-CAfile',
    absolutePath(caFile, 'TSA trust anchor file'),
  ];
  if (untrustedFile !== undefined) {
    args.push('-untrusted', absolutePath(untrustedFile, 'untrusted certificate file'));
  }
  return runVerifier(openssl, args, timeout);
}

export function verifyOpenTimestampsWithCli({
  proofPath,
  ots = 'ots',
  timeout = 60_000,
}) {
  return runVerifier(ots, ['verify', absolutePath(proofPath, 'OpenTimestamps proof')], timeout);
}

export function evaluateTimestampPolicy(results, options = {}) {
  if (!Array.isArray(results)) {
    throw new ProofBundleError(Verdict.MALFORMED, 'timestamp results must be an array');
  }
  const minimumIndependentEvidence = options.minimumIndependentEvidence ?? 1;
  if (!Number.isSafeInteger(minimumIndependentEvidence) || minimumIndependentEvidence < 0) {
    throw new ProofBundleError(Verdict.OUT_OF_BOUNDS, 'invalid timestamp evidence threshold');
  }
  const verified = results.filter(
    (result) =>
      result?.verified === true &&
      typeof result.authorityId === 'string' &&
      result.authorityId.length > 0,
  );
  const authorities = [...new Set(verified.map(({ authorityId }) => authorityId))].sort();
  const ok = authorities.length >= minimumIndependentEvidence;
  return Object.freeze({
    ok,
    verdict: ok ? Verdict.VERIFIED : Verdict.MISSING_SIDE_INFO,
    verifiedAuthorities: authorities,
    requiredIndependentEvidence: minimumIndependentEvidence,
  });
}

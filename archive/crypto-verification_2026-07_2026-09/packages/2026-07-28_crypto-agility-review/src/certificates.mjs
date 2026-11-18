import { X509Certificate } from 'node:crypto';
import { asBytes, toBase64url } from './bytes.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';
import { digest } from './hashes.mjs';
import { keyIdFromPublicKey } from './signatures.mjs';

function parseCertificate(value) {
  try {
    return new X509Certificate(
      typeof value === 'string' ? value : Buffer.from(asBytes(value, 'X.509 certificate')),
    );
  } catch (error) {
    throw new ProofBundleError(Verdict.MALFORMED, 'invalid X.509 certificate', undefined, {
      cause: error,
    });
  }
}

function isoDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString();
}

export function inspectX509Certificate(certificate) {
  const parsed = parseCertificate(certificate);
  const publicKeyDer = new Uint8Array(parsed.publicKey.export({ format: 'der', type: 'spki' }));
  return Object.freeze({
    subject: parsed.subject,
    issuer: parsed.issuer,
    serialNumber: parsed.serialNumber,
    validFrom: isoDate(parsed.validFrom),
    validTo: isoDate(parsed.validTo),
    keyId: keyIdFromPublicKey(publicKeyDer),
    sha256Fingerprint: toBase64url(
      digest('pb.hash.sha2-256.v1', new Uint8Array(parsed.raw)),
    ),
    publicKeyDer,
    ca: parsed.ca,
    keyUsage: parsed.keyUsage ?? [],
    subjectAltName: parsed.subjectAltName,
    authorityInfoAccess: parsed.infoAccess,
  });
}

export function verifyDirectCertificateIssuer(certificate, issuerCertificate) {
  try {
    const subject = parseCertificate(certificate);
    const issuer = parseCertificate(issuerCertificate);
    const ok = subject.checkIssued(issuer) && subject.verify(issuer.publicKey);
    return Object.freeze({
      ok,
      verdict: ok ? Verdict.VERIFIED : Verdict.INVALID_SIGNATURE,
      scope: 'direct-certificate-signature-and-name-link-only',
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      verdict: error instanceof ProofBundleError ? error.code : Verdict.INDETERMINATE,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export function checkCertificateValidityAt(certificate, instant) {
  const parsed = parseCertificate(certificate);
  const time = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(time.valueOf())) {
    throw new ProofBundleError(Verdict.MALFORMED, 'certificate evaluation instant is invalid');
  }
  const validFrom = new Date(parsed.validFrom);
  const validTo = new Date(parsed.validTo);
  const ok = validFrom <= time && time <= validTo;
  return Object.freeze({
    ok,
    verdict: ok ? Verdict.VERIFIED : Verdict.POLICY_DENIED,
    scope: 'certificate-validity-window-only',
    evaluatedAt: time.toISOString(),
  });
}

export const CERTIFICATE_VALIDATION_BOUNDARY = Object.freeze({
  implemented: [
    'DER/PEM parsing',
    'SPKI key identifier derivation',
    'certificate SHA-256 fingerprint',
    'validity-window check',
    'direct issuer-name and signature check',
  ],
  externalAdapterRequired: [
    'full X.509 path construction and policy processing',
    'OCSP',
    'CRL distribution and freshness policy',
    'certificate transparency inclusion/consistency',
    'qualified-signature or jurisdiction-specific trust-list policy',
  ],
});

export class ExternalCertificateValidator {
  constructor(validate) {
    if (typeof validate !== 'function') {
      throw new ProofBundleError(Verdict.MALFORMED, 'certificate validator callback is required');
    }
    this.validate = validate;
  }

  async verify(input, policy) {
    const result = await this.validate(input, policy);
    if (
      !result ||
      typeof result.ok !== 'boolean' ||
      typeof result.verdict !== 'string' ||
      typeof result.validatorId !== 'string'
    ) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        'external certificate validator returned an invalid result',
      );
    }
    return Object.freeze({ ...result });
  }
}

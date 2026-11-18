import { asBytes } from './bytes.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';

export const CONTAINER_FORMATS = Object.freeze({
  'pb.container.cms-signed-data.v1': Object.freeze({
    id: 'pb.container.cms-signed-data.v1',
    standard: 'RFC 5652',
    status: 'external-adapter-required',
  }),
  'pb.container.cades-baseline.v1': Object.freeze({
    id: 'pb.container.cades-baseline.v1',
    standard: 'ETSI EN 319 122',
    status: 'external-adapter-required',
  }),
  'pb.container.cose-sign1.v1': Object.freeze({
    id: 'pb.container.cose-sign1.v1',
    standard: 'RFC 9052',
    status: 'external-adapter-required',
  }),
  'pb.container.jws.v1': Object.freeze({
    id: 'pb.container.jws.v1',
    standard: 'RFC 7515',
    status: 'external-adapter-required',
  }),
});

/**
 * A fail-closed bridge to a separately reviewed CMS/CAdES/COSE/JWS stack.
 * ProofBundle does not guess algorithm mappings or trust policy for these
 * formats. The adapter must report the exact payload and protected bytes that
 * its implementation verified.
 */
export class ExternalContainerVerifier {
  constructor({ formatId, implementationId, verify }) {
    if (!Object.hasOwn(CONTAINER_FORMATS, formatId)) {
      throw new ProofBundleError(Verdict.UNKNOWN_ALGORITHM, `unknown container: ${formatId}`);
    }
    if (typeof implementationId !== 'string' || implementationId.length === 0) {
      throw new ProofBundleError(Verdict.MALFORMED, 'container implementationId is required');
    }
    if (typeof verify !== 'function') {
      throw new ProofBundleError(Verdict.MALFORMED, 'container verify callback is required');
    }
    this.formatId = formatId;
    this.implementationId = implementationId;
    this.#verify = verify;
  }

  #verify;

  async verify(containerBytes, options = {}) {
    const result = await this.#verify(asBytes(containerBytes, 'signed container'), options);
    if (
      !result ||
      typeof result.ok !== 'boolean' ||
      typeof result.verdict !== 'string' ||
      !(result.payload instanceof Uint8Array) ||
      !(result.protectedBytes instanceof Uint8Array)
    ) {
      throw new ProofBundleError(
        Verdict.MALFORMED,
        'container adapter result must identify verified payload and protected bytes',
      );
    }
    return Object.freeze({
      ...result,
      formatId: this.formatId,
      implementationId: this.implementationId,
      payload: Uint8Array.from(result.payload),
      protectedBytes: Uint8Array.from(result.protectedBytes),
    });
  }
}

export function requireContainerAdapter(formatId) {
  const format = CONTAINER_FORMATS[formatId];
  if (!format) {
    throw new ProofBundleError(Verdict.UNKNOWN_ALGORITHM, `unknown container: ${formatId}`);
  }
  throw new ProofBundleError(
    Verdict.UNSUPPORTED_ALGORITHM,
    `${formatId} requires an explicitly configured external verifier`,
    { standard: format.standard },
  );
}

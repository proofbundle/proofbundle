// Stable key identifiers.
//
// A key id is SHA-256 over a domain-separated transcript of (algorithm id,
// SPKI public key bytes), hex-encoded. Two consequences that are tested:
//
//   - The algorithm id is *inside* the id. The same public key bytes under
//     two different algorithm ids produce two different key ids, so a key id
//     can never be reused across key types.
//   - The id is derived from the public key only. It never depends on the
//     private key, so computing it does not require, and cannot leak, secret
//     material.

import { digestBytes } from '../digest/digest.mjs';
import { bytesToHex } from '../encoding/hex.mjs';
import { buildTranscript, DOMAIN_TAGS } from '../canonical/transcript.mjs';

export const KEY_ID_DIGEST = 'SHA-256';

export function computeKeyId(algId, spkiPublicKeyBytes) {
  if (typeof algId !== 'string' || algId.length === 0) throw new TypeError('computeKeyId: algId must be a non-empty string');
  if (!(spkiPublicKeyBytes instanceof Uint8Array)) throw new TypeError('computeKeyId: public key must be Uint8Array (SPKI DER)');
  const transcript = buildTranscript(DOMAIN_TAGS.KEY_IDENTIFIER, [algId, spkiPublicKeyBytes]);
  return bytesToHex(digestBytes(KEY_ID_DIGEST, transcript));
}

// A signer id is an application-level identity that may own several keys.
// Threshold counting is over signer ids, never key ids — that distinction is
// what makes "one signer with three keys" fail to satisfy a 3-of-N policy.
export function makeSignerId(name) {
  if (typeof name !== 'string' || name.length === 0) throw new TypeError('makeSignerId: name must be a non-empty string');
  return name;
}

// ProofBundle domain-separated subkey derivation.
//
// The point of this module is that `info` is never a caller-supplied string.
// It is always a transcript built by src/canonical/transcript.mjs under the
// SUBKEY_DERIVATION tag, with the purpose, the key id, and the index as
// separate length-prefixed fields. Two different (purpose, keyId, index)
// triples therefore cannot produce the same HKDF info — which is the property
// that stops one subkey from standing in for another.

import { hkdf } from './hkdf.mjs';
import { buildTranscript, DOMAIN_TAGS } from '../canonical/transcript.mjs';
import { encodeVarint } from '../bytes/varint.mjs';

export const SUBKEY_ID = 'ProofBundle-subkey-derivation';

export const SUBKEY_PURPOSES = Object.freeze([
  'content-encryption',
  'header-authentication',
  'log-record-mac',
  'disclosure-salt',
  'recipient-wrap',
]);

const PURPOSE_SET = new Set(SUBKEY_PURPOSES);

export function deriveSubkey({ masterKey, purpose, keyId = '', index = 0, length = 32, kdfAlg = 'HKDF-SHA-256', salt = null }) {
  if (!(masterKey instanceof Uint8Array)) throw new TypeError('deriveSubkey: masterKey must be Uint8Array');
  if (!PURPOSE_SET.has(purpose)) throw new RangeError(`deriveSubkey: unregistered purpose ${JSON.stringify(purpose)}`);
  if (!Number.isInteger(index) || index < 0) throw new RangeError('deriveSubkey: index must be a non-negative integer');
  const info = buildTranscript(DOMAIN_TAGS.SUBKEY_DERIVATION, [purpose, keyId, encodeVarint(index)]);
  return hkdf(kdfAlg, { salt, ikm: masterKey, info, length });
}

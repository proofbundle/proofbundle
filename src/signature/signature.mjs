// The signature dispatcher.
//
// Three structural properties, each of which has a test that would fail if the
// property were removed:
//
//   1. Dispatch is by the authenticated algorithm identifier alone. The
//      caller's key object never selects the algorithm, so a P-256 key
//      presented under the id "Ed25519" is a hard error, not a
//      reinterpretation.
//   2. There is no fallback. An unknown id throws UNKNOWN_ALGORITHM; a known
//      but unwired id throws UNSUPPORTED_ALGORITHM. Neither ever proceeds.
//   3. Verify-only algorithms cannot sign. `sign` consults GENERATION_ALLOWED
//      and refuses, so RSA-PKCS1v1.5 material can be checked forever and
//      never minted.
//
// What this module does NOT establish: that a valid signature makes the signed
// statement true, or that the key belonged to who you think. Those are
// ASSUMPTION-SIGNATURE-CORRECTNESS and an attribution question respectively,
// both recorded in ASSUMPTIONS.md.

import { createSign, createVerify, sign as nodeSign, verify as nodeVerify, createPublicKey, createPrivateKey, constants as cryptoConstants } from 'node:crypto';
import { UnknownAlgorithmError, UnsupportedAlgorithmError, GenerationProhibitedError } from '../errors.mjs';
import { buildTranscript, DOMAIN_TAGS } from '../canonical/transcript.mjs';

// id -> how node must be driven for it.
//   kind 'eddsa'  : one-shot sign/verify with a null digest
//   kind 'digest' : createSign/createVerify with a named digest
//   kind 'pss'    : as 'digest' plus PSS padding options
const TABLE = new Map([
  ['Ed25519', { kind: 'eddsa', digest: null, keyType: 'ed25519' }],
  ['Ed448', { kind: 'eddsa', digest: null, keyType: 'ed448' }],
  ['ECDSA-P-256-SHA-256', { kind: 'digest', digest: 'sha256', keyType: 'ec', curve: 'prime256v1', dsaEncoding: 'der' }],
  ['ECDSA-P-384-SHA-384', { kind: 'digest', digest: 'sha384', keyType: 'ec', curve: 'secp384r1', dsaEncoding: 'der' }],
  ['ECDSA-P-521-SHA-512', { kind: 'digest', digest: 'sha512', keyType: 'ec', curve: 'secp521r1', dsaEncoding: 'der' }],
  ['RSA-PSS-SHA-256', { kind: 'pss', digest: 'sha256', keyType: 'rsa', saltLength: 32 }],
  ['RSA-PSS-SHA-384', { kind: 'pss', digest: 'sha384', keyType: 'rsa', saltLength: 48 }],
  ['RSA-PSS-SHA-512', { kind: 'pss', digest: 'sha512', keyType: 'rsa', saltLength: 64 }],
  ['RSA-PKCS1v1.5', { kind: 'digest', digest: 'sha256', keyType: 'rsa' }],
]);

// LEGACY_VERIFY_ONLY: present for historical verification, never for minting.
const GENERATION_ALLOWED = new Set([
  'Ed25519', 'Ed448',
  'ECDSA-P-256-SHA-256', 'ECDSA-P-384-SHA-384', 'ECDSA-P-521-SHA-512',
  'RSA-PSS-SHA-256', 'RSA-PSS-SHA-384', 'RSA-PSS-SHA-512',
]);

// Registered in ALGORITHM_REGISTRY.json but with no implementation in this
// build. Kept as a distinct set so the error says "not built" rather than
// "never heard of it" — the two are different facts for an auditor.
const REGISTERED_UNWIRED = new Set([
  'ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87',
  'SLH-DSA-SHA2-128s', 'SLH-DSA-SHA2-128f', 'SLH-DSA-SHA2-192s', 'SLH-DSA-SHA2-192f',
  'SLH-DSA-SHA2-256s', 'SLH-DSA-SHA2-256f',
  'SLH-DSA-SHAKE-128s', 'SLH-DSA-SHAKE-128f', 'SLH-DSA-SHAKE-192s', 'SLH-DSA-SHAKE-192f',
  'SLH-DSA-SHAKE-256s', 'SLH-DSA-SHAKE-256f',
]);

export function isImplementedSignature(algId) { return TABLE.has(algId); }
export function canGenerate(algId) { return GENERATION_ALLOWED.has(algId); }
export function signatureAlgorithms() { return [...TABLE.keys()]; }

function spec(algId) {
  const s = TABLE.get(algId);
  if (s) return s;
  if (REGISTERED_UNWIRED.has(algId)) throw new UnsupportedAlgorithmError(algId, 'signature.implemented');
  throw new UnknownAlgorithmError(algId, 'signature.algorithmKnown');
}

// The key object's own type must match what the algorithm id demands. This is
// the check that makes cross-key-type reinterpretation impossible rather than
// merely discouraged.
function assertKeyTypeMatches(algId, keyObject, s) {
  const actual = keyObject.asymmetricKeyType;
  const expected = s.keyType;
  const ok = expected === 'rsa' ? (actual === 'rsa' || actual === 'rsa-pss') : actual === expected;
  if (!ok) {
    throw new UnsupportedAlgorithmError(algId, 'signature.keyTypeMatchesAlgorithm');
  }
  if (s.curve) {
    const curve = keyObject.asymmetricKeyDetails?.namedCurve;
    if (curve && curve !== s.curve) throw new UnsupportedAlgorithmError(algId, 'signature.curveMatchesAlgorithm');
  }
}

// The signed transcript. Every signature in this project covers the algorithm
// id and key id alongside the message, so a signature made under one
// algorithm/key cannot be replayed as a signature under another — the bytes
// that were signed differ.
export function signatureTranscript({ algId, keyId, message }) {
  if (!(message instanceof Uint8Array)) throw new TypeError('signatureTranscript: message must be Uint8Array');
  return buildTranscript(DOMAIN_TAGS.SIGNATURE_TRANSCRIPT, [algId, keyId ?? '', message]);
}

export function signBytes(algId, privateKey, message, { keyId = '' } = {}) {
  const s = spec(algId);
  if (!GENERATION_ALLOWED.has(algId)) throw new GenerationProhibitedError(algId);
  const key = privateKey instanceof Uint8Array ? createPrivateKey({ key: Buffer.from(privateKey), format: 'der', type: 'pkcs8' }) : privateKey;
  assertKeyTypeMatches(algId, key, s);
  const transcript = signatureTranscript({ algId, keyId, message });
  if (s.kind === 'eddsa') {
    return new Uint8Array(nodeSign(null, transcript, key));
  }
  const signer = createSign(s.digest);
  signer.update(transcript);
  const opts = s.kind === 'pss'
    ? { key, padding: cryptoConstants.RSA_PKCS1_PSS_PADDING, saltLength: s.saltLength }
    : (s.dsaEncoding ? { key, dsaEncoding: s.dsaEncoding } : { key });
  return new Uint8Array(signer.sign(opts));
}

// Returns boolean. Turning `false` into INVALID_SIGNATURE is the verifier
// layer's job, so this stays a primitive.
export function verifyBytes(algId, publicKey, message, signature, { keyId = '' } = {}) {
  const s = spec(algId);
  if (!(signature instanceof Uint8Array)) throw new TypeError('verifyBytes: signature must be Uint8Array');
  const key = publicKey instanceof Uint8Array ? createPublicKey({ key: Buffer.from(publicKey), format: 'der', type: 'spki' }) : publicKey;
  assertKeyTypeMatches(algId, key, s);
  const transcript = signatureTranscript({ algId, keyId, message });
  try {
    if (s.kind === 'eddsa') return nodeVerify(null, transcript, key, signature);
    const verifier = createVerify(s.digest);
    verifier.update(transcript);
    const opts = s.kind === 'pss'
      ? { key, padding: cryptoConstants.RSA_PKCS1_PSS_PADDING, saltLength: s.saltLength }
      : (s.dsaEncoding ? { key, dsaEncoding: s.dsaEncoding } : { key });
    return verifier.verify(opts, signature);
  } catch {
    // A malformed signature encoding is a failed verification, not an
    // exception that escapes into the caller's control flow.
    return false;
  }
}

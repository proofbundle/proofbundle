// Confidential provenance — encrypt a payload to a recipient, keep it verifiable.
//
// The integrity guarantee does not come from the KEM. It comes from the digests
// below, which the existing seal signs. ML-KEM only decides who can read the
// plaintext. That split is what makes two verification tiers possible:
//
//   Tier 1  no key at all      recompute the ciphertext digest and compare.
//                              Proves this is the exact sealed ciphertext,
//                              untampered, without disclosing anything.
//   Tier 2  holds decaps key   decapsulate, decrypt, recompute the plaintext
//                              digest and compare. Proves the content is what
//                              was sealed.
//
// Committing to both digests is what buys tier 1. Sealing only the plaintext
// digest would mean a third party could not check the ciphertext they were
// handed is the one that was signed.
//
// Symmetric layer: SHAKE256 keystream, encrypt-then-MAC. Chosen so the whole
// path depends on keccak.mjs and nothing else — no WebCrypto, no library. See
// the caveat in README before relying on it for anything adversarial.

import { shake256, sha3_256, toHex } from './keccak.mjs';
import { mlkemEncapsulate, mlkemDecapsulate, mlkemKeygen } from './mlkem.mjs';

const PROFILE = 'PB-CONF-1';

const label = (s) => new TextEncoder().encode(`${PROFILE}|${s}|`);

function concat(...arrays) {
  let n = 0;
  for (const a of arrays) n += a.length;
  const out = new Uint8Array(n);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

// Independent subkeys from one KEM secret. Distinct labels keep the keystream
// and the MAC key from ever coinciding.
const streamKey = (ss, nonce) => concat(label('stream'), ss, nonce);
const macKey    = (ss, nonce) => concat(label('mac'), ss, nonce);

// Constant-time comparison — a byte-at-a-time early return would leak the tag.
function equalCT(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

/**
 * Encrypt `payload` to `recipientEncapsKey`.
 * `nonce` must be 16 bytes and must never repeat for a given recipient key.
 * Returns an envelope plus the two digests the caller should seal.
 */
export function confidentialSeal(payload, recipientEncapsKey, nonce, paramSet = 'ML-KEM-768') {
  if (nonce.length !== 16) throw new Error('nonce must be 16 bytes');

  const { sharedSecret, ciphertext: kemCt } = mlkemEncapsulate(recipientEncapsKey, nonce.length === 32 ? nonce : shake256(concat(label('kem-seed'), nonce), 32), paramSet);

  const keystream = shake256(streamKey(sharedSecret, nonce), payload.length);
  const ct = new Uint8Array(payload.length);
  for (let i = 0; i < payload.length; i++) ct[i] = payload[i] ^ keystream[i];

  // Encrypt-then-MAC: the tag covers the ciphertext and the KEM ciphertext, so
  // neither can be swapped for another envelope's.
  const tag = shake256(concat(macKey(sharedSecret, nonce), kemCt, ct), 32);

  return {
    envelope: {
      profile: PROFILE,
      param_set: paramSet,
      kem_ct: kemCt,
      ct,
      nonce,
      tag,
    },
    // Seal these two with the existing signature machinery.
    digest_plaintext: sha3_256(payload),
    digest_ciphertext: sha3_256(ct),
  };
}

/**
 * Tier 1 — no key required. Confirms the envelope is the sealed one.
 */
export function verifyCiphertext(envelope, sealedDigestCiphertext) {
  return equalCT(sha3_256(envelope.ct), sealedDigestCiphertext);
}

/**
 * Tier 2 — requires the decapsulation key. Confirms the content.
 * Throws on a bad tag rather than returning plaintext that failed authentication.
 */
export function confidentialOpen(envelope, decapsKey, sealedDigestPlaintext) {
  const { kem_ct, ct, nonce, tag, param_set } = envelope;
  const sharedSecret = mlkemDecapsulate(decapsKey, kem_ct, param_set || 'ML-KEM-768');

  const expected = shake256(concat(macKey(sharedSecret, nonce), kem_ct, ct), 32);
  if (!equalCT(expected, tag)) throw new Error('authentication failed — envelope tampered or wrong key');

  const keystream = shake256(streamKey(sharedSecret, nonce), ct.length);
  const payload = new Uint8Array(ct.length);
  for (let i = 0; i < ct.length; i++) payload[i] = ct[i] ^ keystream[i];

  const digestOk = sealedDigestPlaintext
    ? equalCT(sha3_256(payload), sealedDigestPlaintext)
    : null;

  return { payload, digestMatchesSeal: digestOk };
}

export { mlkemKeygen, toHex };

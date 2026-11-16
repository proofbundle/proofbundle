// RSA PKCS#1 v1.5 signature verification, from scratch. Verify-only, on purpose:
// this lane has no safe signing path for RSA (padding oracles are the classic
// failure mode), so it does not offer one.
//
// From scratch: no node:crypto, no WebCrypto. Modular exponentiation is BigInt
// square-and-multiply over the public exponent, digests come from the repo's
// own SHA-2 modules.
//
// Spec references:
//   RFC 8017 section 5.2.2  -- RSASSA-PKCS1-v1_5-VERIFY
//   RFC 8017 section 9.2    -- EMSA-PKCS1-v1_5 encoding
//   RFC 8017 section 8.2.2  -- RSAVP1 (the m = s^e mod n step)
//   RFC 8017 section 9.2 note 1 -- the DigestInfo prefixes below
//
// The verification is strict by construction: it does not "find" the digest
// inside the encoded message, it rebuilds the one encoding that is legal and
// compares whole strings. Lenient parsing here is how signature forgeries get
// through.
import { sha256 } from './sha256.mjs';
import { sha384, sha512 } from './sha512.mjs';

// DigestInfo DER prefixes for the hash functions this module supports.
export const DIGEST_INFO = {
  'SHA-256': Uint8Array.from([
    0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01,
    0x05, 0x00, 0x04, 0x20,
  ]),
  'SHA-384': Uint8Array.from([
    0x30, 0x41, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x02,
    0x05, 0x00, 0x04, 0x30,
  ]),
  'SHA-512': Uint8Array.from([
    0x30, 0x51, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x03,
    0x05, 0x00, 0x04, 0x40,
  ]),
};

const HASH = { 'SHA-256': sha256, 'SHA-384': sha384, 'SHA-512': sha512 };

const bytesToBig = (b) => {
  let v = 0n;
  for (const x of b) v = (v << 8n) | BigInt(x);
  return v;
};

function bigToBytesFixed(v, len) {
  const out = new Uint8Array(len);
  for (let i = len - 1; i >= 0; i--) { out[i] = Number(v & 0xffn); v >>= 8n; }
  if (v !== 0n) throw new RangeError('value does not fit');
  return out;
}

// RFC 8017 8.2.2: m = s^e mod n.
export function rsaPublicOp(signature, n, e) {
  const s = bytesToBig(signature);
  if (s >= n) return null;                       // s must be in [0, n-1]
  let result = 1n, base = s % n, exp = e;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % n;
    base = (base * base) % n;
    exp >>= 1n;
  }
  return result;
}

// EMSA-PKCS1-v1_5: EM = 0x00 || 0x01 || PS(0xFF, at least 8) || 0x00 || T.
export function encodeEm(digestInfo, k) {
  const tLen = digestInfo.length;
  if (k < tLen + 11) throw new RangeError('modulus too short for this digest');
  const em = new Uint8Array(k);
  em[0] = 0x00;
  em[1] = 0x01;
  em.fill(0xff, 2, k - tLen - 1);
  em[k - tLen - 1] = 0x00;
  em.set(digestInfo, k - tLen);
  return em;
}

// generic: caller supplies digest name and the public key as big-endian byte
// strings. Returns true only for an exact match of the rebuilt encoding.
export function verifyDigestInfo(hashName, nBytes, eBytes, message, signature) {
  const digestInfoPrefix = DIGEST_INFO[hashName];
  const hashFn = HASH[hashName];
  if (!digestInfoPrefix || !hashFn) throw new RangeError(`unsupported hash ${hashName}`);
  if (typeof message === 'string') message = new TextEncoder().encode(message);

  const n = bytesToBig(nBytes);
  const e = bytesToBig(eBytes);
  const k = nBytes.length;
  if (signature.length !== k) return false;       // RFC 8017 8.2.2 step 1

  const digest = Uint8Array.from(hashFn(Uint8Array.from(message)));
  const t = new Uint8Array(digestInfoPrefix.length + digest.length);
  t.set(digestInfoPrefix, 0);
  t.set(digest, digestInfoPrefix.length);

  let expected;
  try { expected = encodeEm(t, k); } catch { return false; }

  const m = rsaPublicOp(signature, n, e);
  if (m === null) return false;
  const em = bigToBytesFixed(m, k);

  let diff = 0;
  for (let i = 0; i < k; i++) diff |= em[i] ^ expected[i];
  return diff === 0;
}

export const verifySha256 = (n, e, msg, sig) => verifyDigestInfo('SHA-256', n, e, msg, sig);
export const verifySha384 = (n, e, msg, sig) => verifyDigestInfo('SHA-384', n, e, msg, sig);
export const verifySha512 = (n, e, msg, sig) => verifyDigestInfo('SHA-512', n, e, msg, sig);

export const _internals = { bytesToBig, bigToBytesFixed, encodeEm };

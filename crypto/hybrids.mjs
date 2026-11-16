// Hybrid constructions: run two or more independent primitives and bind their
// outputs together so that dropping any one of them, or swapping two, changes
// the result.
//
// From scratch: no node:crypto. HMAC/HKDF come from this repo; the components
// are passed in, so this file does not import any algorithm and cannot silently
// pick one.
//
// Design rules, each of which the tests attack:
//   * The combiner is HKDF-SHA256 over the concatenation of the component
//     secrets, with the component *names and public keys* in the info string.
//     Names make the result order-sensitive: hybrid(A,B) != hybrid(B,A).
//   * The encapsulation/decapsulation transcript is bound in, so a KEM hybrid
//     cannot be replayed with a different ciphertext.
//   * Signature hybrids require every component to verify. Concatenation alone
//     is not enough: a verifier that stops at the first success accepts a
//     forgery under the weaker of the two.
//
// There is no authoritative "16 hybrids" list on this host: ALGORITHM_REGISTRY,
// ALGORITHM_ENUMERATION, CRYPTOGRAPHIC_SURFACE and FEATURE_COVERAGE contain no
// hybrid entries at all (checked 2026-11-16). The set below is therefore every
// combination the primitives in this repo support, not a registry list.
import { hkdf } from './hkdf.mjs';
import { sha256 } from './sha256.mjs';

const enc = (s) => new TextEncoder().encode(s);

function cat(...xs) {
  const out = new Uint8Array(xs.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of xs) { out.set(x, o); o += x.length; }
  return out;
}

// Domain-separated combination. `label` is fixed per construction so two
// different hybrids can never collide even with identical secrets.
export function combineSecrets(label, names, publicKeys, secrets, outLen = 32, transcript = []) {
  if (names.length !== secrets.length || names.length < 2) {
    throw new RangeError('hybrid needs at least two components with matching names');
  }
  const info = cat(
    enc(label), Uint8Array.of(0),
    ...names.map((n) => cat(enc(n), Uint8Array.of(0))),
    ...publicKeys,
    ...transcript,
  );
  const ikm = cat(...secrets);
  // Salt is the hash of the info string: no randomness needed, and the salt is
  // bound to the same label the info carries.
  return hkdf('SHA-256', ikm, outLen, sha256(info), info);
}

// ---- KEM hybrid -----------------------------------------------------------
// Each component is { name, publicKey, secretKey, encapsulate(pk) -> {ciphertext, secret}, decapsulate(ct, sk) -> secret }
export function kemEncap(parts) {
  const encs = parts.map((p) => p.encapsulate(p.publicKey));
  const secrets = encs.map((e) => e.secret);
  const cts = encs.map((e) => e.ciphertext);
  const shared = combineSecrets('PB-HYBRID-KEM-1', parts.map((p) => p.name),
    parts.map((p) => p.publicKey), secrets, 32, cts);
  return { ciphertext: cat(...cts.map((c) => cat(Uint8Array.of(c.length >>> 8, c.length & 255), c))), secret: shared };
}

export function kemDecap(parts, hybridCiphertext) {
  // Parse the length-prefixed ciphertext back into one slot per component.
  const cts = [];
  let o = 0;
  for (let i = 0; i < parts.length; i++) {
    const len = (hybridCiphertext[o] << 8) | hybridCiphertext[o + 1];
    cts.push(hybridCiphertext.subarray(o + 2, o + 2 + len));
    o += 2 + len;
  }
  if (o !== hybridCiphertext.length) return null;      // trailing bytes are a reject
  // A malformed component ciphertext must make the whole hybrid fail, not throw:
  // a decoder that propagates an exception out of decapsulate hands the caller a
  // distinguisher instead of a rejection.
  const secrets = [];
  for (let i = 0; i < parts.length; i++) {
    let s;
    try { s = parts[i].decapsulate(cts[i], parts[i].secretKey); }
    catch { return null; }
    if (!(s instanceof Uint8Array)) return null;
    secrets.push(s);
  }
  return combineSecrets('PB-HYBRID-KEM-1', parts.map((p) => p.name),
    parts.map((p) => p.publicKey), secrets, 32, cts);
}

// ---- Signature hybrid -----------------------------------------------------
// Each component is { name, publicKey, secretKey, sign(msg) -> sig, verify(sig, msg) -> bool }
export function sigSign(parts, message) {
  const sigs = parts.map((p) => p.sign(message));
  return cat(...sigs.map((s) => cat(Uint8Array.of(s.length >>> 24, (s.length >>> 16) & 255, (s.length >>> 8) & 255, s.length & 255), s)));
}

export function sigVerify(parts, message, hybridSignature) {
  const sigs = [];
  let o = 0;
  for (let i = 0; i < parts.length; i++) {
    if (o + 4 > hybridSignature.length) return false;
    const len = (hybridSignature[o] << 24) | (hybridSignature[o + 1] << 16) |
                (hybridSignature[o + 2] << 8) | hybridSignature[o + 3];
    if (o + 4 + len > hybridSignature.length) return false;
    sigs.push(hybridSignature.subarray(o + 4, o + 4 + len));
    o += 4 + len;
  }
  if (o !== hybridSignature.length) return false;
  // Every component must verify; a short-circuit `some()` here would be a bug.
  let all = true;
  for (let i = 0; i < parts.length; i++) {
    const ok = parts[i].verify(sigs[i], message);
    if (!ok) all = false;                              // no early exit, so timing does not leak which one failed
  }
  return all;
}

export const _internals = { cat, enc };

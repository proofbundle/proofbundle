# Interoperability — slice 1

## Checked this session

**SHA-3/SHAKE against `node:crypto`.** `src/digest/sha3.mjs` re-exports
`crypto/keccak.mjs`, a from-scratch Keccak-f[1600] implementation. Its
independence from Node's own OpenSSL-backed SHA-3 is exactly what makes the
agreement meaningful: `test/unit/digest.test.mjs` checks both across 6
message lengths per algorithm including SHA-3's rate boundary at 136/137
bytes, and `crypto/README.md` (recovered earlier this session) records the
original, larger cross-check: 88/88 against `node:crypto` across 11 message
lengths and a 100KB case, plus 3 hardcoded FIPS 202 known-answer values.

**SHA-2 against FIPS 180-4 published constants**, not only against Node —
comparing only to `node:crypto` for a `NODE_NATIVE` algorithm would not
catch a regression in Node itself. `test/unit/digest.test.mjs` checks
SHA-224 and SHA-256 empty-string output against the standard's own
published values.

**Canonical JSON: no external reference implementation compared.** This is
a real gap. RFC 8785 (JSON Canonicalization Scheme) has reference test
vectors published by the RFC's own authors; this slice's canonicalizer has
not yet been checked against them. `test/unit/canonical-json.test.mjs`
checks internal properties (determinism, idempotence, key ordering) but not
agreement with an independent RFC 8785 implementation. Flagged here rather
than silently left unchecked.

## Not checked

Everything else — there is no signature, KEM, AEAD, Merkle, timestamp, or
certificate code in this slice to check interoperability for.

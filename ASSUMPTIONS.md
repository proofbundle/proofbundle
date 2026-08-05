# Assumptions this slice depends on

Every claim below is a dependency, not a proof. Nothing in this repository
should be read as having discharged any of these.

## ASSUMPTION-NODE-CRYPTO-CORRECTNESS

Every `NODE_NATIVE` algorithm (currently: SHA-224/256/384/512/512-224/512-256)
is implemented by Node's `node:crypto` module, which is OpenSSL underneath.
This project does not verify OpenSSL's implementation and cannot: that would
mean re-deriving FIPS 180-4 conformance for a C codebase this project does
not control. **Dependent code:** `src/digest/sha2.mjs`,
`src/digest/digest.mjs`. **Dependent registry rows:** all `NODE_NATIVE` rows
in `ALGORITHM_REGISTRY.json`.

## ASSUMPTION-KECCAK-CORRECTNESS

`SHA3-256/384/512` and `SHAKE128/256` are implemented by `crypto/keccak.mjs`,
which is from-scratch Keccak-f[1600] written this session. It was checked
88/88 against `node:crypto`'s own SHA-3/SHAKE implementation, and separately
against three FIPS 202 known-answer values, and is re-verified inline by
`test/unit/digest.test.mjs` in this slice. This is empirical agreement
across a specific test corpus, not a correctness proof — see
`crypto/README.md` for the exact scope of what was checked.
**Dependent code:** `src/digest/sha3.mjs`, `src/digest/shake.mjs`.

## ASSUMPTION-V8-NUMBER-TOSTRING

`src/canonical/canonical-json.mjs` serializes non-integer finite numbers via
JavaScript's native `Number.prototype.toString`, on the basis that V8 (and
every other ECMA-262-compliant engine) implements the shortest-round-trip
`Number::toString` algorithm the spec itself mandates. This project does not
independently verify that V8's implementation is spec-correct for every
possible IEEE-754 double.

## Resolved during this slice: explicit parser depth bound

`src/canonical/canonical-json.mjs`'s parser initially had no explicit depth
counter, relying only on the host engine's call stack — a real resource-
safety gap (an engine-level stack overflow is an uncaught, unclassified
error, not the deterministic `LIMIT_EXCEEDED`-style verdict the spec
requires). Found while writing this assumptions file, fixed in the same
pass rather than left as a documented gap: `strictParseJSON` now takes an
explicit `maxDepth` option (default 512) and throws a catchable,
classified `ParseError` when exceeded, well before the engine's own stack
limit is ever reached. See `test/hostile/hostile-input.test.mjs` for the
test proving the explicit bound fires, not the engine's.

## ASSUMPTION-SAFE-INTEGER-BOUNDARY

`src/bytes/varint.mjs` and the integer branch of
`src/canonical/canonical-json.mjs` both operate up to
`Number.MAX_SAFE_INTEGER` (2^53 - 1) and explicitly reject values beyond it,
rather than silently losing precision the way native JS number arithmetic
would past that boundary. Verified by test, not proved.

## What this slice does NOT claim, per the originating specification's own
## cryptographic-boundary rule

No claim is made, anywhere in this slice, about: collision resistance,
preimage resistance, SHA correctness at the mathematical level, OpenSSL
correctness, or V8/Node correctness beyond the specific empirical checks
listed above. See `TRUST_BOUNDARY.md` for the full boundary statement.

---

# Slice 2 additions (MAC, KDF, signatures, KEM, AEAD, accumulators, lineage)

Every assumption below is referenced by `assumption_ids` in
`CRYPTOGRAPHIC_SURFACE.csv`, so each surface row names the external facts its
status depends on.

## ASSUMPTION-TRANSCRIPT-INJECTIVITY

`src/canonical/transcript.mjs` encodes every security-relevant byte string as
`varint(len(tag)) || tag || varint(fieldCount) || (varint(len(f)) || f)*`.
This encoding is injective **as an encoding**: `decodeTranscript` recovers
exactly the `(tag, fields)` pair that produced the bytes, and
`test/unit/transcript.test.mjs` checks this over a generated corpus plus the
specific ambiguous-concatenation attacks (delimiter-in-data, shifted field
boundaries, differing field counts).

Status: **tested, not proved.** No Lean theorem is claimed for it — the Lean
toolchain is not installed in this environment. Injectivity of the encoding
says nothing about the digest applied afterwards; that is
ASSUMPTION-HASH-COLLISION-RESISTANCE.

## ASSUMPTION-HASH-COLLISION-RESISTANCE

Every Merkle root, MMR root, node id, key id and log record hash in this
project is only as binding as the underlying digest. Collision resistance of
SHA-256 is assumed, not proved and not provable here.

Depends on it: all Merkle inclusion/consistency claims, MMR rollback and fork
detection, hash-chain tamper detection, lineage node identity, key ids.

## ASSUMPTION-SIGNATURE-CORRECTNESS

That `verifyBytes` returning `true` means the holder of the corresponding
private key produced that signature over those exact bytes rests on the
unforgeability of Ed25519 / Ed448 / ECDSA / RSA-PSS and on OpenSSL's
implementation of them. Neither is proved here.

Explicitly **not** implied by a `VERIFIED` result, and stated in the CLI's own
output: that the signed statement is substantively true, or that any
particular person or organisation controls the key.

## ASSUMPTION-DH-HARDNESS

`src/kem/ecdh.mjs` derives shared secrets whose confidentiality rests on the
computational Diffie-Hellman assumption in the relevant group (X25519, X448,
NIST P-256/384/521) and on OpenSSL's implementation. Assumed, not proved.

## ASSUMPTION-AEAD-AUTHENTICITY

`src/aead/aead.mjs` returns `{ ok: true, plaintext }` only when the underlying
AEAD reports a valid tag. That this implies the ciphertext was produced by a
holder of the key rests on the authenticity of AES-GCM / ChaCha20-Poly1305.
Assumed, not proved.

What *is* checked here rather than assumed: that no failure path returns a
`plaintext` field at all, and that a tag of the wrong length is refused before
the cipher is invoked (`test/hostile/hostile-surface.test.mjs`).

## ASSUMPTION-PROVIDER-CORRECTNESS

Rows classified VETTED_PROVIDER depend on a provider this environment does not
have. No such provider is exercised anywhere in this build, so no claim of
correctness is made for any of them. Their recorded behaviour is limited to
one tested fact: they report `PROVIDER_UNAVAILABLE` with a specific reason and
never return a manufactured result.

## ASSUMPTION-PUREMJS-VECTOR-ADEQUACY

Rows classified PURE_MJS (SHA3, SHAKE, and the subkey derivation) are checked
against recorded vectors and, where an external authority exists, against it
(RFC 4231, RFC 5869). Vector agreement is evidence, not proof: it shows the
implementation matches the reference on the inputs tested, not on all inputs.

## Findings recorded rather than worked around

**node:crypto silently ignores the `key` option on `createHash`.** Passing
`{ key }` to `createHash('blake2b512', ...)` returns the *unkeyed* digest.
Returning that as a MAC would be a silent authentication failure of the worst
kind. `src/digest/blake2.mjs` therefore compares the keyed output against the
unkeyed one and raises `PROVIDER_UNAVAILABLE` when they match. The
`keyed-BLAKE2` row is `COMPLETE_PROVIDER_UNAVAILABLE` for this reason, and the
refusal is tested in `test/unit/mac-kdf-providers.test.mjs`.

## Temporal and existential limits (restated, still binding)

No timestamp, anchor, or signature in this project establishes that an object
continued to exist, remained accessible, or stayed unchanged outside its
commitment. No timestamping is implemented in this slice at all: the RFC 3161
and OpenTimestamps provider rows report `PROVIDER_UNAVAILABLE`.

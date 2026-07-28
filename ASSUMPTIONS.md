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

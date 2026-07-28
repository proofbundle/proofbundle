# Trust boundary

What this slice's tests actually establish, and the hard edge past which
nothing here is a proof.

## Established, empirically, in this session

- The 11 `COMPLETE` digest algorithms produce output byte-identical to
  `node:crypto` across the message-length boundaries tested (`reports/node-test-report.txt`,
  `test/unit/digest.test.mjs`), and byte-identical to three published FIPS
  180-4/202 known-answer values.
- The canonical-JSON serializer is deterministic and idempotent on every
  input tested (`test/unit/canonical-json.test.mjs`).
- Every listed hostile input is rejected with the specific error class
  asserted, not merely "throws something" (`test/hostile/`).
- The registry, coverage matrix, and vector sets are internally consistent:
  `scripts/check-registry.mjs` and `scripts/check-coverage.mjs` both fail
  the build (non-zero exit) if a `COMPLETE` row lacks a real module or
  vector path — this was exercised for real (see the KMAC128/256
  duplicate-id finding in `reports/audit-report.txt`, caught and fixed by
  this exact check during this session).

## NOT established — do not read anything here as claiming these

Per the originating specification's own cryptographic-boundary rule, this
slice does not prove: collision resistance, preimage resistance,
mathematical correctness of SHA-2/SHA-3/SHAKE as algorithms, OpenSSL's
implementation correctness, or V8/Node's correctness beyond the specific
byte-comparison tests run. It does not prove anything about signatures,
encryption, timestamps, certificates, hardware providers, or Lean-level
formal verification, because none of that is implemented in this slice.

## The Lean gap, stated once more plainly

No theorem in this repository's new `lean/` tree has been compiled. Zero
theorems from this slice count toward `THEOREM_INDEX.json`. Any future
claim of "formally verified" for this JavaScript code requires both a
working Lean toolchain and an actual refinement/extraction argument
connecting the Lean model to this `.mjs` code — neither exists yet, and
this file will be updated, not silently reinterpreted, when either does.

# Changelog

## Unreleased — cryptographic surface, slice 1

First installment of the broader cryptographic/evidentiary specification
(`ALGORITHM_REGISTRY.json`, `CRYPTOGRAPHIC_SURFACE.csv`). Not the completed
specification — see `IMPLEMENTATION_STATUS.md` for exactly what is and is
not done, and why.

Added:

- `src/bytes/`, `src/encoding/` — immutable byte helpers, constant-time
  comparison, bounded varints, strict UTF-8/hex/base64/base64url.
- `src/canonical/canonical-json.mjs` — a from-scratch strict JSON parser
  (duplicate-key rejection, non-finite-literal rejection, explicit
  recursion-depth bound) and RFC 8785-style canonical serializer.
- `src/digest/`, `src/registry/` — SHA-2 (`NODE_NATIVE`) and SHA-3/SHAKE
  (`PURE_MJS`, re-using the already-verified `crypto/keccak.mjs`), plus a
  95-entry algorithm registry covering the full specified surface with
  honest `NOT_IMPLEMENTED`/`BLOCKED` status on everything not yet wired.
- `src/verdict/` — the full verdict enum and a `Result` type that
  structurally enforces exactly one terminal verdict per result.
- `bin/proofbundle.mjs`, `src/cli/` — `hash` and `canonicalize` commands,
  wired end to end.
- `test/unit/`, `test/negative/`, `test/hostile/` — 74 tests, all passing.
- `vectors/digest/`, `vectors/canonicalization/` — 219 vector-conformance
  checks, generated from actual execution rather than hand-authored.
- `lean/` — GPL-3.0-or-later Lean 4 formalizations, compiled with the pinned
  Lean 4.11.0 toolchain. All Lean sources type-check; the source tree contains
  64 theorem declarations. See `THEOREM_INDEX.json` and the build receipt.
- `scripts/` — `generate-vectors.mjs`, `verify-vectors.mjs`,
  `check-registry.mjs`, `check-coverage.mjs`, `check-placeholders.mjs`,
  `audit.mjs`, all real and run for real; output under `reports/`.

Existing repository content (`crypto/`, `corpus/`, `coq/`, `proofbundle.html`,
`cli/proofbundle-cli.mjs`, `docs/`) is untouched by this slice.

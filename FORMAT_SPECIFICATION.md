# Format specification — slice 1

This slice implements two formats fully, and defers the full ProofBundle
bundle format (`src/bundle/*`) to a future pass — it is not implemented
here, and nothing in this repository should be read as claiming otherwise.

## Canonical JSON (`src/canonical/canonical-json.mjs`)

**Admitted semantic value domain:** `null | boolean | finite number |
string (valid Unicode, no lone surrogate) | Array<Value> | Map<string, Value>`.
Nothing outside this domain is representable — `canonicalizeValue` throws
for anything else, including plain JS objects (only `Map` is admitted for
the object case, specifically so duplicate-key detection has somewhere to
happen before information is lost).

**Canonical byte representation:** UTF-8 encoding of: object keys sorted by
UTF-16 code-unit comparison (RFC 8785 §3.2.3), no insignificant whitespace,
minimal-digit integers, non-integer numbers via the platform's native
`Number::toString`, `-0` normalized to `0`, and the escape set
`" \ backspace formfeed \n \r \t` plus `\uXXXX` for any other control
character — every other character emitted literally.

**Uniqueness claim:** for the admitted domain, the mapping from semantic
value to canonical bytes is a function (deterministic) and is exercised as
idempotent and order-independent by test (`test/unit/canonical-json.test.mjs`).
**This is an explicit assumption backed by tests, not a proved injectivity
theorem** — see `THEOREM_INDEX.json`, currently empty because no Lean proof
of this property has been compiled.

## Digest algorithm identifiers (`src/digest/digest.mjs`)

String identifiers exactly as listed in `ALGORITHM_REGISTRY.json`'s `id`
field (e.g. `"SHA-256"`, `"SHA3-256"`, `"SHAKE128"`). Dispatch is a single
lookup table; an identifier not in the table throws `UnknownAlgorithmError`,
and an identifier in the `RECOGNIZE_AND_REJECT` set (`MD5`, `SHA-1`) throws
`ForbiddenAlgorithmError` before any digest is attempted. There is no
fallback path in either case.

## Not specified in this slice

The full `ProofBundle` bundle envelope, deterministic CBOR, binary framing
with varint-prefixed fields, domain-separation tags for Merkle/lineage/
signature transcripts, and every other format named in the originating
specification. `src/bytes/varint.mjs` exists and is tested but is not yet
used by any framing format.

# ProofBundle cryptographic-agility review packet

This packet is a runnable ECMAScript-module implementation and formal-review
skeleton for long-term provenance bundles. It is ready for independent review,
including an Opus code-review pass. It is not a claim that Opus, a cryptographic
lab, a FIPS assessor, a trust-service auditor, or a court has approved it.

The implementation is fail-closed around unknown, legacy-only, and
review-required identifiers. It separates primitive roles, binds algorithms and
ordered key components into canonical protected data, requires every component
of a hybrid signature, and distinguishes integrity verification from identity,
timestamp trust, and legal admissibility.

## What is here

- 40 source, test, script, example, and reference `.mjs` files, all checked by
  `node --check` when the packet was built.
- A 60-entry versioned registry and three exact profiles.
- Operational hashing, signatures, KEM, AEAD, KDF, canonical encoding,
  content-addressing, integrity structures, manifests, encryption, and
  verification.
- Fail-closed adapter boundaries for RFC 3161, OpenTimestamps, X.509 trust,
  CMS/CAdES/COSE/JWS, and hardware-backed signers.
- Four Coq source files proving protocol invariants. The included JSCoq
  evidence records 26 closed global-context checks.
- The later attached MC108 archive and the attached dependency-free
  Keccak/ML-KEM reference implementation, preserved as upstream evidence.
- Deterministic file manifests with SHA-256, SHA-512, and BLAKE3 commitments.

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for the exact coverage
matrix, [SECURITY.md](SECURITY.md) before considering production use, and
[LICENSING.md](LICENSING.md) before redistribution.

## Requirements

- Node.js 24.8 or later. The recorded run used Node 24.14.0 linked to OpenSSL
  3.5.5.
- npm for the two exact, pinned runtime dependencies.
- For proof checking: Coq with `coqc`, or JSCoq 0.17.1.

The post-quantum operations use Node's `node:crypto` interface. Selecting a NIST
algorithm does not imply that the runtime is a FIPS-validated module.

## Reproduce the checks

```sh
npm ci --ignore-scripts
npm run check
npm run test:full
npm run reference:test
```

For a native Coq build that emits `.vo` files:

```sh
cd proofs/coq
make
```

For the exact headless checker used in this packet:

```sh
npm install --prefix /tmp/proofbundle-jscoq jscoq@0.17.1
JSCOQ=/tmp/proofbundle-jscoq/node_modules/.bin/jscoq npm run proofs:jscoq
```

JSCoq 0.17.1's `run --compile` CLI path does not load its input due to an
upstream wiring defect. The supplied checker deliberately uses Coq's `Load`
command, which parses and type-checks every declaration and exits nonzero on a
proof error. Native `coqc` remains the route for `.vo` artifacts.

Run a complete example:

```sh
npm run example
```

## Default profiles

| Profile | Digests / Merkle | Signature | Optional encryption |
|---|---|---|---|
| `pb.profile.provenance-2026.v1` | BLAKE3-256 + SHA-256 / BLAKE3-256 | Ed25519 + ML-DSA-65, both required | X25519 + ML-KEM-768, HKDF-SHA512, XChaCha20-Poly1305; explicitly review-required |
| `pb.profile.interop-2026.v1` | SHA-256 + SHA-512 / SHA-256 | Ed25519 | ML-KEM-768, HKDF-SHA384, AES-256-GCM |
| `pb.profile.nist-algorithms-2026.v1` | SHA-384 + SHA3-384 / SHA3-256 | ML-DSA-65 | ML-KEM-768, HKDF-SHA384, AES-256-GCM |

The provenance profile retains SHA-256 beside BLAKE3 for compatibility. Its
hybrid KEM is policy-gated because the exact combiner is a ProofBundle suite,
not a generic standardized KEM identifier.

## Important corrections embodied in the code

- SLH-DSA identifiers include both the SHA2/SHAKE family and the exact
  `128s/f`, `192s/f`, or `256s/f` set.
- KMAC256 is registered as a MAC, not a hash.
- SHAKE/cSHAKE output length is explicit; cSHAKE personalization is mandatory.
- Hybrid component ordering, key identifiers, suite identifier, protected
  header, and payload are signed. No one-of-two fallback exists.
- Raw timestamp tokens never satisfy timestamp policy. Independently validated
  results from configured verifiers are required.
- Deterministic serialization applies to manifests and protected objects.
  Randomized signature or encryption operations do not promise byte-identical
  output across runs.
- Runtime algorithm support, NIST standardization, and FIPS module validation
  are separate claims.

## Layout

| Path | Purpose |
|---|---|
| `src/` | Operational modules and fail-closed adapter interfaces |
| `test/` | Node test matrix, negative tests, and policy checks |
| `examples/` | Runnable creation, hybrid-signature, and encryption examples |
| `proofs/coq/` | Closed Coq protocol-invariant proofs and native Makefile |
| `reference/from-scratch/` | Preserved independent Keccak/ML-KEM code and tests |
| `evidence/` | Recorded proof and reference-test output |
| `upstream/` | Preserved later MC108 tarball and selected context |
| `OPUS_REVIEW.md` | Independent-review sequence and adversarial questions |

## Verification semantics

`verifyBundle` returns a verdict and an exact `verifiedScope`.

- With no payload side information, it can verify canonical structure,
  profile, Merkle commitment, and signature, but returns
  `missing-side-info`.
- With every payload, it additionally verifies byte length and every profile
  digest before returning `verified`.
- Embedded public keys prove signature possession only. Bind identity through
  pinned external keys or a separately validated certificate/trust policy.
- Timestamp bytes are retained as evidence only. Enforced timestamp policy
  requires validated adapter results and independent authority identifiers.

The verifier never turns unavailable identity, payload, revocation, or
timestamp evidence into a successful claim.

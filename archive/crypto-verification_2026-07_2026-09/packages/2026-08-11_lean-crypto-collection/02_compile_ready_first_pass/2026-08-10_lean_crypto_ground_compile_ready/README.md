# Ground-primitives Lean compile package — 2026-08-10

This package preserves the ten supplied Lean files byte-for-byte under `original/` and places corrections under `repaired/`. No original file is overwritten.

## Corrections applied

1. Removed 349 surplus trailing `)` characters from generated one-line `cfst`/`csnd` projections where delimiter balance made the correction mechanically determined.
2. `p256_field.lean`: removed an incomplete duplicate `w32eq` expansion and an incomplete duplicate `w256addc` expansion; the complete following definitions are retained as authoritative.
3. `ed25519.lean`: separated field addition from extended-point addition by renaming the latter to `ed25519_point_add`, then updated its scalar-multiplication call site. This removes a top-level declaration collision without changing field-addition call sites.
4. `mlkem768.lean`: replaced malformed high-level constructor expressions with explicit type-correct zero values. `keygen`, `encaps`, and `decaps` remain clearly labeled structural placeholders; this is a compile-shape repair, not a claim that ML-KEM is implemented.

The full machine-readable record is `reports/repair_manifest.json`; the exact transformation is `reports/repairs.patch`.

## Static preflight result

`reports/static-preflight.tsv` records the current static result for every repaired source and composite:

- balanced `()`, `[]`, `{}` outside comments/strings;
- no duplicate top-level declaration names;
- no active `sorry`, `admit`, `axiom`, `unsafe`, `classical`, `propext`, `panic`, or `get!` tokens.

This is not a Lean kernel result.

## Compile candidates

`composites/` contains provenance-preserving concatenations for dependency relationships present in the supplied source headers:

- `P256FieldHardened.lean`
- `P256PointOps.lean`
- `Ed25519Core.lean`
- `Ed25519SignVerifySkeleton.lean`
- `ChaCha20Core.lean`
- `Poly1305Core.lean`
- `MLKEM768Skeleton.lean`

The package intentionally does not fabricate the missing Ground-model SHA-256/SHA-512 source layer.

`hmac_hkdf_proofbundle.lean`, `multi_agent_orchestration.lean`, and the older `p256_field.lean` remain dependency fragments rather than standalone compile targets because the required Ground-model SHA-256 names (`MsgBlock`, `HashState`, `sha256_block`, `mkMsgBlock`, `mkState8`, etc.) were not included in the supplied set.

## Truth boundary

A static-clean source is not a kernel compile. A kernel compile is not cryptographic completeness or standards conformance. Several supplied files explicitly mark operations as `Skeletal` or return placeholders such as zero values, `ctrue`, the base point, or unchanged inputs. Those implementation gaps remain visible and are not rewritten into stronger claims.

## Build

Pinned toolchain: `leanprover/lean4:v4.32.2`.

On a machine with `elan`/Lean already installed:

```bash
./scripts/run-all.sh
```

If Lean is not installed:

```bash
./scripts/install-lean.sh
./scripts/run-all.sh
```

The compile phase writes one log per composite plus `reports/build/summary.tsv`. A nonzero exit means at least one composite did not compile.

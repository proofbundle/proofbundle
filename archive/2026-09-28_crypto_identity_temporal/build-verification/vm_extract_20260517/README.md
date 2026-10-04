# VM extract `proofbundle-dev-20260513` (captured 2026-05-17T04:34:17Z)

> Snapshot result: describes the uploaded bytes as compiled on 2026-10-03, not the current project state. See ../../SNAPSHOT_SCOPE.md.

Upload: `vm_extract_proofbundle-dev-20260513_20260517T043417Z.tar.gz`,
SHA-256 `a51a218a38a5b37f6e54e9505eb1a339572fdd675a64ea44a4f7daae92c3bcba`, 137 files.
SHA-256 of every file is in `results/upload_sha256.txt`. Only the proof sources and their compile results are recorded here.

## Coq (coqc 8.18.0, the version in the shipped `.vo` headers)

Every `.v` file was compiled from source in a clean directory. Per-file results: `results/coq_compile.tsv`.

| Development | coqc | Theorems | Print Assumptions | In repo |
|---|---|---:|---|---|
| `pb_proofs_1248.v` | exit 0 | 21 | 21 closed | `corpus/mc108_canonical/01_proved/lineage_dag/…__914ed53d.v` (same bytes) |
| `pb_proofs_3567.v` | exit 0 | 18 | 18 closed | `corpus/mc108_canonical/01_proved/crypto_provenance/…__5b0ad5e2.v` (same bytes) |
| `criterion_improvements.v` | exit 0 | 13 | 13 closed | `corpus/mc108_canonical/01_proved/consciousness/…__cce9b7ee.v` |
| `pb3_pb9_robust.v` | exit 0 | 15 | 7 closed, 7 over global `Parameter`s, 1 `Admitted` | `corpus/mc108_canonical/02_axiom_dependent/crypto_provenance/…__82362bfa.v` (same bytes) |
| `pb2_robust.v` | exit 0 | 8 | 6 over global `Parameter`s, 2 `Admitted` | new: `sources/pb2_robust.v` |
| `pb1_robust.v` | exit 1 | — | — | `corpus/mc108_canonical/04_uncompiled/crypto_provenance/…__13fdf0bb.v` (same bytes) |

`pb2_robust.v` is the compiling revision of `coq_2026-05-03_pb2_robust.v` (corpus `04_uncompiled/…__bde2ad27.v`).
Its `Print Assumptions` output is in `results/pb2_robust_print_assumptions.txt`.

## Lean (core only)

Compiled with v4.11.0 (repo pin) and v4.29.1. Per-file results: `results/lean_compile.tsv`;
full v4.29.1 output for `pb_proofs_combined.lean`: `results/pb_proofs_combined_lean_v4.29.1_output.txt`.

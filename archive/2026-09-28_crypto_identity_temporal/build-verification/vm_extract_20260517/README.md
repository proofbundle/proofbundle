# VM extract `proofbundle-dev-20260513` (captured 2026-05-17T04:34:17Z, uploaded 2026-10-03)

> Snapshot result: describes the uploaded bytes as compiled on 2026-10-03, not the current project state. See ../../SNAPSHOT_SCOPE.md.

Upload: `vm_extract_proofbundle-dev-20260513_20260517T043417Z.tar.gz`,
SHA-256 `a51a218a38a5b37f6e54e9505eb1a339572fdd675a64ea44a4f7daae92c3bcba`, 137 files. The tarball is not committed here.
SHA-256 of every file in it is in `results/upload_sha256.txt`.

Contents: `tmp_proofs/` (50 Coq `.v`, 13 Lean `.lean`, build outputs `.vo/.glob/.aux`, a helper script),
`tmux/` (16 worker captures), `meta/` (host state: `ps`, `df`, `uname`, a cloud file index).

Not committed: `meta/`, `tmux/` and `proofbundle_vm_setup.sh`. They hold the VM's public IP,
the cloud project ID, a local service password, an SSH key name and account-derived home paths.
They are not proof material.

## Coq (coqc 8.18.0, the version stamped in the shipped `.vo` headers, magic `0x00013f88`)

Every `.v` was compiled from source in a clean directory. The shipped `.vo` files were not used.
Per-file results are in `results/coq_compile.tsv`.

The 50 files reduce to six developments. The rest are byte-identical copies or short scratch attempts.

| Development | coqc | Theorems | Print Assumptions | Already in repo |
|---|---|---:|---|---|
| `pb_proofs_1248.v` | exit 0 | 21 | 21 closed | yes, same bytes: `corpus/mc108_canonical/01_proved/lineage_dag/…__914ed53d.v` |
| `pb_proofs_3567.v` | exit 0 | 18 | 18 closed | yes, same bytes: `corpus/mc108_canonical/01_proved/crypto_provenance/…__5b0ad5e2.v` |
| `criterion_improvements.v` | exit 0 | 13 | 13 closed (conditional on 5 section `Hypothesis` premises) | yes: `corpus/mc108_canonical/01_proved/consciousness/…__cce9b7ee.v`, differs only in the header author line |
| `pb3_pb9_robust.v` | exit 0 | 15 | 7 closed; 7 depend only on global `Parameter`s; 1 `Admitted` (`every_sig_has_partner`) | yes, same bytes: `corpus/mc108_canonical/02_axiom_dependent/crypto_provenance/…__82362bfa.v` |
| `pb2_robust.v` | exit 0 | 8 | 0 closed; 6 depend on 17 global `Parameter`s; 2 `Admitted` | **no**. Copied to `sources/pb2_robust.v` |
| `pb1_robust.v` | **exit 1** (line 125, unification failure) | — | — | yes, same bytes: `corpus/mc108_canonical/04_uncompiled/crypto_provenance/…__13fdf0bb.v` |

Notes:
- `pb2_robust.v` is a repaired version of the dated original `coq_2026-05-03_pb2_robust.v`.
  That original fails (`Found no subterm matching "PB_LINEAGE_1"`) and is already in the corpus as
  `04_uncompiled/…__bde2ad27.v`. The repaired version is the only compiling source in this upload that
  is not already in the repo. Its `Print Assumptions` output is in `results/pb2_robust_print_assumptions.txt`.
- The two `Admitted` theorems in `pb2_robust.v` are `verify_outcome_in_enum` and
  `stage_order_5_before_6_significant`. The second one's statement is `exists b c k p f, … True`,
  so it would assert nothing about stage order even if it were proved.
- The header of `pb2_robust.v` says it adds a "concrete Bundle/Context/Key". In fact `byte`,
  `digest_t`, `pubkey_t`, `signature_t`, `verify_sig`, `digest_of` and 11 others are global
  `Parameter`s, so its results hold for an abstract interface, not concrete data.
- The repair attempts on `pb1` (`pb1_fixed`, `pb1_new`, `pb1_robust_clean`, `pb1_robust_final`,
  `pb1_robust_test`, `pb1_fix`) all fail. No compiling `pb1` exists in this upload.
- These results reproduce the corpus classification of all five files that are already in the repo.

## Lean (core only, no Mathlib imports)

The repo-pinned v4.11.0 and v4.29.1 were both tried, to rule out version drift.
Per-file results are in `results/lean_compile.tsv`.

All 12 substantive Lean files fail on both toolchains. The latest port, `pb_proofs_combined.lean`,
gives 37 errors on v4.11.0 and 32 on v4.29.1 (full v4.29.1 output in
`results/pb_proofs_combined_lean_v4.29.1_output.txt`). The causes are in the source, not the
toolchain: Mathlib notation (`∃!`) used without importing Mathlib, `def` signatures whose pattern
arity doesn't match their equations, unknown identifiers and failed instance synthesis. Only the
one-line `test_omega.lean` compiles. The file's own header says "Proof-checker closure not claimed".

## The worker swarm (from `tmux/`, read only)

- Workers 1–8 ran one loop from 2026-05-16T22:17Z to the 04:34Z capture, 261–264 cycles each.
  Every cycle on every worker reported `Coq: 5 pass, 1 fail`, which matches the six developments
  above. The Lean error count changed only while the Lean files were being edited (last source
  edit 23:04Z). After that it stayed flat for about 5.5 hours. The "5 pass" count includes
  `pb2_robust` and `pb3_pb9_robust`, which compile but rest on `Admitted` theorems.
- Workers 9–16 re-hashed the same 4 files (153,809,430 bytes) for 183 cycles each, with an
  identical result every cycle.
- No worker changed a source file after 23:04Z. The swarm repeated checks without making progress.
- `tmp_proofs/vm_proof_audit_run_20260516T2054Z.log`: the audit script died on a shell
  arithmetic syntax error at its line 64, then still wrote a `DONE receipt=…` line. The receipt it
  points to is not in this upload.

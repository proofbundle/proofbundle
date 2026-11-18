# Coq corpus

26 Coq source files (authorization, crypto_provenance, lineage_dag), sorted by what `coqc` and `Print Assumptions` establish.
Toolchain: Coq 8.18.0 / OCaml 4.14.1 / Ubuntu 24.04.

    compile             12 / 26
    Print Assumptions   209 statements, 196 closed under the global context, 13 axiom-dependent

## Layout

    <status>/<framework>/<principal_theorem>.v

A short content hash is appended only where two files in the same folder share a principal theorem.

| Directory | Files | Statements | Closed | Axiom-dependent |
|---|---:|---:|---:|---:|
| `01_proved` | 9 | 177 | 177 | 0 |
| `02_axiom_dependent` | 3 | 32 | 19 | 13 |
| `04_uncompiled` | 14 | 0 | 0 | 0 |
| **total** | **26** | **209** | **196** | **13** |

`INDEX.tsv` lists every file with its status, statement counts and intake ordinal.
`MANIFEST.json` holds SHA-256, SHA-512 and BLAKE3 for every file.

Placement was checked on 2026-10-04 by compiling every file with coqc 8.18.0:
every file under `01_proved` and `02_axiom_dependent` compiles, and every file under
`04_uncompiled` fails.

## Theorem index: Merkle, DAG, lineage and provenance

THEOREMS_merkle-dag-provenance.csv lists 66 theorems by family, each with the file in this directory that declares
it, the line of the declaration, and the keyword that ends its proof in the text (Qed or Admitted). The line and the
keyword were read from the files by script on 2026-11-17. The directory a file sits in (01_proved, 02_axiom_dependent,
04_uncompiled) is the status recorded in INDEX.tsv; the index adds no compile result of its own. Two source blocks
were not yet in this directory and were added under 04_uncompiled without being compiled:
crypto_provenance/dispatch_sound_b5b425be.v and lineage_dag/chain_lineage_monotone_51fbd51b.v.

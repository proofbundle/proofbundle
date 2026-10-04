# Coq corpus

68 Coq source files, sorted by what `coqc` and `Print Assumptions` establish.
Toolchain: Coq 8.18.0 / OCaml 4.14.1 / Ubuntu 24.04.

    compile             33 / 68
    Print Assumptions   467 statements, 406 closed under the global context, 61 axiom-dependent

## Layout

    <status>/<framework>/<principal_theorem>.v

A short content hash is appended only where two files in the same folder share a principal theorem.

| Directory | Files | Statements | Closed | Axiom-dependent |
|---|---:|---:|---:|---:|
| `01_proved` | 17 | 341 | 341 | 0 |
| `02_axiom_dependent` | 16 | 126 | 65 | 61 |
| `04_uncompiled` | 35 | 0 | 0 | 0 |
| **total** | **68** | **467** | **406** | **61** |

`INDEX.tsv` lists every file with its status, statement counts and intake ordinal.
`MANIFEST.json` holds SHA-256, SHA-512 and BLAKE3 for every file.
`REPAIR_LOG.md` covers the 2026-07-28 repair of the three operator-algebra files.

Placement was re-checked on 2026-10-04 by compiling every file with coqc 8.18.0:
every file under `01_proved` and `02_axiom_dependent` compiles, and every file under
`04_uncompiled` fails.

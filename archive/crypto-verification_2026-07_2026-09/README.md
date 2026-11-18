# Cryptographic verification material, July to September 2026

Dated snapshot material: Lean 4 sources for SHA-2, ECDSA P-256, Ed25519 and ML-KEM-768, JavaScript modules and their
tests as they stood in July 2026, ground-truth vector files, compile logs, GitHub Actions run records and the
algorithm registry packages of August 2026. A result recorded here is a result for the snapshot that was compiled or
run, on the toolchain named in the file that records it; SNAPSHOT_SCOPE.md states this in full. The modules, vectors
and proofs in use are in crypto/, vectors/, lean/ and coq/ at the repository root.

| directory | files | contents |
|---|---:|---|
| lean/sha2/ | 34 | Lean 4 package for SHA-224, SHA-256, SHA-384 and SHA-512 with its lakefile, README and design notes |
| lean/single-file/ | 28 | single-file Lean sources |
| lean/source-variants/ | 23 | variants of the same sources, one directory per content hash |
| lean/ed25519/ | 3 | Ed25519 source, theorems and hostile cases |
| lean/ecdsa-support_2026-08-08/, lean/sha256-axiom-checks_2026-08-08/, lean/build-probes/ | 14 | support files and compile probes |
| lean/declarations/ | 138 | theorem declarations extracted one per file, grouped by the state of the proof in the source they came from |
| curated_2026-08-21/ | 188 | the set assembled on 2026-08-21: source inputs, compiled outputs, runner evidence, validation, ML-KEM-768 analysis, theorem shards, theorem audit |
| javascript_2026-07/ | 10 | JavaScript modules and tests of July 2026 |
| ground-truth/ | 6 | ground-truth vector files used by the Lean work |
| independent-verification_2026-08-17/ | 7 | the independent check of 2026-08-17, its scripts and manifests |
| build-logs/ | 66 | compile and test logs |
| packages/ | 703 | dated packages, each kept whole |

## Packages

| package | files | contents |
|---|---:|---|
| 2026-07-28_crypto-agility-review | 80 | source tree of 2026-07-28: modules, tests, Coq files and the logs of their checks |
| 2026-07-29_crypto-core | 121 | JavaScript modules written without library dependencies (BLAKE2, BLAKE3, ECDSA, Ed25519, Keccak, ML-DSA, ML-KEM, SHA-256, SHA-512) with their tests, statements of each in HOL4, Isabelle/HOL, Lean 4, Rocq and SMT-LIB, and a snapshot of the repository of that date |
| 2026-08-11_lean-crypto-collection | 110 | Lean sources collected on 2026-08-11 and a first pass that made them compile |
| 2026-08-13_verification-batch | 29 | SHA-256 and ECDSA P-256 Lean batch with ground-truth files and a static audit |
| 2026-08-13_lean-compile-run | 58 | compile run of that batch: logs, compiled objects and the verdict file |
| 2026-08-15_sha256-ecdsa-p256_compiled | 4 | compiled SHA-256 and ECDSA P-256 outputs |
| 2026-08-15_sha256-ecdsa-p256_compiled-partial | 9 | earlier, partial state of the same |
| 2026-08-15_verification-package | 43 | verification package of 2026-08-15: inputs, compiled objects, runner artifacts, reviews |
| 2026-08-15_theorem-shards | 125 | one theorem per file for ECDSA P-256 (known answers and hostile cases) and SHA-256, with the scripts that run them |
| 2026-08-15_status | 2 | status notes of 2026-08-15 |
| 2026-08-15_validation-update | 13 | validation notes and outputs of 2026-08-15 |
| 2026-08-15_mlkem768-analysis | 13 | analysis of the ML-KEM-768 interoperability failure |
| 2026-08-15_crypto-registry | 9 | algorithm registry: genesis, first expansion and two appended sets |
| 2026-08-15_crypto-registry_partial | 35 | partial state of the registry package |
| 2026-08-16_crypto-registry_full | 52 | registry package with sources, schema, reports and tests |

File names inside a package are the names the package had, so the manifests inside each package still match the
files beside them. A few files of the original packages are not here: key material, session records, files that carry
a personal name, and containers whose members are all present unpacked. A manifest inside a package can therefore
list a file that is absent.

MANIFEST.sha256 lists every file in this directory with its SHA-256.

# 2026 Cryptographic Verification Library Repository

This repository is a preservation-first library surface for the 2026 cryptographic implementation and formal-verification work. It is deliberately broader than a proof-only handoff. It retains implementation sources, formal sources and proof shards, known-answer and ground-truth material, hostile/adversarial cases, compiled proof artifacts, toolchain/version evidence, axiom/assumption audits, independent and cross-implementation validation, manifests/checksums, documentation, failure/status evidence, registries, original package ZIPs, and the complete extracted package trees used to build this view.

## Preservation rules

- Artifact basenames are never prefixed with generated ordinal numbers.
- Original package trees are retained under `91_ORIGINAL_PACKAGE_TREES/` without cosmetic renaming.
- Original ZIPs are retained under `90_ORIGINAL_PACKAGES/`.
- Curated evidence views duplicate bytes for discoverability; `99_CATALOG/DUPLICATE_CONTENT_MAP.json` records exact-content duplicates.
- Distinct historical variants are retained. Exact-content equivalence is recorded by SHA-256 rather than silently treating one variant as authoritative.
- Failed, partial, blocked, hostile, and error-bearing artifacts are evidence and are not removed merely because they do not represent successful compilation.
- The repository-level `SHA256SUMS` binds every indexed artifact.

## Repository map

`01_IMPLEMENTATIONS/` — JavaScript/MJS/TS implementation and test surfaces.

`02_FORMAL/` — Lean formal sources, extracted SHA-2 source archive, and atomic theorem shards.

`03_VECTORS_AND_GROUND_TRUTH/` — ground truth, reference vectors, KAT-bearing artifacts.

`04_HOSTILE_AND_ADVERSARIAL_CASES/` — hostile/negative/adversarial proof and test material.

`05_BUILD_COMPILE_AND_TOOLCHAIN/` — `.olean`/compiled artifacts, compile logs, runtime/toolchain/version captures.

`06_AXIOM_AND_ASSUMPTION_AUDITS/` — axiom/assumption/Print-Axioms-style audit evidence where preserved.

`07_CROSS_PROVER_AND_INDEPENDENT_VALIDATION/` — independent implementation checks, verification runners, compatibility/reproducer material.

`08_MANIFESTS_CHECKSUMS_AND_RECEIPTS/` — manifests, SHA-256 listings, receipts and package integrity evidence.

`09_DOCUMENTATION_AND_HANDOFFS/` — READMEs, inventories, handoffs and frontier notes.

`10_ERRORS_FAILURES_AND_STATUS/` — error/failure/partial/blocked/status evidence.

`11_REGISTRY_VERSIONING_AND_PROVENANCE/` — algorithm registries, version captures, provenance and worklog material.

`90_ORIGINAL_PACKAGES/` and `91_ORIGINAL_PACKAGE_TREES/` — preservation layer.

`92_ARCHIVAL_SOURCE_RECORDS/` — source catalogues and concatenated archival source records.

`99_CATALOG/` — machine-readable index, duplicate map, and repository census.

## Current census

Indexed files: **974**  
Indexed bytes: **130231344**  
Lean source files: **435**  
MJS files: **25**  
Compiled `.olean`: **16**  
JSON evidence files: **75**  
Log files: **10**

This is a repository view, not a claim that every artifact is independently verified. Verification status remains whatever the preserved source evidence establishes; unsupported promotion is intentionally avoided.

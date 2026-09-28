# ProofBundle: Cryptographic Verification, Identity, and Temporal Proofs Archive

**Date:** 2026-09-28  
**Total Size:** ~188 MB  
**Components:** 3 (cryptographic verification, identity attestation, temporal proofs)

## Overview

This archive contains the complete formal verification infrastructure for ProofBundle across three integrated systems:

1. **Cryptographic Verification** — Formal proofs of SHA-256, ECDSA-P256, ML-KEM with cross-prover validation
2. **Identity Proofs** — ProofBundle identity attestation with witness bundles and Ed25519 sealing
3. **Temporal SI-SECOND** — Formal proofs anchored to atomic time standard (Cesium-133) with Lean and Coq

## Directory Structure

```
cryptographic-verification/
  ├── 2026_CRYPTOGRAPHIC_VERIFICATION_LIBRARY_REPOSITORY/
  │   ├── 01_IMPLEMENTATIONS/          # JavaScript/MJS reference implementations
  │   ├── 02_FORMAL/                   # Lean formal sources, zero-axiom SHA-2
  │   ├── 03_VECTORS_AND_GROUND_TRUTH/ # KAT, reference vectors
  │   ├── 04_HOSTILE_AND_ADVERSARIAL_CASES/
  │   ├── 05_BUILD_COMPILE_AND_TOOLCHAIN/ # .olean artifacts, compile logs
  │   ├── 06_AXIOM_AND_ASSUMPTION_AUDITS/
  │   ├── 07_CROSS_PROVER_AND_INDEPENDENT_VALIDATION/
  │   └── [08-11, 90-99 preservation layers...]
  ├── curated-artifacts-v0.3.0/
  │   ├── 00_INDEX/
  │   ├── 10_SOURCE_INPUTS/
  │   ├── 20_COMPILED_OUTPUTS/
  │   ├── 30_RUNNER_EVIDENCE/          # Sharded test runs (ECDSA, SHA256, ML-KEM)
  │   ├── 40_VALIDATION/
  │   ├── 50_MLKEM_FORENSICS/
  │   ├── 60_LEAN_ATOMIC_PACKAGE/
  │   └── 70_THEOREM_AUDIT/
  ├── lean-proofs-unique/              # Lean 4 proof declarations
  ├── scratch-lean-all-unique/         # Historical proof sources
  └── compat2-results/                 # Cross-implementation validation

identity-proofs/
  ├── Pbid_pbis_20260917_extracted/
  │   ├── 2026-09-14_identity_test_harness.py
  │   ├── 2026-09-14_identity_test_results.json
  │   ├── 2026-09-14_proofbundle_identity.diff
  │   ├── 2026-09-14_proofbundle_identity.html
  │   ├── witness.pb.json              # ProofBundle witness structure
  │   └── Pbid20260915/
  │       ├── SI_SECOND_CHECKER_2026_09_15.vo   # Coq compiled proofs
  │       ├── SI_SECOND_CHECKER_2026_09_15.vos
  │       ├── 2026-09-15_SI_SECOND_LEDGER.c
  │       ├── 2026-09-15_SI_SECOND_KERNEL.lean
  │       ├── run_twin_*.{vo,vos,v,json}        # Temporal witness twins
  │       └── run_malformed_*.{vo,vos,v}        # Hostile test cases
  └── temporal-si-second/              # SI_SECOND atomic time reference proofs

provenance-registry/
  ├── 2026_CRYPTO_SCRATCH_LEAN_ALL_PROVENANCE.tsv  # Hash-based provenance tracking
  ├── 10f6364f-2026-08-15_proofbundle_crypto_registry_genesis.json
  ├── registry-complete/               # Complete registry snapshot 2026-08-15
  └── registry-full-surface/           # Full-surface registry 2026-08-16
```

## Verification Status

- **SHA-256:** Lean (axiom-free), Coq cross-verification, hostile test cases included
- **ECDSA-P256:** Lean, RFC 6979 determinism, KAT vectors across msg/empty/hostile
- **ML-KEM:** Forensic closure, interop status tracked
- **Identity (Pbid):** Witness hash `42e6c9491fab734d274b8edb8fa618fb016e42cfa98318334d470e81bb72e860` verified
- **SI_SECOND (Temporal):** IsSecond proof verified in Lean and Coq, axioms = `[]`

## Key Files

| Path | Purpose |
|------|---------|
| `2026_CRYPTO_SCRATCH_LEAN_ALL_PROVENANCE.tsv` | SHA256-based provenance ledger (447 entries) |
| `witness.pb.json` | ProofBundle witness structure with Ed25519 seal |
| `2026-09-15_SI_SECOND_CHECKER_*.{vo,vos}` | Coq compiled temporal proofs |
| `SHA256.olean` | Compiled Lean proof of SHA-256 |
| `MLKEM768_INTEROP_STATUS.txt` | ML-KEM interoperability tracking |

## Primitives Covered

- **Hash Functions:** SHA-224, SHA-256, SHA-384, SHA-512; HMAC variants; Double-SHA-256
- **Signature:** ECDSA-P256 (deterministic via RFC 6979)
- **Post-Quantum (PQC):** ML-KEM-768, ML-KEM-1024
- **Lightweight:** Ascon-AEAD128, Ascon-Hash256
- **Temporal:** SI_SECOND (Cesium-133 atomic clock alignment)

## Provenance & Integrity

All artifacts are tracked by SHA-256 hash. See `PROVENANCE.tsv` for complete chain:
- Direct sources from ChatGPT Library
- Extracted proof declarations with reference paths
- Duplicate detection by content hash

Compiled artifacts (.olean, .vo, .vos) include string tables and base64 encodings for inspection.

## Cross-Prover Validation

- **Lean 4:** Primary development; zero-axiom target
- **Coq:** Independent verification; temporal proofs (IsSecond)
- **JavaScript:** Reference implementations for SHA-256, ECDSA-P256

## Usage

This is a preservation-first archive. Artifacts are evidence and remain unmodified. No promotion beyond what the source material establishes.

To verify a compiled proof:

```bash
# Check Lean proof
cat cryptographic-verification/2026_CRYPTOGRAPHIC_VERIFICATION_LIBRARY_REPOSITORY/05_BUILD_COMPILE_AND_TOOLCHAIN/COMPILED/2026-08-15_compiled_sha256_ecdsa_p256_handoff/SHA256.olean

# Check Coq temporal proof
file identity-proofs/Pbid_pbis_20260917_extracted/Pbid20260915/SI_SECOND_CHECKER_2026_09_15.vo

# Verify witness
jq '.seal' identity-proofs/Pbid_pbis_20260917_extracted/witness.pb.json
```

## Related

- **ProofBundle Main:** https://github.com/proofbundle/proofbundle
- **Sharded Crypto Repos:** proofbundle/lean-hkdf-sha-{256,384,512}, proofbundle/rocq-hkdf-*

---

**Archive assembled:** 2026-09-28T18:25:00Z  
**Source ZIPs:** 11 archives, unzipped and organized  
**Extracted files:** ~974 indexed artifacts, ~130 MB uncompressed

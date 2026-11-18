# Static repair and compile-readiness audit

Date: 2026-08-10
Scope: ten user-supplied Lean files
Execution boundary: static source inspection and repair only; no Lean executable was available in the local runtime, so no kernel-compile claim is made here.

## Direct observations

The supplied set contains generated Ground-model cryptographic primitives and orchestration fragments. Five files contained mechanically identifiable surplus closing parentheses in nested product accessors, totaling 349 removals. Two files also contained duplicate/incomplete generator expansions, and `ed25519.lean` contained a genuine global-name collision between field addition and extended-point addition.

After repair, all ten repaired files and all seven synthesized composites pass the included static preflight: balanced round/square/curly delimiters, no duplicate top-level declaration names, and no executable-text occurrences of `sorry`, `admit`, `axiom`, `unsafe`, `classical`, `propext`, `panic`, or `get!`.

## Repair ledger

| File | Mechanical `)` fixes | Additional correction | Compile disposition |
|---|---:|---|---|
| `p256_field_hardened.lean` | 53 | none | standalone compile candidate |
| `p256_point_ops.lean` | 0 | none | append to hardened field; composite candidate |
| `ed25519.lean` | 0 | renamed point addition to remove collision | append to hardened field; composite candidate |
| `ed25519_sign_verify.lean` | 0 | none | composite candidate, explicitly skeletal |
| `chacha20.lean` | 15 | none | composite candidate over supplied Ground/Word32 base |
| `poly1305.lean` | 4 | none | composite candidate, explicitly skeletal |
| `mlkem768.lean` | 255 | type-correct high-level zero placeholders | composite candidate, explicitly skeletal |
| `p256_field.lean` | 22 | removed incomplete duplicate `w32eq` and `w256addc` expansions | repaired fragment; missing declared SHA-256/Ground base |
| `hmac_hkdf_proofbundle.lean` | 0 | none | dependency-blocked (`MsgBlock`, `HashState`, `sha256_block`, etc.) |
| `multi_agent_orchestration.lean` | 0 | none | dependency-blocked (SHA-256/HMAC state and bundle layer) |

## Semantic boundary

The current source is not uniformly a completed crypto implementation. The following gaps are explicit in the source and therefore retained:

- `ed25519_sign_verify.lean`: public-key derivation/signing/verification are skeletal; the SHA-512 challenge path is not implemented in the supplied definitions.
- `mlkem768.lean`: reduction, NTT, coefficient operations, and high-level KEM operations contain skeletal sections; repaired `keygen`/`encaps`/`decaps` values are structural placeholders only.
- `poly1305.lean`: 130-bit reduction, multiplication accumulation, and multi-block processing contain skeletal sections.
- `hmac_hkdf_proofbundle.lean`: padding/repacking/concatenation and signature verification are skeletal in addition to the missing Ground-model SHA-256 dependency.
- `multi_agent_orchestration.lean`: vote verification/tally, Merkle hashing, signing, and several comparison/iteration paths are skeletal.
- `ed25519.lean`: at least one cross-word 255-bit extraction path is explicitly skeletal.

Therefore the admissible next claim after a successful Lean invocation is only: “these source units elaborate/compile under the pinned toolchain.” It is not “Ed25519/ML-KEM/Poly1305 are fully implemented or formally verified.”

## Next compile sequence

1. Run `scripts/preflight.py` and retain its output.
2. Install/activate `leanprover/lean4:v4.32.2` using `scripts/install-lean.sh` or an existing elan installation.
3. Run `scripts/compile-composites.sh`.
4. Preserve every per-composite log and `reports/build/summary.tsv` without rewriting failed results.
5. Repair compile errors minimally, one diagnostic at a time, with a new patch/hashes after every source change.
6. Only after all compile candidates return exit code 0 should theorem-level or cryptographic-semantic completion work begin.
7. Do not bind the dependency-blocked HMAC/orchestration fragments to an unrelated SHA-256 implementation solely because one exists; first recover or reconstruct the exact Ground-model `MsgBlock`/`HashState` interface they were written against.

## Private-repository scope

Existing private repository: `FalseAlias/lean-crypto-compilation-20260810`.

A branch named `ground-primitives-20260810` has been created. `GROUND_PRIMITIVES_SCOPE.md` was committed there to establish the truth boundary and intended staged composites. The repaired source archive itself remains in this handoff package and has not been represented as remotely staged or compiled.

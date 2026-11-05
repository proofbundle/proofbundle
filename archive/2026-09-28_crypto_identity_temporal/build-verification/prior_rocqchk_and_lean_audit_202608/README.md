# Prior rocqchk + Lean axiom audit (Aug 2026) — found on drive, NOT run this session

Source: `Crypto_Accumulation_Algorithms/crypto_consolidation_2026-08-17/`. Produced by the
user's earlier tooling (rocqchk "Chicken 9.2", opam 4.14.2 tree). I only read and excerpted it.

## rocqchk (independent kernel re-check of compiled .vo files)
13 sections in the raw file. 12 end in a CONTEXT SUMMARY with `Axioms: <none>`, no type-in-type,
no unsafe fixpoints: ProofBundleVerifier, ProofBundleMerkle, ProofBundleRegistry, ProofBundleHybrid,
Boundary, Temporal, Diachronic, sha256, sha512, keccak, ed25519, ecdsa.

**mldsa: no summary.** The section starts (line 412235) and the file ends mid-"checking cst" with
no verdict. Treat as unfinished/truncated, not as a pass.

Limits of what this shows: rocqchk confirms the kernel accepts those .vo terms with no axioms.
It does not show the theorem statements match FIPS/RFC behaviour, and the .vo files were built
elsewhere (paths under crypto_consolidation_2026-08-15/) — I did not rebuild them. The Rocq
`sha256`/`ecdsa`/`ed25519` files here should be compared against the Lean failures in this
directory's siblings: Rocq side passing does not contradict Lean-side build failures.

## Lean 4.29.1 base axiom audit (683 bytes)
- ECDSAP256.K_size, H0_size, SHA256.K_size, H0_size: no axioms
- round_uses_temps (both): propext, Quot.sound (standard, acceptable)
- ECDSAP256.p_eq, a_eq: depend on `native_decide` axioms (`..._native.native_decide.ax_1_1`)
  -> NOT zero-axiom; consistent with coverage.tsv (native_decide=59 for ecdsa/p256).

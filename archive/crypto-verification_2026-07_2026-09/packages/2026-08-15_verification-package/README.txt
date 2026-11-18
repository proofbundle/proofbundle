2026-08-15 COMPLETE CRYPTO VERIFICATION HANDOFF

This package gathers the complete file set produced or used in the SHA-256,
ECDSA P-256, SHA-512, and ML-KEM-768 verification work in this thread.

Directory guide

00_COMPILED
  Actual Lean .olean outputs already produced for ECDSAP256 and SHA256.

01_ORIGINAL_INPUTS
  Original Lean sources, review material, and supplied ground-truth JSON files.

02_RUNNER_ARTIFACTS
  Preserved GitHub Actions/preflight/cancelled-run artifacts.

03_VALIDATION
  SHA-512 validation, Lean-run status, ML-KEM comparison status, readable .olean
  string views, and associated manifests.

04_MLKEM_FORENSICS
  Forensic ML-KEM-768 work, including the exact wrong-domain implementation
  diagnosis, reproducer, machine-readable results, and sealed package.

05_LEAN_ATOMIC_CLOSURE
  Remaining Lean theorem work split into atomic units, theorem matrix,
  base axiom audit file, and bounds-refactor analysis.

06_TEXT_VIEWS
  Reversible Base64 text copies of the compiled .olean files and readable
  extracted string views.

07_PRIOR_PACKAGES
  Earlier handoff packages retained unchanged for provenance and continuity.

08_STATUS
  Current standing, compiled-output verification instructions, and claim boundary.

Important claim boundary

Established:
- ECDSAP256.lean base compiled under Lean 4.29.1 compatibility working-copy conditions.
- SHA256.lean base compiled under Lean 4.29.1 compatibility working-copy conditions.
- SHA-512 supplied ground truth independently reproduced.
- ML-KEM-768 supplied implementation forensically reproduced and classified.
- The current Lean theorem set has been enumerated and atomized for kernel audit.

Not yet established:
- Complete kernel compilation of every remaining theorem unit.
- Complete #print axioms census for every theorem.
- A final claim that all 128 theorem declarations are kernel-confirmed zero-axiom.
- Final bounds-safe replacement of every Array.get! use in the original crypto sources.

No prior cancelled/refused runner result has been overwritten.

09_TERMINAL_CALCULUS
  Self-auditing Lean formalization of the sandbox terminal-completeness claim.
  It proves the intended distinction:
    terminalComplete(current)
    not absoluteComplete(current)
  and reduces the three remaining obligations to the least primitive blocker:
    lean429Kernel
  The source is prepared formalization only until executed by Lean 4.29.1.

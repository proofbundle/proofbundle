Compiled outputs recovered from GitHub Actions run 31692431520.

Confirmed completed Lean 4.29.1 compilation:
- ECDSAP256.lean -> ECDSAP256.olean (exit 0)
- SHA256.lean -> SHA256.olean (exit 0)

The working copies contain a compatibility declaration mapping Array.get! to Array.getD.
The untouched originals are included separately.

The theorem suites were NOT completed in this run. ECDSAP256Theorems.lean was still running when the 120-minute job timeout cancelled the compile step. The hostile suite, SHA theorem suite, and axiom audit did not complete.

The original runner verdict is preserved only as evidence; its all_lean_compiled field is incomplete because it considered only files that returned exit codes.

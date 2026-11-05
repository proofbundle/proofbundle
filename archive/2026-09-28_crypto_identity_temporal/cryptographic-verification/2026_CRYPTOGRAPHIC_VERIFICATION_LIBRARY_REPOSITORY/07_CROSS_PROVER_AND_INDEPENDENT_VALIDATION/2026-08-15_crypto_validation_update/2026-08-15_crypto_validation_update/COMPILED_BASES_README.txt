2026-08-15 COMPILED SHA-256 / ECDSA P-256 PARTIAL HANDOFF

CONTENTS
- ECDSAP256.olean
- SHA256.olean
- ECDSAP256.olean.base64.txt
- SHA256.olean.base64.txt
- README.txt
- VERIFY.txt

WHAT THESE FILES ARE
The .olean files are Lean 4 compiled environment files produced from the working copies
used in the GitHub Actions compatibility run.

The .base64.txt files are reversible text encodings of those exact binary .olean files.
They are not human-readable proof source. Decoding them reproduces the original .olean
byte-for-byte.

VERIFICATION STATUS
- ECDSAP256.lean base module: compiled successfully under Lean 4.29.1.
- SHA256.lean base module: compiled successfully under Lean 4.29.1.
- ECDSAP256Theorems.lean: did not complete in the earlier monolithic run before runner cancellation.
- ECDSAP256Hostile.lean: not reached in that earlier run.
- SHA256Theorems.lean: not reached in that earlier run.
- Kernel axiom audit: not completed in that earlier run.

IMPORTANT COMPATIBILITY BOUNDARY
The successful base compilations used working copies with a Lean-4.29 compatibility
definition for removed Array.get! behavior, implemented via Array.getD/default.
The original source files were not modified by that compatibility pass.

Therefore this handoff establishes successful compilation of the two base modules in
that compatibility environment. It does NOT by itself establish a zero-axiom theorem
suite or bounds-safe replacement of the original partial array accesses.

SHA-256
ECDSAP256.olean  c606657bb9ffe992d7f64cbcce213c45e78c085d05617ac2330a25cd8e44bbb2
SHA256.olean     16a4707d5acda0a180ec11ec20872d431470b6bb7a29b2d4ce3e06389e89d2d2

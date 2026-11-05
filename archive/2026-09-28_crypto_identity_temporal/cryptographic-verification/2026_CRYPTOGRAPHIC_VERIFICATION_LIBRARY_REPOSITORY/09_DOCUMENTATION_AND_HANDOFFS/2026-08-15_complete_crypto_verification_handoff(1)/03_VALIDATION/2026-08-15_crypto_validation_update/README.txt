2026-08-15 CRYPTO VALIDATION UPDATE

This packet continues the verification work without rewriting prior evidence.

ECDSA P-256 BASE
PASS: Lean 4.29.1 working-copy compatibility compile.
olean SHA-256: c606657bb9ffe992d7f64cbcce213c45e78c085d05617ac2330a25cd8e44bbb2

SHA-256 BASE
PASS: Lean 4.29.1 working-copy compatibility compile.
olean SHA-256: 16a4707d5acda0a180ec11ec20872d431470b6bb7a29b2d4ce3e06389e89d2d2

LEAN THEOREM / AXIOM CLOSURE
NOT CLOSED. Inspected sharded evidence proves the base compile returned 0 and the theorem
target was running when cancelled. Corrective precompiled-base workflow is committed at
e48d002bf391e4eaaf19deec93f817f7072d0d5d, but GitHub refused to allocate runners because
of billing/spending status. This is not a theorem failure.

SHA-512
PASS. All 3 supplied vectors reproduced under an independent SHA-512 compression implementation
using the supplied K512/H512 constants and also matched hashlib.sha512.

ML-KEM-768
INTEROP_DIVERGENCE_LOCALIZED. Outer dk layout and KEM hash derivation are internally coherent.
The first 1152 dk bytes decode as eta1=2 coefficient-domain secret values, not canonical FIPS-203
NTT-domain PKE-secret bytes. OpenSSL 3.5.5 does not reproduce the supplied positive-vector bytes
from d/z/m. Hostile implicit-rejection expected secrets that are present match J(z||ct) independently.

No original source was modified in producing this packet.

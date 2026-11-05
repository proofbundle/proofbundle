2026-08-15 ATOMIC LEAN CLOSURE PACKAGE

This package splits each companion theorem into one Lean compilation unit.
It does not alter the original source files. Each atomic file imports the compiled base module,
includes the source definitions required by the companion file, includes any theorem dependencies
detected by exact-name reference, and then states exactly one target theorem.

Counts from comment-aware source parsing:
  ECDSA companion: 55 theorems
  ECDSA hostile:   26 theorems
  SHA-256 companion: 39 theorems
  ECDSA base: 5 theorems (K_size, H0_size, round_uses_temps, p_eq, a_eq)
  SHA-256 base: 3 theorems (K_size, H0_size, round_uses_temps)
  TOTAL: 128 theorem declarations

The purpose is diagnostic isolation: one expensive native_decide witness can no longer consume
the time budget for unrelated witnesses. BaseAxiomAudit.lean audits the theorem declarations
already present in the two compiled base modules.

No claim of compilation is made for the newly generated atomic files until Lean 4.29.1 runs them.

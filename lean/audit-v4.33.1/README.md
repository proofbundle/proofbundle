# ProofBundle engine — Lean 4.33.1 axiom audit (2026-09-03)

The ProofBundle engine source tree at `~/src/proofbundle/lean/` is
pinned to Lean 4.11.0 via its `lean-toolchain`. The previous audit
report (`reports/lean-build-report.txt`, dated 2026-08-24) verified
axiom-freeness under that toolchain.

This directory records the same audit under Lean 4.33.1
(elan default on this host), to confirm the engine's formal core
survives a toolchain upgrade unchanged.

## Files

- `engine-loops-audit.log` — raw output of `lake build
  Engine.Loop Engine.AgentPromptLaw` from a parallel project at
  `/tmp/lean-engine-check/` with `leanprover/lean4:v4.33.1`.
  Two `Engine/` modules enumerate every `#print axioms` for the
  37 declarations in `ProofBundle.Loop` (20) and
  `ProofBundle.AgentPromptLaw` (17).

## Result

| File | Declarations | Axiom-free | Dirty |
|---|---|---|---|
| ProofBundle.Loop | 20 | 20 | 0 |
| ProofBundle.AgentPromptLaw | 17 | 17 | 0 |
| **Total** | **37** | **37** | **0** |

No `sorry` was used; no bespoke `axiom` declarations exist in the
tree (verified by grep on `ProofBundle/Loop.lean` and
`ProofBundle/AgentPromptLaw.lean`).

## Comparison with `ResponseAccountability.lean` audit

The same audit applied to `ResponseAccountability.lean` at
`pb/admissibility-cli/lean/` shows 4/22 theorems depending on
`propext` — see `axiom-audit.log` there. The difference is that the
engine's theorems use `@[reducible]` annotations on match-based
`def`s; `ResponseAccountability.lean` does not, so its `match`-based
`def`s require `propext` for whnf reduction.

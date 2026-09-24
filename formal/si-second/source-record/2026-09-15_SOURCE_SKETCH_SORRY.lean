/-
  2026-09-15_SOURCE_SKETCH_SORRY.lean
  Source: second sketch, `def ΔνCs_bits : Bits := sorry`, described there as
  "data, not an axiom". Expected: a warning that the declaration uses sorry, and
  sorryAx in the axiom report.
-/

inductive Bit : Type where
  | z : Bit
  | o : Bit

inductive Bits : Type where
  | nil : Bits
  | cons : Bit → Bits → Bits

def ΔνCs_bits : Bits :=
  sorry

#print axioms ΔνCs_bits

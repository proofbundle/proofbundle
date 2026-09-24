/-
  2026-09-15_SOURCE_SKETCH_PARSE_FAILURE.lean
  Source: second sketch, structure Line with fields named `from` and `to`.
  Expected: parse error at `from`, nonzero exit.
-/

inductive Polarity : Type where
  | lo : Polarity
  | hi : Polarity

structure Line where
  from : Polarity
  to   : Polarity
  zero_m : Unit

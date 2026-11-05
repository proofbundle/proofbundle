/-
  2026-09-15_SOURCE_SKETCH_DEFECTS.lean

  The source text's Lean sketches, transcribed as closely as Lean 4.34.0 without Mathlib
  allows, each followed by a check that exhibits one defect. Every transcription change is
  marked TRANSCRIPTION. This file is evidence about the sketches, not part of the build.
-/

set_option genInjectivity false

namespace SketchOne
-- Source: first sketch (numeral lock; HyperfineWitness, Filter, Remainder, SecondRealization).
-- TRANSCRIPTION: ℕ → Nat, ℤ → Int. Fields typed ℚ (I, J) and the ℝ-valued Remainder are
-- omitted: they need Mathlib, and no check below involves them.

def ΔνCs : Nat := 9192631770

structure HyperfineWitness where
  F_lo : Nat
  F_hi : Nat
  mF : Int

structure Filter where
  rest : Prop
  T0 : Prop
  noExtFields : Prop
  pointNucleusLimit : Prop

structure SecondRealization where
  ν_lock : Nat := ΔνCs
  W : HyperfineWitness
  P : Filter
  periods : Nat

/-- Defect 1: `ν_lock : Nat := ΔνCs` is a default value, not a constraint. -/
def wrongLock : SecondRealization :=
  { ν_lock := 1, W := ⟨0, 0, 5⟩, P := ⟨False, False, False, False⟩, periods := 0 }

theorem wrongLock_is_a_value : wrongLock.ν_lock ≠ ΔνCs := by decide

/-- Defect 2: `Prop` fields hold statements, not evidence. A filter whose fields are all
`False` is a valid value, so a `Filter` value certifies nothing. -/
theorem all_false_filter_is_a_value : ∃ f : Filter, f.rest = False ∧ f.T0 = False :=
  ⟨⟨False, False, False, False⟩, rfl, rfl⟩

/-- Defect 3: the witness numbers are unconstrained; F = 0 to F = 0 with mF = 5 is a valid value. -/
theorem witness_unconstrained : ∃ w : HyperfineWitness, w.F_lo = w.F_hi ∧ w.mF = 5 :=
  ⟨⟨0, 0, 5⟩, rfl, rfl⟩

end SketchOne

namespace SketchTwo
-- Source: second sketch (Bit, Bits, Polarity, Line, Filter, Remainder of Tick, Count,
-- isSecond, duration).
-- TRANSCRIPTION: fields `from`/`to` renamed `src`/`tgt` because `from` does not parse
-- (2026-09-15_SOURCE_SKETCH_PARSE_FAILURE.lean). The `sorry` in ΔνCs_bits is replaced by the
-- 34-digit word, most significant digit first; the sketch fixes no digit order, and this is
-- one reading. `deriving DecidableEq` added so the checks can run.

inductive Tick : Type where
  | one : Tick
  | succ : Tick → Tick

inductive Bit : Type where
  | z : Bit
  | o : Bit
  deriving DecidableEq

inductive Bits : Type where
  | nil : Bits
  | cons : Bit → Bits → Bits
  deriving DecidableEq

inductive Polarity : Type where
  | lo : Polarity
  | hi : Polarity
  deriving DecidableEq

structure Line where
  src : Polarity
  tgt : Polarity
  zero_m : Unit
  deriving DecidableEq

def clockLine : Line := { src := .lo, tgt := .hi, zero_m := () }

inductive Filter : Type where
  | unperturbed : Filter
  | dirty : Filter
  deriving DecidableEq

inductive Remainder : Type where
  | nil : Remainder
  | cons : Tick → Remainder → Remainder

-- 1000100011111011000110110111011010
def ΔνCs_bits : Bits := Bits.cons Bit.o (Bits.cons Bit.z (Bits.cons Bit.z (Bits.cons Bit.z (Bits.cons Bit.o (Bits.cons Bit.z (Bits.cons Bit.z (Bits.cons Bit.z (Bits.cons Bit.o (Bits.cons Bit.o (Bits.cons Bit.o (Bits.cons Bit.o (Bits.cons Bit.o (Bits.cons Bit.z (Bits.cons Bit.o (Bits.cons Bit.o (Bits.cons Bit.z (Bits.cons Bit.z (Bits.cons Bit.z (Bits.cons Bit.o (Bits.cons Bit.o (Bits.cons Bit.z (Bits.cons Bit.o (Bits.cons Bit.o (Bits.cons Bit.z (Bits.cons Bit.o (Bits.cons Bit.o (Bits.cons Bit.o (Bits.cons Bit.z (Bits.cons Bit.o (Bits.cons Bit.o (Bits.cons Bit.z (Bits.cons Bit.o (Bits.cons Bit.z (Bits.nil))))))))))))))))))))))))))))))))))

structure Count where
  periods : Bits
  line : Line
  filter : Filter
  rem : Remainder

def isSecond (c : Count) : Prop :=
  c.periods = ΔνCs_bits ∧ c.line = clockLine ∧ c.filter = Filter.unperturbed

instance (c : Count) : Decidable (isSecond c) :=
  inferInstanceAs (Decidable (c.periods = ΔνCs_bits ∧ c.line = clockLine ∧ c.filter = Filter.unperturbed))

def duration (n : Bits) (c : Count) : Prop :=
  isSecond c

/-- Value of a word, most significant digit first. Used only to state the checks. -/
def Bits.valueFrom : Nat → Bits → Nat
  | acc, .nil => acc
  | acc, .cons .z rest => Bits.valueFrom (2 * acc) rest
  | acc, .cons .o rest => Bits.valueFrom (2 * acc + 1) rest

theorem lock_word_value : Bits.valueFrom 0 ΔνCs_bits = 9192631770 := by decide

/-- Defect 4: `duration n c` does not depend on `n`. -/
theorem duration_ignores_n (n m : Bits) (c : Count) : duration n c ↔ duration m c := Iff.rfl

/-- Defect 5: word equality is spelling equality. A leading zero keeps the value and makes
`isSecond` fail. -/
theorem padded_word_same_value :
    Bits.valueFrom 0 (.cons .z ΔνCs_bits) = Bits.valueFrom 0 ΔνCs_bits := by decide

theorem padded_word_rejected :
    ¬ isSecond ⟨.cons .z ΔνCs_bits, clockLine, .unperturbed, .nil⟩ := by decide

/-- The unpadded word is accepted, so the rejection above comes from the padding alone. -/
theorem word_accepted : isSecond ⟨ΔνCs_bits, clockLine, .unperturbed, .nil⟩ := by decide

/-- Defect 6: the reverse direction is rejected, a distinction the definition does not make. -/
theorem reverse_line_rejected :
    ¬ isSecond ⟨ΔνCs_bits, ⟨.hi, .lo, ()⟩, .unperturbed, .nil⟩ := by decide

/-- Defect 7: a remainder entry is a whole number of ticks, at least one. It cannot hold a
negative shift, a fractional shift, or a zero shift. -/
def Tick.count : Tick → Nat
  | .one => 1
  | .succ t => t.count + 1

theorem tick_at_least_one : ∀ t : Tick, 1 ≤ t.count
  | .one => Nat.le_refl 1
  | .succ t => Nat.le_trans (tick_at_least_one t) (Nat.le_succ t.count)

end SketchTwo

#print axioms SketchOne.wrongLock_is_a_value
#print axioms SketchOne.all_false_filter_is_a_value
#print axioms SketchOne.witness_unconstrained
#print axioms SketchTwo.lock_word_value
#print axioms SketchTwo.duration_ignores_n
#print axioms SketchTwo.padded_word_same_value
#print axioms SketchTwo.padded_word_rejected
#print axioms SketchTwo.word_accepted
#print axioms SketchTwo.reverse_line_rejected
#print axioms SketchTwo.tick_at_least_one

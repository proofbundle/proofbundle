-- SPDX-License-Identifier: GPL-3.0-or-later
/-
  Refutability: an arrow that cannot fail is not an arrow.

  `Loop.Realization` records that an arrow is *present*. It does not record
  that the arrow can ever return false. Under that definition a verifier
  which answers `true` on every input is a conformant realization, which is
  the defect this file removes.

  First-principles constructors only; consequences are `rfl` or `cases`+`rfl`.
-/

namespace ProofBundle.Falsifiable

/-- A test is refutable when some input drives it to `false`.
    A test nothing can fail transmits no information about its input. -/
def Refutable (t : Bool → Bool) : Prop := ∃ b, t b = false

/-- Always accepts. The shape of a self-certifying verifier. -/
def vacuous : Bool → Bool := fun _ => true

/-- Always rejects. Equally uninformative, and included so the failure is
    characterised as "constant", not as "optimistic". -/
def obstinate : Bool → Bool := fun _ => false

/-- Reports its input. The minimal honest verifier. -/
def honest : Bool → Bool := fun b => b

theorem honest_refutable : Refutable honest := ⟨false, rfl⟩

theorem obstinate_refutable : Refutable obstinate := ⟨true, rfl⟩

theorem vacuous_not_refutable : ¬ Refutable vacuous := by
  intro h
  obtain ⟨b, hb⟩ := h
  exact Bool.noConfusion hb

/-- Refutability is not sufficient on its own: `obstinate` is refutable and
    still worthless. Informativeness needs both directions to be reachable. -/
def Informative (t : Bool → Bool) : Prop := (∃ b, t b = true) ∧ (∃ b, t b = false)

theorem honest_informative : Informative honest := ⟨⟨true, rfl⟩, ⟨false, rfl⟩⟩

theorem vacuous_not_informative : ¬ Informative vacuous := by
  intro h
  obtain ⟨_, b, hb⟩ := h
  exact Bool.noConfusion hb

theorem obstinate_not_informative : ¬ Informative obstinate := by
  intro h
  obtain ⟨⟨b, hb⟩, _⟩ := h
  exact Bool.noConfusion hb

end ProofBundle.Falsifiable

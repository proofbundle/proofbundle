import Lean
import «2026-09-15_SI_SECOND_KERNEL»

/-
  2026-09-15_SI_SECOND_WITNESS.lean

  One realization record judged by the kernel's `IsSecond`.

  Form-only; not a laboratory result. No CCTF, NIST, PTB, or NPL evaluation report was
  provided in the session that produced this file. Every shift and uncertainty is `zero`,
  no laboratory number appears, and the four condition reports are form choices, not data.

  Imports only the kernel. No Mathlib, no `axiom`, no `sorry`, no `native_decide`.
  Every declaration below is followed by its axiom report.
-/

set_option genInjectivity false

namespace SISecond.Witness

open SISecond

/-- Form-only; not a laboratory result. -/
def witness : Realization :=
  { species := .caesium133
    transition := ⟨.fThree, .fFour⟩
    periods := caesiumPeriodsPerSecond
    atRest := .correctedToLimit
    noStaticFields := .correctedToLimit
    noThermalRadiation := .correctedToLimit
    isolated := .correctedToLimit
    corrections :=
      [ ⟨.motion, .zero, .zero⟩, ⟨.staticFields, .zero, .zero⟩,
        ⟨.thermalRadiation, .zero, .zero⟩, ⟨.collisions, .zero, .zero⟩ ]
    sublevels := .zeroToZero }

theorem witness_isSecond : IsSecond witness := by decide

/-- Negative twin 1: one period more. -/
theorem witness_succ_periods_not_second :
    ¬ IsSecond { witness with periods := Pos.succ witness.periods } := by decide

/-- Premise of negative twin 2: at least one report is `correctedToLimit`. -/
theorem witness_has_corrected_report : witness.atRest = .correctedToLimit := by decide

/-- Negative twin 2: corrections emptied while reports say `correctedToLimit`. -/
theorem witness_empty_corrections_not_second :
    ¬ IsSecond { witness with corrections := [] } := by decide

/-- Negative twin 3: another species. -/
theorem witness_other_species_not_second :
    ¬ IsSecond { witness with species := .otherSpecies } := by decide

/-- Negative twin 4: both levels the same. -/
theorem witness_same_level_not_second :
    ¬ IsSecond { witness with transition := ⟨.fThree, .fThree⟩ } := by decide

/-- Prefix-free code of `witness.periods` only, lowest binary digit first, ending in `stop`.
Serialized in witness.json as "0", "1", and a final ".". Nothing is proved about hashing. -/
def witnessBytes : List Symbol := Pos.encode witness.periods

theorem witnessBytes_eq : witnessBytes =
    [ .digitZero, .digitOne, .digitZero, .digitOne, .digitOne, .digitZero, .digitOne,
      .digitOne, .digitOne, .digitZero, .digitOne, .digitOne, .digitZero, .digitOne,
      .digitOne, .digitZero, .digitZero, .digitZero, .digitOne, .digitOne, .digitZero,
      .digitOne, .digitOne, .digitOne, .digitOne, .digitOne, .digitZero, .digitZero,
      .digitZero, .digitOne, .digitZero, .digitZero, .digitZero, .stop ] := by decide

end SISecond.Witness

#print axioms SISecond.Witness.witness
#print axioms SISecond.Witness.witness_isSecond
#print axioms SISecond.Witness.witness_succ_periods_not_second
#print axioms SISecond.Witness.witness_has_corrected_report
#print axioms SISecond.Witness.witness_empty_corrections_not_second
#print axioms SISecond.Witness.witness_other_species_not_second
#print axioms SISecond.Witness.witness_same_level_not_second
#print axioms SISecond.Witness.witnessBytes
#print axioms SISecond.Witness.witnessBytes_eq

open Lean in
#eval show CoreM Unit from do
  let env ← getEnv
  let mut n := 0
  let mut bad := 0
  for (name, _) in env.constants.map₂.toList do
    if (`SISecond.Witness).isPrefixOf name then
      n := n + 1
      let axs ← collectAxioms name
      if !axs.isEmpty then
        bad := bad + 1
        IO.println s!"AXIOMS {name}: {axs}"
  IO.println s!"declarations under SISecond.Witness in this file: {n}; with axioms: {bad}"

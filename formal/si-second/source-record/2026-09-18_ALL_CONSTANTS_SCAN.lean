import Lean
import «2026-09-15_SI_SECOND_LEDGER»

/-
  2026-09-18_REPORT_TO_FACT.lean

  Extends the SI-second kernel with the step the kernel does not take: from a report to a fact.
  Each section states, as a theorem, one claim the reference document "Reports and Facts" makes in
  prose, together with the premise the prose leaves implicit.

    1. What the kernel's verdict depends on          (document Part VI §24, Part XXXII §218)
    2. Absence, and the coverage premise             (document Part VI §23)
    3. Attempt and outcome                           (document Part VI §24)
    4. Timestamps: the separation rule               (document Part III §12, Part IV §§13-14)
    5. Causal order and counter order                (document Part V §§18-19)

  Imports the ledger, and through it the kernel; no other library. No `axiom`, no `sorry`,
  no `native_decide`, no Mathlib. Tactics and lemmas carrying propext in Lean 4.34.0 are not
  used: section 4 avoids natural-number subtraction for that reason, and section 1 composes
  equivalences with `Iff.trans` rather than rewriting with them, since `rw` on an `Iff` goes
  through propext.
-/

set_option genInjectivity false

namespace SISecond.ReportToFact

open SISecond

/-! ## 1. What the kernel's verdict depends on

The kernel reads a realization record and returns a verdict. This section states exactly which
parts of the record the verdict is a function of, and therefore what a passing verdict does not
establish. -/

/-- The parts of a realization record that `IsSecond` reads. The reported sizes of the
corrections are absent: only which effects are listed. -/
structure CheckedFields where
  species : Species
  transition : Transition
  periods : Pos
  atRest : Report
  noStaticFields : Report
  noThermalRadiation : Report
  isolated : Report
  correctionEffects : List Effect
  deriving DecidableEq

def checked (r : Realization) : CheckedFields :=
  { species := r.species, transition := r.transition, periods := r.periods,
    atRest := r.atRest, noStaticFields := r.noStaticFields,
    noThermalRadiation := r.noThermalRadiation, isolated := r.isolated,
    correctionEffects := r.corrections.map Correction.effect }

/-- Membership of an effect in a list of corrections depends only on the effects. -/
def ListedEffect (e : Effect) : List Effect → Prop
  | [] => False
  | f :: rest => f = e ∨ ListedEffect e rest

theorem listed_iff_effects (e : Effect) :
    ∀ cs : List Correction, Listed e cs ↔ ListedEffect e (cs.map Correction.effect)
  | [] => Iff.rfl
  | c :: rest => by
      show (c.effect = e ∨ Listed e rest) ↔ (c.effect = e ∨ ListedEffect e (rest.map Correction.effect))
      exact or_congr Iff.rfl (listed_iff_effects e rest)

theorem addressed_congr (rep : Report) (e : Effect) (cs ds : List Correction)
    (h : cs.map Correction.effect = ds.map Correction.effect) :
    Addressed rep e cs ↔ Addressed rep e ds := by
  cases rep with
  | heldAtLimit => exact Iff.rfl
  | correctedToLimit =>
      show Listed e cs ↔ Listed e ds
      exact Iff.trans (listed_iff_effects e cs)
        (Iff.trans (Iff.of_eq (congrArg (ListedEffect e) h))
          (Iff.symm (listed_iff_effects e ds)))
  | notControlled => exact Iff.rfl

theorem form_congr (r s : Realization)
    (hsp : r.species = s.species) (htr : r.transition = s.transition)
    (h1 : r.atRest = s.atRest) (h2 : r.noStaticFields = s.noStaticFields)
    (h3 : r.noThermalRadiation = s.noThermalRadiation) (h4 : r.isolated = s.isolated)
    (hce : r.corrections.map Correction.effect = s.corrections.map Correction.effect) :
    MeetsDefinitionForm r ↔ MeetsDefinitionForm s := by
  unfold MeetsDefinitionForm
  rw [hsp, htr, h1, h2, h3, h4]
  exact and_congr Iff.rfl (and_congr Iff.rfl
    (and_congr (addressed_congr _ _ _ _ hce)
      (and_congr (addressed_congr _ _ _ _ hce)
        (and_congr (addressed_congr _ _ _ _ hce) (addressed_congr _ _ _ _ hce)))))

/-- The verdict is a function of the checked fields alone. Two records that agree on them
receive the same verdict, whatever else differs. -/
theorem verdict_depends_only_on_checked (r s : Realization) (h : checked r = checked s) :
    IsSecond r ↔ IsSecond s := by
  have hpe : r.periods = s.periods := congrArg CheckedFields.periods h
  have hform := form_congr r s
    (congrArg CheckedFields.species h) (congrArg CheckedFields.transition h)
    (congrArg CheckedFields.atRest h) (congrArg CheckedFields.noStaticFields h)
    (congrArg CheckedFields.noThermalRadiation h) (congrArg CheckedFields.isolated h)
    (congrArg CheckedFields.correctionEffects h)
  show (MeetsDefinitionForm r ∧ r.periods = periodsFor .one)
     ↔ (MeetsDefinitionForm s ∧ s.periods = periodsFor .one)
  rw [hpe]
  exact and_congr hform Iff.rfl

/-- Changing every reported correction value, while listing the same effects, cannot change
the verdict. -/
theorem verdict_blind_to_reported_values (r : Realization) (cs : List Correction)
    (h : cs.map Correction.effect = r.corrections.map Correction.effect) :
    IsSecond { r with corrections := cs } ↔ IsSecond r := by
  apply verdict_depends_only_on_checked
  show CheckedFields.mk r.species r.transition r.periods r.atRest r.noStaticFields
      r.noThermalRadiation r.isolated (cs.map Correction.effect)
    = CheckedFields.mk r.species r.transition r.periods r.atRest r.noStaticFields
      r.noThermalRadiation r.isolated (r.corrections.map Correction.effect)
  rw [h]

/-! ### A record the kernel accepts and no laboratory would

Every correction below reports a fractional frequency shift of one part in ten, which is about
fourteen orders of magnitude larger than any real caesium correction. The values are chosen to be
impossible, not to represent measurements. The kernel accepts the record, because the effects are
listed and the count is right. -/

def impossibleBudget : List Correction :=
  [ ⟨.motion, .nonzero .plus .one .one, .zero⟩,
    ⟨.staticFields, .nonzero .plus .one .one, .zero⟩,
    ⟨.thermalRadiation, .nonzero .plus .one .one, .zero⟩,
    ⟨.collisions, .nonzero .plus .one .one, .zero⟩ ]

theorem impossible_budget_accepted :
    IsSecond { formOnlyRecord with corrections := impossibleBudget } := by decide

theorem impossible_and_zero_budgets_agree :
    IsSecond { formOnlyRecord with corrections := impossibleBudget } ↔ IsSecond formOnlyRecord := by
  decide

/-! ## 2. Absence, and the coverage premise

A record holds an item only if the item occurred and the surface covers it. Absence from the
record therefore supports a claim about the world only under a coverage premise, which is stated
here as a hypothesis rather than assumed. -/

inductive Item : Type where
  | inScope : Item
  | outOfScope : Item
  deriving DecidableEq

/-- What a surface records: the items that occurred and that it covers. -/
def recorded (world cover : Item → Bool) (i : Item) : Bool := world i && cover i

def coverInScopeOnly : Item → Bool
  | .inScope => true
  | .outOfScope => false

def nothingOccurred : Item → Bool := fun _ => false

def outOfScopeOccurred : Item → Bool
  | .inScope => false
  | .outOfScope => true

/-- Without coverage, absence from the record does not determine absence in the world: two
worlds that differ on what happened produce the same record. -/
theorem absence_underdetermines_world :
    (∀ i, recorded nothingOccurred coverInScopeOnly i
        = recorded outOfScopeOccurred coverInScopeOnly i)
    ∧ nothingOccurred .outOfScope ≠ outOfScopeOccurred .outOfScope := by
  constructor
  · intro i; cases i <;> rfl
  · decide

/-- With coverage of the item, absence from the record does determine absence in the world. -/
theorem absence_with_coverage (world cover : Item → Bool) (i : Item)
    (hc : cover i = true) (h : recorded world cover i = false) : world i = false := by
  unfold recorded at h
  rw [hc, Bool.and_true] at h
  exact h

/-! ## 3. Attempt and outcome

A report of completion is one bit; the state the operation was to produce is another. Nothing
connects them without a premise about the reporting code. -/

structure Run where
  reportedOk : Bool
  stateChanged : Bool
  deriving DecidableEq

theorem report_underdetermines_outcome :
    ∃ x y : Run, x.reportedOk = y.reportedOk ∧ x.stateChanged ≠ y.stateChanged :=
  ⟨⟨true, true⟩, ⟨true, false⟩, rfl, by decide⟩

/-! ## 4. Timestamps: the separation rule

A reading is within `bound` of the instant at which it was taken, where `bound` covers the clock's
offset and the synchronization error. The document states that order must not be read off
timestamps; the two theorems below give the condition under which it may be, and show the
condition is sharp.

Readings and instants are counts in whatever unit the clock ticks; for a clock counting caesium
periods, they are period counts. -/

structure Within (bound reading instant : Nat) : Prop where
  instantLow : instant ≤ reading + bound
  readingLow : reading ≤ instant + bound

/-- Separation rule. If two readings differ by more than twice the bound, then every pair of
instants consistent with those readings is in the same order as the readings. -/
theorem order_determined {bound r₁ r₂ t₁ t₂ : Nat}
    (h₁ : Within bound r₁ t₁) (h₂ : Within bound r₂ t₂)
    (hsep : r₁ + (bound + bound) < r₂) : t₁ < t₂ := by
  have step : r₁ + bound + bound < t₂ + bound := by
    rw [Nat.add_assoc]
    exact Nat.lt_of_lt_of_le hsep h₂.readingLow
  exact Nat.lt_of_le_of_lt h₁.instantLow (Nat.lt_of_add_lt_add_right step)

/-- The rule is sharp. Inside twice the bound, instants exist that are consistent with the same
two readings and run opposite to them: the later reading belongs to the earlier instant.
`k` is the earlier instant, given additively so that no subtraction is needed. -/
theorem order_not_determined {bound r₁ r₂ k : Nat}
    (hk : bound + k = r₂) (hnear : r₂ < r₁ + (bound + bound)) :
    Within bound r₁ (r₁ + bound) ∧ Within bound r₂ k ∧ k < r₁ + bound := by
  refine ⟨⟨Nat.le_refl _, ?_⟩, ⟨?_, ?_⟩, ?_⟩
  · exact Nat.le_trans (Nat.le_add_right r₁ bound) (Nat.le_add_right _ bound)
  · have hkr : k ≤ r₂ := by
      rw [← hk]
      exact Nat.le_add_left k bound
    exact Nat.le_trans hkr (Nat.le_add_right r₂ bound)
  · rw [← hk, Nat.add_comm bound k]
    exact Nat.le_refl _
  · apply Nat.lt_of_add_lt_add_right (n := bound)
    rw [Nat.add_comm k bound, hk, Nat.add_assoc]
    exact hnear

/-- Readings 10 and 25 with a bound of 5: the order of the readings is the order of the instants. -/
theorem separated_example {t₁ t₂ : Nat} (h₁ : Within 5 10 t₁) (h₂ : Within 5 25 t₂) : t₁ < t₂ :=
  order_determined h₁ h₂ (by decide)

/-- Readings 10 and 12 with a bound of 5: instants 15 and 7 are consistent with both readings,
and they run opposite to the readings. -/
theorem unseparated_example : Within 5 10 15 ∧ Within 5 12 7 ∧ 7 < 15 :=
  order_not_determined (bound := 5) (r₁ := 10) (r₂ := 12) (k := 7) (by decide) (by decide)

/-! ## 5. Causal order and counter order

A counter that increases along the edges of an execution increases along the causal order it
generates. The converse fails: the counter's order between events with no causal path is an
artifact of the counter, not a fact about the execution. -/

inductive Ev : Type where
  | p1a : Ev
  | p1b : Ev
  | p2a : Ev
  | p2b : Ev
  deriving DecidableEq

/-- One execution: two processes, two local steps each, no messages. -/
inductive Before : Ev → Ev → Prop where
  | step1 : Before .p1a .p1b
  | step2 : Before .p2a .p2b
  | trans : Before x y → Before y z → Before x z

def processOf : Ev → Bool
  | .p1a => true
  | .p1b => true
  | .p2a => false
  | .p2b => false

/-- Any counter that increases along the two edges increases along the whole causal order. -/
theorem counter_monotone (C : Ev → Nat) (h1 : C .p1a < C .p1b) (h2 : C .p2a < C .p2b) :
    ∀ x y, Before x y → C x < C y := by
  intro x y h
  induction h with
  | step1 => exact h1
  | step2 => exact h2
  | trans _ _ ih₁ ih₂ => exact Nat.lt_trans ih₁ ih₂

/-- In this execution the causal order never crosses between processes. -/
theorem before_same_process : ∀ x y, Before x y → processOf x = processOf y := by
  intro x y h
  induction h with
  | step1 => rfl
  | step2 => rfl
  | trans _ _ ih₁ ih₂ => exact Eq.trans ih₁ ih₂

theorem concurrent_events : ¬ Before .p1b .p2a ∧ ¬ Before .p2a .p1b := by
  constructor
  · intro h; exact absurd (before_same_process _ _ h) (by decide)
  · intro h; exact absurd (before_same_process _ _ h) (by decide)

def counterA : Ev → Nat
  | .p1a => 1
  | .p1b => 2
  | .p2a => 3
  | .p2b => 4

def counterB : Ev → Nat
  | .p1a => 3
  | .p1b => 4
  | .p2a => 1
  | .p2b => 2

/-- Both counters satisfy the same edge conditions, so both are monotone along the causal order,
and they order the two concurrent events oppositely. A comparison of counter values between
events with no causal path is therefore not a causal fact. -/
theorem counter_order_is_not_causal_order :
    (counterA .p1a < counterA .p1b ∧ counterA .p2a < counterA .p2b)
    ∧ (counterB .p1a < counterB .p1b ∧ counterB .p2a < counterB .p2b)
    ∧ counterA .p1b < counterA .p2a
    ∧ counterB .p2a < counterB .p1b := by decide

end SISecond.ReportToFact

#print axioms SISecond.ReportToFact.listed_iff_effects
#print axioms SISecond.ReportToFact.addressed_congr
#print axioms SISecond.ReportToFact.form_congr
#print axioms SISecond.ReportToFact.verdict_depends_only_on_checked
#print axioms SISecond.ReportToFact.verdict_blind_to_reported_values
#print axioms SISecond.ReportToFact.impossible_budget_accepted
#print axioms SISecond.ReportToFact.impossible_and_zero_budgets_agree
#print axioms SISecond.ReportToFact.absence_underdetermines_world
#print axioms SISecond.ReportToFact.absence_with_coverage
#print axioms SISecond.ReportToFact.report_underdetermines_outcome
#print axioms SISecond.ReportToFact.order_determined
#print axioms SISecond.ReportToFact.order_not_determined
#print axioms SISecond.ReportToFact.separated_example
#print axioms SISecond.ReportToFact.unseparated_example
#print axioms SISecond.ReportToFact.counter_monotone
#print axioms SISecond.ReportToFact.before_same_process
#print axioms SISecond.ReportToFact.concurrent_events
#print axioms SISecond.ReportToFact.counter_order_is_not_causal_order

open Lean in
#eval show CoreM Unit from do
  let env ← getEnv
  let mut n := 0; let mut bad := 0
  for (name, _) in env.constants.map₂.toList do
    if (`SISecond.ReportToFact).isPrefixOf name then
      n := n + 1
      let axs ← collectAxioms name
      IO.println s!"{name}: axioms {axs}"
      if !axs.isEmpty then bad := bad + 1
  IO.println s!"declarations under SISecond.ReportToFact: {n}; with axioms: {bad}"

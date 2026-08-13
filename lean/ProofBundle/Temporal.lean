/-
  Temporal predicates: a commitment is binding only if it precedes the
  observation it commits to.

  `Loop.compare committed worldMatch` is a static conjunction. Nothing in it
  forces `committed` to have been fixed before `worldMatch` was available, so
  an agent that seals its claim *after* seeing the world satisfies it exactly
  as well as one that predicted. This file makes that distinction structural
  rather than procedural.

  First-principles constructors only; consequences are `rfl` or `cases`+`rfl`.
-/

namespace ProofBundle.Temporal

inductive Phase where
  | commit    -- claim is sealed; the world is not yet visible
  | observe   -- the world becomes visible
  | compare   -- sealed claim is checked against the world
  deriving DecidableEq, Repr

def rank : Phase → Nat
  | .commit  => 0
  | .observe => 1
  | .compare => 2

/-- Strict precedence. Bool-valued so it composes with the Loop realization. -/
def before (p q : Phase) : Bool := Nat.blt (rank p) (rank q)

theorem commit_before_observe  : before .commit .observe  = true := rfl
theorem observe_before_compare : before .observe .compare = true := rfl
theorem commit_before_compare  : before .commit .compare  = true := rfl

/-- The world cannot be observed before the claim is sealed. -/
theorem no_postdiction : before .observe .commit = false := rfl

theorem irreflexive (p : Phase) : before p p = false := by
  cases p <;> rfl

theorem asymmetric (p q : Phase) : before p q = true → before q p = false := by
  cases p <;> cases q <;> intro h <;> first | rfl | exact Bool.noConfusion h

theorem transitive (p q r : Phase) :
    before p q = true → before q r = true → before p r = true := by
  cases p <;> cases q <;> cases r <;> intro h1 h2 <;>
    first | rfl | exact Bool.noConfusion h1 | exact Bool.noConfusion h2

/-- A claim together with the phase at which it was sealed. The phase is
    carried, not asserted, so it cannot be reported after the fact. -/
structure Sealed where
  phase : Phase
  claim : Bool
  deriving Repr

/-- Only a claim sealed at `commit` is a prediction. -/
def isPrediction (s : Sealed) : Bool :=
  match s.phase with
  | .commit => true
  | _       => false

/-- A verdict counts only when the claim was a genuine prediction, the test
    that judged it returned true, and the world agreed. -/
def soundVerdict (s : Sealed) (t : Bool → Bool) (worldMatch : Bool) : Bool :=
  isPrediction s && t s.claim && worldMatch

theorem prediction_can_be_sound :
    soundVerdict ⟨.commit, true⟩ (fun b => b) true = true := rfl

/-- The central result: sealing after the world is visible yields no sound
    verdict, for *any* claim, *any* test, and *any* state of the world. -/
theorem postdiction_never_sound (c w : Bool) (t : Bool → Bool) :
    soundVerdict ⟨.observe, c⟩ t w = false := rfl

theorem comparison_time_never_sound (c w : Bool) (t : Bool → Bool) :
    soundVerdict ⟨.compare, c⟩ t w = false := rfl

/-- Restated over the sealing phase itself: soundness requires the seal to
    precede observation. -/
theorem sound_requires_precedence (s : Sealed) (t : Bool → Bool) (w : Bool) :
    soundVerdict s t w = true → before s.phase .observe = true := by
  cases s with
  | mk p c => cases p <;> intro h <;> first | rfl | exact Bool.noConfusion h

end ProofBundle.Temporal

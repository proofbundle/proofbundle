-- SPDX-License-Identifier: GPL-3.0-or-later
/-
  Conformance: what the signature-level result can and cannot establish.

  `Loop.machine_eq_loop` shows two realizations agree on every arrow. That is
  necessary and not sufficient: `Realization` is `Arrow → Bool`, so it records
  presence, not refutability. This file locates the boundary exactly.
-/
import ProofBundle.Loop
import ProofBundle.Falsifiable
import ProofBundle.Temporal

open ProofBundle.Loop ProofBundle.Falsifiable ProofBundle.Temporal

namespace ProofBundle.Conformance

/-- The hook, strengthened to demand a genuine prediction. -/
def soundHook (r : Realization) (s : Sealed) (t : Bool → Bool) (w : Bool) : Bool :=
  has r .reenter && soundVerdict s t w

theorem soundHook_loop : soundHook loopFull ⟨.commit, true⟩ honest true = true := rfl

/-- No `reenter` arrow: the hook cannot fire even on a genuine prediction. -/
theorem soundHook_html : soundHook htmlPrefix ⟨.commit, true⟩ honest true = false := rfl

/-- Full signature present, but the claim was sealed after observation. -/
theorem soundHook_postdiction (w : Bool) (t : Bool → Bool) :
    soundHook loopFull ⟨.observe, true⟩ t w = false := rfl

/-- The uncomfortable one. Every Bool-level check passes for a verifier that
    accepts unconditionally: the arrow is present, the phase is `commit`, the
    world agrees, and the verdict is `true`. -/
theorem soundHook_admits_vacuous :
    soundHook loopFull ⟨.commit, true⟩ vacuous true = true := rfl

/-- Hence conformance cannot be decided by running the signature check alone.
    It carries a proof obligation about the verifier itself. -/
def Conformant (r : Realization) (t : Bool → Bool) : Prop :=
  fullSignature r = true ∧ Informative t

theorem conformant_loop_honest : Conformant loopFull honest :=
  ⟨rfl, honest_informative⟩

/-- All eight arrows present, and still not conformant, because the verifier
    cannot fail. This is the formal statement of why a self-report is worth
    nothing regardless of how complete the surrounding architecture is. -/
theorem loop_with_vacuous_not_conformant : ¬ Conformant loopFull vacuous := by
  intro h
  exact vacuous_not_informative h.2

/-- And the converse lesion: an honest verifier inside an open loop is also
    not conformant. Both halves are load-bearing. -/
theorem html_with_honest_not_conformant : ¬ Conformant htmlPrefix honest := by
  intro h
  exact Bool.noConfusion h.1

end ProofBundle.Conformance

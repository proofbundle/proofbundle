(* ========================================================================== *)
(* Irreversibility — A Theory of One-Way Doors and Option Preservation          *)
(* Part of the Cartography of Broke Systems                                   *)
(* ========================================================================== *)

From Coq Require Import Reals.
From Coq Require Import List.
From Coq Require Import ZArith.
From Coq Require Import Classical.
From Coq Require Import Lra.

Import ListNotations.
Open Scope Z_scope.
Open Scope R_scope.

(* -------------------------------------------------------------------------- *)
(* Preamble: The Hard Boundary                                                *)
(* -------------------------------------------------------------------------- *)
(*                                                                            *)
(* A reversible error is expensive. An irreversible error edits the           *)
(* reachable future. That is a categorical difference. Once a transition      *)
(* destroys the conditions under which correction could occur, the ordinary   *)
(* logic of experimentation, adaptation, and learning breaks.                 *)
(*                                                                            *)
(* The system has not merely learned badly. It has amputated its own          *)
(* possibility set.                                                           *)
(*                                                                            *)
(* This module formalizes:                                                    *)
(*   1. Irreversible transitions—one-way doors in state space                 *)
(*   2. Option value—the preservation of future choice                        *)
(*   3. Reachability topology—what futures remain accessible                  *)
(*   4. Asymmetric governance—different burdens of proof under irreversibility *)
(*   5. Structural defeat—failure before visible collapse                     *)
(*                                                                            *)
(* -------------------------------------------------------------------------- *)

(* -------------------------------------------------------------------------- *)
(* Section 1: The Nature of Irreversibility                                   *)
(* -------------------------------------------------------------------------- *)

Parameter State : Type.
Parameter Transition : Type.
Parameter apply_transition : Transition -> State -> State.

(* Reversibility: can return to previous state *)
Definition reversible 
  (t : Transition) (s : State) : Prop :=
  exists t',
    apply_transition t' (apply_transition t s) = s.

(* Irreversibility: no return path exists *)
Definition irreversible 
  (t : Transition) (s : State) : Prop :=
  ~ reversible t s.

(* Degree of irreversibility: how much of state space becomes inaccessible *)
Parameter reachability_loss : Transition -> State -> R.

Axiom reachability_loss_nonneg :
  forall t s, reachability_loss t s >= 0.

Axiom reversible_zero_loss :
  forall t s,
    reversible t s -> reachability_loss t s = 0.

(* The irreversibility threshold: beyond this, special governance applies *)
Parameter irreversibility_threshold : R.
Axiom threshold_positive : irreversibility_threshold > 0.

(* One-way door: transition exceeds irreversibility threshold *)
Definition one_way_door (t : Transition) (s : State) : Prop :=
  irreversible t s /\
  reachability_loss t s >= irreversibility_threshold.

(* -------------------------------------------------------------------------- *)
(* Section 2: Reachability Topology                                           *)
(* -------------------------------------------------------------------------- *)

(* Reachable states from current position *)
Inductive reachable_from : State -> State -> Prop :=
  | Reach_refl : forall s, reachable_from s s
  | Reach_step : forall s1 s2 t,
      reachable_from s1 s2 ->
      reachable_from s1 (apply_transition t s2).

(* Future state space: all reachable states *)
Definition future_space (s : State) : State -> Prop :=
  reachable_from s.

(* Option set: available future transitions *)
Definition option_set (s : State) : Transition -> Prop :=
  fun t => exists s', reachable_from s (apply_transition t s').

(* Option value: measure of preserved choice *)
Parameter option_value : State -> R.

Axiom option_value_nonneg : forall s, option_value s >= 0.

(* Theorem: Irreversible transitions reduce option value *)
Theorem irreversibility_reduces_options :
  forall t s,
    irreversible t s ->
    option_value (apply_transition t s) < option_value s.
Proof.
  admit.
Admitted.

(* Path closure: future space contracts *)
Definition path_closure 
  (s_before s_after : State) : Prop :=
  forall s_future,
    reachable_from s_after s_future ->
    reachable_from s_before s_future.

(* Theorem: One-way doors create path closure *)
Theorem one_way_door_path_closure :
  forall t s,
    one_way_door t s ->
    path_closure s (apply_transition t s).
Proof.
  admit.
Admitted.

(* -------------------------------------------------------------------------- *)
(* Section 3: Structural Defeat—Failure Before Visible Collapse               *)
(* -------------------------------------------------------------------------- *)

(* Structural defeat: system has crossed recoverability boundary *)
Definition structural_defeat 
  (s_current s_critical : State) : Prop :=
  reachable_from s_current s_critical /\
  (* From critical state, recovery is impossible *)
  ~ exists s_recover,
    viable s_recover /\
    reachable_from s_critical s_recover.

Parameter viable : State -> Prop.

(* Observable collapse: visible system failure *)
Definition observable_collapse (s : State) : Prop :=
  ~ viable s.

(* Theorem: Structural defeat precedes observable collapse *)
Theorem defeat_precedes_collapse :
  forall s_current s_critical,
    structural_defeat s_current s_critical ->
    (* Current state may still appear viable *)
    viable s_current /\
    (* But collapse is structurally locked in *)
    forall s_future,
      reachable_from s_current s_future ->
      reachable_from s_critical s_future ->
      observable_collapse s_future.
Proof.
  admit.
Admitted.

(* Early warning: detection before point of no return *)
Definition early_warning_possible 
  (s : State) (warning_system : State -> Prop) : Prop :=
  forall s_critical,
    structural_defeat s s_critical ->
    (* Warning fires before critical threshold *)
    exists s_warn,
      reachable_from s s_warn /\
      reachable_from s_warn s_critical /\
      warning_system s_warn /\
      recoverable_from s_warn.

Parameter recoverable_from : State -> Prop.

(* Theorem: Early warning requires monitoring recoverability, not just viability *)
Theorem early_warning_requires_recoverability_monitoring :
  forall warning_system,
    (forall s, warning_system s -> ~ viable s) ->
    (* Warning only fires at collapse—too late *)
    ~ exists s, early_warning_possible s warning_system.
Proof.
  admit.
Admitted.

(* -------------------------------------------------------------------------- *)
(* Section 4: Asymmetric Governance                                           *)
(* -------------------------------------------------------------------------- *)

(* Standard governance: symmetric evaluation of options *)
Definition symmetric_evaluation 
  (outcomes : list (Transition * R)) : Transition :=
  (* Choose transition maximizing expected value *)
  max_expected_value outcomes.

Parameter max_expected_value : list (Transition * R) -> Transition.

(* Asymmetric governance: different burdens under irreversibility *)
Definition asymmetric_governance
  (t : Transition) (s : State)
  (upside : R) (downside : R)
  (irreversibility : R) : bool :=
  if irreversibility > irreversibility_threshold then
    (* High burden: upside must justify permanent loss *)
    upside > downside * asymmetry_factor /\
    preserves_recovery_topology t s
  else
    (* Standard burden: symmetric comparison *)
    upside >= downside.

Parameter asymmetry_factor : R.
Axiom asymmetry_factor_gt_1 : asymmetry_factor > 1.
Parameter preserves_recovery_topology : Transition -> State -> Prop.

(* Precautionary principle: avoid action under uncertainty and irreversibility *)
Definition precautionary_principle
  (t : Transition) (s : State)
  (uncertainty : R) : bool :=
  irreversible t s /\
  uncertainty > uncertainty_threshold ->
  (* Action prohibited unless necessity proven *)
  ~ necessary_action t s.

Parameter uncertainty_threshold : R.
Parameter necessary_action : Transition -> State -> Prop.

(* Theorem: Asymmetric governance preserves option value *)
Theorem asymmetric_governance_preserves_options :
  forall s policy,
    (forall t,
      policy s = Some t ->
      asymmetric_governance t s 
        (upside t s) (downside t s) (reachability_loss t s) = true) ->
    option_value_preserved s policy.

Parameter upside downside : Transition -> State -> R.
Parameter option_value_preserved : State -> (State -> option Transition) -> Prop.

Proof.
  admit.
Admitted.

(* -------------------------------------------------------------------------- *)
(* Section 5: Information-Seeking Under Bounded Exposure                      *)
(* -------------------------------------------------------------------------- *)

(* Probe: small experiment to gain information *)
Definition probe 
  (t_probe : Transition) (s : State) : Prop :=
  (* Probe has bounded downside *)
  max_loss t_probe s <= probe_threshold /\
  (* Probe provides information *)
  information_gain t_probe s > 0.

Parameter max_loss : Transition -> State -> R.
Parameter probe_threshold : R.
Parameter information_gain : Transition -> State -> R.

(* Staged commitment: gradual rather than immediate full commitment *)
Definition staged_commitment
  (transitions : list Transition) (s : State) : State :=
  fold_left (fun s t => 
    if checkpoint_passed s t then
      apply_transition t s
    else
      s)
    transitions s.

Parameter checkpoint_passed : State -> Transition -> Prop.

(* Sandbox trial: test action in isolated environment *)
Definition sandbox_trial
  (t : Transition) (s : State) : option Transition :=
  if safe_to_simulate t s then
    Some (simulate_transition t s)
  else
    None.

Parameter safe_to_simulate : Transition -> State -> Prop.
Parameter simulate_transition : Transition -> State -> Transition.

(* Theorem: Information-seeking dominates optimization under high irreversibility *)
Theorem information_seeking_dominates :
  forall s uncertainty irreversibility,
    uncertainty > high_uncertainty_threshold ->
    irreversibility > high_irreversibility_threshold ->
    exists probe_action,
      value_of_information probe_action s >
      direct_optimization_value s.

Parameter high_uncertainty_threshold : R.
Parameter high_irreversibility_threshold : R.
Parameter value_of_information : Transition -> State -> R.
Parameter direct_optimization_value : State -> R.

Proof.
  admit.
Admitted.

(* -------------------------------------------------------------------------- *)
(* Section 6: Comparing Irreversibilities—Action vs Inaction                  *)
(* -------------------------------------------------------------------------- *)

(* Waiting can also be irreversible: windows close, resources decay *)
Definition delay_irreversible 
  (delay : R) (s : State) : Prop :=
  exists t_opportunity,
    opportunity_window t_opportunity s /\
    delay > window_duration t_opportunity.

Parameter opportunity_window : Transition -> State -> Prop.
Parameter window_duration : Transition -> State -> R.

(* Compare irreversibilities: which closes more paths? *)
Definition compare_irreversibilities
  (action : Transition) (delay : R) (s : State) : comparison :=
  let action_loss := reachability_loss action s in
  let delay_loss := opportunity_cost delay s in
  if action_loss < delay_loss then
    Lt
  else if action_loss > delay_loss then
    Gt
  else
    Eq.

Parameter opportunity_cost : R -> State -> R.

Inductive comparison := Lt | Eq | Gt.

(* Theorem: Under uncertainty, compare future option preservation *)
Theorem compare_by_option_preservation :
  forall action delay s,
    uncertainty s > 0 ->
    (option_value (apply_transition action s) >
     option_value (delayed_state delay s) ->
     compare_irreversibilities action delay s = Lt) /\
    (option_value (apply_transition action s) <
     option_value (delayed_state delay s) ->
     compare_irreversibilities action delay s = Gt).

Parameter uncertainty : State -> R.
Parameter delayed_state : R -> State -> State.

Proof.
  admit.
Admitted.

(* -------------------------------------------------------------------------- *)
(* Section 7: Nested Irreversibilities—Meta-Level One-Way Doors               *)
(* -------------------------------------------------------------------------- *)

(* Some irreversibilities are meta-level: they affect future decision-making *)
Definition meta_irreversible
  (t : Transition) (s : State) : Prop :=
  irreversible t s /\
  (* Transition affects reference update procedure *)
  affects_reference_update t s.

Parameter affects_reference_update : Transition -> State -> Prop.

(* Corruption of reference-update procedure is the deepest irreversibility *)
Definition reference_procedure_corrupted 
  (s : State) : Prop :=
  exists t,
    meta_irreversible t s /\
    (* The transition corrupts legitimacy of future revision *)
    ~ legitimate_revision_possible (apply_transition t s).

Parameter legitimate_revision_possible : State -> Prop.

(* Theorem: Meta-irreversibility is the most dangerous form *)
Theorem meta_irreversibility_most_dangerous :
  forall t s,
    meta_irreversible t s ->
    (* Destroys not just current options but future capacity to choose *)
    correction_capacity (apply_transition t s) = 0 /\
    correction_capacity s > 0.

Parameter correction_capacity : State -> R.

Proof.
  admit.
Admitted.

(* Hierarchy of irreversibilities by severity *)
Inductive IrreversibilityLevel : Type :=
  | IL_Reversible      (* No permanent loss *)
  | IL_StateLoss       (* State space reduced *)
  | IL_OptionLoss      (* Future choices reduced *)
  | IL_RecoveryLoss    (* Recovery paths destroyed *)
  | IL_ReferenceLoss   (* Reference criteria corrupted *)
  | IL_MetaLoss        (* Meta-decision capacity destroyed *).

(* Severity ordering *)
Definition irreversibility_severity (il : IrreversibilityLevel) : nat :=
  match il with
  | IL_Reversible => 0
  | IL_StateLoss => 1
  | IL_OptionLoss => 2
  | IL_RecoveryLoss => 3
  | IL_ReferenceLoss => 4
  | IL_MetaLoss => 5
  end.

(* -------------------------------------------------------------------------- *)
(* Section 8: The Irreversibility Cartography                                 *)
(* -------------------------------------------------------------------------- *)

Record IrreversibilityCartography : Type := mkIrreversibilityCartography {
  ic_transitions : list Transition;
  ic_states : list State;
  
  (* Classification of transitions by irreversibility *)
  ic_reversible : list Transition;
  ic_one_way_doors : list Transition;
  ic_meta_irreversible : list Transition;
  
  (* Assessment of states *)
  ic_structurally_defeated : list State;
  ic_high_option_value : list State;
  ic_corrupted_reference : list State;
  
  (* Safeguards in place *)
  ic_asymmetric_governance : list (State * Transition);
  ic_probing_policies : list State;
  ic_staged_commitments : list (State * list Transition)
}.

(* Comprehensive irreversibility risk assessment *)
Definition irreversibility_risk
  (ic : IrreversibilityCartography) (s : State) (t : Transition) : R :=
  if In t (ic_meta_irreversible ic) then
    1.0  (* Maximum risk *)
  else if In t (ic_one_way_doors ic) then
    0.7 + 0.3 * (reachability_loss t s / max_reachability)
  else if In t (ic_reversible ic) then
    0.1
  else
    0.5.  (* Unknown—treat as moderate risk *)

Parameter max_reachability : R.

(* ========================================================================== *)
(* End of Irreversibility.v                                                   *)
(* ========================================================================== *)

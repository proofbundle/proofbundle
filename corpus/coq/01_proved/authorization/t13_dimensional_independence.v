(** ================================================================ *)
(** genophylaxis_gpx_dimensional_independence.v                       *)
(**                                                                    *)
(** T13 Authorization Gate Dimensional Independence                    *)
(** T15 Selective Failure Defense                                      *)
(** T19 Five-Gate Dimensional Independence                             *)
(**                                                                    *)
(** Self-contained. Zero axioms, zero admits, zero sorry.              *)
(** ================================================================ *)

Require Import ZArith.
Require Import List.
Require Import Bool.
Require Import Lia.
Import ListNotations.

(* ================================================================ *)
(* §I. PRODUCT LATTICE OF FIVE INDEPENDENT BOOLEAN GATES              *)
(*                                                                    *)
(* The authorization gate is a product of five boolean components,   *)
(* one per dimension. Independence is the structural claim that the  *)
(* product gate factors: each gate decision is a function of its     *)
(* own component only.                                                *)
(* ================================================================ *)

Inductive Dim : Type := D1 | D2 | D3 | D4 | D5.

Definition Dim_eqb (d1 d2 : Dim) : bool :=
  match d1, d2 with
  | D1, D1 | D2, D2 | D3, D3 | D4, D4 | D5, D5 => true
  | _, _ => false
  end.

Lemma Dim_eqb_refl : forall d, Dim_eqb d d = true.
Proof. destruct d; reflexivity. Qed.

Lemma Dim_eqb_eq : forall d1 d2, Dim_eqb d1 d2 = true -> d1 = d2.
Proof. destruct d1, d2; simpl; intro H; (reflexivity || discriminate). Qed.

Lemma Dim_eqb_neq : forall d1 d2, d1 <> d2 -> Dim_eqb d1 d2 = false.
Proof. destruct d1, d2; simpl; intro H; try reflexivity; exfalso; apply H; reflexivity. Qed.

(** A gate vector is a function Dim -> bool. Equivalent to a 5-tuple
    but lets us index uniformly. *)
Definition Gate := Dim -> bool.

(** Update one component of a gate. *)
Definition gate_set (g : Gate) (d : Dim) (v : bool) : Gate :=
  fun d' => if Dim_eqb d d' then v else g d'.

(* ================================================================ *)
(* §II. T13 — AUTHORIZATION GATE DIMENSIONAL INDEPENDENCE             *)
(*                                                                    *)
(* Strong form: updating dimension d does not affect any d' /= d.    *)
(* Quantified over all dimension pairs in a single theorem.          *)
(* ================================================================ *)

Theorem T13_dimensional_independence :
  forall (g : Gate) (d d' : Dim) (v : bool),
    d <> d' -> gate_set g d v d' = g d'.
Proof.
  intros g d d' v Hneq. unfold gate_set.
  rewrite Dim_eqb_neq; [reflexivity|exact Hneq].
Qed.

(** Updating dimension d does set d to v. The companion identity. *)
Theorem T13_set_hits_target :
  forall (g : Gate) (d : Dim) (v : bool),
    gate_set g d v d = v.
Proof.
  intros. unfold gate_set. rewrite Dim_eqb_refl. reflexivity.
Qed.

(** Two independent updates commute. Direct algebraic consequence
    of independence. *)
Theorem T13_independent_updates_commute :
  forall (g : Gate) (d1 d2 : Dim) (v1 v2 : bool),
    d1 <> d2 ->
    forall d',
      gate_set (gate_set g d1 v1) d2 v2 d' =
      gate_set (gate_set g d2 v2) d1 v1 d'.
Proof.
  intros g d1 d2 v1 v2 Hneq d'. unfold gate_set.
  destruct (Dim_eqb d1 d') eqn:E1; destruct (Dim_eqb d2 d') eqn:E2;
    try reflexivity.
  apply Dim_eqb_eq in E1. apply Dim_eqb_eq in E2.
  subst. contradiction.
Qed.

(* ================================================================ *)
(* §III. T19 — FIVE-GATE DIMENSIONAL INDEPENDENCE                     *)
(*                                                                    *)
(* The composite verdict factors through the components: the         *)
(* composite is true iff every dimension's component is true.        *)
(* Decision on dimension d does not require values at other dims.    *)
(* ================================================================ *)

(** The composite verdict — meet of all five components. *)
Definition gate_verdict (g : Gate) : bool :=
  g D1 && g D2 && g D3 && g D4 && g D5.

(** §III.1. The verdict is true iff every component is true. *)
Theorem T19_verdict_factors_forward :
  forall g, (forall d, g d = true) -> gate_verdict g = true.
Proof.
  intros g Hall. unfold gate_verdict.
  rewrite (Hall D1), (Hall D2), (Hall D3), (Hall D4), (Hall D5).
  reflexivity.
Qed.

Theorem T19_verdict_factors_backward :
  forall g, gate_verdict g = true -> forall d, g d = true.
Proof.
  intros g H d. unfold gate_verdict in H.
  apply andb_true_iff in H as [H H5].
  apply andb_true_iff in H as [H H4].
  apply andb_true_iff in H as [H H3].
  apply andb_true_iff in H as [H1 H2].
  destruct d; assumption.
Qed.

Theorem T19_five_gate_independence :
  forall g, gate_verdict g = true <-> (forall d, g d = true).
Proof.
  split; [apply T19_verdict_factors_backward
        | apply T19_verdict_factors_forward].
Qed.

(** §III.2. Failure factors: verdict false iff some specific
    component is false. The witness is concrete. *)
Theorem T19_failure_witness :
  forall g, gate_verdict g = false -> exists d, g d = false.
Proof.
  intros g H. unfold gate_verdict in H.
  apply andb_false_iff in H as [H | H5].
  - apply andb_false_iff in H as [H | H4].
    + apply andb_false_iff in H as [H | H3].
      * apply andb_false_iff in H as [H1 | H2].
        -- exists D1. exact H1.
        -- exists D2. exact H2.
      * exists D3. exact H3.
    + exists D4. exact H4.
  - exists D5. exact H5.
Qed.

(** §III.3. Setting one dimension cannot rescue or destroy the
    verdict via any other dimension — every other dim's contribution
    is unchanged. *)
Theorem T19_isolated_update_effect :
  forall g d v,
    let g' := gate_set g d v in
    forall d', d' <> d -> g' d' = g d'.
Proof.
  intros g d v g' d' Hneq. unfold g', gate_set.
  rewrite Dim_eqb_neq; [reflexivity|congruence].
Qed.

(* ================================================================ *)
(* §IV. T15 — SELECTIVE FAILURE DEFENSE                               *)
(*                                                                    *)
(* Paper claim: a sandboxed failure of one component does not        *)
(* propagate to corrupt the verdict on other components.             *)
(*                                                                    *)
(* Formalization: a failure mask isolates failures to specific dims.  *)
(* The verdict on non-failed dims is exactly what it would have been *)
(* without the failure. The verdict on failed dims is forced to      *)
(* false (sandbox rejection). No cross-contamination.                 *)
(* ================================================================ *)

(** A failure mask is a set of dimensions that have failed. *)
Definition FailureMask := Dim -> bool.

(** Apply a failure mask: any failed dimension reads as false;
    others read normally. *)
Definition apply_failure (g : Gate) (fm : FailureMask) : Gate :=
  fun d => if fm d then false else g d.

(** §IV.1. Non-failed dimensions are unaffected by failures elsewhere. *)
Theorem T15_no_crosscontamination :
  forall g fm d, fm d = false -> apply_failure g fm d = g d.
Proof.
  intros. unfold apply_failure. rewrite H. reflexivity.
Qed.

(** §IV.2. Failed dimensions read false regardless of original value. *)
Theorem T15_failure_forces_reject :
  forall g fm d, fm d = true -> apply_failure g fm d = false.
Proof.
  intros. unfold apply_failure. rewrite H. reflexivity.
Qed.

(** §IV.3. Selective failure: applying a failure mask that isolates
    one dimension affects only that dimension's verdict reading. *)
Theorem T15_selective_failure_defense :
  forall g fm,
    (forall d, fm d = true -> apply_failure g fm d = false) /\
    (forall d, fm d = false -> apply_failure g fm d = g d).
Proof.
  intros g fm. split.
  - intros d Hfail. apply T15_failure_forces_reject. exact Hfail.
  - intros d Hok. apply T15_no_crosscontamination. exact Hok.
Qed.

(** §IV.4. If only one specific dimension d* fails, dimensions other
    than d* are intact. *)
Definition single_failure (d_star : Dim) : FailureMask :=
  fun d => Dim_eqb d_star d.

Theorem T15_single_failure_isolated :
  forall g d_star d,
    d <> d_star -> apply_failure g (single_failure d_star) d = g d.
Proof.
  intros g d_star d Hneq. unfold apply_failure, single_failure.
  rewrite Dim_eqb_neq; [reflexivity|congruence].
Qed.

(** §IV.5. The verdict under selective failure on d* depends on the
    other components exactly as before, multiplied by false at d*.
    A failure on one dimension yields a single false in the meet —
    the meet is false but the false is localized. *)
Theorem T15_failure_meet_localized :
  forall g d_star,
    apply_failure g (single_failure d_star) d_star = false /\
    forall d, d <> d_star ->
      apply_failure g (single_failure d_star) d = g d.
Proof.
  intros g d_star. split.
  - apply T15_failure_forces_reject. unfold single_failure.
    apply Dim_eqb_refl.
  - intros. apply T15_single_failure_isolated. assumption.
Qed.

(* ================================================================ *)
(* §V. AXIOM AUDIT                                                    *)
(* ================================================================ *)

Print Assumptions Dim_eqb_refl.
Print Assumptions Dim_eqb_eq.
Print Assumptions Dim_eqb_neq.
Print Assumptions T13_dimensional_independence.
Print Assumptions T13_set_hits_target.
Print Assumptions T13_independent_updates_commute.
Print Assumptions T19_verdict_factors_forward.
Print Assumptions T19_verdict_factors_backward.
Print Assumptions T19_five_gate_independence.
Print Assumptions T19_failure_witness.
Print Assumptions T19_isolated_update_effect.
Print Assumptions T15_no_crosscontamination.
Print Assumptions T15_failure_forces_reject.
Print Assumptions T15_selective_failure_defense.
Print Assumptions T15_single_failure_isolated.
Print Assumptions T15_failure_meet_localized.

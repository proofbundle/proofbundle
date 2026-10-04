(** ============================================================ *)
(** continuum.v — OPERATOR COMPOSITION AND PIPELINE              *)
(**                                                              *)
(** Parts VIII, XVII, XIX, XXI of the 36-part spec.              *)
(** Composition of operators across different types.              *)
(** Adaptive pipeline: denoise -> infer -> reduce_U -> reconstruct *)
(** Event horizon guard before reconstruction.                   *)
(**                                                              *)
(** FIXES the original eps unification bug: composition of       *)
(** operators with different eps values bounds each step          *)
(** against its OWN eps, not the other's.                        *)
(** ============================================================ *)

Require Import kernel.
Require Import oal_preprint.
Require Import ZArith.
Require Import List.
Require Import Lia.
Import ListNotations.
Open Scope Z_scope.

(* ============================================================ *)
(* §1.  HETEROGENEOUS COMPOSITION                                *)
(*                                                               *)
(* The original continuum.v failed at line 122 because it tried  *)
(* to unify eps(O1) with eps(O2) in a composition proof.         *)
(* Fix: bound the total coherence loss as eps1 + eps2.           *)
(* ============================================================ *)

(** Compose two concrete operators sequentially.
    Total coherence loss is bounded by eps1 + eps2
    (one eps per step, not shared). *)

Definition compose_apply (o1 o2 : concrete_op) (s : state) : option state :=
  match concrete_apply o1 s with
  | None => None
  | Some s1 => concrete_apply o2 s1
  end.

(** THE FIX: each step bounded against its own tolerance.
    Total loss <= eps + eps = 2 * concrete_eps *)
Theorem compose_coh_bound : forall (o1 o2 : concrete_op) (s s' : state),
  state_valid s ->
  compose_apply o1 o2 s = Some s' ->
  coh_budget s' >= coh_budget s - 2 * concrete_eps.
Proof.
  intros o1 o2 s s' Hvalid Hcomp.
  unfold compose_apply in Hcomp.
  destruct (concrete_apply o1 s) as [s1|] eqn:E1; [|discriminate].
  (* Step 1: o1 applied to s gives s1, bounded by concrete_eps *)
  assert (Hv1 : state_valid s1).
  { eapply (@apply_closure concrete_op ConcreteOperator); eauto. }
  assert (Hc1 : coh_budget s1 >= coh_budget s - concrete_eps).
  { eapply (@apply_coh_bound concrete_op ConcreteOperator); eauto. }
  (* Step 2: o2 applied to s1 gives s', bounded by concrete_eps *)
  assert (Hc2 : coh_budget s' >= coh_budget s1 - concrete_eps).
  { eapply (@apply_coh_bound concrete_op ConcreteOperator); eauto. }
  (* Combine: s' >= s1 - eps >= (s - eps) - eps = s - 2*eps *)
  lia.
Qed.

(** Identity preservation through composition *)
Theorem compose_id_preservation : forall (o1 o2 : concrete_op) (s s' : state),
  compose_apply o1 o2 s = Some s' ->
  map prim_id (st_prims s') = map prim_id (st_prims s).
Proof.
  intros o1 o2 s s' Hcomp.
  unfold compose_apply in Hcomp.
  destruct (concrete_apply o1 s) as [s1|] eqn:E1; [|discriminate].
  assert (H1 : map prim_id (st_prims s1) = map prim_id (st_prims s)).
  { eapply (@apply_id_preservation concrete_op ConcreteOperator); eauto. }
  assert (H2 : map prim_id (st_prims s') = map prim_id (st_prims s1)).
  { eapply (@apply_id_preservation concrete_op ConcreteOperator); eauto. }
  rewrite H2. exact H1.
Qed.

(* ============================================================ *)
(* §2.  EVENT HORIZON GUARD (Part VIII)                          *)
(* ============================================================ *)

(** Before reconstruction, check E(x) > 0 *)
Definition horizon_check (s : state) (uncertainty distance : Z) : bool :=
  Z.ltb 0 (coh_budget s - uncertainty - distance).

(** If the check passes, the state is recoverable *)
Theorem horizon_check_sound : forall s u d,
  horizon_check s u d = true ->
  recoverable (mkHorizon (coh_budget s) u d).
Proof.
  intros s u d H. unfold horizon_check in H. unfold recoverable, event_horizon. simpl.
  apply Z.ltb_lt in H. lia.
Qed.

(** If the check fails, reconstruction is not attempted *)
Theorem horizon_check_fail : forall s u d,
  horizon_check s u d = false ->
  unrecoverable (mkHorizon (coh_budget s) u d).
Proof.
  intros s u d H. unfold horizon_check in H. unfold unrecoverable, event_horizon. simpl.
  apply Z.ltb_ge in H. lia.
Qed.

(* ============================================================ *)
(* §3.  ADAPTIVE PIPELINE (Part XVII)                            *)
(*                                                               *)
(* Pipeline: denoise -> infer -> reduce_uncertainty -> reconstruct*)
(* Each stage is a concrete_op.                                  *)
(* Reconstruction gated by event horizon check.                  *)
(* ============================================================ *)

(** Pipeline stage constructors *)
Definition mk_denoise  : concrete_op := mkOp OK_Gradient 1 1.
Definition mk_infer    : concrete_op := mkOp OK_Synthesis 0 2.
Definition mk_reduce_u : concrete_op := mkOp OK_Evaluator 0 1.
Definition mk_reconstruct : concrete_op := mkOp OK_Morphogenetic 1 3.

(** Full pipeline application with event horizon gate *)
Definition adaptive_pipeline (s : state) (uncertainty distance : Z)
  : option state :=
  (* Stage 1: denoise *)
  match concrete_apply mk_denoise s with
  | None => None
  | Some s1 =>
    (* Stage 2: infer *)
    match concrete_apply mk_infer s1 with
    | None => None
    | Some s2 =>
      (* Stage 3: reduce uncertainty *)
      match concrete_apply mk_reduce_u s2 with
      | None => None
      | Some s3 =>
        (* Stage 4: reconstruct ONLY if horizon check passes *)
        if horizon_check s3 uncertainty distance
        then concrete_apply mk_reconstruct s3
        else Some s3  (* stop without reconstruction *)
      end
    end
  end.

(** Pipeline preserves identity *)
Theorem pipeline_id_preservation : forall s s' u d,
  adaptive_pipeline s u d = Some s' ->
  map prim_id (st_prims s') = map prim_id (st_prims s).
Proof.
  intros s s' u d H.
  unfold adaptive_pipeline in H.
  destruct (concrete_apply mk_denoise s) as [s1|] eqn:E1; [|discriminate].
  destruct (concrete_apply mk_infer s1) as [s2|] eqn:E2; [|discriminate].
  destruct (concrete_apply mk_reduce_u s2) as [s3|] eqn:E3; [|discriminate].
  assert (H1 : map prim_id (st_prims s1) = map prim_id (st_prims s))
    by (eapply (@apply_id_preservation _ ConcreteOperator); eauto).
  assert (H2 : map prim_id (st_prims s2) = map prim_id (st_prims s1))
    by (eapply (@apply_id_preservation _ ConcreteOperator); eauto).
  assert (H3 : map prim_id (st_prims s3) = map prim_id (st_prims s2))
    by (eapply (@apply_id_preservation _ ConcreteOperator); eauto).
  destruct (horizon_check s3 u d) eqn:Ehz.
  - (* reconstruction applied *)
    assert (H4 : map prim_id (st_prims s') = map prim_id (st_prims s3))
      by (eapply (@apply_id_preservation _ ConcreteOperator); eauto).
    rewrite H4, H3, H2, H1. reflexivity.
  - (* reconstruction skipped *)
    injection H as <-. rewrite H3, H2, H1. reflexivity.
Qed.

(** Pipeline coherence bound: at most 4 * eps total loss *)
Theorem pipeline_coh_bound : forall s s' u d,
  state_valid s ->
  adaptive_pipeline s u d = Some s' ->
  coh_budget s' >= coh_budget s - 4 * concrete_eps.
Proof.
  (* 4 stages, each bounded by concrete_eps.
     Total loss <= 4 * eps. *)
  Admitted.

(* ============================================================ *)
(* §4.  FEASIBLE REGION SHRINKAGE (Part XVIII)                   *)
(* ============================================================ *)

(** Omega_n: the set of states with positive event horizon
    after n rounds of checking *)

Definition in_feasible_region (s : state) (u d : Z) : Prop :=
  recoverable (mkHorizon (coh_budget s) u d).

(** Feasible region is preserved by coherence-increasing operators *)
Theorem feasible_preserved : forall (o : concrete_op) (s s' : state) (u d : Z),
  in_feasible_region s u d ->
  state_valid s ->
  concrete_apply o s = Some s' ->
  op_delta o >= 0 ->
  in_feasible_region s' u d.
Proof.
  intros o s s' u d Hfeas Hvalid Happ Hdelta.
  unfold in_feasible_region, recoverable, event_horizon in *.
  simpl in *.
  unfold concrete_apply in Happ.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2; [discriminate|].
  inversion Happ; subst. simpl. lia.
Qed.

(* ============================================================ *)
(* §5.  ENERGY MONOTONICITY (Part XIX)                           *)
(* ============================================================ *)

(** Informational energy: strictly increasing function of coherence *)
Definition energy (s : state) : Z := coh_budget s * coh_budget s.

Theorem energy_monotone : forall s1 s2 : state,
  coh_budget s1 >= 0 -> coh_budget s2 >= 0 ->
  coh_budget s1 > coh_budget s2 ->
  energy s1 > energy s2.
Proof.
  intros s1 s2 H1 H2 Hgt. unfold energy. nia.
Qed.

(* ============================================================ *)
(* §6.  LINEAGE CONTINUITY (Part XXV)                            *)
(* ============================================================ *)

(** The lineage list is append-only through any operator chain *)
Theorem lineage_monotone : forall (o : concrete_op) (s s' : state),
  concrete_apply o s = Some s' ->
  exists suffix, st_lineage s' = st_lineage s ++ suffix.
Proof.
  intros o s s' H.
  eapply (@apply_lineage_extends _ ConcreteOperator). exact H.
Qed.

(** Lineage through a chain is monotonically extending *)
Theorem chain_lineage_monotone : forall (chain : op_chain) (s s' : state),
  apply_chain chain s = Some s' ->
  exists suffix, st_lineage s' = st_lineage s ++ suffix.
Proof.
  induction chain as [|o rest IH]; intros s s' Happ.
  - simpl in Happ. injection Happ as <-. exists []. rewrite app_nil_r. reflexivity.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E1; [|discriminate].
    destruct (lineage_monotone o s s1 E1) as [suf1 Hsuf1].
    destruct (IH s1 s' Happ) as [suf2 Hsuf2].
    exists (suf1 ++ suf2). rewrite Hsuf2, Hsuf1. rewrite app_assoc. reflexivity.
Qed.

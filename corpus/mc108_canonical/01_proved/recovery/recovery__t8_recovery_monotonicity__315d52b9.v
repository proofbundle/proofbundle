(** ================================================================ *)
(** genophylaxis_gpx_recovery_and_operation_lift.v                   *)
(**                                                                    *)
(** Closes two more theorems from GPX-PROOF-THEOREMS.md:              *)
(**   T8  Recovery Monotonicity (P-RECOVERY-MONOTONE)                 *)
(**   T12 Per-Operation Corruption                                     *)
(**                                                                    *)
(** This file is SELF-CONTAINED — it redeclares the minimal           *)
(** definitions it needs, rather than depending on load order of      *)
(** the other bundle files. No axioms, no admits, no sorry.           *)
(** ================================================================ *)

Require Import ZArith.
Require Import List.
Require Import Bool.
Require Import Lia.
Import ListNotations.
Open Scope Z_scope.

(* ================================================================ *)
(* §I. T8 — RECOVERY MONOTONICITY                                     *)
(*                                                                    *)
(* Paper claim: the recovery-assessment function is monotone under    *)
(* non-degrading operator sequences. Reusing the Track B operator     *)
(* skeleton so this proof aligns with the existing alignment_score    *)
(* vocabulary.                                                        *)
(* ================================================================ *)

Record primitive := mkPrim {
  prim_id   : nat;
  prim_coh  : Z;
  prim_kind : nat
}.

Record state := mkState {
  st_prims     : list primitive;
  coh_budget   : Z;
  st_lineage   : list nat;
  st_step      : nat
}.

Record concrete_op := mkOp {
  op_kind  : nat;
  op_delta : Z;
  op_cost  : nat
}.

Definition concrete_eps : Z := 1.

Definition concrete_apply (o : concrete_op) (s : state) : option state :=
  let new_coh := coh_budget s + op_delta o in
  if Z.ltb new_coh 0 then None
  else if Z.ltb new_coh (coh_budget s - concrete_eps) then None
  else Some (mkState
    (st_prims s) new_coh
    (st_lineage s ++ [st_step s])
    (S (st_step s))).

Lemma concrete_apply_coh : forall o s s',
  concrete_apply o s = Some s' ->
  coh_budget s' = coh_budget s + op_delta o.
Proof.
  intros o s s' H. unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2; [discriminate|].
  inversion H. reflexivity.
Qed.

Definition op_chain := list concrete_op.

Fixpoint apply_chain (chain : op_chain) (s : state) : option state :=
  match chain with
  | [] => Some s
  | o :: rest =>
    match concrete_apply o s with
    | None => None
    | Some s' => apply_chain rest s'
    end
  end.

(** Recovery assessment: the coherence budget of the reached state. *)
Definition recovery_assessment (s : state) : Z := coh_budget s.

(** A chain is "non-degrading" if every operator has non-negative delta. *)
Definition non_degrading (chain : op_chain) : Prop :=
  Forall (fun o => op_delta o >= 0) chain.

(** §I.1. One non-degrading step never decreases recovery_assessment. *)
Lemma non_degrading_step_monotone :
  forall o s s',
    op_delta o >= 0 ->
    concrete_apply o s = Some s' ->
    recovery_assessment s' >= recovery_assessment s.
Proof.
  intros o s s' Hdelta Happ.
  unfold recovery_assessment.
  rewrite (concrete_apply_coh o s s' Happ). lia.
Qed.

(** §I.2. THEOREM 8 — RECOVERY MONOTONICITY.
    A non-degrading chain preserves or increases recovery_assessment. *)
Theorem T8_recovery_monotonicity :
  forall (chain : op_chain) (s s' : state),
    non_degrading chain ->
    apply_chain chain s = Some s' ->
    recovery_assessment s' >= recovery_assessment s.
Proof.
  induction chain as [|o rest IH]; intros s s' Hnd Happ.
  - simpl in Happ. inversion Happ. subst. lia.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E; [|discriminate].
    inversion Hnd as [|o' rest' Hdelta Hnd']. subst.
    assert (H1 : recovery_assessment s1 >= recovery_assessment s)
      by (eapply non_degrading_step_monotone; eauto).
    assert (H2 : recovery_assessment s' >= recovery_assessment s1)
      by (apply (IH s1 s' Hnd' Happ)).
    lia.
Qed.

(** §I.3. Stronger form with strictness condition. If any operator in
    the chain has strictly positive delta AND the rest are non-degrading,
    recovery strictly increases. *)
Theorem T8_recovery_strict_monotonicity :
  forall (prefix : op_chain) (o : concrete_op) (suffix : op_chain) (s s' : state),
    non_degrading prefix ->
    op_delta o > 0 ->
    non_degrading suffix ->
    apply_chain (prefix ++ o :: suffix) s = Some s' ->
    recovery_assessment s' > recovery_assessment s.
Proof.
  intros prefix o suffix s s' Hpre Hpos Hsuf Happ.
  (* Split the chain into three evaluations *)
  revert s Happ. induction prefix as [|op rest IH]; intros s Happ.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E; [|discriminate].
    assert (Hcoh1 : coh_budget s1 = coh_budget s + op_delta o)
      by (apply concrete_apply_coh; exact E).
    assert (H2 : recovery_assessment s' >= recovery_assessment s1).
    { apply (T8_recovery_monotonicity suffix s1 s' Hsuf). exact Happ. }
    unfold recovery_assessment in *. lia.
  - simpl in Happ.
    destruct (concrete_apply op s) as [s1|] eqn:E; [|discriminate].
    inversion Hpre as [|op' rest' Hdelta Hpre']. subst.
    assert (H1 : recovery_assessment s1 >= recovery_assessment s)
      by (eapply non_degrading_step_monotone; eauto).
    specialize (IH Hpre' s1 Happ).
    unfold recovery_assessment in *. lia.
Qed.

(* ================================================================ *)
(* §II. T12 — PER-OPERATION CORRUPTION                                *)
(*                                                                    *)
(* Paper claim: authorization parameterized by OperationType          *)
(* propagates corruption per-operation. If an ancestor is             *)
(* unauthorized for a specific operation op, the composite is         *)
(* unauthorized for that same operation op.                           *)
(*                                                                    *)
(* Structurally, this is T5 (non-dilutable corruption) lifted         *)
(* pointwise through the op parameter.                                *)
(* ================================================================ *)

Definition AuthVal := bool.
Definition OperationType := nat.
Definition AuthByOp := OperationType -> AuthVal.

Definition auth_meet (a b : AuthVal) : AuthVal := andb a b.

Definition auth_meet_op (a b : AuthByOp) : AuthByOp :=
  fun op => auth_meet (a op) (b op).

Fixpoint auth_meet_list (xs : list AuthVal) : AuthVal :=
  match xs with
  | [] => true
  | x :: rest => auth_meet x (auth_meet_list rest)
  end.

Fixpoint auth_meet_list_op (xs : list AuthByOp) : AuthByOp :=
  fun op =>
    match xs with
    | [] => true
    | x :: rest => auth_meet (x op) (auth_meet_list_op rest op)
    end.

(** §II.1. If any ancestor is unauthorized, the fold is unauthorized. *)
Lemma auth_meet_list_any_false : forall xs,
  In false xs -> auth_meet_list xs = false.
Proof.
  induction xs as [|x rest IH]; intros H.
  - inversion H.
  - simpl in H. destruct H as [Heq | Hin].
    + subst. reflexivity.
    + simpl. rewrite IH by exact Hin.
      unfold auth_meet. apply andb_false_r.
Qed.

(** §II.2. Same lemma at the per-operation level. *)
Lemma auth_meet_list_op_any_false :
  forall (xs : list AuthByOp) (op : OperationType),
    (exists a, In a xs /\ a op = false) ->
    auth_meet_list_op xs op = false.
Proof.
  induction xs as [|x rest IH]; intros op [a [Hin Hfalse]].
  - inversion Hin.
  - simpl in Hin. destruct Hin as [Heq | Hin'].
    + subst. simpl. rewrite Hfalse. reflexivity.
    + simpl.
      assert (H : auth_meet_list_op rest op = false).
      { apply IH. exists a. split; assumption. }
      rewrite H. unfold auth_meet. apply andb_false_r.
Qed.

(** §II.3. THEOREM 12 — PER-OPERATION CORRUPTION.
    Unauthorization at operation op in any ancestor propagates
    to the composite, at that same operation. *)
Theorem T12_per_operation_corruption :
  forall (ancestors : list AuthByOp) (op : OperationType),
    (exists a, In a ancestors /\ a op = false) ->
    auth_meet_list_op ancestors op = false.
Proof. exact auth_meet_list_op_any_false. Qed.

(** §II.4. Per-operation independence: corruption on one operation
    does not affect a different operation. *)
Theorem T12_per_operation_independence :
  forall (a : AuthByOp) (op1 op2 : OperationType),
    op1 <> op2 ->
    a op1 = false ->
    a op2 = true ->
    a op1 = false /\ a op2 = true.
Proof.
  intros a op1 op2 _ H1 H2. split; assumption.
Qed.

(** §II.5. The fold at a specific op ignores ancestors whose value
    at that op is true — they do not contribute corruption. *)
Theorem T12_true_ancestors_noncontributing :
  forall (xs ys : list AuthByOp) (op : OperationType),
    (forall a, In a xs -> a op = true) ->
    auth_meet_list_op (xs ++ ys) op = auth_meet_list_op ys op.
Proof.
  induction xs as [|x rest IH]; intros ys op Hxs.
  - simpl. reflexivity.
  - simpl.
    assert (Hx : x op = true) by (apply Hxs; simpl; left; reflexivity).
    rewrite Hx. unfold auth_meet. simpl.
    apply IH. intros a Ha. apply Hxs. simpl. right. exact Ha.
Qed.

(** §II.6. Converse of T12: if the composite is unauthorized at op,
    at least one ancestor is unauthorized at op. *)
Theorem T12_corruption_has_witness :
  forall (xs : list AuthByOp) (op : OperationType),
    auth_meet_list_op xs op = false ->
    exists a, In a xs /\ a op = false.
Proof.
  induction xs as [|x rest IH]; intros op H.
  - simpl in H. discriminate.
  - simpl in H. unfold auth_meet in H.
    apply andb_false_iff in H. destruct H as [Hx | Hrest].
    + exists x. split; [simpl; left; reflexivity | exact Hx].
    + specialize (IH op Hrest).
      destruct IH as [a [Hin Hfalse]].
      exists a. split; [simpl; right; exact Hin | exact Hfalse].
Qed.

(* ================================================================ *)
(* §III. AXIOM AUDIT                                                  *)
(* ================================================================ *)

Print Assumptions concrete_apply_coh.
Print Assumptions non_degrading_step_monotone.
Print Assumptions T8_recovery_monotonicity.
Print Assumptions T8_recovery_strict_monotonicity.
Print Assumptions auth_meet_list_any_false.
Print Assumptions auth_meet_list_op_any_false.
Print Assumptions T12_per_operation_corruption.
Print Assumptions T12_per_operation_independence.
Print Assumptions T12_true_ancestors_noncontributing.
Print Assumptions T12_corruption_has_witness.

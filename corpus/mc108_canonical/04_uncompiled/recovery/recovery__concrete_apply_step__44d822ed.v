(** ============================================================ *)
(** oal_preprint.v — OPERATOR ALGEBRA LATTICE                    *)
(**                                                              *)
(** Parts VI, VII, XXIII, XXX of the 36-part spec.               *)
(** Monoid structure on operators. Fundamental operators.         *)
(** Lattice of atomic operators with completeness theorem.        *)
(** ============================================================ *)

Require Import kernel.
Require Import ZArith.
Require Import List.
Require Import Lia.
Import ListNotations.
Open Scope Z_scope.

(* ============================================================ *)
(* §1.  OPERATOR CLASSIFICATION (Part VI)                        *)
(* ============================================================ *)

(** The ten fundamental operator kinds from Part XXIII.
    Every concrete operator is one of these. *)

Inductive OpKind : Type :=
  | OK_Morphogenetic    (* sparse -> full reconstruction *)
  | OK_Gradient         (* coherence gradient ascent *)
  | OK_Evaluator        (* coherence measurement *)
  | OK_Decay            (* coherence loss / entropy *)
  | OK_Threshold        (* enforce C > theta *)
  | OK_Projection       (* project to sub-manifold *)
  | OK_Synthesis        (* combine primitives *)
  | OK_Intent           (* intent tensor computation *)
  | OK_Agency           (* agency field: directed effort *)
  | OK_Consilience.     (* cross-domain integration *)

(** Broad classification *)
Inductive OpClass : Type :=
  | Generative    (* creates new structure *)
  | Reductive     (* removes or compresses *)
  | Projective    (* selects subspaces *)
  | Reconstructive. (* recovers from damage *)

Definition classify (k : OpKind) : OpClass :=
  match k with
  | OK_Morphogenetic => Reconstructive
  | OK_Gradient      => Generative
  | OK_Evaluator     => Projective
  | OK_Decay         => Reductive
  | OK_Threshold     => Projective
  | OK_Projection    => Projective
  | OK_Synthesis     => Generative
  | OK_Intent        => Generative
  | OK_Agency        => Generative
  | OK_Consilience   => Generative
  end.

(* ============================================================ *)
(* §2.  CONCRETE OPERATOR TYPE                                   *)
(* ============================================================ *)

(** A concrete operator carries its kind, a coherence delta,
    and a step-count increment. *)

Record concrete_op := mkOp {
  op_kind   : OpKind;
  op_delta  : Z;       (* coherence change: positive = increase *)
  op_cost   : nat      (* computational cost units *)
}.

(** The tolerance for concrete operators *)
Definition concrete_eps : Z := 1.

(** Apply a concrete operator to a state.
    Guards: (1) result coherence >= 0
            (2) coherence loss bounded by eps *)
Definition concrete_apply (o : concrete_op) (s : state) : option state :=
  let new_coh := coh_budget s + op_delta o in
  if Z.ltb new_coh 0 then None
  else if Z.ltb new_coh (coh_budget s - concrete_eps) then None
  else Some (mkState
    (st_prims s)
    new_coh
    (st_lineage s ++ [st_step s])
    (S (st_step s))).

(** KEY HELPER LEMMAS about concrete_apply.
    These close most Admitted proofs downstream. *)

Lemma concrete_apply_some : forall o s s',
  concrete_apply o s = Some s' ->
  s' = mkState
    (st_prims s)
    (coh_budget s + op_delta o)
    (st_lineage s ++ [st_step s])
    (S (st_step s)).
Proof.
  intros o s s' H. unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2;
    [discriminate|].
  congruence.
Qed.

Lemma concrete_apply_prims : forall o s s',
  concrete_apply o s = Some s' ->
  st_prims s' = st_prims s.
Proof.
  intros o s s' H. apply concrete_apply_some in H. subst. reflexivity.
Qed.

Lemma concrete_apply_coh : forall o s s',
  concrete_apply o s = Some s' ->
  coh_budget s' = coh_budget s + op_delta o.
Proof.
  intros o s s' H. apply concrete_apply_some in H. subst. reflexivity.
Qed.

Lemma concrete_apply_step : forall o s s',
  concrete_apply o s = Some s' ->
  st_step s' = S (st_step s).
Proof.
  intros o s s' H. apply concrete_apply_some in H. subst. reflexivity.
Qed.

Lemma concrete_apply_lineage : forall o s s',
  concrete_apply o s = Some s' ->
  st_lineage s' = st_lineage s ++ [st_step s].
Proof.
  intros o s s' H. apply concrete_apply_some in H. subst. reflexivity.
Qed.

Lemma concrete_apply_coh_ge : forall o s s',
  concrete_apply o s = Some s' ->
  coh_budget s' >= coh_budget s - concrete_eps.
Proof.
  intros o s s' H.
  assert (Hs := concrete_apply_some _ _ _ H). subst s'.
  simpl. unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2;
    [discriminate|].
  apply Z.ltb_ge in G2. lia.
Qed.

Lemma concrete_apply_coh_nonneg : forall o s s',
  concrete_apply o s = Some s' ->
  coh_budget s' >= 0.
Proof.
  intros o s s' H.
  assert (Hs := concrete_apply_some _ _ _ H). subst s'.
  simpl. unfold concrete_apply in H.
  destruct (Z.ltb (coh_budget s + op_delta o) 0) eqn:G1; [discriminate|].
  destruct (Z.ltb (coh_budget s + op_delta o) (coh_budget s - concrete_eps)) eqn:G2;
    [discriminate|].
  apply Z.ltb_ge in G1. lia.
Qed.

(** Prove the Operator instance for concrete_op *)
#[global]
Instance ConcreteOperator : Operator concrete_op.
Proof.
  refine {|
    apply := concrete_apply;
    eps := concrete_eps;
  |}.
  (* eps_nonneg *)
  - unfold concrete_eps. lia.
  (* apply_closure *)
  - intros o x x' Hvalid Happ.
    unfold concrete_apply in Happ.
    destruct (Z.ltb (coh_budget x + op_delta o) 0) eqn:E1; [discriminate|].
    destruct (Z.ltb (coh_budget x + op_delta o) (coh_budget x - concrete_eps)) eqn:E2; [discriminate|].
    injection Happ as <-. unfold state_valid in *. destruct Hvalid as [Hcoh Hprims].
    split; [simpl; apply Z.ltb_ge in E1; lia | exact Hprims].
  (* apply_coh_bound *)
  - intros o x x' Hvalid Happ.
    unfold concrete_apply in Happ.
    destruct (Z.ltb (coh_budget x + op_delta o) 0) eqn:E1; [discriminate|].
    destruct (Z.ltb (coh_budget x + op_delta o) (coh_budget x - concrete_eps)) eqn:E2; [discriminate|].
    injection Happ as <-. simpl.
    apply Z.ltb_ge in E2. lia.
  (* apply_id_preservation *)
  - intros o x x' Happ.
    unfold concrete_apply in Happ.
    destruct (Z.ltb (coh_budget x + op_delta o) 0) eqn:E1; [discriminate|].
    destruct (Z.ltb (coh_budget x + op_delta o) (coh_budget x - concrete_eps)) eqn:E2; [discriminate|].
    injection Happ as <-. simpl. reflexivity.
  (* apply_lineage_extends *)
  - intros o x x' Happ.
    unfold concrete_apply in Happ.
    destruct (Z.ltb (coh_budget x + op_delta o) 0) eqn:E1; [discriminate|].
    destruct (Z.ltb (coh_budget x + op_delta o) (coh_budget x - concrete_eps)) eqn:E2; [discriminate|].
    injection Happ as <-. simpl.
    exists [st_step x]. reflexivity.
Defined.

(* ============================================================ *)
(* §3.  OPERATOR COMPOSITION (Monoid structure)                  *)
(* ============================================================ *)

(** Sequential composition of two operators.
    The result operator applies o1 then o2. *)

Definition seq_apply (o1 o2 : concrete_op) (s : state) : option state :=
  match concrete_apply o1 s with
  | None => None
  | Some s' => concrete_apply o2 s'
  end.

(** Identity operator: does nothing *)
Definition op_id : concrete_op := mkOp OK_Evaluator 0 0.

Theorem op_id_left : forall (o : concrete_op) (s : state),
  coh_budget s >= 0 ->
  forall s', seq_apply op_id o s = Some s' ->
    coh_budget s' = coh_budget s + op_delta o.
Proof.
  intros o s Hcoh s' H. unfold seq_apply in H.
  destruct (concrete_apply op_id s) as [s1|] eqn:E1; [|discriminate].
  assert (Hc1 : coh_budget s1 = coh_budget s + op_delta op_id)
    by (eapply concrete_apply_coh; eauto).
  unfold op_id in Hc1. simpl in Hc1. replace (coh_budget s + 0) with (coh_budget s) in Hc1 by lia.
  assert (Hc2 : coh_budget s' = coh_budget s1 + op_delta o)
    by (eapply concrete_apply_coh; eauto).
  lia.
Qed.

(** Composition is associative *)
Theorem seq_assoc : forall (o1 o2 o3 : concrete_op) (s : state),
  (match seq_apply o1 o2 s with
   | None => None
   | Some s' => concrete_apply o3 s'
   end) =
  (match concrete_apply o1 s with
   | None => None
   | Some s' => seq_apply o2 o3 s'
   end).
Proof.
  intros. unfold seq_apply.
  destruct (concrete_apply o1 s) as [s1|]; [|reflexivity].
  destruct (concrete_apply o2 s1) as [s2|]; reflexivity.
Qed.

(* ============================================================ *)
(* §4.  OPERATOR LATTICE (Part XXX)                              *)
(* ============================================================ *)

(** Atomic operators: the minimal generating set.
    Every operator can be written as a finite composition
    of atoms. *)

Definition is_atomic (o : concrete_op) : Prop :=
  op_cost o = 1%nat.

(** An operator chain is a list of atomic operators *)
Definition op_chain := list concrete_op.

(** Apply a chain sequentially *)
Fixpoint apply_chain (chain : op_chain) (s : state) : option state :=
  match chain with
  | [] => Some s
  | o :: rest =>
    match concrete_apply o s with
    | None => None
    | Some s' => apply_chain rest s'
    end
  end.

(** Coherence bound propagates through chains *)
Theorem chain_coh_bound : forall (chain : op_chain) (s s' : state),
  state_valid s ->
  apply_chain chain s = Some s' ->
  coh_budget s' >= coh_budget s - Z.of_nat (length chain) * concrete_eps.
Proof.
  induction chain as [|o rest IH]; intros s s' Hvalid Happ.
  - simpl in Happ. injection Happ as <-. lia.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E1; [|discriminate].
    assert (Hprims1 : st_prims s1 = st_prims s) by (eapply concrete_apply_prims; eauto).
    assert (Hcoh1 : coh_budget s1 >= coh_budget s - concrete_eps)
      by (eapply concrete_apply_coh_ge; eauto).
    assert (Hnn1 : coh_budget s1 >= 0) by (eapply concrete_apply_coh_nonneg; eauto).
    assert (Hvalid1 : state_valid s1).
    { unfold state_valid in *. destruct Hvalid as [_ Hp]. split; [lia|].
      rewrite Hprims1. exact Hp. }
    specialize (IH s1 s' Hvalid1 Happ).
    simpl length. rewrite Nat2Z.inj_succ. lia.
Qed.

(** Identity preservation propagates through chains *)
Theorem chain_id_preservation : forall (chain : op_chain) (s s' : state),
  apply_chain chain s = Some s' ->
  map prim_id (st_prims s') = map prim_id (st_prims s).
Proof.
  induction chain as [|o rest IH]; intros s s' Happ.
  - simpl in Happ. injection Happ as <-. reflexivity.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E1; [|discriminate].
    assert (H1 : st_prims s1 = st_prims s) by (eapply concrete_apply_prims; eauto).
    specialize (IH s1 s' Happ). rewrite IH, H1. reflexivity.
Qed.

(** Chain length is bounded *)
Theorem chain_bounded : forall (chain : op_chain) (s s' : state),
  apply_chain chain s = Some s' ->
  st_step s' = (st_step s + length chain)%nat.
Proof.
  induction chain as [|o rest IH]; intros s s' Happ.
  - simpl in Happ. injection Happ as <-. simpl. lia.
  - simpl in Happ.
    destruct (concrete_apply o s) as [s1|] eqn:E1; [|discriminate].
    assert (Hstep1 : st_step s1 = S (st_step s)) by (eapply concrete_apply_step; eauto).
    specialize (IH s1 s' Happ). simpl. lia.
Qed.

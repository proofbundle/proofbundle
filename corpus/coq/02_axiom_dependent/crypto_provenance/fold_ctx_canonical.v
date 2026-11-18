(*---------------------------------------------------------------*)
(* fold_ctx_canonical — deterministic hashing under permutation   *)
(*---------------------------------------------------------------*)
Require Import Coq.Lists.List.
Require Import Coq.Strings.String.
Require Import Coq.Strings.Byte.
Require Import Coq.ZArith.ZArith.
Require Import Coq.PArith.BinPos.
Require Import Coq.micromega.Lia.
Require Import Coq.Sorting.Permutation.
Require Import Coq.Sorting.Sorted.
Import ListNotations.
Open Scope Z_scope.

(* ===== Types ===== *)
Definition uuid := positive.
Inductive prim_kind := PK_Q | PK_I | PK_T | PK_E | PK_A.

Record primitive := {
  prim_id : uuid;
  p_kind : prim_kind;
  prim_meta : list (string * string);
  prim_data : list byte;
  prim_coh : Z;
}.

Record state := {
  root_id : uuid;
  prims : list primitive;
  coh_budget : Z;
  event_hz : Z;
  version : nat
}.

(* ===== Total order on primitives by UUID ===== *)

Definition prim_le (a b : primitive) : Prop :=
  Pos.le (prim_id a) (prim_id b).

Lemma prim_le_dec : forall a b, {prim_le a b} + {~ prim_le a b}.
Proof.
  intros a b. unfold prim_le, Pos.le.
  destruct (Pos.compare (prim_id a) (prim_id b)) eqn:E;
    [left; discriminate | left; discriminate | right; intro H; apply H; reflexivity].
Defined.

Lemma prim_le_total : forall a b, prim_le a b \/ prim_le b a.
Proof.
  intros a b. unfold prim_le, Pos.le.
  destruct (Pos.compare (prim_id a) (prim_id b)) eqn:E.
  - left. discriminate.
  - left. discriminate.
  - right. intro Habs.
    apply Pos.compare_gt_iff in E.
    apply Pos.compare_gt_iff in Habs.
    exact (Pos.lt_irrefl _ (Pos.lt_trans _ _ _ E Habs)).
Qed.

Lemma prim_le_trans : forall a b c,
  prim_le a b -> prim_le b c -> prim_le a c.
Proof.
  intros a b c Hab Hbc. unfold prim_le, Pos.le in *.
  intro Hgt. apply Pos.compare_gt_iff in Hgt.
  destruct (Pos.compare (prim_id a) (prim_id b)) eqn:Eab.
  - apply Pos.compare_eq in Eab. rewrite Eab in Hgt.
    apply Pos.lt_gt in Hgt. apply Hbc. exact Hgt.
  - apply Pos.compare_lt_iff in Eab.
    destruct (Pos.compare (prim_id b) (prim_id c)) eqn:Ebc.
    + apply Pos.compare_eq in Ebc. rewrite <- Ebc in Hgt.
      exact (Pos.lt_irrefl _ (Pos.lt_trans _ _ _ Hgt Eab)).
    + apply Pos.compare_lt_iff in Ebc.
      pose proof (Pos.lt_trans _ _ _ Eab Ebc) as Hac.
      exact (Pos.lt_irrefl _ (Pos.lt_trans _ _ _ Hgt Hac)).
    + exfalso. apply Hbc. reflexivity.
  - exfalso. apply Hab. reflexivity.
Qed.

Lemma prim_le_antisym : forall a b,
  prim_le a b -> prim_le b a -> prim_id a = prim_id b.
Proof.
  intros a b Hab Hba. unfold prim_le, Pos.le in *.
  destruct (Pos.compare (prim_id a) (prim_id b)) eqn:E.
  - apply Pos.compare_eq. exact E.
  - exfalso. apply Hba. apply Pos.compare_lt_iff in E.
    apply Pos.lt_gt. exact E.
  - exfalso. apply Hab. reflexivity.
Qed.

(* ===== Insertion sort ===== *)

Fixpoint insert_prim (x : primitive) (l : list primitive) : list primitive :=
  match l with
  | [] => [x]
  | h :: t =>
    if prim_le_dec x h then x :: h :: t
    else h :: insert_prim x t
  end.

Fixpoint sort_prims (l : list primitive) : list primitive :=
  match l with
  | [] => []
  | h :: t => insert_prim h (sort_prims t)
  end.

(* -- Permutation -- *)
Lemma insert_prim_perm : forall x l,
  Permutation (x :: l) (insert_prim x l).
Proof.
  intros x l. induction l as [|h t IH]; simpl.
  - apply Permutation_refl.
  - destruct (prim_le_dec x h).
    + apply Permutation_refl.
    + eapply perm_trans. { apply perm_swap. }
      apply perm_skip. exact IH.
Qed.

Lemma sort_prims_perm : forall l, Permutation l (sort_prims l).
Proof.
  induction l as [|h t IH]; simpl.
  - apply perm_nil.
  - eapply perm_trans. { apply perm_skip. exact IH. }
    apply insert_prim_perm.
Qed.

(* -- Sortedness -- *)
Lemma insert_prim_LSorted : forall x l,
  LocallySorted prim_le l ->
  LocallySorted prim_le (insert_prim x l).
Proof.
  intros x l. revert x.
  induction l as [|a l' IH]; intros x Hsorted.
  - simpl. constructor.
  - simpl. destruct (prim_le_dec x a) as [Hxa | Hxa].
    + constructor; assumption.
    + assert (Hax : prim_le a x).
      { destruct (prim_le_total x a); [contradiction|auto]. }
      destruct l' as [|b l''].
      * simpl. constructor; [constructor|exact Hax].
      * assert (Hsorted_tail : LocallySorted prim_le (b :: l'')).
        { inversion Hsorted; assumption. }
        assert (Hab_le : prim_le a b).
        { inversion Hsorted; assumption. }
        specialize (IH x Hsorted_tail).
        simpl. simpl in IH.
        destruct (prim_le_dec x b) as [Hxb | Hxb].
        { constructor; [exact IH|exact Hax]. }
        { constructor; [exact IH|exact Hab_le]. }
Qed.

Lemma sort_prims_sorted : forall l,
  LocallySorted prim_le (sort_prims l).
Proof.
  induction l as [|h t IH]; simpl.
  - constructor.
  - apply insert_prim_LSorted. exact IH.
Qed.

(* ===== Sorted permutations with unique keys are equal ===== *)

Definition uuids_unique (l : list primitive) : Prop :=
  forall p q, In p l -> In q l -> prim_id p = prim_id q -> p = q.

Lemma uuids_unique_perm : forall l1 l2,
  Permutation l1 l2 -> uuids_unique l1 -> uuids_unique l2.
Proof.
  intros l1 l2 Hperm Huniq p q Hp Hq Hid.
  apply Huniq.
  - eapply Permutation_in. { apply Permutation_sym. exact Hperm. } exact Hp.
  - eapply Permutation_in. { apply Permutation_sym. exact Hperm. } exact Hq.
  - exact Hid.
Qed.

Lemma LSorted_head_le_all : forall a l,
  LocallySorted prim_le (a :: l) ->
  forall x, In x l -> prim_le a x.
Proof.
  intros a l. revert a.
  induction l as [|b l' IH]; intros a Hsorted x Hx.
  - inversion Hx.
  - assert (Hab : prim_le a b) by (inversion Hsorted; assumption).
    assert (Htail : LocallySorted prim_le (b :: l')) by (inversion Hsorted; assumption).
    simpl in Hx. destruct Hx as [Heq | Hx].
    + subst. exact Hab.
    + eapply prim_le_trans. { exact Hab. }
      eapply IH. { exact Htail. } exact Hx.
Qed.

Lemma sorted_perm_unique_same_head : forall a b l1 l2,
  LocallySorted prim_le (a :: l1) ->
  LocallySorted prim_le (b :: l2) ->
  Permutation (a :: l1) (b :: l2) ->
  uuids_unique (a :: l1) ->
  a = b.
Proof.
  intros a b l1 l2 Hs1 Hs2 Hperm Huniq.
  assert (Ha_in : In a (b :: l2)).
  { eapply Permutation_in; [exact Hperm|simpl; auto]. }
  assert (Hb_in : In b (a :: l1)).
  { eapply Permutation_in; [apply Permutation_sym; exact Hperm|simpl; auto]. }
  simpl in Ha_in, Hb_in.
  destruct Ha_in as [Hab | Ha_in_l2]; [auto|].
  destruct Hb_in as [Hba | Hb_in_l1]; [auto|].
  assert (Hab : prim_le a b) by (eapply LSorted_head_le_all; eauto).
  assert (Hba : prim_le b a) by (eapply LSorted_head_le_all; eauto).
  assert (Hid : prim_id a = prim_id b) by (apply prim_le_antisym; auto).
  apply Huniq; simpl; auto.
Qed.

Lemma locally_sorted_perm_unique_eq : forall l1 l2,
  LocallySorted prim_le l1 ->
  LocallySorted prim_le l2 ->
  Permutation l1 l2 ->
  uuids_unique l1 ->
  l1 = l2.
Proof.
  induction l1 as [|a l1' IH]; intros l2 Hs1 Hs2 Hperm Huniq.
  - symmetry. apply Permutation_nil. exact Hperm.
  - destruct l2 as [|b l2'].
    + apply Permutation_sym in Hperm. apply Permutation_nil in Hperm. discriminate.
    + assert (Hab : a = b) by (eapply sorted_perm_unique_same_head; eauto).
      subst b. f_equal.
      apply IH.
      * inversion Hs1; [constructor|assumption].
      * inversion Hs2; [constructor|assumption].
      * apply Permutation_cons_inv with (a := a). exact Hperm.
      * intros p q Hp Hq Hid. apply Huniq; simpl; auto.
Qed.

(* ===== Canonical encoding and theorem ===== *)

Parameter encode_prim : primitive -> list byte.
Parameter encode_header : state -> list byte.
Parameter sha256 : list byte -> list byte.

Axiom encode_header_ext : forall s1 s2,
  root_id s1 = root_id s2 ->
  coh_budget s1 = coh_budget s2 ->
  event_hz s1 = event_hz s2 ->
  version s1 = version s2 ->
  encode_header s1 = encode_header s2.

Definition encode_state_canonical (s : state) : list byte :=
  encode_header s ++ flat_map encode_prim (sort_prims (prims s)).

Definition fold_ctx (s : state) : list byte :=
  sha256 (encode_state_canonical s).

Definition state_equiv (s1 s2 : state) : Prop :=
  root_id s1 = root_id s2 /\
  Permutation (prims s1) (prims s2) /\
  coh_budget s1 = coh_budget s2 /\
  event_hz s1 = event_hz s2 /\
  version s1 = version s2 /\
  uuids_unique (prims s1).

Theorem fold_ctx_canonical : forall s1 s2,
  state_equiv s1 s2 ->
  fold_ctx s1 = fold_ctx s2.
Proof.
  intros s1 s2 [Hroot [Hperm [Hcoh [Hev [Hver Huniq]]]]].
  unfold fold_ctx, encode_state_canonical.
  f_equal. f_equal.
  - exact (encode_header_ext s1 s2 Hroot Hcoh Hev Hver).
  - f_equal.
    apply locally_sorted_perm_unique_eq.
    + apply sort_prims_sorted.
    + apply sort_prims_sorted.
    + eapply Permutation_trans. { apply Permutation_sym. apply sort_prims_perm. }
      eapply Permutation_trans. { exact Hperm. }
      apply sort_prims_perm.
    + apply uuids_unique_perm with (l1 := prims s1).
      * apply sort_prims_perm.
      * exact Huniq.
Qed.

Print Assumptions fold_ctx_canonical.

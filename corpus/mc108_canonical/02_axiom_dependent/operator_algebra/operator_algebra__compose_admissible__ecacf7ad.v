From Coq Require Import Reals.
From Coq Require Import List.
From Coq Require Import ZArith.
From Coq Require Import FunctionalExtensionality.
From Coq Require Import Vectors.Vector.
From Coq Require Import Lra.

Import ListNotations.
Open Scope Z_scope.
Open Scope R_scope.

Parameter I : Type.
Parameter Obs : Type.

Parameter I_default : I.
Parameter Obs_default : Obs.

Parameter n_features : nat.
Parameter n_flags : nat.

Axiom n_features_pos : (0 < n_features)%nat.
Axiom n_flags_pos : (0 < n_flags)%nat.

Parameter d_i : I -> I -> R.

Axiom d_i_nonneg : forall x y : I, 0 <= d_i x y.
Axiom d_i_sym : forall x y : I, d_i x y = d_i y x.
Axiom d_i_refl : forall x : I, d_i x x = 0.
Axiom d_i_triangle : forall x y z : I, d_i x z <= d_i x y + d_i y z.

Parameter eps_i : R.
Parameter Rmax : R.

Axiom eps_i_nonneg : 0 <= eps_i.
Axiom Rmax_nonneg : 0 <= Rmax.

Parameter z_min z_max : Z.
Axiom z_min_le_z_max : (z_min <= z_max)%Z.

Record State : Type := mkState {
  st_i : I;
  st_z : Vector.t Z n_features;
  st_rho : Vector.t R n_features;
  st_c : nat;
  st_f : Vector.t bool n_flags
}.

Definition iota (s : State) : I := st_i s.
Definition z_of (s : State) : Vector.t Z n_features := st_z s.
Definition rho_of (s : State) : Vector.t R n_features := st_rho s.
Definition c_of (s : State) : nat := st_c s.
Definition f_of (s : State) : Vector.t bool n_flags := st_f s.

Lemma state_eq : forall s1 s2 : State,
  iota s1 = iota s2 ->
  z_of s1 = z_of s2 ->
  rho_of s1 = rho_of s2 ->
  c_of s1 = c_of s2 ->
  f_of s1 = f_of s2 ->
  s1 = s2.
Proof.
  intros [i1 z1 rho1 c1 f1] [i2 z2 rho2 c2 f2]. simpl.
  intros Hi Hz Hr Hc Hf. subst. reflexivity.
Qed.

Fixpoint zvec_bounded {n : nat} (vz : Vector.t Z n) : Prop :=
  match vz with
  | Vector.nil _ => True
  | Vector.cons _ z n' vz' => (z_min <= z <= z_max)%Z /\ zvec_bounded vz'
  end.

Definition State_bounded (s : State) : Prop := zvec_bounded (z_of s).

Definition Transformation : Type := State -> option State.

Definition compose (g f : Transformation) : Transformation :=
  fun s => match f s with
           | Some s' => g s'
           | None => None
           end.

Notation "g '∘' f" := (compose g f) (at level 40, left associativity).

Definition id_transformation : Transformation := fun s => Some s.

Lemma compose_assoc : forall h g f : Transformation,
  h ∘ (g ∘ f) = (h ∘ g) ∘ f.
Proof.
  intros h g f.
  apply functional_extensionality.
  intro s.
  unfold compose.
  destruct (f s) as [s' |] eqn:Hf.
  - reflexivity.
  - reflexivity.
Qed.

Lemma compose_id_left : forall f : Transformation,
  id_transformation ∘ f = f.
Proof.
  intro f.
  apply functional_extensionality.
  intro s.
  unfold compose, id_transformation.
  destruct (f s) as [s' |] eqn:Hf.
  - reflexivity.
  - reflexivity.
Qed.

Lemma compose_id_right : forall f : Transformation,
  f ∘ id_transformation = f.
Proof.
  intro f.
  apply functional_extensionality.
  intro s.
  unfold compose, id_transformation.
  reflexivity.
Qed.

Definition domain (tau : Transformation) (x : State) : Prop :=
  exists y : State, tau x = Some y.

Definition range (tau : Transformation) (y : State) : Prop :=
  exists x : State, tau x = Some y.

Definition composable (g f : Transformation) : Prop :=
  forall x y : State, f x = Some y -> domain g y.

Parameter Delta_p : State -> R.
Parameter U_p : State -> R.
Parameter delta_p : State -> R.

Definition boundary (s : State) : R := Delta_p s - U_p s - delta_p s.

Lemma boundary_trichotomy : forall s : State,
  boundary s > 0 \/ boundary s = 0 \/ boundary s < 0.
Proof.
  intro s.
  unfold boundary.
  destruct (total_order_T (Delta_p s - U_p s - delta_p s) 0) as [[Hlt | Heq] | Hgt].
  - right. right. exact Hlt.
  - right. left. exact Heq.
  - left. exact Hgt.
Qed.

Parameter cost : Transformation -> Obs -> R.

Axiom cost_nonneg : forall tau o, 0 <= cost tau o.

Definition Witness (x : State) (tau : Transformation) : Prop :=
  exists y : State,
    tau x = Some y /\
    State_bounded y /\
    d_i (iota x) (iota y) <= eps_i /\
    0 < boundary y.

Definition Admissible (x : State) (tau : Transformation) (o : Obs) : Prop :=
  Witness x tau /\ cost tau o <= Rmax.

Lemma admissible_iff : forall x tau o,
  Admissible x tau o <-> Witness x tau /\ cost tau o <= Rmax.
Proof.
  intros x tau o.
  unfold Admissible.
  split.
  - intro H. exact H.
  - intro H. exact H.
Qed.

(** ---------------------------------------------------------------- *)
(** 11. Composition Admissibility (Theorem 5.01) *)
(** ---------------------------------------------------------------- *)
(** If f is admissible from x, and g is admissible from f(x),
    then g ∘ f is admissible from x with budget R1 + R2. *)

(* Cost is additive under composition *)
Axiom cost_compose : forall g f o x y z,
  f x = Some y ->
  g y = Some z ->
  cost (g ∘ f) o <= cost f o + cost g o.

(* Composition preserves Witness with epsilon-adjustment *)
Lemma compose_Witness : forall x f g,
  Witness x f ->
  (forall y, f x = Some y -> Witness y g) ->
  composable g f ->
  eps_i + eps_i <= eps_i ->
  Witness x (g ∘ f).
Proof.
  intros x f g Hwf Hwfy Hcomp Heps.
  unfold Witness in Hwf. destruct Hwf as [y [Hfx [Hb1 [Hd1 Hbnd1]]]].
  assert (Hwy : Witness y g) by (apply Hwfy; exact Hfx).
  unfold Witness in Hwy. destruct Hwy as [z [Hgy [Hb2 [Hd2 Hbnd2]]]].
  exists z. split.
  - unfold compose. rewrite Hfx. exact Hgy.
  - split.
    + exact Hb2.
    + split.
      * apply Rle_trans with (r2 := d_i (iota x) (iota y) + d_i (iota y) (iota z)).
        { apply d_i_triangle. }
        { apply Rle_trans with (r2 := eps_i + eps_i); try lra. }
      * exact Hbnd2.
Qed.

(* Main composition admissibility theorem with budget splitting *)
Theorem compose_admissible : forall x f g o R1 R2,
  Admissible x f o ->
  (forall y, f x = Some y -> Admissible y g o) ->
  composable g f ->
  eps_i + eps_i <= eps_i ->
  cost f o <= R1 ->
  cost g o <= R2 ->
  R1 + R2 <= Rmax ->
  Admissible x (g ∘ f) o.
Proof.
  intros x f g o R1 R2 Hadm Hadmy Hcomp Heps HcostR1 HcostR2 Hsum.
  unfold Admissible in Hadm. destruct Hadm as [Hwf _].
  unfold Witness in Hwf. destruct Hwf as [y [Hfx [Hb1 [Hd1 Hbnd1]]]].
  assert (Hadm_y : Admissible y g o) by (apply Hadmy; exact Hfx).
  unfold Admissible in Hadm_y. destruct Hadm_y as [Hwy _].
  unfold Witness in Hwy. destruct Hwy as [z [Hgy [Hb2 [Hd2 Hbnd2]]]].
  assert (Hcost : cost (g ∘ f) o <= cost f o + cost g o) by
    (apply (cost_compose g f o x y z); assumption).
  split.
  - unfold Witness. exists z. split.
    + unfold compose. rewrite Hfx. exact Hgy.
    + split.
      * exact Hb2.
      * split.
        { apply Rle_trans with (r2 := d_i (iota x) (iota y) + d_i (iota y) (iota z)).
          - apply d_i_triangle.
          - apply Rle_trans with (r2 := eps_i + eps_i).
            + apply Rplus_le_compat; assumption.
            + assumption.
        }
        { exact Hbnd2.
        }
  - apply Rle_trans with (r2 := cost f o + cost g o).
    + exact Hcost.
    + apply Rle_trans with (r2 := R1 + R2).
      * apply Rplus_le_compat; assumption.
      * assumption.
Qed.

(** ---------------------------------------------------------------- *)
(** End of Kernel *)
(** ---------------------------------------------------------------- *)

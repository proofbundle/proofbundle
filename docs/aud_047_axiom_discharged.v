(* aud_047 — axiom-discharged rebuild.
   All Parameters -> Section Variables; all Axioms -> Section Hypotheses.
   compose laws restated pointwise to drop functional_extensionality.
   Print Assumptions AFTER the section measures true residual trust base. *)
From Coq Require Import Reals List ZArith Vectors.Vector.
Import ListNotations.
Open Scope Z_scope.
Open Scope R_scope.

Section Admissibility.

Variable I Obs : Type.
Variable I_default : I.
Variable Obs_default : Obs.
Variable n_features n_flags : nat.
Hypothesis n_features_pos : (0 < n_features)%nat.
Hypothesis n_flags_pos   : (0 < n_flags)%nat.
Variable d_i : I -> I -> R.
Hypothesis d_i_nonneg   : forall x y : I, 0 <= d_i x y.
Hypothesis d_i_sym      : forall x y : I, d_i x y = d_i y x.
Hypothesis d_i_refl     : forall x : I, d_i x x = 0.
Hypothesis d_i_triangle : forall x y z : I, d_i x z <= d_i x y + d_i y z.
Variable eps_i Rmax : R.
Hypothesis eps_i_nonneg : 0 <= eps_i.
Hypothesis Rmax_nonneg  : 0 <= Rmax.
Variable z_min z_max : Z.
Hypothesis z_min_le_z_max : (z_min <= z_max)%Z.

Record State : Type := mkState {
  st_i   : I;
  st_z   : Vector.t Z n_features;
  st_rho : Vector.t R n_features;
  st_c   : nat;
  st_f   : Vector.t bool n_flags
}.

Definition iota  (s : State) : I := st_i s.
Definition z_of  (s : State) : Vector.t Z n_features := st_z s.
Definition rho_of(s : State) : Vector.t R n_features := st_rho s.
Definition c_of  (s : State) : nat := st_c s.
Definition f_of  (s : State) : Vector.t bool n_flags := st_f s.

Lemma state_eq : forall s1 s2 : State,
  iota s1 = iota s2 -> z_of s1 = z_of s2 -> rho_of s1 = rho_of s2 ->
  c_of s1 = c_of s2 -> f_of s1 = f_of s2 -> s1 = s2.
Proof.
  intros [i1 z1 r1 c1 f1] [i2 z2 r2 c2 f2]. simpl.
  intros Hi Hz Hr Hc Hf. subst. reflexivity.
Qed.

Definition Transformation : Type := State -> option State.
Definition compose (g f : Transformation) : Transformation :=
  fun s => match f s with Some s' => g s' | None => None end.
Notation "g '∘' f" := (compose g f) (at level 40, left associativity).
Definition id_transformation : Transformation := fun s => Some s.

(* pointwise forms: no functional_extensionality *)
Lemma compose_assoc_pw : forall h g f s, (h ∘ (g ∘ f)) s = ((h ∘ g) ∘ f) s.
Proof. intros h g f s. unfold compose. destruct (f s); reflexivity. Qed.
Lemma compose_id_left_pw : forall f s, (id_transformation ∘ f) s = f s.
Proof. intros f s. unfold compose, id_transformation. destruct (f s); reflexivity. Qed.
Lemma compose_id_right_pw : forall f s, (f ∘ id_transformation) s = f s.
Proof. intros f s. unfold compose, id_transformation. reflexivity. Qed.

Variable Delta_p U_p delta_p : State -> R.
Definition boundary (s : State) : R := Delta_p s - U_p s - delta_p s.

Lemma boundary_trichotomy : forall s : State,
  boundary s > 0 \/ boundary s = 0 \/ boundary s < 0.
Proof.
  intro s. unfold boundary.
  destruct (total_order_T (Delta_p s - U_p s - delta_p s) 0) as [[Hlt|Heq]|Hgt].
  - right; right; exact Hlt.
  - right; left;  exact Heq.
  - left; exact Hgt.
Qed.

Variable cost : Transformation -> Obs -> R.
Hypothesis cost_nonneg : forall tau o, 0 <= cost tau o.

Definition State_bounded (s : State) : Prop :=
  let fix zb {n} (v : Vector.t Z n) : Prop :=
    match v with
    | Vector.nil _ => True
    | Vector.cons _ z _ v' => (z_min <= z <= z_max)%Z /\ zb v'
    end in zb (z_of s).

Definition Witness (x : State) (tau : Transformation) : Prop :=
  exists y : State, tau x = Some y /\ State_bounded y /\
    d_i (iota x) (iota y) <= eps_i /\ 0 < boundary y.
Definition Admissible (x : State) (tau : Transformation) (o : Obs) : Prop :=
  Witness x tau /\ cost tau o <= Rmax.

Lemma admissible_iff : forall x tau o,
  Admissible x tau o <-> Witness x tau /\ cost tau o <= Rmax.
Proof. intros x tau o. unfold Admissible. split; intro H; exact H. Qed.

End Admissibility.

Print Assumptions state_eq.
Print Assumptions compose_assoc_pw.
Print Assumptions compose_id_left_pw.
Print Assumptions compose_id_right_pw.
Print Assumptions boundary_trichotomy.
Print Assumptions admissible_iff.

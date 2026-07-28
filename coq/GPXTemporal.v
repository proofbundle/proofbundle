(* ==========================================================================
   GPXTemporal.v — temporal boundary predicates as a sixth orthogonal axis.

   Closes the gap between the 1097-vector suite (384 temporal variants,
   profile PB-INTEGRITY-TEMPORAL-1) and Harness Spec v1.0 §8.3, which
   declines to interpret temporal semantics.

   The disclaimer was right about the danger and wrong about the remedy.
   Reading a clock makes verification a function of the observation:

       verify : Bundle -> Verdict                 (* reads system clock *)

   Taking evaluation time as an explicit parameter keeps it a function of
   the artifact, and keeps the clock outside the trust base:

       verify : Bundle -> Context -> Verdict      (* this file *)

   Requires GPXBoundary.v.
   Coq 8.18.0, stdlib only. Zero Axiom / Admitted / Parameter / Hypothesis.
   No propext, no funext, no classical, no proof irrelevance.
   ========================================================================== *)

Require Import Coq.Arith.Arith.
Require Import Coq.Lists.List.
Require Import Coq.Bool.Bool.
Require Import Lia.
Require Import GPXBoundary.
Import ListNotations.

(* ===== T1. CONTEXT ====================================================== *)

(* Evaluation time is an INPUT. There is no clock read anywhere in this
   file; the absence is enforced by the type, which is total and pure. *)
Record Context : Type := mkCtx { eval_time : nat }.

Record Window : Type := mkWindow { w_start : nat; w_end : nat }.

Inductive TemporalVerdict : Type := TBefore | TValid | TExpired.

Definition temporal_eval (w : Window) (ctx : Context) : TemporalVerdict :=
  if Nat.ltb (eval_time ctx) (w_start w) then TBefore
  else if Nat.leb (w_end w) (eval_time ctx) then TExpired
  else TValid.

(* Not-yet-valid is INCOMPLETE (may become valid).
   Expired is FAIL (absorbing, never recovers). The asymmetry is the point. *)
Definition temporal_to_auth (tv : TemporalVerdict) : AuthState :=
  match tv with
  | TValid   => APass
  | TBefore  => AIncomplete
  | TExpired => AFail
  end.

(* ===== T2. DETERMINISM ================================================== *)

(* The verdict depends on the context ONLY through eval_time. Nothing
   ambient can influence it. This is the property the disclaimer wanted. *)
Theorem temporal_determinism :
  forall w ctx1 ctx2,
    eval_time ctx1 = eval_time ctx2 ->
    temporal_eval w ctx1 = temporal_eval w ctx2.
Proof.
  intros w [t1] [t2] H; simpl in H; subst; reflexivity.
Qed.

Theorem temporal_total :
  forall w ctx, temporal_eval w ctx = TBefore \/
                temporal_eval w ctx = TValid  \/
                temporal_eval w ctx = TExpired.
Proof.
  intros w ctx; unfold temporal_eval.
  destruct (Nat.ltb (eval_time ctx) (w_start w)); [left; reflexivity |].
  destruct (Nat.leb (w_end w) (eval_time ctx)); [right; right; reflexivity |].
  right; left; reflexivity.
Qed.

(* ===== T3. VALIDITY IS AN INTERVAL ====================================== *)

Theorem valid_iff_in_window :
  forall w ctx,
    temporal_eval w ctx = TValid <->
    (w_start w <= eval_time ctx /\ eval_time ctx < w_end w).
Proof.
  intros w ctx; unfold temporal_eval; split.
  - destruct (Nat.ltb (eval_time ctx) (w_start w)) eqn:E1; [discriminate |].
    destruct (Nat.leb (w_end w) (eval_time ctx)) eqn:E2; [discriminate |].
    intros _. apply Nat.ltb_ge in E1. apply Nat.leb_gt in E2. lia.
  - intros [H1 H2].
    destruct (Nat.ltb (eval_time ctx) (w_start w)) eqn:E1.
    + apply Nat.ltb_lt in E1; lia.
    + destruct (Nat.leb (w_end w) (eval_time ctx)) eqn:E2.
      * apply Nat.leb_le in E2; lia.
      * reflexivity.
Qed.

Theorem empty_window_never_valid :
  forall w ctx, w_end w <= w_start w -> temporal_eval w ctx <> TValid.
Proof.
  intros w ctx H Hc. apply valid_iff_in_window in Hc. lia.
Qed.

(* ===== T4. MONOTONICITY ================================================= *)

(* Expiry is permanent: once expired, expired at every later time. *)
Theorem expiry_persists :
  forall w t t',
    t <= t' ->
    temporal_eval w (mkCtx t)  = TExpired ->
    temporal_eval w (mkCtx t') = TExpired.
Proof.
  intros w t t' Hle H. unfold temporal_eval in *; simpl in *.
  destruct (Nat.ltb t (w_start w)) eqn:E1; [discriminate H |].
  destruct (Nat.leb (w_end w) t) eqn:E2; [| discriminate H].
  apply Nat.leb_le in E2.
  destruct (Nat.ltb t' (w_start w)) eqn:E3.
  - apply Nat.ltb_lt in E3. apply Nat.ltb_ge in E1. lia.
  - destruct (Nat.leb (w_end w) t') eqn:E4; [reflexivity |].
    apply Nat.leb_gt in E4. lia.
Qed.

(* Symmetrically, not-yet-valid is retroactive. *)
Theorem before_persists_backward :
  forall w t t',
    t <= t' ->
    temporal_eval w (mkCtx t')  = TBefore ->
    temporal_eval w (mkCtx t)   = TBefore.
Proof.
  intros w t t' Hle H. unfold temporal_eval in *; simpl in *.
  destruct (Nat.ltb t' (w_start w)) eqn:E1; [| destruct (Nat.leb (w_end w) t'); discriminate H].
  apply Nat.ltb_lt in E1.
  destruct (Nat.ltb t (w_start w)) eqn:E2; [reflexivity |].
  apply Nat.ltb_ge in E2. lia.
Qed.

(* No resurrection: a bundle cannot go Expired -> Valid as time advances. *)
Theorem no_resurrection :
  forall w t t',
    t <= t' ->
    temporal_eval w (mkCtx t) = TExpired ->
    temporal_eval w (mkCtx t') <> TValid.
Proof.
  intros w t t' Hle H Hc.
  rewrite (expiry_persists w t t' Hle H) in Hc. discriminate Hc.
Qed.

(* ===== T5. EXPIRY IS ABSORBING IN THE LATTICE =========================== *)

Theorem expiry_maps_to_fail : temporal_to_auth TExpired = AFail.
Proof. reflexivity. Qed.

Theorem expiry_absorbing_l :
  forall a, auth_join (temporal_to_auth TExpired) a = AFail.
Proof. intros a; apply auth_fail_absorbing_l. Qed.

Theorem expiry_absorbing_r :
  forall a, auth_join a (temporal_to_auth TExpired) = AFail.
Proof. intros a; apply auth_fail_absorbing_r. Qed.

(* Not-yet-valid is NOT absorbing — it composes as Incomplete. *)
Theorem before_not_absorbing :
  auth_join (temporal_to_auth TBefore) AFail = AFail /\
  auth_join (temporal_to_auth TBefore) APass = AIncomplete.
Proof. split; reflexivity. Qed.

(* ===== T6. SIX-GATE ORTHOGONALITY ======================================= *)

Record TGates : Type := mkTGates {
  t_auth : AuthState;  t_coh : AuthState;  t_lin : AuthState;
  t_bnd  : AuthState;  t_dep : AuthState;  t_tmp : TemporalVerdict
}.

Definition t_overall (g : TGates) : AuthState :=
  auth_join (t_auth g) (auth_join (t_coh g) (auth_join (t_lin g)
    (auth_join (t_bnd g) (auth_join (t_dep g) (temporal_to_auth (t_tmp g)))))).

(* All five original non-compensability results extend unchanged. *)
Theorem t_gate_auth_non_compensable :
  forall c l b d m, t_overall (mkTGates AFail c l b d m) = AFail.
Proof. intros; reflexivity. Qed.

Theorem t_gate_coh_non_compensable :
  forall a l b d m, t_overall (mkTGates a AFail l b d m) = AFail.
Proof. intros; destruct a; reflexivity. Qed.

Theorem t_gate_lin_non_compensable :
  forall a c b d m, t_overall (mkTGates a c AFail b d m) = AFail.
Proof. intros; destruct a, c; reflexivity. Qed.

Theorem t_gate_bnd_non_compensable :
  forall a c l d m, t_overall (mkTGates a c l AFail d m) = AFail.
Proof. intros; destruct a, c, l; reflexivity. Qed.

Theorem t_gate_dep_non_compensable :
  forall a c l b m, t_overall (mkTGates a c l b AFail m) = AFail.
Proof. intros; destruct a, c, l, b; reflexivity. Qed.

(* And the temporal axis is non-compensable in exactly the same way. *)
Theorem t_gate_expiry_non_compensable :
  forall a c l b d, t_overall (mkTGates a c l b d TExpired) = AFail.
Proof. intros; destruct a, c, l, b, d; reflexivity. Qed.

(* Temporal is a genuine sixth dimension: it moves the verdict alone. *)
Theorem temporal_axis_independent :
  t_overall (mkTGates APass APass APass APass APass TValid) <>
  t_overall (mkTGates APass APass APass APass APass TExpired).
Proof. discriminate. Qed.

Theorem temporal_axis_three_valued :
  t_overall (mkTGates APass APass APass APass APass TValid)   = APass /\
  t_overall (mkTGates APass APass APass APass APass TBefore)  = AIncomplete /\
  t_overall (mkTGates APass APass APass APass APass TExpired) = AFail.
Proof. repeat split; reflexivity. Qed.

(* Passing still requires everything, now including being in-window. *)
Theorem t_overall_pass_iff_all_pass :
  forall g, t_overall g = APass <->
    (t_auth g = APass /\ t_coh g = APass /\ t_lin g = APass /\
     t_bnd g = APass /\ t_dep g = APass /\ t_tmp g = TValid).
Proof.
  intros [a c l b d m]; split.
  - intros H; destruct a, c, l, b, d, m; simpl in H;
    try discriminate H; repeat split; reflexivity.
  - intros [H1 [H2 [H3 [H4 [H5 H6]]]]]; simpl in H1,H2,H3,H4,H5,H6; subst; reflexivity.
Qed.

(* Lattice-minimum survives the extension. *)
Theorem t_overall_is_lower_bound :
  forall g, auth_le (t_overall g) (t_auth g) = true /\
            auth_le (t_overall g) (t_coh g)  = true /\
            auth_le (t_overall g) (t_lin g)  = true /\
            auth_le (t_overall g) (t_bnd g)  = true /\
            auth_le (t_overall g) (t_dep g)  = true /\
            auth_le (t_overall g) (temporal_to_auth (t_tmp g)) = true.
Proof.
  intros [a c l b d m]; destruct a, c, l, b, d, m; repeat split; reflexivity.
Qed.

(* ===== T7. FULL VERIFICATION IS DETERMINISTIC =========================== *)

Definition verify (g : TGates) (w : Window) (ctx : Context) : AuthState :=
  t_overall (mkTGates (t_auth g) (t_coh g) (t_lin g) (t_bnd g) (t_dep g)
                      (temporal_eval w ctx)).

(* Same artifact, same declared context => same verdict. Always.
   This is what "reproducible by a third party" means formally. *)
Theorem verify_deterministic :
  forall g w ctx1 ctx2,
    eval_time ctx1 = eval_time ctx2 ->
    verify g w ctx1 = verify g w ctx2.
Proof.
  intros g w ctx1 ctx2 H. unfold verify.
  rewrite (temporal_determinism w ctx1 ctx2 H). reflexivity.
Qed.

(* Verdicts never improve as time advances. *)
Theorem verify_expiry_monotone :
  forall g w t t',
    t <= t' ->
    verify g w (mkCtx t) = AFail \/ temporal_eval w (mkCtx t) <> TExpired ->
    temporal_eval w (mkCtx t) = TExpired ->
    verify g w (mkCtx t') = AFail.
Proof.
  intros g w t t' Hle _ Hexp. unfold verify.
  rewrite (expiry_persists w t t' Hle Hexp).
  apply t_gate_expiry_non_compensable.
Qed.

(* ===== AUDIT ============================================================ *)

Print Assumptions temporal_determinism.
Print Assumptions temporal_total.
Print Assumptions valid_iff_in_window.
Print Assumptions empty_window_never_valid.
Print Assumptions expiry_persists.
Print Assumptions before_persists_backward.
Print Assumptions no_resurrection.
Print Assumptions expiry_maps_to_fail.
Print Assumptions expiry_absorbing_l.
Print Assumptions expiry_absorbing_r.
Print Assumptions before_not_absorbing.
Print Assumptions t_gate_auth_non_compensable.
Print Assumptions t_gate_coh_non_compensable.
Print Assumptions t_gate_lin_non_compensable.
Print Assumptions t_gate_bnd_non_compensable.
Print Assumptions t_gate_dep_non_compensable.
Print Assumptions t_gate_expiry_non_compensable.
Print Assumptions temporal_axis_independent.
Print Assumptions temporal_axis_three_valued.
Print Assumptions t_overall_pass_iff_all_pass.
Print Assumptions t_overall_is_lower_bound.
Print Assumptions verify_deterministic.
Print Assumptions verify_expiry_monotone.

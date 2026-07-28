(* ==========================================================================
   GPXDiachronic.v — override as an explicit, witnessed, revocable operator.

   The meet-semilattice in GPXBoundary.v is deliberately unforgiving: AFail
   is absorbing, and that is the security property. Weakening it would let
   passing axes outvote a failing one. So override is NOT a change to the meet.

   Override sits ABOVE the lattice. It is:
     - never automatic      no gate configuration produces it
     - attributed           it carries who granted it
     - scoped               to a named axis, not blanket
     - recorded             the raw verdict remains computable, always
     - honest               AOverrided is visibly not APass
     - expirable            override itself lives in a window
     - revocable            revoke (grant v) = v, exactly

   The last property is what makes it safe: override destroys no information.
   An overridden bundle is not a passing bundle. It is a bundle that failed and
   then had an override recorded against it, and anyone downstream sees both.

   Requires GPXBoundary.v, GPXTemporal.v.
   Coq 8.18.0, stdlib only. Zero Axiom / Admitted / Parameter / Hypothesis.
   ========================================================================== *)

Require Import Coq.Arith.Arith.
Require Import Coq.Lists.List.
Require Import Coq.Bool.Bool.
Require Import Lia.
Require Import GPXBoundary.
Require Import GPXTemporal.
Import ListNotations.

(* ===== G1. THE OVERRIDED STATE ============================================= *)

(* Deliberately a separate inhabitant. An override does not turn a fail into a
   pass; it records that a fail was overridden. Downstream can distinguish. *)
Inductive Standing : Type :=
  | SPass                      (* passing *)
  | SOverridden (axis : nat)       (* failed on `axis`, overridden, on record *)
  | SIncomplete
  | SFail.

Definition standing_of (a : AuthState) : Standing :=
  match a with
  | APass       => SPass
  | AIncomplete => SIncomplete
  | AFail       => SFail
  end.

(* Strict downgrade: overridden standing ranks strictly below passing. *)
Definition standing_rank (s : Standing) : nat :=
  match s with SFail => 0 | SIncomplete => 1 | SOverridden _ => 2 | SPass => 3 end.

Theorem overridden_is_not_pass : forall n, SOverridden n <> SPass.
Proof. intros n H; discriminate H. Qed.

Theorem overridden_ranks_below_pass :
  forall n, standing_rank (SOverridden n) < standing_rank SPass.
Proof. intros n; simpl; lia. Qed.

Theorem overridden_ranks_above_fail :
  forall n, standing_rank SFail < standing_rank (SOverridden n).
Proof. intros n; simpl; lia. Qed.

(* ===== G2. THE GRANT ==================================================== *)

(* Override is an act by someone, for a reason, over a window. All four
   fields are mandatory — there is no anonymous, unbounded, unscoped override. *)
Record Override : Type := mkOverride {
  ov_issuer : nat;      (* identity — attribution is not optional *)
  ov_axis    : nat;      (* which gate is overridden; scoped, not blanket *)
  ov_reason  : nat;      (* reason code — recorded, never empty *)
  ov_window  : Window    (* override itself expires *)
}.

Record Judgement : Type := mkJudgement {
  j_raw   : AuthState;        (* the meet. NEVER modified. *)
  j_override : option Override      (* appended, not overwritten *)
}.

(* The raw verdict survives every operation. This is the append-only
   property expressed at the type level: j_raw is never written twice. *)
Definition raw (j : Judgement) : AuthState := j_raw j.

Definition apply_override (j : Judgement) (g : Override) : Judgement :=
  mkJudgement (j_raw j) (Some g).

Definition revoke_override (j : Judgement) : Judgement :=
  mkJudgement (j_raw j) None.

(* ===== G3. EFFECTIVE STANDING =========================================== *)

(* Override applies only to a genuine failure, only on the axis it names,
   and only while its own window is open. *)
Definition effective (j : Judgement) (axis : nat) (ctx : Context) : Standing :=
  match j_override j with
  | None => standing_of (j_raw j)
  | Some g =>
      if andb (Nat.eqb (ov_axis g) axis)
              (match temporal_eval (ov_window g) ctx with
               | TValid => true | _ => false end)
      then match j_raw j with
           | AFail       => SOverridden axis      (* overridden, and it shows *)
           | AIncomplete => SIncomplete       (* nothing to override yet *)
           | APass       => SPass             (* nothing to override *)
           end
      else standing_of (j_raw j)
  end.

(* ===== G4. OVERRIDE PRESERVES THE RECORD =================================== *)

Theorem override_preserves_raw :
  forall j g, raw (apply_override j g) = raw j.
Proof. intros; reflexivity. Qed.

Theorem revoke_preserves_raw :
  forall j, raw (revoke_override j) = raw j.
Proof. intros; reflexivity. Qed.

(* Override is exactly invertible. It destroys no information. *)
Theorem override_revocable :
  forall j g, j_override j = None -> revoke_override (apply_override j g) = j.
Proof.
  intros [r gr] g H; simpl in H; subst; reflexivity.
Qed.

(* The raw verdict is always recoverable, whatever override was applied. *)
Theorem raw_always_recoverable :
  forall j g ctx axis,
    effective (revoke_override (apply_override j g)) axis ctx = standing_of (raw j).
Proof. intros; reflexivity. Qed.

(* ===== G5. OVERRIDE IS NEVER AUTOMATIC ===================================== *)

(* No gate configuration, however arranged, yields overridden standing.
   Override requires an act. This is the anti-drift property. *)
Theorem override_never_automatic :
  forall a axis ctx,
    effective (mkJudgement a None) axis ctx <> SOverridden axis.
Proof. intros a axis ctx; destruct a; simpl; discriminate. Qed.

(* Override cannot manufacture a pass. A overridden fail is never passing. *)
Theorem override_cannot_produce_pass :
  forall j g axis ctx,
    j_raw j = AFail -> effective (apply_override j g) axis ctx <> SPass.
Proof.
  intros [r gr] g axis ctx H; simpl in H; subst.
  unfold effective, apply_override; simpl.
  destruct (Nat.eqb (ov_axis g) axis); simpl.
  - destruct (temporal_eval (ov_window g) ctx); simpl; discriminate.
  - discriminate.
Qed.

(* ===== G6. OVERRIDE IS SCOPED ============================================== *)

(* A override on one axis does nothing on another. No cross-axis effect. *)
Theorem override_scoped :
  forall j g axis,
    ov_axis g <> axis ->
    forall ctx, effective (apply_override j g) axis ctx = standing_of (raw j).
Proof.
  intros j g axis Hne ctx.
  unfold effective, apply_override, raw; simpl.
  destruct (Nat.eqb (ov_axis g) axis) eqn:E; simpl.
  - apply Nat.eqb_eq in E; contradiction.
  - reflexivity.
Qed.

(* ===== G7. OVERRIDE ITSELF EXPIRES ========================================= *)

Theorem override_expires :
  forall j g axis ctx,
    temporal_eval (ov_window g) ctx = TExpired ->
    effective (apply_override j g) axis ctx = standing_of (raw j).
Proof.
  intros j g axis ctx H.
  unfold effective, apply_override, raw; simpl; rewrite H.
  destruct (Nat.eqb (ov_axis g) axis); simpl; reflexivity.
Qed.

Theorem override_not_yet_active :
  forall j g axis ctx,
    temporal_eval (ov_window g) ctx = TBefore ->
    effective (apply_override j g) axis ctx = standing_of (raw j).
Proof.
  intros j g axis ctx H.
  unfold effective, apply_override, raw; simpl; rewrite H.
  destruct (Nat.eqb (ov_axis g) axis); simpl; reflexivity.
Qed.

(* ===== G8. THE LATTICE IS UNTOUCHED ===================================== *)

(* Every non-compensability result in GPXBoundary.v still holds verbatim,
   because override never enters the meet. Restated here to make it checkable. *)
Theorem meet_unchanged_by_override :
  forall c l b d, overall (mkGates AFail c l b d) = AFail.
Proof. intros; apply gate_auth_non_compensable. Qed.

Theorem override_does_not_weaken_meet :
  forall (g : Gates) (axis : nat) (ctx : Context),
    raw (apply_override (mkJudgement (overall g) None)
                     (mkOverride 0 axis 0 (mkWindow 0 0))) = overall g.
Proof. intros; reflexivity. Qed.

(* Two grants do not chain into general permission: the second replaces
   the first rather than accumulating scope. *)
Theorem override_does_not_accumulate :
  forall j g1 g2,
    apply_override (apply_override j g1) g2 = apply_override j g2.
Proof. intros [r gr] g1 g2; reflexivity. Qed.

(* ===== G9. AUDITABILITY ================================================= *)

(* You can always ask both questions and get both answers. *)
Definition audit (j : Judgement) (axis : nat) (ctx : Context)
  : AuthState * Standing * option nat :=
  (raw j, effective j axis ctx,
   match j_override j with Some g => Some (ov_issuer g) | None => None end).

Theorem audit_exposes_raw :
  forall j axis ctx, fst (fst (audit j axis ctx)) = raw j.
Proof. intros; reflexivity. Qed.

Theorem audit_exposes_issuer :
  forall j g axis ctx, snd (audit (apply_override j g) axis ctx) = Some (ov_issuer g).
Proof. intros; reflexivity. Qed.

Theorem absent_override_has_no_issuer :
  forall a axis ctx, snd (audit (mkJudgement a None) axis ctx) = None.
Proof. intros; reflexivity. Qed.

(* ===== AUDIT ============================================================ *)

Print Assumptions overridden_is_not_pass.
Print Assumptions overridden_ranks_below_pass.
Print Assumptions overridden_ranks_above_fail.
Print Assumptions override_preserves_raw.
Print Assumptions revoke_preserves_raw.
Print Assumptions override_revocable.
Print Assumptions raw_always_recoverable.
Print Assumptions override_never_automatic.
Print Assumptions override_cannot_produce_pass.
Print Assumptions override_scoped.
Print Assumptions override_expires.
Print Assumptions override_not_yet_active.
Print Assumptions meet_unchanged_by_override.
Print Assumptions override_does_not_weaken_meet.
Print Assumptions override_does_not_accumulate.
Print Assumptions audit_exposes_raw.
Print Assumptions audit_exposes_issuer.
Print Assumptions absent_override_has_no_issuer.

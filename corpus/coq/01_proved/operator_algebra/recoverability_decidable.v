(** ============================================================ *)
(** kernel.v — CORE DEFINITIONS                                  *)
(**                                                              *)
(** System tuple S = (P, O, M, C)                                *)
(** Primitives, states, operators, coherence, identity.          *)
(** Everything else imports this.                                 *)
(** ============================================================ *)

Require Import ZArith.
Require Import List.
Require Import Lia.
Import ListNotations.
Open Scope Z_scope.

(* ============================================================ *)
(* §I.  PRIMITIVES (Part II of spec)                             *)
(* ============================================================ *)

(** A primitive is an atomic unit with immutable identity.
    id(p) never changes under any operator. *)

Record primitive := mkPrim {
  prim_id   : nat;        (** globally unique identifier *)
  prim_coh  : Z;          (** coherence value >= 0 *)
  prim_kind : nat         (** domain tag: 0=text, 1=image, etc. *)
}.

(** Non-negative coherence *)
Definition prim_valid (p : primitive) : Prop :=
  prim_coh p >= 0.

(* ============================================================ *)
(* §II.  STATE (Part III — point on the manifold)                *)
(* ============================================================ *)

(** A state is a configuration of primitives with aggregate
    coherence and a lineage trace. This is a point on M. *)

Record state := mkState {
  st_prims     : list primitive;   (** primitive set *)
  coh_budget   : Z;                (** aggregate coherence C(x) *)
  st_lineage   : list nat;         (** provenance chain *)
  st_step      : nat               (** chain position *)
}.

(** State well-formedness: coherence non-negative,
    all primitives valid *)
Definition state_valid (s : state) : Prop :=
  coh_budget s >= 0 /\
  Forall prim_valid (st_prims s).

(* ============================================================ *)
(* §III.  OPERATOR TYPECLASS (Parts VI-VII of spec)              *)
(* ============================================================ *)

(** Every operator must implement apply and satisfy invariants.
    The typeclass is parameterized by the operator's config type. *)

Class Operator (O : Type) := {
  (** Apply the operator to a state *)
  apply : O -> state -> option state;

  (** Coherence tolerance — bounded loss per step *)
  eps : Z;

  (** eps is non-negative *)
  eps_nonneg : eps >= 0;

  (** INVARIANT: closure — output is a valid state *)
  apply_closure : forall (o : O) (x x' : state),
    state_valid x ->
    apply o x = Some x' ->
    state_valid x';

  (** INVARIANT: bounded coherence loss *)
  apply_coh_bound : forall (o : O) (x x' : state),
    state_valid x ->
    apply o x = Some x' ->
    coh_budget x' >= coh_budget x - eps;

  (** INVARIANT: identity preservation —
      primitive IDs are unchanged *)
  apply_id_preservation : forall (o : O) (x x' : state),
    apply o x = Some x' ->
    map prim_id (st_prims x') = map prim_id (st_prims x);

  (** INVARIANT: lineage extension —
      provenance is append-only *)
  apply_lineage_extends : forall (o : O) (x x' : state),
    apply o x = Some x' ->
    exists suffix, st_lineage x' = st_lineage x ++ suffix
}.

(* ============================================================ *)
(* §IV.  COHERENCE (Part IV of spec)                             *)
(* ============================================================ *)

(** Coherence is a weighted sum of component measures.
    C(x) = sum_k w_k * c_k(x)
    Here we work with the aggregate coh_budget field. *)

Definition coherence (s : state) : Z := coh_budget s.

(** Coherence gradient direction: positive means improving *)
Definition coh_improving (x x' : state) : Prop :=
  coh_budget x' > coh_budget x.

Definition coh_stable (x x' : state) (tolerance : Z) : Prop :=
  coh_budget x' >= coh_budget x - tolerance.

(* ============================================================ *)
(* §V.  EVENT HORIZON (Part VIII of spec)                        *)
(* ============================================================ *)

(** E(x_target) = C(x_target) - U(x_target) - D(x_target)
    E > 0  means recoverable
    E <= 0 means not recoverable *)

Record horizon_input := mkHorizon {
  hi_coherence   : Z;    (* C target *)
  hi_uncertainty  : Z;    (* U target *)
  hi_distance     : Z     (* D target *)
}.

Definition event_horizon (h : horizon_input) : Z :=
  hi_coherence h - hi_uncertainty h - hi_distance h.

Definition recoverable (h : horizon_input) : Prop :=
  event_horizon h > 0.

Definition unrecoverable (h : horizon_input) : Prop :=
  event_horizon h <= 0.

Theorem recoverability_decidable : forall h,
  recoverable h \/ unrecoverable h.
Proof.
  intro h. unfold recoverable, unrecoverable.
  lia.
Qed.

Theorem recoverability_exclusive : forall h,
  ~ (recoverable h /\ unrecoverable h).
Proof.
  intro h. unfold recoverable, unrecoverable. lia.
Qed.

(* ============================================================ *)
(* §VI.  CHAIN LENGTH BOUND (Invariant 5)                       *)
(* ============================================================ *)

(** Maximum operator chain length — prevents unbounded recursion *)
Definition chain_max : nat := 1000.

Definition chain_within_bound (s : state) : Prop :=
  (st_step s <= chain_max)%nat.

(* ============================================================ *)
(* §VII.  FOUR-OUTCOME VERIFICATION (from Admissibility)         *)
(* ============================================================ *)

Inductive VerifyResult : Type :=
  | V_ACCEPT   (** state is admissible *)
  | V_REJECT   (** invariant violation detected *)
  | V_HALT     (** undecidability boundary reached *)
  | V_VOID.    (** annihilation / zero-divisor *)

Theorem verify_result_exhaustive : forall v : VerifyResult,
  v = V_ACCEPT \/ v = V_REJECT \/ v = V_HALT \/ v = V_VOID.
Proof. destruct v; auto. Qed.

Theorem verify_results_distinct :
  V_ACCEPT <> V_REJECT /\ V_ACCEPT <> V_HALT /\ V_ACCEPT <> V_VOID /\
  V_REJECT <> V_HALT /\ V_REJECT <> V_VOID /\ V_HALT <> V_VOID.
Proof. repeat split; discriminate. Qed.

(** Runtime verification of a state *)
Definition verify_state (s : state) : VerifyResult :=
  if Z.leb (coh_budget s) (-1) then V_VOID
  else if Z.eqb (coh_budget s) 0 then V_HALT
  else if negb (Nat.leb (st_step s) chain_max) then V_REJECT
  else V_ACCEPT.

Theorem verify_accept_implies_valid : forall s,
  verify_state s = V_ACCEPT ->
  coh_budget s > 0 /\ (st_step s <= chain_max)%nat.
Proof.
  intros s H. unfold verify_state in H.
  destruct (Z.leb (coh_budget s) (-1)) eqn:E1; [discriminate|].
  destruct (Z.eqb (coh_budget s) 0) eqn:E2; [discriminate|].
  destruct (Nat.leb (st_step s) chain_max) eqn:E3; simpl in H; [|discriminate].
  split.
  - apply Z.leb_gt in E1. apply Z.eqb_neq in E2. lia.
  - apply Nat.leb_le. exact E3.
Qed.

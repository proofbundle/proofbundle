(*---------------------------------------------------------------*)
(* Operator_compose — closed proofs and documented failures       *)
(*                                                                 *)
(* Result: Lipschitz and Identity CLOSE (no axioms).               *)
(*         Budgeted: provable at bound 2, not 1.                   *)
(*         Irreducible: requires UUID-freshness assumption.         *)
(*---------------------------------------------------------------*)
Require Import Coq.Lists.List.
Require Import Coq.Strings.String.
Require Import Coq.Strings.Byte.
Require Import Coq.ZArith.ZArith.
Require Import Coq.micromega.Lia.
Import ListNotations.
Open Scope Z_scope.

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

Class Operator (O : Type) := {
  apply : O -> state -> option state;
  Lipschitz : forall o x y x' y',
    apply o x = Some x' -> apply o y = Some y' ->
    Z.abs (coh_budget x' - coh_budget y') <= Z.abs (coh_budget x - coh_budget y);
  Irreducible : forall o x x',
    apply o x = Some x' ->
    forall p, List.In p (prims x') -> ~ List.In p (prims x);
  Budgeted : forall o x x',
    apply o x = Some x' ->
    Z.abs (coh_budget x' - coh_budget x) <= 1;
  Identity : forall o x x',
    apply o x = Some x' ->
    root_id x' = root_id x
}.

Definition seq_apply {O1 O2} `{Operator O1} `{Operator O2}
  (pair : O1 * O2) (s : state) : option state :=
  match apply (fst pair) s with
  | None => None
  | Some s_mid => apply (snd pair) s_mid
  end.

(* ================================================================= *)
(* CLOSED: Lipschitz preserved under composition                     *)
(* No axioms. Each operator is non-expanding on coherence budget.    *)
(* Composition of non-expanding maps is non-expanding.               *)
(* ================================================================= *)
Lemma compose_Lipschitz {O1 O2} `{H1: Operator O1} `{H2: Operator O2} :
  forall (p : O1 * O2) x y x'' y'',
    seq_apply p x = Some x'' ->
    seq_apply p y = Some y'' ->
    Z.abs (coh_budget x'' - coh_budget y'') <= Z.abs (coh_budget x - coh_budget y).
Proof.
  intros [o1 o2] x y x'' y'' Hx Hy.
  unfold seq_apply in Hx, Hy. simpl in *.
  destruct (apply o1 x) as [x'|] eqn:E1x; [|discriminate].
  destruct (apply o1 y) as [y'|] eqn:E1y; [|discriminate].
  pose proof (@Lipschitz O1 H1 o1 x y x' y' E1x E1y) as L1.
  pose proof (@Lipschitz O2 H2 o2 x' y' x'' y'' Hx Hy) as L2.
  lia.
Qed.

(* ================================================================= *)
(* CLOSED: Identity preserved under composition                      *)
(* No axioms. Each operator preserves root_id. Transitivity.         *)
(* ================================================================= *)
Lemma compose_Identity {O1 O2} `{H1: Operator O1} `{H2: Operator O2} :
  forall (p : O1 * O2) x x'',
    seq_apply p x = Some x'' ->
    root_id x'' = root_id x.
Proof.
  intros [o1 o2] x x'' Hx.
  unfold seq_apply in Hx. simpl in *.
  destruct (apply o1 x) as [x'|] eqn:E1; [|discriminate].
  pose proof (@Identity O1 H1 o1 x x' E1) as I1.
  pose proof (@Identity O2 H2 o2 x' x'' Hx) as I2.
  congruence.
Qed.

(* ================================================================= *)
(* CLOSED AT WEAKENED BOUND: Budgeted under composition              *)
(* Each operator shifts budget by at most 1.                         *)
(* Composition shifts by at most 2 (triangle inequality).            *)
(* The class requires bound 1, so this CANNOT instantiate the class  *)
(* without changing the spec.                                        *)
(* ================================================================= *)
Lemma compose_Budgeted_2 {O1 O2} `{H1: Operator O1} `{H2: Operator O2} :
  forall (p : O1 * O2) x x'',
    seq_apply p x = Some x'' ->
    Z.abs (coh_budget x'' - coh_budget x) <= 2.
Proof.
  intros [o1 o2] x x'' Hx.
  unfold seq_apply in Hx. simpl in *.
  destruct (apply o1 x) as [x'|] eqn:E1; [|discriminate].
  pose proof (@Budgeted O1 H1 o1 x x' E1) as B1.
  pose proof (@Budgeted O2 H2 o2 x' x'' Hx) as B2.
  assert (T : Z.abs (coh_budget x'' - coh_budget x) <=
              Z.abs (coh_budget x'' - coh_budget x') +
              Z.abs (coh_budget x' - coh_budget x)).
  { replace (coh_budget x'' - coh_budget x) with
      ((coh_budget x'' - coh_budget x') + (coh_budget x' - coh_budget x)) by ring.
    apply Z.abs_triangle. }
  lia.
Qed.

(* ================================================================= *)
(* CANNOT CLOSE: Irreducible under composition                       *)
(*                                                                    *)
(* Given:                                                             *)
(*   o1: forall p in prims(x'), p not in prims(x)                    *)
(*   o2: forall p in prims(x''), p not in prims(x')                  *)
(* Need:                                                              *)
(*   forall p in prims(x''), p not in prims(x)                       *)
(*                                                                    *)
(* Counterexample: suppose prims(x) = {a}, prims(x') = {b},         *)
(*   prims(x'') = {a}. o1 satisfies Irreducible (b not in {a}).      *)
(*   o2 satisfies Irreducible (a not in {b}). But a IS in prims(x).  *)
(*                                                                    *)
(* Fix: require UUID-based global freshness. Each operator generates  *)
(* primitives with UUIDs drawn from a monotonic counter, so no       *)
(* operator can ever produce a UUID that appeared in any prior state. *)
(* This is an additional axiom about the runtime, not derivable from *)
(* the current class spec.                                           *)
(* ================================================================= *)

(* ================================================================= *)
(* FIXED CLASS: parameterize budget bound, add UUID freshness        *)
(* ================================================================= *)

(* Freshness: primitive identity is by UUID *)
Definition prim_id_in (p : primitive) (ps : list primitive) : Prop :=
  exists q, List.In q ps /\ prim_id q = prim_id p.

Class Operator_v2 (O : Type) (budget_bound : Z) := {
  apply_v2 : O -> state -> option state;
  Lipschitz_v2 : forall o x y x' y',
    apply_v2 o x = Some x' -> apply_v2 o y = Some y' ->
    Z.abs (coh_budget x' - coh_budget y') <= Z.abs (coh_budget x - coh_budget y);
  (* UUID-based freshness: no new primitive shares a UUID with any input primitive *)
  Fresh_v2 : forall o x x',
    apply_v2 o x = Some x' ->
    forall p, List.In p (prims x') -> ~ prim_id_in p (prims x);
  Budgeted_v2 : forall o x x',
    apply_v2 o x = Some x' ->
    Z.abs (coh_budget x' - coh_budget x) <= budget_bound;
  Identity_v2 : forall o x x',
    apply_v2 o x = Some x' ->
    root_id x' = root_id x
}.

Definition seq_apply_v2 {O1 O2 b1 b2} `{Operator_v2 O1 b1} `{Operator_v2 O2 b2}
  (pair : O1 * O2) (s : state) : option state :=
  match apply_v2 (fst pair) s with
  | None => None
  | Some s_mid => apply_v2 (snd pair) s_mid
  end.

(* Lipschitz: same proof as before *)
Lemma compose_Lipschitz_v2 {O1 O2 b1 b2}
  `{H1: Operator_v2 O1 b1} `{H2: Operator_v2 O2 b2} :
  forall (p : O1 * O2) x y x'' y'',
    seq_apply_v2 p x = Some x'' ->
    seq_apply_v2 p y = Some y'' ->
    Z.abs (coh_budget x'' - coh_budget y'') <= Z.abs (coh_budget x - coh_budget y).
Proof.
  intros [o1 o2] x y x'' y'' Hx Hy.
  unfold seq_apply_v2 in Hx, Hy. simpl in *.
  destruct (apply_v2 o1 x) as [x'|] eqn:E1x; [|discriminate].
  destruct (apply_v2 o1 y) as [y'|] eqn:E1y; [|discriminate].
  pose proof (@Lipschitz_v2 O1 b1 H1 o1 x y x' y' E1x E1y) as L1.
  pose proof (@Lipschitz_v2 O2 b2 H2 o2 x' y' x'' y'' Hx Hy) as L2.
  lia.
Qed.

(* Identity: same as before *)
Lemma compose_Identity_v2 {O1 O2 b1 b2}
  `{H1: Operator_v2 O1 b1} `{H2: Operator_v2 O2 b2} :
  forall (p : O1 * O2) x x'',
    seq_apply_v2 p x = Some x'' ->
    root_id x'' = root_id x.
Proof.
  intros [o1 o2] x x'' Hx.
  unfold seq_apply_v2 in Hx. simpl in *.
  destruct (apply_v2 o1 x) as [x'|] eqn:E1; [|discriminate].
  pose proof (@Identity_v2 O1 b1 H1 o1 x x' E1) as I1.
  pose proof (@Identity_v2 O2 b2 H2 o2 x' x'' Hx) as I2.
  congruence.
Qed.

(* Budgeted: now closes with bound b1 + b2 *)
Lemma compose_Budgeted_v2 {O1 O2 b1 b2}
  `{H1: Operator_v2 O1 b1} `{H2: Operator_v2 O2 b2} :
  forall (p : O1 * O2) x x'',
    seq_apply_v2 p x = Some x'' ->
    Z.abs (coh_budget x'' - coh_budget x) <= b1 + b2.
Proof.
  intros [o1 o2] x x'' Hx.
  unfold seq_apply_v2 in Hx. simpl in *.
  destruct (apply_v2 o1 x) as [x'|] eqn:E1; [|discriminate].
  pose proof (@Budgeted_v2 O1 b1 H1 o1 x x' E1) as B1.
  pose proof (@Budgeted_v2 O2 b2 H2 o2 x' x'' Hx) as B2.
  assert (T : Z.abs (coh_budget x'' - coh_budget x) <=
              Z.abs (coh_budget x'' - coh_budget x') +
              Z.abs (coh_budget x' - coh_budget x)).
  { replace (coh_budget x'' - coh_budget x) with
      ((coh_budget x'' - coh_budget x') + (coh_budget x' - coh_budget x)) by ring.
    apply Z.abs_triangle. }
  lia.
Qed.

(* Fresh: closes with UUID-based freshness + transitivity *)
(* This requires that UUID freshness is transitive through the      *)
(* intermediate state. We need: if o1 guarantees all UUIDs in x'    *)
(* are fresh w.r.t. x, and o2 guarantees all UUIDs in x'' are      *)
(* fresh w.r.t. x', then we need UUIDs in x'' fresh w.r.t. x.     *)
(* This does NOT follow from the spec alone — same counterexample.  *)
(* We need a GLOBAL freshness oracle.                               *)

(* Global UUID freshness: no two distinct operator applications     *)
(* ever produce a primitive with the same UUID. We model this as:   *)
(* the set of UUIDs in any operator output is disjoint from the     *)
(* set of UUIDs in ANY state that is not the direct input.          *)
Axiom uuid_global_freshness :
  forall {O1 O2 b1 b2} `{H1: Operator_v2 O1 b1} `{H2: Operator_v2 O2 b2}
    (o1 : O1) (o2 : O2) (x x' x'' : state),
    apply_v2 o1 x = Some x' ->
    apply_v2 o2 x' = Some x'' ->
    forall p, List.In p (prims x'') -> ~ prim_id_in p (prims x).

Lemma compose_Fresh_v2 {O1 O2 b1 b2}
  `{H1: Operator_v2 O1 b1} `{H2: Operator_v2 O2 b2} :
  forall (pair : O1 * O2) x x'',
    seq_apply_v2 pair x = Some x'' ->
    forall p, List.In p (prims x'') -> ~ prim_id_in p (prims x).
Proof.
  intros [o1 o2] x x'' Hx p Hin.
  unfold seq_apply_v2 in Hx. simpl in *.
  destruct (apply_v2 o1 x) as [x'|] eqn:E1; [|discriminate].
  exact (uuid_global_freshness o1 o2 x x' x'' E1 Hx p Hin).
Qed.

(* ================================================================= *)
(* Full composition instance for Operator_v2                         *)
(* ================================================================= *)
Instance Operator_v2_compose {O1 O2 b1 b2}
  `{H1: Operator_v2 O1 b1} `{H2: Operator_v2 O2 b2}
  : Operator_v2 (O1 * O2) (b1 + b2) := {
  apply_v2 := seq_apply_v2;
  Lipschitz_v2 := compose_Lipschitz_v2;
  Fresh_v2 := compose_Fresh_v2;
  Budgeted_v2 := compose_Budgeted_v2;
  Identity_v2 := compose_Identity_v2
}.

Theorem closure_under_composition_v2 :
  forall (O1 O2 : Type) (b1 b2 : Z)
    `{Operator_v2 O1 b1} `{Operator_v2 O2 b2},
    Operator_v2 (O1 * O2) (b1 + b2).
Proof. exact _. Qed.

Print Assumptions closure_under_composition_v2.

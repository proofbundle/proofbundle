Require Import Reals.
Require Import QArith.
Require Import Arith.
Require Import List.
Require Import Psatz.

(* ── Ledger type (simplified ProofBundle anchoring) ──────────────── *)
Inductive Ledger : Type :=
  | empty : Ledger
  | anchor : nat -> Ledger -> Ledger.

Fixpoint count_anchored (l : Ledger) : nat :=
  match l with
  | empty => 0
  | anchor _ rest => S (count_anchored rest)
  end.

Fixpoint append_ledger (l1 l2 : Ledger) : Ledger :=
  match l1 with
  | empty => l2
  | anchor n rest => anchor n (append_ledger rest l2)
  end.

Notation "l1 ++ l2" := (append_ledger l1 l2) (at level 60, right associativity).

(* ── Cost / standing types ───────────────────────────────────────── *)
Parameter ost_T0 : nat -> R -> R -> R -> R.
Parameter evidence_accumulated : nat -> R -> R -> R -> Q -> R.
Parameter liability_active : R -> R -> Prop.
Parameter cost_compliance : R -> R.
Parameter cost_noncompliance : R -> R.

(* ── Axioms / hypotheses ──────────────────────────────────────────── *)
Axiom standing_asymmetry_strict : forall (N : nat) (r f : R),
  (INR N > 0)%R -> (r > 0)%R -> (f > 0)%R -> (ost_T0 N r f 1 > 0)%R.

Axiom evidence_nonneg : forall (N : nat) (r f k_e : R) (T : Q),
  (INR N > 0)%R -> (r > 0)%R -> (f > 0)%R -> (k_e > 0)%R ->
  (evidence_accumulated N r f k_e T >= 0)%R.

Axiom crossover_time_exists : forall (N : nat) (r f k_e c_eng : R),
  (INR N > 0)%R -> (r > 0)%R -> (f > 0)%R -> (k_e > 0)%R -> (c_eng > 0)%R ->
  exists T : Q, (0 < T)%Q /\ liability_active (evidence_accumulated N r f k_e T) c_eng.

Axiom compliance_strict_dominance : forall (N : nat) (r f k_e c_eng : R) (T : Q),
  (INR N > 0)%R -> (r > 0)%R -> (f > 0)%R -> (k_e > 0)%R -> (c_eng > 0)%R ->
  liability_active (evidence_accumulated N r f k_e T) c_eng ->
  (cost_compliance c_eng < cost_noncompliance (evidence_accumulated N r f k_e T))%R.

Axiom evidence_monotone_under_append : forall (l1 l2 : Ledger),
  (count_anchored l1 <= count_anchored (l1 ++ l2))%nat.

(* ── Main theorem ────────────────────────────────────────────────── *)
Theorem liability_convergence :
  forall (N : nat) (r f k_e c_eng : R),
  (INR N > 0)%R ->
  (r > 0)%R ->
  (f > 0)%R ->
  (k_e > 0)%R ->
  (c_eng > 0)%R ->
  (ost_T0 N r f 1 > 0)%R /\
  (evidence_accumulated N r f k_e 1 >= 0)%R /\
  exists T : Q,
    (0 < T)%Q /\
    liability_active (evidence_accumulated N r f k_e T) c_eng /\
    (cost_compliance c_eng < cost_noncompliance (evidence_accumulated N r f k_e T))%R /\
    forall (id : nat) (l1 l2 : Ledger),
      (count_anchored l1 <= count_anchored (l1 ++ l2))%nat.
Proof.
  intros N r f k_e c_eng HN Hr Hf Hk Hc.
  repeat split.
  - eapply standing_asymmetry_strict; eauto.
  - eapply evidence_nonneg; eauto.
  - destruct (crossover_time_exists N r f k_e c_eng HN Hr Hf Hk Hc) as [T [HT Hlia]].
    exists T. repeat split.
    + exact HT.
    + exact Hlia.
    + eapply compliance_strict_dominance; eauto.
    + intros id l1 l2. apply evidence_monotone_under_append.
Qed.

(* ── QED. ─────────────────────────────────────────────────────────── *)
Print liability_convergence.
Check liability_convergence.

(* ============================================== *)
(* Relational Spoof Blocking                       *)
(* No reals, no ordered fields, no thresholds.     *)
(* Pure predicate structure over C1-C5.            *)
(* ============================================== *)

Section ConsciousnessCriterion.

(* Abstract sorts *)
Variable System : Type.
Variable Interval : Type.
Variable ComparisonModel : Type.

(* The five conditions *)
Variable C1 C2 C3 C4 C5 : System -> Interval -> Prop.

(* Attribution is their conjunction *)
Definition Attribution (S : System) (I : Interval) : Prop :=
  C1 S I /\ C2 S I /\ C3 S I /\ C4 S I /\ C5 S I.

(* --- Relational spoof apparatus --- *)

(* A comparison model can "match" a system on a given condition *)
Variable matches_on : ComparisonModel -> System -> Interval ->
  (System -> Interval -> Prop) -> Prop.

(* A system is spoofable on condition Ci if there exists a comparison
   model that matches S on all OTHER conditions but fails Ci. *)

(* Spoofable_on_C1: something in the comparison class looks like S
   on C2-C5 but fails C1. *)
Definition Spoofable_on_C1 (S : System) (I : Interval) :=
  exists M : ComparisonModel,
    matches_on M S I C2 /\ matches_on M S I C3 /\
    matches_on M S I C4 /\ matches_on M S I C5 /\
    ~ matches_on M S I C1.

Definition Spoofable_on_C2 (S : System) (I : Interval) :=
  exists M : ComparisonModel,
    matches_on M S I C1 /\ matches_on M S I C3 /\
    matches_on M S I C4 /\ matches_on M S I C5 /\
    ~ matches_on M S I C2.

Definition Spoofable_on_C3 (S : System) (I : Interval) :=
  exists M : ComparisonModel,
    matches_on M S I C1 /\ matches_on M S I C2 /\
    matches_on M S I C4 /\ matches_on M S I C5 /\
    ~ matches_on M S I C3.

Definition Spoofable_on_C4 (S : System) (I : Interval) :=
  exists M : ComparisonModel,
    matches_on M S I C1 /\ matches_on M S I C2 /\
    matches_on M S I C3 /\ matches_on M S I C5 /\
    ~ matches_on M S I C4.

Definition Spoofable_on_C5 (S : System) (I : Interval) :=
  exists M : ComparisonModel,
    matches_on M S I C1 /\ matches_on M S I C2 /\
    matches_on M S I C3 /\ matches_on M S I C4 /\
    ~ matches_on M S I C5.

(* Adversarial sufficiency: the protocol is nontrivial iff
   each condition is independently spoofable. *)
Definition AdversarialSufficiency (S : System) (I : Interval) :=
  Spoofable_on_C1 S I /\ Spoofable_on_C2 S I /\
  Spoofable_on_C3 S I /\ Spoofable_on_C4 S I /\
  Spoofable_on_C5 S I.

(* A system is fully spoofable if a single comparison model
   matches on ALL five conditions. *)
Definition FullySpoof (S : System) (I : Interval) :=
  exists M : ComparisonModel,
    matches_on M S I C1 /\ matches_on M S I C2 /\
    matches_on M S I C3 /\ matches_on M S I C4 /\
    matches_on M S I C5.

(* --- Theorems --- *)

(* T1. Conjunctive blocking — reproved here for completeness *)
Theorem conjunctive_blocking : forall S I,
  (~ C1 S I \/ ~ C2 S I \/ ~ C3 S I \/ ~ C4 S I \/ ~ C5 S I) ->
  ~ Attribution S I.
Proof.
  intros S I Hneg [H1 [H2 [H3 [H4 H5]]]].
  destruct Hneg as [N|[N|[N|[N|N]]]]; exact (N ltac:(assumption)).
Qed.

(* T4-rel. Relational spoof blocking.
   If a system is fully spoofable, then Attribution tells you nothing
   that the spoof doesn't also satisfy. Formally: full spoofability
   is consistent with each Ci holding or failing independently.
   
   But the actually provable claim without extra axioms is weaker
   and more honest: if we KNOW some Ci fails for S, then S is not
   attributed, regardless of what spoof models exist. The spoof
   apparatus doesn't strengthen blocking — conjunction already does
   all the work.
   
   The nontrivial relational claim is about the PROTOCOL, not the
   system: adversarial sufficiency guarantees that no single
   condition is redundant. *)

(* Protocol nontriviality: if adversarial sufficiency holds,
   then no four conditions imply the fifth.
   
   Stated contrapositively: if C2-C5 implied C1, then nothing
   in the comparison class could match on C2-C5 while failing C1,
   contradicting Spoofable_on_C1. *)

Theorem condition_independence_C1 : forall S I,
  Spoofable_on_C1 S I ->
  ~ (forall M, matches_on M S I C2 -> matches_on M S I C3 ->
     matches_on M S I C4 -> matches_on M S I C5 ->
     matches_on M S I C1).
Proof.
  intros S I [M [Hm2 [Hm3 [Hm4 [Hm5 Hnm1]]]]].
  intro Himplies.
  apply Hnm1.
  exact (Himplies M Hm2 Hm3 Hm4 Hm5).
Qed.

Theorem condition_independence_C2 : forall S I,
  Spoofable_on_C2 S I ->
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C3 ->
     matches_on M S I C4 -> matches_on M S I C5 ->
     matches_on M S I C2).
Proof.
  intros S I [M [Hm1 [Hm3 [Hm4 [Hm5 Hnm2]]]]].
  intro Himplies.
  apply Hnm2.
  exact (Himplies M Hm1 Hm3 Hm4 Hm5).
Qed.

Theorem condition_independence_C3 : forall S I,
  Spoofable_on_C3 S I ->
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
     matches_on M S I C4 -> matches_on M S I C5 ->
     matches_on M S I C3).
Proof.
  intros S I [M [Hm1 [Hm2 [Hm4 [Hm5 Hnm3]]]]].
  intro Himplies.
  apply Hnm3.
  exact (Himplies M Hm1 Hm2 Hm4 Hm5).
Qed.

Theorem condition_independence_C4 : forall S I,
  Spoofable_on_C4 S I ->
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
     matches_on M S I C3 -> matches_on M S I C5 ->
     matches_on M S I C4).
Proof.
  intros S I [M [Hm1 [Hm2 [Hm3 [Hm5 Hnm4]]]]].
  intro Himplies.
  apply Hnm4.
  exact (Himplies M Hm1 Hm2 Hm3 Hm5).
Qed.

Theorem condition_independence_C5 : forall S I,
  Spoofable_on_C5 S I ->
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
     matches_on M S I C3 -> matches_on M S I C4 ->
     matches_on M S I C5).
Proof.
  intros S I [M [Hm1 [Hm2 [Hm3 [Hm4 Hnm5]]]]].
  intro Himplies.
  apply Hnm5.
  exact (Himplies M Hm1 Hm2 Hm3 Hm4).
Qed.

(* Full adversarial sufficiency entails full independence *)
Theorem full_independence : forall S I,
  AdversarialSufficiency S I ->
  ~ (forall M, matches_on M S I C2 -> matches_on M S I C3 ->
     matches_on M S I C4 -> matches_on M S I C5 ->
     matches_on M S I C1) /\
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C3 ->
     matches_on M S I C4 -> matches_on M S I C5 ->
     matches_on M S I C2) /\
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
     matches_on M S I C4 -> matches_on M S I C5 ->
     matches_on M S I C3) /\
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
     matches_on M S I C3 -> matches_on M S I C5 ->
     matches_on M S I C4) /\
  ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
     matches_on M S I C3 -> matches_on M S I C4 ->
     matches_on M S I C5).
Proof.
  intros S I [HS1 [HS2 [HS3 [HS4 HS5]]]].
  repeat split.
  - exact (condition_independence_C1 S I HS1).
  - exact (condition_independence_C2 S I HS2).
  - exact (condition_independence_C3 S I HS3).
  - exact (condition_independence_C4 S I HS4).
  - exact (condition_independence_C5 S I HS5).
Qed.

(* Monotone hardening: if the comparison class grows, spoofability
   can only increase. Stated relationally: if every model in M_small
   is also in M_large, then Spoofable_on_Ci under M_small implies
   Spoofable_on_Ci under M_large.
   
   This requires parameterizing spoofability over the class. *)

Variable in_class : ComparisonModel -> Prop.

Definition Spoofable_on_C1_in (S : System) (I : Interval)
  (cls : ComparisonModel -> Prop) :=
  exists M, cls M /\
    matches_on M S I C2 /\ matches_on M S I C3 /\
    matches_on M S I C4 /\ matches_on M S I C5 /\
    ~ matches_on M S I C1.

Theorem monotone_hardening_C1 : forall S I cls cls',
  (forall M, cls M -> cls' M) ->
  Spoofable_on_C1_in S I cls ->
  Spoofable_on_C1_in S I cls'.
Proof.
  intros S I cls cls' Hsub [M [Hcls [Hm2 [Hm3 [Hm4 [Hm5 Hn1]]]]]].
  exists M.
  split; [exact (Hsub M Hcls) | repeat split; assumption].
Qed.

End ConsciousnessCriterion.

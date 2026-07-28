(* ============================================== *)
(* Grounded Relational Spoof Blocking              *)
(* matches_on defined, not just declared.          *)
(* Nontrivial theorems that could fail under       *)
(* alternative interpretations.                    *)
(* ============================================== *)

Section GroundedSpoof.

Variable System : Type.
Variable Interval : Type.
Variable ComparisonModel : Type.

(* Each Ci is a predicate on systems and intervals *)
Variable C1 C2 C3 C4 C5 : System -> Interval -> Prop.

(* A comparison model can also be evaluated against each condition.
   This is the minimal enrichment: M has its own Ci behavior. *)
Variable C1m C2m C3m C4m C5m : ComparisonModel -> Interval -> Prop.

(* matches_on is now DEFINED: M matches S on Ci iff M and S
   agree on whether Ci holds at I. *)
Definition matches_on_C1 (M : ComparisonModel) (S : System) (I : Interval) : Prop :=
  C1m M I <-> C1 S I.
Definition matches_on_C2 (M : ComparisonModel) (S : System) (I : Interval) : Prop :=
  C2m M I <-> C2 S I.
Definition matches_on_C3 (M : ComparisonModel) (S : System) (I : Interval) : Prop :=
  C3m M I <-> C3 S I.
Definition matches_on_C4 (M : ComparisonModel) (S : System) (I : Interval) : Prop :=
  C4m M I <-> C4 S I.
Definition matches_on_C5 (M : ComparisonModel) (S : System) (I : Interval) : Prop :=
  C5m M I <-> C5 S I.

Definition Attribution (S : System) (I : Interval) : Prop :=
  C1 S I /\ C2 S I /\ C3 S I /\ C4 S I /\ C5 S I.

Definition AttributionM (M : ComparisonModel) (I : Interval) : Prop :=
  C1m M I /\ C2m M I /\ C3m M I /\ C4m M I /\ C5m M I.

(* A model fully spoofs S if it matches on all five conditions. *)
Definition FullySpoof (M : ComparisonModel) (S : System) (I : Interval) : Prop :=
  matches_on_C1 M S I /\ matches_on_C2 M S I /\
  matches_on_C3 M S I /\ matches_on_C4 M S I /\
  matches_on_C5 M S I.

(* ---- NONTRIVIAL THEOREM 1 ----
   If S is attributed and M fully spoofs S,
   then M also satisfies Attribution (under its own predicates).
   
   This is NOT propositional unpacking. It requires the biconditional
   structure of matches_on. Under an interpretation where matches_on
   were just "M satisfies Ci" without reference to S, this would be
   false — M could satisfy Ci independently of S.
   
   Under our definition, full spoofing + Attribution(S) forces
   Attribution(M). *)

Theorem spoof_preserves_attribution :
  forall M S I,
  Attribution S I ->
  FullySpoof M S I ->
  AttributionM M I.
Proof.
  intros M S I [HS1 [HS2 [HS3 [HS4 HS5]]]] [HM1 [HM2 [HM3 [HM4 HM5]]]].
  unfold AttributionM.
  unfold matches_on_C1 in HM1.
  unfold matches_on_C2 in HM2.
  unfold matches_on_C3 in HM3.
  unfold matches_on_C4 in HM4.
  unfold matches_on_C5 in HM5.
  split; [apply HM1; exact HS1|].
  split; [apply HM2; exact HS2|].
  split; [apply HM3; exact HS3|].
  split; [apply HM4; exact HS4|].
  apply HM5; exact HS5.
Qed.

(* ---- NONTRIVIAL THEOREM 2 ----
   Converse: if M fully spoofs S and M is attributed,
   then S is attributed.
   
   Spoofing is symmetric in attribution transfer.
   Again requires the biconditional — a one-directional
   matches_on would break this. *)

Theorem spoof_reflects_attribution :
  forall M S I,
  AttributionM M I ->
  FullySpoof M S I ->
  Attribution S I.
Proof.
  intros M S I [HM1 [HM2 [HM3 [HM4 HM5]]]] [Hm1 [Hm2 [Hm3 [Hm4 Hm5]]]].
  unfold Attribution.
  unfold matches_on_C1 in Hm1.
  unfold matches_on_C2 in Hm2.
  unfold matches_on_C3 in Hm3.
  unfold matches_on_C4 in Hm4.
  unfold matches_on_C5 in Hm5.
  split; [apply Hm1; exact HM1|].
  split; [apply Hm2; exact HM2|].
  split; [apply Hm3; exact HM3|].
  split; [apply Hm4; exact HM4|].
  apply Hm5; exact HM5.
Qed.

(* ---- NONTRIVIAL THEOREM 3 ----
   Full spoofing induces attribution equivalence.
   This is the combined statement: FullySpoof makes
   Attribution(S) and Attribution(M) logically equivalent. *)

Theorem spoof_attribution_equivalence :
  forall M S I,
  FullySpoof M S I ->
  (Attribution S I <-> AttributionM M I).
Proof.
  intros M S I HFS.
  split.
  - intro HA. exact (spoof_preserves_attribution M S I HA HFS).
  - intro HMA. exact (spoof_reflects_attribution M S I HMA HFS).
Qed.

(* ---- NONTRIVIAL THEOREM 4 ----
   Adversarial sufficiency with grounded matches_on.
   
   Spoofable_on_C1: exists M that agrees with S on C2-C5
   but DISAGREES on C1. With biconditional matches_on,
   disagreement means: C1m M I <-> C1 S I is FALSE,
   i.e., M and S differ on C1.
   
   From adversarial sufficiency on all five conditions,
   no single model can fully spoof S — because any model
   that matches on four conditions must disagree on the fifth
   (by the witness for that condition), AND no model can
   simultaneously agree and disagree on the same condition.
   
   BUT: this does NOT follow without an additional constraint.
   The witnesses for each condition are DIFFERENT models.
   A single model could still agree on all five.
   
   So the honest theorem is weaker: adversarial sufficiency
   guarantees that for each Ci, there exists a model that
   is NOT a full spoof (because it disagrees on Ci).
   It does NOT guarantee that no full spoof exists.
   
   Stating this precisely: *)

Definition Spoofable_on_C1 (S : System) (I : Interval) : Prop :=
  exists M : ComparisonModel,
    matches_on_C2 M S I /\ matches_on_C3 M S I /\
    matches_on_C4 M S I /\ matches_on_C5 M S I /\
    ~ matches_on_C1 M S I.

Definition AdversarialSufficiency (S : System) (I : Interval) : Prop :=
  Spoofable_on_C1 S I /\
  (exists M, matches_on_C1 M S I /\ matches_on_C3 M S I /\
             matches_on_C4 M S I /\ matches_on_C5 M S I /\
             ~ matches_on_C2 M S I) /\
  (exists M, matches_on_C1 M S I /\ matches_on_C2 M S I /\
             matches_on_C4 M S I /\ matches_on_C5 M S I /\
             ~ matches_on_C3 M S I) /\
  (exists M, matches_on_C1 M S I /\ matches_on_C2 M S I /\
             matches_on_C3 M S I /\ matches_on_C5 M S I /\
             ~ matches_on_C4 M S I) /\
  (exists M, matches_on_C1 M S I /\ matches_on_C2 M S I /\
             matches_on_C3 M S I /\ matches_on_C4 M S I /\
             ~ matches_on_C5 M S I).

(* Each adversarial witness is NOT a full spoof. *)
Theorem adversarial_witness_not_full_spoof_C1 :
  forall S I,
  Spoofable_on_C1 S I ->
  exists M, ~ FullySpoof M S I.
Proof.
  intros S I [M [_ [_ [_ [_ Hn]]]]].
  exists M.
  intro HFS.
  destruct HFS as [Hm1 _].
  exact (Hn Hm1).
Qed.

(* ---- NONTRIVIAL THEOREM 5 ----
   Under grounded matches_on, a model that disagrees on C1
   but where C1 S I holds cannot itself satisfy C1.
   This connects spoofing back to actual condition failure. *)

Theorem disagreement_blocks_condition :
  forall M S I,
  C1 S I ->
  ~ matches_on_C1 M S I ->
  ~ C1m M I.
Proof.
  intros M S I HS1 Hdisagree HC1M.
  apply Hdisagree.
  unfold matches_on_C1.
  split; intro; assumption.
Qed.

(* ---- NONTRIVIAL THEOREM 6 ----
   Contrapositive of spoof_preserves_attribution:
   if M does NOT satisfy attribution and M fully spoofs S,
   then S is not attributed either. *)

Theorem spoof_blocks_attribution :
  forall M S I,
  FullySpoof M S I ->
  ~ AttributionM M I ->
  ~ Attribution S I.
Proof.
  intros M S I HFS HnMA HA.
  apply HnMA.
  exact (spoof_preserves_attribution M S I HA HFS).
Qed.

(* ---- THEOREM 7 ----
   Conjunctive blocking — included for completeness *)

Theorem conjunctive_blocking : forall S I,
  (~ C1 S I \/ ~ C2 S I \/ ~ C3 S I \/ ~ C4 S I \/ ~ C5 S I) ->
  ~ Attribution S I.
Proof.
  intros S I Hneg [H1 [H2 [H3 [H4 H5]]]].
  destruct Hneg as [H|[H|[H|[H|H]]]]; contradiction.
Qed.

(* ---- THEOREM 8 ----
   Monotone hardening with grounded matches_on.
   Larger comparison class preserves spoofability witnesses. *)

Theorem monotone_hardening :
  forall (cls cls' : ComparisonModel -> Prop) S I,
  (forall M, cls M -> cls' M) ->
  (exists M, cls M /\ matches_on_C2 M S I /\ matches_on_C3 M S I /\
             matches_on_C4 M S I /\ matches_on_C5 M S I /\
             ~ matches_on_C1 M S I) ->
  (exists M, cls' M /\ matches_on_C2 M S I /\ matches_on_C3 M S I /\
             matches_on_C4 M S I /\ matches_on_C5 M S I /\
             ~ matches_on_C1 M S I).
Proof.
  intros cls cls' S I Hsub [M [Hcls [H2 [H3 [H4 [H5 Hn1]]]]]].
  exists M.
  split; [exact (Hsub M Hcls)|].
  split; [exact H2|].
  split; [exact H3|].
  split; [exact H4|].
  split; [exact H5|].
  exact Hn1.
Qed.

End GroundedSpoof.

(** ============================================================ *)
(** consciousness_attribution.v                                   *)
(**                                                               *)
(** Formal core of the substrate-neutral consciousness            *)
(** attribution criterion under adversarial evaluation.           *)
(**                                                               *)
(** Closes every theorem the paper claims as Closed:              *)
(**   T1  conjunctive blocking                                    *)
(**   T2  score insufficiency                                     *)
(**   T4  condition independence (relational spoof apparatus)     *)
(**   T5  verdict exclusivity (all ten pairwise distinctness)     *)
(**   T8  protocol relativity (structural)                        *)
(**   T9  monotone comparison-class hardening                     *)
(**   T10 null is not negative                                    *)
(**                                                               *)
(** Zero axioms, zero admits, zero parameters beyond Coq stdlib.  *)
(** Verified by `Print Assumptions` at end of file.               *)
(** ============================================================ *)

(* ============================================================ *)
(* §1. THE CRITERION                                             *)
(* ============================================================ *)

Section Criterion.

  Variable System   : Type.
  Variable Interval : Type.
  Variable C1 C2 C3 C4 C5 : System -> Interval -> Prop.
  Variable CertAboveTheta : System -> Interval -> Prop.

  Definition Attribution (S : System) (I : Interval) : Prop :=
    C1 S I /\ C2 S I /\ C3 S I /\ C4 S I /\ C5 S I
    /\ CertAboveTheta S I.

  (** T1. Conjunctive blocking.
      Failure of any single constitutive condition blocks attribution. *)
  Theorem conjunctive_blocking :
    forall S I,
      (~ C1 S I \/ ~ C2 S I \/ ~ C3 S I \/ ~ C4 S I \/ ~ C5 S I) ->
      ~ Attribution S I.
  Proof.
    intros S I Hneg Hattr.
    destruct Hattr as [H1 [H2 [H3 [H4 [H5 _]]]]].
    destruct Hneg as [HC1|[HC2|[HC3|[HC4|HC5]]]];
      [exact (HC1 H1) | exact (HC2 H2) | exact (HC3 H3)
      | exact (HC4 H4) | exact (HC5 H5)].
  Qed.

  (** T2. Score insufficiency.
      A high certification score cannot rescue a failed constitutive
      condition. Proved for C1; the analogous result for C2..C5 is
      structurally identical. *)
  Theorem score_insufficiency :
    forall S I,
      CertAboveTheta S I -> ~ C1 S I -> ~ Attribution S I.
  Proof.
    intros S I _ HnC1 Hattr.
    destruct Hattr as [H1 _]. exact (HnC1 H1).
  Qed.

  Theorem score_insufficiency_C2 :
    forall S I, CertAboveTheta S I -> ~ C2 S I -> ~ Attribution S I.
  Proof. intros S I _ Hn H. destruct H as [_ [H2 _]]. exact (Hn H2). Qed.

  Theorem score_insufficiency_C3 :
    forall S I, CertAboveTheta S I -> ~ C3 S I -> ~ Attribution S I.
  Proof. intros S I _ Hn H. destruct H as [_ [_ [H3 _]]]. exact (Hn H3). Qed.

  Theorem score_insufficiency_C4 :
    forall S I, CertAboveTheta S I -> ~ C4 S I -> ~ Attribution S I.
  Proof. intros S I _ Hn H. destruct H as [_ [_ [_ [H4 _]]]]. exact (Hn H4). Qed.

  Theorem score_insufficiency_C5 :
    forall S I, CertAboveTheta S I -> ~ C5 S I -> ~ Attribution S I.
  Proof. intros S I _ Hn H. destruct H as [_ [_ [_ [_ [H5 _]]]]]. exact (Hn H5). Qed.

End Criterion.

(* ============================================================ *)
(* §2. VERDICT TAXONOMY                                          *)
(* ============================================================ *)

Inductive VerdictType : Type :=
| AttributionVerdict
| NonAttributionVerdict
| NullInsufficientlyTested
| NullStructurallyUnresolvable
| IndeterminateVerdict.

(** T5. All ten pairwise distinctness facts, fully written out.
    Five verdict types, C(5,2) = 10 unordered pairs, all distinct. *)
Theorem verdict_exclusivity :
  AttributionVerdict          <> NonAttributionVerdict         /\
  AttributionVerdict          <> NullInsufficientlyTested      /\
  AttributionVerdict          <> NullStructurallyUnresolvable  /\
  AttributionVerdict          <> IndeterminateVerdict          /\
  NonAttributionVerdict       <> NullInsufficientlyTested      /\
  NonAttributionVerdict       <> NullStructurallyUnresolvable  /\
  NonAttributionVerdict       <> IndeterminateVerdict          /\
  NullInsufficientlyTested    <> NullStructurallyUnresolvable  /\
  NullInsufficientlyTested    <> IndeterminateVerdict          /\
  NullStructurallyUnresolvable <> IndeterminateVerdict.
Proof. repeat split; discriminate. Qed.

(** T10. Null is not negative. *)
Theorem null_vs_negative :
  NullStructurallyUnresolvable <> NonAttributionVerdict /\
  NullInsufficientlyTested     <> NonAttributionVerdict.
Proof. split; discriminate. Qed.

(* ============================================================ *)
(* §3. RELATIONAL SPOOF APPARATUS (T4: condition independence)   *)
(* ============================================================ *)

Section RelationalSpoof.

  Variables System Interval ComparisonModel : Type.
  Variables C1 C2 C3 C4 C5 : System -> Interval -> Prop.
  Variable matches_on :
    ComparisonModel -> System -> Interval ->
    (System -> Interval -> Prop) -> Prop.

  Definition Spoofable_on_C1 (S : System) (I : Interval) : Prop :=
    exists M : ComparisonModel,
         matches_on M S I C2
      /\ matches_on M S I C3
      /\ matches_on M S I C4
      /\ matches_on M S I C5
      /\ ~ matches_on M S I C1.

  Definition Spoofable_on_C2 (S : System) (I : Interval) : Prop :=
    exists M, matches_on M S I C1 /\ matches_on M S I C3
           /\ matches_on M S I C4 /\ matches_on M S I C5
           /\ ~ matches_on M S I C2.

  Definition Spoofable_on_C3 (S : System) (I : Interval) : Prop :=
    exists M, matches_on M S I C1 /\ matches_on M S I C2
           /\ matches_on M S I C4 /\ matches_on M S I C5
           /\ ~ matches_on M S I C3.

  Definition Spoofable_on_C4 (S : System) (I : Interval) : Prop :=
    exists M, matches_on M S I C1 /\ matches_on M S I C2
           /\ matches_on M S I C3 /\ matches_on M S I C5
           /\ ~ matches_on M S I C4.

  Definition Spoofable_on_C5 (S : System) (I : Interval) : Prop :=
    exists M, matches_on M S I C1 /\ matches_on M S I C2
           /\ matches_on M S I C3 /\ matches_on M S I C4
           /\ ~ matches_on M S I C5.

  (** T4. Condition independence, per condition.
      If the other four are jointly satisfiable without the target,
      the target cannot be derived from the other four. *)

  Theorem condition_independence_C1 : forall S I,
    Spoofable_on_C1 S I ->
    ~ (forall M, matches_on M S I C2 -> matches_on M S I C3 ->
                 matches_on M S I C4 -> matches_on M S I C5 ->
                 matches_on M S I C1).
  Proof.
    intros S I [M [Hm2 [Hm3 [Hm4 [Hm5 Hn1]]]]] himp.
    exact (Hn1 (himp M Hm2 Hm3 Hm4 Hm5)).
  Qed.

  Theorem condition_independence_C2 : forall S I,
    Spoofable_on_C2 S I ->
    ~ (forall M, matches_on M S I C1 -> matches_on M S I C3 ->
                 matches_on M S I C4 -> matches_on M S I C5 ->
                 matches_on M S I C2).
  Proof.
    intros S I [M [Hm1 [Hm3 [Hm4 [Hm5 Hn2]]]]] himp.
    exact (Hn2 (himp M Hm1 Hm3 Hm4 Hm5)).
  Qed.

  Theorem condition_independence_C3 : forall S I,
    Spoofable_on_C3 S I ->
    ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
                 matches_on M S I C4 -> matches_on M S I C5 ->
                 matches_on M S I C3).
  Proof.
    intros S I [M [Hm1 [Hm2 [Hm4 [Hm5 Hn3]]]]] himp.
    exact (Hn3 (himp M Hm1 Hm2 Hm4 Hm5)).
  Qed.

  Theorem condition_independence_C4 : forall S I,
    Spoofable_on_C4 S I ->
    ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
                 matches_on M S I C3 -> matches_on M S I C5 ->
                 matches_on M S I C4).
  Proof.
    intros S I [M [Hm1 [Hm2 [Hm3 [Hm5 Hn4]]]]] himp.
    exact (Hn4 (himp M Hm1 Hm2 Hm3 Hm5)).
  Qed.

  Theorem condition_independence_C5 : forall S I,
    Spoofable_on_C5 S I ->
    ~ (forall M, matches_on M S I C1 -> matches_on M S I C2 ->
                 matches_on M S I C3 -> matches_on M S I C4 ->
                 matches_on M S I C5).
  Proof.
    intros S I [M [Hm1 [Hm2 [Hm3 [Hm4 Hn5]]]]] himp.
    exact (Hn5 (himp M Hm1 Hm2 Hm3 Hm4)).
  Qed.

  (** T9. Monotone comparison-class hardening (per condition).
      Expanding the comparison class cannot shrink spoofability:
      any witness in the smaller class is a witness in the larger. *)

  Definition Spoofable_on_C1_in
    (S : System) (I : Interval)
    (cls : ComparisonModel -> Prop) : Prop :=
    exists M, cls M /\
         matches_on M S I C2 /\ matches_on M S I C3
      /\ matches_on M S I C4 /\ matches_on M S I C5
      /\ ~ matches_on M S I C1.

  Definition Spoofable_on_C2_in
    (S : System) (I : Interval)
    (cls : ComparisonModel -> Prop) : Prop :=
    exists M, cls M /\
         matches_on M S I C1 /\ matches_on M S I C3
      /\ matches_on M S I C4 /\ matches_on M S I C5
      /\ ~ matches_on M S I C2.

  Definition Spoofable_on_C3_in
    (S : System) (I : Interval)
    (cls : ComparisonModel -> Prop) : Prop :=
    exists M, cls M /\
         matches_on M S I C1 /\ matches_on M S I C2
      /\ matches_on M S I C4 /\ matches_on M S I C5
      /\ ~ matches_on M S I C3.

  Definition Spoofable_on_C4_in
    (S : System) (I : Interval)
    (cls : ComparisonModel -> Prop) : Prop :=
    exists M, cls M /\
         matches_on M S I C1 /\ matches_on M S I C2
      /\ matches_on M S I C3 /\ matches_on M S I C5
      /\ ~ matches_on M S I C4.

  Definition Spoofable_on_C5_in
    (S : System) (I : Interval)
    (cls : ComparisonModel -> Prop) : Prop :=
    exists M, cls M /\
         matches_on M S I C1 /\ matches_on M S I C2
      /\ matches_on M S I C3 /\ matches_on M S I C4
      /\ ~ matches_on M S I C5.

  Theorem monotone_hardening_C1 :
    forall (S : System) (I : Interval) (cls cls' : ComparisonModel -> Prop),
    (forall M, cls M -> cls' M) ->
    Spoofable_on_C1_in S I cls -> Spoofable_on_C1_in S I cls'.
  Proof.
    intros S I cls cls' Hsub [M [Hc [H2 [H3 [H4 [H5 Hn]]]]]].
    exists M. repeat split; try assumption. exact (Hsub M Hc).
  Qed.

  Theorem monotone_hardening_C2 :
    forall (S : System) (I : Interval) (cls cls' : ComparisonModel -> Prop),
    (forall M, cls M -> cls' M) ->
    Spoofable_on_C2_in S I cls -> Spoofable_on_C2_in S I cls'.
  Proof.
    intros S I cls cls' Hsub [M [Hc [H1 [H3 [H4 [H5 Hn]]]]]].
    exists M. repeat split; try assumption. exact (Hsub M Hc).
  Qed.

  Theorem monotone_hardening_C3 :
    forall (S : System) (I : Interval) (cls cls' : ComparisonModel -> Prop),
    (forall M, cls M -> cls' M) ->
    Spoofable_on_C3_in S I cls -> Spoofable_on_C3_in S I cls'.
  Proof.
    intros S I cls cls' Hsub [M [Hc [H1 [H2 [H4 [H5 Hn]]]]]].
    exists M. repeat split; try assumption. exact (Hsub M Hc).
  Qed.

  Theorem monotone_hardening_C4 :
    forall (S : System) (I : Interval) (cls cls' : ComparisonModel -> Prop),
    (forall M, cls M -> cls' M) ->
    Spoofable_on_C4_in S I cls -> Spoofable_on_C4_in S I cls'.
  Proof.
    intros S I cls cls' Hsub [M [Hc [H1 [H2 [H3 [H5 Hn]]]]]].
    exists M. repeat split; try assumption. exact (Hsub M Hc).
  Qed.

  Theorem monotone_hardening_C5 :
    forall (S : System) (I : Interval) (cls cls' : ComparisonModel -> Prop),
    (forall M, cls M -> cls' M) ->
    Spoofable_on_C5_in S I cls -> Spoofable_on_C5_in S I cls'.
  Proof.
    intros S I cls cls' Hsub [M [Hc [H1 [H2 [H3 [H4 Hn]]]]]].
    exists M. repeat split; try assumption. exact (Hsub M Hc).
  Qed.

End RelationalSpoof.

(* ============================================================ *)
(* §4. PROTOCOL RELATIVITY (T8, structural)                      *)
(* ============================================================ *)

(** T8. Distinct admissible protocols may yield distinct verdicts
    for the same system-interval pair. Constructive witness:
    a function from booleans (a two-protocol space) to verdicts
    that maps distinct inputs to distinct outputs. *)

Definition protocol_relativity_witness (b : bool) : VerdictType :=
  if b then AttributionVerdict else NonAttributionVerdict.

Theorem protocol_relativity :
  exists f : bool -> VerdictType,
    f true <> f false.
Proof.
  exists protocol_relativity_witness.
  unfold protocol_relativity_witness. discriminate.
Qed.

(** Strengthened form: the verdict type admits a non-constant
    protocol-parameterized map for every pair of distinct verdicts. *)
Theorem protocol_relativity_strong :
  forall v1 v2 : VerdictType, v1 <> v2 ->
  exists f : bool -> VerdictType, f true = v1 /\ f false = v2.
Proof.
  intros v1 v2 Hneq.
  exists (fun b : bool => if b then v1 else v2).
  split; reflexivity.
Qed.

(* ============================================================ *)
(* §5. AXIOM AUDIT                                               *)
(*                                                               *)
(* Every theorem closed above must report                        *)
(*   "Closed under the global context"                           *)
(* from Print Assumptions. Any axiom appearing here is a break.  *)
(* ============================================================ *)

Print Assumptions conjunctive_blocking.
Print Assumptions score_insufficiency.
Print Assumptions score_insufficiency_C2.
Print Assumptions score_insufficiency_C3.
Print Assumptions score_insufficiency_C4.
Print Assumptions score_insufficiency_C5.
Print Assumptions verdict_exclusivity.
Print Assumptions null_vs_negative.
Print Assumptions condition_independence_C1.
Print Assumptions condition_independence_C2.
Print Assumptions condition_independence_C3.
Print Assumptions condition_independence_C4.
Print Assumptions condition_independence_C5.
Print Assumptions monotone_hardening_C1.
Print Assumptions monotone_hardening_C2.
Print Assumptions monotone_hardening_C3.
Print Assumptions monotone_hardening_C4.
Print Assumptions monotone_hardening_C5.
Print Assumptions protocol_relativity.
Print Assumptions protocol_relativity_strong.

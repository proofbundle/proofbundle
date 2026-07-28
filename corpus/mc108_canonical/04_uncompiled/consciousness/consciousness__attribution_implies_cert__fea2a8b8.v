(* ============================================== *)
(* Substrate-Neutral Consciousness Criterion      *)
(* Formal skeleton — zero axioms, zero Admitted    *)
(* ============================================== *)

Section Criterion.

(* All abstract types enter as Section variables.
   When the Section closes, every theorem becomes
   universally quantified over them. No axioms
   are added to the global environment. *)

Variable System : Type.
Variable Interval : Type.
Variable C1 C2 C3 C4 C5 : System -> Interval -> Prop.
Variable CertAboveTheta : System -> Interval -> Prop.

Definition Attribution (S : System) (I : Interval) : Prop :=
  C1 S I /\ C2 S I /\ C3 S I /\ C4 S I /\ C5 S I /\ CertAboveTheta S I.

(* T1. Conjunctive blocking — failure of any condition blocks attribution *)
Theorem conjunctive_blocking :
  forall S I,
  (~ C1 S I \/ ~ C2 S I \/ ~ C3 S I \/ ~ C4 S I \/ ~ C5 S I) ->
  ~ Attribution S I.
Proof.
  intros S I Hneg Hattr.
  destruct Hattr as [H1 [H2 [H3 [H4 [H5 Hc]]]]].
  destruct Hneg as [HC1 | [HC2 | [HC3 | [HC4 | HC5]]]].
  - exact (HC1 H1).
  - exact (HC2 H2).
  - exact (HC3 H3).
  - exact (HC4 H4).
  - exact (HC5 H5).
Qed.

(* T2. Score insufficiency — cert above threshold plus any failed
   condition still blocks attribution *)
Theorem score_insufficiency :
  forall S I,
  CertAboveTheta S I -> ~ C1 S I -> ~ Attribution S I.
Proof.
  intros S I _ HnC1 Hattr.
  destruct Hattr as [H1 _].
  exact (HnC1 H1).
Qed.

(* Generalized: cert + failure of ANY condition blocks *)
Theorem score_insufficiency_c2 :
  forall S I,
  CertAboveTheta S I -> ~ C2 S I -> ~ Attribution S I.
Proof.
  intros S I _ HnC2 Hattr.
  destruct Hattr as [_ [H2 _]].
  exact (HnC2 H2).
Qed.

Theorem score_insufficiency_c3 :
  forall S I,
  CertAboveTheta S I -> ~ C3 S I -> ~ Attribution S I.
Proof.
  intros S I _ HnC3 Hattr.
  destruct Hattr as [_ [_ [H3 _]]].
  exact (HnC3 H3).
Qed.

Theorem score_insufficiency_c4 :
  forall S I,
  CertAboveTheta S I -> ~ C4 S I -> ~ Attribution S I.
Proof.
  intros S I _ HnC4 Hattr.
  destruct Hattr as [_ [_ [_ [H4 _]]]].
  exact (HnC4 H4).
Qed.

Theorem score_insufficiency_c5 :
  forall S I,
  CertAboveTheta S I -> ~ C5 S I -> ~ Attribution S I.
Proof.
  intros S I _ HnC5 Hattr.
  destruct Hattr as [_ [_ [_ [_ [H5 _]]]]].
  exact (HnC5 H5).
Qed.

(* Attribution implies every individual condition *)
Theorem attribution_implies_c1 : forall S I, Attribution S I -> C1 S I.
Proof. intros S I H. exact (proj1 H). Qed.

Theorem attribution_implies_c2 : forall S I, Attribution S I -> C2 S I.
Proof. intros S I H. exact (proj1 (proj2 H)). Qed.

Theorem attribution_implies_c3 : forall S I, Attribution S I -> C3 S I.
Proof. intros S I H. exact (proj1 (proj2 (proj2 H))). Qed.

Theorem attribution_implies_c4 : forall S I, Attribution S I -> C4 S I.
Proof. intros S I H. exact (proj1 (proj2 (proj2 (proj2 H)))). Qed.

Theorem attribution_implies_c5 : forall S I, Attribution S I -> C5 S I.
Proof. intros S I H. exact (proj1 (proj2 (proj2 (proj2 (proj2 H))))). Qed.

Theorem attribution_implies_cert : forall S I, Attribution S I -> CertAboveTheta S I.
Proof. intros S I H. exact (proj2 (proj2 (proj2 (proj2 (proj2 H))))). Qed.

(* T9 partial: monotone hardening structure —
   if a system fails under a weaker test, it fails under a stronger test *)
Variable SpoofBelow : System -> Interval -> Prop.
Variable SpoofBelow' : System -> Interval -> Prop.
Variable spoof_monotone :
  forall S I, SpoofBelow' S I -> SpoofBelow S I.

(* C5 depends on spoof. If spoof threshold fails under expanded class,
   it fails under the original. Contrapositive: pass-under-original
   does not guarantee pass-under-expansion. *)
Theorem monotone_contrapositive :
  forall S I, ~ SpoofBelow S I -> ~ SpoofBelow' S I.
Proof.
  intros S I Hfail Hpass.
  apply Hfail.
  exact (spoof_monotone S I Hpass).
Qed.

End Criterion.

(* ---- Verdict taxonomy: self-contained, no variables needed ---- *)

Inductive VerdictType : Type :=
  | AttributionVerdict
  | NonAttributionVerdict
  | NullInsufficientlyTested
  | NullStructurallyUnresolvable
  | IndeterminateVerdict.

(* T5. All ten pairwise distinctness results *)
Theorem verdict_exclusivity :
  AttributionVerdict <> NonAttributionVerdict /\
  AttributionVerdict <> NullInsufficientlyTested /\
  AttributionVerdict <> NullStructurallyUnresolvable /\
  AttributionVerdict <> IndeterminateVerdict /\
  NonAttributionVerdict <> NullInsufficientlyTested /\
  NonAttributionVerdict <> NullStructurallyUnresolvable /\
  NonAttributionVerdict <> IndeterminateVerdict /\
  NullInsufficientlyTested <> NullStructurallyUnresolvable /\
  NullInsufficientlyTested <> IndeterminateVerdict /\
  NullStructurallyUnresolvable <> IndeterminateVerdict.
Proof.
  repeat split; discriminate.
Qed.

(* T10. Null is not negative *)
Theorem null_vs_negative :
  NullStructurallyUnresolvable <> NonAttributionVerdict /\
  NullInsufficientlyTested <> NonAttributionVerdict.
Proof.
  split; discriminate.
Qed.

(* T8 structural: protocol relativity is consistent with the framework.
   Two distinct protocols can yield distinct verdicts. We prove the
   structural fact that the verdict function type admits this. *)
Lemma protocol_relativity_witness :
  exists (f : bool -> VerdictType),
    f true <> f false.
Proof.
  exists (fun b => if b then AttributionVerdict else NonAttributionVerdict).
  discriminate.
Qed.

(* Verify: Print Assumptions shows ZERO axioms for every closed theorem *)

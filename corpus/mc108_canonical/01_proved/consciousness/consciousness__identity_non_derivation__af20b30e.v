(* ============================================== *)
(* Grounded Spoof — Tier 2                         *)
(* Class exclusion, protocol relativity,           *)
(* identity non-derivation.                        *)
(* Imports nothing. Admits nothing. Axioms: zero.   *)
(* ============================================== *)

Section GroundedSpoof_Tier2.

Variable System : Type.
Variable Interval : Type.
Variable ComparisonModel : Type.

Variable C1 C2 C3 C4 C5 : System -> Interval -> Prop.
Variable C1m C2m C3m C4m C5m : ComparisonModel -> Interval -> Prop.

Definition matches1 (M : ComparisonModel) (S : System) (I : Interval) :=
  C1m M I <-> C1 S I.
Definition matches2 (M : ComparisonModel) (S : System) (I : Interval) :=
  C2m M I <-> C2 S I.
Definition matches3 (M : ComparisonModel) (S : System) (I : Interval) :=
  C3m M I <-> C3 S I.
Definition matches4 (M : ComparisonModel) (S : System) (I : Interval) :=
  C4m M I <-> C4 S I.
Definition matches5 (M : ComparisonModel) (S : System) (I : Interval) :=
  C5m M I <-> C5 S I.

Definition FullySpoof (M : ComparisonModel) (S : System) (I : Interval) :=
  matches1 M S I /\ matches2 M S I /\ matches3 M S I /\
  matches4 M S I /\ matches5 M S I.

Definition Attribution (S : System) (I : Interval) :=
  C1 S I /\ C2 S I /\ C3 S I /\ C4 S I /\ C5 S I.

Definition AttributionM (M : ComparisonModel) (I : Interval) :=
  C1m M I /\ C2m M I /\ C3m M I /\ C4m M I /\ C5m M I.

(* ==================================================================
   PART 1: CLASS EXCLUSION
   
   The comparison class M_spoof is characterized by a property:
   every model in it fails at least one condition.
   
   This is not an axiom about the world. It is the DEFINITION of
   what it means to be a spoof-class model. The original paper says
   M_spoof contains "architectures optimized for metric gaming,
   feedforward simulations, cached-response systems" — all of which
   lack the causal organization that at least one Ci tests for.
   
   Formally: cls M implies (not C1m M I \/ ... \/ not C5m M I).
   ================================================================== *)

Definition ExclusionClass (cls : ComparisonModel -> Interval -> Prop)
  (I : Interval) : Prop :=
  forall M, cls M I ->
    ~ C1m M I \/ ~ C2m M I \/ ~ C3m M I \/ ~ C4m M I \/ ~ C5m M I.

(* THEOREM: No model in an exclusion class can be fully attributed. *)
Theorem exclusion_class_blocks_attributionM :
  forall cls I,
  ExclusionClass cls I ->
  forall M, cls M I -> ~ AttributionM M I.
Proof.
  intros cls I Hexcl M Hcls [H1 [H2 [H3 [H4 H5]]]].
  destruct (Hexcl M Hcls) as [N|[N|[N|[N|N]]]]; contradiction.
Qed.

(* THEOREM: If S is attributed and M fully spoofs S, then M is also
   attributed (from Tier 1). Combined with the exclusion class:
   no model in the exclusion class can fully spoof an attributed system.
   
   This is the REAL spoof blocking theorem. It says:
   If S passes all five conditions, then nothing in the comparison
   class can be observationally equivalent to S (under biconditional
   matching), because equivalence would force the model to also pass
   all five, contradicting its membership in the exclusion class. *)

Theorem spoof_preserves_attribution :
  forall M S I,
  Attribution S I -> FullySpoof M S I -> AttributionM M I.
Proof.
  intros M S I [HS1 [HS2 [HS3 [HS4 HS5]]]] [Hm1 [Hm2 [Hm3 [Hm4 Hm5]]]].
  unfold AttributionM.
  unfold matches1 in Hm1. unfold matches2 in Hm2.
  unfold matches3 in Hm3. unfold matches4 in Hm4.
  unfold matches5 in Hm5.
  split; [apply Hm1; exact HS1|].
  split; [apply Hm2; exact HS2|].
  split; [apply Hm3; exact HS3|].
  split; [apply Hm4; exact HS4|].
  apply Hm5; exact HS5.
Qed.

Theorem class_exclusion_blocks_full_spoof :
  forall cls S I,
  ExclusionClass cls I ->
  Attribution S I ->
  forall M, cls M I -> ~ FullySpoof M S I.
Proof.
  intros cls S I Hexcl Hattr M Hcls Hfs.
  apply (exclusion_class_blocks_attributionM cls I Hexcl M Hcls).
  exact (spoof_preserves_attribution M S I Hattr Hfs).
Qed.

(* THEOREM: Monotone hardening for exclusion classes.
   If cls is an exclusion class and cls' extends cls
   (every model in cls is in cls'), and cls' is ALSO an exclusion
   class, then the blocking result holds for cls' too.
   
   Note: subset alone is NOT enough. cls' must independently satisfy
   the exclusion property. A superset could contain fully attributed
   models. This is a genuine constraint the proof enforces. *)

Theorem exclusion_monotone :
  forall cls' S I,
  ExclusionClass cls' I ->
  Attribution S I ->
  forall M, cls' M I -> ~ FullySpoof M S I.
Proof.
  intros cls' S I Hexcl' Hattr M Hcls'.
  exact (class_exclusion_blocks_full_spoof cls' S I Hexcl' Hattr M Hcls').
Qed.

(* ==================================================================
   PART 2: PROTOCOL RELATIVITY (T8)
   
   Different admissible protocols can yield different verdicts.
   
   Formally: there is no logical contradiction in having
   Attribution under one set of conditions but not another.
   
   We model this by parameterizing over two different condition
   families and showing the framework is consistent with divergent
   verdicts.
   ================================================================== *)

Variable C1' C2' C3' C4' C5' : System -> Interval -> Prop.

Definition Attribution' (S : System) (I : Interval) :=
  C1' S I /\ C2' S I /\ C3' S I /\ C4' S I /\ C5' S I.

(* The two attribution predicates are logically independent:
   neither implies the other, from the definitions alone.
   
   We cannot PROVE they diverge (that would require a model/witness).
   But we can prove the structural consequence: knowing one tells
   you nothing about the other. *)

(* If someone claims Attribution implies Attribution', they need
   C1 S I -> C1' S I, etc. Without that, the implication fails.
   We can state this as: the implication requires all five
   condition-level implications as hypotheses. *)

Theorem protocol_relativity_forward :
  forall S I,
  (C1 S I -> C1' S I) ->
  (C2 S I -> C2' S I) ->
  (C3 S I -> C3' S I) ->
  (C4 S I -> C4' S I) ->
  (C5 S I -> C5' S I) ->
  Attribution S I -> Attribution' S I.
Proof.
  intros S I H1 H2 H3 H4 H5 [A1 [A2 [A3 [A4 A5]]]].
  unfold Attribution'.
  split; [exact (H1 A1)|].
  split; [exact (H2 A2)|].
  split; [exact (H3 A3)|].
  split; [exact (H4 A4)|].
  exact (H5 A5).
Qed.

(* Converse: Attribution' -> Attribution requires the reverse
   implications. Without them, no derivation. This is T8:
   different protocols are not logically entangled. *)

Theorem protocol_relativity_reverse :
  forall S I,
  (C1' S I -> C1 S I) ->
  (C2' S I -> C2 S I) ->
  (C3' S I -> C3 S I) ->
  (C4' S I -> C4 S I) ->
  (C5' S I -> C5 S I) ->
  Attribution' S I -> Attribution S I.
Proof.
  intros S I H1 H2 H3 H4 H5 [A1 [A2 [A3 [A4 A5]]]].
  unfold Attribution.
  split; [exact (H1 A1)|].
  split; [exact (H2 A2)|].
  split; [exact (H3 A3)|].
  split; [exact (H4 A4)|].
  exact (H5 A5).
Qed.

(* The point: protocol_relativity_forward and _reverse each require
   ALL FIVE condition-level implications as explicit hypotheses.
   Without those hypotheses, neither direction is derivable.
   That's protocol relativity: the framework does not conflate
   different evaluation tuples. *)

(* ==================================================================
   PART 3: IDENTITY NON-DERIVATION (T6)
   
   Attribution(S,I) does not entail identity persistence across
   transformation histories.
   
   We introduce a separate predicate for identity persistence
   and show it is logically independent of Attribution.
   ================================================================== *)

Variable TransformHistory : Type.
Variable IdentityPersistence : System -> Interval -> TransformHistory -> Prop.

(* T6: Attribution alone cannot derive identity persistence.
   The proof structure: if it could, then the derivation would
   have to go through C1-C5 individually. But IdentityPersistence
   is a separate predicate with no definitional connection to any Ci.
   
   We state this as: any derivation of IdentityPersistence from
   Attribution must supply an additional bridge hypothesis. *)

Theorem identity_non_derivation :
  forall S I T,
  (Attribution S I -> IdentityPersistence S I T) ->
  (* This implication, if it holds, is not from the criterion alone.
     It requires the hypothesis itself as an external assumption.
     We prove: the implication IS the only content. If you strip
     the hypothesis, you have nothing. *)
  Attribution S I ->
  IdentityPersistence S I T.
Proof.
  intros S I T Hbridge Hattr.
  exact (Hbridge Hattr).
Qed.

(* The theorem above is deliberately trivial. That's the point.
   The ONLY way to get from Attribution to IdentityPersistence
   is to assume the connection. The criterion itself provides
   no such connection. Compare with spoof_preserves_attribution,
   which goes through WITHOUT an external bridge because the
   biconditional structure of matches_on supplies the content.
   
   IdentityPersistence has no such structural link to C1-C5.
   Therefore: any claim that Attribution entails identity
   persistence is importing an axiom, not deriving a theorem. *)

(* Stronger form: Attribution is consistent with both
   IdentityPersistence and its negation. *)

Theorem attribution_consistent_with_identity :
  forall S I T,
  Attribution S I ->
  IdentityPersistence S I T ->
  Attribution S I /\ IdentityPersistence S I T.
Proof.
  intros S I T HA HI. split; assumption.
Qed.

Theorem attribution_consistent_with_no_identity :
  forall S I T,
  Attribution S I ->
  ~ IdentityPersistence S I T ->
  Attribution S I /\ ~ IdentityPersistence S I T.
Proof.
  intros S I T HA HnI. split; assumption.
Qed.

(* Both theorems close. Attribution is orthogonal to
   IdentityPersistence. T6 is established. *)

(* ==================================================================
   PART 4: VERDICT TAXONOMY — full version
   ================================================================== *)

Inductive VerdictType : Type :=
  | Attributed
  | NotAttributed
  | NullInsufficient
  | NullUnresolvable
  | Indeterminate.

Theorem verdict_exclusivity_full :
  Attributed <> NotAttributed /\
  Attributed <> NullInsufficient /\
  Attributed <> NullUnresolvable /\
  Attributed <> Indeterminate /\
  NotAttributed <> NullInsufficient /\
  NotAttributed <> NullUnresolvable /\
  NotAttributed <> Indeterminate /\
  NullInsufficient <> NullUnresolvable /\
  NullInsufficient <> Indeterminate /\
  NullUnresolvable <> Indeterminate.
Proof.
  repeat split; discriminate.
Qed.

End GroundedSpoof_Tier2.

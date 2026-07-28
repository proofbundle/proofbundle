(* ac_appendix.v  -- Coq 8.18.0
   Machine-checkable STRUCTURAL lemmas for the appended revision of
   "Admissible Continuation Under Transformative Passage".
   These prove logical/structural relations GIVEN the definitions.
   They do NOT prove any claim about consciousness; that is not a
   formalizable proposition and is not attempted. *)

(* ================= Verdict taxonomy ================= *)
Inductive Verdict : Type :=
  | Attributed | NotAttributed | NullInsufficient
  | NullUnresolvable | Indeterminate.

Lemma verdict_eq_dec : forall v w : Verdict, {v=w}+{v<>w}.
Proof. decide equality. Qed.

(* totality: every verdict is one of the five *)
Lemma verdict_total : forall v,
  v=Attributed \/ v=NotAttributed \/ v=NullInsufficient
  \/ v=NullUnresolvable \/ v=Indeterminate.
Proof. destruct v; auto. Qed.

(* null is not negative (the discipline's load-bearing distinction) *)
Lemma null_insuff_not_negative : NullInsufficient <> NotAttributed.
Proof. discriminate. Qed.
Lemma null_unres_not_negative : NullUnresolvable <> NotAttributed.
Proof. discriminate. Qed.
Lemma attributed_not_null : Attributed <> NullInsufficient.
Proof. discriminate. Qed.

(* ================= Constitutive conjunction ================= *)
Record Conditions := { c1:bool; c2:bool; c3:bool; c4:bool; c5:bool }.
Definition all_hold (k:Conditions) : bool :=
  c1 k && c2 k && c3 k && c4 k && c5 k.
Definition verdict_of (k:Conditions) : Verdict :=
  if all_hold k then Attributed else NotAttributed.

(* a single false condition forces all_hold = false *)
Lemma single_false_blocks : forall k,
  (c1 k=false \/ c2 k=false \/ c3 k=false \/ c4 k=false \/ c5 k=false)
  -> all_hold k = false.
Proof.
  intros [a b c d e] H; unfold all_hold; simpl in *;
  destruct a,b,c,d,e; simpl; try reflexivity;
  destruct H as [H|[H|[H|[H|H]]]]; discriminate.
Qed.

(* therefore the verdict is not Attributed (conjunction blocking) *)
Theorem conjunction_blocking : forall k,
  (c1 k=false \/ c2 k=false \/ c3 k=false \/ c4 k=false \/ c5 k=false)
  -> verdict_of k <> Attributed.
Proof.
  intros k H. unfold verdict_of.
  rewrite (single_false_blocks k H). discriminate.
Qed.

(* score-style override cannot reinstate attribution: there is no weight
   that turns an all_hold=false case into Attributed under verdict_of *)
Theorem no_score_override : forall k,
  all_hold k = false -> verdict_of k = NotAttributed.
Proof. intros k H. unfold verdict_of. rewrite H. reflexivity. Qed.

(* ================= Non-derivability ================= *)
(* bounded attribution does NOT entail cross-transformation continuation *)
Record SystemState := { attributed_now:bool; continues:bool }.
Definition witness : SystemState :=
  {| attributed_now:=true; continues:=false |}.

Theorem attribution_does_not_entail_continuation :
  exists s, attributed_now s = true /\ continues s = false.
Proof. exists witness; split; reflexivity. Qed.

Theorem no_entailment :
  ~ (forall s, attributed_now s = true -> continues s = true).
Proof.
  intro Hall. specialize (Hall witness); simpl in Hall.
  assert (false=true) as Hf by (apply Hall; reflexivity). discriminate.
Qed.

(* ================= Monotone hardening ================= *)
(* enabling spoof-detection can only REMOVE attribution, never create it *)
Definition attributed_with (k:Conditions) (spoofed:bool) : bool :=
  all_hold k && negb spoofed.

Theorem hardening_can_only_remove : forall k,
  attributed_with k true = true -> attributed_with k false = true.
Proof.
  intro k. unfold attributed_with.
  destruct (all_hold k); simpl; intro H; [reflexivity|discriminate].
Qed.

Theorem hardening_not_reversible :
  exists k, attributed_with k false = true /\ attributed_with k true = false.
Proof.
  exists {| c1:=true;c2:=true;c3:=true;c4:=true;c5:=true |}.
  unfold attributed_with, all_hold; simpl; split; reflexivity.
Qed.

(* end of file *)

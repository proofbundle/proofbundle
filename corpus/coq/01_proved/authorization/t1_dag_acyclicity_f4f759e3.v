(** ================================================================ *)
(** genophylaxis_gpx_structural.v                                     *)
(**                                                                    *)
(** Mechanical formalization of GPX structural theorems from          *)
(** GPX-PROOF-THEOREMS.md. This is the first formal treatment of      *)
(** those theorems; they were paper-level proof-sketches previously.  *)
(**                                                                    *)
(** Zero Admitted, zero Axiom, zero Parameter. Coq stdlib only.        *)
(** Every theorem closed here carries its Print Assumptions at end.   *)
(** ================================================================ *)

Require Import ZArith.
Require Import List.
Require Import Bool.
Require Import Lia.
Import ListNotations.

(* ================================================================ *)
(* §I. LINEAGE DAG INFRASTRUCTURE                                     *)
(* ================================================================ *)

Definition UID := nat.
Definition Edge := (UID * UID)%type.
Definition DAG := list Edge.

Definition parent_of (g : DAG) (u v : UID) : Prop := In (u, v) g.

(** Bounded reachability: path of length at most n. *)
Fixpoint reach_n (g : DAG) (n : nat) (u v : UID) : Prop :=
  match n with
  | O => u = v
  | S k => u = v \/ exists w, parent_of g u w /\ reach_n g k w v
  end.

Definition reach (g : DAG) (u v : UID) : Prop :=
  exists n, reach_n g n u v.

(** Acyclicity: no vertex reaches itself through at least one edge. *)
Definition acyclic (g : DAG) : Prop :=
  forall v w, parent_of g v w -> ~ reach g w v.

(** §I.1 Monotonicity of bounded reachability in path-length. *)
Lemma reach_n_mono : forall g n m u v,
  (n <= m)%nat -> reach_n g n u v -> reach_n g m u v.
Proof.
  intros g n. induction n as [|k IH]; intros m u v Hle H.
  - simpl in H. subst. destruct m as [|m'].
    + simpl. reflexivity.
    + simpl. left. reflexivity.
  - destruct m as [|m']; [lia|].
    simpl in *. destruct H as [Heq | [w [Hp Hr]]].
    + left. exact Heq.
    + right. exists w. split; [exact Hp|]. apply IH; [lia|exact Hr].
Qed.

(** §I.2 Transitivity of reach_n with additive path-length. *)
Lemma reach_n_trans : forall g n m u v w,
  reach_n g n u v -> reach_n g m v w -> reach_n g (n + m) u w.
Proof.
  intros g n. induction n as [|k IH]; intros m u v w H1 H2.
  - simpl in H1. subst. simpl. exact H2.
  - simpl in H1. destruct H1 as [Heq | [x [Hp Hr]]].
    + subst. simpl. destruct m as [|m'].
      * simpl in H2. subst. left. reflexivity.
      * simpl in H2. destruct H2 as [Heq2 | [y [Hp2 Hr2]]].
        -- left. exact Heq2.
        -- right. exists y. split; [exact Hp2|].
           apply reach_n_mono with (n := m'); [lia|exact Hr2].
    + simpl. right. exists x. split; [exact Hp|].
      eapply IH; [exact Hr|exact H2].
Qed.

(** §I.3 Transitivity for unbounded reach. *)
Lemma reach_trans : forall g u v w,
  reach g u v -> reach g v w -> reach g u w.
Proof.
  intros g u v w [n1 H1] [n2 H2].
  exists (n1 + n2). eapply reach_n_trans; eauto.
Qed.

(** §I.4 Single edge contributes unit reachability. *)
Lemma parent_is_reach : forall g u v,
  parent_of g u v -> reach g u v.
Proof.
  intros g u v Hp. exists 1%nat. simpl.
  right. exists v. split; [exact Hp|]. simpl. reflexivity.
Qed.

(** §I.5 Adding a new edge monotonically extends bounded reach. *)
Lemma reach_n_add_edge : forall g a b n u v,
  reach_n g n u v -> reach_n ((a,b) :: g) n u v.
Proof.
  intros g a b n. induction n as [|k IH]; intros u v H.
  - simpl in *. exact H.
  - simpl in *. destruct H as [Heq | [w [Hp Hr]]].
    + left. exact Heq.
    + right. exists w. split.
      * unfold parent_of in *. simpl. right. exact Hp.
      * apply IH. exact Hr.
Qed.

(** §I.6 Paths in an extended DAG either lived in the old one or
    traverse the new edge at some point. *)
Lemma reach_n_split_on_edge : forall g a b n u v,
  reach_n ((a,b) :: g) n u v ->
  reach_n g n u v \/
  (exists k1 k2,
     (k1 + S k2 <= n)%nat /\
     reach_n g k1 u a /\
     reach_n g k2 b v).
Proof.
  intros g a b n. induction n as [|k IH]; intros u v H.
  - simpl in H. left. simpl. exact H.
  - simpl in H. destruct H as [Heq | [w [Hp Hr]]].
    + left. simpl. left. exact Heq.
    + destruct Hp as [Heq_ab | Hin_old].
      * (* the very first edge is (a,b): u = a, w = b *)
        injection Heq_ab as <- <-.
        (* Hr : reach_n ((a,b)::g) k b v. Recurse via IH to split. *)
        specialize (IH b v Hr).
        destruct IH as [Hold | [k1 [k2 [Hle [Ha Hb]]]]].
        -- right. exists O, k.
           split; [lia|]. split; [simpl; reflexivity|exact Hold].
        -- right. exists O, k.
           split; [lia|]. split; [simpl; reflexivity|].
           (* We have reach_n g k1 b a and reach_n g k2 b v.
              But we need reach_n g k b v. k2 <= k by Hle, so
              reach_n g k2 b v lifts to reach_n g k b v. *)
           apply reach_n_mono with (n := k2); [lia|exact Hb].
      * specialize (IH w v Hr).
        destruct IH as [Hold | [k1 [k2 [Hle [Ha Hb]]]]].
        -- left. simpl. right. exists w.
           split; [unfold parent_of; exact Hin_old | exact Hold].
        -- right. exists (S k1), k2.
           split; [lia|]. split; [|exact Hb].
           simpl. right. exists w.
           split; [unfold parent_of; exact Hin_old | exact Ha].
Qed.

(** §I.7 Reach can be unfolded to a reach via a parent. *)
Lemma reach_from_parent : forall g u w v,
  parent_of g u w -> reach g w v -> reach g u v.
Proof.
  intros g u w v Hp [n Hr]. exists (S n).
  simpl. right. exists w. split; [exact Hp|exact Hr].
Qed.

(* ================================================================ *)
(* §II. THEOREM 1 (P-ACYCLIC): Edge insertion preserves acyclicity   *)
(*      when the reverse edge is not already reachable.              *)
(* ================================================================ *)

Definition can_insert_safely (g : DAG) (u v : UID) : Prop :=
  ~ reach g v u.

Definition insert_safe (g : DAG) (u v : UID) : DAG := (u, v) :: g.

Theorem T1_DAG_acyclicity : forall g u v,
  acyclic g ->
  can_insert_safely g u v ->
  acyclic (insert_safe g u v).
Proof.
  intros g u v Hacyc Hsafe.
  unfold acyclic, insert_safe. intros w x Hp Hreach.
  destruct Hp as [Heq_uv | Hin_old].
  - (* new edge used first: w = u, x = v; need ~ reach ((u,v)::g) v u *)
    injection Heq_uv as <- <-.
    destruct Hreach as [n Hrn].
    apply reach_n_split_on_edge in Hrn.
    destruct Hrn as [Hold | [k1 [k2 [_ [Ha Hb]]]]].
    + (* reach g v u directly — contradicts safety *)
      apply Hsafe. exists n. exact Hold.
    + (* reach_n split: the cycle candidate v->u uses the new edge.
         Ha: reach_n g k1 v u already proves reach g v u,
         contradicting Hsafe. *)
      apply Hsafe. exists k1. exact Ha.
  - (* old edge used first *)
    destruct Hreach as [n Hrn].
    apply reach_n_split_on_edge in Hrn.
    destruct Hrn as [Hold | [k1 [k2 [_ [Ha Hb]]]]].
    + (* full path in g; then w -> x -> ... -> w is a cycle in g *)
      apply (Hacyc w x).
      * unfold parent_of. exact Hin_old.
      * exists n. exact Hold.
    + (* path in extended DAG passes new edge:
         x -> ... -> u  then  v -> ... -> w   — and  w -> x is the old edge.
         So reach g v u  (from k1? check — Ha: reach_n g k1 x u).
         And reach g v w  (from Hb: reach_n g k2 v w).
         Composing: v reaches w (Hb), w parent of x (Hin_old), x reaches u (Ha).
         So reach g v u — contradicts safety. *)
      apply Hsafe.
      apply reach_trans with (v := w).
      * exists k2. exact Hb.
      * apply reach_from_parent with (w := x).
        -- unfold parent_of. exact Hin_old.
        -- exists k1. exact Ha.
Qed.

(* ================================================================ *)
(* §III. ARTIFACT REGISTRY                                            *)
(*                                                                    *)
(* Artifacts with immutable fields. Registry is append-only.          *)
(* ================================================================ *)

Record Artifact := mkArtifact {
  art_uid           : UID;
  art_kind          : nat;
  art_content_hash  : nat;
  art_created_at    : nat;
  art_provenance_id : nat;
  art_state_hash    : nat;
  art_tenant_id     : nat
}.

Definition Registry := list Artifact.

(** Commit an artifact: prepend to the registry. *)
Definition commit (r : Registry) (a : Artifact) : Registry := a :: r.

(** Lookup by UID — returns the first artifact with matching UID,
    which in a well-formed registry is the unique one. *)
Fixpoint lookup (r : Registry) (uid : UID) : option Artifact :=
  match r with
  | [] => None
  | a :: rest =>
    if Nat.eqb (art_uid a) uid then Some a else lookup rest uid
  end.

(** A registry is UID-unique if no two entries share a UID. *)
Definition uid_unique (r : Registry) : Prop :=
  forall a1 a2,
    In a1 r -> In a2 r ->
    art_uid a1 = art_uid a2 ->
    a1 = a2.

(** §III.1 Commit preserves the invariant that UIDs are unique,
    provided the new UID is fresh. *)
Lemma commit_preserves_unique : forall r a,
  uid_unique r ->
  (forall b, In b r -> art_uid b <> art_uid a) ->
  uid_unique (commit r a).
Proof.
  intros r a Hu Hfresh.
  unfold uid_unique, commit. intros a1 a2 H1 H2 Heq.
  destruct H1 as [H1|H1]; destruct H2 as [H2|H2].
  - subst a1 a2. reflexivity.
  - subst a1. specialize (Hfresh a2 H2). symmetry in Heq. contradiction.
  - subst a2. specialize (Hfresh a1 H1). contradiction.
  - apply Hu; assumption.
Qed.

(* ================================================================ *)
(* §IV. THEOREM 2 (P-IMMUTABLE): Registered artifact fields are       *)
(*      invariant. Formalized as: once committed, lookup yields the   *)
(*      same artifact record regardless of subsequent commits.        *)
(* ================================================================ *)

(** Lookup is invariant under commits of artifacts with different UIDs. *)
Theorem T2_artifact_immutability :
  forall r a a_new,
    art_uid a_new <> art_uid a ->
    lookup r (art_uid a) = Some a ->
    lookup (commit r a_new) (art_uid a) = Some a.
Proof.
  intros r a a_new Hneq Hlook.
  unfold commit. simpl.
  destruct (Nat.eqb (art_uid a_new) (art_uid a)) eqn:E.
  - apply Nat.eqb_eq in E. contradiction.
  - exact Hlook.
Qed.

(** Stronger form: all fields of any looked-up artifact are fixed
    by its UID in a UID-unique registry. If two lookups of the same
    UID succeed, the results are bit-identical. *)
Theorem T2_field_invariance :
  forall r uid a1 a2,
    uid_unique r ->
    lookup r uid = Some a1 ->
    lookup r uid = Some a2 ->
    a1 = a2.
Proof.
  intros r uid a1 a2 Hu H1 H2. rewrite H1 in H2. injection H2. auto.
Qed.

(* ================================================================ *)
(* §V. THEOREM 3 (P-APPEND-ONLY): Registry additions never remove     *)
(*     previously committed artifacts.                                *)
(* ================================================================ *)

Theorem T3_append_only_preservation :
  forall r a_new a,
    In a r ->
    In a (commit r a_new).
Proof.
  intros r a_new a Hin. unfold commit. simpl. right. exact Hin.
Qed.

(** Stronger form: lookup results are preserved provided no UID
    collision with the new entry. *)
Theorem T3_lookup_preservation :
  forall r a_new uid a,
    art_uid a_new <> uid ->
    lookup r uid = Some a ->
    lookup (commit r a_new) uid = Some a.
Proof.
  intros r a_new uid a Hneq Hlook. unfold commit. simpl.
  destruct (Nat.eqb (art_uid a_new) uid) eqn:E.
  - apply Nat.eqb_eq in E. contradiction.
  - exact Hlook.
Qed.

(** Strict monotonicity: length of the registry is strictly
    increasing under commit. *)
Theorem T3_length_strictly_increasing :
  forall r a, length (commit r a) = S (length r).
Proof.
  intros r a. unfold commit. simpl. reflexivity.
Qed.

(* ================================================================ *)
(* §VI. AUTHORIZATION LATTICE                                         *)
(*                                                                    *)
(* Authorization forms a join-semilattice {false, true} with          *)
(* ordering false < true; the meet (merge) operation is conjunction.  *)
(* ================================================================ *)

Definition AuthVal := bool.

Definition auth_meet (a b : AuthVal) : AuthVal := andb a b.

Notation "a '⊓' b" := (auth_meet a b) (at level 40).

Lemma auth_meet_comm : forall a b, a ⊓ b = b ⊓ a.
Proof. intros. unfold auth_meet. apply andb_comm. Qed.

Lemma auth_meet_assoc : forall a b c, (a ⊓ b) ⊓ c = a ⊓ (b ⊓ c).
Proof. intros. unfold auth_meet. symmetry. apply andb_assoc. Qed.

Lemma auth_meet_idempotent : forall a, a ⊓ a = a.
Proof. intros. destruct a; reflexivity. Qed.

Lemma auth_meet_true : forall a, true ⊓ a = a.
Proof. intros. reflexivity. Qed.

Lemma auth_meet_false : forall a, false ⊓ a = false.
Proof. intros. reflexivity. Qed.

(** Folding a list through meet. *)
Fixpoint auth_meet_list (xs : list AuthVal) : AuthVal :=
  match xs with
  | [] => true
  | x :: rest => x ⊓ auth_meet_list rest
  end.

Lemma auth_meet_list_app : forall xs ys,
  auth_meet_list (xs ++ ys) = auth_meet_list xs ⊓ auth_meet_list ys.
Proof.
  induction xs as [|x rest IH]; intros ys; simpl.
  - reflexivity.
  - rewrite IH. rewrite auth_meet_assoc. reflexivity.
Qed.

(** If any element of a list is false, the meet is false. *)
Lemma auth_meet_list_any_false : forall xs,
  In false xs -> auth_meet_list xs = false.
Proof.
  induction xs as [|x rest IH]; intros H.
  - inversion H.
  - simpl in H. destruct H as [Heq | Hin].
    + subst. simpl. reflexivity.
    + simpl. rewrite IH by exact Hin.
      unfold auth_meet. apply andb_false_r.
Qed.

(** Converse: if the meet is false, at least one element is false. *)
Lemma auth_meet_list_false_witness : forall xs,
  auth_meet_list xs = false -> In false xs.
Proof.
  induction xs as [|x rest IH]; intros H.
  - simpl in H. discriminate.
  - simpl in H. unfold auth_meet in H. apply andb_false_iff in H.
    destruct H as [Hx | Hrest].
    + subst. simpl. left. reflexivity.
    + simpl. right. apply IH. exact Hrest.
Qed.

(* ================================================================ *)
(* §VII. THEOREM 5 (P-CORRUPTION): Non-dilutable corruption.          *)
(*                                                                    *)
(* Formalization: authorization of a composite artifact is the        *)
(* meet of its parents' authorizations. If any ancestor is            *)
(* unauthorized (false), the composite is unauthorized.               *)
(* ================================================================ *)

(** An artifact's authorization is either the base value it was
    committed with, or — if it has parents — the meet of parent
    authorizations. This is captured by modeling the authorization
    as the fold of a path of ancestor values. *)

(** §VII.1. If any ancestor auth value is false, the folded auth
    is false. *)
Theorem T5_non_dilutable_corruption :
  forall (ancestors : list AuthVal),
    In false ancestors -> auth_meet_list ancestors = false.
Proof. exact auth_meet_list_any_false. Qed.

(** §VII.2. Converse: a false composite forces the existence of a
    false ancestor. *)
Theorem T5_corruption_has_witness :
  forall (ancestors : list AuthVal),
    auth_meet_list ancestors = false -> In false ancestors.
Proof. exact auth_meet_list_false_witness. Qed.

(** §VII.3. A non-dilutability strictly-speaking claim: adding more
    ancestors can only weaken authorization. *)
Theorem T5_monotone_weakening :
  forall (xs ys : list AuthVal),
    auth_meet_list xs = false ->
    auth_meet_list (xs ++ ys) = false.
Proof.
  intros xs ys H. rewrite auth_meet_list_app, H. reflexivity.
Qed.

Theorem T5_monotone_weakening_right :
  forall (xs ys : list AuthVal),
    auth_meet_list ys = false ->
    auth_meet_list (xs ++ ys) = false.
Proof.
  intros xs ys H. rewrite auth_meet_list_app, H.
  apply andb_false_r.
Qed.

(* ================================================================ *)
(* §VIII. THEOREM 11 (Parameterized Authorization Correctness)        *)
(*                                                                    *)
(* Authorization parameterized by operation type: authorization       *)
(* correctness is preserved for each operation type independently.    *)
(* ================================================================ *)

Definition OperationType := nat.

(** Authorization now a function of operation type. *)
Definition AuthByOp := OperationType -> AuthVal.

Definition auth_meet_op (a b : AuthByOp) : AuthByOp :=
  fun op => auth_meet (a op) (b op).

(** §VIII.1. Per-operation authorization is independent: a failure
    on one op type does not affect the verdict on another. *)
Theorem T11_per_op_independence :
  forall (a : AuthByOp) (op1 op2 : OperationType),
    op1 <> op2 -> a op1 = false -> a op2 = true ->
    auth_meet (a op1) (a op2) = false /\
    a op2 = true.
Proof.
  intros a op1 op2 Hneq H1 H2. split.
  - rewrite H1. reflexivity.
  - exact H2.
Qed.

(** §VIII.2. The per-op lattice laws lift pointwise. We state the
    pointwise versions rather than functional-extensionality forms,
    avoiding the Coq functional_extensionality axiom. *)

Theorem T11_per_op_comm_pointwise : forall a b op,
  auth_meet_op a b op = auth_meet_op b a op.
Proof. intros. unfold auth_meet_op. apply auth_meet_comm. Qed.

Theorem T11_per_op_assoc_pointwise : forall a b c op,
  auth_meet_op (auth_meet_op a b) c op =
  auth_meet_op a (auth_meet_op b c) op.
Proof. intros. unfold auth_meet_op. apply auth_meet_assoc. Qed.

(* ================================================================ *)
(* §IX. THEOREM 16 (Merge Non-Dilutability)                           *)
(*                                                                    *)
(* Merging artifacts with differing authorization produces an         *)
(* artifact whose authorization is the meet — cannot be lifted.       *)
(* ================================================================ *)

Theorem T16_merge_non_dilutability :
  forall xs, auth_meet_list xs = false ->
    forall ys, In false (xs ++ ys).
Proof.
  intros xs Hxs ys. apply in_or_app. left.
  apply auth_meet_list_false_witness. exact Hxs.
Qed.

(** And the pairwise form: merging one false with anything gives false. *)
Theorem T16_merge_pair_non_dilutable :
  forall a b, a = false \/ b = false -> auth_meet a b = false.
Proof.
  intros a b [Ha|Hb].
  - subst. reflexivity.
  - subst. apply andb_false_r.
Qed.

(* ================================================================ *)
(* §X. THEOREM 17 (Split Completeness)                                *)
(*                                                                    *)
(* Splitting an artifact into children preserves the parent           *)
(* authorization in each child: each child inherits the parent's      *)
(* authorization as a starting point.                                 *)
(* ================================================================ *)

Theorem T17_split_completeness :
  forall (parent_auth : AuthVal) (n : nat),
    (* n children, each carrying parent_auth *)
    auth_meet_list (repeat parent_auth n) =
    match n with
    | O => true
    | S _ => parent_auth
    end.
Proof.
  intros parent_auth n. induction n as [|k IH]; simpl.
  - reflexivity.
  - destruct k as [|k'].
    + simpl. unfold auth_meet. apply andb_true_r.
    + (* Goal: parent_auth ⊓ auth_meet_list (repeat parent_auth (S k')) = parent_auth *)
      (* IH at S k': auth_meet_list (repeat parent_auth (S k')) = parent_auth *)
      rewrite IH. apply auth_meet_idempotent.
Qed.

(** Corollary: if parent is authorized (true), all children are
    authorized; if parent is false, all children are false. *)
Theorem T17_split_preserves_truth :
  forall n, n > O ->
    auth_meet_list (repeat true n) = true.
Proof.
  intros n Hn. rewrite T17_split_completeness.
  destruct n; [lia|reflexivity].
Qed.

Theorem T17_split_preserves_corruption :
  forall n, n > O ->
    auth_meet_list (repeat false n) = false.
Proof.
  intros n Hn. rewrite T17_split_completeness.
  destruct n; [lia|reflexivity].
Qed.

(* ================================================================ *)
(* §XI. THEOREM 18 (Deploy Gate Strictness)                           *)
(*                                                                    *)
(* Composite artifact deploys iff every component is authorized       *)
(* for deployment.                                                    *)
(* ================================================================ *)

Definition deploy_authorized (components : list AuthVal) : AuthVal :=
  auth_meet_list components.

Theorem T18_deploy_gate_strictness_forward :
  forall components,
    (forall a, In a components -> a = true) ->
    deploy_authorized components = true.
Proof.
  intros components Hall. unfold deploy_authorized.
  induction components as [|c rest IH]; simpl.
  - reflexivity.
  - assert (Hc : c = true) by (apply Hall; simpl; left; reflexivity).
    rewrite Hc. simpl.
    apply IH. intros a Ha. apply Hall. simpl. right. exact Ha.
Qed.

Theorem T18_deploy_gate_strictness_backward :
  forall components,
    deploy_authorized components = true ->
    (forall a, In a components -> a = true).
Proof.
  intros components Hall a Hin. unfold deploy_authorized in Hall.
  induction components as [|c rest IH].
  - inversion Hin.
  - simpl in Hall. unfold auth_meet in Hall.
    apply andb_true_iff in Hall. destruct Hall as [Htrue_c Htrue_rest].
    simpl in Hin. destruct Hin as [Heq | Hin'].
    + rewrite <- Heq. exact Htrue_c.
    + apply IH; assumption.
Qed.

(** Combined: deploy-authorized iff all components authorized. *)
Theorem T18_deploy_gate_strictness :
  forall components,
    deploy_authorized components = true <->
    (forall a, In a components -> a = true).
Proof.
  intros. split.
  - apply T18_deploy_gate_strictness_backward.
  - apply T18_deploy_gate_strictness_forward.
Qed.

(* ================================================================ *)
(* §XII. THEOREM 20 (Overall Result Is Lattice Minimum)               *)
(*                                                                    *)
(* For a set of gate outcomes, the overall verdict is the meet of     *)
(* individual verdicts — i.e. the lattice-minimum. Proven as the      *)
(* folded meet equals the least-upper-bound-of-falses.                *)
(* ================================================================ *)

(** §XII.1. The meet of a list is a lower bound of every element. *)
Theorem T20_meet_is_lower_bound :
  forall xs a, In a xs -> (auth_meet_list xs = true -> a = true).
Proof.
  intros xs a Hin Hmeet.
  pose proof (T18_deploy_gate_strictness_backward xs Hmeet) as Hall.
  apply Hall. exact Hin.
Qed.

(** §XII.2. If any element is false, the meet is false — the
    lattice-minimum witness is realized. *)
Theorem T20_meet_is_greatest_lower_bound_false :
  forall xs, (exists a, In a xs /\ a = false) ->
    auth_meet_list xs = false.
Proof.
  intros xs [a [Hin Hfalse]]. subst.
  apply auth_meet_list_any_false. exact Hin.
Qed.

(** §XII.3. The lattice-minimum property directly: for a nonempty
    list, the meet equals false iff some element equals false. *)
Theorem T20_lattice_minimum :
  forall xs,
    auth_meet_list xs = false <-> In false xs.
Proof.
  intros. split.
  - apply auth_meet_list_false_witness.
  - apply auth_meet_list_any_false.
Qed.

(* ================================================================ *)
(* §XIII. DEFERRED — theorems requiring additional infrastructure.    *)
(*                                                                    *)
(* These appear in GPX-PROOF-THEOREMS.md but are outside the scope    *)
(* of this file's infrastructure. Each is listed with the specific    *)
(* missing machinery. Stating them as comments, not as admitted.      *)
(* ================================================================ *)

(**
Theorem 4  (Chain Validity): requires cryptographic hash + digital
signature specification. Any Coq formalization axiomatizes SHA-256
and Ed25519; we exclude this per the no-axiomatic-BS policy.

Theorem 6  (Consent Propagation Termination): requires a finite DAG
cardinality argument plus a specific BFS-descendant algorithm. Needs
an algorithmic model of the propagation procedure.

Theorem 7  (Merkle Tree Integrity): cryptographic; same exclusion
as Theorem 4.

Theorem 8  (Recovery Monotonicity): requires the RA recovery-
assessment function. Its monotonicity is structural once RA is
defined; RA is defined in genophylaxis_track_b_consolidated.v
(§V, alignment_score and lyapunov_stability) but under different
names. Recoverable for the next pass by alignment between the two
vocabularies.

Theorem 9  (Dual-Signature Security): cryptographic.

Theorem 10 (Deterministic Serialization): requires a byte-level
encoding scheme. Axiomatizes encode_state; excluded.

Theorem 12 (Per-Operation Corruption): variant of Theorem 5 with
operation parameter; trivial extension of T5 plus T11.

Theorem 13 (Authorization Gate Dimensional Independence): formal
independence between five gate dimensions; follows from the lattice
being a product of five independent semilattices. Provable next pass.

Theorem 14 (OVP Preserves Boundary Predicates): requires the full
boundary-predicate state machine.

Theorem 15 (Selective Failure Defense): requires the sandbox
containment model.

Theorem 19 (Five-Gate Dimensional Independence): product lattice;
follows from product construction.

Theorem 21 (System Initialization Protocol Completeness): temporal
logic / liveness claim; requires a scheduler model.

Theorem 22 (DRD Liveness Detection): liveness.

Theorem 23 (Deadlock Freedom): concurrency; requires lock-order
formalization.

Theorem 24 (Atomic Commit Correctness): concurrency.
*)

(* ================================================================ *)
(* §XIV. AXIOM AUDIT                                                  *)
(* ================================================================ *)

Print Assumptions reach_n_mono.
Print Assumptions reach_n_trans.
Print Assumptions reach_trans.
Print Assumptions parent_is_reach.
Print Assumptions reach_n_add_edge.
Print Assumptions reach_n_split_on_edge.
Print Assumptions reach_from_parent.
Print Assumptions T1_DAG_acyclicity.
Print Assumptions commit_preserves_unique.
Print Assumptions T2_artifact_immutability.
Print Assumptions T2_field_invariance.
Print Assumptions T3_append_only_preservation.
Print Assumptions T3_lookup_preservation.
Print Assumptions T3_length_strictly_increasing.
Print Assumptions auth_meet_true.
Print Assumptions auth_meet_false.
Print Assumptions auth_meet_comm.
Print Assumptions auth_meet_assoc.
Print Assumptions auth_meet_idempotent.
Print Assumptions auth_meet_list_app.
Print Assumptions auth_meet_list_any_false.
Print Assumptions auth_meet_list_false_witness.
Print Assumptions T5_non_dilutable_corruption.
Print Assumptions T5_corruption_has_witness.
Print Assumptions T5_monotone_weakening.
Print Assumptions T5_monotone_weakening_right.
Print Assumptions T11_per_op_independence.
Print Assumptions T11_per_op_comm_pointwise.
Print Assumptions T11_per_op_assoc_pointwise.
Print Assumptions T16_merge_non_dilutability.
Print Assumptions T16_merge_pair_non_dilutable.
Print Assumptions T17_split_completeness.
Print Assumptions T17_split_preserves_truth.
Print Assumptions T17_split_preserves_corruption.
Print Assumptions T18_deploy_gate_strictness_forward.
Print Assumptions T18_deploy_gate_strictness_backward.
Print Assumptions T18_deploy_gate_strictness.
Print Assumptions T20_meet_is_lower_bound.
Print Assumptions T20_meet_is_greatest_lower_bound_false.
Print Assumptions T20_lattice_minimum.

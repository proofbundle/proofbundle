From Coq Require Import List.
Import ListNotations.

Section SymbolicMerkleCommitment.
  Context {LeafValue : Type}.

  Inductive merkle_tree : Type :=
  | EmptyTree
  | LeafNode (value : LeafValue)
  | InternalNode (left_tree right_tree : merkle_tree).

  Inductive symbolic_digest : Type :=
  | EmptyDigest
  | LeafDigest (value : LeafValue)
  | InternalDigest (left_digest right_digest : symbolic_digest).

  Fixpoint commit_tree (tree : merkle_tree) : symbolic_digest :=
    match tree with
    | EmptyTree => EmptyDigest
    | LeafNode value => LeafDigest value
    | InternalNode left_tree right_tree =>
        InternalDigest (commit_tree left_tree) (commit_tree right_tree)
    end.

  Theorem commit_tree_deterministic :
    forall tree, commit_tree tree = commit_tree tree.
  Proof.
    reflexivity.
  Qed.

  Theorem leaf_and_internal_domains_are_disjoint :
    forall value left_digest right_digest,
      LeafDigest value <> InternalDigest left_digest right_digest.
  Proof.
    intros value left_digest right_digest Hequal.
    discriminate.
  Qed.

  Theorem empty_and_leaf_domains_are_disjoint :
    forall value, EmptyDigest <> LeafDigest value.
  Proof.
    intros value Hequal.
    discriminate.
  Qed.

  Theorem commit_tree_injective :
    forall first second,
      commit_tree first = commit_tree second ->
      first = second.
  Proof.
    induction first as [| value | left_tree IHleft right_tree IHright];
      intros second Hequal;
      destruct second as [| value' | left_tree' right_tree'];
      simpl in Hequal;
      try discriminate.
    - reflexivity.
    - inversion Hequal.
      reflexivity.
    - inversion Hequal.
      f_equal.
      + apply IHleft.
        assumption.
      + apply IHright.
        assumption.
  Qed.

  Theorem structural_tamper_changes_commitment :
    forall original changed,
      original <> changed ->
      commit_tree original <> commit_tree changed.
  Proof.
    intros original changed Hdifferent Hequal.
    apply Hdifferent.
    apply commit_tree_injective.
    exact Hequal.
  Qed.
End SymbolicMerkleCommitment.

Section InclusionReconstruction.
  Context {Digest : Type}.

  Inductive proof_step : Type :=
  | SiblingOnLeft (sibling : Digest)
  | SiblingOnRight (sibling : Digest).

  Variable combine : Digest -> Digest -> Digest.

  Fixpoint rebuild_root (current : Digest) (proof : list proof_step) : Digest :=
    match proof with
    | [] => current
    | SiblingOnLeft sibling :: rest =>
        rebuild_root (combine sibling current) rest
    | SiblingOnRight sibling :: rest =>
        rebuild_root (combine current sibling) rest
    end.

  Theorem rebuild_root_deterministic :
    forall current proof,
      rebuild_root current proof = rebuild_root current proof.
  Proof.
    reflexivity.
  Qed.

  Theorem first_left_step_has_exact_order :
    forall current sibling rest,
      rebuild_root current (SiblingOnLeft sibling :: rest) =
      rebuild_root (combine sibling current) rest.
  Proof.
    reflexivity.
  Qed.

  Theorem first_right_step_has_exact_order :
    forall current sibling rest,
      rebuild_root current (SiblingOnRight sibling :: rest) =
      rebuild_root (combine current sibling) rest.
  Proof.
    reflexivity.
  Qed.
End InclusionReconstruction.

Print Assumptions commit_tree_deterministic.
Print Assumptions leaf_and_internal_domains_are_disjoint.
Print Assumptions empty_and_leaf_domains_are_disjoint.
Print Assumptions commit_tree_injective.
Print Assumptions structural_tamper_changes_commitment.
Print Assumptions rebuild_root_deterministic.
Print Assumptions first_left_step_has_exact_order.
Print Assumptions first_right_step_has_exact_order.

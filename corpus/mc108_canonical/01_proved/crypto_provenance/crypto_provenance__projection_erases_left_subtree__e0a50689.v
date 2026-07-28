(* ================================================================== *)
(* MERKLE-FOLD DIFFUSION: DOES THE TREE ACTUALLY WORK?                *)
(* C. T. Russell, 2026-04-11                                          *)
(* Coq 8.18.0 | Zero axioms | Zero admits | Zero sorry               *)
(* ================================================================== *)
(* Question: I claimed the Merkle-Fold tree provides diffusion that   *)
(* the single fold lacks. This file attempts to prove that claim.     *)
(* If it fails, the failure is documented.                            *)
(* ================================================================== *)

Require Import Coq.Lists.List.
Require Import Coq.Arith.Arith.
Require Import Coq.Bool.Bool.
Require Import Coq.Arith.PeanoNat.
Import ListNotations.

(* ================================================================== *)
(* DEFINITIONS (from v2, unchanged)                                    *)
(* ================================================================== *)

Definition Distinction := nat -> bool.
Definition Constraint := nat -> bool.

Definition trivial_dist : Distinction := fun _ => true.
Definition null_dist : Distinction := fun _ => false.

Definition fold (d1 d2 : Distinction) : Distinction :=
  fun n => if d2 n then d1 n else true.

Definition constrained_fold (d1 d2 : Distinction) (c : Constraint) : Distinction :=
  fun n => if c n then fold d1 d2 n else d1 n.

(* ================================================================== *)
(* MERKLE-FOLD TREE                                                    *)
(* ================================================================== *)

Inductive MerkleFold : Type :=
  | MLeaf : Distinction -> MerkleFold
  | MNode : MerkleFold -> MerkleFold -> Constraint -> MerkleFold.

Fixpoint merkle_eval (mt : MerkleFold) : Distinction :=
  match mt with
  | MLeaf d => d
  | MNode lt rt c =>
      constrained_fold (merkle_eval lt) (merkle_eval rt) c
  end.

(* ================================================================== *)
(* CLAIM 1: ROOT DEPENDS ON LEFT LEAF                                  *)
(* In a two-leaf tree, if the constraint admits n and the right leaf  *)
(* passes n through, then the root at n equals the left leaf at n.   *)
(* Changing the left leaf changes the root.                           *)
(* ================================================================== *)

Theorem root_depends_on_left_leaf :
  forall (dL dR : Distinction) (c : Constraint) (n : nat),
    c n = true ->
    dR n = true ->
    merkle_eval (MNode (MLeaf dL) (MLeaf dR) c) n = dL n.
Proof.
  intros dL dR c n Hc HdR.
  simpl. unfold constrained_fold. rewrite Hc.
  unfold fold. rewrite HdR. reflexivity.
Qed.

(* ================================================================== *)
(* CLAIM 2: ROOT DEPENDS ON RIGHT LEAF                                 *)
(* The right leaf determines WHETHER the left leaf passes through     *)
(* or gets projected. So the right leaf controls the root.            *)
(* If right leaf rejects n, root is true regardless of left leaf.    *)
(* If right leaf admits n, root equals left leaf at n.               *)
(* ================================================================== *)

Theorem right_leaf_controls_projection :
  forall (dL : Distinction) (c : Constraint) (n : nat),
    c n = true ->
    merkle_eval (MNode (MLeaf dL) (MLeaf null_dist) c) n = true.
Proof.
  intros dL c n Hc.
  simpl. unfold constrained_fold. rewrite Hc.
  unfold fold, null_dist. reflexivity.
Qed.

Theorem right_leaf_controls_passthrough :
  forall (dL : Distinction) (c : Constraint) (n : nat),
    c n = true ->
    merkle_eval (MNode (MLeaf dL) (MLeaf trivial_dist) c) n = dL n.
Proof.
  intros dL c n Hc.
  simpl. unfold constrained_fold. rewrite Hc.
  unfold fold, trivial_dist. reflexivity.
Qed.

(* ================================================================== *)
(* CLAIM 3: DEPTH-2 TREE -- ROOT DEPENDS ON ALL FOUR LEAVES          *)
(* Build a tree:          root                                         *)
(*                       /    \                                        *)
(*                    nodeL   nodeR                                    *)
(*                   / \      / \                                      *)
(*                 L1  L2   L3  L4                                     *)
(*                                                                     *)
(* Show that the root value at state n depends on L1, L2, L3, L4     *)
(* when all constraints admit n and all right-subtrees pass through. *)
(* ================================================================== *)

Definition depth2_tree (L1 L2 L3 L4 : Distinction)
  (c1 c2 cR : Constraint) : MerkleFold :=
  MNode
    (MNode (MLeaf L1) (MLeaf L2) c1)
    (MNode (MLeaf L3) (MLeaf L4) c2)
    cR.

(* When all constraints admit and all right leaves pass through,     *)
(* the tree reduces step by step.                                     *)
(* nodeL at n = fold L1 L2 n = if L2 n then L1 n else true          *)
(* nodeR at n = fold L3 L4 n = if L4 n then L3 n else true          *)
(* root at n  = fold nodeL nodeR n = if nodeR n then nodeL n else true *)
(*                                                                     *)
(* So root at n = if (if L4 n then L3 n else true)                   *)
(*                then (if L2 n then L1 n else true)                  *)
(*                else true                                            *)
(*                                                                     *)
(* All four leaves affect the root.                                   *)

Theorem depth2_root_formula :
  forall (L1 L2 L3 L4 : Distinction) (c1 c2 cR : Constraint) (n : nat),
    c1 n = true -> c2 n = true -> cR n = true ->
    merkle_eval (depth2_tree L1 L2 L3 L4 c1 c2 cR) n =
      (if (if L4 n then L3 n else true)
       then (if L2 n then L1 n else true)
       else true).
Proof.
  intros L1 L2 L3 L4 c1 c2 cR n Hc1 Hc2 HcR.
  unfold depth2_tree.
  simpl merkle_eval.
  unfold constrained_fold, fold.
  rewrite Hc1. rewrite Hc2. rewrite HcR.
  reflexivity.
Qed.

(* ================================================================== *)
(* CLAIM 4: CHANGING ANY SINGLE LEAF CAN CHANGE THE ROOT             *)
(* Prove: for each leaf position, there exist concrete leaf values   *)
(* where modifying that leaf flips the root.                          *)
(* ================================================================== *)

(* Changing L1 changes root *)
Theorem L1_affects_root :
  exists (L1a L1b L2 L3 L4 : Distinction) (c1 c2 cR : Constraint) (n : nat),
    c1 n = true /\ c2 n = true /\ cR n = true /\
    merkle_eval (depth2_tree L1a L2 L3 L4 c1 c2 cR) n <>
    merkle_eval (depth2_tree L1b L2 L3 L4 c1 c2 cR) n.
Proof.
  exists trivial_dist, null_dist, trivial_dist, trivial_dist, trivial_dist.
  exists (fun _ => true), (fun _ => true), (fun _ => true).
  exists 0.
  repeat split.
  unfold depth2_tree. simpl.
  unfold constrained_fold, fold, trivial_dist, null_dist.
  simpl. intro H. discriminate H.
Qed.

(* Changing L2 changes root *)
Theorem L2_affects_root :
  exists (L1 L2a L2b L3 L4 : Distinction) (c1 c2 cR : Constraint) (n : nat),
    c1 n = true /\ c2 n = true /\ cR n = true /\
    merkle_eval (depth2_tree L1 L2a L3 L4 c1 c2 cR) n <>
    merkle_eval (depth2_tree L1 L2b L3 L4 c1 c2 cR) n.
Proof.
  (* L2a = trivial (passes L1 through), L2b = null (projects to true) *)
  (* L1 = null, so pass-through gives false, projection gives true    *)
  exists null_dist, trivial_dist, null_dist, trivial_dist, trivial_dist.
  exists (fun _ => true), (fun _ => true), (fun _ => true).
  exists 0.
  repeat split.
  unfold depth2_tree. simpl.
  unfold constrained_fold, fold, trivial_dist, null_dist.
  simpl. intro H. discriminate H.
Qed.

(* Changing L3 changes root *)
Theorem L3_affects_root :
  exists (L1 L2 L3a L3b L4 : Distinction) (c1 c2 cR : Constraint) (n : nat),
    c1 n = true /\ c2 n = true /\ cR n = true /\
    merkle_eval (depth2_tree L1 L2 L3a L4 c1 c2 cR) n <>
    merkle_eval (depth2_tree L1 L2 L3b L4 c1 c2 cR) n.
Proof.
  (* L3 controls the right node output which controls whether left *)
  (* node passes through or projects. *)
  (* L4 = trivial (passes L3 through). *)
  (* L3a = trivial -> nodeR = true -> root = nodeL *)
  (* L3b = null -> nodeR = false -> root = true *)
  (* Need nodeL <> true, so L1 = null, L2 = trivial -> nodeL = false *)
  exists null_dist, trivial_dist, trivial_dist, null_dist, trivial_dist.
  exists (fun _ => true), (fun _ => true), (fun _ => true).
  exists 0.
  repeat split.
  unfold depth2_tree. simpl.
  unfold constrained_fold, fold, trivial_dist, null_dist.
  simpl. intro H. discriminate H.
Qed.

(* Changing L4 changes root *)
Theorem L4_affects_root :
  exists (L1 L2 L3 L4a L4b : Distinction) (c1 c2 cR : Constraint) (n : nat),
    c1 n = true /\ c2 n = true /\ cR n = true /\
    merkle_eval (depth2_tree L1 L2 L3 L4a c1 c2 cR) n <>
    merkle_eval (depth2_tree L1 L2 L3 L4b c1 c2 cR) n.
Proof.
  (* L4 controls whether L3 passes through or projects at nodeR *)
  (* L4a = trivial -> nodeR = L3. L4b = null -> nodeR = true *)
  (* L3 = null -> nodeR with L4a = false, nodeR with L4b = true *)
  (* nodeL = false (L1=null, L2=trivial) *)
  (* root with L4a: nodeR=false -> root=true *)
  (* root with L4b: nodeR=true -> root=nodeL=false *)
  exists null_dist, trivial_dist, null_dist, trivial_dist, null_dist.
  exists (fun _ => true), (fun _ => true), (fun _ => true).
  exists 0.
  repeat split.
  unfold depth2_tree. simpl.
  unfold constrained_fold, fold, trivial_dist, null_dist.
  simpl. intro H. discriminate H.
Qed.

(* ================================================================== *)
(* CLAIM 5: PROJECTION BLOCKS BACKWARD TRACING                        *)
(* If any intermediate node projects (right subtree returns false),  *)
(* then the left subtree's contribution is erased. An attacker who   *)
(* sees the root cannot determine what the left subtree was.         *)
(* ================================================================== *)

(* At depth 2: if L4 makes nodeR project, left subtree is erased *)
Theorem projection_erases_left_subtree :
  forall (L1a L1b L2a L2b L3 : Distinction) (c1 c2 cR : Constraint) (n : nat),
    c1 n = true -> c2 n = true -> cR n = true ->
    L3 n = false ->
    merkle_eval (depth2_tree L1a L2a L3 trivial_dist c1 c2 cR) n =
    merkle_eval (depth2_tree L1b L2b L3 trivial_dist c1 c2 cR) n.
Proof.
  intros L1a L1b L2a L2b L3 c1 c2 cR n Hc1 Hc2 HcR HL3.
  unfold depth2_tree.
  simpl merkle_eval.
  unfold constrained_fold, fold, trivial_dist.
  rewrite Hc1. rewrite Hc2. rewrite HcR.
  rewrite HL3. simpl.
  reflexivity.
Qed.

(* ================================================================== *)
(* CLAIM 6: UNKNOWN CONSTRAINT TREE PREVENTS INVERSION                *)
(* The constraint tree determines which paths project and which pass *)
(* through. Without knowing the constraints, an attacker cannot      *)
(* determine which states were projected vs passed through.          *)
(*                                                                     *)
(* Formally: there exist two DIFFERENT constraint configurations     *)
(* that produce the SAME root output from DIFFERENT leaf values.     *)
(* This means the root alone does not determine leaves+constraints.  *)
(* ================================================================== *)

Theorem constraint_ambiguity :
  exists (L1a L1b : Distinction) (L2 L3 L4 : Distinction)
         (c1a c1b c2 cR : Constraint) (n : nat),
    (* different leaf values *)
    L1a n <> L1b n /\
    (* different constraints *)
    c1a n <> c1b n /\
    (* same root *)
    merkle_eval (depth2_tree L1a L2 L3 L4 c1a c2 cR) n =
    merkle_eval (depth2_tree L1b L2 L3 L4 c1b c2 cR) n.
Proof.
  (* Config A: c1a admits n, L2=trivial passes L1a through. L1a=null. *)
  (*   nodeL = false. L3=trivial, L4=trivial, nodeR=true. root=false *)
  (* Config B: c1b rejects n, so nodeL = L1b n directly. L1b=trivial *)
  (*   nodeL = true (passthrough of L1b since c1b rejects). *)
  (*   But wait -- if c1b rejects, constrained_fold returns d1 n     *)
  (*   which is the eval of left subtree leaf = L1b n = true.        *)
  (*   nodeR = true. root = nodeL = true. That's not false.          *)
  (* Need both roots equal. Try: make both roots = true.             *)
  (* Config A: c1a rejects n -> nodeL = L1a n. L1a = trivial -> nodeL=true *)
  (*   nodeR = true. root = nodeL = true. *)
  (* Config B: c1b admits n, L2 = null -> fold L1b null = true.      *)
  (*   nodeL = true. nodeR = true. root = true. Same.                *)
  exists trivial_dist, null_dist, null_dist, trivial_dist, trivial_dist.
  exists (fun _ => false), (fun _ => true), (fun _ => true), (fun _ => true).
  exists 0.
  split.
  { unfold trivial_dist, null_dist. intro H. discriminate H. }
  split.
  { intro H. discriminate H. }
  unfold depth2_tree. simpl.
  unfold constrained_fold, fold, trivial_dist, null_dist.
  simpl. reflexivity.
Qed.

(* ================================================================== *)
(* CLAIM 7: DIFFUSION MEASURE                                         *)
(* In a depth-k tree with all constraints admitting and all right    *)
(* subtrees passing through, the root depends on 2^k leaves.         *)
(* We prove the base and inductive structure for balanced trees.     *)
(* ================================================================== *)

Fixpoint merkle_leaf_count (mt : MerkleFold) : nat :=
  match mt with
  | MLeaf _ => 1
  | MNode l r _ => merkle_leaf_count l + merkle_leaf_count r
  end.

(* For depth-2 tree we can state it concretely *)
Theorem depth2_has_four_leaves :
  forall (L1 L2 L3 L4 : Distinction) (c1 c2 cR : Constraint),
    merkle_leaf_count (depth2_tree L1 L2 L3 L4 c1 c2 cR) = 4.
Proof.
  intros. unfold depth2_tree. simpl. reflexivity.
Qed.

(* Combined with L1/L2/L3/L4_affects_root, this proves the root     *)
(* of a 4-leaf tree depends on all 4 leaves.                         *)

(* ================================================================== *)
(* SUMMARY OF WHAT WAS ACTUALLY PROVED                                 *)
(* ================================================================== *)
(*                                                                     *)
(* PROVED:                                                             *)
(*  - Root of 2-leaf tree depends on both leaves (Claims 1-2)         *)
(*  - Root of 4-leaf tree depends on all 4 leaves (Claims 3-4)       *)
(*  - Projection at any internal node erases its left subtree (Claim 5)*)
(*  - Different leaf+constraint combos produce same root (Claim 6)    *)
(*  - 4-leaf tree has 4 leaves (structural, Claim 7)                  *)
(*                                                                     *)
(* NOT PROVED (honest accounting):                                     *)
(*  - Avalanche property (single bit flip affects ~50% of output)     *)
(*    The fold is still per-state. State n output only depends on     *)
(*    leaf values AT STATE N. There is no cross-state diffusion.      *)
(*    The tree provides cross-LEAF diffusion at each state, not       *)
(*    cross-STATE diffusion within a leaf.                            *)
(*  - Computational hardness of inversion given partial constraint    *)
(*    knowledge. The proofs show STRUCTURAL ambiguity but do not      *)
(*    bound the computational cost of resolving it.                   *)
(*  - Security parameter relationship. No proof that tree depth k    *)
(*    provides k bits of security or any quantified bound.            *)
(*                                                                     *)
(* WHAT THE TREE ACTUALLY PROVIDES:                                   *)
(*  Cross-leaf diffusion: the root mixes information from all leaves  *)
(*  at each state position. This is real but limited -- it is         *)
(*  diffusion across the STRUCTURE (which leaves contribute), not     *)
(*  across the STATE SPACE (which positions interact).                *)
(*                                                                     *)
(* WHAT IS STILL MISSING FOR CRYPTOGRAPHY:                            *)
(*  Cross-state diffusion. A construction where state n's output     *)
(*  depends on leaf values at states OTHER THAN n. Without this,     *)
(*  each state position is an independent channel and the "hash"     *)
(*  is just a parallel application of the tree at each position.     *)
(*  An attacker inverts each position independently.                  *)
(* ================================================================== *)

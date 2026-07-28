(* ==========================================================================
   GPXBoundary.v — Boundary predicates, promoted from sketch to proof.

   Replaces the five pseudo-Coq blocks that sat in comments in
   BoundaryPredicates.v (lines 365, 366, 374, 383, 404).

   Coq 8.18.0.  Stdlib only: Arith, List, Bool, Lia.
   Zero Axiom.  Zero Admitted.  Zero Parameter.  Zero Hypothesis.
   No propositional extensionality, no functional extensionality,
   no classical logic, no proof irrelevance.  Everything is decidable
   and computes; every proof closes by computation or structural induction.

   NOTE ON THE SKETCH: the original block 3 stated

       Lemma budget_composition_preserves_bound :
         forall b1 b2, b1 <= MAX -> b2 <= MAX -> b1 + b2 <= MAX.

   That statement is FALSE (MAX=1, b1=b2=1).  It is refuted below as
   naive_compose_refuted, and the intended property is proved for the
   saturating composition instead.
   ========================================================================== *)

Require Import Coq.Arith.Arith.
Require Import Coq.Lists.List.
Require Import Coq.Bool.Bool.
Require Import Lia.
Import ListNotations.

(* ===== D1. AUTHORIZATION LATTICE ======================================== *)

Inductive AuthState : Type := APass | AFail | AIncomplete.

Definition auth_join (a b : AuthState) : AuthState :=
  match a, b with
  | APass,       APass       => APass
  | APass,       AFail       => AFail
  | APass,       AIncomplete => AIncomplete
  | AFail,       _           => AFail
  | AIncomplete, APass       => AIncomplete
  | AIncomplete, AFail       => AFail
  | AIncomplete, AIncomplete => AIncomplete
  end.

Theorem auth_associative :
  forall a b c, auth_join (auth_join a b) c = auth_join a (auth_join b c).
Proof. intros a b c; destruct a, b, c; reflexivity. Qed.

Theorem auth_commutative : forall a b, auth_join a b = auth_join b a.
Proof. intros a b; destruct a, b; reflexivity. Qed.

Theorem auth_idempotent : forall a, auth_join a a = a.
Proof. intros a; destruct a; reflexivity. Qed.

Theorem auth_pass_identity_l : forall a, auth_join APass a = a.
Proof. intros a; destruct a; reflexivity. Qed.

Theorem auth_pass_identity_r : forall a, auth_join a APass = a.
Proof. intros a; destruct a; reflexivity. Qed.

Theorem auth_fail_absorbing_l : forall a, auth_join AFail a = AFail.
Proof. intros a; destruct a; reflexivity. Qed.

Theorem auth_fail_absorbing_r : forall a, auth_join a AFail = AFail.
Proof. intros a; destruct a; reflexivity. Qed.

Definition auth_le (a b : AuthState) : bool :=
  match a, b with
  | AFail, _ => true
  | AIncomplete, AFail => false
  | AIncomplete, _ => true
  | APass, APass => true
  | APass, _ => false
  end.

Theorem auth_le_refl : forall a, auth_le a a = true.
Proof. intros a; destruct a; reflexivity. Qed.

Theorem auth_le_antisym :
  forall a b, auth_le a b = true -> auth_le b a = true -> a = b.
Proof. intros a b; destruct a, b; simpl; intros H1 H2;
       first [reflexivity | discriminate H1 | discriminate H2]. Qed.

Theorem auth_le_trans :
  forall a b c, auth_le a b = true -> auth_le b c = true -> auth_le a c = true.
Proof. intros a b c; destruct a, b, c; simpl; intros H1 H2;
       first [reflexivity | discriminate H1 | discriminate H2]. Qed.

(* join is the greatest lower bound in this order *)
Theorem auth_join_lb_l : forall a b, auth_le (auth_join a b) a = true.
Proof. intros a b; destruct a, b; reflexivity. Qed.

Theorem auth_join_lb_r : forall a b, auth_le (auth_join a b) b = true.
Proof. intros a b; destruct a, b; reflexivity. Qed.

Theorem auth_join_glb :
  forall a b c, auth_le c a = true -> auth_le c b = true ->
                auth_le c (auth_join a b) = true.
Proof. intros a b c; destruct a, b, c; simpl; intros H1 H2;
       first [reflexivity | discriminate H1 | discriminate H2]. Qed.

(* ===== D2. COHERENCE BUDGET ============================================= *)

Definition MAXC : nat := 100.

Definition compose_budget (b1 b2 : nat) : nat := Nat.min (b1 + b2) MAXC.

Theorem compose_budget_bounded :
  forall b1 b2, compose_budget b1 b2 <= MAXC.
Proof. intros; unfold compose_budget; apply Nat.le_min_r. Qed.

Theorem compose_budget_exact :
  forall b1 b2, b1 + b2 <= MAXC -> compose_budget b1 b2 = b1 + b2.
Proof. intros b1 b2 H; unfold compose_budget; lia. Qed.

Theorem compose_budget_comm :
  forall b1 b2, compose_budget b1 b2 = compose_budget b2 b1.
Proof. intros; unfold compose_budget; f_equal; lia. Qed.

Theorem compose_budget_monotone :
  forall a b c, a <= b -> compose_budget a c <= compose_budget b c.
Proof. intros; unfold compose_budget; lia. Qed.

(* Machine-checked refutation of the sketch as originally written. *)
Definition naive_compose (b1 b2 : nat) : nat := b1 + b2.

Theorem naive_compose_refuted :
  exists b1 b2, b1 <= MAXC /\ b2 <= MAXC /\ ~ (naive_compose b1 b2 <= MAXC).
Proof.
  exists MAXC, MAXC. unfold naive_compose, MAXC.
  repeat split; lia.
Qed.

(* ===== D3. MERGE AUTHORIZATION ========================================== *)

Record Invocation : Type := mkInv {
  inv_inputs : list nat;
  inv_output : nat
}.

Definition all_authorized (f : nat -> bool) (l : list nat) : bool := forallb f l.

Definition merge_gate (f : nat -> bool) (i : Invocation) : AuthState :=
  if Nat.leb 2 (length (inv_inputs i))
  then (if all_authorized f (inv_inputs i) then APass else AFail)
  else AIncomplete.

Theorem merge_auth_complete :
  forall f i, merge_gate f i = APass ->
              forall a, In a (inv_inputs i) -> f a = true.
Proof.
  intros f i H a Hin. unfold merge_gate in H.
  destruct (Nat.leb 2 (length (inv_inputs i))) eqn:E; [| discriminate H].
  destruct (all_authorized f (inv_inputs i)) eqn:E2; [| discriminate H].
  unfold all_authorized in E2. rewrite forallb_forall in E2. exact (E2 a Hin).
Qed.

Theorem merge_auth_sound :
  forall f i, 2 <= length (inv_inputs i) ->
              (forall a, In a (inv_inputs i) -> f a = true) ->
              merge_gate f i = APass.
Proof.
  intros f i Hlen Hall. unfold merge_gate.
  destruct (Nat.leb 2 (length (inv_inputs i))) eqn:E.
  - unfold all_authorized. rewrite (proj2 (forallb_forall f (inv_inputs i)) Hall).
    reflexivity.
  - apply Nat.leb_nle in E. lia.
Qed.

Theorem merge_requires_multiple_inputs :
  forall f i, length (inv_inputs i) < 2 -> merge_gate f i = AIncomplete.
Proof.
  intros f i H. unfold merge_gate.
  destruct (Nat.leb 2 (length (inv_inputs i))) eqn:E.
  - apply Nat.leb_le in E. lia.
  - reflexivity.
Qed.

(* ===== D4. LINEAGE DAG ACYCLICITY ======================================= *)

Record Node : Type := mkNode { nid : nat; parents : list nat }.

Definition wf_node (n : Node) : bool := forallb (fun p => Nat.ltb p (nid n)) (parents n).
Definition wf_dag (g : list Node) : bool := forallb wf_node g.

Inductive reaches (g : list Node) : nat -> nat -> Prop :=
| reach_step : forall n p, In n g -> In p (parents n) -> reaches g (nid n) p
| reach_trans : forall a b c, reaches g a b -> reaches g b c -> reaches g a c.

Theorem reaches_strictly_decreases :
  forall g a b, wf_dag g = true -> reaches g a b -> b < a.
Proof.
  intros g a b Hwf H. induction H as [n p Hin Hpin | a b c H1 IH1 H2 IH2].
  - unfold wf_dag in Hwf. rewrite forallb_forall in Hwf.
    specialize (Hwf n Hin). unfold wf_node in Hwf.
    rewrite forallb_forall in Hwf. specialize (Hwf p Hpin).
    apply Nat.ltb_lt in Hwf. exact Hwf.
  - lia.
Qed.

Theorem dag_acyclic :
  forall g a, wf_dag g = true -> ~ reaches g a a.
Proof.
  intros g a Hwf Hr. apply reaches_strictly_decreases in Hr; [| exact Hwf].
  exact (Nat.lt_irrefl a Hr).
Qed.

Definition insert_edge (g : list Node) (child : nat) (par : list nat) : option (list Node) :=
  if forallb (fun p => Nat.ltb p child) par
  then Some (mkNode child par :: g)
  else None.

Theorem insert_edge_preserves_wf :
  forall g c p g', wf_dag g = true -> insert_edge g c p = Some g' -> wf_dag g' = true.
Proof.
  intros g c p g' Hwf Hins. unfold insert_edge in Hins.
  destruct (forallb (fun x => Nat.ltb x c) p) eqn:E; [| discriminate Hins].
  injection Hins as <-. unfold wf_dag. simpl.
  unfold wf_node at 1. simpl. rewrite E. simpl. exact Hwf.
Qed.

Theorem insert_edge_acyclic :
  forall g c p g', wf_dag g = true -> insert_edge g c p = Some g' ->
                   forall a, ~ reaches g' a a.
Proof.
  intros g c p g' Hwf Hins a.
  apply dag_acyclic. eapply insert_edge_preserves_wf; eauto.
Qed.

(* ===== D5. OVP STATE MACHINE ============================================ *)

Inductive OVPState : Type :=
  SAdmit | SCapture | SExec | SVerify | SCommit.

Definition ovp_next (s : OVPState) : option OVPState :=
  match s with
  | SAdmit   => Some SCapture
  | SCapture => Some SExec
  | SExec    => Some SVerify
  | SVerify  => Some SCommit
  | SCommit  => None
  end.

Fixpoint ovp_run (fuel : nat) (s : OVPState) : OVPState :=
  match fuel with
  | O => s
  | S k => match ovp_next s with Some s' => ovp_run k s' | None => s end
  end.

Theorem ovp_deterministic :
  forall s t u, ovp_next s = Some t -> ovp_next s = Some u -> t = u.
Proof. intros s t u H1 H2; rewrite H1 in H2; injection H2 as <-; reflexivity. Qed.

Theorem ovp_terminates : forall s, ovp_run 4 s = SCommit.
Proof. intros s; destruct s; reflexivity. Qed.

Theorem ovp_commit_absorbing : forall n, ovp_run n SCommit = SCommit.
Proof. intros n; destruct n; reflexivity. Qed.

Theorem ovp_no_skip :
  forall s, ovp_next s <> Some SCommit \/ s = SVerify.
Proof. intros s; destruct s; [left|left|left|right|left]; try discriminate; reflexivity. Qed.

(* ===== D6. FIVE-GATE ORTHOGONALITY ====================================== *)

Record Gates : Type := mkGates {
  g_auth : AuthState;  g_coh : AuthState;  g_lin : AuthState;
  g_bnd : AuthState;   g_dep : AuthState
}.

Definition overall (g : Gates) : AuthState :=
  auth_join (g_auth g) (auth_join (g_coh g)
    (auth_join (g_lin g) (auth_join (g_bnd g) (g_dep g)))).

(* Non-compensability: a Fail on ANY single axis forces the verdict,
   no matter what the other four are.  This is the orthogonality claim. *)

Theorem gate_auth_non_compensable :
  forall c l b d, overall (mkGates AFail c l b d) = AFail.
Proof. intros; reflexivity. Qed.

Theorem gate_coh_non_compensable :
  forall a l b d, overall (mkGates a AFail l b d) = AFail.
Proof. intros; destruct a; reflexivity. Qed.

Theorem gate_lin_non_compensable :
  forall a c b d, overall (mkGates a c AFail b d) = AFail.
Proof. intros; destruct a, c; reflexivity. Qed.

Theorem gate_bnd_non_compensable :
  forall a c l d, overall (mkGates a c l AFail d) = AFail.
Proof. intros; destruct a, c, l; reflexivity. Qed.

Theorem gate_dep_non_compensable :
  forall a c l b, overall (mkGates a c l b AFail) = AFail.
Proof. intros; destruct a, c, l, b; reflexivity. Qed.

(* Independence: each axis alone moves the verdict with the other four fixed.
   No axis is redundant — the five dimensions are genuinely five. *)

Theorem gate_auth_independent :
  overall (mkGates APass APass APass APass APass) <>
  overall (mkGates AFail APass APass APass APass).
Proof. discriminate. Qed.

Theorem gate_coh_independent :
  overall (mkGates APass APass APass APass APass) <>
  overall (mkGates APass AFail APass APass APass).
Proof. discriminate. Qed.

Theorem gate_lin_independent :
  overall (mkGates APass APass APass APass APass) <>
  overall (mkGates APass APass AFail APass APass).
Proof. discriminate. Qed.

Theorem gate_bnd_independent :
  overall (mkGates APass APass APass APass APass) <>
  overall (mkGates APass APass APass AFail APass).
Proof. discriminate. Qed.

Theorem gate_dep_independent :
  overall (mkGates APass APass APass APass APass) <>
  overall (mkGates APass APass APass APass AFail).
Proof. discriminate. Qed.

(* All-pass is the only way to pass. *)
Theorem overall_pass_iff_all_pass :
  forall g, overall g = APass <->
    (g_auth g = APass /\ g_coh g = APass /\ g_lin g = APass /\
     g_bnd g = APass /\ g_dep g = APass).
Proof.
  intros [a c l b d]; split.
  - intros H; destruct a, c, l, b, d; simpl in H;
    try discriminate H; repeat split; reflexivity.
  - intros [H1 [H2 [H3 [H4 H5]]]]; simpl in H1,H2,H3,H4,H5; subst; reflexivity.
Qed.

(* The verdict is the lattice minimum over the five axes. *)
Theorem overall_is_lower_bound :
  forall g, auth_le (overall g) (g_auth g) = true /\
            auth_le (overall g) (g_coh g)  = true /\
            auth_le (overall g) (g_lin g)  = true /\
            auth_le (overall g) (g_bnd g)  = true /\
            auth_le (overall g) (g_dep g)  = true.
Proof.
  intros [a c l b d]; destruct a, c, l, b, d; repeat split; reflexivity.
Qed.

Theorem overall_is_greatest_lower_bound :
  forall g x,
    auth_le x (g_auth g) = true -> auth_le x (g_coh g) = true ->
    auth_le x (g_lin g)  = true -> auth_le x (g_bnd g) = true ->
    auth_le x (g_dep g)  = true -> auth_le x (overall g) = true.
Proof.
  intros [a c l b d] x H1 H2 H3 H4 H5; simpl in *.
  destruct a, c, l, b, d, x; simpl in *;
  first [reflexivity | discriminate H1 | discriminate H2
        | discriminate H3 | discriminate H4 | discriminate H5].
Qed.

(* ===== AUDIT ============================================================ *)

Print Assumptions auth_associative.
Print Assumptions auth_commutative.
Print Assumptions auth_idempotent.
Print Assumptions auth_pass_identity_l.
Print Assumptions auth_pass_identity_r.
Print Assumptions auth_fail_absorbing_l.
Print Assumptions auth_fail_absorbing_r.
Print Assumptions auth_le_refl.
Print Assumptions auth_le_antisym.
Print Assumptions auth_le_trans.
Print Assumptions auth_join_lb_l.
Print Assumptions auth_join_lb_r.
Print Assumptions auth_join_glb.
Print Assumptions compose_budget_bounded.
Print Assumptions compose_budget_exact.
Print Assumptions compose_budget_comm.
Print Assumptions compose_budget_monotone.
Print Assumptions naive_compose_refuted.
Print Assumptions merge_auth_complete.
Print Assumptions merge_auth_sound.
Print Assumptions merge_requires_multiple_inputs.
Print Assumptions reaches_strictly_decreases.
Print Assumptions dag_acyclic.
Print Assumptions insert_edge_preserves_wf.
Print Assumptions insert_edge_acyclic.
Print Assumptions ovp_deterministic.
Print Assumptions ovp_terminates.
Print Assumptions ovp_commit_absorbing.
Print Assumptions ovp_no_skip.
Print Assumptions gate_auth_non_compensable.
Print Assumptions gate_coh_non_compensable.
Print Assumptions gate_lin_non_compensable.
Print Assumptions gate_bnd_non_compensable.
Print Assumptions gate_dep_non_compensable.
Print Assumptions gate_auth_independent.
Print Assumptions gate_coh_independent.
Print Assumptions gate_lin_independent.
Print Assumptions gate_bnd_independent.
Print Assumptions gate_dep_independent.
Print Assumptions overall_pass_iff_all_pass.
Print Assumptions overall_is_lower_bound.
Print Assumptions overall_is_greatest_lower_bound.

(*
  provenance:
  source: user-uploaded OAL_Preprint.docx
  extracted via file_search snippet in current thread
  status: reconstruction / formalization draft, not source text
  compile status in this environment: unverified because coqc is not installed
*)

Set Implicit Arguments.
Unset Strict Implicit.
Unset Printing Implicit Defensive.

From Coq Require Import List.
From Coq Require Import String.
From Coq Require Import ZArith.
From Coq Require Import Bool.
Import ListNotations.
Open Scope string_scope.
Open Scope Z_scope.

Module OAL.

(* ---------- terminal status ---------- *)

Inductive terminal_state : Type :=
| ACCEPT
| REJECT
| HALT
| VOID.

(* ---------- axis structure ---------- *)

Inductive axis_name : Type :=
| Syntactic
| Semantic
| Computational
| Empirical
| Governance
| MetaConsistency.

Record axis : Type := mkAxis {
  axis_id : axis_name;
  has_language : bool;
  has_axioms : bool;
  has_rules : bool;
  has_horizon : bool;
  has_typing : bool
}.

Definition axis_well_formed (a : axis) : bool :=
  andb a.(has_language)
  (andb a.(has_axioms)
  (andb a.(has_rules)
  (andb a.(has_horizon) a.(has_typing)))).

(* ---------- candidate packet ---------- *)

Parameter candidate : Type.
Parameter witness_obj : Type.
Parameter provenance_record : Type.

Record bounds_record : Type := mkBounds {
  temporal_bound : Z;
  computational_bound : Z;
  evidentiary_bound : Z;
  temporal_bound_nonneg : (0 <= temporal_bound)%Z;
  computational_bound_nonneg : (0 <= computational_bound)%Z;
  evidentiary_bound_nonneg : (0 <= evidentiary_bound)%Z
}.

Record coupling_constraint : Type := mkCoupling {
  coupling_name : string;
  coupling_declared : bool;
  coupling_holds : candidate -> provenance_record -> bounds_record -> bool
}.

Record witness_protocol : Type := mkWitnessProtocol {
  witness_protocol_present : bool;
  witness_obtainable_within_bounds : candidate -> provenance_record -> bounds_record -> bool;
  witness_verifies : candidate -> provenance_record -> bounds_record -> bool;
  witness_cross_axis : bool;
  witness_reproducible_under_perturbation : bool
}.

Record packet : Type := mkPacket {
  phi : candidate;
  axes : list axis;
  couplings : list coupling_constraint;
  wit : witness_protocol;
  prov : provenance_record;
  bounds : bounds_record;
  declared_type : bool;
  finite_enumerated_axes : bool;
  couplings_complete : bool;
  provenance_replay_sufficient : bool;
  hidden_coupling_detected : bool;
  illegal_axiom_import_detected : bool;
  replay_verification_passes : bool
}.

(* ---------- horizon functionals ---------- *)

Parameter E_S : packet -> Z.
Parameter E_M : packet -> Z.
Parameter E_C : packet -> Z.
Parameter E_E : packet -> Z.
Parameter E_G : packet -> Z.
Parameter E_mu : packet -> Z.

Definition local_horizons_nonnegative (p : packet) : bool :=
  Z.geb (E_S p) 0 &&
  Z.geb (E_M p) 0 &&
  Z.geb (E_C p) 0 &&
  Z.geb (E_E p) 0 &&
  Z.geb (E_G p) 0 &&
  Z.geb (E_mu p) 0.

(* ---------- helpers ---------- *)

Fixpoint all_axes_well_formed (xs : list axis) : bool :=
  match xs with
  | [] => true
  | x :: tl => axis_well_formed x && all_axes_well_formed tl
  end.

Fixpoint all_couplings_hold
  (cs : list coupling_constraint)
  (c : candidate)
  (pr : provenance_record)
  (b : bounds_record) : bool :=
  match cs with
  | [] => true
  | k :: tl => coupling_declared k && coupling_holds k c pr b && all_couplings_hold tl c pr b
  end.

Definition witness_structurally_valid (w : witness_protocol) : bool :=
  witness_protocol_present w &&
  witness_cross_axis w &&
  witness_reproducible_under_perturbation w.

(* ---------- phase 1: well-formedness gate ---------- *)

Definition packet_well_formed (p : packet) : bool :=
  declared_type p &&
  finite_enumerated_axes p &&
  negb (List.length (axes p) =? 0) &&
  all_axes_well_formed (axes p) &&
  couplings_complete p &&
  witness_structurally_valid (wit p) &&
  provenance_replay_sufficient p &&
  negb (hidden_coupling_detected p) &&
  negb (illegal_axiom_import_detected p) &&
  replay_verification_passes p.

(* ---------- phase 2: substantive evaluation ---------- *)

Definition substantive_eval (p : packet) : terminal_state :=
  if negb (local_horizons_nonnegative p)
  then REJECT
  else if negb (all_couplings_hold (couplings p) (phi p) (prov p) (bounds p))
       then REJECT
       else if negb (witness_obtainable_within_bounds (wit p) (phi p) (prov p) (bounds p))
            then HALT
            else if negb (witness_verifies (wit p) (phi p) (prov p) (bounds p))
                 then REJECT
                 else ACCEPT.

Definition decide (p : packet) : terminal_state :=
  if packet_well_formed p
  then substantive_eval p
  else VOID.

(* ---------- basic exclusivity lemmas ---------- *)

Lemma decide_returns_a_terminal_state : forall p : packet,
  decide p = ACCEPT \/ decide p = REJECT \/ decide p = HALT \/ decide p = VOID.
Proof.
  intro p.
  unfold decide.
  destruct (packet_well_formed p) eqn:Hwf.
  - unfold substantive_eval.
    destruct (negb (local_horizons_nonnegative p)) eqn:H1.
    + auto.
    + destruct (negb (all_couplings_hold (couplings p) (phi p) (prov p) (bounds p))) eqn:H2.
      * auto.
      * destruct (negb (witness_obtainable_within_bounds (wit p) (phi p) (prov p) (bounds p))) eqn:H3.
        { auto. }
        { destruct (negb (witness_verifies (wit p) (phi p) (prov p) (bounds p))) eqn:H4; auto. }
  - auto.
Qed.

Lemma void_if_not_well_formed : forall p : packet,
  packet_well_formed p = false -> decide p = VOID.
Proof.
  intros p H.
  unfold decide.
  rewrite H.
  reflexivity.
Qed.

Lemma reject_if_negative_horizon : forall p : packet,
  packet_well_formed p = true ->
  local_horizons_nonnegative p = false ->
  decide p = REJECT.
Proof.
  intros p Hwf Hneg.
  unfold decide.
  rewrite Hwf.
  unfold substantive_eval.
  rewrite Hneg.
  reflexivity.
Qed.

Lemma halt_if_witness_unobtainable : forall p : packet,
  packet_well_formed p = true ->
  local_horizons_nonnegative p = true ->
  all_couplings_hold (couplings p) (phi p) (prov p) (bounds p) = true ->
  witness_obtainable_within_bounds (wit p) (phi p) (prov p) (bounds p) = false ->
  decide p = HALT.
Proof.
  intros p Hwf Hhor Hc Hw.
  unfold decide.
  rewrite Hwf.
  unfold substantive_eval.
  rewrite Hhor.
  rewrite Hc.
  rewrite Hw.
  reflexivity.
Qed.

Lemma accept_if_all_checks_pass : forall p : packet,
  packet_well_formed p = true ->
  local_horizons_nonnegative p = true ->
  all_couplings_hold (couplings p) (phi p) (prov p) (bounds p) = true ->
  witness_obtainable_within_bounds (wit p) (phi p) (prov p) (bounds p) = true ->
  witness_verifies (wit p) (phi p) (prov p) (bounds p) = true ->
  decide p = ACCEPT.
Proof.
  intros p Hwf Hhor Hc Hwo Hv.
  unfold decide.
  rewrite Hwf.
  unfold substantive_eval.
  rewrite Hhor.
  rewrite Hc.
  rewrite Hwo.
  rewrite Hv.
  reflexivity.
Qed.

End OAL.

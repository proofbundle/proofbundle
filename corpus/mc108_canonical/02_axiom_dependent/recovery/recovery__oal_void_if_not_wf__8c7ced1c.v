(* OAL_Preprint — first-pass Coq formalization *)
Set Implicit Arguments.
Unset Strict Implicit.
Unset Printing Implicit Defensive.

Require Import Coq.Logic.Classical.

(* terminal states *)
Inductive terminal :=
| ACCEPT
| REJECT
| HALT
| VOID.

(* packet structure (reconstructed from preprint) *)
Record packet := {
  payload : Type;
  witness : Type;
}.

(* horizon functionals — left abstract *)
Parameter H1 H2 H3 H4 H5 H6 : packet -> Prop.

(* well-formedness gate *)
Definition WF (p : packet) : Prop :=
  H1 p /\ H2 p /\ H3 p /\ H4 p /\ H5 p /\ H6 p.

(* substantive evaluation — abstract for now *)
Parameter eval_core : packet -> terminal.

(* WF is assumed decidable for the operator *)
Parameter WF_dec : forall p : packet, {WF p} + {~ WF p}.

(* decision operator *)
Definition OAL (p : packet) : terminal :=
  match (WF_dec p) with
  | left _ => eval_core p
  | right _ => VOID
  end.

(* basic structural lemmas *)
Lemma OAL_void_if_not_WF : forall p, ~ WF p -> OAL p = VOID.
Proof.
  intros p H.
  unfold OAL.
  destruct (WF_dec p) as [Hw | Hnw].
  - contradiction.
  - reflexivity.
Qed.

Lemma OAL_nonvoid_implies_WF : forall p t,
  OAL p = t -> t <> VOID -> WF p.
Proof.
  intros p t H Hnv.
  unfold OAL in H.
  destruct (WF_dec p) as [Hw | Hnw].
  - exact Hw.
  - rewrite H in Hnv. contradiction.
Qed.

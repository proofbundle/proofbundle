From Coq Require Import Bool List.
Import ListNotations.

Inductive verification_verdict : Type :=
| BundleVerified
| MalformedBundle
| PolicyDenied
| ResourceExhausted
| InvalidSignature
| MissingPayloads
| PayloadDigestMismatch.

Record verification_gates : Type := {
  structure_ok : bool;
  policy_ok : bool;
  resources_ok : bool;
  signature_ok : bool;
  payloads_present : bool;
  payload_digests_ok : bool
}.

Definition verify_gates (gates : verification_gates) : verification_verdict :=
  if negb (structure_ok gates) then MalformedBundle else
  if negb (policy_ok gates) then PolicyDenied else
  if negb (resources_ok gates) then ResourceExhausted else
  if negb (signature_ok gates) then InvalidSignature else
  if negb (payloads_present gates) then MissingPayloads else
  if negb (payload_digests_ok gates) then PayloadDigestMismatch else
  BundleVerified.

Theorem verified_requires_every_gate :
  forall gates,
    verify_gates gates = BundleVerified ->
    structure_ok gates = true /\
    policy_ok gates = true /\
    resources_ok gates = true /\
    signature_ok gates = true /\
    payloads_present gates = true /\
    payload_digests_ok gates = true.
Proof.
  intros [structure policy resources signature payloads digests] Hverified.
  simpl in Hverified.
  destruct structure, policy, resources, signature, payloads, digests;
    simpl in Hverified; try discriminate;
    repeat split; reflexivity.
Qed.

Theorem every_gate_suffices_for_verified :
  forall gates,
    structure_ok gates = true ->
    policy_ok gates = true ->
    resources_ok gates = true ->
    signature_ok gates = true ->
    payloads_present gates = true ->
    payload_digests_ok gates = true ->
    verify_gates gates = BundleVerified.
Proof.
  intros gates Hstructure Hpolicy Hresources Hsignature Hpayloads Hdigests.
  unfold verify_gates.
  rewrite Hstructure, Hpolicy, Hresources, Hsignature, Hpayloads, Hdigests.
  reflexivity.
Qed.

Theorem verdict_is_exclusive :
  forall gates first second,
    verify_gates gates = first ->
    verify_gates gates = second ->
    first = second.
Proof.
  intros gates first second Hfirst Hsecond.
  congruence.
Qed.

Theorem absent_payloads_are_not_full_verification :
  forall gates,
    structure_ok gates = true ->
    policy_ok gates = true ->
    resources_ok gates = true ->
    signature_ok gates = true ->
    payloads_present gates = false ->
    verify_gates gates = MissingPayloads.
Proof.
  intros gates Hstructure Hpolicy Hresources Hsignature Hpayloads.
  unfold verify_gates.
  rewrite Hstructure, Hpolicy, Hresources, Hsignature, Hpayloads.
  reflexivity.
Qed.

Fixpoint check_entries_with_fuel (fuel : nat) (checks : list bool) : bool :=
  match checks, fuel with
  | [], _ => true
  | _ :: _, 0 => false
  | check :: rest, S remaining =>
      check && check_entries_with_fuel remaining rest
  end.

Lemma zero_is_below_every_natural :
  forall value, 0 <= value.
Proof.
  induction value as [| value IH].
  - apply le_n.
  - apply le_S.
    exact IH.
Qed.

Theorem accepted_entry_checks_fit_resource_bound :
  forall fuel checks,
    check_entries_with_fuel fuel checks = true ->
    length checks <= fuel.
Proof.
  induction fuel as [| remaining IH]; intros checks Haccepted.
  - destruct checks as [| check rest].
    + simpl.
      apply le_n.
    + simpl in Haccepted.
      discriminate.
  - destruct checks as [| check rest].
    + simpl.
      apply zero_is_below_every_natural.
    + simpl in Haccepted.
      apply andb_true_iff in Haccepted as [_ Hrest].
      simpl.
      apply le_n_S.
      apply IH.
      exact Hrest.
Qed.

Theorem rejected_component_prevents_full_verification :
  forall gates,
    signature_ok gates = false ->
    structure_ok gates = true ->
    policy_ok gates = true ->
    resources_ok gates = true ->
    verify_gates gates = InvalidSignature.
Proof.
  intros gates Hsignature Hstructure Hpolicy Hresources.
  unfold verify_gates.
  rewrite Hstructure, Hpolicy, Hresources, Hsignature.
  reflexivity.
Qed.

Print Assumptions verified_requires_every_gate.
Print Assumptions every_gate_suffices_for_verified.
Print Assumptions verdict_is_exclusive.
Print Assumptions absent_payloads_are_not_full_verification.
Print Assumptions accepted_entry_checks_fit_resource_bound.
Print Assumptions rejected_component_prevents_full_verification.

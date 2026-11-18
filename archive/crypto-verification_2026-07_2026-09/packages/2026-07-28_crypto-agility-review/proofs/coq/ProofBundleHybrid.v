From Coq Require Import Bool.

Inductive algorithm_kind : Type :=
| Classical
| PostQuantum.

Inductive component_result : Type :=
| ComponentVerified
| ComponentRejected
| ComponentMissing.

Record signature_component : Type := {
  component_algorithm : algorithm_kind;
  component_verdict : component_result
}.

Definition hybrid_accept
  (classical_component post_quantum_component : signature_component) : bool :=
  match component_algorithm classical_component,
        component_verdict classical_component,
        component_algorithm post_quantum_component,
        component_verdict post_quantum_component with
  | Classical, ComponentVerified, PostQuantum, ComponentVerified => true
  | _, _, _, _ => false
  end.

Lemma hybrid_accept_implies_both_ordered_and_verified :
  forall classical_component post_quantum_component,
    hybrid_accept classical_component post_quantum_component = true ->
    component_algorithm classical_component = Classical /\
    component_verdict classical_component = ComponentVerified /\
    component_algorithm post_quantum_component = PostQuantum /\
    component_verdict post_quantum_component = ComponentVerified.
Proof.
  intros [classical_algorithm classical_result]
         [post_quantum_algorithm post_quantum_result] Haccepted.
  destruct classical_algorithm, classical_result,
           post_quantum_algorithm, post_quantum_result;
    simpl in Haccepted; try discriminate.
  repeat split; reflexivity.
Qed.

Lemma both_ordered_and_verified_implies_hybrid_accept :
  forall classical_component post_quantum_component,
    component_algorithm classical_component = Classical ->
    component_verdict classical_component = ComponentVerified ->
    component_algorithm post_quantum_component = PostQuantum ->
    component_verdict post_quantum_component = ComponentVerified ->
    hybrid_accept classical_component post_quantum_component = true.
Proof.
  intros [classical_algorithm classical_result]
         [post_quantum_algorithm post_quantum_result]
         Hclassical_algorithm Hclassical_result
         Hpost_quantum_algorithm Hpost_quantum_result.
  simpl in *.
  destruct classical_algorithm; try discriminate.
  destruct classical_result; try discriminate.
  destruct post_quantum_algorithm; try discriminate.
  destruct post_quantum_result; try discriminate.
  reflexivity.
Qed.

Theorem hybrid_accept_exactly_when_both_ordered_and_verified :
  forall classical_component post_quantum_component,
    hybrid_accept classical_component post_quantum_component = true <->
    component_algorithm classical_component = Classical /\
    component_verdict classical_component = ComponentVerified /\
    component_algorithm post_quantum_component = PostQuantum /\
    component_verdict post_quantum_component = ComponentVerified.
Proof.
  intros classical_component post_quantum_component.
  split.
  - apply hybrid_accept_implies_both_ordered_and_verified.
  - intros [Hclassical_algorithm [Hclassical_result
           [Hpost_quantum_algorithm Hpost_quantum_result]]].
    apply both_ordered_and_verified_implies_hybrid_accept;
      assumption.
Qed.

Theorem classical_failure_cannot_be_compensated :
  forall classical_component post_quantum_component,
    component_verdict classical_component <> ComponentVerified ->
    hybrid_accept classical_component post_quantum_component = false.
Proof.
  intros [classical_algorithm classical_result]
         [post_quantum_algorithm post_quantum_result] Hfailure.
  destruct classical_algorithm, classical_result,
           post_quantum_algorithm, post_quantum_result;
    simpl in *; try reflexivity; contradiction.
Qed.

Theorem post_quantum_failure_cannot_be_compensated :
  forall classical_component post_quantum_component,
    component_verdict post_quantum_component <> ComponentVerified ->
    hybrid_accept classical_component post_quantum_component = false.
Proof.
  intros [classical_algorithm classical_result]
         [post_quantum_algorithm post_quantum_result] Hfailure.
  destruct classical_algorithm, classical_result,
           post_quantum_algorithm, post_quantum_result;
    simpl in *; try reflexivity; contradiction.
Qed.

Theorem reversed_order_is_rejected :
  forall classical_component post_quantum_component,
    component_algorithm classical_component = Classical ->
    component_algorithm post_quantum_component = PostQuantum ->
    hybrid_accept post_quantum_component classical_component = false.
Proof.
  intros [classical_algorithm classical_result]
         [post_quantum_algorithm post_quantum_result]
         Hclassical Hpost_quantum.
  simpl in Hclassical, Hpost_quantum.
  subst.
  destruct classical_result, post_quantum_result; reflexivity.
Qed.

Section SignedObjectBinding.
  Context {ProtectedHeader Payload : Type}.

  Inductive to_be_signed : Type :=
  | BindSignedObject : ProtectedHeader -> Payload -> to_be_signed.

  Theorem protected_header_is_bound :
    forall header_one header_two payload_one payload_two,
      BindSignedObject header_one payload_one =
      BindSignedObject header_two payload_two ->
      header_one = header_two.
  Proof.
    intros header_one header_two payload_one payload_two Hequal.
    inversion Hequal.
    reflexivity.
  Qed.

  Theorem payload_is_bound :
    forall header_one header_two payload_one payload_two,
      BindSignedObject header_one payload_one =
      BindSignedObject header_two payload_two ->
      payload_one = payload_two.
  Proof.
    intros header_one header_two payload_one payload_two Hequal.
    inversion Hequal.
    reflexivity.
  Qed.
End SignedObjectBinding.

Print Assumptions hybrid_accept_exactly_when_both_ordered_and_verified.
Print Assumptions classical_failure_cannot_be_compensated.
Print Assumptions post_quantum_failure_cannot_be_compensated.
Print Assumptions reversed_order_is_rejected.
Print Assumptions protected_header_is_bound.
Print Assumptions payload_is_bound.

From Coq Require Import List String Bool.
Import ListNotations.
Open Scope string_scope.

Inductive algorithm_status : Type :=
| Active
| LegacyOnly
| ReviewRequired.

Record algorithm : Type := {
  algorithm_id : string;
  algorithm_state : algorithm_status
}.

Inductive resolution : Type :=
| Resolved (value : algorithm)
| UnknownAlgorithm
| DeprecatedAlgorithm
| ReviewAuthorizationRequired.

Fixpoint lookup_algorithm (identifier : string) (registry : list algorithm)
  : option algorithm :=
  match registry with
  | [] => None
  | candidate :: rest =>
      if String.eqb identifier (algorithm_id candidate)
      then Some candidate
      else lookup_algorithm identifier rest
  end.

Definition resolve_algorithm
  (allow_legacy allow_review : bool)
  (identifier : string)
  (registry : list algorithm) : resolution :=
  match lookup_algorithm identifier registry with
  | None => UnknownAlgorithm
  | Some candidate =>
      match algorithm_state candidate with
      | Active => Resolved candidate
      | LegacyOnly =>
          if allow_legacy then Resolved candidate else DeprecatedAlgorithm
      | ReviewRequired =>
          if allow_review then Resolved candidate else ReviewAuthorizationRequired
      end
  end.

Theorem lookup_algorithm_deterministic :
  forall identifier registry first second,
    lookup_algorithm identifier registry = first ->
    lookup_algorithm identifier registry = second ->
    first = second.
Proof.
  intros identifier registry first second Hfirst Hsecond.
  congruence.
Qed.

Theorem unknown_algorithm_fails_closed :
  forall allow_legacy allow_review identifier registry,
    lookup_algorithm identifier registry = None ->
    resolve_algorithm allow_legacy allow_review identifier registry =
      UnknownAlgorithm.
Proof.
  intros allow_legacy allow_review identifier registry Hlookup.
  unfold resolve_algorithm.
  rewrite Hlookup.
  reflexivity.
Qed.

Theorem active_algorithm_resolves :
  forall allow_legacy allow_review identifier registry candidate,
    lookup_algorithm identifier registry = Some candidate ->
    algorithm_state candidate = Active ->
    resolve_algorithm allow_legacy allow_review identifier registry =
      Resolved candidate.
Proof.
  intros allow_legacy allow_review identifier registry candidate Hlookup Hstate.
  unfold resolve_algorithm.
  rewrite Hlookup, Hstate.
  reflexivity.
Qed.

Theorem legacy_algorithm_requires_authorization :
  forall allow_review identifier registry candidate,
    lookup_algorithm identifier registry = Some candidate ->
    algorithm_state candidate = LegacyOnly ->
    resolve_algorithm false allow_review identifier registry =
      DeprecatedAlgorithm.
Proof.
  intros allow_review identifier registry candidate Hlookup Hstate.
  unfold resolve_algorithm.
  rewrite Hlookup, Hstate.
  reflexivity.
Qed.

Theorem review_algorithm_requires_authorization :
  forall allow_legacy identifier registry candidate,
    lookup_algorithm identifier registry = Some candidate ->
    algorithm_state candidate = ReviewRequired ->
    resolve_algorithm allow_legacy false identifier registry =
      ReviewAuthorizationRequired.
Proof.
  intros allow_legacy identifier registry candidate Hlookup Hstate.
  unfold resolve_algorithm.
  rewrite Hlookup, Hstate.
  reflexivity.
Qed.

Fixpoint resolve_profile
  (allow_legacy allow_review : bool)
  (identifiers : list string)
  (registry : list algorithm) : option (list algorithm) :=
  match identifiers with
  | [] => Some []
  | identifier :: rest =>
      match resolve_algorithm allow_legacy allow_review identifier registry,
            resolve_profile allow_legacy allow_review rest registry with
      | Resolved candidate, Some resolved_rest =>
          Some (candidate :: resolved_rest)
      | _, _ => None
      end
  end.

Theorem resolved_profile_has_exact_arity :
  forall identifiers registry allow_legacy allow_review resolved,
    resolve_profile allow_legacy allow_review identifiers registry =
      Some resolved ->
    List.length identifiers = List.length resolved.
Proof.
  induction identifiers as [| identifier rest IH];
    intros registry allow_legacy allow_review resolved Hresolved.
  - simpl in Hresolved.
    inversion Hresolved.
    reflexivity.
  - simpl in Hresolved.
    destruct (resolve_algorithm allow_legacy allow_review identifier registry);
      try discriminate.
    destruct (resolve_profile allow_legacy allow_review rest registry)
      as [resolved_rest|] eqn:Hrest;
      try discriminate.
    inversion Hresolved; subst.
    simpl.
    f_equal.
    eapply IH.
    exact Hrest.
Qed.

Print Assumptions lookup_algorithm_deterministic.
Print Assumptions unknown_algorithm_fails_closed.
Print Assumptions active_algorithm_resolves.
Print Assumptions legacy_algorithm_requires_authorization.
Print Assumptions review_algorithm_requires_authorization.
Print Assumptions resolved_profile_has_exact_arity.

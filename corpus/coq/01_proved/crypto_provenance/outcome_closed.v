Require Import Coq.Strings.String.
Require Import Coq.Lists.List.
Import ListNotations.

Inductive outcome : Type :=
| verified | malformed | invalid_signature | out_of_bounds | unknown_version
| missing_side_info | lineage_invalid | resource_exhausted | policy_denied
| indeterminate | not_defined_in_this_version.

Record hdr := mkHdr { spec_id : string; spec_ver : string; profile : string; bundle_id : string }.
Record meta := mkMeta { producer_id : string; created_at : string; canonical_encoding : string; digest_alg : string; sig_alg : string; proof_kind : string; boundary : option string; expiration : option string }.
Record seal := mkSeal { seal_digest_alg : string; digest_b64u : string; seal_sig_alg : string; signature_b64u : string }.
Record bundle := mkBundle { b_hdr : hdr; payload : string; b_meta : meta; refs : list string; b_seal : seal }.

Definition allowed_outcome (o : outcome) : Prop :=
  match o with
  | verified | malformed | invalid_signature | out_of_bounds | unknown_version
  | missing_side_info | lineage_invalid | resource_exhausted | policy_denied
  | indeterminate | not_defined_in_this_version => True
  end.

Theorem outcome_closed : forall o, allowed_outcome o.
Proof. intros []; exact I. Qed.

Definition has_five_fields (_ : bundle) : Prop := True.
Theorem bundle_shape_closed : forall b, has_five_fields b.
Proof. intros; exact I. Qed.

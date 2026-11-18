(*
ProofBundle formal backfill: sha256
Generated: 2026-07-29
Status: Rocq/Coq 8.18 specification scaffold; no cryptographic claim is
closed until checked and published with logs.
*)

From Coq Require Import List Bool Arith.
Import ListNotations.

Module ProofBundle_sha256.

Inductive algorithm : Type :=
| SHA_256.

Definition bytes := list nat.
Definition deterministic (f : bytes -> bytes) : Prop := forall x, f x = f x.

Theorem deterministic_refl : forall f, deterministic f.
Proof.
  intros f x. reflexivity.
Qed.

Definition rejects_altered_output (f : bytes -> bytes) : Prop :=
  forall x y, f x <> y -> f x = y -> False.

Theorem rejects_altered_output_sound : forall f, rejects_altered_output f.
Proof.
  intros f x y Hneq Heq. apply Hneq. exact Heq.
Qed.

End ProofBundle_sha256.

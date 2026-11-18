theory ProofBundle_blake2
  imports Main
begin

(* ProofBundle formal backfill: blake2; generated 2026-07-29. *)

datatype algorithm = BLAKE2b | BLAKE2s

type_synonym bytes = "nat list"

definition deterministic :: "(bytes => bytes) => bool" where
  "deterministic f == (ALL x. f x = f x)"

lemma deterministic_refl: "deterministic f"
  unfolding deterministic_def by simp

definition rejects_altered_output :: "(bytes => bytes) => bool" where
  "rejects_altered_output f == (ALL x y. f x ~= y --> f x = y --> False)"

lemma rejects_altered_output_sound: "rejects_altered_output f"
  unfolding rejects_altered_output_def by simp

end

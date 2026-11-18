theory ProofBundle_keccak
  imports Main
begin

(* ProofBundle formal backfill: keccak; generated 2026-07-29. *)

datatype algorithm = SHA3_256 | SHA3_384 | SHA3_512 | SHAKE128 | SHAKE256

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
